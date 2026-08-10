/* ==========================================================================
   Popott — configuration de la synchronisation

   Deliberement separe de `supabase.js`, qui importe le client. Le point
   d'entree a seulement besoin de savoir *si* la synchronisation existe ; s'il
   posait la question a `supabase.js`, il tirerait tout le client dans le
   fascicule principal, y compris pour un fichier `solo` qui n'en fera jamais
   rien. Ici, c'est trois lignes et aucune dependance.

   Les deux valeurs sont publiques par construction : elles finissent dans le
   fichier publie. Ce qui protege les donnees est le row level security du
   schema, pas le secret de la cle.
   ========================================================================== */

export const URL_SUPABASE = (import.meta.env.VITE_SUPABASE_URL || "").trim();
export const CLE_SUPABASE = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const synchroDisponible = Boolean(URL_SUPABASE && CLE_SUPABASE);
