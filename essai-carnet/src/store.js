// Données du carnet : fonctions pures, sans écran ni stockage, pour pouvoir les tester.
// Règles tenues ici (2_Projet-outil/03 et 06) :
//  - une consigne ne s'écrase jamais : chaque écriture ajoute une version, l'ancienne reste ;
//  - chaque enregistrement porte sa date de saisie, distincte de la date de la mesure ;
//  - le schéma porte un numéro de version ;
//  - rien n'est calculé ni jugé : on range ce qui a été écrit.

import { CHAMPS, MOMENTS } from './modele.js';
import { estDateIso, ajouterJours } from './dates.js';

export const SCHEMA = 1;
export const FORMAT = 'carnet-coeur';

export function etatVide() {
  return { schema: SCHEMA, exemple: false, consignes: {}, medicaments: [], prises: {}, poids: [], rendezVous: [], suivi: {}, boissons: {} };
}

const texte = (v) => (typeof v === 'string' ? v.trim() : '');
const dateOuVide = (v) => (estDateIso(v) ? v : '');
let compteur = 0;
const nouvelId = (prefixe, maintenant) => `${prefixe}-${Date.parse(maintenant) || 0}-${(compteur += 1)}`;

// ---------- Consignes de la fiche ----------

/** Ajoute une version à une consigne. L'ancienne version est conservée. */
export function ecrireConsigne(etat, id, saisie, maintenant) {
  if (!CHAMPS.has(id)) throw new Error(`Champ inconnu de la fiche : ${id}`);
  const valeur = texte(saisie.valeur);
  if (!valeur) throw new Error('La valeur est vide.');
  const version = {
    valeur,
    auteur: texte(saisie.auteur),
    date: dateOuVide(saisie.date),
    reevaluerLe: dateOuVide(saisie.reevaluerLe),
    saisiLe: maintenant,
  };
  const versions = [...(etat.consignes[id] ?? []), version];
  return { ...etat, consignes: { ...etat.consignes, [id]: versions } };
}

/** La dernière version écrite, ou null si le champ n'a jamais été renseigné. */
export function consigneCourante(etat, id) {
  const versions = etat.consignes[id];
  return versions && versions.length ? versions[versions.length - 1] : null;
}

/** Les versions précédentes, de la plus récente à la plus ancienne. */
export function historiqueConsigne(etat, id) {
  return (etat.consignes[id] ?? []).slice(0, -1).reverse();
}

/** Un fait, pas un jugement : la date de réévaluation écrite est-elle atteinte ? */
export function estAReevaluer(version, aujourdhui) {
  return Boolean(version && version.reevaluerLe && version.reevaluerLe <= aujourdhui);
}

/** Les consignes dont la date de réévaluation est atteinte : [{ id, version }]. */
export function consignesAReevaluer(etat, aujourdhui) {
  return Object.keys(etat.consignes)
    .map((id) => ({ id, version: consigneCourante(etat, id) }))
    .filter((c) => CHAMPS.has(c.id) && estAReevaluer(c.version, aujourdhui));
}

// ---------- Poids ----------

/**
 * « 78,4 », « 78.4 », et ce que donne une dictée : « 78,4 kg », « 78 virgule 4 kilos » → 78.4.
 * null si ce n'est pas un nombre plausible pour une balance. Dans le doute, on refuse : on ne devine pas.
 */
export function lireKg(saisie) {
  const propre = String(saisie ?? '').toLowerCase()
    .replace(/kilogrammes?|kilos?|kgs?/g, ' ')
    .replace(/virgule|point|,/g, '.')
    .replace(/\s+/g, '');
  if (!/^\d+(\.\d+)?$/.test(propre)) return null;
  const n = Number(propre);
  if (!Number.isFinite(n) || n < 20 || n > 400) return null;
  return Math.round(n * 10) / 10;
}

/** Note une pesée. Une seule pesée par jour : en noter une autre le même jour la corrige. */
export function noterPoids(etat, { date, kg }, maintenant) {
  if (!estDateIso(date)) throw new Error('La date de la pesée est invalide.');
  const valeur = lireKg(kg);
  if (valeur === null) throw new Error('Le poids n’est pas un nombre lisible (exemple : 78,4).');
  const poids = [...etat.poids.filter((p) => p.date !== date), { date, kg: valeur, saisiLe: maintenant }]
    .sort((a, b) => a.date.localeCompare(b.date));
  return { ...etat, poids };
}

