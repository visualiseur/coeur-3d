// Transmission des consignes du soignant au patient, SANS serveur.
// Le soignant remplit une page ; elle fabrique un lien dont la partie après « # » contient les consignes.
// Cette partie d'une adresse n'est jamais envoyée au serveur par le navigateur : elle passe de l'écran du soignant
// au téléphone du patient (QR code ou lien partagé) et nulle part ailleurs.
//
// Limite à dire franchement : le carnet ne peut pas prouver QUI a écrit les consignes reçues. Il affiche le nom
// indiqué et demande au patient de confirmer. C'est le même niveau de preuve qu'une fiche papier.

import { CHAMPS, MOMENTS } from './modele.js';
import { estDateIso } from './dates.js';

export const PREFIXE = 'recu=';
const VERSION_DU_COLIS = 1;
const LONGUEUR_MAX = 600;
const MEDICAMENTS_MAX = 20;
const IDS_MOMENTS = MOMENTS.map((m) => m.id);

const texte = (v) => (typeof v === 'string' ? v.trim() : '');

/** Les champs que la page soignant propose, dans l'ordre. Tous sont des champs de la fiche. */
export const CHAMPS_SOIGNANT = [
  { titre: 'Poids', ids: ['poids_reference', 'consigne_poids'] },
  { titre: 'Sel', ids: ['sel_limite', 'sel'] },
  { titre: 'Liquides', ids: ['boissons_limite', 'boissons'] },
  { titre: 'Effort', ids: ['fc_cible_min', 'fc_cible_max', 'fc_ne_pas_depasser'] },
  { titre: 'Traitement', ids: ['en_cas_d_oubli'] },
  { titre: 'Contact', ids: ['numero_service'] },
];

/**
 * Les médicaments transmis (facultatifs). Dans le colis, chacun s'écrit en abrégé pour garder le QR code lisible :
 * n = nom, d = dose, mo = moments (« matin », « midi », « soir »), q = à quoi ça sert, x = 1 s'il est à arrêter.
 * Un médicament absent de la liste n'est PAS arrêté : seul « à arrêter » arrête, et seulement s'il est nommé.
 */
function verifierMedicaments(liste) {
  if (liste === undefined) return [];
  if (!Array.isArray(liste)) throw new Error('Les médicaments transmis sont illisibles.');
  if (liste.length > MEDICAMENTS_MAX) throw new Error(`Trop de médicaments d’un coup (${MEDICAMENTS_MAX} au plus).`);
  return liste.map((m) => {
    if (m === null || typeof m !== 'object') throw new Error('Un médicament transmis est illisible.');
    const nom = texte(m.n);
    if (!nom) throw new Error('Un médicament transmis n’a pas de nom.');
    const dose = texte(m.d), aQuoiCaSert = texte(m.q);
    if (nom.length > 120 || dose.length > 120 || aQuoiCaSert.length > LONGUEUR_MAX) throw new Error(`Un texte est trop long (${nom.slice(0, 40)}).`);
    const lus = Array.isArray(m.mo) ? m.mo : [];
    if (lus.some((id) => !IDS_MOMENTS.includes(id))) throw new Error(`Moment de prise inconnu (${nom}).`);
    const moments = Object.fromEntries(IDS_MOMENTS.map((id) => [id, lus.includes(id)]));
    return { nom, dose, moments, aQuoiCaSert, arreter: m.x === 1 };
  });
}

/** Vérifie et met en forme un colis de consignes. Lève une erreur lisible s'il n'est pas valable. */
export function verifierColis(colis) {
  if (colis === null || typeof colis !== 'object' || colis.v !== VERSION_DU_COLIS) throw new Error('Ces consignes ne sont pas lisibles par cette version du carnet.');
  const auteur = texte(colis.a);
  if (!auteur) throw new Error('Le nom du soignant manque.');
  if (!estDateIso(colis.d)) throw new Error('La date des consignes manque.');
  if (colis.c === null || typeof colis.c !== 'object' || Array.isArray(colis.c)) throw new Error('Les consignes sont illisibles.');
  const consignes = [];
  for (const [id, brut] of Object.entries(colis.c)) {
    const valeur = texte(brut);
    if (!CHAMPS.has(id)) throw new Error(`Consigne inconnue de ce carnet : ${id}`);
    if (!valeur) continue;
    if (valeur.length > LONGUEUR_MAX) throw new Error(`Une consigne est trop longue (${CHAMPS.get(id).libelle}).`);
    consignes.push({ id, valeur });
  }
  const medicaments = verifierMedicaments(colis.m);
  if (!consignes.length && !medicaments.length) throw new Error('Aucune consigne n’est remplie.');
  return { auteur: auteur.slice(0, 120), date: colis.d, reevaluerLe: estDateIso(colis.r) ? colis.r : '', consignes, medicaments };
}

const versBase64Url = (octets) => btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const depuisBase64Url = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

/** Fabrique la partie d'adresse (après « # ») qui transporte les consignes. */
export function emballer({ auteur, date, reevaluerLe, consignes, medicaments = [] }) {
  const c = Object.fromEntries(Object.entries(consignes).map(([id, v]) => [id, texte(v)]).filter(([, v]) => v));
  const colis = { v: VERSION_DU_COLIS, a: texte(auteur), d: date, c };
  if (reevaluerLe) colis.r = reevaluerLe;
  const m = medicaments.filter((x) => texte(x.nom)).map((x) => {
    const abrege = { n: texte(x.nom) };
    if (texte(x.dose)) abrege.d = texte(x.dose);
    const mo = IDS_MOMENTS.filter((id) => x.moments?.[id]);
    if (mo.length) abrege.mo = mo;
    if (texte(x.aQuoiCaSert)) abrege.q = texte(x.aQuoiCaSert);
    if (x.arreter) abrege.x = 1;
    return abrege;
  });
  if (m.length) colis.m = m;
  verifierColis(colis); // refuse d'emballer ce qu'on refuserait de déballer
  return PREFIXE + versBase64Url(new TextEncoder().encode(JSON.stringify(colis)));
}

/** Lit la partie d'adresse reçue. Lève une erreur lisible si ce n'est pas un colis de consignes. */
export function deballer(fragment) {
  const brut = fragment.replace(/^#/, '');
  if (!brut.startsWith(PREFIXE)) throw new Error('Cette adresse ne contient pas de consignes.');
  let colis;
  try { colis = JSON.parse(new TextDecoder().decode(depuisBase64Url(brut.slice(PREFIXE.length)))); } catch { throw new Error('Les consignes reçues sont abîmées ou incomplètes.'); }
  return verifierColis(colis);
}
