// Fabrique un QR code (octets, correction d'erreur « L ») sans bibliothèque externe.
// Le code suit la norme ISO/IEC 18004 ; il sert à passer un lien de l'écran du soignant au téléphone du patient.
// Rend une matrice de booléens (true = module sombre), sans la marge blanche.

// Octets de correction par bloc et nombre de blocs, niveau L, versions 1 à 40 (tableaux de la norme).
const CORRECTION_PAR_BLOC = [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30];
const NOMBRE_DE_BLOCS = [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25];

/** Multiplication dans le corps de Galois GF(256), polynôme 0x11D. */
export function multiplier(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function diviseurReedSolomon(degre) {
  const resultat = new Array(degre).fill(0);
  resultat[degre - 1] = 1;
  let racine = 1;
  for (let i = 0; i < degre; i += 1) {
    for (let j = 0; j < degre; j += 1) {
      resultat[j] = multiplier(resultat[j], racine);
      if (j + 1 < degre) resultat[j] ^= resultat[j + 1];
    }
    racine = multiplier(racine, 2);
  }
  return resultat;
}

/** Les octets de correction d'un bloc de données. */
export function correctionReedSolomon(donnees, degre) {
  const diviseur = diviseurReedSolomon(degre);
  const reste = new Array(degre).fill(0);
  for (const octet of donnees) {
    const facteur = octet ^ reste.shift();
    reste.push(0);
    diviseur.forEach((coef, i) => { reste[i] ^= multiplier(coef, facteur); });
  }
  return reste;
}

function modulesDeDonnees(version) {
  let n = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignements = Math.floor(version / 7) + 2;
    n -= (25 * alignements - 10) * alignements - 55;
    if (version >= 7) n -= 36;
  }
  return n;
}

/** Nombre d'octets de données qu'une version peut porter (niveau L), en-tête compris. */
export function capaciteOctets(version) {
  return Math.floor(modulesDeDonnees(version) / 8) - CORRECTION_PAR_BLOC[version] * NOMBRE_DE_BLOCS[version];
}

function positionsAlignement(version, taille) {
  if (version === 1) return [];
  const nombre = Math.floor(version / 7) + 2;
  const pas = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (nombre * 2 - 2)) * 2;
  const positions = [6];
  for (let p = taille - 7; positions.length < nombre; p -= pas) positions.splice(1, 0, p);
  return positions;
}

/** Les 15 bits d'information de format (niveau L) pour un masque donné. */
export function bitsDeFormat(masque) {
  const donnee = (1 << 3) | masque; // 01 = niveau L
  let reste = donnee;
  for (let i = 0; i < 10; i += 1) reste = (reste << 1) ^ ((reste >>> 9) * 0x537);
  return ((donnee << 10) | reste) ^ 0x5412;
}

/** Les 18 bits d'information de version (versions 7 et plus). */
export function bitsDeVersion(version) {
  let reste = version;
  for (let i = 0; i < 12; i += 1) reste = (reste << 1) ^ ((reste >>> 11) * 0x1f25);
  return (version << 12) | reste;
}

const CONDITIONS_DE_MASQUE = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function penalite(m) {
  const n = m.length;
  let total = 0;
  // Règle 1 : suites de cinq modules ou plus de la même couleur, en ligne puis en colonne.
  for (let sens = 0; sens < 2; sens += 1) {
    for (let a = 0; a < n; a += 1) {
      let longueur = 1;
      for (let b = 1; b < n; b += 1) {
        const ici = sens ? m[b][a] : m[a][b];
        const avant = sens ? m[b - 1][a] : m[a][b - 1];
        if (ici === avant) { longueur += 1; if (longueur === 5) total += 3; else if (longueur > 5) total += 1; } else longueur = 1;
      }
    }
  }
  // Règle 2 : carrés de 2 × 2 de la même couleur.
  for (let y = 0; y < n - 1; y += 1) for (let x = 0; x < n - 1; x += 1) {
    if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) total += 3;
  }
  // Règle 3 : motif 1011101 bordé de quatre clairs, qui ressemble à un repère d'angle.
  const motifs = [[true, false, true, true, true, false, true, false, false, false, false], [false, false, false, false, true, false, true, true, true, false, true]];
  for (let a = 0; a < n; a += 1) for (let b = 0; b + 11 <= n; b += 1) for (const motif of motifs) {
    if (motif.every((v, k) => m[a][b + k] === v)) total += 40;
    if (motif.every((v, k) => m[b + k][a] === v)) total += 40;
  }
  // Règle 4 : équilibre entre modules sombres et clairs.
  const sombres = m.reduce((s, ligne) => s + ligne.filter(Boolean).length, 0);
  total += Math.floor(Math.abs((sombres * 20) / (n * n) - 10)) * 10;
  return total;
}

/**
 * @param octets Uint8Array ou tableau d'octets à coder
 * @returns { taille, version, modules } — modules[y][x] vaut true pour un module sombre
 */
