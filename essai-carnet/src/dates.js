// Dates au format « AAAA-MM-JJ », toujours en heure locale de l'appareil.

const deuxChiffres = (n) => String(n).padStart(2, '0');

/** Date du jour, ou d'un objet Date, au format AAAA-MM-JJ (heure locale). */
export function versIso(d = new Date()) {
  return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`;
}

/** Vrai si la chaîne est une date AAAA-MM-JJ qui existe. */
export function estDateIso(texte) {
  if (typeof texte !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texte)) return false;
  const [a, m, j] = texte.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, j));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

/** Numéro de jour (jours depuis 1970), pour compter des écarts sans souci d'heure d'été. */
export function numeroJour(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, j) / 86400000);
}

export function ajouterJours(iso, n) {
  const d = new Date((numeroJour(iso) + n) * 86400000);
  return `${d.getUTCFullYear()}-${deuxChiffres(d.getUTCMonth() + 1)}-${deuxChiffres(d.getUTCDate())}`;
}

const enDate = (iso) => {
  const [a, m, j] = iso.split('-').map(Number);
  return new Date(a, m - 1, j);
};

/** « mercredi 25 novembre » */
export function dateLongue(iso) {
  return enDate(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** « 25 nov. 2026 » */
export function dateCourte(iso) {
  return enDate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** « 25 nov. » */
export function dateTresCourte(iso) {
  return enDate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
