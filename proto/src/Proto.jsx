import React, { useState, useEffect, useMemo, useRef } from "react";
import { Logo } from "./Logo";

/* ==========================================================================
   POPOTT — Prototype UX/UI
   Bibliothèque de plats → Menu de la semaine → Liste de courses agrégée
   ========================================================================== */

const CSS = `
/* Les jetons viennent de brand.css. Ne rien redefinir ici. */
.mc *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.mc{font-family:var(--sans);background:var(--backdrop);min-height:100dvh;color:var(--ink);font-size:15px;line-height:1.45}
.mc .shell{max-width:540px;margin:0 auto;background:var(--paper);min-height:100dvh;
  padding-bottom:100px;box-shadow:0 0 60px rgba(23,36,30,.14);position:relative}

.mc .eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}
.mc .title{font-family:var(--display);font-size:29px;letter-spacing:-.02em;line-height:1.05;margin:2px 0 0;font-weight:500}
.mc h3.sec{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);margin:26px 0 8px;font-weight:600}
.mc .qty{font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums;color:var(--ink-2)}
.mc .muted{color:var(--ink-3)}

.mc header.top{position:sticky;top:0;z-index:30;background:var(--paper);
  padding:18px 18px 12px;border-bottom:1px solid var(--line);
  display:flex;align-items:flex-end;justify-content:space-between;gap:12px}

.mc button{font:inherit;color:inherit;border:0;background:none;cursor:pointer}
.mc .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;
  border-radius:999px;padding:11px 17px;font-size:14px;font-weight:600;
  background:var(--aubergine);color:var(--creme);min-height:44px;white-space:nowrap}
.mc .btn:active{transform:scale(.97)}
.mc .btn.ghost{background:transparent;color:var(--aubergine);border:1.5px solid var(--line)}
.mc .btn.flat{background:var(--surface);color:var(--ink);border:1px solid var(--line)}
.mc .btn.sm{padding:7px 13px;min-height:36px;font-size:13px}
.mc .btn.danger{background:transparent;color:#8E2F2F;border:1.5px solid #E4CACA}
.mc .btn:disabled{opacity:.4}
.mc .icon-btn{width:40px;height:40px;border-radius:999px;display:grid;place-items:center;color:var(--ink-2);flex:none}
.mc .icon-btn:active{background:var(--line-soft)}

.mc .card{background:var(--surface);border-radius:var(--r);border:1px solid var(--line);overflow:hidden}
.mc .list{display:flex;flex-direction:column;gap:9px}
.mc .pad{padding-left:18px;padding-right:18px}

.mc .chips-wrap{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.mc .btn.rond{width:44px;height:44px;padding:0;border-radius:999px;margin-left:4px}
.mc .p-row{display:flex;align-items:center;gap:8px;border-top:1px solid var(--line);padding:2px 0}
.mc .p-nom{flex:1;min-width:0;text-align:left;padding:10px 0}
.mc .p-nom h4{font-family:var(--display);font-size:17px;font-weight:500;margin:0;letter-spacing:-.01em}
.mc .p-meta{display:block;font-size:12px;color:var(--ink-3);margin-top:2px;line-height:1.35}
.mc .chips{display:flex;gap:7px;overflow-x:auto;padding:2px 18px;scrollbar-width:none}
.mc .chips::-webkit-scrollbar{display:none}
.mc .chip{border:1.5px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 13px;
  font-size:13px;font-weight:500;white-space:nowrap;color:var(--ink-2);min-height:36px}
.mc .chip[data-on="1"]{background:var(--ink);border-color:var(--ink);color:var(--creme)}
.mc .ordre{font-family:var(--mono);font-size:11px;color:var(--ink-3);flex:none;width:12px;text-align:center}
.mc .reorder{display:flex;flex-direction:column;gap:2px;flex:none}
.mc .icon-btn.mini{width:30px;height:22px;border-radius:6px;border:1px solid var(--line)}
.mc .icon-btn.mini:disabled{opacity:.3}
.mc .filtres{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.mc .filtres::-webkit-scrollbar{display:none}
.mc .chip.sm{padding:5px 11px;min-height:32px;font-size:12.5px}
.mc .tag{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;
  padding:3px 8px;border-radius:6px;background:var(--line-soft);color:var(--ink-2);white-space:nowrap}
.mc .tag.aub{background:var(--aubergine-soft);color:var(--aubergine)}
.mc .tag.warn{background:#FBF0DE;color:#8A5A10}
.mc .tag.ok{background:#E6F0DE;color:var(--vert)}

.mc .plat{display:flex;align-items:center;gap:12px;padding:13px 14px;width:100%;text-align:left}
.mc .plat h4{font-family:var(--display);font-size:18px;font-weight:500;margin:0;letter-spacing:-.01em}
.mc .meta{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:5px}

.mc .day{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.mc .day.today{border-color:var(--aubergine);box-shadow:0 0 0 1px var(--aubergine)}
.mc .day-h{display:flex;align-items:baseline;gap:9px;padding:11px 14px 9px;border-bottom:1px solid var(--line-soft)}
.mc .day-h .num{font-family:var(--display);font-size:20px;line-height:1}
.mc .day-h .dow{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.mc .slot{display:flex;gap:11px;padding:11px 14px;border-top:1px solid var(--line-soft);width:100%;text-align:left;align-items:flex-start}
.mc .slot-name{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink-3);width:56px;flex:none;padding-top:3px}
.mc .slot-body{flex:1;min-width:0}
.mc .slot-empty{color:var(--ink-3);font-size:14px}
.mc .lien{color:var(--aubergine);font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;margin-left:4px}
.mc .bilan{display:flex;gap:7px}
.mc .bilan > *{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:11px;padding:9px 10px;
  font-size:11px;color:var(--ink-3);line-height:1.25;text-align:left}
.mc .bilan b{display:block;font-family:var(--display);font-size:22px;color:var(--ink);font-weight:500;margin-bottom:2px}
.mc .bilan em{font-family:var(--mono);font-style:normal;font-size:12px;color:var(--ink-3)}

.mc .swipe{touch-action:pan-y;user-select:none;transition:transform .12s ease-out}
.mc .grille{padding:12px 6px 0}
.mc .g-jours,.mc .g-row{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.mc .g-jours{position:sticky;top:69px;z-index:12;background:var(--paper);padding-bottom:3px}
.mc .g-day{display:flex;flex-direction:column;align-items:center;gap:1px;padding:2px 0}
.mc .g-day b{font-family:var(--mono);font-size:8.5px;letter-spacing:.03em;text-transform:uppercase;color:var(--ink-3)}
.mc .g-day i{font-family:var(--display);font-style:normal;font-size:15px;line-height:1}
.mc .g-day.we b,.mc .g-day.we i{opacity:.5}
.mc .g-day.on b,.mc .g-day.on i{color:var(--aubergine);font-weight:600;opacity:1}
.mc .g-cren{font-family:var(--mono);font-size:9.5px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3);margin:13px 0 4px 2px}
.mc .g-cell{min-height:58px;padding:0;display:flex;flex-direction:column;gap:2px;text-align:left;position:relative;
  border-radius:5px}
.mc .g-cell.on{background:rgba(92,42,70,.06)}
.mc .g-pers{position:absolute;right:1px;bottom:0;font-family:var(--mono);font-size:8px;color:var(--ink-3)}
.mc .g-vide{color:var(--line);font-size:15px;margin:auto;line-height:1}
.mc .bloc-plat{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;
  border-radius:4px;padding:3px 4px;font-size:9px;line-height:1.2;letter-spacing:-.01em;overflow-wrap:anywhere;font-weight:500}
.mc .bloc-plat.gros{font-size:15px;line-height:1.3;padding:5px 9px;border-radius:6px;-webkit-line-clamp:2;
  font-family:var(--display);font-weight:400;letter-spacing:0;margin-bottom:3px}

.mc .detail{padding:12px 12px 0}
.mc .j-bloc{border-top:1px solid var(--line);padding:10px 0 6px}
.mc .j-tete{display:flex;align-items:baseline;gap:8px;margin-bottom:4px;padding-left:2px}
.mc .j-tete .num{font-family:var(--display);font-size:19px;line-height:1}
.mc .j-tete .dow{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.mc .j-bloc.on .j-tete .num,.mc .j-bloc.on .j-tete .dow{color:var(--aubergine)}
.mc .j-slot{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:4px 2px}
.mc .h-slot{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:9px 2px;border-top:1px solid var(--line)}
.mc .hebdo{padding:22px 12px 0}
.mc .h-fois{font-family:var(--mono);font-size:12px;color:var(--ink-3);flex:none;padding-top:5px}

.mc .prop-ligne{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid var(--line)}
.mc .picker{margin-top:14px;border-top:1px solid var(--line);padding-top:12px}
.mc .picker-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.mc .picker-filtres{display:flex;gap:7px;margin-top:8px;align-items:stretch}
.mc .picker-filtres select{flex:1;min-width:0;font-size:14px;padding:9px 26px 9px 10px;min-height:42px;
  background-position:calc(100% - 15px) 19px,calc(100% - 10px) 19px}
.mc .idee-btn{width:42px;flex:none;border:1.5px solid var(--line);border-radius:10px;background:var(--surface);
  display:grid;place-items:center;color:var(--ink-3)}
.mc .idee-btn.on{background:var(--aubergine-soft);border-color:var(--aubergine);color:var(--aubergine)}
.mc .picker-idee{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px}
.mc .picker-compte{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ink-3);margin:14px 0 0}
.mc .minical{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px 10px 12px;margin:4px 0 12px}
.mc .minical-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px}
.mc .minical .g-cell{min-height:46px}
.mc .minical .bloc-plat{-webkit-line-clamp:3}
.mc .stepper{display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1.5px solid var(--line);
  border-radius:10px;padding:4px 6px}
.mc .stepper span{font-size:14px;color:var(--ink-2)}
.mc .stepper b{font-family:var(--display);font-size:20px;margin-right:4px}

.mc .slot-plats{font-family:var(--display);font-size:16.5px;display:block}
.mc .plats-liste{display:block}
.mc .plat-ligne{display:flex;gap:9px;align-items:baseline;padding:1px 0}
.mc .plat-ligne + .plat-ligne{border-top:1px dotted var(--line);padding-top:4px;margin-top:3px}
.mc .cat-col{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
  color:var(--ink-3);width:52px;flex:none;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc .plat-nom{font-family:var(--display);font-size:16.5px;line-height:1.25;flex:1;min-width:0}

.mc .ticket{background:var(--surface);border:1px solid var(--line);border-radius:var(--r) var(--r) 0 0;overflow:hidden}
.mc .ticket-edge{height:12px;background:var(--surface);border-left:1px solid var(--line);border-right:1px solid var(--line);
  -webkit-mask-image:radial-gradient(circle 7px at 8px 12px,transparent 98%,#000 100%);
  -webkit-mask-size:16px 12px;-webkit-mask-repeat:repeat-x;
  mask-image:radial-gradient(circle 7px at 8px 12px,transparent 98%,#000 100%);
  mask-size:16px 12px;mask-repeat:repeat-x}
.mc .rayon-h{position:sticky;top:69px;z-index:10;display:flex;align-items:center;gap:9px;
  padding:9px 14px;background:var(--surface);border-bottom:1px solid var(--line-soft);border-top:1px solid var(--line-soft)}
.mc .rayon-h .dot{width:9px;height:9px;border-radius:3px;flex:none}
.mc .rayon-h b{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:600}
.mc .line{display:flex;align-items:center;gap:11px;padding:0 14px 0 12px;min-height:56px;width:100%;text-align:left;
  border-bottom:1px solid var(--line-soft);background:transparent}
.mc .line:last-child{border-bottom:0}
.mc .box{width:26px;height:26px;border-radius:8px;border:2px solid var(--ink-3);flex:none;
  display:grid;place-items:center;color:var(--creme);transition:background .15s,border-color .15s}
.mc .line[data-s="done"] .box{background:var(--vert);border-color:var(--vert)}
.mc .line[data-s="done"] .lbl{color:var(--ink-3);text-decoration:line-through;text-decoration-thickness:1.5px}
.mc .line[data-s="have"]{opacity:.5}
.mc .lbl{flex:1;min-width:0;font-size:15px}
.mc .from{display:block;font-size:11.5px;color:var(--ink-3);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mc .have-btn{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;
  border:1.5px solid var(--line);border-radius:999px;padding:5px 8px;color:var(--ink-3);min-height:32px;flex:none}
.mc .line[data-s="have"] .have-btn{background:var(--ink);border-color:var(--ink);color:var(--creme)}

.mc .bar{height:5px;background:var(--line);border-radius:999px;overflow:hidden}
.mc .bar i{display:block;height:100%;background:var(--vert);transition:width .3s}

.mc label.f{display:block;margin:14px 0 0}
.mc label.f > span{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--ink-3);margin-bottom:6px}
.mc input,.mc select,.mc textarea{width:100%;font-family:var(--sans);font-size:16px;padding:11px 12px;
  border:1.5px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);min-height:46px}
.mc input:focus,.mc select:focus,.mc textarea:focus,.mc button:focus-visible{outline:2px solid var(--aubergine);outline-offset:1px}
.mc select{appearance:none;-webkit-appearance:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--ink-3) 50%),linear-gradient(135deg,var(--ink-3) 50%,transparent 50%);
  background-position:calc(100% - 17px) 21px,calc(100% - 12px) 21px;background-size:5px 5px;background-repeat:no-repeat}
.mc .row{display:flex;gap:8px}
.mc .switch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;width:100%;text-align:left}
.mc .sw{width:48px;height:29px;border-radius:999px;background:var(--line);position:relative;flex:none;transition:background .18s}
.mc .sw i{position:absolute;top:3px;left:3px;width:23px;height:23px;border-radius:999px;background:var(--surface);
  transition:transform .18s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.mc .sw[data-on="1"]{background:var(--vert)}
.mc .sw[data-on="1"] i{transform:translateX(19px)}

.mc .scrim{position:fixed;inset:0;background:rgba(23,36,30,.45);z-index:60;animation:mcfade .2s}
.mc .sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:540px;z-index:61;
  background:var(--paper);border-radius:20px 20px 0 0;max-height:93dvh;display:flex;flex-direction:column;
  animation:mcup .26s cubic-bezier(.2,.8,.25,1)}
.mc .sheet-h{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 12px;
  border-bottom:1px solid var(--line);flex:none}
.mc .sheet-h h2{font-family:var(--display);font-size:20px;margin:0;font-weight:500}
.mc .sheet.plein{height:94dvh;max-height:94dvh}
.mc .sheet-e{flex:none;padding:8px 12px 10px;border-bottom:1px solid var(--line);background:var(--paper)}
.mc .sheet-b{overflow-y:auto;padding:4px 16px 24px;-webkit-overflow-scrolling:touch}
.mc .nav-jour{display:flex;align-items:center;justify-content:space-between;touch-action:pan-y;user-select:none}
.mc .nav-jour span{font-family:var(--display);font-size:19px}
.mc .segm{display:flex;gap:4px;overflow-x:auto;margin-top:6px;scrollbar-width:none}
.mc .segm::-webkit-scrollbar{display:none}
.mc .segm button{flex:1;min-width:74px;padding:8px 10px;border-radius:9px;font-size:13.5px;font-weight:600;
  color:var(--ink-3);background:var(--surface);border:1px solid var(--line);white-space:nowrap}
.mc .segm button[data-on="1"]{background:var(--ink);border-color:var(--ink);color:var(--creme)}
.mc .au-menu{display:flex;gap:8px;align-items:center;border-top:1px solid var(--line);padding:8px 0}
.mc .au-menu .nm{flex:1;min-width:0}
.mc .repli{display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px;
  border-top:1px solid var(--line);margin-top:12px;padding:11px 0;font-size:13.5px;color:var(--ink-2);text-align:left}
.mc .nav-cat{display:flex;align-items:center;justify-content:space-between;margin-top:10px;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:2px 0}
.mc .nav-cat span{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
.mc .nav-cat em{font-style:normal;color:var(--ink-3);margin-left:5px}
.mc .sheet-f{flex:none;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line);
  display:flex;gap:9px}
.mc .sheet-f .btn:last-child{flex:1}
@keyframes mcup{from{transform:translate(-50%,100%)}to{transform:translate(-50%,0)}}
@keyframes mcfade{from{opacity:0}to{opacity:1}}

.mc nav.tabs{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:540px;z-index:50;
  background:rgba(255,255,255,.94);backdrop-filter:blur(12px);border-top:1px solid var(--line);
  display:grid;grid-template-columns:repeat(4,1fr);padding-bottom:env(safe-area-inset-bottom)}
.mc nav.tabs button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 8px;color:var(--ink-3)}
.mc nav.tabs button[data-on="1"]{color:var(--aubergine)}
.mc nav.tabs .lb{font-size:10.5px;font-weight:600}
.mc .badge{position:absolute;top:-4px;left:13px;background:var(--aubergine);color:var(--creme);
  font-family:var(--mono);font-size:9px;padding:1px 5px;border-radius:999px;line-height:1.5}

.mc .empty{text-align:center;padding:40px 24px;color:var(--ink-3)}
.mc .empty p{margin:0 0 16px;font-size:14px}
.mc .combo{position:relative}
.mc .combo-pop{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:5;background:var(--surface);
  border:1px solid var(--line);border-radius:10px;max-height:210px;overflow-y:auto;box-shadow:0 8px 24px rgba(23,36,30,.16)}
.mc .combo-pop button{display:block;width:100%;text-align:left;padding:11px 12px;border-bottom:1px solid var(--line-soft);font-size:15px}
.mc .ing-row{display:flex;gap:7px;align-items:center;background:var(--surface);border:1px solid var(--line);
  border-radius:10px;padding:8px 8px 8px 11px;margin-top:7px}
.mc .ing-row .nm{flex:1;min-width:0;font-size:14.5px}
.mc .ing-row input{width:64px;padding:7px 8px;min-height:38px;text-align:right}
.mc .ing-row select{width:78px;padding:7px 22px 7px 8px;min-height:38px;font-size:13px;
  background-position:calc(100% - 13px) 17px,calc(100% - 8px) 17px}
.mc .inline-in{border:0;padding:6px 0;min-height:0;background:transparent;border-radius:0}
.mc .toast{position:fixed;bottom:98px;left:50%;transform:translateX(-50%);z-index:70;background:var(--ink);
  color:var(--creme);padding:11px 18px;border-radius:999px;font-size:13.5px;font-weight:500;
  box-shadow:0 8px 24px rgba(23,36,30,.3);max-width:90%}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important;transition:none!important}}
`;

