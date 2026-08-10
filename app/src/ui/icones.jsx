/* ==========================================================================
   Les icones, en trace SVG nu. `Ic` porte les attributs communs ; chaque
   `Ic…` n'est que le chemin. Rien a instancier, ce sont des fragments.
   ========================================================================== */

export const Ic = ({ d, s = 22 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

export const IcPlats = <><path d="M4 13h16a8 8 0 0 1-16 0Z" /><path d="M3 20h18" /><path d="M9 4c0 1.2 1 1.5 1 2.6S9 8.4 9 9.6" /><path d="M13.5 4c0 1.2 1 1.5 1 2.6s-1 1.8-1 3" /></>;

export const IcCal = <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>;

export const IcCart = <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.6l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H5.4" /></>;

export const IcSet = <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></>;

export const IcPlus = <><path d="M12 5v14M5 12h14" /></>;

export const IcX = <><path d="M6 6l12 12M18 6L6 18" /></>;

export const IcChk = <><path d="M4 12.5l5 5L20 6.5" /></>;

export const IcL = <><path d="M15 5l-7 7 7 7" /></>;

export const IcR = <><path d="M9 5l7 7-7 7" /></>;

export const IcPen = <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /></>;

export const IcMoins = <><path d="M5 12h14" /></>;

export const IcStats = <><path d="M5 20V11M12 20V4M19 20v-6" /></>;

export const IcPoints = <><circle cx="12" cy="5" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="19" r="1.4" fill="currentColor" /></>;

export const IcIdee = <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.8 1-.9 1.6l-.1.6H9.4l-.1-.6c-.1-.6-.4-1.2-.9-1.6A6 6 0 0 1 12 3Z" /></>;

export const IcImport = <><path d="M12 3v12" /><path d="M8 11l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>;

export const IcEtoile = <><path d="M12 3.5l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.5Z" /></>;

export const IcAuj = <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /><circle cx="12" cy="15.5" r="2" fill="currentColor" /></>;

export const IcTri = <><path d="M4 7h13M4 12h9M4 17h5" /><path d="M18 10v10M15 17l3 3 3-3" /></>;

export const IcCopie = <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>;

export const IcDes = <><rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" /><circle cx="12" cy="12" r="1.1" fill="currentColor" /></>;

export const IcMagie = <><path d="M4 20L15 9" /><path d="M14 4l.9 2.1L17 7l-2.1.9L14 10l-.9-2.1L11 7l2.1-.9L14 4Z" /><path d="M19.5 13l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5.5-1.2Z" /></>;

export const IcGrille = <><rect x="3" y="4" width="7.5" height="7" rx="1.5" /><rect x="13.5" y="4" width="7.5" height="7" rx="1.5" /><rect x="3" y="13" width="7.5" height="7" rx="1.5" /><rect x="13.5" y="13" width="7.5" height="7" rx="1.5" /></>;

export const IcListe = <><path d="M4 6h16M4 12h16M4 18h10" /></>;

export const IcUp = <><path d="M6 14l6-6 6 6" /></>;

export const IcDown = <><path d="M6 10l6 6 6-6" /></>;

export const IcSort = <><path d="M4 7h11M4 12h7M4 17h4" /><path d="M18 5v14M15 16l3 3 3-3" /></>;

export const IcTrash = <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>;

export const IcMaj = <><path d="M20 11a8 8 0 1 0-.9 4.7" /><path d="M20 5.5V11h-5.5" /></>;

export const IcCompte = <><circle cx="12" cy="8.5" r="3.7" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>;