export function retirerPoids(etat, date) {
  return { ...etat, poids: etat.poids.filter((p) => p.date !== date) };
}

// ---------- Médicaments ----------

function lireMedicament(saisie) {
  const nom = texte(saisie.nom);
  if (!nom) throw new Error('Le nom du médicament est vide.');
  const moments = {};
  for (const m of MOMENTS) moments[m.id] = Boolean(saisie.moments && saisie.moments[m.id]);
  return { nom, dose: texte(saisie.dose), moments, aQuoiCaSert: texte(saisie.aQuoiCaSert), ecritPar: texte(saisie.ecritPar) };
}

export function ajouterMedicament(etat, saisie, maintenant) {
  const medicament = { id: nouvelId('med', maintenant), ...lireMedicament(saisie), saisiLe: maintenant, arreteLe: '' };
  return { ...etat, medicaments: [...etat.medicaments, medicament] };
}

export function modifierMedicament(etat, id, saisie, maintenant) {
  return {
    ...etat,
    medicaments: etat.medicaments.map((m) => (m.id === id ? { ...m, ...lireMedicament(saisie), saisiLe: maintenant } : m)),
  };
}

/** Un médicament arrêté sort de la liste du jour, mais ses prises passées restent. */
export function arreterMedicament(etat, id, date) {
  return { ...etat, medicaments: etat.medicaments.map((m) => (m.id === id ? { ...m, arreteLe: date } : m)) };
}

export const medicamentsEnCours = (etat) => etat.medicaments.filter((m) => !m.arreteLe);

/** Coche ou décoche une prise. */
export function basculerPrise(etat, date, idMedicament, moment, maintenant) {
  const cle = `${idMedicament}|${moment}`;
  const duJour = { ...(etat.prises[date] ?? {}) };
  if (duJour[cle]) delete duJour[cle];
  else duJour[cle] = maintenant;
  return { ...etat, prises: { ...etat.prises, [date]: duJour } };
}

export const estPris = (etat, date, idMedicament, moment) => Boolean(etat.prises[date]?.[`${idMedicament}|${moment}`]);

// ---------- Alimentation : aide-mémoire à cocher ----------

/**
 * Note combien de cases sont cochées pour un repère, un jour (« 2026-11-25 ») ou une semaine (« S2026-11-23 », son lundi).
 * C'est un simple compte tenu par la personne : l'application n'en tire aucun jugement.
 */
export function reglerSuivi(etat, periode, id, nombre) {
  const n = Math.max(0, Math.min(20, Math.round(Number(nombre) || 0)));
  const dePeriode = { ...(etat.suivi[periode] ?? {}) };
  if (n) dePeriode[id] = n; else delete dePeriode[id];
  return { ...etat, suivi: { ...etat.suivi, [periode]: dePeriode } };
}

export const suiviDe = (etat, periode, id) => etat.suivi[periode]?.[id] ?? 0;

/**
 * La limite de sel écrite sur la fiche, en grammes par jour.
 * null si rien n'est écrit ou si la valeur n'est pas lisible : le carnet ne choisit pas de limite.
 */
export function limiteSelG(etat) {
  const v = consigneCourante(etat, 'sel_limite');
  if (!v) return null;
  const propre = v.valeur.toLowerCase().replace(/grammes?|g\b/g, ' ').replace(',', '.').replace(/\s+/g, '');
  if (!/^\d+(\.\d+)?$/.test(propre)) return null;
  const g = Number(propre);
  return g < 0.5 || g > 15 ? null : g;
}

/** Ce qu'une quantité de sel représente par rapport à la limite écrite, en pourcentage arrondi. */
export function partDeLaLimite(selG, limiteG) {
  if (selG === null || limiteG === null || !(limiteG > 0)) return null;
  return Math.round((selG / limiteG) * 100);
}

/** Combien de grammes d'un aliment apportent 1 g de sel, d'après sa teneur pour 100 g. null si elle est nulle. */
export function grammesPourUnGrammeDeSel(selPour100g) {
  return selPour100g > 0 ? 100 / selPour100g : null;
}