/* ============================ Utilitaires ============================ */
const uid = () => Math.random().toString(36).slice(2, 9);
const UNITES = ["", "g", "kg", "mL", "L", "pièce", "c. à s.", "c. à c.", "pincée", "botte", "boîte"];
const REGIMES = ["standard", "végétarien", "enfant", "autre"];
const SAISONS = [{ id: "toute", nom: "Toute l'année" }, { id: "ete", nom: "Été" }, { id: "hiver", nom: "Hiver" }];
const saisonDe = (d) => { const m = d.getMonth() + 1; return m >= 4 && m <= 9 ? "ete" : "hiver"; };
const nomSaison = (id) => (SAISONS.find((x) => x.id === id) || SAISONS[0]).nom;
const DOW = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const lundi = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const addJ = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseISO = (s) => { const [a, b, c] = s.split("-").map(Number); return new Date(a, b - 1, c); };
const jourDe = (d) => `${DOW[(d.getDay() + 6) % 7]}. ${d.getDate()} ${MOIS[d.getMonth()]}`;
const joursDepuis = (s) => Math.round((new Date().setHours(0, 0, 0, 0) - parseISO(s).getTime()) / 86400000);

const fmtQ = (n) => {
  if (n == null || isNaN(n)) return "";
  const r = Math.round(n * 100) / 100;
  if (Math.abs(r - Math.round(r)) < 0.01) return String(Math.round(r));
  return String(r).replace(".", ",");
};

/* ============================ Données d'exemple ============================ */
function seed() {
  const rayons = [
    { id: "r1", nom: "Fruits & légumes", couleur: "#4C7A2B" },
    { id: "r2", nom: "Frais", couleur: "#2F6C86" },
    { id: "r3", nom: "Boucherie", couleur: "#9B3A3A" },
    { id: "r4", nom: "Épicerie", couleur: "#A9651B" },
    { id: "r5", nom: "Surgelés", couleur: "#4D63A8" },
    { id: "r6", nom: "Boissons", couleur: "#7A2E52" },
  ];
  const brut = [
    ["Courgette", "r1", "pièce", 0], ["Tomate", "r1", "pièce", 0], ["Oignon", "r1", "pièce", 0],
    ["Ail", "r1", "pièce", 1], ["Pomme de terre", "r1", "g", 0], ["Carotte", "r1", "pièce", 0],
    ["Potiron", "r1", "g", 0], ["Basilic", "r1", "botte", 0], ["Citron", "r1", "pièce", 0],
    ["Pomme", "r1", "pièce", 0], ["Poivron", "r1", "pièce", 0],
    ["Crème fraîche", "r2", "mL", 0], ["Gruyère râpé", "r2", "g", 0], ["Mozzarella", "r2", "g", 0],
    ["Œuf", "r2", "pièce", 0], ["Lait", "r2", "mL", 0], ["Beurre", "r2", "g", 1],
    ["Blanc de poulet", "r3", "g", 0], ["Lardons", "r3", "g", 0],
    ["Lentilles corail", "r4", "g", 0], ["Riz", "r4", "g", 1], ["Pâtes", "r4", "g", 0],
    ["Farine", "r4", "g", 1], ["Huile d'olive", "r4", "mL", 1], ["Sel", "r4", "pincée", 1],
    ["Poivre", "r4", "pincée", 1], ["Lait de coco", "r4", "mL", 0], ["Curry", "r4", "c. à c.", 1],
    ["Sucre", "r4", "g", 1], ["Pignons de pin", "r4", "g", 0], ["Bouillon de légumes", "r4", "pièce", 1],
    ["Petits pois", "r5", "g", 0], ["Jus d'orange", "r6", "L", 0],
    ["Flocons d'avoine", "r4", "g", 0], ["Confiture", "r4", "g", 0], ["Pain", "r4", "pièce", 0],
  ];
  const ingredients = brut.map((x, i) => ({ id: "i" + i, nom: x[0], rayonId: x[1], unite: x[2], garde: !!x[3] }));
  const ref = (n) => ingredients.find((x) => x.nom === n);
  const L = (n, q, u) => ({ id: uid(), ingId: ref(n).id, qte: q, unite: u || ref(n).unite });

  const plats = [
    { id: "p1", nom: "Gratin de courgettes", saison: "ete", cat: "plat", tags: ["végétarien"], portions: 4, lignes: [L("Courgette", 5), L("Crème fraîche", 200), L("Gruyère râpé", 100), L("Oignon", 1), L("Sel", 1), L("Huile d'olive", 20)] },
    { id: "p2", nom: "Dahl de lentilles corail", saison: "hiver", cat: "plat", tags: ["végétarien", "enfant"], portions: 4, lignes: [L("Lentilles corail", 250), L("Lait de coco", 400), L("Oignon", 1), L("Ail", 2), L("Curry", 2), L("Riz", 250)] },
    { id: "p3", nom: "Poulet basquaise", saison: "ete", cat: "plat", tags: [], portions: 4, lignes: [L("Blanc de poulet", 600), L("Poivron", 3), L("Tomate", 4), L("Oignon", 2), L("Riz", 250), L("Huile d'olive", 20)] },
    { id: "p4", nom: "Pâtes au pesto maison", saison: "ete", cat: "plat", tags: ["végétarien", "enfant", "rapide"], portions: 4, lignes: [L("Pâtes", 400), L("Basilic", 1), L("Pignons de pin", 40), L("Ail", 1), L("Huile d'olive", 80), L("Gruyère râpé", 60)] },
    { id: "p5", nom: "Soupe de potiron", saison: "hiver", cat: "entrée", tags: ["végétarien"], portions: 4, lignes: [L("Potiron", 800), L("Pomme de terre", 200), L("Oignon", 1), L("Crème fraîche", 100), L("Bouillon de légumes", 1)] },
    { id: "p6", nom: "Tomates mozzarella", saison: "ete", cat: "entrée", tags: ["végétarien", "rapide"], portions: 4, lignes: [L("Tomate", 4), L("Mozzarella", 250), L("Basilic", 1), L("Huile d'olive", 30)] },
    { id: "p7", nom: "Crêpes", saison: "toute", cat: "goûter", tags: ["enfant"], portions: 6, lignes: [L("Farine", 300), L("Œuf", 3), L("Lait", 600), L("Beurre", 50), L("Sucre", 40)] },
    { id: "p8", nom: "Tarte aux pommes", saison: "toute", cat: "dessert", tags: ["végétarien"], portions: 6, lignes: [L("Pomme", 5), L("Farine", 250), L("Beurre", 125), L("Sucre", 80), L("Œuf", 1)] },
    { id: "p9", nom: "Quiche lorraine", saison: "toute", cat: "plat", tags: [], portions: 4, lignes: [L("Lardons", 200), L("Œuf", 3), L("Crème fraîche", 200), L("Farine", 250), L("Beurre", 125), L("Gruyère râpé", 80)] },
    { id: "p10", nom: "Purée & petits pois", saison: "hiver", cat: "plat", tags: ["enfant", "végétarien"], portions: 4, lignes: [L("Pomme de terre", 800), L("Lait", 150), L("Beurre", 40), L("Petits pois", 300)] },
    { id: "p12", nom: "Porridge aux fruits", saison: "toute", cat: "petit déj", tags: ["végétarien"], portions: 2, lignes: [L("Flocons d'avoine", 80), L("Lait", 300), L("Pomme", 1)] },
    { id: "p13", nom: "Tartines & confiture", saison: "toute", cat: "petit déj", tags: ["végétarien", "enfant"], portions: 4, lignes: [L("Pain", 1), L("Confiture", 100), L("Beurre", 40)] },
    { id: "p11", nom: "Carottes râpées", saison: "toute", cat: "entrée", tags: ["végétarien", "rapide"], portions: 4, lignes: [L("Carotte", 5), L("Citron", 1), L("Huile d'olive", 30)] },
  ];

  const personnes = [
    { id: "u1", nom: "Papa", regime: "standard", notes: "" },
    { id: "u2", nom: "Maman", regime: "végétarien", notes: "" },
    { id: "u3", nom: "Léa", regime: "enfant", notes: "N'aime pas la crème" },
  ];
  const l = lundi(new Date());
  const tous = personnes.map((p) => p.id);
  const repas = [
    { id: uid(), date: iso(l), creneauId: "c2", platIds: ["p5", "p9"], convives: tous, ajust: [] },
    { id: uid(), date: iso(addJ(l, 1)), creneauId: "c2", platIds: ["p2"], convives: tous, ajust: [{ id: uid(), personneId: "u1", type: "add", ingId: ref("Blanc de poulet").id, qte: 150, unite: "g" }] },
    { id: uid(), date: iso(addJ(l, 2)), creneauId: "c1", platIds: ["p4"], convives: ["u2", "u3"], ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c0", platIds: ["p12", "p13"], convives: tous, repetitions: 7, ajust: [] },
    { id: uid(), date: iso(l), creneauId: "c3", platIds: ["p7"], convives: tous, repetitions: 2, ajust: [] },
    { id: uid(), date: iso(addJ(l, 3)), creneauId: "c2", platIds: ["p1"], convives: tous, ajust: [{ id: uid(), personneId: "u3", type: "remove", ingId: ref("Crème fraîche").id, qte: 0, unite: "mL" }] },
    { id: uid(), date: iso(addJ(l, 5)), creneauId: "c2", platIds: ["p6", "p3", "p8"], convives: tous, ajust: [] },
  ];

  return {
    v: 1, rayons, ingredients, plats, personnes, repas,
    creneaux: [
      { id: "c0", nom: "Petit déjeuner", portee: "semaine" },
      { id: "c1", nom: "Midi", portee: "jour" },
      { id: "c2", nom: "Soir", portee: "jour" },
      { id: "c3", nom: "Goûter", portee: "semaine" },
      { id: "c6", nom: "Dessert", portee: "semaine" },
      { id: "c4", nom: "Apéro", portee: "semaine" },
      { id: "c5", nom: "Extra", portee: "semaine" },
    ],
    categories: ["petit déj", "entrée", "plat", "dessert", "goûter", "apéro", "extra"],
    tags: ["végétarien", "enfant", "sans lactose", "rapide"],
    presets: [],
    manuels: [{ id: uid(), libelle: "Sacs poubelle", qte: 1, unite: "pièce", rayonId: "r4", etat: "todo" }],
    etats: {},
  };
}

/* Reprise des données enregistrées avant l'ajout des créneaux hebdomadaires */
function migrer(d) {
  d.creneaux.forEach((c) => {
    if (!c.portee) c.portee = (c.id === "c1" || c.id === "c2") ? "jour" : "semaine";
  });
  if (!d.creneaux.some((c) => c.nom.toLowerCase().startsWith("petit"))) {
    d.creneaux.unshift({ id: "c0", nom: "Petit déjeuner", portee: "semaine" });
  }
  if (!d.categories.some((c) => c.toLowerCase().startsWith("petit"))) d.categories.unshift("petit déj");
  if (!d.creneaux.some((c) => c.nom.toLowerCase().startsWith("dessert"))) {
    const k = d.creneaux.findIndex((c) => c.nom.toLowerCase().startsWith("goût"));
    d.creneaux.splice(k < 0 ? d.creneaux.length : k + 1, 0, { id: "c6", nom: "Dessert", portee: "semaine" });
  }
  d.repas.forEach((r) => { if (!r.repetitions) r.repetitions = 1; });
  d.plats.forEach((p) => { if (!p.saison) p.saison = "toute"; });
  if (!d.presets) d.presets = [];
  return d;
}

/* ============================ Icônes ============================ */
const Ic = ({ d, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const IcPlats = <><path d="M4 13h16a8 8 0 0 1-16 0Z" /><path d="M3 20h18" /><path d="M9 4c0 1.2 1 1.5 1 2.6S9 8.4 9 9.6" /><path d="M13.5 4c0 1.2 1 1.5 1 2.6s-1 1.8-1 3" /></>;
const IcCal = <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>;
const IcCart = <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.6l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H5.4" /></>;
const IcSet = <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></>;
const IcPlus = <><path d="M12 5v14M5 12h14" /></>;
const IcX = <><path d="M6 6l12 12M18 6L6 18" /></>;
const IcChk = <><path d="M4 12.5l5 5L20 6.5" /></>;
const IcL = <><path d="M15 5l-7 7 7 7" /></>;
const IcR = <><path d="M9 5l7 7-7 7" /></>;
const IcPen = <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /></>;
const IcMoins = <><path d="M5 12h14" /></>;
const IcStats = <><path d="M5 20V11M12 20V4M19 20v-6" /></>;
const IcPoints = <><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></>;
const IcIdee = <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.8 1-.9 1.6l-.1.6H9.4l-.1-.6c-.1-.6-.4-1.2-.9-1.6A6 6 0 0 1 12 3Z" /></>;
const IcImport = <><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>;
const IcEtoile = <><path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z" /></>;
const IcAuj = <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="12" cy="15.5" r="2" fill="currentColor" /></>;
const IcTri = <><path d="M4 7h13M4 12h9M4 17h5" /><path d="M18 10v10M15 17l3 3 3-3" /></>;
const IcCopie = <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>;
const IcDes = <><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" /><circle cx="12" cy="12" r="1.1" fill="currentColor" /></>;
const IcMagie = <><path d="M4 20L15 9" /><path d="M14 4l.9 2.1L17 7l-2.1.9L14 10l-.9-2.1L11 7l2.1-.9L14 4Z" /><path d="M19.5 13l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z" /></>;
const IcGrille = <><rect x="3" y="4" width="7.5" height="7" rx="1.5" /><rect x="13.5" y="4" width="7.5" height="7" rx="1.5" /><rect x="3" y="13" width="7.5" height="7" rx="1.5" /><rect x="13.5" y="13" width="7.5" height="7" rx="1.5" /></>;
const IcListe = <><path d="M4 6h16M4 12h16M4 18h10" /></>;
const IcUp = <><path d="M6 14l6-6 6 6" /></>;
const IcDown = <><path d="M6 10l6 6 6-6" /></>;
const IcSort = <><path d="M4 7h11M4 12h7M4 17h4" /><path d="M18 5v14M15 16l3 3 3-3" /></>;
const IcTrash = <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>;

/* ============================ Briques d'interface ============================ */
function Sheet({ title, sub, onClose, children, actions, plein, entete }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={"sheet" + (plein ? " plein" : "")} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Repas"}>
        <div className="sheet-h">
          <div style={{ minWidth: 0 }}>
            {sub && <div className="eyebrow">{sub}</div>}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><Ic d={IcX} s={20} /></button>
        </div>
        {entete && <div className="sheet-e">{entete}</div>}
        <div className="sheet-b">{children}</div>
        {actions && <div className="sheet-f">{actions}</div>}
      </div>
    </>
  );
}

function Switch({ on, onChange, label, hint }) {
  return (
    <button className="switch" onClick={() => onChange(!on)} aria-pressed={on}>
      <span>
        <span style={{ display: "block", fontSize: 14.5 }}>{label}</span>
        {hint && <span className="muted" style={{ fontSize: 12.5 }}>{hint}</span>}
      </span>
      <span className="sw" data-on={on ? 1 : 0}><i /></span>
    </button>
  );
}

function IngredientCombo({ ingredients, onPick, onCreate, placeholder = "Ajouter un ingrédient…" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const res = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ingredients.filter((i) => !s || i.nom.toLowerCase().includes(s)).slice(0, 40);
  }, [q, ingredients]);
  const exact = ingredients.some((i) => i.nom.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="combo">
      <input value={q} placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)} />
      {open && (
        <div className="combo-pop">
          {q.trim() && !exact && onCreate && (
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { onCreate(q.trim()); setQ(""); setOpen(false); }}>
              <span style={{ color: "var(--aubergine)", fontWeight: 600 }}>Créer « {q.trim()} »</span>
            </button>
          )}
          {res.map((i) => (
            <button key={i.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(i); setQ(""); setOpen(false); }}>
              {i.nom}{i.unite && <span className="muted" style={{ fontSize: 12 }}> · {i.unite}</span>}
            </button>
          ))}
          {!res.length && !q.trim() && <div style={{ padding: 12 }} className="muted">Aucun ingrédient.</div>}
        </div>
      )}
    </div>
  );
}

