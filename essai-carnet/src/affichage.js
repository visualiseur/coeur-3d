// Petits outils d'affichage communs au carnet et à la page soignant.

// À changer avec VERSION dans sw.js à chaque mise en ligne : c'est ce qui dit quelle version on a sous les yeux.
export const VERSION_APPLI = 26;

export const ech = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const TRACES = {
  coeur: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 7.5 2.6c0 5.400-7.500 10-7.500 10Z"/>',
  soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300 7 7M17 17l1.700 1.700M18.700 5.300 17 7M7 17l-1.700 1.700"/>',
  fiche: '<rect x="5" y="4" width="14" height="17" rx="2.500"/><path d="M9 4.500V3h6v1.500M8.500 10h7M8.500 14h7M8.500 18h4"/>',
  balance: '<rect x="3.500" y="4" width="17" height="16" rx="4"/><path d="M8 9.500a5.700 5.700 0 0 1 8 0M12 9.500l1.500-2"/>',
  medicaments: '<rect x="3" y="8.500" width="18" height="7" rx="3.500" transform="rotate(-35 12 12)"/><path d="m9.300 8.100 5.400 7.800"/>',
  activite: '<circle cx="14.500" cy="5" r="2"/><path d="m6 21 3.500-6.500L8 11l3.500-3 3 3.500 3.500 1M11.500 8l-1 6 3.500 2.500V21"/>',
  alimentation: '<path d="M12 7.500c-3-2-7-.5-7 4 0 4.500 3 8.500 5 8.500 1 0 1.300-.5 2-.5s1 .5 2 .5c2 0 5-4 5-8.500 0-4.500-4-6-7-4ZM12 7.500c0-2 1-3.500 3-4"/>',
  dispositif: '<rect x="4" y="6" width="13" height="11" rx="4"/><path d="M17 11.500h1.500a2 2 0 0 1 2 2V19M7.500 11.500h2l1-2 1.500 4 1-2h1"/>',
  voyages: '<path d="m3 13 18-7-6 15-3-6.500L3 13Z"/>',
  maison: '<path d="M4 11.500 12 4l8 7.500V20h-5.500v-5h-5v5H4v-8.500Z"/>',
  telephone: '<path d="M6.500 3.500h3l1.500 4-2 1.500a11 11 0 0 0 6 6l1.500-2 4 1.500v3a2 2 0 0 1-2 2C10.500 19.500 4.500 13.500 4.500 5.500a2 2 0 0 1 2-2Z"/>',
  calendrier: '<rect x="4" y="5.500" width="16" height="15" rx="3"/><path d="M4 10h16M8.500 3.500v4M15.500 3.500v4"/>',
  reglages: '<path d="M12 4v10.500M7.500 10.500 12 15l4.500-4.500M5 19.500h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  coche: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
  chevron: '<path d="m9 5.500 6.500 6.500L9 18.500"/>',
  horloge: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  retour: '<path d="m14.500 5.500-6.500 6.500 6.500 6.500"/>',
  croix: '<path d="m6 6 12 12M18 6 6 18"/>',
  micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
  photo: '<rect x="3.500" y="7" width="17" height="12.500" rx="3"/><path d="M8.500 7l1.500-2.500h4L15.500 7"/><circle cx="12" cy="13.200" r="3.200"/>',
  goutte: '<path d="M12 3.500s6 6.200 6 10.500a6 6 0 0 1-12 0c0-4.300 6-10.500 6-10.500Z"/>',
  tabac: '<rect x="2.500" y="13" width="15" height="4" rx="1"/><path d="M13.500 13v4M20.500 13v4M19 4.500c0 2-1.500 2-1.500 4s1.500 2 1.500 4"/>',
  dossier: '<path d="M3.500 7.500a2 2 0 0 1 2-2h4l2 2.500h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.500Z"/>',
  points: '<circle cx="5" cy="12" r="1.300" fill="currentColor"/><circle cx="12" cy="12" r="1.300" fill="currentColor"/><circle cx="19" cy="12" r="1.300" fill="currentColor"/>',
  alerte: '<path d="M12 4 2.500 20h19L12 4ZM12 10v4.500M12 17.300v.2"/>',
};

export function ic(nom, taille = 20) {
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACES[nom] ?? ''}</svg>`;
}
