/* ==========================================================================
   La feuille de style de l'application, injectee par App dans un <style>.
   Volontairement une chaine et non un fichier .css : elle est portee par le
   composant, comme dans l'environnement d'origine du prototype, et l'ordre
   d'injection reste maitrise. Les jetons viennent de brand.css.
   ========================================================================== */

export const CSS = `
/* Les jetons viennent de brand.css. Ne rien redefinir ici. */
.mc *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.mc{font-family:var(--sans);background:var(--backdrop);min-height:100dvh;color:var(--ink);font-size:15px;line-height:1.45}
.mc .shell{max-width:540px;margin:0 auto;background:var(--paper);min-height:100dvh;
  padding-bottom:100px;box-shadow:0 0 60px rgba(23,36,30,.14);position:relative}

.mc .eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}
.mc .v-mini{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:var(--ink-3);flex:none}
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

/* clip et non hidden : les deux rognent aux coins arrondis, mais hidden fait du ticket
   un conteneur de defilement, et les en-tetes de rayon en position sticky se calaient
   alors a 69px du haut du ticket — le premier rayon tombait au milieu de ses articles. */
.mc .ticket{background:var(--surface);border:1px solid var(--line);border-radius:var(--r) var(--r) 0 0;overflow:clip}
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
.mc .opt-btn{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;
  border:1.5px solid var(--line);border-radius:999px;padding:0 7px;min-height:38px;color:var(--ink-3);flex:none}
.mc .ing-row[data-opt="1"] .opt-btn{background:var(--ambre);border-color:var(--ambre);color:var(--creme)}
.mc .ing-row[data-opt="1"] .nm{color:var(--ink-2)}
.mc .inline-in{border:0;padding:6px 0;min-height:0;background:transparent;border-radius:0}
.mc .toast{position:fixed;bottom:98px;left:50%;transform:translateX(-50%);z-index:70;background:var(--ink);
  color:var(--creme);padding:11px 18px;border-radius:999px;font-size:13.5px;font-weight:500;
  box-shadow:0 8px 24px rgba(23,36,30,.3);max-width:90%}
@media (prefers-reduced-motion:reduce){.mc *{animation:none!important;transition:none!important}}
`;