function ListeCreneaux({ db, up }) {
  const [nv, setNv] = useState("");
  const ajouter = () => {
    if (!nv.trim()) return;
    up((d) => d.creneaux.push({ id: uid(), nom: nv.trim(), portee: "jour" }));
    setNv("");
  };
  return (
    <>
      <h3 className="sec">Créneaux de repas</h3>
      <div className="card">
        {db.creneaux.map((c) => (
          <div key={c.id} className="line">
            <input className="lbl inline-in" defaultValue={c.nom} aria-label={c.nom}
              onBlur={(e) => { const v = e.target.value.trim(); if (v) up((d) => { const x = d.creneaux.find((y) => y.id === c.id); if (x) x.nom = v; }); }} />
            <button className="have-btn" style={{ minWidth: 86 }}
              onClick={() => up((d) => { const x = d.creneaux.find((y) => y.id === c.id); if (x) x.portee = x.portee === "semaine" ? "jour" : "semaine"; })}>
              {c.portee === "semaine" ? "semaine" : "chaque jour"}
            </button>
            <button className="icon-btn" aria-label={`Supprimer ${c.nom}`}
              onClick={() => up((d) => { d.creneaux = d.creneaux.filter((x) => x.id !== c.id); d.repas = d.repas.filter((r) => r.creneauId !== c.id); })}>
              <Ic d={IcTrash} s={17} />
            </button>
          </div>
        ))}
        <div className="line">
          <input className="inline-in" value={nv} placeholder="Nouveau créneau (brunch…)"
            onChange={(e) => setNv(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ajouter(); }} />
          <button className="btn sm" disabled={!nv.trim()} onClick={ajouter}>Ajouter</button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>
        « Chaque jour » donne une ligne dans la grille de la semaine. « Semaine » regroupe tout en vrac, sans jour précis —
        pratique pour le petit déjeuner, le goûter ou l'apéro.
      </p>
    </>
  );
}

function ListeEditable({ titre, items, onAdd, onDel, onRename, placeholder, note }) {
  const [nv, setNv] = useState("");
  const ajouter = () => { if (nv.trim()) { onAdd(nv.trim()); setNv(""); } };
  return (
    <>
      <h3 className="sec">{titre}</h3>
      <div className="card">
        {items.map((it) => (
          <div key={it.key} className="line">
            {it.dot && <span style={{ width: 10, height: 10, borderRadius: 3, background: it.dot, flex: "none" }} />}
            <input className="lbl inline-in" defaultValue={it.nom}
              onBlur={(e) => onRename(it, e.target.value)} aria-label={it.nom} />
            <button className="icon-btn" onClick={() => onDel(it)} aria-label={`Supprimer ${it.nom}`}><Ic d={IcTrash} s={17} /></button>
          </div>
        ))}
        <div className="line">
          <input className="inline-in" value={nv} placeholder={placeholder}
            onChange={(e) => setNv(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ajouter(); }} />
          <button className="btn sm" disabled={!nv.trim()} onClick={ajouter}>Ajouter</button>
        </div>
      </div>
      {note && <p className="muted" style={{ fontSize: 12.5, margin: "7px 0 0" }}>{note}</p>}
    </>
  );
}