/** Étiquette : le sodium (en mg) converti en sel (en g). Sel = sodium × 2,5. */
export function selDepuisSodium(sodiumMg) {
  const mg = Number(String(sodiumMg ?? '').replace(',', '.').replace(/\s+/g, ''));
  if (!Number.isFinite(mg) || mg < 0 || String(sodiumMg ?? '').trim() === '') return null;
  return Math.round(mg * 2.5) / 1000;
}

/** Étiquette : le sel d'une portion, à partir du sel pour 100 g et du poids de la portion. */
export function selDeLaPortion(selPour100g, portionG) {
  const lire = (v) => (String(v ?? '').trim() === '' ? NaN : Number(String(v).replace(',', '.').replace(/\s+/g, '')));
  const sel = lire(selPour100g), portion = lire(portionG);
  if (!Number.isFinite(sel) || !Number.isFinite(portion) || sel < 0 || portion < 0) return null;
  return Math.round(sel * portion * 10) / 1000;
}

// ---------- Boissons : la bouteille du jour ----------

/**
 * La limite écrite sur la fiche, en millilitres. Le champ est en litres (« 1,5 »).
 * null si rien n'est écrit ou si la valeur n'est pas un nombre de litres plausible : on ne devine pas.
 */
export function limiteBoissonsMl(etat) {
  const v = consigneCourante(etat, 'boissons_limite');
  if (!v) return null;
  const propre = v.valeur.toLowerCase().replace(/litres?|l\b/g, ' ').replace(',', '.').replace(/\s+/g, '');
  if (!/^\d+(\.\d+)?$/.test(propre)) return null;
  const litres = Number(propre);
  if (litres < 0.2 || litres > 6) return null;
  return Math.round(litres * 1000);
}

/** Note une boisson (en mL) pour un jour. */
export function boire(etat, date, ml, maintenant) {
  if (!estDateIso(date)) throw new Error('La date est invalide.');
  const quantite = Math.round(Number(String(ml ?? '').replace(',', '.').replace(/\s+/g, '')));
  if (!Number.isFinite(quantite) || quantite < 10 || quantite > 2000) throw new Error('Quantité illisible : entre 10 et 2000 mL (exemple : 200).');
  const duJour = [...(etat.boissons[date] ?? []), { ml: quantite, saisiLe: maintenant }];
  return { ...etat, boissons: { ...etat.boissons, [date]: duJour } };
}

/** Retire une boisson notée par erreur (par sa position dans la journée). */
export function retirerBoisson(etat, date, position) {
  const duJour = (etat.boissons[date] ?? []).filter((_, i) => i !== Number(position));
  return { ...etat, boissons: { ...etat.boissons, [date]: duJour } };
}

export const boissonsDuJour = (etat, date) => etat.boissons[date] ?? [];
export const totalBuMl = (etat, date) => boissonsDuJour(etat, date).reduce((somme, b) => somme + b.ml, 0);

// ---------- Rendez-vous ----------

export function ajouterRendezVous(etat, saisie, maintenant) {
  if (!estDateIso(saisie.date)) throw new Error('La date du rendez-vous est invalide.');
  const rdv = { id: nouvelId('rdv', maintenant), date: saisie.date, heure: texte(saisie.heure), avec: texte(saisie.avec), lieu: texte(saisie.lieu) };
  const rendezVous = [...etat.rendezVous, rdv].sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  return { ...etat, rendezVous };
}

export function retirerRendezVous(etat, id) {
  return { ...etat, rendezVous: etat.rendezVous.filter((r) => r.id !== id) };
}

export const rendezVousAVenir = (etat, aujourdhui) => etat.rendezVous.filter((r) => r.date >= aujourdhui);

// ---------- Sauvegarde : export et réimport ----------

export function exporter(etat, maintenant, photos = {}) {
  return JSON.stringify({ format: FORMAT, schema: SCHEMA, exporteLe: maintenant, donnees: etat, photos }, null, 2);
}

