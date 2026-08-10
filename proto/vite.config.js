import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Chemins relatifs : le site fonctionne a la racine d'un domaine comme dans
  // un sous-dossier (github.io/popott/), sans rien changer.
  base: "./",
  plugins: [react()],
  server: {
    host: true, // accessible depuis le telephone sur le meme reseau
    port: 5173,
  },
});