/* ============================ Feuilles d'édition ============================ */
function SheetPlat({ ctx, plat }) {
  const { db, up, setSheet, flash, ingOf } = ctx;
  const [f, setF] = useState(() => plat ? structuredClone(plat)
    : { id: uid(), nom: "", cat: db.categories.includes("plat") ? "plat" : db.categories[0], saison: "toute", tags: [], portions: 4, lignes: [] });
  const maj = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const addIng = (ing) => setF((x) => ({ ...x, lignes: [...x.lignes, { id: uid(), ingId: ing.id, qte: 1, unite: ing.unite }] }));
  const creerIng = (nom) => {
    const ni = { id: uid(), nom, rayonId: db.rayons[0].id, unite: "", garde: false };
    up((d) => d.ingredients.push(ni));
    addIng(ni);
  };
  const save = () => {
    if (!f.nom.trim()) return;
    up((d) => {
      const i = d.plats.findIndex((p) => p.id === f.id);
      if (i >= 0) d.plats[i] = f; else d.plats.push(f);
    });
    setSheet(null);
    flash(plat ? "Plat mis à jour" : "Plat ajouté à la bibliothèque");
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${plat.nom} » ? Il sera aussi retiré des menus.`)) return;
    up((d) => {
      d.plats = d.plats.filter((p) => p.id !== plat.id);
      d.repas.forEach((r) => { r.platIds = r.platIds.filter((x) => x !== plat.id); });
      d.repas = d.repas.filter((r) => r.platIds.length);
    });
    setSheet(null);
  };

  return (
    <Sheet title={plat ? plat.nom : "Nouveau plat"} sub={plat ? "Modifier le plat" : "Bibliothèque"} onClose={() => setSheet(null)}
      actions={<>
        {plat && <button className="btn danger" onClick={supprimer} aria-label="Supprimer le plat"><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" onClick={save} disabled={!f.nom.trim()}>Enregistrer</button>
      </>}>
      <label className="f"><span>Nom du plat</span>
        <input value={f.nom} onChange={(e) => maj("nom", e.target.value)} placeholder="Gratin de courgettes" /></label>

      <div className="row">
        <label className="f" style={{ flex: 1 }}><span>Catégorie</span>
          <select value={f.cat} onChange={(e) => maj("cat", e.target.value)}>
            {db.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></label>
        <label className="f" style={{ width: 122 }}><span>Recette pour</span>
          <input type="number" min="1" value={f.portions} onChange={(e) => maj("portions", Math.max(1, +e.target.value || 1))} /></label>
      </div>

      <label className="f"><span>Saison</span></label>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {SAISONS.map((sa) => (
          <button key={sa.id} className="chip" data-on={(f.saison || "toute") === sa.id ? 1 : 0}
            onClick={() => maj("saison", sa.id)}>{sa.nom}</button>
        ))}
      </div>

      <label className="f"><span>Tags</span></label>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {db.tags.map((t) => (
          <button key={t} className="chip" data-on={f.tags.includes(t) ? 1 : 0}
            onClick={() => maj("tags", f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])}>{t}</button>
        ))}
      </div>

      <label className="f"><span>Ingrédients — {f.lignes.length}</span></label>
      <IngredientCombo ingredients={db.ingredients} onPick={addIng} onCreate={creerIng} />
      {f.lignes.map((l) => (
        <div key={l.id} className="ing-row">
          <span className="nm">{ingOf(l.ingId)?.nom || "Ingrédient supprimé"}</span>
          <input type="number" min="0" step="any" value={l.qte} aria-label="Quantité"
            onChange={(e) => maj("lignes", f.lignes.map((x) => x.id === l.id ? { ...x, qte: +e.target.value } : x))} />
          <select value={l.unite} aria-label="Unité"
            onChange={(e) => maj("lignes", f.lignes.map((x) => x.id === l.id ? { ...x, unite: e.target.value } : x))}>
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Retirer l'ingrédient"
            onClick={() => maj("lignes", f.lignes.filter((x) => x.id !== l.id))}><Ic d={IcX} s={16} /></button>
        </div>
      ))}
      {!f.lignes.length && <p className="muted" style={{ fontSize: 13 }}>Sans ingrédients, ce plat n'alimentera pas la liste de courses.</p>}
      <p className="muted" style={{ fontSize: 12.5 }}>Les quantités valent pour {f.portions} parts. Elles seront ajustées au nombre de convives.</p>
    </Sheet>
  );
}

function AjoutAjustement({ personnes, ingredients, onAdd }) {
  const [ouvert, setOuvert] = useState(false);
  const [a, setA] = useState({ personneId: "", type: "add", ingId: "", ingNom: "", qte: 100, unite: "g" });
  if (!personnes.length) return <p className="muted" style={{ fontSize: 13 }}>Choisissez d'abord des convives.</p>;
  if (!ouvert) {
    return <button className="btn flat sm" style={{ width: "100%", marginTop: 9 }}
      onClick={() => { setA({ personneId: personnes[0].id, type: "add", ingId: "", ingNom: "", qte: 100, unite: "g" }); setOuvert(true); }}>
      + Ajustement pour une personne
    </button>;
  }
  return (
    <div className="card" style={{ padding: 12, marginTop: 9 }}>
      <div className="row">
        <select value={a.personneId} onChange={(e) => setA({ ...a, personneId: e.target.value })} aria-label="Personne">
          {personnes.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
        <select value={a.type} onChange={(e) => setA({ ...a, type: e.target.value })} style={{ width: 132 }} aria-label="Type">
          <option value="add">ajouter</option>
          <option value="remove">retirer</option>
        </select>
      </div>
      <div style={{ marginTop: 8 }}>
        <IngredientCombo ingredients={ingredients} placeholder={a.ingNom || "Quel ingrédient ?"}
          onPick={(i) => setA({ ...a, ingId: i.id, ingNom: i.nom, unite: i.unite })} />
      </div>
      {a.type === "add" && (
        <div className="row" style={{ marginTop: 8 }}>
          <input type="number" min="0" step="any" value={a.qte} aria-label="Quantité"
            onChange={(e) => setA({ ...a, qte: +e.target.value })} />
          <select value={a.unite} onChange={(e) => setA({ ...a, unite: e.target.value })} style={{ width: 112 }} aria-label="Unité">
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select>
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: "9px 0 0" }}>
        {a.type === "add"
          ? "La quantité s'ajoute à la liste de courses."
          : "Retiré de l'assiette seulement : l'ingrédient reste aux courses s'il sert aux autres."}
      </p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn flat sm" style={{ flex: 1 }} onClick={() => setOuvert(false)}>Annuler</button>
        <button className="btn sm" style={{ flex: 1 }} disabled={!a.ingId}
          onClick={() => { onAdd({ id: uid(), personneId: a.personneId, type: a.type, ingId: a.ingId, qte: a.type === "add" ? a.qte : 0, unite: a.unite }); setOuvert(false); }}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

function SheetRepas({ ctx, ui, setUi, date: date0, creneauId: cren0 }) {
  const { db, up, setSheet, ingOf, platOf, persOf, derniereFois } = ctx;
  const [date, setDate] = useState(date0);
  const [creneauId, setCreneauId] = useState(cren0);
  const [q, setQ] = useState("");
  const [catF, setCatF] = useState("tous");
  const [tagF, setTagF] = useState("tous");
  const [idee, setIdee] = useState(false);
  const [details, setDetails] = useState(false);
  const sel = ui?.sel || [];

  const cren = db.creneaux.find((c) => c.id === creneauId);
  const hebdo = cren?.portee === "semaine";
  const famille = db.creneaux.filter((c) => (c.portee === "semaine") === hebdo);
  const r = db.repas.find((x) => x.date === date && x.creneauId === creneauId);
  const platIds = r?.platIds || [];
  const convives = r?.convives || db.personnes.map((p) => p.id);
  const ajust = r?.ajust || [];
  const fois = hebdo ? (r?.repetitions || 1) : 1;
  const d = parseISO(date);

  /* Tout est écrit au fil de l'eau : pas de bouton Enregistrer, pas de confirmation au changement de jour */
  const maj = (fn) => up((dd) => {
    let rr = dd.repas.find((x) => x.date === date && x.creneauId === creneauId);
    if (!rr) {
      rr = { id: uid(), date, creneauId, platIds: [], convives: dd.personnes.map((p) => p.id), repetitions: 1, ajust: [] };
      dd.repas.push(rr);
    }
    fn(rr);
    dd.repas = dd.repas.filter((x) => x.platIds.length);
  });

  const ajouter = (pid) => maj((rr) => { if (!rr.platIds.includes(pid)) rr.platIds.push(pid); });
  const retirer = (pid) => maj((rr) => { rr.platIds = rr.platIds.filter((x) => x !== pid); });
  const deplacer = (i, dir) => maj((rr) => {
    const j = i + dir;
    if (j < 0 || j >= rr.platIds.length) return;
    [rr.platIds[i], rr.platIds[j]] = [rr.platIds[j], rr.platIds[i]];
  });
  const ranger = () => maj((rr) => {
    const rang = (pid) => { const k = db.categories.indexOf(platOf(pid)?.cat); return k < 0 ? 99 : k; };
    rr.platIds.sort((a, b) => rang(a) - rang(b));
  });

  /* Filtres de la bibliothèque */
  const cats = ["tous", ...db.categories];
  const dispo = db.plats
    .filter((p) => !platIds.includes(p.id)
      && (catF === "tous" || p.cat === catF)
      && (tagF === "tous" || p.tags.includes(tagF))
      && (!q || p.nom.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || "") || a.nom.localeCompare(b.nom));

  const liste = (idee && sel.length)
    ? dispo.map((p) => {
      const ids = p.lignes.map((l) => l.ingId);
      const ok = sel.filter((x) => ids.includes(x)).length;
      const manque = p.lignes.filter((l) => !sel.includes(l.ingId) && !ingOf(l.ingId)?.garde).length;
      return { ...p, _ok: ok, _manque: manque };
    }).filter((p) => p._ok > 0).sort((a, b) => a._manque - b._manque || b._ok - a._ok)
    : dispo;

  /* Balayages : sur la date pour changer de jour, sur la liste pour changer de catégorie */
  const geste = useRef({ x: 0, y: 0, actif: false });
  const glisse = (surFin) => ({
    onPointerDown: (e) => { geste.current = { x: e.clientX, y: e.clientY, actif: true }; },
    onPointerMove: (e) => {
      const g = geste.current;
      if (g.actif && Math.abs(e.clientY - g.y) > Math.abs(e.clientX - g.x) + 10) g.actif = false;
    },
    onPointerUp: (e) => {
      const g = geste.current;
      if (!g.actif) return;
      g.actif = false;
      const dx = e.clientX - g.x;
      if (Math.abs(dx) > 50) surFin(dx > 0 ? -1 : 1);
    },
  });
  const glisseJour = glisse((s) => setDate(iso(addJ(d, s))));
  const glisseCat = glisse((s) => {
    const i = cats.indexOf(catF);
    setCatF(cats[(i + s + cats.length) % cats.length]);
  });
  const nomCat = catF === "tous" ? "Toutes catégories" : catF[0].toUpperCase() + catF.slice(1);

  const entete = (
    <>
      {!hebdo && (
        <div className="nav-jour" {...glisseJour}>
          <button className="icon-btn" aria-label="Jour précédent" onClick={() => setDate(iso(addJ(d, -1)))}><Ic d={IcL} s={18} /></button>
          <span>{jourDe(d)}</span>
          <button className="icon-btn" aria-label="Jour suivant" onClick={() => setDate(iso(addJ(d, 1)))}><Ic d={IcR} s={18} /></button>
        </div>
      )}
      <div className="segm">
        {famille.map((c) => (
          <button key={c.id} data-on={c.id === creneauId ? 1 : 0} onClick={() => setCreneauId(c.id)}>{c.nom}</button>
        ))}
      </div>
    </>
  );

  return (
    <Sheet plein entete={entete} title={hebdo ? cren.nom : (cren?.nom || "Repas")}
      sub={hebdo ? "En vrac pour la semaine" : "Composer le repas"} onClose={() => setSheet(null)}
      actions={<>
        {platIds.length > 0 && <button className="btn danger" aria-label="Vider ce repas"
          onClick={() => maj((rr) => { rr.platIds = []; })}><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" onClick={() => setSheet(null)}>Terminé</button>
      </>}>

      {hebdo && (
        <div className="stepper" style={{ marginTop: 12 }}>
          <button className="icon-btn" disabled={fois <= 1} aria-label="Moins"
            onClick={() => maj((rr) => { rr.repetitions = Math.max(1, (rr.repetitions || 1) - 1); })}><Ic d={IcMoins} s={18} /></button>
          <span><b>{fois}</b> fois dans la semaine</span>
          <button className="icon-btn" aria-label="Plus"
            onClick={() => maj((rr) => { rr.repetitions = Math.min(21, (rr.repetitions || 1) + 1); })}><Ic d={IcPlus} s={18} /></button>
        </div>
      )}

      {platIds.length > 0 ? platIds.map((pid, i) => {
        const p = platOf(pid);
        if (!p) return null;
        const coef = (convives.length && p.portions ? convives.length / p.portions : 1) * fois;
        return (
          <div key={pid} className="au-menu">
            <span className="ordre">{i + 1}</span>
            <span className="nm">
              <span style={{ fontFamily: "var(--display)", fontSize: 16.5 }}>{p.nom}</span>
              <span className="qty" style={{ display: "block", fontSize: 11.5 }}>
                {p.cat} · ×{fmtQ(coef)} de la recette
              </span>
            </span>
            {platIds.length > 1 && (
              <span className="reorder">
                <button className="icon-btn mini" disabled={i === 0} aria-label={`Monter ${p.nom}`} onClick={() => deplacer(i, -1)}><Ic d={IcUp} s={15} /></button>
                <button className="icon-btn mini" disabled={i === platIds.length - 1} aria-label={`Descendre ${p.nom}`} onClick={() => deplacer(i, 1)}><Ic d={IcDown} s={15} /></button>
              </span>
            )}
            <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label={`Retirer ${p.nom}`} onClick={() => retirer(pid)}><Ic d={IcX} s={16} /></button>
          </div>
        );
      }) : <p className="muted" style={{ fontSize: 13, margin: "12px 0 0" }}>Rien de prévu — choisissez un plat ci-dessous.</p>}

      {platIds.length > 1 && !hebdo && (
        <button className="btn flat sm" style={{ marginTop: 8 }} onClick={ranger}><Ic d={IcSort} s={16} />Ranger dans l'ordre du service</button>
      )}

      <button className="repli" onClick={() => setDetails(!details)}>
        <span>{convives.length} couvert{convives.length > 1 ? "s" : ""}
          {convives.length < db.personnes.length && ` · ${convives.map((u) => persOf(u)?.nom).filter(Boolean).join(", ")}`}
          {ajust.length > 0 && ` · ${ajust.length} ajustement${ajust.length > 1 ? "s" : ""}`}</span>
        <span className="muted" style={{ display: "grid", transform: details ? "rotate(90deg)" : "none" }}><Ic d={IcR} s={17} /></span>
      </button>

      {details && (
        <>
          <div className="chips-wrap" style={{ marginTop: 4 }}>
            {db.personnes.map((p) => (
              <button key={p.id} className="chip sm" data-on={convives.includes(p.id) ? 1 : 0}
                onClick={() => maj((rr) => {
                  rr.convives = rr.convives.includes(p.id) ? rr.convives.filter((y) => y !== p.id) : [...rr.convives, p.id];
                })}>
                {p.nom} <span style={{ opacity: .6, fontSize: 11, marginLeft: 4 }}>{p.regime}</span>
              </button>
            ))}
          </div>
          {ajust.map((a) => (
            <div key={a.id} className="au-menu">
              <span className="nm" style={{ fontSize: 14 }}>
                <b style={{ color: a.type === "add" ? "var(--vert)" : "#8E2F2F" }}>{a.type === "add" ? "+" : "−"}</b>{" "}
                {ingOf(a.ingId)?.nom} <span className="muted">pour {persOf(a.personneId)?.nom}</span>
                <span className="qty" style={{ display: "block", fontSize: 11.5 }}>
                  {a.type === "add" ? `${fmtQ(a.qte)} ${a.unite} ajoutés aux courses` : "retiré de l'assiette, gardé aux courses"}
                </span>
              </span>
              <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Retirer l'ajustement"
                onClick={() => maj((rr) => { rr.ajust = rr.ajust.filter((y) => y.id !== a.id); })}><Ic d={IcX} s={16} /></button>
            </div>
          ))}
          <AjoutAjustement personnes={db.personnes.filter((p) => convives.includes(p.id))} ingredients={db.ingredients}
            onAdd={(a) => maj((rr) => { rr.ajust = [...(rr.ajust || []), a]; })} />
        </>
      )}

      <div className="picker">
        <input placeholder="Chercher un plat…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="picker-filtres">
          <select value={tagF} onChange={(e) => setTagF(e.target.value)} aria-label="Régime">
            <option value="tous">Tous régimes</option>
            {db.tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className={"idee-btn" + (idee ? " on" : "")} aria-label="Avec ce que j'ai"
            aria-pressed={idee} onClick={() => setIdee(!idee)}><Ic d={IcIdee} s={19} /></button>
        </div>

        {idee && (
          <div className="picker-idee">
            <IngredientCombo ingredients={db.ingredients.filter((i) => !sel.includes(i.id))}
              placeholder="J'ai sous la main…" onPick={(i) => setUi({ sel: [...sel, i.id] })} />
            {sel.length > 0 ? (
              <div className="chips-wrap" style={{ marginTop: 8 }}>
                {sel.map((id) => (
                  <button key={id} className="chip sm" data-on="1" onClick={() => setUi({ sel: sel.filter((x) => x !== id) })}>
                    {ingOf(id)?.nom} ✕
                  </button>
                ))}
              </div>
            ) : <p className="muted" style={{ fontSize: 12.5, margin: "8px 0 0" }}>Ajoutez ce que vous avez sous la main.</p>}
          </div>
        )}

        <div className="nav-cat">
          <button className="icon-btn" aria-label="Catégorie précédente"
            onClick={() => setCatF(cats[(cats.indexOf(catF) - 1 + cats.length) % cats.length])}><Ic d={IcL} s={16} /></button>
          <span>{nomCat} <em>{liste.length}</em></span>
          <button className="icon-btn" aria-label="Catégorie suivante"
            onClick={() => setCatF(cats[(cats.indexOf(catF) + 1) % cats.length])}><Ic d={IcR} s={16} /></button>
        </div>

        <div {...glisseCat} style={{ touchAction: "pan-y" }}>
          {liste.map((p) => {
            const dd = derniereFois[p.id];
            const j = dd ? joursDepuis(dd) : null;
            return (
              <button key={p.id} className="p-row" style={{ width: "100%" }} onClick={() => { ajouter(p.id); setQ(""); }}>
                <span className="p-nom" style={{ padding: "9px 0" }}>
                  <h4>{p.nom}</h4>
                  <span className="p-meta">
                    {p._manque !== undefined
                      ? (p._manque === 0 ? `${p._ok} sur place · rien ne manque` : `${p._ok} sur place · ${p._manque} manquant${p._manque > 1 ? "s" : ""}`)
                      : [p.cat, p.saison && p.saison !== "toute" ? nomSaison(p.saison).toLowerCase() : null, ...p.tags,
                        j !== null && j >= 0 && j <= 10 ? (j === 0 ? "fait aujourd'hui" : `fait il y a ${j} j`) : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="muted"><Ic d={IcPlus} s={18} /></span>
              </button>
            );
          })}
          {!liste.length && (
            <div style={{ padding: "14px 0" }}>
              <span className="muted" style={{ fontSize: 14 }}>Aucun plat ici.</span>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn flat sm" onClick={() => { setCatF("tous"); setTagF("tous"); setQ(""); setIdee(false); }}>Tout afficher</button>
                <button className="btn sm" onClick={() => setSheet({ t: "plat", plat: null })}>Créer un plat</button>
              </div>
            </div>
          )}
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "14px 0 0" }}>
          Balayez la date pour changer de jour, la liste pour changer de catégorie. Tout est enregistré au fur et à mesure.
        </p>
      </div>
    </Sheet>
  );
}

function SheetIngredient({ ctx, ing }) {
  const { db, up, setSheet } = ctx;
  const [f, setF] = useState(() => ing ? { ...ing } : { id: uid(), nom: "", rayonId: db.rayons[0].id, unite: "", garde: false });
  const supprimer = () => {
    if (db.plats.some((p) => p.lignes.some((l) => l.ingId === ing.id))) {
      alert("Cet ingrédient est utilisé dans au moins un plat. Retirez-le des plats avant de le supprimer.");
      return;
    }
    up((d) => { d.ingredients = d.ingredients.filter((i) => i.id !== ing.id); });
    setSheet(null);
  };
  return (
    <Sheet title={ing ? ing.nom : "Nouvel ingrédient"} sub="Ingrédient" onClose={() => setSheet(null)}
      actions={<>
        {ing && <button className="btn danger" onClick={supprimer} aria-label="Supprimer"><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" disabled={!f.nom.trim()} onClick={() => {
          up((d) => { const i = d.ingredients.findIndex((x) => x.id === f.id); if (i >= 0) d.ingredients[i] = f; else d.ingredients.push(f); });
          setSheet(null);
        }}>Enregistrer</button>
      </>}>
      <label className="f"><span>Nom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Courgette" /></label>
      <label className="f"><span>Rayon</span>
        <select value={f.rayonId} onChange={(e) => setF({ ...f, rayonId: e.target.value })}>
          {db.rayons.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select></label>
      <label className="f"><span>Unité par défaut</span>
        <select value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })}>
          {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
        </select></label>
      <div style={{ marginTop: 10, borderTop: "1px solid var(--line)" }}>
        <Switch on={f.garde} onChange={(v) => setF({ ...f, garde: v })}
          label="Garde-manger permanent" hint="Toujours en stock : jamais listé dans les courses" />
      </div>
    </Sheet>
  );
}

function SheetPersonne({ ctx, pers }) {
  const { db, up, setSheet } = ctx;
  const [f, setF] = useState(() => pers ? { ...pers } : { id: uid(), nom: "", regime: "standard", notes: "" });
  return (
    <Sheet title={pers ? pers.nom : "Nouvelle personne"} sub="Foyer" onClose={() => setSheet(null)}
      actions={<>
        {pers && db.personnes.length > 1 && <button className="btn danger" aria-label="Supprimer" onClick={() => {
          up((d) => {
            d.personnes = d.personnes.filter((p) => p.id !== pers.id);
            d.repas.forEach((r) => {
              r.convives = r.convives.filter((c) => c !== pers.id);
              r.ajust = (r.ajust || []).filter((a) => a.personneId !== pers.id);
            });
          });
          setSheet(null);
        }}><Ic d={IcTrash} s={17} /></button>}
        <button className="btn" disabled={!f.nom.trim()} onClick={() => {
          up((d) => { const i = d.personnes.findIndex((p) => p.id === f.id); if (i >= 0) d.personnes[i] = f; else d.personnes.push(f); });
          setSheet(null);
        }}>Enregistrer</button>
      </>}>
      <label className="f"><span>Prénom</span><input value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Léa" /></label>
      <label className="f"><span>Régime par défaut</span>
        <select value={f.regime} onChange={(e) => setF({ ...f, regime: e.target.value })}>
          {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select></label>
      <label className="f"><span>Notes</span>
        <textarea rows="3" value={f.notes} placeholder="Allergies, préférences…" onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
      <p className="muted" style={{ fontSize: 12.5 }}>Le régime se pré-remplit à la composition d'un repas et reste modifiable à la volée.</p>
    </Sheet>
  );
}

function SheetManuel({ ctx }) {
  const { db, up, setSheet, flash } = ctx;
  const [f, setF] = useState({ libelle: "", qte: 1, unite: "pièce", rayonId: db.rayons[0].id });
  return (
    <Sheet title="Article hors menu" sub="Liste de courses" onClose={() => setSheet(null)}
      actions={<button className="btn" disabled={!f.libelle.trim()} onClick={() => {
        up((d) => d.manuels.push({ id: uid(), ...f, libelle: f.libelle.trim(), etat: "todo" }));
        setSheet(null); flash("Ajouté à la liste");
      }}>Ajouter à la liste</button>}>
      <label className="f"><span>Article</span>
        <input value={f.libelle} onChange={(e) => setF({ ...f, libelle: e.target.value })} placeholder="Sacs poubelle, éponges…" /></label>
      <div className="row">
        <label className="f" style={{ width: 110 }}><span>Quantité</span>
          <input type="number" min="0" step="any" value={f.qte} onChange={(e) => setF({ ...f, qte: +e.target.value })} /></label>
        <label className="f" style={{ flex: 1 }}><span>Unité</span>
          <select value={f.unite} onChange={(e) => setF({ ...f, unite: e.target.value })}>
            {UNITES.map((u) => <option key={u || "sans"} value={u}>{u || "— sans unité"}</option>)}
          </select></label>
      </div>
      <label className="f"><span>Rayon</span>
        <select value={f.rayonId} onChange={(e) => setF({ ...f, rayonId: e.target.value })}>
          {db.rayons.map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </select></label>
    </Sheet>
  );
}

const TRIS = [
  { id: "az", nom: "Nom, A → Z" },
  { id: "za", nom: "Nom, Z → A" },
  { id: "recent", nom: "Ajouté récemment" },
  { id: "ancien", nom: "Ajouté en premier" },
  { id: "oublies", nom: "Pas cuisiné depuis longtemps" },
];

/* ============================ Écran : bibliothèque ============================ */
function EcranPlats({ ctx, ui, setUi }) {
  const { db, setSheet, derniereFois } = ctx;
  const { q, cat } = ui;
  const tri = ui.tri || "az";
  const rang = (p) => db.plats.indexOf(p);

  const liste = db.plats
    .filter((p) => (cat === "tous" || p.cat === cat) && (!q || p.nom.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => {
      if (tri === "za") return b.nom.localeCompare(a.nom);
      if (tri === "recent") return rang(b) - rang(a);
      if (tri === "ancien") return rang(a) - rang(b);
      if (tri === "oublies") return (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || "") || a.nom.localeCompare(b.nom);
      return a.nom.localeCompare(b.nom);
    });

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{db.plats.length} plats · {(TRIS.find((t) => t.id === tri) || TRIS[0]).nom}</div>
          <Logo height={26} style={{ color: "var(--aubergine)", marginTop: 5 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button className="icon-btn" aria-label="Trouver une idée" onClick={() => setSheet({ t: "inverse" })}>
            <Ic d={IcIdee} s={20} />
          </button>
          <button className="icon-btn" aria-label="Trier" onClick={() => setSheet({ t: "tri" })}><Ic d={IcTri} s={20} /></button>
          <button className="btn rond" aria-label="Nouveau plat" onClick={() => setSheet({ t: "plat", plat: null })}>
            <Ic d={IcPlus} s={20} />
          </button>
        </div>
      </header>

      <div className="pad" style={{ paddingTop: 12 }}>
        <input placeholder="Chercher un plat…" value={q} onChange={(e) => setUi({ q: e.target.value })} />
        <div className="chips-wrap">
          <button className="chip sm" data-on={cat === "tous" ? 1 : 0} onClick={() => setUi({ cat: "tous" })}>Tout</button>
          {db.categories.map((c) => (
            <button key={c} className="chip sm" data-on={cat === c ? 1 : 0} onClick={() => setUi({ cat: c })}>
              {c[0].toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {!liste.length ? (
          <div className="empty">
            <p>Aucun plat ici. Ajoutez-en un pour commencer votre bibliothèque.</p>
            <button className="btn" onClick={() => setSheet({ t: "plat", plat: null })}>Créer un plat</button>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            {liste.map((p) => {
              const d = derniereFois[p.id];
              const j = d ? joursDepuis(d) : null;
              const infos = [
                p.cat,
                `${p.lignes.length} ingr.`,
                `${p.portions} parts`,
                p.saison && p.saison !== "toute" ? nomSaison(p.saison).toLowerCase() : null,
                ...p.tags,
                j !== null && j >= 0 && j <= 10 ? (j === 0 ? "fait aujourd'hui" : `fait il y a ${j} j`) : null,
              ].filter(Boolean);
              return (
                <div key={p.id} className="p-row">
                  <button className="p-nom" onClick={() => setSheet({ t: "plat", plat: p })}>
                    <h4>{p.nom}</h4>
                    <span className="p-meta">{infos.join(" · ")}</span>
                  </button>
                  <button className="icon-btn" aria-label={`Actions sur ${p.nom}`}
                    onClick={() => setSheet({ t: "actions-plat", plat: p })}><Ic d={IcPoints} s={19} /></button>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </>
  );
}

const couleurDe = (db, cat) => {
  const k = db.categories.indexOf(cat);
  return k < 0 ? "#8A9A90" : CAT_COULEURS[k % CAT_COULEURS.length];
};
const teinteDe = (db, cat) => { const c = couleurDe(db, cat); return { background: c + "1F", color: c }; };

/* Mini-calendrier de placement : on voit ce qui existe déjà avant de poser */
function MiniCalendrier({ ctx, onPose }) {
  const { db, semaine, platOf } = ctx;
  const [sem, setSem] = useState(() => {
    const l = lundi(new Date());
    return semaine > l ? new Date(semaine) : l;
  });
  const jrs = Array.from({ length: 7 }, (_, i) => addJ(sem, i));
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const auj = iso(new Date());
  const f = addJ(sem, 6);
  const titre = sem.getMonth() === f.getMonth()
    ? `${sem.getDate()} – ${f.getDate()} ${MOIS[f.getMonth()]}`
    : `${sem.getDate()} ${MOIS[sem.getMonth()].slice(0, 4)}. – ${f.getDate()} ${MOIS[f.getMonth()].slice(0, 4)}.`;

  return (
    <div className="minical">
      <div className="minical-nav">
        <button className="icon-btn" aria-label="Semaine précédente" onClick={() => setSem(addJ(sem, -7))}><Ic d={IcL} s={18} /></button>
        <span className="eyebrow">{titre}</span>
        <button className="icon-btn" aria-label="Semaine suivante" onClick={() => setSem(addJ(sem, 7))}><Ic d={IcR} s={18} /></button>
      </div>
      <div className="g-jours" style={{ position: "static" }}>
        {jrs.map((d) => (
          <span key={iso(d)} className={"g-day" + (iso(d) === auj ? " on" : "")}>
            <b>{DOW[(d.getDay() + 6) % 7]}</b><i>{d.getDate()}</i>
          </span>
        ))}
      </div>
      {creneauxJour.map((c) => (
        <div key={c.id}>
          <div className="g-cren" style={{ margin: "8px 0 3px 2px" }}>{c.nom}</div>
          <div className="g-row">
            {jrs.map((d) => {
              const date = iso(d);
              const r = db.repas.find((x) => x.date === date && x.creneauId === c.id && x.platIds.length);
              const ecart = Math.round((parseISO(date) - new Date().setHours(0, 0, 0, 0)) / 86400000);
              const nom = c.nom.toLowerCase();
              const libelle = ecart === 0 ? `ce ${nom}` : ecart === 1 ? `demain ${nom}`
                : `${DOW[(d.getDay() + 6) % 7]}. ${d.getDate()} ${nom}`;
              return (
                <button key={date} className={"g-cell" + (date === auj ? " on" : "")} aria-label={libelle}
                  onClick={() => onPose({ date, creneauId: c.id, libelle, occupe: !!r })}>
                  {r ? r.platIds.map((pid) => {
                    const p = platOf(pid);
                    return p ? <span key={pid} className="bloc-plat" style={teinteDe(db, p.cat)}>{p.nom}</span> : null;
                  }) : <span className="g-vide">+</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>
        Touchez une case libre, ou une case occupée pour y ajouter le plat.
      </p>
    </div>
  );
}

function SheetInverse({ ctx, ui, setUi }) {
  const { db, up, setSheet, semaine, flash, ingOf } = ctx;
  const sel = ui.sel || [];
  const set = (v) => setUi({ sel: v });
  const [ouvert, setOuvert] = useState(null);   // plat dont on choisit le créneau
  const [poses, setPoses] = useState({});       // plat → libellé du créneau où il vient d'être posé

  const frequents = useMemo(() => {
    const n = {};
    db.plats.forEach((p) => p.lignes.forEach((l) => { n[l.ingId] = (n[l.ingId] || 0) + 1; }));
    return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([id]) => ingOf(id))
      .filter((i) => i && !i.garde && !sel.includes(i.id)).slice(0, 8);
  }, [db.plats, sel]);

  const suggestions = useMemo(() => {
    if (!sel.length) return [];
    return db.plats.map((p) => {
      const ids = p.lignes.map((l) => l.ingId);
      const ok = sel.filter((s) => ids.includes(s)).length;
      const manque = p.lignes.filter((l) => !sel.includes(l.ingId) && !ingOf(l.ingId)?.garde);
      return { p, ok, manque };
    }).filter((x) => x.ok > 0).sort((a, b) => a.manque.length - b.manque.length || b.ok - a.ok);
  }, [sel, db.plats]);

  const poser = (platId, slot) => {
    up((d) => {
      const ex = d.repas.find((r) => r.date === slot.date && r.creneauId === slot.creneauId);
      if (ex) { if (!ex.platIds.includes(platId)) ex.platIds.push(platId); }
      else d.repas.push({
        id: uid(), date: slot.date, creneauId: slot.creneauId, platIds: [platId],
        convives: d.personnes.map((p) => p.id), repetitions: 1, ajust: [],
      });
    });
    setPoses((x) => ({ ...x, [platId]: slot.libelle }));
    setOuvert(null);
    flash(`Posé ${slot.libelle}`);
  };

  return (
    <Sheet title="Trouver une idée" sub="Avec ce que j'ai sous la main" onClose={() => setSheet(null)}
      actions={sel.length ? <button className="btn flat" onClick={() => set([])}>Tout retirer</button> : null}>

      <label className="f"><span>J'ai sous la main</span></label>
      <IngredientCombo ingredients={db.ingredients.filter((i) => !sel.includes(i.id))}
        placeholder="Ajouter un ingrédient…" onPick={(i) => set([...sel, i.id])} />

      {sel.length > 0 && (
        <div className="chips-wrap">
          {sel.map((id) => (
            <button key={id} className="chip sm" data-on="1" onClick={() => set(sel.filter((x) => x !== id))}>
              {ingOf(id)?.nom} ✕
            </button>
          ))}
        </div>
      )}

      {frequents.length > 0 && (
        <>
          <label className="f"><span>Les plus utilisés</span></label>
          <div className="chips-wrap" style={{ marginTop: 0 }}>
            {frequents.map((i) => <button key={i.id} className="chip sm" onClick={() => set([...sel, i.id])}>+ {i.nom}</button>)}
          </div>
        </>
      )}

      {sel.length > 0 && (
        <>
          <label className="f"><span>{suggestions.length} plat{suggestions.length > 1 ? "s" : ""} possible{suggestions.length > 1 ? "s" : ""}</span></label>
          {!suggestions.length && <p className="muted" style={{ fontSize: 13 }}>Aucun plat ne contient ces ingrédients.</p>}
          {suggestions.map(({ p, ok, manque }) => (
            <div key={p.id}>
              <div className="p-row">
                <button className="p-nom" onClick={() => setSheet({ t: "plat", plat: p })}>
                  <h4>{p.nom}</h4>
                  <span className="p-meta">
                    {manque.length === 0
                      ? `${ok} sur place · rien ne manque`
                      : `${ok} sur place · manque ${manque.slice(0, 3).map((l) => ingOf(l.ingId)?.nom).join(", ")}${manque.length > 3 ? `, +${manque.length - 3}` : ""}`}
                  </span>
                </button>
                {poses[p.id] ? (
                  <span className="tag ok">{poses[p.id]}</span>
                ) : (
                  <button className="btn ghost sm" onClick={() => setOuvert(ouvert === p.id ? null : p.id)}>
                    {ouvert === p.id ? "Annuler" : "Poser"}
                  </button>
                )}
              </div>
              {ouvert === p.id && <MiniCalendrier ctx={ctx} onPose={(slot) => poser(p.id, slot)} />}
            </div>
          ))}
          {suggestions.length > 0 && (
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              « Poser » ouvre le calendrier : on voit ce qui est déjà prévu avant de choisir. Convives et ajustements se règlent ensuite dans la semaine.
            </p>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ============================ Écran : semaine ============================ */
const CAT_COULEURS = ["#A9651B", "#4C7A2B", "#5C2A46", "#2F6C86", "#7A2E52", "#4D63A8"];

function EcranSemaine({ ctx, ui, setUi }) {
  const { db, setSheet, setTab, semaine, setSemaine, jours, datesSem, courses, platOf, persOf } = ctx;
  const vue = ui.semaineVue || "grille";
  const fin = addJ(semaine, 6);
  const auj = iso(new Date());
  const lundiSem = iso(semaine);
  const libelle = semaine.getMonth() === fin.getMonth()
    ? `${semaine.getDate()} – ${fin.getDate()} ${MOIS[fin.getMonth()]}`
    : `${semaine.getDate()} ${MOIS[semaine.getMonth()].slice(0, 4)}. – ${fin.getDate()} ${MOIS[fin.getMonth()].slice(0, 4)}.`;

  const repasSem = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const creneauxHebdo = db.creneaux.filter((c) => c.portee === "semaine");
  const repasJour = repasSem.filter((r) => creneauxJour.some((c) => c.id === r.creneauId));

  const couleurCat = (cat) => {
    const k = db.categories.indexOf(cat);
    return k < 0 ? "#8A9A90" : CAT_COULEURS[k % CAT_COULEURS.length];
  };
  const teinte = (cat) => { const c = couleurCat(cat); return { background: c + "1F", color: c }; };

  /* --- Balayage horizontal pour changer de semaine (doigt ou souris) --- */
  const drag = useRef({ x: 0, y: 0, actif: false, dist: 0 });
  const [dx, setDx] = useState(0);
  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, actif: true, dist: 0 }; };
  const onMove = (e) => {
    if (!drag.current.actif) return;
    const d = e.clientX - drag.current.x;
    if (Math.abs(e.clientY - drag.current.y) > Math.abs(d) + 8) { drag.current.actif = false; setDx(0); return; }
    drag.current.dist = Math.abs(d);
    setDx(d);
  };
  const onUp = () => {
    if (!drag.current.actif) return;
    drag.current.actif = false;
    if (dx > 55) setSemaine(addJ(semaine, -7));
    else if (dx < -55) setSemaine(addJ(semaine, 7));
    setDx(0);
  };
  const ouvrir = (payload) => { if (drag.current.dist < 8) setSheet(payload); };

  const listePlats = (r, gros) => r.platIds.map((pid) => {
    const p = platOf(pid);
    if (!p) return null;
    return <span key={pid} className={gros ? "bloc-plat gros" : "bloc-plat"} style={teinte(p.cat)}>{p.nom}</span>;
  });

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{repasSem.length} repas</div>
          <h1 className="title">{libelle}</h1>
        </div>
        <div style={{ display: "flex" }}>
          <button className="icon-btn" aria-label="Aller à la semaine en cours"
            style={lundiSem === iso(lundi(new Date())) ? { color: "var(--ink-3)", opacity: .45 } : { color: "var(--aubergine)" }}
            onClick={() => setSemaine(lundi(new Date()))}><Ic d={IcAuj} s={20} /></button>
          <button className="icon-btn" aria-label="Actions sur la semaine"
            onClick={() => setSheet({ t: "actions-semaine" })}><Ic d={IcPoints} s={20} /></button>
          <button className="icon-btn" aria-label="Bilan de la semaine"
            onClick={() => setSheet({ t: "bilan" })}><Ic d={IcStats} s={20} /></button>
          <button className="icon-btn" aria-label={vue === "grille" ? "Passer au détail" : "Passer à la grille"}
            onClick={() => setUi({ semaineVue: vue === "grille" ? "liste" : "grille" })}>
            <Ic d={vue === "grille" ? IcListe : IcGrille} s={20} />
          </button>
        </div>
      </header>

      <div className="swipe" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={dx ? { transform: `translateX(${dx * 0.35}px)` } : undefined}>
        {vue === "grille" ? (
          <div className="grille">
            <div className="g-jours">
              {jours.map((d) => {
                const k = iso(d);
                const we = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <span key={k} className={"g-day" + (k === auj ? " on" : "") + (we ? " we" : "")}>
                    <b>{DOW[(d.getDay() + 6) % 7]}</b><i>{d.getDate()}</i>
                  </span>
                );
              })}
            </div>
            {creneauxJour.map((c) => (
              <div key={c.id}>
                <div className="g-cren">{c.nom}</div>
                <div className="g-row">
                  {jours.map((d) => {
                    const k = iso(d);
                    const r = db.repas.find((x) => x.date === k && x.creneauId === c.id && x.platIds.length);
                    const partiel = r && r.convives.length !== db.personnes.length;
                    return (
                      <button key={k} className={"g-cell" + (k === auj ? " on" : "")}
                        aria-label={`${c.nom}, ${jourDe(d)}`}
                        onClick={() => ouvrir({ t: "repas", date: k, creneauId: c.id, repas: r })}>
                        {r ? <>{listePlats(r, false)}{partiel && <span className="g-pers">{r.convives.length}p</span>}</>
                          : <span className="g-vide">+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="detail">
            {jours.map((d) => {
              const key = iso(d);
              return (
                <div key={key} className={"j-bloc" + (key === auj ? " on" : "")}>
                  <div className="j-tete">
                    <span className="num">{d.getDate()}</span>
                    <span className="dow">{DOW[(d.getDay() + 6) % 7]}</span>
                  </div>
                  {creneauxJour.map((c) => {
                    const r = db.repas.find((x) => x.date === key && x.creneauId === c.id && x.platIds.length);
                    return (
                      <button key={c.id} className="j-slot" onClick={() => ouvrir({ t: "repas", date: key, creneauId: c.id, repas: r })}>
                        <span className="slot-name">{c.nom}</span>
                        <span className="slot-body">
                          {r ? (
                            <>
                              {listePlats(r, true)}
                              <span className="qty" style={{ display: "block", marginTop: 3 }}>
                                {r.convives.length} couvert{r.convives.length > 1 ? "s" : ""}
                                {r.convives.length < db.personnes.length && ` · ${r.convives.map((u) => persOf(u)?.nom).filter(Boolean).join(", ")}`}
                                {(r.ajust || []).length > 0 && ` · ${r.ajust.length} ajustement${r.ajust.length > 1 ? "s" : ""}`}
                              </span>
                            </>
                          ) : <span className="slot-empty">+ Ajouter un plat</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        <div className="hebdo">
          <div className="g-cren" style={{ margin: "0 0 6px 2px" }}>En vrac pour la semaine</div>
          {creneauxHebdo.map((c) => {
            const r = db.repas.find((x) => x.date === lundiSem && x.creneauId === c.id && x.platIds.length);
            return (
              <button key={c.id} className="h-slot" onClick={() => ouvrir({ t: "repas", date: lundiSem, creneauId: c.id, repas: r })}>
                <span className="slot-name">{c.nom}</span>
                <span className="slot-body">
                  {r ? listePlats(r, true) : <span className="slot-empty">+ Prévoir</span>}
                </span>
                {r && <span className="h-fois">×{r.repetitions || 1}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ height: 22 }} />
      </div>
    </>
  );
}

function SheetTri({ ctx, ui, setUi }) {
  const { setSheet } = ctx;
  const tri = ui.tri || "az";
  return (
    <Sheet title="Trier la bibliothèque" sub="Affichage" onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        {TRIS.map((t) => (
          <button key={t.id} className="line" onClick={() => { setUi({ tri: t.id }); setSheet(null); }}>
            <span className="lbl">{t.nom}</span>
            {tri === t.id && <span style={{ color: "var(--vert)" }}><Ic d={IcChk} s={18} /></span>}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function SheetActionsPlat({ ctx, plat }) {
  const { db, up, setSheet, flash } = ctx;
  const dupliquer = () => {
    const copie = structuredClone(plat);
    copie.id = uid();
    copie.nom = `${plat.nom} (copie)`;
    copie.lignes = copie.lignes.map((l) => ({ ...l, id: uid() }));
    up((d) => d.plats.push(copie));
    setSheet({ t: "plat", plat: copie });
    flash("Plat dupliqué");
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${plat.nom} » ? Il sera aussi retiré des menus.`)) return;
    up((d) => {
      d.plats = d.plats.filter((p) => p.id !== plat.id);
      d.repas.forEach((r) => { r.platIds = r.platIds.filter((x) => x !== plat.id); });
      d.repas = d.repas.filter((r) => r.platIds.length);
    });
    setSheet(null);
    flash("Plat supprimé");
  };
  const fois = db.repas.filter((r) => r.platIds.includes(plat.id)).length;
  return (
    <Sheet title={plat.nom} sub={plat.cat} onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        <button className="line" onClick={() => setSheet({ t: "plat", plat })}>
          <span className="muted"><Ic d={IcPen} s={18} /></span><span className="lbl">Modifier</span>
        </button>
        <button className="line" onClick={dupliquer}>
          <span className="muted"><Ic d={IcCopie} s={18} /></span>
          <span className="lbl">Dupliquer<span className="from">Pour une variante sans repartir de zéro</span></span>
        </button>
        <button className="line" onClick={supprimer} style={{ color: "#8E2F2F" }}>
          <span><Ic d={IcTrash} s={18} /></span>
          <span className="lbl">Supprimer{fois > 0 && <span className="from">Posé {fois} fois dans les menus</span>}</span>
        </button>
      </div>
    </Sheet>
  );
}