const estObjet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Vérifie et remet en forme des données lues (fichier ou stockage). Lève une erreur lisible sinon. */
export function valider(donnees) {
  if (!estObjet(donnees)) throw new Error('Le fichier ne contient pas de carnet.');
  if (donnees.schema !== SCHEMA) throw new Error(`Version de carnet inconnue (${donnees.schema}). Cette application lit la version ${SCHEMA}.`);
  let etat = etatVide();
  etat.exemple = Boolean(donnees.exemple);

  if (!estObjet(donnees.consignes)) throw new Error('Consignes illisibles.');
  for (const [id, versions] of Object.entries(donnees.consignes)) {
    if (!Array.isArray(versions)) throw new Error(`Consigne illisible : ${id}`);
    etat.consignes[id] = versions.map((v) => {
      if (!estObjet(v) || !texte(v.valeur)) throw new Error(`Consigne illisible : ${id}`);
      return { valeur: texte(v.valeur), auteur: texte(v.auteur), date: dateOuVide(v.date), reevaluerLe: dateOuVide(v.reevaluerLe), saisiLe: texte(v.saisiLe) };
    });
  }

  if (!Array.isArray(donnees.poids)) throw new Error('Pesées illisibles.');
  etat.poids = donnees.poids.map((p) => {
    const kg = lireKg(p?.kg);
    if (!estDateIso(p?.date) || kg === null) throw new Error('Une pesée est illisible.');
    return { date: p.date, kg, saisiLe: texte(p.saisiLe) };
  }).sort((a, b) => a.date.localeCompare(b.date));

  if (!Array.isArray(donnees.medicaments)) throw new Error('Médicaments illisibles.');
  etat.medicaments = donnees.medicaments.map((m) => {
    if (!estObjet(m) || !texte(m.id)) throw new Error('Un médicament est illisible.');
    return { id: m.id, ...lireMedicament(m), saisiLe: texte(m.saisiLe), arreteLe: dateOuVide(m.arreteLe) };
  });

  if (!estObjet(donnees.prises)) throw new Error('Prises illisibles.');
  for (const [date, duJour] of Object.entries(donnees.prises)) {
    if (!estDateIso(date) || !estObjet(duJour)) throw new Error('Une journée de prises est illisible.');
    etat.prises[date] = Object.fromEntries(Object.entries(duJour).map(([cle, quand]) => [cle, texte(quand) || 'oui']));
  }

  if (!Array.isArray(donnees.rendezVous)) throw new Error('Rendez-vous illisibles.');
  etat.rendezVous = donnees.rendezVous.map((r) => {
    if (!estObjet(r) || !texte(r.id) || !estDateIso(r.date)) throw new Error('Un rendez-vous est illisible.');
    return { id: r.id, date: r.date, heure: texte(r.heure), avec: texte(r.avec), lieu: texte(r.lieu) };
  });

  if (donnees.boissons !== undefined) {
    if (!estObjet(donnees.boissons)) throw new Error('Boissons illisibles.');
    for (const [date, duJour] of Object.entries(donnees.boissons)) {
      if (!Array.isArray(duJour)) throw new Error('Une journée de boissons est illisible.');
      for (const b of duJour) etat = boire(etat, date, b?.ml, texte(b?.saisiLe));
    }
  }

  // Absent des carnets enregistrés avant l'ajout du volet Alimentation : vide dans ce cas.
  if (donnees.suivi !== undefined) {
    if (!estObjet(donnees.suivi)) throw new Error('Aide-mémoire alimentation illisible.');
    for (const [periode, comptes] of Object.entries(donnees.suivi)) {
      if (!estObjet(comptes)) throw new Error('Aide-mémoire alimentation illisible.');
      for (const [id, n] of Object.entries(comptes)) etat = reglerSuivi(etat, periode, id, n);
    }
  }

  return etat;
}

/** Lit un fichier d'export. Lève une erreur lisible si ce n'en est pas un. */
export function importer(contenu) {
  let lu;
  try { lu = JSON.parse(contenu); } catch { throw new Error('Ce fichier n’est pas une sauvegarde du carnet.'); }
  if (!estObjet(lu) || lu.format !== FORMAT) throw new Error('Ce fichier n’est pas une sauvegarde du carnet.');
  return valider(lu.donnees);
}

