/* ==========================================================================
   Popott — acces a Supabase

   Deux valeurs suffisent, toutes deux publiques par construction : l'adresse
   du projet et la cle « anon ». Cette cle n'ouvre rien par elle-meme — c'est
   le row level security du schema qui decide, et il ne laisse voir que les
   documents du foyer de la personne connectee. La retrouver dans le fichier
   publie est normal et sans consequence.

   Si les deux valeurs manquent, `synchroDisponible` est faux et l'application
   retombe sur le stockage local seul. C'est ce qui permet a `npm run solo`
   de produire un fichier autonome, et au proto de tourner sans compte.
   ========================================================================== */

import { createClient } from "@supabase/supabase-js";
import { URL_SUPABASE, CLE_SUPABASE, synchroDisponible } from "./config.js";

export { URL_SUPABASE, CLE_SUPABASE, synchroDisponible };

let client = null;

/** Le client Supabase, cree au premier appel. Null si non configure. */
export function supabase() {
  if (!synchroDisponible) return null;
  if (!client) {
    client = createClient(URL_SUPABASE, CLE_SUPABASE, {
      auth: {
        persistSession: true,      // rester connecte d'une ouverture a l'autre
        autoRefreshToken: true,
        storageKey: "popott:session",
      },
      realtime: {
        // Le proto ecrit par salves courtes. Dix messages par seconde
        // suffisent largement et evitent de se faire limiter.
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return client;
}