function SheetActionsSemaine({ ctx }) {
  const { db, up, setSheet, semaine, datesSem, flash } = ctx;
  const nb = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length).length;
  const vider = () => {
    if (!confirm("Vider toute la semaine affichée ?")) return;
    up((d) => { d.repas = d.repas.filter((r) => !datesSem.includes(r.date)); });
    setSheet(null);
    flash("Semaine vidée");
  };
  return (
    <Sheet title="Cette semaine" sub={`${nb} repas`} onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        <button className="line" onClick={() => setSheet({ t: "remplissage" })}>
          <span className="muted"><Ic d={IcMagie} s={18} /></span>
          <span className="lbl">Composer automatiquement<span className="from">Une proposition à ajuster</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "inverse" })}>
          <span className="muted"><Ic d={IcIdee} s={18} /></span>
          <span className="lbl">Trouver une idée<span className="from">Partir de ce qu'on a et poser dans le calendrier</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "copie", sens: "vers" })}>
          <span className="muted"><Ic d={IcCopie} s={18} /></span>
          <span className="lbl">Copier vers une autre semaine<span className="from">Cette semaine sert de modèle</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "copie", sens: "depuis" })}>
          <span className="muted"><Ic d={IcImport} s={18} /></span>
          <span className="lbl">Importer depuis une autre semaine<span className="from">Remplace la semaine affichée</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "presets" })}>
          <span className="muted"><Ic d={IcCal} s={18} /></span>
          <span className="lbl">Importer une semaine type<span className="from">{db.presets.length} modèle{db.presets.length > 1 ? "s" : ""} enregistré{db.presets.length > 1 ? "s" : ""}</span></span>
        </button>
        <button className="line" onClick={() => setSheet({ t: "preset-save" })} disabled={!nb}>
          <span className="muted"><Ic d={IcEtoile} s={18} /></span>
          <span className="lbl">Enregistrer comme semaine type</span>
        </button>
        <button className="line" onClick={vider} style={{ color: "#8E2F2F" }} disabled={!nb}>
          <span><Ic d={IcTrash} s={18} /></span><span className="lbl">Vider la semaine</span>
        </button>
      </div>
    </Sheet>
  );
}