/** Les photos contenues dans un fichier d'export : { identifiant du médicament: image }. */
export function photosDeLaSauvegarde(contenu) {
  const lu = JSON.parse(contenu);
  if (lu.photos === undefined) return {};
  if (!estObjet(lu.photos)) throw new Error('Les photos de la sauvegarde sont illisibles.');
  for (const image of Object.values(lu.photos)) {
    if (typeof image !== 'string' || !image.startsWith('data:image/')) throw new Error('Une photo de la sauvegarde est illisible.');
  }
  return lu.photos;
}

// ---------- Exemple fictif ----------

/** Un carnet d'exemple, entièrement inventé, pour voir l'application remplie. */
export function etatExemple(aujourdhui) {
  const quand = `${aujourdhui}T08:00:00`;
  const ecrit = ajouterJours(aujourdhui, -20);
  const auteur = 'Dr Exemple (fictif)';
  let e = { ...etatVide(), exemple: true };
  const consigne = (id, valeur, reevaluerLe = '', qui = auteur) => { e = ecrireConsigne(e, id, { valeur, auteur: qui, date: ecrit, reevaluerLe }, quand); };

  consigne('fc_repos', '62');
  consigne('fc_cible_min', '95', ajouterJours(aujourdhui, 70));
  consigne('fc_cible_max', '110', ajouterJours(aujourdhui, 70));
  consigne('ressenti_effort', '« Un peu difficile », sur l’échelle utilisée par le service');
  consigne('duree_seance', '30');
  consigne('frequence_semaine', '3');
  consigne('activites_autorisees', 'Marche, vélo d’appartement', ajouterJours(aujourdhui, -2));
  consigne('port_charges', '5', ajouterJours(aujourdhui, 40));
  consigne('sel_limite', '6');
  consigne('poids_reference', '78');
  consigne('boissons_limite', '1,5');
  consigne('boissons', 'Exemple de phrase écrite par le médecin : « Tout compte : eau, café, soupe, yaourts. »');
  consigne('consigne_poids', 'Exemple de phrase écrite par le médecin : « Prévenir le service en cas de prise de 2 kg en 3 jours. »');
  consigne('en_cas_d_oubli', 'Exemple de phrase écrite par le médecin : « Ne pas doubler la prise suivante. En cas de doute, appeler la pharmacie. »');
  e = ecrireConsigne(e, 'numero_service', { valeur: '00 00 00 00 00 (exemple)' }, quand);
  e = ecrireConsigne(e, 'cardiologue', { valeur: 'Dr Exemple (fictif)' }, quand);

  const medicament = (nom, dose, moments, aQuoiCaSert) => { e = ajouterMedicament(e, { nom, dose, moments, aQuoiCaSert, ecritPar: auteur }, quand); };
  medicament('Médicament A (exemple)', '5 mg', { matin: true }, 'Ici, la ligne écrite par le soignant : à quoi sert ce médicament.');
  medicament('Médicament B (exemple)', '2,5 mg', { matin: true, soir: true }, 'Ici, la ligne écrite par le soignant.');
  medicament('Médicament C (exemple)', '40 mg', { matin: true }, '');

  // Pesées inventées, sans tendance voulue : une petite variation régulière autour de 78 kg.
  const ecarts = [0.2, -0.1, 0.3, 0, -0.3, 0.1, 0.4, 0.2, -0.2, 0, 0.3, 0.5, 0.1, -0.1, 0.2, 0.4, 0, -0.2, 0.1, 0.3, 0.6, 0.2, 0, 0.3, 0.1, -0.1, 0.2, 0.4];
  ecarts.forEach((ecart, i) => {
    if (i % 9 === 5) return; // quelques jours sans pesée, comme dans la vraie vie
    e = noterPoids(e, { date: ajouterJours(aujourdhui, i - ecarts.length), kg: 78 + ecart }, quand);
  });

  e = basculerPrise(e, aujourdhui, e.medicaments[0].id, 'matin', quand);
  e = boire(e, aujourdhui, 250, quand);
  e = boire(e, aujourdhui, 200, quand);
  e = ajouterRendezVous(e, { date: ajouterJours(aujourdhui, 12), heure: '10:30', avec: 'Cardiologue (exemple)', lieu: 'Consultation' }, quand);
  return e;
}
