// Géométrie de la courbe de poids. Elle place des points ; elle ne dit rien de ce qu'ils valent.

import { numeroJour, ajouterJours } from './dates.js';

/**
 * @param mesures [{ date, kg }] triées par date
 * @param options { aujourdhui, jours (null = tout), reference (kg ou null), largeur, hauteur }
 * @returns null s'il n'y a aucune mesure dans la période
 */
export function geometrie(mesures, { aujourdhui, jours = null, reference = null, largeur = 340, hauteur = 200 }) {
  const debutVoulu = jours ? ajouterJours(aujourdhui, -jours) : null;
  const visibles = mesures.filter((m) => m.date <= aujourdhui && (!debutVoulu || m.date >= debutVoulu));
  if (!visibles.length) return null;

  const marge = { gauche: 40, droite: 14, haut: 14, bas: 26 };
  let debut = debutVoulu ?? visibles[0].date;
  if (debut === aujourdhui) debut = ajouterJours(aujourdhui, -1);
  const x0 = numeroJour(debut);
  const x1 = numeroJour(aujourdhui);

  const valeurs = visibles.map((m) => m.kg);
  if (typeof reference === 'number') valeurs.push(reference);
  const bas = Math.floor(Math.min(...valeurs) - 1);
  const haut = Math.ceil(Math.max(...valeurs) + 1);

  const x = (date) => marge.gauche + ((numeroJour(date) - x0) / (x1 - x0)) * (largeur - marge.gauche - marge.droite);
  const y = (kg) => marge.haut + (1 - (kg - bas) / (haut - bas)) * (hauteur - marge.haut - marge.bas);
  const arrondi = (n) => Math.round(n * 10) / 10;

  const points = visibles.map((m) => ({ x: arrondi(x(m.date)), y: arrondi(y(m.kg)), date: m.date, kg: m.kg }));
  const trace = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const pied = hauteur - marge.bas;
  const aire = `${trace} L${points[points.length - 1].x} ${pied} L${points[0].x} ${pied} Z`;

  const pas = (haut - bas) / 4;
  const graduations = [0, 1, 2, 3, 4].map((i) => ({ kg: arrondi(bas + i * pas), y: arrondi(y(bas + i * pas)) }));

  return {
    largeur, hauteur, marge, points, trace, aire, graduations,
    debut, fin: aujourdhui,
    yReference: typeof reference === 'number' ? arrondi(y(reference)) : null,
  };
}