function SheetCopie({ ctx, sens }) {
  const { db, up, setSheet, semaine, jours, datesSem, flash } = ctx;
  const vers = sens === "vers";
  const source = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);

  const semaines = [-3, -2, -1, 1, 2, 3, 4].map((k) => {
    const l = addJ(semaine, k * 7);
    const f = addJ(l, 6);
    const dedans = db.repas.filter((r) => r.platIds.length && r.date >= iso(l) && r.date <= iso(f));
    return {
      k, l,
      libelle: k === 1 ? "Semaine prochaine" : k === -1 ? "Semaine dernière"
        : `${k > 0 ? "Dans" : "Il y a"} ${Math.abs(k)} semaines`,
      dates: `${l.getDate()} – ${f.getDate()} ${MOIS[f.getMonth()]}`,
      nb: dedans.length,
    };
  }).filter((c) => (vers ? true : c.nb > 0));

  const copier = (c) => {
    if (vers) {
      if (c.nb && !confirm(`La semaine du ${c.dates} contient déjà ${c.nb} repas. Ils seront remplacés.`)) return;
    } else if (source.length && !confirm("Les repas de la semaine affichée seront remplacés.")) return;

    up((d) => {
      const decal = vers ? c.k * 7 : -c.k * 7;
      const datesSource = vers ? datesSem : Array.from({ length: 7 }, (_, i) => iso(addJ(c.l, i)));
      const src = d.repas.filter((r) => datesSource.includes(r.date) && r.platIds.length);
      const datesCible = datesSource.map((dt) => iso(addJ(parseISO(dt), decal)));
      d.repas = d.repas.filter((r) => !datesCible.includes(r.date));
      src.forEach((r) => {
        const copie = structuredClone(r);
        copie.id = uid();
        copie.date = iso(addJ(parseISO(r.date), decal));
        d.repas.push(copie);
      });
    });
    setSheet(null);
    flash(vers ? "Semaine copiée" : "Semaine importée");
  };

  return (
    <Sheet title={vers ? "Copier vers…" : "Importer depuis…"}
      sub={vers ? `${source.length} repas à recopier` : "La semaine affichée sera remplacée"}
      onClose={() => setSheet(null)}>
      {vers && !source.length ? (
        <p style={{ fontSize: 14, marginTop: 14 }}>Cette semaine est vide, il n'y a rien à copier.</p>
      ) : !semaines.length ? (
        <p style={{ fontSize: 14, marginTop: 14 }}>Aucune semaine remplie à proximité. Essayez une semaine type.</p>
      ) : (
        <>
          <div className="card" style={{ marginTop: 12 }}>
            {semaines.map((c) => (
              <button key={c.k} className="line" onClick={() => copier(c)}>
                <span className="lbl">{c.libelle}<span className="from">{c.dates}</span></span>
                {c.nb > 0 && <span className={vers ? "tag warn" : "tag"}>{c.nb} repas</span>}
                <span className="muted"><Ic d={IcR} s={18} /></span>
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            Repas quotidiens, créneaux en vrac et ajustements sont recopiés à l'identique.
          </p>
        </>
      )}
    </Sheet>
  );
}

function SheetPresetSave({ ctx }) {
  const { db, up, setSheet, jours, datesSem, flash } = ctx;
  const [nom, setNom] = useState("");
  const source = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const enregistrer = () => {
    const entrees = source.map((r) => {
      const cr = db.creneaux.find((c) => c.id === r.creneauId);
      const jour = cr?.portee === "semaine" ? null : jours.findIndex((j) => iso(j) === r.date);
      return { jour, creneauId: r.creneauId, platIds: [...r.platIds], convives: [...r.convives], repetitions: r.repetitions || 1 };
    });
    up((d) => d.presets.push({ id: uid(), nom: nom.trim() || `Semaine type ${d.presets.length + 1}`, entrees }));
    setSheet(null);
    flash("Semaine type enregistrée");
  };
  return (
    <Sheet title="Enregistrer comme semaine type" sub={`${source.length} repas`} onClose={() => setSheet(null)}
      actions={<button className="btn" onClick={enregistrer} disabled={!source.length}>Enregistrer</button>}>
      <label className="f"><span>Nom du modèle</span>
        <input value={nom} placeholder="Semaine d'hiver, semaine light…" onChange={(e) => setNom(e.target.value)} /></label>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
        Le modèle retient les plats, les convives et les créneaux, mais pas les dates : il se pose ensuite sur n'importe quelle semaine.
      </p>
    </Sheet>
  );
}

function SheetPresets({ ctx }) {
  const { db, up, setSheet, semaine, jours, datesSem, flash } = ctx;
  const lundiSem = iso(semaine);
  const occupee = db.repas.some((r) => datesSem.includes(r.date) && r.platIds.length);

  const appliquer = (pr) => {
    if (occupee && !confirm("Les repas de la semaine affichée seront remplacés.")) return;
    up((d) => {
      d.repas = d.repas.filter((r) => !datesSem.includes(r.date));
      pr.entrees.forEach((e) => {
        d.repas.push({
          id: uid(), date: e.jour == null ? lundiSem : iso(jours[e.jour]), creneauId: e.creneauId,
          platIds: [...e.platIds], convives: [...e.convives], repetitions: e.repetitions || 1, ajust: [],
        });
      });
    });
    setSheet(null);
    flash(`« ${pr.nom} » appliquée`);
  };

  return (
    <Sheet title="Semaines types" sub="Importer un modèle" onClose={() => setSheet(null)}>
      <div className="card" style={{ marginTop: 12 }}>
        {db.presets.map((pr) => (
          <div key={pr.id} className="line">
            <button className="lbl" style={{ textAlign: "left" }} onClick={() => appliquer(pr)}>
              {pr.nom}<span className="from">{pr.entrees.length} repas · poser sur la semaine affichée</span>
            </button>
            <button className="icon-btn" aria-label={`Supprimer ${pr.nom}`}
              onClick={() => up((d) => { d.presets = d.presets.filter((x) => x.id !== pr.id); })}><Ic d={IcTrash} s={17} /></button>
          </div>
        ))}
        {!db.presets.length && (
          <div style={{ padding: 16 }} className="muted">
            Aucune semaine type. Composez une semaine qui vous plaît, puis enregistrez-la depuis le menu de la semaine.
          </div>
        )}
      </div>
    </Sheet>
  );
}

function SheetRemplissage({ ctx }) {
  const { db, up, setSheet, flash, semaine, jours, datesSem, derniereFois, platOf } = ctx;
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const soir = creneauxJour.find((c) => c.id === "c2") || creneauxJour[creneauxJour.length - 1];
  const saisonSem = saisonDe(addJ(semaine, 3));
  const catPrincipale = db.categories.find((c) => c.toLowerCase().startsWith("plat")) || db.categories[0];
  const catEntree = db.categories.find((c) => c.toLowerCase().startsWith("entr"));
  const catDessert = db.categories.find((c) => c.toLowerCase().startsWith("dessert"));

  const [opt, setOpt] = useState({
    creneaux: creneauxJour.map((c) => c.id),
    ecraser: false,
    recents: true,
    saison: true,
    weekend: false,
  });
  const [reglages, setReglages] = useState(false);
  const [prop, setProp] = useState([]);
  const majO = (k, v) => setOpt((o) => ({ ...o, [k]: v }));

  /* Un tirage souple : on préfère, on n'exclut pas. */
  const tirer = (cat, exclus) => {
    let c = db.plats.filter((p) => p.cat === cat && !exclus.has(p.id));
    if (!c.length) c = db.plats.filter((p) => p.cat === cat);
    if (!c.length) return null;
    if (opt.saison) {
      const s = c.filter((p) => !p.saison || p.saison === "toute" || p.saison === saisonSem);
      if (s.length) c = s;
    }
    if (opt.recents && c.length > 2) {
      const tri = [...c].sort((a, b) => (derniereFois[a.id] || "").localeCompare(derniereFois[b.id] || ""));
      c = tri.slice(0, Math.max(2, Math.ceil(tri.length / 2)));
    }
    return c[Math.floor(Math.random() * c.length)];
  };

  const composerLigne = (cs, exclus) => {
    const ids = [];
    const principal = tirer(catPrincipale, exclus);
    if (principal) { ids.push(principal.id); exclus.add(principal.id); }
    if (opt.weekend && cs.weekend && (!soir || cs.creneauId === soir.id)) {
      const e = catEntree ? tirer(catEntree, exclus) : null;
      if (e) { ids.unshift(e.id); exclus.add(e.id); }
      const de = catDessert ? tirer(catDessert, exclus) : null;
      if (de) { ids.push(de.id); exclus.add(de.id); }
    }
    return ids;
  };

  const cases = () => {
    const l = [];
    jours.forEach((d, idx) => {
      opt.creneaux.forEach((cid) => {
        const date = iso(d);
        const pris = db.repas.find((r) => r.date === date && r.creneauId === cid && r.platIds.length);
        if (pris && !opt.ecraser) return;
        l.push({ date, creneauId: cid, weekend: idx >= 5, jour: d });
      });
    });
    return l;
  };

  const composer = () => {
    const exclus = new Set();
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => r.platIds.forEach((p) => exclus.add(p)));
    setProp(cases().map((cs) => ({ ...cs, platIds: composerLigne(cs, exclus) })).filter((x) => x.platIds.length));
  };

  const relancerLigne = (i) => {
    const exclus = new Set();
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => r.platIds.forEach((p) => exclus.add(p)));
    prop.forEach((x, k) => { if (k !== i) x.platIds.forEach((p) => exclus.add(p)); });
    setProp(prop.map((x, k) => (k === i ? { ...x, platIds: composerLigne(x, exclus) } : x)));
  };

  const retirer = (i) => setProp(prop.filter((_, k) => k !== i));

  useEffect(() => { composer(); /* eslint-disable-next-line */ }, [opt]);

  const appliquer = () => {
    up((d) => {
      prop.forEach((x) => {
        d.repas = d.repas.filter((r) => !(r.date === x.date && r.creneauId === x.creneauId));
        d.repas.push({
          id: uid(), date: x.date, creneauId: x.creneauId, platIds: x.platIds,
          convives: d.personnes.map((p) => p.id), repetitions: 1, ajust: [],
        });
      });
    });
    setSheet(null);
    flash(`${prop.length} repas posés`);
  };

  const nomCreneau = (id) => db.creneaux.find((c) => c.id === id)?.nom || "";

  return (
    <Sheet title="Composer la semaine" sub="Proposition" onClose={() => setSheet(null)}
      actions={<>
        <button className="btn flat" onClick={composer}>Relancer</button>
        <button className="btn" onClick={appliquer} disabled={!prop.length}>Poser sur la semaine</button>
      </>}>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        <button className="chip sm" data-on={!opt.ecraser ? 1 : 0} onClick={() => majO("ecraser", false)}>Cases vides</button>
        <button className="chip sm" data-on={opt.ecraser ? 1 : 0} onClick={() => majO("ecraser", true)}>Tout recomposer</button>
        <button className="chip sm" data-on={reglages ? 1 : 0} style={{ marginLeft: "auto" }}
          onClick={() => setReglages(!reglages)}>Réglages</button>
      </div>

      {reglages && (
        <div className="card" style={{ padding: "4px 12px 12px", marginTop: 9 }}>
          <label className="f"><span>Créneaux</span></label>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {creneauxJour.map((c) => (
              <button key={c.id} className="chip sm" data-on={opt.creneaux.includes(c.id) ? 1 : 0}
                onClick={() => majO("creneaux", opt.creneaux.includes(c.id) ? opt.creneaux.filter((x) => x !== c.id) : [...opt.creneaux, c.id])}>
                {c.nom}
              </button>
            ))}
          </div>
          <Switch on={opt.recents} onChange={(v) => majO("recents", v)}
            label="Écarter les plats récents" hint="Pioche d'abord dans ce qu'on n'a pas fait depuis longtemps" />
          <Switch on={opt.saison} onChange={(v) => majO("saison", v)}
            label="Préférer la saison" hint={`Nous sommes en ${saisonSem === "ete" ? "été" : "hiver"}`} />
          <Switch on={opt.weekend} onChange={(v) => majO("weekend", v)}
            label="Entrée et dessert le week-end" hint="Sur le repas du soir, samedi et dimanche" />
        </div>
      )}

      {!prop.length ? (
        <p style={{ fontSize: 14, marginTop: 16 }}>
          Rien à composer : les cases choisies sont déjà remplies. Passez en « Tout recomposer » pour repartir de zéro.
        </p>
      ) : prop.map((x, i) => (
        <div key={x.date + x.creneauId} className="prop-ligne">
          <span className="slot-name">{DOW[(x.jour.getDay() + 6) % 7]} {x.jour.getDate()}</span>
          <span className="slot-body">
            <span className="eyebrow">{nomCreneau(x.creneauId)}</span>
            {x.platIds.map((pid) => (
              <span key={pid} style={{ display: "block", fontFamily: "var(--display)", fontSize: 16 }}>{platOf(pid)?.nom}</span>
            ))}
          </span>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Autre plat" onClick={() => relancerLigne(i)}>
            <Ic d={IcDes} s={17} />
          </button>
          <button className="icon-btn" style={{ width: 34, height: 34 }} aria-label="Laisser vide" onClick={() => retirer(i)}>
            <Ic d={IcX} s={16} />
          </button>
        </div>
      ))}
      {prop.length > 0 && (
        <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
          Le dé change un repas, la croix laisse la case vide. Rien n'est écrit tant que vous n'avez pas posé.
        </p>
      )}
    </Sheet>
  );
}