export function qrCode(octets) {
  const donnees = Array.from(octets);
  let version = 1;
  const bitsCompteur = (v) => (v <= 9 ? 8 : 16);
  while (version <= 40 && 4 + bitsCompteur(version) + donnees.length * 8 > capaciteOctets(version) * 8) version += 1;
  if (version > 40) throw new Error('Trop de texte pour un QR code.');

  // --- Le flux de bits : mode octets, longueur, données, fin, remplissage ---
  const bits = [];
  const ajouter = (valeur, longueur) => { for (let i = longueur - 1; i >= 0; i -= 1) bits.push((valeur >>> i) & 1); };
  ajouter(0b0100, 4);
  ajouter(donnees.length, bitsCompteur(version));
  for (const o of donnees) ajouter(o, 8);
  const capaciteBits = capaciteOctets(version) * 8;
  ajouter(0, Math.min(4, capaciteBits - bits.length));
  ajouter(0, (8 - (bits.length % 8)) % 8);
  for (let remplissage = 0xec; bits.length < capaciteBits; remplissage ^= 0xec ^ 0x11) ajouter(remplissage, 8);
  const motsDeDonnees = [];
  for (let i = 0; i < bits.length; i += 8) motsDeDonnees.push(bits.slice(i, i + 8).reduce((v, b) => (v << 1) | b, 0));

  // --- Découpage en blocs, correction d'erreur, entrelacement ---
  const nombreBlocs = NOMBRE_DE_BLOCS[version];
  const correction = CORRECTION_PAR_BLOC[version];
  const motsTotaux = Math.floor(modulesDeDonnees(version) / 8);
  const blocsCourts = nombreBlocs - (motsTotaux % nombreBlocs);
  const longueurCourte = Math.floor(motsTotaux / nombreBlocs);
  const blocs = [];
  for (let i = 0, k = 0; i < nombreBlocs; i += 1) {
    const bloc = motsDeDonnees.slice(k, k + longueurCourte - correction + (i < blocsCourts ? 0 : 1));
    k += bloc.length;
    const ecc = correctionReedSolomon(bloc, correction);
    if (i < blocsCourts) bloc.push(0); // case vide, sautée à l'entrelacement
    blocs.push(bloc.concat(ecc));
  }
  const mots = [];
  for (let i = 0; i < blocs[0].length; i += 1) {
    blocs.forEach((bloc, j) => { if (i !== longueurCourte - correction || j >= blocsCourts) mots.push(bloc[i]); });
  }

  // --- La matrice et ses motifs fixes ---
  const taille = version * 4 + 17;
  const modules = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const fixe = Array.from({ length: taille }, () => new Array(taille).fill(false));
  const poser = (x, y, sombre) => { modules[y][x] = sombre; fixe[y][x] = true; };

  for (let i = 0; i < taille; i += 1) { poser(6, i, i % 2 === 0); poser(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [taille - 4, 3], [3, taille - 4]]) {
    for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && x < taille && y >= 0 && y < taille) poser(x, y, d !== 2 && d !== 4);
    }
  }
  const positions = positionsAlignement(version, taille);
  positions.forEach((px, i) => positions.forEach((py, j) => {
    const dernier = positions.length - 1;
    if ((i === 0 && j === 0) || (i === 0 && j === dernier) || (i === dernier && j === 0)) return;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) poser(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  const poserFormat = (masque) => {
    const f = bitsDeFormat(masque);
    const bit = (i) => ((f >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i += 1) poser(8, i, bit(i));
    poser(8, 7, bit(6)); poser(8, 8, bit(7)); poser(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) poser(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1) poser(taille - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) poser(8, taille - 15 + i, bit(i));
    poser(8, taille - 8, true); // module toujours sombre
  };
  poserFormat(0);
  if (version >= 7) {
    const v = bitsDeVersion(version);
    for (let i = 0; i < 18; i += 1) {
      const sombre = ((v >>> i) & 1) !== 0;
      const a = taille - 11 + (i % 3), b = Math.floor(i / 3);
      poser(a, b, sombre); poser(b, a, sombre);
    }
  }

  // --- Les données, en zigzag depuis le coin en bas à droite ---
  let i = 0;
  for (let droite = taille - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    for (let vert = 0; vert < taille; vert += 1) for (let j = 0; j < 2; j += 1) {
      const x = droite - j;
      const monte = ((droite + 1) & 2) === 0;
      const y = monte ? taille - 1 - vert : vert;
      if (!fixe[y][x] && i < mots.length * 8) { modules[y][x] = ((mots[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i += 1; }
    }
  }

  // --- Le masque le moins pénalisé ---
  const masquer = (masque) => { for (let y = 0; y < taille; y += 1) for (let x = 0; x < taille; x += 1) if (!fixe[y][x] && CONDITIONS_DE_MASQUE[masque](x, y)) modules[y][x] = !modules[y][x]; };
  let meilleur = 0, moindre = Infinity;
  for (let masque = 0; masque < 8; masque += 1) {
    masquer(masque); poserFormat(masque);
    const p = penalite(modules);
    if (p < moindre) { moindre = p; meilleur = masque; }
    masquer(masque); // appliquer deux fois le même masque l'annule
  }
  masquer(meilleur); poserFormat(meilleur);
  return { taille, version, masque: meilleur, modules };
}

/** Le QR code en SVG, avec sa marge blanche de quatre modules. */
export function qrEnSvg({ taille, modules }, { marge = 4 } = {}) {
  let trace = '';
  for (let y = 0; y < taille; y += 1) for (let x = 0; x < taille; x += 1) if (modules[y][x]) trace += `M${x + marge} ${y + marge}h1v1h-1z`;
  const cote = taille + marge * 2;
  return `<svg class="qr" viewBox="0 0 ${cote} ${cote}" role="img" aria-label="QR code à scanner" shape-rendering="crispEdges"><rect width="${cote}" height="${cote}" fill="#fff"/><path d="${trace}" fill="#000"/></svg>`;
}
