import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // accessible depuis le telephone sur le meme reseau
    port: 5173,
  },
});