function SheetBilan({ ctx }) {
  const { db, setSheet, setTab, datesSem, courses, platOf } = ctx;
  const repasSem = db.repas.filter((r) => datesSem.includes(r.date) && r.platIds.length);
  const creneauxJour = db.creneaux.filter((c) => c.portee !== "semaine");
  const repasJour = repasSem.filter((r) => creneauxJour.some((c) => c.id === r.creneauId));
  const vege = repasJour.filter((r) => r.platIds.every((p) => platOf(p)?.tags.includes("végétarien"))).length;
  const compte = {};
  repasJour.forEach((r) => r.platIds.forEach((p) => { compte[p] = (compte[p] || 0) + 1; }));
  const repetes = Object.entries(compte).filter(([, n]) => n > 1)
    .map(([id, n]) => ({ nom: platOf(id)?.nom, n })).filter((x) => x.nom);
  const vides = creneauxJour.length * 7 - repasJour.length;

  return (
    <Sheet title="Bilan de la semaine" sub="Coup d'œil" onClose={() => setSheet(null)}
      actions={<button className="btn" onClick={() => { setSheet(null); setTab("courses"); }}>Voir la liste de courses</button>}>
      <div className="bilan">
        <span><b>{repasJour.length}<em>/{creneauxJour.length * 7}</em></b>repas posés</span>
        <span><b>{vege}</b>sans viande</span>
        <span><b>{courses.restants}</b>à acheter</span>
      </div>
      <p style={{ fontSize: 14, marginTop: 16 }}>
        {vides > 0 ? `${vides} créneau${vides > 1 ? "x" : ""} encore vide${vides > 1 ? "s" : ""}.` : "Tous les créneaux sont remplis."}
      </p>
      {repetes.length > 0 ? (
        <p style={{ fontSize: 14 }}>
          Revient plusieurs fois : {repetes.map((r) => `${r.nom} (${r.n}×)`).join(", ")}.
        </p>
      ) : <p style={{ fontSize: 14 }}>Aucun plat en double cette semaine.</p>}
      <p className="muted" style={{ fontSize: 13 }}>
        Le compte des repas ne porte que sur les créneaux quotidiens ; le petit déjeuner, le goûter et l'apéro sont comptés en vrac.
      </p>
    </Sheet>
  );
}

