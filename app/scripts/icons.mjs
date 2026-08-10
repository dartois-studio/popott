/* Regenere les icones PWA depuis icons/popott-icon.svg.
   Usage : npm run icons   (necessite sharp, en devDependencies) */
import sharp from "sharp";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const source = resolve(ici, "../../icons/popott-icon.svg");
const sortie = resolve(ici, "../public");

const svg = readFileSync(source);

for (const [taille, nom] of [
  [180, "apple-touch-icon.png"],
  [192, "icon-192.png"],
  [512, "icon-512.png"],
]) {
  await sharp(svg, { density: 400 }).resize(taille, taille).png().toFile(`${sortie}/${nom}`);
  console.log(`${nom} — ${taille}px`);
}

// Maskable : Android rogne jusqu'a 20% sur chaque bord.
// Motif reduit et rapproche pour rester dans le cercle de securite.
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#4A2440"/>
  <g fill="#F6F4ED"><circle cx="304" cy="512" r="160"/><circle cx="720" cy="512" r="160"/></g>
</svg>`;
await sharp(Buffer.from(maskable), { density: 400 })
  .resize(512, 512)
  .png()
  .toFile(`${sortie}/icon-maskable-512.png`);
console.log("icon-maskable-512.png — 512px");

copyFileSync(source, `${sortie}/favicon.svg`);
console.log("favicon.svg");
