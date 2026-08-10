import React from "react";

/* ==========================================================================
   Popott — marque
   Sources : /icons/popott-logo.svg et /icons/popott-mark.svg
   Les deux composants inlinent le SVG en currentColor : la couleur suit le
   contexte, aucune requete reseau, net a toute taille.
   Ne pas modifier les traces a la main — regenerer depuis /icons.
   ========================================================================== */

/** Logotype complet. Hauteur minimale conseillee : 18px. */
export function Logo({ height = 22, title = "Popott", ...rest }) {
  return (
    <svg
      viewBox="0 0 3349 960"
      height={height}
      width={(height * 3349) / 960}
      role="img"
      aria-label={title}
      fill="currentColor"
      style={{ display: "block" }}
      {...rest}
    >
      <title>{title}</title>
      <g transform="translate(-62 694) scale(1 -1)"><path d="M405 566Q474 566 530.0 531.0Q586 496 618.5 431.0Q651 366 651 280Q651 194 618.5 128.5Q586 63 530.0 27.5Q474 -8 405 -8Q347 -8 302.5 16.0Q258 40 233 78V-266H62V558H233V479Q258 518 302.0 542.0Q346 566 405 566ZM354 417Q303 417 267.5 380.0Q232 343 232 279Q232 215 267.5 178.0Q303 141 354 141Q405 141 441.0 178.5Q477 216 477 280Q477 344 441.5 380.5Q406 417 354 417Z" transform="translate(0 0)"/>
      <path d="M405 566Q474 566 530.0 531.0Q586 496 618.5 431.0Q651 366 651 280Q651 194 618.5 128.5Q586 63 530.0 27.5Q474 -8 405 -8Q347 -8 302.5 16.0Q258 40 233 78V-266H62V558H233V479Q258 518 302.0 542.0Q346 566 405 566ZM354 417Q303 417 267.5 380.0Q232 343 232 279Q232 215 267.5 178.0Q303 141 354 141Q405 141 441.0 178.5Q477 216 477 280Q477 344 441.5 380.5Q406 417 354 417Z" transform="translate(1316 0)"/>
      <path d="M373 145V0H286Q193 0 141.0 45.5Q89 91 89 194V416H21V558H89V694H260V558H372V416H260V192Q260 167 272.0 156.0Q284 145 312 145Z" transform="translate(2632 0)"/>
      <path d="M373 145V0H286Q193 0 141.0 45.5Q89 91 89 194V416H21V558H89V694H260V558H372V416H260V192Q260 167 272.0 156.0Q284 145 312 145Z" transform="translate(3038 0)"/>
      <circle cx="997" cy="279" r="288"/>
      <circle cx="2313" cy="279" r="288"/>
      </g>
    </svg>
  );
}

/** Le signe seul : les deux disques. Taille minimale conseillee : 20px. */
export function Mark({ size = 28, title = "Popott", ...rest }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      fill="currentColor"
      style={{ display: "block" }}
      {...rest}
    >
      <title>{title}</title>
      <circle cx="252" cy="512" r="200" />
      <circle cx="772" cy="512" r="200" />
    </svg>
  );
}

export default Logo;