/* ============================ Écran : courses ============================ */
function EcranCourses({ ctx, ui, setUi }) {
  const { db, up, setSheet, setTab, semaine, courses, flash } = ctx;
  const { groupes, garde, total, restants } = courses;
  const faits = total - restants;

  const setEtat = (item, etat) => {
    if (item.manuel) up((d) => { const m = d.manuels.find((x) => x.id === item.id); if (m) m.etat = etat; });
    else up((d) => { d.etats[item.key] = etat; });
  };

  return (
    <>
      <header className="top">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Semaine du {semaine.getDate()} {MOIS[semaine.getMonth()]}</div>
          <h1 className="title">Courses</h1>
        </div>
        <button className="btn ghost sm" onClick={() => setSheet({ t: "manuel" })}><Ic d={IcPlus} s={16} />Article</button>
      </header>

      <div className="pad" style={{ paddingTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
          <span className="qty">{faits} sur {total} dans le panier</span>
          {faits > 0 && (
            <button className="qty" style={{ color: "var(--aubergine)" }}
              onClick={() => up((d) => { d.etats = {}; d.manuels.forEach((m) => { m.etat = "todo"; }); })}>Tout décocher</button>
          )}
        </div>
        <div className="bar"><i style={{ width: total ? `${(faits / total) * 100}%` : "0%" }} /></div>
      </div>

      <div className="pad" style={{ marginTop: 16 }}>
        {!groupes.length ? (
          <div className="empty">
            <p>Rien à acheter : aucun plat n'est posé sur cette semaine.</p>
            <button className="btn" onClick={() => setTab("semaine")}>Composer le menu</button>
          </div>
        ) : (
          <>
            <div className="ticket">
              {groupes.map((g) => (
                <div key={g.rayon.id}>
                  <div className="rayon-h">
                    <span className="dot" style={{ background: g.rayon.couleur }} />
                    <b style={{ color: g.rayon.couleur }}>{g.rayon.nom}</b>
                    <span className="qty" style={{ marginLeft: "auto", fontSize: 11 }}>{g.items.filter((i) => i.etat === "todo").length}</span>
                  </div>
                  {g.items.map((it) => (
                    <div key={it.key} className="line" data-s={it.etat} role="button" tabIndex={0}
                      onClick={() => setEtat(it, it.etat === "done" ? "todo" : "done")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEtat(it, it.etat === "done" ? "todo" : "done"); } }}>
                      <span className="box">{it.etat === "done" && <Ic d={IcChk} s={15} />}</span>
                      <span className="lbl">
                        {it.nom}
                        {it.sources.length > 0 && <span className="from">{it.sources.slice(0, 2).join(", ")}{it.sources.length > 2 ? "…" : ""}</span>}
                        {it.manuel && <span className="from">ajouté à la main</span>}
                      </span>
                      <span className="qty">{fmtQ(it.qte)} {it.unite}</span>
                      <button className="have-btn" aria-label="J'ai déjà"
                        onClick={(e) => { e.stopPropagation(); setEtat(it, it.etat === "have" ? "todo" : "have"); }}>déjà</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="ticket-edge" />
          </>
        )}

        {garde.length > 0 && (
          <>
            <h3 className="sec">Garde-manger — non listé</h3>
            <div className="card">
              <button className="plat" onClick={() => setUi({ ouvertGarde: !ui.ouvertGarde })}>
                <span style={{ flex: 1, fontSize: 14 }}>{garde.length} produits toujours en stock sont exclus</span>
                <span className="muted" style={{ display: "grid", transform: ui.ouvertGarde ? "rotate(90deg)" : "none" }}><Ic d={IcR} s={18} /></span>
              </button>
              {ui.ouvertGarde && garde.map((g) => (
                <div key={g.key} className="line" style={{ opacity: .75, minHeight: 48, borderTop: "1px solid var(--line-soft)" }}>
                  <span className="lbl" style={{ fontSize: 14 }}>{g.nom}</span>
                  <span className="qty">{fmtQ(g.qte)} {g.unite}</span>
                  <button className="have-btn" onClick={() => {
                    up((d) => d.manuels.push({ id: uid(), libelle: g.nom, qte: Math.max(1, Math.round(g.qte)), unite: g.unite, rayonId: g.rayonId, etat: "todo" }));
                    flash(`${g.nom} ajouté à la liste`);
                  }}>ajouter</button>
                </div>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Modifiable dans Réglages → Ingrédients.</p>
          </>
        )}
        <div style={{ height: 20 }} />
      </div>
    </>
  );
}

/* ============================ Écran : réglages ============================ */
function EcranReglages({ ctx, ui, setUi }) {
  const { db, up, setDb, setSheet, flash } = ctx;

  if (ui.reglagesVue === "ingredients") {
    return (
      <>
        <header className="top">
          <div>
            <button className="eyebrow" onClick={() => setUi({ reglagesVue: "menu" })}>← Réglages</button>
            <h1 className="title">Ingrédients</h1>
          </div>
          <button className="btn" onClick={() => setSheet({ t: "ingredient", ing: null })}><Ic d={IcPlus} s={18} /></button>
        </header>
        <div className="pad" style={{ paddingTop: 12 }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Liste normalisée : c'est elle qui permet d'additionner les quantités entre les plats.
          </p>
          {db.rayons.map((r) => {
            const l = db.ingredients.filter((i) => i.rayonId === r.id).slice().sort((a, b) => a.nom.localeCompare(b.nom));
            if (!l.length) return null;
            return (
              <div key={r.id}>
                <h3 className="sec" style={{ color: r.couleur }}>{r.nom}</h3>
                <div className="card">
                  {l.map((i) => (
                    <button key={i.id} className="line" style={{ minHeight: 50 }} onClick={() => setSheet({ t: "ingredient", ing: i })}>
                      <span className="lbl">{i.nom}</span>
                      {i.garde && <span className="tag">garde-manger</span>}
                      <span className="qty">{i.unite || "—"}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div style={{ height: 24 }} />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="top">
        <div>
          <div className="eyebrow">Le foyer et ses listes</div>
          <h1 className="title">Réglages</h1>
        </div>
      </header>
      <div className="pad" style={{ paddingTop: 4 }}>
        <h3 className="sec">Foyer</h3>
        <div className="card">
          {db.personnes.map((p) => (
            <button key={p.id} className="line" onClick={() => setSheet({ t: "personne", pers: p })}>
              <span className="lbl">{p.nom}{p.notes && <span className="from">{p.notes}</span>}</span>
              <span className="tag aub">{p.regime}</span>
              <span className="muted"><Ic d={IcPen} s={16} /></span>
            </button>
          ))}
          <button className="line" style={{ color: "var(--aubergine)" }} onClick={() => setSheet({ t: "personne", pers: null })}>
            <span className="box" style={{ border: 0, color: "var(--aubergine)" }}><Ic d={IcPlus} s={18} /></span>
            <span className="lbl" style={{ fontWeight: 600 }}>Ajouter une personne</span>
          </button>
        </div>

        <h3 className="sec">Ingrédients</h3>
        <div className="card">
          <button className="line" onClick={() => setUi({ reglagesVue: "ingredients" })}>
            <span className="lbl">Gérer les {db.ingredients.length} ingrédients<span className="from">Rayon, unité, garde-manger</span></span>
            <span className="muted"><Ic d={IcR} s={18} /></span>
          </button>
        </div>

        <ListeEditable titre="Rayons du magasin" placeholder="Nouveau rayon"
          note="L'ordre des rayons est l'ordre de parcours en magasin. Un rayon encore utilisé ne peut pas être supprimé."
          items={db.rayons.map((r) => ({ key: r.id, id: r.id, nom: r.nom, dot: r.couleur }))}
          onAdd={(n) => up((d) => d.rayons.push({ id: uid(), nom: n, couleur: "#6B6B63" }))}
          onDel={(it) => {
            if (db.ingredients.some((i) => i.rayonId === it.id)) { alert("Ce rayon contient encore des ingrédients."); return; }
            up((d) => { d.rayons = d.rayons.filter((r) => r.id !== it.id); });
          }}
          onRename={(it, v) => { if (v.trim()) up((d) => { const r = d.rayons.find((x) => x.id === it.id); if (r) r.nom = v.trim(); }); }} />

        <ListeCreneaux db={db} up={up} />

        <ListeEditable titre="Catégories de plats" placeholder="Nouvelle catégorie"
          items={db.categories.map((c) => ({ key: c, nom: c }))}
          onAdd={(n) => up((d) => d.categories.push(n))}
          onDel={(it) => up((d) => { d.categories = d.categories.filter((c) => c !== it.nom); })}
          onRename={(it, v) => {
            if (!v.trim() || v.trim() === it.nom) return;
            up((d) => {
              d.categories = d.categories.map((c) => (c === it.nom ? v.trim() : c));
              d.plats.forEach((p) => { if (p.cat === it.nom) p.cat = v.trim(); });
            });
          }} />

        <h3 className="sec">Données</h3>
        <div className="card" style={{ padding: 14 }}>
          <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>
            Prototype : tout est enregistré sur cet appareil. La synchronisation entre deux téléphones arrivera en phase 3.
          </p>
          <button className="btn danger" style={{ width: "100%" }}
            onClick={() => {
              if (confirm("Remettre les données d'exemple ? Vos plats et menus seront perdus.")) {
                setDb(seed()); setUi({ reglagesVue: "menu" }); flash("Données d'exemple restaurées");
              }
            }}>Réinitialiser avec les données d'exemple</button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

/* ============================ Application ============================ */
const TABS = [["plats", "Plats", IcPlats], ["semaine", "Semaine", IcCal], ["courses", "Courses", IcCart], ["reglages", "Réglages", IcSet]];

export default function App() {
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState("plats");
  const [semaine, setSemaine] = useState(() => lundi(new Date()));
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [ui, setUiRaw] = useState({ q: "", cat: "tous", inverse: false, sel: [], ouvertGarde: false, reglagesVue: "menu", semaineVue: "grille", tri: "az" });
  const premier = useRef(true);

  const setUi = (patch) => setUiRaw((u) => ({ ...u, ...patch }));

  useEffect(() => {
    let vivant = true;
    (async () => {
      let data = null;
      try {
        const r = await window.storage.get("menus:v1");
        if (r && r.value) data = JSON.parse(r.value);
      } catch { /* première ouverture ou stockage indisponible */ }
      if (vivant) setDb(data && data.plats ? migrer(data) : seed());
    })();
    return () => { vivant = false; };
  }, []);

  // Un autre appareil du foyer a modifié les données. La couche de
  // synchronisation a déjà fusionné et écrit le résultat ; il ne reste qu'à
  // l'adopter. On repose `premier` pour ne pas renvoyer aussitôt au serveur
  // ce qu'on vient d'en recevoir — sinon deux appareils se répondent en
  // boucle. Rien d'autre n'est touché : la semaine consultée, l'onglet et la
  // feuille ouverte restent où ils sont.
  useEffect(() => {
    const surDistant = (e) => {
      const data = e.detail;
      if (!data || !data.plats) return;
      premier.current = true;
      setDb(migrer(data));
    };
    window.addEventListener("popott:distant", surDistant);
    return () => window.removeEventListener("popott:distant", surDistant);
  }, []);

  useEffect(() => {
    if (!db) return;
    if (premier.current) { premier.current = false; return; }
    const t = setTimeout(() => {
      try {
        const p = window.storage.set("menus:v1", JSON.stringify(db));
        if (p && p.catch) p.catch(() => { });
      } catch { /* mémoire seule */ }
    }, 400);
    return () => clearTimeout(t);
  }, [db]);

  const up = (fn) => setDb((d) => { const n = structuredClone(d); fn(n); return n; });
  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => addJ(semaine, i)), [semaine]);
  const datesSem = useMemo(() => jours.map(iso), [jours]);

  const courses = useMemo(() => {
    const vide = { groupes: [], garde: [], total: 0, restants: 0 };
    if (!db) return vide;
    const map = new Map();
    const push = (ingId, qte, unite, source) => {
      const k = ingId + "|" + unite;
      if (!map.has(k)) map.set(k, { key: k, ingId, unite, qte: 0, sources: new Set() });
      const e = map.get(k);
      e.qte += qte;
      if (source) e.sources.add(source);
    };
    db.repas.filter((r) => datesSem.includes(r.date)).forEach((r) => {
      r.platIds.forEach((pid) => {
        const p = db.plats.find((x) => x.id === pid);
        if (!p) return;
        const fois = r.repetitions || 1;
        const coef = (r.convives.length && p.portions ? r.convives.length / p.portions : 1) * fois;
        p.lignes.forEach((l) => push(l.ingId, (l.qte || 0) * coef, l.unite, p.nom));
      });
      (r.ajust || []).forEach((a) => { if (a.type === "add" && a.qte > 0) push(a.ingId, a.qte * (r.repetitions || 1), a.unite, "ajustement"); });
    });

    const achetables = [], garde = [];
    map.forEach((e) => {
      const ing = db.ingredients.find((i) => i.id === e.ingId);
      if (!ing) return;
      const o = { ...e, nom: ing.nom, rayonId: ing.rayonId, sources: [...e.sources] };
      (ing.garde ? garde : achetables).push(o);
    });

    const groupes = db.rayons.map((r) => ({
      rayon: r,
      items: achetables.filter((l) => l.rayonId === r.id).sort((a, b) => a.nom.localeCompare(b.nom))
        .map((l) => ({ ...l, etat: db.etats[l.key] || "todo", manuel: false })),
    }));
    db.manuels.forEach((m) => {
      const g = groupes.find((x) => x.rayon.id === m.rayonId) || groupes[groupes.length - 1];
      if (g) g.items.push({ key: "m:" + m.id, id: m.id, nom: m.libelle, qte: m.qte, unite: m.unite, etat: m.etat || "todo", manuel: true, sources: [] });
    });
    const tous = groupes.flatMap((g) => g.items);
    return {
      groupes: groupes.filter((g) => g.items.length),
      garde: garde.sort((a, b) => a.nom.localeCompare(b.nom)),
      total: tous.filter((i) => i.etat !== "have").length,
      restants: tous.filter((i) => i.etat === "todo").length,
    };
  }, [db, datesSem]);

  const derniereFois = useMemo(() => {
    const m = {};
    if (!db) return m;
    const auj = iso(new Date());
    db.repas.forEach((r) => {
      if (r.date <= auj) r.platIds.forEach((p) => { if (!m[p] || r.date > m[p]) m[p] = r.date; });
    });
    return m;
  }, [db]);

  if (!db) {
    return <div className="mc"><style>{CSS}</style><div className="shell"><div className="empty" style={{ paddingTop: 140 }}>Chargement…</div></div></div>;
  }

  const ctx = {
    db, up, setDb, flash, setSheet, setTab, semaine, setSemaine, jours, datesSem, courses, derniereFois,
    ingOf: (id) => db.ingredients.find((i) => i.id === id),
    platOf: (id) => db.plats.find((p) => p.id === id),
    persOf: (id) => db.personnes.find((p) => p.id === id),
    crenOf: (id) => db.creneaux.find((c) => c.id === id),
  };

  return (
    <div className="mc">
      <style>{CSS}</style>
      <div className="shell">
        {tab === "plats" && <EcranPlats ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "semaine" && <EcranSemaine ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "courses" && <EcranCourses ctx={ctx} ui={ui} setUi={setUi} />}
        {tab === "reglages" && <EcranReglages ctx={ctx} ui={ui} setUi={setUi} />}
      </div>

      <nav className="tabs">
        {TABS.map(([id, label, icon]) => (
          <button key={id} data-on={tab === id ? 1 : 0} onClick={() => setTab(id)} aria-label={label}>
            <span style={{ position: "relative", display: "grid" }}>
              <Ic d={icon} s={23} />
              {id === "courses" && courses.restants > 0 && <span className="badge">{courses.restants}</span>}
            </span>
            <span className="lb">{label}</span>
          </button>
        ))}
      </nav>

      {sheet?.t === "plat" && <SheetPlat ctx={ctx} plat={sheet.plat} />}
      {sheet?.t === "repas" && <SheetRepas key={sheet.date + sheet.creneauId} ctx={ctx} ui={ui} setUi={setUi} date={sheet.date} creneauId={sheet.creneauId} />}
      {sheet?.t === "ingredient" && <SheetIngredient ctx={ctx} ing={sheet.ing} />}
      {sheet?.t === "personne" && <SheetPersonne ctx={ctx} pers={sheet.pers} />}
      {sheet?.t === "manuel" && <SheetManuel ctx={ctx} />}
      {sheet?.t === "bilan" && <SheetBilan ctx={ctx} />}
      {sheet?.t === "remplissage" && <SheetRemplissage ctx={ctx} />}
      {sheet?.t === "tri" && <SheetTri ctx={ctx} ui={ui} setUi={setUi} />}
      {sheet?.t === "inverse" && <SheetInverse ctx={ctx} ui={ui} setUi={setUi} />}
      {sheet?.t === "actions-plat" && <SheetActionsPlat ctx={ctx} plat={sheet.plat} />}
      {sheet?.t === "actions-semaine" && <SheetActionsSemaine ctx={ctx} />}
      {sheet?.t === "copie" && <SheetCopie ctx={ctx} sens={sheet.sens} />}
      {sheet?.t === "preset-save" && <SheetPresetSave ctx={ctx} />}
      {sheet?.t === "presets" && <SheetPresets ctx={ctx} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
