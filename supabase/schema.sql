-- ==========================================================================
-- Popott — schema de synchronisation
--
-- A executer une seule fois, dans Supabase : SQL Editor → New query → coller
-- ce fichier → Run. Le script est idempotent : le relancer ne casse rien.
--
-- Le modele suit exactement l'interface de `proto/src/storage.js` :
-- une table `documents` de paires cle/valeur, portee par foyer. Cote client,
-- rien d'autre ne change que l'implementation de `window.storage`.
-- ==========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables ---

-- Un foyer : l'unite de partage. Deux telephones et deux navigateurs qui
-- pointent le meme foyer voient les memes donnees.
create table if not exists public.foyers (
  id      uuid primary key default gen_random_uuid(),
  nom     text not null default 'Foyer',
  cree_le timestamptz not null default now()
);

-- Qui a le droit d'entrer dans quel foyer.
create table if not exists public.membres (
  foyer_id   uuid not null references public.foyers(id) on delete cascade,
  membre_id  uuid not null references auth.users(id) on delete cascade,
  rejoint_le timestamptz not null default now(),
  primary key (foyer_id, membre_id)
);

-- Le stockage lui-meme. `cle` est la cle vue par le proto ("menus:v1"),
-- `valeur` la chaine JSON telle qu'il l'ecrit.
--
-- `version` est le garde-fou : une ecriture porte la version qu'elle croit
-- remplacer. Si elle a bouge entre-temps, la mise a jour ne touche aucune
-- ligne, et le client sait qu'il doit fusionner avant de reessayer. Sans ca,
-- le dernier a ecrire ecraserait en silence le travail de l'autre.
create table if not exists public.documents (
  foyer_id uuid   not null references public.foyers(id) on delete cascade,
  cle      text   not null,
  valeur   text   not null,
  version  bigint not null default 1,
  maj_le   timestamptz not null default now(),
  maj_par  uuid,
  primary key (foyer_id, cle)
);

-- ------------------------------------------------------------ securite ---

alter table public.foyers    enable row level security;
alter table public.membres   enable row level security;
alter table public.documents enable row level security;

-- Fonction d'appartenance. En `security definer` pour une raison precise :
-- si la politique de `membres` interrogeait `membres`, Postgres tournerait
-- en rond. Ici la fonction court-circuite RLS le temps de la verification.
create or replace function public.est_membre(f uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.membres
    where foyer_id = f and membre_id = auth.uid()
  );
$$;

drop policy if exists foyers_lecture on public.foyers;
create policy foyers_lecture on public.foyers
  for select using (public.est_membre(id));

drop policy if exists membres_lecture on public.membres;
create policy membres_lecture on public.membres
  for select using (public.est_membre(foyer_id));

-- Un membre peut se retirer lui-meme d'un foyer, rien de plus.
drop policy if exists membres_depart on public.membres;
create policy membres_depart on public.membres
  for delete using (membre_id = auth.uid());

-- Les documents : tout est permis a l'interieur de son foyer, rien a
-- l'exterieur. `with check` couvre l'ecriture, `using` la lecture.
drop policy if exists documents_lecture on public.documents;
create policy documents_lecture on public.documents
  for select using (public.est_membre(foyer_id));

drop policy if exists documents_ajout on public.documents;
create policy documents_ajout on public.documents
  for insert with check (public.est_membre(foyer_id));

drop policy if exists documents_maj on public.documents;
create policy documents_maj on public.documents
  for update using (public.est_membre(foyer_id))
          with check (public.est_membre(foyer_id));

drop policy if exists documents_suppression on public.documents;
create policy documents_suppression on public.documents
  for delete using (public.est_membre(foyer_id));

-- Aucune politique d'insertion sur `foyers` ni `membres` : la creation et le
-- ralliement passent obligatoirement par les fonctions ci-dessous, seules a
-- pouvoir les ecrire. Impossible de s'inviter dans un foyer au hasard.

-- ------------------------------------------------------------ fonctions ---

-- Le foyer de l'utilisateur connecte, ou null. Un compte n'appartient qu'a un
-- seul foyer : c'est une application de maison, pas un reseau social.
create or replace function public.mon_foyer()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select foyer_id from public.membres
  where membre_id = auth.uid()
  order by rejoint_le
  limit 1;
$$;

create or replace function public.creer_foyer(nom text default 'Foyer')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existant uuid;
  nouveau  uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  select public.mon_foyer() into existant;
  if existant is not null then
    return existant; -- deja dans un foyer : on ne le duplique pas
  end if;

  insert into public.foyers (nom) values (coalesce(nullif(trim(nom), ''), 'Foyer'))
  returning id into nouveau;

  insert into public.membres (foyer_id, membre_id) values (nouveau, auth.uid());

  return nouveau;
end;
$$;

-- Rallier un foyer existant a partir de son code (l'identifiant du foyer,
-- affiche dans le panneau Compte du premier appareil).
create or replace function public.rejoindre_foyer(code uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existant uuid;
begin
  if auth.uid() is null then
    raise exception 'Connexion requise';
  end if;

  if not exists (select 1 from public.foyers where id = code) then
    raise exception 'Ce code de foyer n''existe pas';
  end if;

  select public.mon_foyer() into existant;
  if existant is not null and existant <> code then
    raise exception 'Ce compte appartient deja a un autre foyer';
  end if;

  insert into public.membres (foyer_id, membre_id)
  values (code, auth.uid())
  on conflict do nothing;

  return code;
end;
$$;

-- ------------------------------------------------------------ temps reel ---

-- Sans cette ligne, les autres appareils ne sont jamais prevenus : ils ne
-- verraient les changements qu'au rechargement.
--
-- La liste de colonnes est volontaire : `valeur` en est exclue. Le document
-- complet peut peser plusieurs centaines de kilo-octets, et le diffuser a
-- chaque frappe saturerait le canal temps reel — au-dela de la limite, le
-- message est purement abandonne. Le client recoit donc juste « la cle X est
-- passee en version N », et va chercher le contenu par l'API normale.
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'documents'
  ) then
    alter publication supabase_realtime drop table public.documents;
  end if;

  alter publication supabase_realtime
    add table public.documents (foyer_id, cle, version, maj_par);
end $$;

-- La cle primaire (foyer_id, cle) suffit a identifier la ligne modifiee, et
-- elle fait partie de la liste publiee ci-dessus — condition necessaire pour
-- que les UPDATE passent.
alter table public.documents replica identity default;
