// Écrans du carnet. Règle fondatrice : l'application ne décide jamais.
// Elle affiche ce qui a été écrit, par qui et quand ; elle ne juge aucune valeur et ne calcule aucun seuil.

import { THEMES, CHAMPS, MOMENTS, CHAMP_OUBLI, DISPOSITIF } from './modele.js';
import * as store from './store.js';
import { geometrie } from './courbe.js';
import * as depot from './photos.js';
import * as coffre from './documents.js';
import { GROUPES, POUR_LE_GOUT, SOURCES, CHAMPS_DE_LA_FICHE, RELU_LE } from './alimentation.js';
import { FAMILLES_SEL, VERSION_CIQUAL } from './sel-aliments.js';
import { EAUX, VERSION_CIQUAL_EAUX } from './sel-eaux.js';
import { deballerTout, contientDesConsignes } from './transmission.js';
import { VERSION_APPLI, ech, ic } from './affichage.js';
import { versIso, dateLongue, dateCourte, dateTresCourte, ajouterJours } from './dates.js';

const CLE = 'carnet-coeur';
const VUES = [
  { id: 'aujourdhui', libelle: 'Accueil', icone: 'soleil' },
  { id: 'poids', libelle: 'Poids', icone: 'balance' },
  { id: 'alimentation', libelle: 'Alimentation', icone: 'alimentation' },
  { id: 'liquides', libelle: 'Liquides', icone: 'goutte' },
  { id: 'seances', libelle: 'Séances', icone: 'activite' },
  { id: 'medicaments', libelle: 'Médicaments', icone: 'medicaments' },
];
// « Ma fiche » n'est plus dans la barre du bas : on y va depuis l'accueil.
// « soignant » : dans le carnet, les fiches reçues des soignants. Le soignant, lui, remplit soignant.html (versions 13 et 14).
// « remplir » : la fiche de sortie recopiée en une fois (version 17).
// « documents » : le coffre à documents (version 21).
const ROUTES = [...VUES.map((v) => v.id), 'fiche', 'soignant', 'remplir', 'documents'];

// ---------- État ----------

function charger() {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? store.valider(JSON.parse(brut)) : store.etatVide();
  } catch (e) {
    console.error('Carnet illisible dans le stockage de l’appareil', e);
    return store.etatVide();
  }
}

let etat = charger();
let photos = new Map(); // identifiant du médicament → image, chargées au démarrage
const ui = { vue: vueDepuisAdresse(), feuille: null, periode: 30, erreur: '', recherche: '', rechercheEau: '', famillesOuvertes: new Set(), themesOuverts: new Set(['coeur']), momentsOuverts: new Set(), messageFiche: '' };

function vueDepuisAdresse() {
  const id = location.hash.slice(1);
  return ROUTES.includes(id) ? id : 'aujourdhui';
}

function enregistrer(nouvelEtat) {
  etat = nouvelEtat;
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { console.error('Enregistrement impossible', e); }
}

const aujourdhui = () => versIso();
const maintenant = () => new Date().toISOString();

// ---------- Brouillon de la fiche (version 17) ----------
// Ce qui est tapé dans « Remplir ma fiche » est gardé sur l'appareil à chaque frappe, à part du carnet :
// un geste « retour » ou une appli fermée par erreur ne fait rien perdre. Effacé quand la fiche est enregistrée.

const CLE_BROUILLON = 'carnet-coeur-brouillon';

function lireBrouillon() {
  try {
    const b = JSON.parse(localStorage.getItem(CLE_BROUILLON));
    return b && typeof b === 'object' && b.saisie && typeof b.saisie === 'object' ? b : null;
  } catch { return null; }
}

function sauverBrouillon(saisie) {
  const commenceLe = lireBrouillon()?.commenceLe ?? maintenant();
  try { localStorage.setItem(CLE_BROUILLON, JSON.stringify({ commenceLe, saisie })); } catch (e) { console.error('Brouillon non gardé', e); }
}

function effacerBrouillon() {
  try { localStorage.removeItem(CLE_BROUILLON); } catch { /* rien à faire */ }
}

// ---------- Petits outils d'affichage ----------

const nombre = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** « Écrit par … le … » : toujours affiché, même incomplet, pour que le manque se voie. */
function origine(version) {
  const qui = version.auteur ? `Écrit par ${ech(version.auteur)}` : 'Auteur non renseigné';
  const quand = version.date ? `le ${dateCourte(version.date)}` : 'date non renseignée';
  return `${qui} · ${quand}`;
}

function etiquetteReevaluation(version) {
  if (!version.reevaluerLe) return '';
  return store.estAReevaluer(version, aujourdhui())
    ? `<span class="etiquette ambre">${ic('horloge', 14)} À réévaluer depuis le ${dateCourte(version.reevaluerLe)}</span>`
    : `<span class="etiquette neutre">À réévaluer le ${dateCourte(version.reevaluerLe)}</span>`;
}

function parole(idChamp) {
  const v = store.consigneCourante(etat, idChamp);
  if (!v) return '';
  return `<div class="parole"><div class="texte">${ech(v.valeur)}</div><div class="origine">${origine(v)}</div>${etiquetteReevaluation(v)}</div>`;
}

const avecUnite = (champ, valeur) => (champ.unite ? `${ech(valeur)} ${champ.unite}` : ech(valeur));

// ---------- Écran : Aujourd'hui ----------

function carnetVide() {
  return !Object.keys(etat.consignes).length && !etat.poids.length && !etat.medicaments.length && !etat.rendezVous.length;
}

function vueAujourdhui() {
  const jour = aujourdhui();
  const meds = store.medicamentsEnCours(etat);
  const prisesPrevues = meds.flatMap((m) => MOMENTS.filter((mo) => m.moments[mo.id]).map((mo) => [m.id, mo.id]));
  const prisesFaites = prisesPrevues.filter(([m, mo]) => store.estPris(etat, jour, m, mo)).length;
  const pesee = etat.poids.find((p) => p.date === jour);
  const aVenir = store.rendezVousAVenir(etat, jour);
  const prochain = aVenir[0];

  const puces = [
    pesee ? `${ic('coche', 15)} Poids noté` : `${ic('balance', 15)} Poids à noter`,
    prisesPrevues.length ? `${ic('medicaments', 15)} ${prisesFaites} prise${prisesFaites > 1 ? 's' : ''} cochée${prisesFaites > 1 ? 's' : ''} sur ${prisesPrevues.length}` : '',
    prochain ? `${ic('calendrier', 15)} Rendez-vous le ${dateTresCourte(prochain.date)}` : '',
  ].filter(Boolean);

  const bandeau = `
    <section class="accueil">
      <div class="sur-titre">Aujourd’hui</div>
      <h1>${ech(dateLongue(jour))}</h1>
      <div class="resume">${puces.map((p) => `<span class="puce">${p}</span>`).join('')}</div>
    </section>`;

  const lienFiche = `<button class="carte lien-carte" data-action="nav:fiche">
      <span class="pastille primaire">${ic('fiche')}</span>
      <span class="corps"><b>Ma fiche de sortie</b><br><span class="discret">Toutes les consignes écrites par mes soignants</span></span>
      <span class="chevron">${ic('chevron', 18)}</span>
    </button>`;

  const nbDocs = (etat.documents ?? []).length;
  const lienDocuments = `<button class="carte lien-carte" data-action="nav:documents">
      <span class="pastille bleu">${ic('dossier')}</span>
      <span class="corps"><b>Mes documents</b><br><span class="discret">${nbDocs ? `${nbDocs} document${nbDocs > 1 ? 's' : ''} rangé${nbDocs > 1 ? 's' : ''} sur ce téléphone` : 'Ordonnances, prises de sang, comptes rendus'}</span></span>
      <span class="chevron">${ic('chevron', 18)}</span>
    </button>`;
  const lienTabac = etat.tabac?.actif ? '' : `<button class="carte lien-carte discrete" data-action="tabac-activer">
      <span class="pastille ambre">${ic('tabac')}</span>
      <span class="corps"><b>Suivre mon tabac</b><br><span class="discret">Pour qui fume : un compteur par jour, sur l’accueil</span></span>
      <span class="chevron">${ic('plus', 18)}</span>
    </button>`;

  const nbFiches = (etat.fichesRecues ?? []).length;
  const lienSoignant = `<button class="carte lien-carte" data-action="nav:soignant">
      <span class="pastille vert">${ic('fiche')}</span>
      <span class="corps"><b>Espace soignant</b><br><span class="discret">${nbFiches ? `${nbFiches} fiche${nbFiches > 1 ? 's' : ''} reçue${nbFiches > 1 ? 's' : ''} de mes soignants` : 'Les fiches envoyées par mes soignants'}</span></span>
      <span class="chevron">${ic('chevron', 18)}</span>
    </button>`;

  if (carnetVide()) {
    return `${bandeau}${carteBrouillon()}${tuilesAccueil()}
      <section class="carte">
        <div class="carte-tete"><span class="pastille primaire">${ic('coeur')}</span><h2>Bienvenue dans votre carnet</h2></div>
        <p class="discret">Il range au même endroit ce que vos soignants ont écrit pour vous, votre poids jour après jour et vos médicaments. Tout reste sur cet appareil.</p>
        <div class="rangee" style="margin-top:16px">
          <button class="bouton" data-action="nav:remplir">Remplir ma fiche</button>
          <button class="bouton secondaire" data-action="exemple">Voir un exemple</button>
        </div>
      </section>
      ${lienDocuments}${lienSoignant}
      ${mention()}`;
  }

  const cartePoids = `
    <section class="carte">
      <div class="carte-tete"><span class="pastille primaire">${ic('balance')}</span><h2>Mon poids</h2><button class="lien" data-action="nav:poids">Courbe</button></div>
      ${pesee
        ? `<div class="grand-nombre">${nombre(pesee.kg)}<small>kg</small></div><p class="discret" style="margin-top:6px">Noté aujourd’hui.</p>`
        : `<form class="saisie-rapide" data-form="poids-rapide">
             <div class="champ-unite"><input type="text" name="kg" inputmode="decimal" placeholder="Poids du jour" aria-label="Poids du jour en kilos" autocomplete="off" required><span>kg</span></div>
             ${boutonDicter()}
             <button class="bouton" type="submit">Noter</button>
           </form>${ui.erreur ? `<p class="erreur" style="margin-top:10px">${ech(ui.erreur)}</p>` : ''}`}
    </section>`;

  const blocsMoments = MOMENTS.map((mo) => {
    const duMoment = meds.filter((m) => m.moments[mo.id]);
    if (!duMoment.length) return '';
    const resteACocher = duMoment.some((m) => !store.estPris(etat, jour, m.id, mo.id));
    // Version 22 : un moment dont tout est pris se replie en une seule case, pour laisser de la place sur l'accueil.
    // La toucher la rouvre (pour décocher un médicament coché par erreur) ; « Replier » la referme.
    const ouvert = ui.momentsOuverts.has(`${jour}|${mo.id}`);
    if (duMoment.length > 1 && !resteACocher && !ouvert) {
      return `<button class="prise fait moment-pris" data-action="ouvrir-moment:${mo.id}" aria-label="Médicaments du ${mo.libelle.toLowerCase()} : tous pris. Toucher pour revoir la liste.">
        <span class="case">${ic('coche', 18)}</span>
        <span class="corps"><span class="nom">Médicaments du ${mo.libelle.toLowerCase()}</span><br><span class="dose">${duMoment.length} pris : ${ech(duMoment.map((m) => m.nom).join(', '))}</span></span>
        <span class="chevron">${ic('chevron', 16)}</span>
      </button>`;
    }
    const toutCoche = duMoment.length > 1 && resteACocher
      ? `<button class="tout-pris" data-action="tout-pris:${mo.id}">${ic('coche', 15)} Tout le ${mo.libelle.toLowerCase()} est pris</button>`
      : duMoment.length > 1 ? `<button class="lien-discret replier" data-action="replier-moment:${mo.id}">Replier</button>` : '';
    return `<div class="moment-tete"><div class="moment">${mo.libelle}</div>${toutCoche}</div>${duMoment.map((m) => {
      const fait = store.estPris(etat, jour, m.id, mo.id);
      return `<button class="prise${fait ? ' fait' : ''}" data-action="prise:${m.id}:${mo.id}" aria-pressed="${fait}">
        <span class="case">${ic('coche', 18)}</span>
        <span><span class="nom">${ech(m.nom)}</span>${m.dose ? `<br><span class="dose">${ech(m.dose)}</span>` : ''}</span>
      </button>`;
    }).join('')}`;
  }).join('');

  const carteMeds = `
    <section class="carte">
      <div class="carte-tete"><span class="pastille bleu">${ic('medicaments')}</span><h2>Mes médicaments du jour</h2><button class="lien" data-action="nav:medicaments">Liste</button></div>
      ${blocsMoments || `<p class="vide">Aucun médicament saisi.</p><button class="bouton secondaire large" style="margin-top:12px" data-action="ouvrir:medicament">${ic('plus', 18)} Ajouter un médicament</button>`}
    </section>`;

  const carteRdv = `
    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('calendrier')}</span><h2>Mes rendez-vous</h2><button class="lien" data-action="ouvrir:rdv">Ajouter</button></div>
      ${aVenir.length
        ? `<ul class="liste">${aVenir.map((r) => `<li><div class="ligne"><div class="corps">
             <div class="valeur">${ech(dateLongue(r.date))}${r.heure ? ` à ${ech(r.heure.replace(':', ' h '))}` : ''}</div>
             <div class="libelle">${ech([r.avec, r.lieu].filter(Boolean).join(' · ')) || 'Sans précision'}</div>
           </div><button class="bouton-rond" data-action="suppr-rdv:${r.id}" aria-label="Retirer le rendez-vous du ${dateCourte(r.date)}">${ic('croix', 18)}</button></div></li>`).join('')}</ul>`
        : '<p class="vide">Aucun rendez-vous noté.</p>'}
    </section>`;

  const aRevoir = store.consignesAReevaluer(etat, jour);
  const carteRevoir = aRevoir.length ? `
    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('horloge')}</span><h2>Consignes à faire réévaluer</h2></div>
      <p class="discret">La date de réévaluation écrite sur la fiche est atteinte. La consigne reste affichée telle quelle : seul le médecin peut la changer.</p>
      <ul class="liste" style="margin-top:6px">${aRevoir.map(({ id, version }) => `
        <li><button class="ligne" data-action="ouvrir:consigne:${id}"><span class="corps">
          <span class="libelle">${ech(CHAMPS.get(id).libelle)}</span><br>
          <span class="valeur">${avecUnite(CHAMPS.get(id), version.valeur)}</span><br>
          <span class="meta">À réévaluer depuis le ${dateCourte(version.reevaluerLe)}</span>
        </span><span class="chevron">${ic('chevron', 18)}</span></button></li>`).join('')}</ul>
    </section>` : '';

  return `${bandeau}${carteBrouillon()}${bandeauReception()}${bandeauExemple()}${tuilesAccueil()}${cartePoids}${carteMeds}${carteTabac()}${carteRdv}${carteRevoir}${lienFiche}${lienDocuments}${lienSoignant}${lienTabac}${mention()}`;
}

// ---------- Tabac : suivi quotidien (version 21) ----------
// Sur l'accueil seulement si la personne l'a demandé. Aucun objectif, aucune couleur qui juge : on compte, c'est tout.

function carteTabac() {
  if (!etat.tabac?.actif) return '';
  const jour = aujourdhui();
  const note = store.tabacDuJour(etat, jour);
  const semaine = store.semaineDeTabac(etat, jour);
  const notes = semaine.filter((j) => j.note);
  const total = notes.reduce((n, j) => n + j.note.cigarettes, 0);
  const ronds = semaine.map((j, i) => {
    const dit = j.note ? `${j.note.cigarettes} cigarette${j.note.cigarettes > 1 ? 's' : ''}${j.note.substitut ? ', substitut' : ''}` : 'rien de noté';
    return `<div class="jour-semaine${j.date === jour ? ' aujourdhui' : ''}${j.date > jour ? ' futur' : ''}"><span class="lettre">${JOURS_COURTS[i]}</span>
      <span class="rond ${j.note ? 'tabac' : 'vide'}" title="${dateCourte(j.date)} : ${dit}" aria-label="${ech(dateLongue(j.date))} : ${dit}">${j.note ? j.note.cigarettes : ''}${j.note?.substitut ? '<i>S</i>' : ''}</span></div>`;
  }).join('');
  return `<section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('tabac')}</span><h2>Mon tabac aujourd’hui</h2></div>
      <div class="compteur-tabac">
        <button class="bouton-rond grand" data-action="tabac:-1" aria-label="Retirer une cigarette" ${note && note.cigarettes > 0 ? '' : 'disabled'}>–</button>
        <div class="compte-tabac">${note ? `<b>${note.cigarettes}</b><span>cigarette${note.cigarettes > 1 ? 's' : ''}</span>` : '<span class="vide">Rien de noté</span>'}</div>
        <button class="bouton-rond grand plein" data-action="tabac:1" aria-label="Ajouter une cigarette">+</button>
      </div>
      ${note ? '' : '<button class="bouton secondaire large" data-action="tabac:0">Aucune aujourd’hui</button>'}
      <button class="prise${note?.substitut ? ' fait' : ''}" data-action="tabac-substitut" aria-pressed="${Boolean(note?.substitut)}">
        <span class="case">${ic('coche', 18)}</span><span><span class="nom">Substitut aujourd’hui</span><br><span class="dose">patch, gomme, pastille, vapoteuse…</span></span>
      </button>
      <div class="semaine-bloc" style="margin-top:14px"><div class="semaine-titre"><span>Cette semaine</span><b>${notes.length ? `${total} cigarette${total > 1 ? "s" : ""} · ${notes.length} jour${notes.length > 1 ? 's' : ''} noté${notes.length > 1 ? 's' : ''}` : 'rien de noté'}</b></div><div class="semaine">${ronds}</div></div>
      <p class="discret" style="margin-top:10px">Un jour vide veut dire « rien de noté », pas « zéro ». S = substitut. Le carnet ne fixe aucun objectif : parlez-en à votre médecin ou à un tabacologue (Tabac info service : 39 89).</p>
      <button class="lien-discret" data-action="tabac-masquer">Ne plus afficher sur l’accueil</button>
    </section>`;
}

/** Les priorités, toujours en haut de l'accueil : poids, alimentation, liquides, et les séances (version 16). */
function tuilesAccueil() {
  const jour = aujourdhui();
  const pesee = etat.poids.find((p) => p.date === jour);
  const derniere = etat.poids[etat.poids.length - 1];
  const sel = store.limiteSelG(etat);
  const limite = store.limiteBoissonsMl(etat);
  const reste = limite === null ? null : limite - store.totalBuMl(etat, jour);
  const tuile = (vue, couleur, icone, titre, valeur, detail) => `<button class="tuile-accueil ${couleur}" data-action="nav:${vue}">
      <span class="pastille ${couleur}">${ic(icone, 24)}</span><b>${titre}</b><span class="val">${valeur}</span><small>${detail}</small>
    </button>`;
  return `<div class="tuiles-accueil">
    ${tuile('poids', 'primaire', 'balance', 'Poids', pesee ? `${nombre(pesee.kg)} kg` : 'À noter', pesee ? 'noté aujourd’hui' : derniere ? `dernier : ${nombre(derniere.kg)} kg` : 'aucune pesée')}
    ${tuile('alimentation', 'ambre', 'alimentation', 'Alimentation', sel === null ? 'À régler' : `${sel.toLocaleString('fr-FR')} g de sel`, sel === null ? 'ma limite de sel' : 'ma limite par jour')}
    ${tuile('liquides', 'bleu', 'goutte', 'Liquides', reste === null ? 'À régler' : reste >= 0 ? enMl(reste) : `+ ${enMl(-reste)}`, reste === null ? 'ma limite de liquide' : reste >= 0 ? 'restent aujourd’hui' : 'au-delà de la limite')}
    ${tuile('seances', 'vert', 'activite', 'Séances', valeurTuileSeances(), 'faites cette semaine')}
  </div>`;
}

function valeurTuileSeances() {
  const faites = store.seancesFaitesLaSemaine(etat, aujourdhui());
  const ecrites = store.seancesParSemaineEcrites(etat);
  return ecrites === null ? String(faites) : `${faites} sur ${ecrites}`;
}

/** Saisie d'une limite sur place, sans passer par la fiche. La valeur est rangée dans la fiche quand même. */
function formulaireLimite(id, { unite, exemple, question }) {
  return `<form data-form="limite" data-id="${id}" style="display:grid;gap:10px">
    <label class="champ">${question}<span class="champ-unite"><input type="text" name="valeur" inputmode="decimal" placeholder="${exemple}" autocomplete="off" required><span>${unite}</span></span></label>
    ${ui.erreurLimite ? `<p class="erreur">${ech(ui.erreurLimite)}</p>` : ''}
    <button class="bouton large" type="submit">Valider</button>
    <p class="discret">Donnez la limite fixée par votre médecin. Le carnet n’en choisit pas à sa place.</p>
  </form>`;
}

/** Ouvre le clavier complet, celui qui a un micro : la dictée est celle du téléphone, pas de l'application. */
function boutonDicter() {
  return `<button class="bouton-rond dicter" type="button" data-action="dicter" aria-label="Dicter le poids avec le micro du clavier" title="Dicter avec le micro du clavier">${ic('micro')}</button>`;
}

// ---------- Consignes transmises par un soignant, sans serveur ----------

/** Si l'adresse d'ouverture contient des consignes, on les présente au patient, puis on les retire de l'adresse. */
async function traiterReception() {
  if (!contientDesConsignes(location.hash)) return;
  const fragment = location.hash;
  history.replaceState(null, '', '#aujourdhui');
  ui.vue = 'aujourdhui';
  try { ui.feuille = { type: 'reception', colis: await deballerTout(fragment) }; } catch (e) { ui.feuille = { type: 'reception', erreur: e.message }; }
}

function feuilleReception({ colis, erreur }) {
  const tete = (titre) => `<div class="feuille-tete"><h2>${titre}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>`;
  if (erreur) return `${tete('Consignes illisibles')}<div class="bloc"><p class="erreur">${ech(erreur)}</p><p class="discret">Rien n’a été changé dans votre carnet. Demandez à votre soignant de refaire le code.</p><button class="bouton large" data-action="fermer">Fermer</button></div>`;
  return `${tete('Consignes de votre soignant')}
    <div class="bloc">
      <section class="carte">
        <p class="discret">Écrites par</p>
        <p class="valeur" style="font-weight:700;font-size:1.1rem">${ech(colis.auteur)}</p>
        <p class="discret">le ${dateCourte(colis.date)}${colis.reevaluerLe ? ` · à réévaluer le ${dateCourte(colis.reevaluerLe)}` : ''}</p>
      </section>
      ${colis.consignes.length ? `<section class="carte"><ul class="liste">${colis.consignes.map(({ id, valeur }) => `<li class="ligne"><span class="corps"><span class="libelle">${ech(CHAMPS.get(id).libelle)}</span><br><span class="valeur">${avecUnite(CHAMPS.get(id), valeur)}</span></span></li>`).join('')}</ul></section>` : ''}
      ${receptionMedicaments(colis)}
      <p class="discret">Le carnet ne peut pas vérifier qui a écrit ces consignes : ajoutez-les seulement si elles viennent bien de votre soignant. Vos consignes précédentes restent dans l’historique.</p>
      <button class="bouton large" data-action="accepter-reception">Ajouter à mon carnet</button>
      <button class="bouton neutre large" data-action="fermer">Ne pas ajouter</button>
    </div>`;
}

const descriptionPrise = (m) => [m.dose, MOMENTS.filter((mo) => m.moments[mo.id]).map((mo) => mo.libelle.toLowerCase()).join(', ')].filter(Boolean).join(' · ') || 'dose et moment non renseignés';

const ETIQUETTES_MEDICAMENT = {
  nouveau: ['vert', 'Nouveau'],
  change: ['ambre', 'Modifié'],
  inchange: ['neutre', 'Sans changement'],
  arret: ['corail', 'Arrêté'],
  'arret-introuvable': ['neutre', 'Absent de votre carnet'],
};

/** Ce que les médicaments transmis changeraient, ligne par ligne, AVANT que le patient accepte. */
function receptionMedicaments(colis) {
  if (!colis.medicaments?.length) return '';
  const { lignes, restent } = store.comparerMedicaments(etat, colis.medicaments);
  const ligne = ({ type, recu, actuel }) => {
    const [couleur, mot] = ETIQUETTES_MEDICAMENT[type];
    const detail = type === 'change' ? `Avant : ${ech(descriptionPrise(actuel))}<br>Maintenant : <b>${ech(descriptionPrise(recu))}</b>`
      : type === 'arret' ? 'Retiré de la liste du jour. Les prises déjà cochées restent.'
      : type === 'arret-introuvable' ? 'Rien à arrêter : aucun médicament de ce nom dans votre carnet.'
      : `<b>${ech(descriptionPrise(recu))}</b>`;
    const aQuoi = recu.aQuoiCaSert && !type.startsWith('arret') ? `<br><span class="discret">À quoi ça sert : ${ech(recu.aQuoiCaSert)}</span>` : '';
    return `<li class="ligne"><span class="corps"><span class="libelle">${ech(actuel?.nom ?? recu.nom)}</span> <span class="etiquette ${couleur}">${mot}</span><br><span class="detail-med">${detail}</span>${aQuoi}</span></li>`;
  };
  const autres = restent.length
    ? `<p class="discret" style="margin-top:10px">Restent dans votre carnet sans changement : ${restent.map((m) => ech(m.nom)).join(', ')}. Si l’un d’eux figure aussi plus haut sous un autre nom (marque et générique), demandez à votre soignant ou à votre pharmacien.</p>`
    : '';
  return `<section class="carte">
      <div class="carte-tete"><span class="pastille bleu">${ic('medicaments')}</span><h2>Médicaments</h2></div>
      <ul class="liste">${lignes.map(ligne).join('')}</ul>
      ${autres}
    </section>`;
}

const adressePageSoignant = () => new URL('./soignant.html', location.href).href;

/** Côté patient, l'espace soignant garde les fiches reçues : on les relit, on ne les remplit pas ici. */
function vueSoignant() {
  const fiches = store.fichesRecues(etat);
  const ligne = (f) => {
    const n = f.consignes.length, m = f.medicaments.length;
    const quoi = [n ? `${n} consigne${n > 1 ? 's' : ''}` : '', m ? `${m} médicament${m > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
    return `<li><button class="ligne" data-action="ouvrir:fiche-recue:${f.id}">
        <span class="corps"><span class="libelle">${ech(f.auteur)}</span><br><span class="valeur">Écrite le ${f.date ? dateCourte(f.date) : '?'}</span><br><span class="meta">${quoi}</span></span>
        <span class="chevron">${ic('chevron', 18)}</span>
      </button></li>`;
  };
  return `<h1 class="titre-page">Espace soignant</h1>
    <p class="sous-titre">Les fiches que vos soignants vous ont transmises, telles qu’ils les ont écrites. Touchez une fiche pour la relire en détail.</p>
    <section class="carte">
      <div class="carte-tete"><span class="pastille vert">${ic('fiche')}</span><h2>Fiches reçues</h2><span class="compte">${fiches.length || ''}</span></div>
      ${fiches.length ? `<ul class="liste">${fiches.map(ligne).join('')}</ul>` : '<p class="vide">Aucune fiche reçue pour l’instant. Quand un soignant vous en transmet une, par un QR code ou un lien, elle reste rangée ici.</p>'}
    </section>
    <section class="carte">
      <div class="carte-tete"><span class="pastille primaire">${ic('telephone')}</span><h2>Pour votre soignant</h2></div>
      <p class="discret">Votre soignant remplit votre fiche sur son ordinateur, à cette adresse. Il n’a pas besoin du carnet.</p>
      <textarea class="lien-a-copier" readonly rows="2" aria-label="Adresse de la page soignant">${ech(adressePageSoignant())}</textarea>
      <div class="rangee">
        <button class="bouton secondaire" data-action="copier-adresse-soignant">Copier l’adresse</button>
        ${navigator.share ? '<button class="bouton secondaire" data-action="partager-adresse-soignant">Partager</button>' : ''}
      </div>
    </section>
    ${mention()}`;
}

/** Une fiche reçue, en détail : ce qui a été écrit, thème par thème, et ce qu'elle a changé dans les médicaments. */
function feuilleFicheRecue(id) {
  const f = (etat.fichesRecues ?? []).find((x) => x.id === id);
  const tete = `<div class="feuille-tete"><h2>Fiche reçue</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>`;
  if (!f) return `${tete}<p class="vide">Cette fiche n’existe plus dans le carnet.</p>`;
  const parTheme = [...THEMES, DISPOSITIF, { id: 'medicaments', titre: 'Prise des médicaments', icone: 'medicaments', couleur: 'bleu' }].map((th) => ({ th, lignes: f.consignes.filter((c) => CHAMPS.get(c.id)?.theme === th.id) })).filter((x) => x.lignes.length);
  const themes = parTheme.map(({ th, lignes }) => `<section class="carte">
      <div class="carte-tete"><span class="pastille ${th.couleur}">${ic(th.icone)}</span><h2>${ech(th.titre)}</h2></div>
      <ul class="liste">${lignes.map(({ id: c, valeur }) => `<li class="ligne"><span class="corps"><span class="libelle">${ech(CHAMPS.get(c).libelle)}</span><br><span class="valeur">${avecUnite(CHAMPS.get(c), valeur)}</span></span></li>`).join('')}</ul>
    </section>`).join('');
  const meds = f.medicaments.length ? `<section class="carte">
      <div class="carte-tete"><span class="pastille bleu">${ic('medicaments')}</span><h2>Médicaments</h2></div>
      <ul class="liste">${f.medicaments.map((m) => {
        const [couleur, mot] = ETIQUETTES_MEDICAMENT[m.type] ?? ['neutre', ''];
        const detail = m.type === 'change' && m.avant ? `Avant : ${ech(descriptionPrise(m.avant))}<br>Maintenant : <b>${ech(descriptionPrise(m))}</b>`
          : m.arreter ? (m.type === 'arret' ? 'Arrêté' : 'À arrêter, mais absent du carnet à la réception')
          : `<b>${ech(descriptionPrise(m))}</b>`;
        return `<li class="ligne"><span class="corps"><span class="libelle">${ech(m.nom)}</span> ${mot ? `<span class="etiquette ${couleur}">${mot}</span>` : ''}<br><span class="detail-med">${detail}</span>${m.aQuoiCaSert && !m.arreter ? `<br><span class="discret">À quoi ça sert : ${ech(m.aQuoiCaSert)}</span>` : ''}</span></li>`;
      }).join('')}</ul>
    </section>` : '';
  return `${tete}
    <div class="bloc">
      <section class="carte">
        <p class="discret">Écrite par</p>
        <p class="valeur" style="font-weight:700;font-size:1.1rem">${ech(f.auteur)}</p>
        <p class="discret">le ${f.date ? dateCourte(f.date) : '?'}${f.reevaluerLe ? ` · à réévaluer le ${dateCourte(f.reevaluerLe)}` : ''}<br>Reçue le ${f.recuLe ? dateCourte(f.recuLe.slice(0, 10)) : '?'}</p>
      </section>
      ${themes}${meds}
      <p class="discret">C’est la fiche telle qu’elle a été reçue. Si une valeur a été changée depuis, la valeur actuelle est dans « Ma fiche ».</p>
    </div>`;
}

function bandeauReception() {
  const r = etat.reception;
  if (!r || r.vu) return '';
  const quoi = [...r.ids.map((id) => CHAMPS.get(id)?.libelle), ...(r.medicaments ?? []).map((m) => `${m.nom} (${(ETIQUETTES_MEDICAMENT[m.type]?.[1] ?? '').toLowerCase()})`)].filter(Boolean).join(', ');
  return `<div class="bandeau reception">${ic('coche', 20)}<div class="corps"><b>Consignes mises à jour</b> le ${r.date ? dateCourte(r.date) : ''} par ${ech(r.auteur)}.<br><span class="discret">${ech(quoi)}</span><br><button data-action="vu-reception">J’ai vu</button></div></div>`;
}

// ---------- La bouteille du jour ----------

const RECIPIENTS = [
  { libelle: 'Tasse', ml: 150 },
  { libelle: 'Verre', ml: 200 },
  { libelle: 'Mug', ml: 250 },
  { libelle: 'Bol', ml: 350 },
  { libelle: 'Petite bouteille', ml: 500 },
];

const enMl = (n) => `${n.toLocaleString('fr-FR')} mL`;

/** Les eaux que l'on peut choisir : celles recopiées par la personne, puis la liste Ciqual. */
const toutesLesEaux = () => [...(etat.mesEaux ?? []).map((e) => ({ ...e, perso: true })), ...EAUX];
const eauDuCode = (code) => (code ? toutesLesEaux().find((e) => String(e.code) === String(code)) ?? null : null);
const eauChoisie = () => eauDuCode(etat.eauChoisie);
/** Ce qui est recopié dans la boisson notée. */
const eauPourBoire = () => { const e = eauChoisie(); return e ? { code: String(e.code), nom: e.nom, sodiumMgL: e.sodiumMgL } : null; };

/** « 0,43 g », « moins de 0,01 g ». */
function enGrammesDeSel(g) {
  if (g === null) return '…';
  if (g > 0 && g < 0.01) return 'moins de 0,01 g';
  return `${g.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} g`;
}

/** Le menu « Ce que je bois » : une autre boisson (sel non compté), mes eaux, les eaux courantes, puis les marques de A à Z. */
function choixEau() {
  const choisie = eauChoisie();
  const option = (e) => `<option value="${ech(String(e.code))}" ${String(e.code) === etat.eauChoisie ? 'selected' : ''}>${ech(e.nom)} · ${enGrammesDeSel(store.selDeLEau(1000, e.sodiumMgL))} de sel par litre</option>`;
  const perso = toutesLesEaux().filter((e) => e.perso);
  const marques = EAUX.filter((e) => !e.courante).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  return `<div class="choix-eau">
      <label class="champ">Ce que je bois
        <select data-choix-eau aria-label="Ce que je bois">
          <option value="" ${choisie ? '' : 'selected'}>Une autre boisson (sel non compté)</option>
          ${perso.length ? `<optgroup label="Mes eaux">${perso.map(option).join('')}</optgroup>` : ''}
          <optgroup label="Eaux courantes">${EAUX.filter((e) => e.courante).map(option).join('')}</optgroup>
          <optgroup label="Eaux de marque, de A à Z">${marques.map(option).join('')}</optgroup>
        </select>
      </label>
      ${choisie ? `<p class="discret">Un verre de 200 mL de cette eau : <b>${enGrammesDeSel(store.selDeLEau(200, choisie.sodiumMgL))} de sel</b>. Les verres notés à partir de maintenant comptent ce sel.</p>` : '<p class="discret">Choisissez votre eau pour voir le sel qu’elle apporte. Le carnet ne compte pas le sel des autres boissons (café, soupe…).</p>'}
      <button class="lien" data-action="ouvrir:mon-eau">Mon eau n’est pas dans la liste</button>
    </div>`;
}

/** Le sel apporté par les eaux notées aujourd'hui, et ce qu'il représente de la limite de sel écrite. */
/**
 * Version 22 : le sel de l'eau bue aujourd'hui, tout de suite sous les millilitres qui restent.
 * Affiché dès qu'une eau est choisie ou qu'une eau a été notée. Ce n'est pas « le sel qui reste » :
 * la limite de sel compte aussi les aliments, que le carnet n'additionne pas.
 */
function selACoteDesMl(jour) {
  const eauxNotees = store.boissonsDuJour(etat, jour).some((b) => b.eau);
  if (!eauxNotees && !eauChoisie()) return '';
  const g = store.selDesEauxDuJour(etat, jour);
  const limite = store.limiteSelG(etat);
  const part = store.partDeLaLimite(g, limite);
  return `<div class="sel-bouteille"><span class="discret">Sel de l’eau bue</span><b>${g ? enGrammesDeSel(g) : '0 g'}</b>${part === null || !g ? '' : `<small>soit ${part} % de ma limite de sel</small>`}</div>`;
}

function ligneSelDesEaux(jour) {
  const boissons = store.boissonsDuJour(etat, jour);
  if (!boissons.some((b) => b.eau)) return '';
  const g = store.selDesEauxDuJour(etat, jour);
  const limite = store.limiteSelG(etat);
  const part = store.partDeLaLimite(g, limite);
  return `<div class="sel-eaux">
      <div>Sel apporté par les eaux notées aujourd’hui : <b>${enGrammesDeSel(g)}</b></div>
      ${part === null ? '' : `<div class="discret">soit ${part} % de votre limite de sel écrite (${limite.toLocaleString('fr-FR')} g par jour, aliments compris)</div>`}
    </div>`;
}
const enLitres = (ml) => `${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`;

/** La bouteille : pleine de la limite écrite sur la fiche, elle se vide de ce qui a été bu. */
function svgBouteille(limite, bu) {
  const reste = Math.max(0, limite - bu);
  const haut = 62, bas = 246; // le corps de la bouteille, du haut de l'eau au fond
  const niveau = bas - (reste / limite) * (bas - haut);
  const forme = 'M48 20V46C48 60 20 66 20 96V228A14 14 0 0 0 34 242H86A14 14 0 0 0 100 228V96C100 66 72 60 72 46V20Z';
  const traits = [0.25, 0.5, 0.75].map((f) => { const y = bas - f * (bas - haut); return `<line x1="88" x2="99" y1="${y}" y2="${y}"/>`; }).join('');
  return `<svg class="bouteille" viewBox="0 0 120 250" role="img" aria-label="Bouteille du jour : il reste ${enMl(reste)} sur ${enMl(limite)}">
    <defs>
      <clipPath id="dans-bouteille"><path d="${forme}"/></clipPath>
      <linearGradient id="eau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb3e8"/><stop offset="1" stop-color="#2f62a3"/></linearGradient>
    </defs>
    <rect x="43" y="5" width="34" height="15" rx="4" class="bouchon"/>
    <path d="${forme}" class="verre"/>
    <g clip-path="url(#dans-bouteille)">
      <rect x="0" y="${niveau.toFixed(1)}" width="120" height="${(250 - niveau).toFixed(1)}" fill="url(#eau)"/>
      ${reste > 0 ? `<path d="M0 ${niveau.toFixed(1)} q15 -5 30 0 t30 0 t30 0 t30 0 V${(niveau + 6).toFixed(1)} H0Z" class="vague"/>` : ''}
    </g>
    <g class="traits">${traits}</g>
    <path d="${forme}" class="contour"/>
  </svg>`;
}

function carteBoissons() {
  const jour = aujourdhui();
  const limite = store.limiteBoissonsMl(etat);
  const bu = store.totalBuMl(etat, jour);
  const boissons = store.boissonsDuJour(etat, jour);
  const ecrit = store.consigneCourante(etat, 'boissons_limite');

  const verres = `${choixEau()}<div class="recipients">${RECIPIENTS.map((r) => `<button class="recipient" data-action="boire:${r.ml}"><b>${r.libelle}</b><span>${r.ml} mL</span></button>`).join('')}</div>
    <form class="saisie-rapide" data-form="boisson" style="margin-top:10px">
      <div class="champ-unite"><input type="text" name="ml" inputmode="numeric" placeholder="Autre quantité" aria-label="Autre quantité en millilitres" autocomplete="off" required><span>mL</span></div>
      <button class="bouton secondaire" type="submit">Ajouter</button>
    </form>
    ${ui.erreurBoisson ? `<p class="erreur" style="margin-top:10px">${ech(ui.erreurBoisson)}</p>` : ''}`;

  const journal = boissons.length ? `<div class="journal-boissons">${boissons.map((b, i) => {
      const sel = store.selDeLaBoisson(b);
      return `<button data-action="retirer-boisson:${i}" aria-label="Retirer ${b.ml} mL${b.eau ? ` de ${ech(b.eau.nom)}` : ''}"><span>${b.ml} mL${sel ? ` · ${enGrammesDeSel(sel)} de sel` : ''}</span>${ic('croix', 14)}</button>`;
    }).join('')}</div>
    ${ligneSelDesEaux(jour)}
    <p class="discret" style="margin-top:6px">Touchez une boisson pour la retirer si elle a été notée par erreur.</p>
    <button class="bouton neutre large" style="margin-top:12px" data-action="vider-boissons">Remettre la bouteille à plein</button>` : '';

  let corps;
  if (limite === null) {
    corps = `${ecrit ? `<p class="vide" style="margin-bottom:10px">La limite notée (« ${ech(ecrit.valeur)} ») n’est pas lisible en litres.</p>` : ''}
      ${formulaireLimite('boissons_limite', { unite: 'L', exemple: '1,5', question: 'Ma limite de liquide par jour' })}
      <p class="discret" style="margin-top:6px">Dès qu’elle est validée, la bouteille apparaît, pleine de cette quantité.</p>`;
  } else {
    const reste = limite - bu;
    const enVerres = (ml) => `${(Math.floor(Math.max(0, ml) / 100) / 2).toLocaleString('fr-FR')} verre${ml >= 300 ? 's' : ''} de 200 mL`;
    corps = `<div class="bloc-bouteille">
        ${svgBouteille(limite, bu)}
        <div class="chiffres">
          <div class="discret">${reste >= 0 ? 'Il reste' : 'Au-delà de la limite écrite'}</div>
          <div class="grand-nombre">${Math.abs(reste).toLocaleString('fr-FR')}<small>mL</small></div>
          ${reste > 0 ? `<div class="en-verres">soit ${enVerres(reste)}</div>` : ''}
          ${selACoteDesMl(jour)}
          <div class="discret" style="margin-top:8px">Bu aujourd’hui : <b>${enMl(bu)}</b></div>
          <div class="discret">Ma limite : <b>${enLitres(limite)}</b>, soit ${enVerres(limite)}</div>
          ${ecrit.auteur ? `<div class="meta" style="font-size:0.8rem;color:var(--encre-pale);margin-top:4px">${origine(ecrit)}</div>` : ''}
        </div>
      </div>
      ${verres}${journal}`;
  }

  return `<section class="carte">
    <div class="carte-tete"><span class="pastille bleu">${ic('goutte')}</span><h2>Ma bouteille du jour</h2>${limite !== null ? '<button class="lien" data-action="ouvrir:consigne:boissons_limite">Modifier</button>' : ''}</div>
    ${corps}
    ${limite === null ? '' : '<p class="discret" style="margin-top:8px">Les tailles de verre sont des tailles courantes : utilisez « Autre quantité » pour les vôtres. La bouteille repart pleine toute seule chaque matin.</p>'}
  </section>`;
}

function vueLiquides() {
  return `<h1 class="titre-page">Liquides</h1>
    <p class="sous-titre">Ma limite de liquide du jour : la bouteille se vide à chaque boisson notée.</p>
    ${bandeauExemple()}${carteBoissons()}
    ${mention()}`;
}

function carteLimiteSel() {
  const limite = store.limiteSelG(etat);
  const ecrit = store.consigneCourante(etat, 'sel_limite');
  if (limite === null) {
    return `<section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('alimentation')}</span><h2>Ma limite de sel</h2></div>
      ${ecrit ? `<p class="vide" style="margin-bottom:10px">La limite notée (« ${ech(ecrit.valeur)} ») n’est pas lisible en grammes.</p>` : ''}
      ${formulaireLimite('sel_limite', { unite: 'g', exemple: '6', question: 'Ma limite de sel par jour' })}
      <p class="discret" style="margin-top:6px">Dès qu’elle est validée, chaque portion d’aliment affiche la part de cette limite qu’elle représente.</p>
    </section>`;
  }
  return `<section class="carte">
    <div class="carte-tete" style="margin-bottom:0">
      <span class="pastille ambre">${ic('alimentation')}</span>
      <div style="flex:1"><div class="discret">Ma limite de sel</div><div class="grand-nombre">${limite.toLocaleString('fr-FR')}<small>g par jour</small></div></div>
      <button class="lien" data-action="ouvrir:consigne:sel_limite">Modifier</button>
    </div>
  </section>`;
}

function bandeauExemple() {
  if (!etat.exemple) return '';
  return `<div class="bandeau exemple">${ic('alerte', 20)}<div class="corps"><b>Exemple fictif.</b> Ces données sont inventées : ce ne sont pas des consignes.<br><button data-action="effacer-exemple">Effacer l’exemple et commencer mon carnet</button></div></div>`;
}

function mention() {
  return '<p class="mention">Ce carnet affiche ce que vous et vos soignants y avez écrit. Il ne remplace aucun avis médical. En cas de doute, appelez : ne décidez pas seul.<br>Version ' + VERSION_APPLI + '</p>';
}

/** Une consigne de la fiche, affichée telle qu'écrite et modifiable d'un toucher, sur n'importe quel écran. */
function ligneConsigne(id) {
  const c = CHAMPS.get(id);
  const v = store.consigneCourante(etat, id);
  return `<li><button class="ligne" data-action="ouvrir:consigne:${id}"><span class="corps">
    <span class="libelle">${ech(c.libelle)}</span><br>
    ${v ? `<span class="valeur">${avecUnite(c, v.valeur)}</span>${v.auteur || v.date ? `<br><span class="meta">${origine(v)}</span>` : ''}` : '<span class="vide">Non renseigné</span>'}
  </span><span class="chevron">${ic('chevron', 18)}</span></button></li>`;
}

// ---------- Écran : Mes séances (version 16) ----------

const JOURS_COURTS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Une semaine en 7 ronds : vert = séance faite, gris = pas pu, vide = rien de noté. */
function rangeeSemaine(date, { titre }) {
  const semaine = store.semaineDeSeances(etat, date);
  const jour = aujourdhui();
  const faites = semaine.reduce((n, j) => n + j.seances.filter((s) => s.fait).length, 0);
  const ronds = semaine.map((j, i) => {
    const nbFaites = j.seances.filter((s) => s.fait).length;
    const etatRond = nbFaites ? 'fait' : j.seances.length ? 'pas' : 'vide';
    const dit = nbFaites ? `${nbFaites} séance${nbFaites > 1 ? 's' : ''} faite${nbFaites > 1 ? 's' : ''}` : j.seances.length ? 'pas pu' : 'rien de noté';
    return `<div class="jour-semaine${j.date === jour ? ' aujourdhui' : ''}${j.date > jour ? ' futur' : ''}"><span class="lettre">${JOURS_COURTS[i]}</span>
      <span class="rond ${etatRond}" title="${dateCourte(j.date)} : ${dit}" aria-label="${ech(dateLongue(j.date))} : ${dit}">${nbFaites ? ic('coche', 16) : j.seances.length ? '–' : ''}${nbFaites > 1 ? `<i>${nbFaites}</i>` : ''}</span></div>`;
  }).join('');
  return `<div class="semaine-bloc"><div class="semaine-titre"><span>${titre}</span><b>${faites} faite${faites > 1 ? 's' : ''}</b></div><div class="semaine">${ronds}</div></div>`;
}

function descriptionSeance(s) {
  if (s.fait) return [s.type || 'Séance', s.duree ? `${s.duree} min` : '', s.ressenti ? `ressenti : ${s.ressenti}` : ''].filter(Boolean).join(' · ');
  return `Pas pu${s.raison ? ` · ${s.raison.toLowerCase()}` : ''}`;
}

function vueSeances() {
  const jour = aujourdhui();
  const ecrites = store.seancesParSemaineEcrites(etat);
  const faites = store.seancesFaitesLaSemaine(etat, jour);
  const lundi = (n) => ajouterJours(jour, -7 * n);
  const passees = [1, 2, 3].map((n) => rangeeSemaine(lundi(n), { titre: `Semaine du ${dateTresCourte(store.semaineDeSeances(etat, lundi(n))[0].date)}` })).join('');
  const recentes = [...(etat.seances ?? [])].reverse().slice(0, 20);
  const autresChamps = ['fc_cible_min', 'fc_cible_max', 'fc_ne_pas_depasser', 'ressenti_effort', 'activites_autorisees', 'activites_deconseillees']
    .filter((id) => store.consigneCourante(etat, id)).map(ligneConsigne).join('');

  return `<h1 class="titre-page">Mes séances</h1>
    <p class="sous-titre">Noter les séances faites, et celles qu’on n’a pas pu faire. C’est un relevé pour vous et votre médecin : le carnet ne le juge pas.</p>
    ${bandeauExemple()}
    <div class="deux-gros">
      <button class="gros-choix vert" data-action="ouvrir-seance:fait">${ic('coche', 26)}<b>J’ai fait une séance</b></button>
      <button class="gros-choix neutre" data-action="ouvrir-seance:pas">${ic('croix', 26)}<b>Je n’ai pas pu</b></button>
    </div>

    <section class="carte">
      <div class="carte-tete"><span class="pastille vert">${ic('calendrier')}</span><h2>Cette semaine</h2></div>
      ${rangeeSemaine(jour, { titre: 'Du lundi au dimanche' })}
      <p class="fait-semaine">${faites} séance${faites > 1 ? 's' : ''} faite${faites > 1 ? 's' : ''}${ecrites === null ? '' : ` · votre fiche dit : ${ecrites} par semaine`}</p>
      <div class="legende-semaine"><span><i class="rond fait"></i>faite</span><span><i class="rond pas"></i>pas pu</span><span><i class="rond vide"></i>rien de noté</span></div>
    </section>

    <section class="carte">
      <div class="carte-tete"><span class="pastille vert">${ic('activite')}</span><h2>Ce que dit ma fiche</h2></div>
      <ul class="liste">${ligneConsigne('duree_seance')}${ligneConsigne('frequence_semaine')}${autresChamps}</ul>
      <p class="discret" style="margin-top:8px">Ce sont les consignes écrites par vos soignants. Le carnet n’en fixe aucune.</p>
    </section>

    <section class="carte">
      <div class="carte-tete"><span class="pastille primaire">${ic('horloge')}</span><h2>Les semaines d’avant</h2></div>
      ${passees}
    </section>

    ${recentes.length ? `<section class="carte">
      <div class="carte-tete"><span class="pastille neutre">${ic('fiche')}</span><h2>Mes dernières notes</h2></div>
      <ul class="liste">${recentes.map((s) => `<li><div class="ligne">
        <div class="corps"><span class="valeur">${ech(descriptionSeance(s))}</span><br><span class="libelle">${ech(dateLongue(s.date))}</span>${s.note ? `<br><span class="meta">${ech(s.note)}</span>` : ''}</div>
        <button class="bouton-rond" data-action="retirer-seance:${s.id}" aria-label="Retirer la note du ${dateCourte(s.date)}">${ic('croix', 18)}</button>
      </div></li>`).join('')}</ul>
    </section>` : ''}
    ${mention()}`;
}

// ---------- Écran : Mes documents (version 21) ----------
// Les fichiers restent sur ce téléphone (documents.js). Le carnet ne lit pas leur contenu : la personne les nomme et les range.

const enTaille = (o) => (o >= 1024 * 1024 ? `${(o / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${Math.max(1, Math.round(o / 1024))} ko`);
const estPdf = (d) => d.type === 'application/pdf';

function vueDocuments() {
  const docs = store.documentsRanges(etat);
  const groupes = store.CATEGORIES_DOCUMENTS.map((cat) => ({ cat, liste: docs.filter((d) => d.categorie === cat) })).filter((g) => g.liste.length);
  const listes = groupes.map(({ cat, liste }) => `<section class="carte">
      <div class="carte-tete"><span class="pastille bleu">${ic('dossier')}</span><h2>${ech(cat)}</h2><span class="compte">${liste.length}</span></div>
      <ul class="liste">${liste.map((d) => `<li><button class="ligne" data-action="ouvrir:document:${d.id}"><span class="icone-doc">${ic(estPdf(d) ? 'fiche' : 'photo', 22)}</span><span class="corps">
        <span class="valeur">${ech(d.titre)}</span><br>
        <span class="meta">${[d.date ? dateCourte(d.date) : '', estPdf(d) ? 'PDF' : 'image', d.taille ? enTaille(d.taille) : ''].filter(Boolean).join(' · ')}</span>
      </span><span class="chevron">${ic('chevron', 18)}</span></button></li>`).join('')}</ul>
    </section>`).join('');
  return `<h1 class="titre-page">Mes documents</h1>
    <p class="sous-titre">Ordonnances, prises de sang, comptes rendus : rangés sur ce téléphone, lisibles même sans connexion.</p>
    ${ui.erreurDocument ? `<p class="erreur">${ech(ui.erreurDocument)}</p>` : ''}
    <button class="bouton large" data-action="choisir-document">${ic('plus', 18)} Ajouter un document</button>
    <input type="file" id="fichier-document" accept="application/pdf,image/*" hidden>
    ${listes || '<section class="carte"><p class="vide">Aucun document rangé pour l’instant.</p></section>'}
    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('alerte')}</span><h2>Bon à savoir</h2></div>
      <ul class="liste-simple">
        <li><b>Un document reçu par mail</b> (résultats du laboratoire, ordonnance) : ouvrez la pièce jointe, enregistrez-la sur le téléphone, puis touchez « Ajouter un document » et choisissez-la. Le carnet ne peut pas lire vos mails lui-même.</li>
        <li><b>Rien n’est envoyé.</b> Le carnet ne lit pas le contenu des documents : c’est vous qui les nommez et les rangez.</li>
        <li><b>Si le téléphone est perdu ou vidé, les documents disparaissent avec le carnet.</b> La sauvegarde (bouton en haut à droite) les contient : gardez le fichier ailleurs. Gardez aussi les originaux.</li>
      </ul>
      <p class="discret" id="place-occupee" style="margin-top:10px"></p>
    </section>
    ${mention()}`;
}

async function afficherPlace() {
  const el = document.getElementById('place-occupee');
  if (!el) return;
  const place = await coffre.placeOccupee();
  if (place && place.quota) el.textContent = `Place prise par le carnet sur ce téléphone : ${enTaille(place.utilise)}, sur ${enTaille(place.quota)} que le navigateur lui laisse.`;
}

let urlDocument = null; // adresse temporaire du fichier ouvert, libérée à la fermeture

function feuilleAjoutDocument() {
  const f = ui.feuille.fichier;
  const titre = (f?.name ?? '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  return formulaireDocument({ titre, categorie: '', date: aujourdhui() }, `Ajouter : ${f?.name ?? ''}`, 'document');
}

function formulaireDocument(d, titreFeuille, formulaire, id = '') {
  return `<div class="feuille-tete"><h2>${ech(titreFeuille)}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="${formulaire}" data-id="${ech(id)}">
      <label class="champ">Nom du document<input type="text" name="titre" value="${ech(d.titre)}" autocomplete="off" required></label>
      <div class="champ"><span class="titre-champ">Rangé dans</span>
        <div class="coches choix-unique">${store.CATEGORIES_DOCUMENTS.map((c) => `<label><input type="radio" name="categorie" value="${ech(c)}" ${c === (d.categorie || 'Autre') ? 'checked' : ''}>${ech(c)}</label>`).join('')}</div></div>
      <label class="champ">Date du document<small>Celle écrite sur le document (date de l’ordonnance, du prélèvement…).</small><input type="date" name="date" value="${ech(d.date)}" max="${aujourdhui()}"></label>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer</button>
    </form>`;
}

function feuilleDocument(id) {
  const d = (etat.documents ?? []).find((x) => x.id === id);
  const tete = `<div class="feuille-tete"><h2>${ech(d?.titre ?? 'Document')}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>`;
  if (!d) return `${tete}<p class="vide">Ce document n’existe plus dans le carnet.</p>`;
  return `${tete}
    <p class="discret">${ech([d.categorie, d.date ? `daté du ${dateCourte(d.date)}` : '', d.taille ? enTaille(d.taille) : ''].filter(Boolean).join(' · '))}</p>
    <div class="apercu-document" id="apercu-document" data-id="${ech(d.id)}"><p class="discret">Ouverture…</p></div>
    <div class="rangee" style="margin-top:12px" id="actions-document"></div>
    <div class="rangee" style="margin-top:8px">
      <button class="bouton neutre" data-action="ouvrir:modif-document:${d.id}">Renommer, classer</button>
      <button class="bouton danger" data-action="retirer-document:${d.id}">Retirer</button>
    </div>`;
}

/** Remplit l'aperçu une fois la feuille affichée : le fichier est lu sur l'appareil, sans réseau. */
async function remplirApercu() {
  const bloc = document.getElementById('apercu-document');
  if (urlDocument && !bloc) { URL.revokeObjectURL(urlDocument); urlDocument = null; }
  if (!bloc || bloc.dataset.rempli) return;
  bloc.dataset.rempli = '1';
  const d = (etat.documents ?? []).find((x) => x.id === bloc.dataset.id);
  let fichier;
  try { fichier = await coffre.lire(d.id); } catch (e) { console.error(e); }
  if (!fichier) { bloc.innerHTML = '<p class="vide">Le fichier n’est pas sur cet appareil (sauvegarde reprise sans lui ?).</p>'; return; }
  if (urlDocument) URL.revokeObjectURL(urlDocument);
  urlDocument = URL.createObjectURL(fichier);
  const nom = d.nomFichier || `${d.titre}${estPdf(d) ? '.pdf' : ''}`;
  if (!estPdf(d)) bloc.innerHTML = `<img class="photo-entiere" src="${urlDocument}" alt="${ech(d.titre)}">`;
  else if (navigator.pdfViewerEnabled) bloc.innerHTML = `<iframe class="lecteur-pdf" src="${urlDocument}" title="${ech(d.titre)}"></iframe>`;
  else bloc.innerHTML = '<p class="discret">Ce navigateur n’affiche pas les PDF à l’intérieur d’une page. Touchez « Ouvrir » : le PDF s’ouvre dans le lecteur du téléphone, puis revenez au carnet par le geste « retour ».</p>';
  document.getElementById('actions-document').innerHTML = `<a class="bouton" href="${urlDocument}" target="_blank" rel="noopener">Ouvrir en grand</a>
    <a class="bouton neutre" href="${urlDocument}" download="${ech(nom)}">Enregistrer une copie</a>`;
}

/** Fichiers du coffre pour la sauvegarde : { identifiant: data URL }. */
async function documentsPourSauvegarde() {
  const fichiers = await coffre.tous();
  const sortie = {};
  for (const [id, blob] of fichiers) if ((etat.documents ?? []).some((d) => d.id === id)) sortie[id] = await coffre.versDataUrl(blob);
  return sortie;
}

async function remplacerDocuments(objet) {
  const blobs = {};
  for (const [id, url] of Object.entries(objet)) blobs[id] = await coffre.depuisDataUrl(url);
  await coffre.remplacer(blobs);
}

// ---------- Écran : Ma fiche ----------

function vueFiche() {
  // « Alimentation et poids » se règle depuis l'accueil (Poids, Alimentation, Liquides) : pas de doublon ici.
  const themes = THEMES.filter((t) => t.id !== 'alimentation').map((t) => carteTheme(t)).join('');
  const dispositif = carteTheme(DISPOSITIF, 'À part de la fiche de sortie : ce n’est pas le service de réadaptation qui le suit, mais le centre de suivi du dispositif. Laissez vide si vous n’en avez pas.');

  const message = ui.messageFiche ? `<div class="bandeau reception">${ic('coche', 20)}<div class="corps"><b>Fiche enregistrée.</b> ${ech(ui.messageFiche)}</div></div>` : '';
  const remplir = lireBrouillon() ? carteBrouillon() : `<button class="bouton large" data-action="nav:remplir">${ic('fiche', 18)} Remplir toute ma fiche d’un coup</button>`;

  return `<h1 class="titre-page">Ma fiche</h1>
    <p class="sous-titre">Ce que vos soignants ont écrit pour vous. Un champ vide reste vide : rien n’est complété à leur place.</p>
    ${message}${bandeauExemple()}${remplir}
    <p class="discret" style="padding:0 2px">Ou touchez une ligne pour changer un seul renseignement. Le poids, le sel et les liquides se règlent aussi depuis l’accueil.</p>
    ${carteMedecins()}${themes}${dispositif}${mention()}`;
}

/** Un thème de la fiche (ou le dispositif, version 21) : chaque ligne s'ouvre d'un toucher. */
function carteTheme(t, explication = '') {
    const renseignes = t.champs.filter((c) => store.consigneCourante(etat, c.id)).length;
    const lignes = t.champs.map((c) => {
      const v = store.consigneCourante(etat, c.id);
      return `<li><button class="ligne" data-action="ouvrir:consigne:${c.id}">
        <span class="corps">
          <span class="libelle">${ech(c.libelle)}</span><br>
          ${v
            ? `<span class="valeur">${avecUnite(c, v.valeur)}</span>${c.simple ? '' : `<br><span class="meta">${origine(v)}</span><br>${etiquetteReevaluation(v)}`}`
            : '<span class="vide">Non renseigné</span>'}
        </span>
        <span class="chevron">${ic('chevron', 18)}</span>
      </button></li>`;
    }).join('');
    return `<section class="carte">
      <div class="carte-tete"><span class="pastille ${t.couleur}">${ic(t.icone)}</span><h2>${ech(t.titre)}</h2><span class="compte">${renseignes} / ${t.champs.length}</span></div>
      ${explication ? `<p class="discret">${ech(explication)}</p>` : ''}
      <ul class="liste">${lignes}</ul>
    </section>`;
}

/** Les médecins enregistrés une fois, pour les choisir ensuite d'une touche. */
function carteMedecins() {
  const liste = etat.medecins ?? [];
  return `<section class="carte">
      <div class="carte-tete"><span class="pastille bleu">${ic('fiche')}</span><h2>Mes médecins</h2><span class="compte">${liste.length || ''}</span></div>
      <p class="discret">Enregistrés une fois ici, ils se choisissent d’une touche quand vous recopiez une consigne.</p>
      ${liste.length ? `<ul class="liste">${liste.map((m) => `<li><div class="ligne"><div class="corps"><span class="valeur">${ech(m.nom)}</span>${m.fonction ? `<br><span class="meta">${ech(m.fonction)}</span>` : ''}</div>
        <button class="bouton-rond" data-action="retirer-medecin:${m.id}" aria-label="Retirer ${ech(m.nom)}">${ic('croix', 18)}</button></div></li>`).join('')}</ul>` : ''}
      <form data-form="medecin" style="display:grid;gap:10px;margin-top:12px">
        <div class="deux">
          <label class="champ">Nom<input type="text" name="nom" placeholder="Dr Martin" autocomplete="off" required></label>
          <label class="champ">Fonction<input type="text" name="fonction" placeholder="cardiologue" autocomplete="off"></label>
        </div>
        ${ui.erreurMedecin ? `<p class="erreur">${ech(ui.erreurMedecin)}</p>` : ''}
        <button class="bouton secondaire large" type="submit">${ic('plus', 18)} Ajouter ce médecin</button>
      </form>
    </section>`;
}

/** « Continuer ma fiche » : affiché tant qu'une fiche commencée n'est pas enregistrée. */
function carteBrouillon() {
  const b = lireBrouillon();
  if (!b) return '';
  const quand = b.commenceLe ? ` le ${dateCourte(versIso(new Date(b.commenceLe)))}` : '';
  return `<section class="carte carte-brouillon">
      <div class="carte-tete"><span class="pastille ambre">${ic('fiche')}</span><h2>Fiche commencée, pas encore enregistrée</h2></div>
      <p class="discret">Commencée${quand}. Tout ce que vous avez tapé est gardé.</p>
      <button class="bouton large" style="margin-top:12px" data-action="nav:remplir">Continuer ma fiche</button>
    </section>`;
}

/** Les médecins à toucher, et de quoi en ajouter un sans quitter l'écran. */
function choixMedecin(choisi, titre) {
  const liste = etat.medecins ?? [];
  return `<div class="champ"><span class="titre-champ">${titre}</span>
      ${liste.length
        ? `<div class="coches choix-unique choix-medecin">${liste.map((m) => `<label><input type="radio" name="medecin" value="${ech(m.id)}" ${m.id === choisi ? 'checked' : ''}><span><b>${ech(m.nom)}</b>${m.fonction ? `<br><small>${ech(m.fonction)}</small>` : ''}</span></label>`).join('')}</div>`
        : '<small>Aucun médecin enregistré. Ajoutez-le une fois ci-dessous : ensuite, il suffira de le toucher.</small>'}
      <details class="ajout-medecin" ${liste.length ? '' : 'open'}><summary>${ic('plus', 16)} Ajouter un médecin</summary>
        <div class="deux">
          <label class="champ">Nom<input type="text" name="nouveauNom" placeholder="Dr Martin" autocomplete="off"></label>
          <label class="champ">Fonction<input type="text" name="nouvelleFonction" placeholder="cardiologue" autocomplete="off"></label>
        </div>
        <button class="bouton secondaire" type="button" data-action="ajouter-medecin">Ajouter et choisir</button>
      </details>
    </div>`;
}

/** Le nom écrit dans « Écrit par » : le médecin touché, ou celui tapé dans « Ajouter un médecin » sans avoir appuyé. */
function auteurDepuis(s) {
  if (!s.medecin && String(s.nouveauNom ?? '').trim()) {
    enregistrer(store.ajouterMedecin(etat, { nom: s.nouveauNom, fonction: s.nouvelleFonction }, maintenant()));
    return store.signatureMedecin(etat.medecins[etat.medecins.length - 1]);
  }
  return store.signatureMedecin(store.medecinParId(etat, s.medecin));
}

// ---------- Écran : Remplir ma fiche (version 17) ----------

function champRemplir(c, v) {
  const saisie = c.long
    ? `<textarea name="c-${c.id}" rows="2">${ech(v)}</textarea>`
    : `<span class="${c.unite ? 'champ-unite' : ''}"><input type="text" name="c-${c.id}" value="${ech(v)}" ${c.unite ? 'inputmode="decimal"' : ''} autocomplete="off">${c.unite ? `<span>${c.unite}</span>` : ''}</span>`;
  return `<label class="champ">${ech(c.libelle)}${c.aide ? `<small>${ech(c.aide)}</small>` : ''}${saisie}</label>`;
}

// Les médicaments de la fiche : une ligne par médicament, numérotée m0-, m1-… dans le formulaire.
// Sans brouillon, les lignes sont celles des médicaments en cours du carnet.
const momentsDeLaLigne = (s, i) => Object.fromEntries(MOMENTS.map((mo) => [mo.id, s[`m${i}-${mo.id}`] === 'on']));

function lignesMedsDepuis(s) {
  if (s.nbMeds === undefined) {
    return store.medicamentsEnCours(etat).map((m) => ({ id: m.id, nom: m.nom, dose: m.dose, moments: { ...m.moments }, aQuoiCaSert: m.aQuoiCaSert, arreter: false }));
  }
  return Array.from({ length: Number(s.nbMeds) || 0 }, (_, i) => ({
    id: s[`m${i}-id`] ?? '', nom: s[`m${i}-nom`] ?? '', dose: s[`m${i}-dose`] ?? '', moments: momentsDeLaLigne(s, i),
    aQuoiCaSert: s[`m${i}-aQuoiCaSert`] ?? '', arreter: s[`m${i}-arreter`] === 'on',
  }));
}

function saisieAvecLignes(s, lignes) {
  const reste = Object.fromEntries(Object.entries(s).filter(([nom]) => !/^m\d+-/.test(nom)));
  lignes.forEach((l, i) => {
    if (l.id) reste[`m${i}-id`] = l.id;
    Object.assign(reste, { [`m${i}-nom`]: l.nom, [`m${i}-dose`]: l.dose, [`m${i}-aQuoiCaSert`]: l.aQuoiCaSert });
    for (const mo of MOMENTS) if (l.moments[mo.id]) reste[`m${i}-${mo.id}`] = 'on';
    if (l.arreter) reste[`m${i}-arreter`] = 'on';
  });
  return { ...reste, nbMeds: String(lignes.length) };
}

function ligneMedRemplir(m, i) {
  return `<div class="med-soignant${m.arreter ? ' a-arreter' : ''}">
      ${m.id ? `<input type="hidden" name="m${i}-id" value="${ech(m.id)}">` : ''}
      <div class="deux">
        <label class="champ">Nom<input type="text" name="m${i}-nom" value="${ech(m.nom)}" placeholder="Tel qu’écrit sur l’ordonnance" autocomplete="off"></label>
        <label class="champ">Dose<input type="text" name="m${i}-dose" value="${ech(m.dose)}" placeholder="5 mg" autocomplete="off"></label>
      </div>
      <div class="coches">${MOMENTS.map((mo) => `<label><input type="checkbox" name="m${i}-${mo.id}" ${m.moments[mo.id] ? 'checked' : ''}>${mo.libelle}</label>`).join('')}</div>
      <label class="champ">À quoi ça sert<small>Facultatif. La ligne écrite par le soignant.</small><input type="text" name="m${i}-aQuoiCaSert" value="${ech(m.aQuoiCaSert)}" autocomplete="off"></label>
      <div class="rangee med-actions">
        ${m.id
          ? `<label class="arreter"><input type="checkbox" name="m${i}-arreter" ${m.arreter ? 'checked' : ''}> La fiche arrête ce médicament</label>`
          : `<span class="etiquette neutre">Nouveau</span><button class="lien" type="button" data-action="retirer-ligne-med:${i}">Retirer la ligne</button>`}
      </div>
    </div>`;
}

function vueRemplir() {
  const b = lireBrouillon();
  const s = b?.saisie ?? {};
  const valeurDe = (id) => s[`c-${id}`] ?? store.consigneCourante(etat, id)?.valeur ?? '';
  const themes = THEMES.map((t) => {
    const remplis = t.champs.filter((c) => String(valeurDe(c.id)).trim()).length;
    return `<details class="carte theme-soignant" data-theme-remplir="${t.id}" ${ui.themesOuverts.has(t.id) ? 'open' : ''}>
        <summary class="carte-tete"><span class="pastille ${t.couleur}">${ic(t.icone)}</span><h2>${ech(t.titre)}</h2><span class="compte">${remplis} / ${t.champs.length}</span><span class="chevron">${ic('chevron', 18)}</span></summary>
        <div class="bloc">${t.champs.map((c) => champRemplir(c, valeurDe(c.id))).join('')}</div>
      </details>`;
  }).join('');
  const lignes = lignesMedsDepuis(s);
  const meds = `<details class="carte theme-soignant" data-theme-remplir="medicaments" ${ui.themesOuverts.has('medicaments') ? 'open' : ''}>
      <summary class="carte-tete"><span class="pastille bleu">${ic('medicaments')}</span><h2>Médicaments</h2><span class="compte">${lignes.length || ''}</span><span class="chevron">${ic('chevron', 18)}</span></summary>
      <p class="discret">Vos médicaments en cours sont déjà là. Changez la dose ou les moments si la fiche le dit ; cochez « La fiche arrête ce médicament » s’il est arrêté ; ajoutez ceux qui manquent. La photo de la boîte s’ajoute dans l’écran Médicaments.</p>
      <input type="hidden" name="nbMeds" value="${lignes.length}">
      <div class="bloc">${lignes.map(ligneMedRemplir).join('')}</div>
      <button class="bouton secondaire large" type="button" data-action="ajouter-ligne-med" style="margin-top:12px">${ic('plus', 18)} Ajouter un médicament</button>
      <div class="bloc" style="margin-top:16px">${champRemplir(CHAMP_OUBLI, valeurDe(CHAMP_OUBLI.id))}</div>
    </details>`;

  return `<h1 class="titre-page">Remplir ma fiche</h1>
    <p class="sous-titre">Recopiez votre fiche de sortie en une fois. Ce que vous tapez est gardé au fur et à mesure : si vous quittez cet écran sans le vouloir, le bouton « Continuer ma fiche » vous ramène ici.</p>
    ${bandeauExemple()}
    <form data-form="remplir" class="formulaire-soignant">
      <section class="carte">
        <div class="carte-tete"><span class="pastille primaire">${ic('fiche')}</span><h2>Qui a rempli la fiche</h2></div>
        <div class="bloc">
          ${choixMedecin(s.medecin ?? '', 'Fiche remplie par')}
          <label class="champ">Date de la fiche<small>La date du jour est mise d’office. Changez-la si la fiche a été écrite un autre jour.</small><input type="date" name="date" value="${ech(s.date ?? aujourdhui())}" max="${aujourdhui()}"></label>
        </div>
      </section>
      ${themes}
      ${meds}
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer ma fiche</button>
      <p class="discret" style="text-align:center">Seuls les champs et médicaments nouveaux ou modifiés sont enregistrés, chacun avec le médecin et la date choisis en haut. Ce qui était déjà écrit reste dans l’historique ; vider un champ ne l’efface pas du carnet.</p>
      ${b ? '<button class="bouton neutre large" type="button" data-action="abandonner-brouillon">Abandonner cette fiche commencée</button>' : ''}
    </form>
    ${mention()}`;
}

// ---------- Écran : Poids ----------

function svgCourbe() {
  const ref = store.consigneCourante(etat, 'poids_reference');
  const reference = ref ? store.lireKg(ref.valeur) : null;
  const g = geometrie(etat.poids, { aujourdhui: aujourdhui(), jours: ui.periode || null, reference });
  if (!g) return '<p class="vide" style="padding:24px 0;text-align:center">Aucune pesée sur cette période.</p>';
  const droite = g.largeur - g.marge.droite;
  return `<svg class="courbe" viewBox="0 0 ${g.largeur} ${g.hauteur}" role="img" aria-label="Courbe des pesées">
    <defs><linearGradient id="fondu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e6b6f" stop-opacity="0.22"/><stop offset="1" stop-color="#0e6b6f" stop-opacity="0"/></linearGradient></defs>
    ${g.graduations.map((t) => `<line class="grille" x1="${g.marge.gauche}" x2="${droite}" y1="${t.y}" y2="${t.y}"/><text class="axe" x="${g.marge.gauche - 8}" y="${t.y + 4}" text-anchor="end">${t.kg.toLocaleString('fr-FR')}</text>`).join('')}
    ${g.yReference !== null ? `<line class="reference" x1="${g.marge.gauche}" x2="${droite}" y1="${g.yReference}" y2="${g.yReference}"/>` : ''}
    ${g.points.length > 1 ? `<path d="${g.aire}" fill="url(#fondu)"/><path class="trace" d="${g.trace}"/>` : ''}
    ${g.points.map((p) => `<circle class="point" cx="${p.x}" cy="${p.y}" r="${g.points.length > 45 ? 2 : 3.5}"><title>${dateCourte(p.date)} : ${nombre(p.kg)} kg</title></circle>`).join('')}
    <text class="axe" x="${g.marge.gauche}" y="${g.hauteur - 6}">${dateTresCourte(g.debut)}</text>
    <text class="axe" x="${droite}" y="${g.hauteur - 6}" text-anchor="end">${dateTresCourte(g.fin)}</text>
  </svg>
  <div class="legende"><span><i></i>Mes pesées</span>${g.yReference !== null ? '<span><i class="ref"></i>Poids de référence écrit sur la fiche</span>' : ''}</div>`;
}

function vuePoids() {
  const derniere = etat.poids[etat.poids.length - 1];
  const periodes = [[30, '1 mois'], [90, '3 mois'], [0, 'Tout']];
  const consigne = parole('consigne_poids');
  const recentes = [...etat.poids].reverse().slice(0, 30);

  return `<h1 class="titre-page">Mon poids</h1>
    ${bandeauExemple()}
    <section class="carte">
      ${derniere
        ? `<div class="grand-nombre">${nombre(derniere.kg)}<small>kg</small></div><p class="discret" style="margin-top:6px">Dernière pesée : ${ech(dateLongue(derniere.date))}</p>`
        : '<p class="vide">Aucune pesée notée.</p>'}
      <div style="display:flex;justify-content:flex-end;margin:14px 0 8px">
        <div class="periodes" role="group" aria-label="Période affichée">${periodes.map(([n, l]) => `<button class="${ui.periode === n ? 'actif' : ''}" data-action="periode:${n}">${l}</button>`).join('')}</div>
      </div>
      ${svgCourbe()}
      <p class="discret" style="margin-top:12px">Cette courbe montre vos pesées. Elle ne les interprète pas.</p>
    </section>

    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('fiche')}</span><h2>Ce que le médecin a écrit</h2></div>
      <ul class="liste">${ligneConsigne('poids_reference')}${ligneConsigne('automesure_poids')}${ligneConsigne('consigne_poids')}</ul>
      <p class="discret" style="margin-top:8px">Recopiez la phrase du médecin mot pour mot. Le carnet l’affiche, il ne l’interprète pas.</p>
    </section>

    <section class="carte">
      <div class="carte-tete"><span class="pastille primaire">${ic('plus')}</span><h2>Noter une pesée</h2></div>
      <form data-form="poids" style="display:grid;gap:12px">
        <div class="deux">
          <label class="champ">Date<input type="date" name="date" value="${aujourdhui()}" max="${aujourdhui()}" required></label>
          <label class="champ">Poids<span class="champ-unite"><input type="text" name="kg" inputmode="decimal" placeholder="78,4" autocomplete="off" required><span>kg</span></span></label>
        </div>
        <div class="dictee">${boutonDicter()}<span class="discret">Pour dicter : touchez ce micro, puis celui de votre clavier, et dites le poids.</span></div>
        ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
        <button class="bouton large" type="submit">Enregistrer</button>
      </form>
    </section>

    ${recentes.length ? `<section class="carte">
      <div class="carte-tete"><span class="pastille vert">${ic('calendrier')}</span><h2>Dernières pesées</h2></div>
      <ul class="liste">${recentes.map((p) => `<li><div class="ligne">
        <div class="corps"><span class="valeur">${nombre(p.kg)} kg</span><br><span class="libelle">${ech(dateLongue(p.date))}</span></div>
        <button class="bouton-rond" data-action="suppr-poids:${p.date}" aria-label="Retirer la pesée du ${dateCourte(p.date)}">${ic('croix', 18)}</button>
      </div></li>`).join('')}</ul>
    </section>` : ''}
    ${mention()}`;
}

// ---------- Écran : Médicaments ----------

function vueMedicaments() {
  const meds = store.medicamentsEnCours(etat);
  const oubli = parole('en_cas_d_oubli');
  const cartes = meds.map((m) => {
    const moments = MOMENTS.filter((mo) => m.moments[mo.id]);
    return `<section class="carte">
      <div class="carte-tete" style="margin-bottom:0;align-items:flex-start">
        <span class="pastille bleu">${ic('medicaments')}</span>
        <div style="flex:1;min-width:0">
          <h2>${ech(m.nom)}</h2>
          ${m.dose ? `<div class="discret">${ech(m.dose)}</div>` : ''}
          <div class="moments">${moments.length ? moments.map((mo) => `<span>${mo.libelle}</span>`).join('') : '<span>Moment non renseigné</span>'}</div>
        </div>
        <button class="lien" data-action="ouvrir:medicament:${m.id}">Modifier</button>
      </div>
      ${photos.has(m.id) ? `<button class="vignette" data-action="ouvrir:photo:${m.id}" aria-label="Voir la photo de ${ech(m.nom)}"><img src="${photos.get(m.id)}" alt=""><span>${ic('photo', 16)} Voir la photo</span></button>` : ''}
      <div class="a-quoi"><b>À quoi ça sert</b>${m.aQuoiCaSert ? ech(m.aQuoiCaSert) : '<span class="vide">Non renseigné. Demandez à votre médecin ou à votre pharmacien de vous l’écrire en une ligne.</span>'}</div>
      ${m.ecritPar ? `<p class="ligne" style="padding:8px 0 0"><span class="meta">Écrit par ${ech(m.ecritPar)}</span></p>` : ''}
      ${store.versionPrecedente(m) ? `<p class="ligne" style="padding:4px 0 0"><span class="meta">Modifié le ${dateCourte(m.saisiLe.slice(0, 10))}. Avant : ${ech(descriptionPrise(store.versionPrecedente(m)))}</span></p>` : ''}
    </section>`;
  }).join('');

  return `<h1 class="titre-page">Mes médicaments</h1>
    <p class="sous-titre">La liste de votre ordonnance, avec ce à quoi sert chaque médicament.</p>
    ${bandeauExemple()}
    ${cartes || '<section class="carte"><p class="vide">Aucun médicament saisi.</p></section>'}
    <button class="bouton large" data-action="ouvrir:medicament">${ic('plus', 18)} Ajouter un médicament</button>
    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('horloge')}</span><h2>En cas d’oubli d’une prise</h2></div>
      ${oubli || `<p class="vide">Rien n’est noté sur votre fiche.</p>
        <p class="discret" style="margin-top:6px">Le carnet ne propose aucune conduite à tenir. Demandez à votre médecin ou à votre pharmacien, puis recopiez sa réponse.</p>
        <button class="bouton secondaire large" style="margin-top:12px" data-action="ouvrir:consigne:en_cas_d_oubli">Recopier la réponse</button>`}
    </section>
    <p class="mention">Les cases cochées sont un aide-mémoire. Le carnet ne rappelle rien et ne remplace pas votre ordonnance.</p>`;
}

// ---------- Le sel dans les aliments ----------

const ALIMENTS = new Map(FAMILLES_SEL.flatMap((f) => f.aliments.map((a) => [String(a.code), a])));
const sansAccent = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** « 53 g », « 1,8 g », ou « plus de 1 kg » pour les aliments presque sans sel. */
function quantitePourUnGramme(sel) {
  const g = store.grammesPourUnGrammeDeSel(sel);
  if (g === null || g > 1000) return 'plus de 1 kg';
  return g < 10 ? `${g.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} g` : `${Math.round(g)} g`;
}

const selPour100 = (sel) => (sel < 0.1 ? 'moins de 0,1 g' : `${sel.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} g`);

function carteSel() {
  const limite = store.limiteSelG(etat);
  const familles = FAMILLES_SEL.map((f) => `<details class="famille" data-famille="${f.id}" ${ui.famillesOuvertes.has(f.id) ? 'open' : ''}>
      <summary><span>${ech(f.titre)}</span><span class="compte">${f.aliments.length}</span></summary>
      <ul class="liste">${f.aliments.map((a) => `<li class="aliment" data-nom="${ech(sansAccent(a.nom))}"><button class="ligne" data-action="ouvrir:aliment:${a.code}">
        <span class="corps"><span class="valeur">${ech(a.nom)}</span><br><span class="meta">1 g de sel = ${quantitePourUnGramme(a.sel)}</span></span>
        <span class="teneur"><b>${selPour100(a.sel)}</b><small>pour 100 g</small></span>
      </button></li>`).join('')}</ul>
    </details>`).join('');

  return `<section class="carte" data-liste="aliments">
    <div class="carte-tete"><span class="pastille ambre">${ic('balance')}</span><h2>Le sel dans les aliments</h2></div>
    <p class="discret">${limite === null
      ? 'Ce que chaque aliment apporte en sel. Notez dans la fiche la limite écrite par votre médecin pour voir ce qu’une portion en représente.'
      : `Ce que chaque aliment apporte en sel. Votre limite écrite : <b>${limite.toLocaleString('fr-FR')} g par jour</b>.`} Touchez un aliment pour calculer votre portion.</p>
    <input type="text" class="recherche" data-recherche placeholder="Chercher un aliment" aria-label="Chercher un aliment" autocomplete="off" value="${ech(ui.recherche)}">
    <p class="vide" data-aucun hidden style="margin-top:12px">Aucun aliment de la liste ne correspond. Regardez l’étiquette du produit : le calcul est plus bas.</p>
    <div class="familles">${familles}</div>
    <p class="discret" style="margin-top:12px">Teneurs moyennes de la table Ciqual de l’Anses. D’une marque à l’autre, un produit peut être plus ou moins salé : son étiquette fait foi.</p>
  </section>`;
}

/** Le sel dans les eaux, de la plus salée à la moins salée : pour un litre et pour un verre. */
function carteEaux() {
  const ligne = (e) => `<li class="aliment" data-nom="${ech(sansAccent(e.nom))}"><div class="ligne">
      <span class="corps"><span class="valeur">${ech(e.nom)}</span>${e.origine ? ` <span class="meta">(${ech(e.origine)})</span>` : ''}<br>
        <span class="meta">1 litre : ${enGrammesDeSel(store.selDeLEau(1000, e.sodiumMgL))} de sel · un verre de 200 mL : ${enGrammesDeSel(store.selDeLEau(200, e.sodiumMgL))}</span></span>
      <span class="teneur"><b>${e.sodiumMgL.toLocaleString('fr-FR')}</b><small>mg de sodium par litre</small></span>
    </div></li>`;
  const famille = (id, titre, eaux) => `<details class="famille" data-famille="${id}" ${ui.famillesOuvertes.has(id) ? 'open' : ''}>
      <summary><span>${titre}</span><span class="compte">${eaux.length}</span></summary>
      <ul class="liste">${eaux.map(ligne).join('')}</ul>
    </details>`;
  const marques = EAUX.filter((e) => !e.courante);
  return `<section class="carte" data-liste="eaux">
    <div class="carte-tete"><span class="pastille bleu">${ic('goutte')}</span><h2>Le sel dans les eaux</h2></div>
    <p class="discret">L’étiquette d’une eau donne le sodium, pas le sel. Le carnet a fait le calcul : sel = sodium × 2,5. Certaines eaux gazeuses en apportent beaucoup.</p>
    <input type="text" class="recherche" data-recherche-eau placeholder="Chercher une eau" aria-label="Chercher une eau" autocomplete="off" value="${ech(ui.rechercheEau)}">
    <p class="vide" data-aucun hidden style="margin-top:12px">Aucune eau de la liste ne correspond. Sur l’écran Liquides, « Mon eau n’est pas dans la liste » permet de recopier son étiquette.</p>
    <div class="familles">${famille('eaux-courantes', 'Eaux courantes (moyennes)', EAUX.filter((e) => e.courante))}${famille('eaux-marques', 'Eaux de marque, de la plus salée à la moins salée', marques)}</div>
    <p class="discret" style="margin-top:12px">Teneurs de la table ${ech(VERSION_CIQUAL_EAUX)} de l’Anses. La composition d’une eau peut avoir changé depuis : l’étiquette de votre bouteille fait foi. L’eau du robinet varie selon la commune.</p>
  </section>`;
}

/** Applique une recherche à une liste affichée, sans la redessiner (la saisie garderait mal le curseur). */
function filtrerAliments() {
  filtrerListe(document.querySelector('[data-liste="aliments"]'), ui.recherche);
  filtrerListe(document.querySelector('[data-liste="eaux"]'), ui.rechercheEau);
}

function filtrerListe(racine, recherche) {
  if (!racine) return;
  const q = sansAccent(recherche.trim());
  let total = 0;
  for (const famille of racine.querySelectorAll('.famille')) {
    let visibles = 0;
    for (const li of famille.querySelectorAll('.aliment')) {
      const montre = !q || li.dataset.nom.includes(q);
      li.hidden = !montre;
      if (montre) visibles += 1;
    }
    famille.hidden = visibles === 0;
    if (q) famille.open = visibles > 0; else famille.open = ui.famillesOuvertes.has(famille.dataset.famille);
    total += visibles;
  }
  const aucun = racine.querySelector('[data-aucun]');
  if (aucun) aucun.hidden = total > 0;
}

function feuilleAliment(code) {
  const a = ALIMENTS.get(String(code));
  if (!a) return '';
  return `<div class="feuille-tete"><h2>${ech(a.nom)}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <div class="bloc">
      <div class="deux">
        <div class="tuile"><small>Pour 100 g</small><b>${selPour100(a.sel)}</b><small>de sel</small></div>
        <div class="tuile"><small>1 g de sel, c’est</small><b>${quantitePourUnGramme(a.sel)}</b><small>de cet aliment</small></div>
      </div>
      <section class="carte calcul" data-calcul="aliment" data-sel="${a.sel}">
        <label class="champ">Ma portion<span class="champ-unite"><input type="text" inputmode="decimal" data-entree="portion" placeholder="50" autocomplete="off"><span>g</span></span></label>
        <div class="portions">${[10, 20, 30, 50, 100, 150, 250].map((g) => `<button type="button" data-action="portion:${g}">${g} g</button>`).join('')}</div>
        <p class="resultat" data-resultat>= <b>…</b> g de sel<span data-part></span></p>
      </section>
      <p class="discret">Dans la table ${ech(VERSION_CIQUAL)} : « ${ech(a.nomCiqual)} ». C’est une teneur moyenne : l’étiquette de votre produit fait foi.</p>
      ${store.limiteSelG(etat) === null ? '' : '<p class="discret">Le pourcentage compare la portion à la limite de sel écrite sur votre fiche. Il ne dit pas ce que vous avez déjà mangé dans la journée.</p>'}
    </div>`;
}

// ---------- Écran : Alimentation ----------

function vueAlimentation() {
  // Les deux limites chiffrées ont leur propre place (ici en tête, et sur l'écran Liquides).
  const maFiche = CHAMPS_DE_LA_FICHE.filter((id) => !['sel_limite', 'boissons_limite'].includes(id)).map((id) => {
    const c = CHAMPS.get(id);
    const v = store.consigneCourante(etat, id);
    return `<li><button class="ligne" data-action="ouvrir:consigne:${id}"><span class="corps">
      <span class="libelle">${ech(c.libelle)}</span><br>
      ${v ? `<span class="valeur">${avecUnite(c, v.valeur)}</span><br><span class="meta">${origine(v)}</span>` : '<span class="vide">Non renseigné</span>'}
    </span><span class="chevron">${ic('chevron', 18)}</span></button></li>`;
  }).join('');

  const groupes = GROUPES.map((g) => `<section class="carte groupe ${g.couleur}">
      <div class="carte-tete"><span class="pastille ${g.couleur}">${ic(g.icone)}</span><h2>${ech(g.titre)}</h2></div>
      <ul class="liste">${g.reperes.map((r) => `<li class="repere">
        <div class="repere-tete"><span class="valeur">${ech(r.titre)}</span><span class="etiquette ${g.couleur}">${ech(r.repere)}</span></div>
        ${r.detail ? `<p class="discret">${ech(r.detail)}</p>` : ''}
      </li>`).join('')}</ul>
      ${g.note ? `<p class="note-groupe">${ech(g.note)}</p>` : ''}
    </section>`).join('');

  return `<h1 class="titre-page">Alimentation</h1>
    <p class="sous-titre">Ma limite de sel, et ce que chaque aliment en représente.</p>
    ${bandeauExemple()}

    ${carteLimiteSel()}

    ${carteSel()}

    ${carteEaux()}

    <section class="carte">
      <div class="carte-tete"><span class="pastille primaire">${ic('fiche')}</span><h2>Ce que mes soignants ont ajouté</h2></div>
      <ul class="liste">${maFiche}</ul>
    </section>

    <div class="bandeau priorite">${ic('alerte', 20)}<div class="corps"><b>Vos consignes passent avant.</b> Les repères ci-dessous valent pour les adultes en général. Si votre médecin ou votre diététicien a dit autre chose pour vous, c’est sa consigne qui compte.</div></div>

    ${groupes}

    <section class="carte">
      <div class="carte-tete"><span class="pastille ambre">${ic('balance')}</span><h2>Lire le sel sur une étiquette</h2></div>
      <p class="discret">Certaines étiquettes indiquent le sodium, pas le sel. Le sel vaut le sodium multiplié par 2,5.</p>
      <div class="calcul" data-calcul="sodium">
        <label class="champ">Sodium sur l’étiquette<span class="champ-unite"><input type="text" inputmode="decimal" data-entree="sodium" placeholder="400" autocomplete="off"><span>mg</span></span></label>
        <p class="resultat" data-resultat>= <b>…</b> g de sel<span data-part></span></p>
      </div>
      <div class="calcul" data-calcul="portion" style="margin-top:16px">
        <div class="deux">
          <label class="champ">Sel pour 100 g<span class="champ-unite"><input type="text" inputmode="decimal" data-entree="sel" placeholder="1,2" autocomplete="off"><span>g</span></span></label>
          <label class="champ">Ma portion<span class="champ-unite"><input type="text" inputmode="decimal" data-entree="portion" placeholder="150" autocomplete="off"><span>g</span></span></label>
        </div>
        <p class="resultat" data-resultat>= <b>…</b> g de sel dans la portion<span data-part></span></p>
      </div>
      <p class="discret" style="margin-top:12px">${store.limiteSelG(etat) === null ? 'Ce calcul donne une quantité. Notez dans la fiche la limite de sel écrite par votre médecin : le carnet dira ce que cette quantité en représente.' : 'Le pourcentage compare cette quantité à la limite de sel écrite sur votre fiche. Il ne dit pas ce que vous avez déjà mangé dans la journée.'}</p>
    </section>

    <section class="carte">
      <div class="carte-tete"><span class="pastille vert">${ic('alimentation')}</span><h2>Donner du goût en salant moins</h2></div>
      <div class="puces-gout">${POUR_LE_GOUT.map((p) => `<span>${ech(p)}</span>`).join('')}</div>
      <p class="discret" style="margin-top:12px">Des idées de cuisine, pas des conseils médicaux.</p>
    </section>

    <section class="carte sources">
      <div class="carte-tete"><span class="pastille bleu">${ic('fiche')}</span><h2>Sources</h2></div>
      <ul class="liste">${Object.values(SOURCES).map((src) => `<li><p class="valeur" style="font-size:0.95rem">${ech(src.titre)}</p><p class="meta">${ech(src.date)} · <a href="${src.adresse}" target="_blank" rel="noopener">ouvrir le texte</a></p></li>`).join('')}</ul>
      <p class="discret" style="margin-top:10px">Repères relus sur ces textes le ${dateCourte(RELU_LE)}. Rédaction propre au carnet.</p>
    </section>
    ${mention()}`;
}

/** Met à jour le résultat d'un calcul d'étiquette sans redessiner l'écran (la saisie resterait interrompue). */
function calculerEtiquette(bloc) {
  const valeur = (nom) => bloc.querySelector(`[data-entree="${nom}"]`)?.value;
  const g = bloc.dataset.calcul === 'sodium' ? store.selDepuisSodium(valeur('sodium'))
    : bloc.dataset.calcul === 'aliment' ? store.selDeLaPortion(bloc.dataset.sel, valeur('portion'))
    : store.selDeLaPortion(valeur('sel'), valeur('portion'));
  bloc.querySelector('[data-resultat] b').textContent = g === null ? '…' : g.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const limite = store.limiteSelG(etat);
  const part = store.partDeLaLimite(g, limite);
  bloc.querySelector('[data-part]').textContent = part === null ? '' : `, soit ${part} % de la limite écrite (${limite.toLocaleString('fr-FR')} g par jour)`;
}

// ---------- Feuilles de saisie ----------

function feuilleConsigne(id) {
  const c = CHAMPS.get(id);
  const v = store.consigneCourante(etat, id);
  const historique = store.historiqueConsigne(etat, id);
  const sf = ui.feuille?.saisie ?? {}; // ce qui était tapé avant d'ajouter un médecin
  const texteValeur = sf.valeur ?? v?.valeur;
  const valeur = c.long
    ? `<textarea name="valeur" required>${ech(texteValeur)}</textarea>`
    : `<span class="${c.unite ? 'champ-unite' : ''}"><input type="text" name="valeur" value="${ech(texteValeur)}" ${c.unite ? 'inputmode="decimal"' : ''} autocomplete="off" required>${c.unite ? `<span>${c.unite}</span>` : ''}</span>`;
  return `<div class="feuille-tete"><h2>${ech(c.libelle)}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="consigne" data-id="${id}">
      <label class="champ">${c.simple ? 'Renseignement' : 'Ce qui est écrit'}${c.aide ? `<small>${ech(c.aide)}</small>` : ''}${valeur}</label>
      ${c.simple ? '' : `
        ${choixMedecin(sf.medecin ?? '', 'Écrit par')}
        <div class="deux">
          <label class="champ">Écrit le<input type="date" name="date" value="${ech(sf.date ?? aujourdhui())}" max="${aujourdhui()}"></label>
          <label class="champ">À réévaluer le<input type="date" name="reevaluerLe" value="${ech(sf.reevaluerLe ?? v?.reevaluerLe)}"></label>
        </div>`}
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer</button>
      ${v && !c.simple ? '<p class="discret">Enregistrer ajoute une nouvelle version. L’ancienne est conservée dans l’historique.</p>' : ''}
    </form>
    ${historique.length ? `<div class="bloc" style="margin-top:18px"><h3 style="font-size:1rem">Versions précédentes</h3>
      <ul class="liste historique">${historique.map((h) => `<li><b>${avecUnite(c, h.valeur)}</b><br>${origine(h)}</li>`).join('')}</ul></div>` : ''}`;
}

function feuilleMedicament(id) {
  const m = id ? etat.medicaments.find((x) => x.id === id) : null;
  return `<div class="feuille-tete"><h2>${m ? 'Modifier le médicament' : 'Ajouter un médicament'}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="medicament" data-id="${m?.id ?? ''}">
      <div class="deux">
        <label class="champ">Nom<input type="text" name="nom" value="${ech(m?.nom)}" autocomplete="off" required></label>
        <label class="champ">Dose<input type="text" name="dose" value="${ech(m?.dose)}" placeholder="5 mg" autocomplete="off"></label>
      </div>
      <div class="champ"><span style="font-size:0.9rem;font-weight:650;color:var(--encre-douce)">Moments de prise</span>
        <div class="coches" style="margin-top:6px">${MOMENTS.map((mo) => `<label><input type="checkbox" name="moment-${mo.id}" ${m?.moments[mo.id] ? 'checked' : ''}>${mo.libelle}</label>`).join('')}</div>
      </div>
      <label class="champ">À quoi ça sert<small>La ligne écrite par le soignant, en français courant.</small><textarea name="aQuoiCaSert">${ech(m?.aQuoiCaSert)}</textarea></label>
      <label class="champ">Écrit par<input type="text" name="ecritPar" value="${ech(m?.ecritPar)}" autocomplete="off"></label>
      <div class="champ"><span style="font-size:0.9rem;font-weight:650;color:var(--encre-douce)">Photo de la boîte ou de l’ordonnance</span>
        <small style="font-weight:400;color:var(--encre-pale)">Rangée telle quelle sur cet appareil. Le carnet ne la lit pas.</small>
        <div class="bloc-photo" id="bloc-photo">${blocPhoto(m ? photos.get(m.id) : null)}</div>
        <input type="file" id="fichier-photo" accept="image/*" hidden>
      </div>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer</button>
      ${m ? `<button class="bouton danger large" type="button" data-action="arreter-med:${m.id}">Ce médicament est arrêté</button>` : ''}
    </form>`;
}

function blocPhoto(image) {
  return image
    ? `<img src="${image}" alt="Photo du médicament"><div class="rangee"><button class="bouton neutre" type="button" data-action="choisir-photo">Changer</button><button class="bouton danger" type="button" data-action="retirer-photo">Retirer</button></div>`
    : `<button class="bouton secondaire large" type="button" data-action="choisir-photo">${ic('photo', 18)} Ajouter une photo</button>`;
}

function feuillePhoto(id) {
  const m = etat.medicaments.find((x) => x.id === id);
  return `<div class="feuille-tete"><h2>${ech(m?.nom ?? 'Photo')}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <img class="photo-entiere" src="${photos.get(id) ?? ''}" alt="Photo du médicament">`;
}

function feuilleRdv() {
  return `<div class="feuille-tete"><h2>Ajouter un rendez-vous</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="rdv">
      <div class="deux">
        <label class="champ">Date<input type="date" name="date" min="${aujourdhui()}" required></label>
        <div class="champ"><span>Heure</span>
          <!-- Deux listes plutôt que l'horloge du téléphone : sur certains écrans son cadran est petit et son bouton sort du cadre. -->
          <span class="heure-minutes">
            <select name="heureH" aria-label="Heure"><option value="">—</option>${Array.from({ length: 24 }, (_, h) => `<option value="${String(h).padStart(2, '0')}">${h} h</option>`).join('')}</select>
            <select name="heureM" aria-label="Minutes">${['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => `<option value="${m}">${m}</option>`).join('')}</select>
          </span>
        </div>
      </div>
      <label class="champ">Avec<input type="text" name="avec" placeholder="Cardiologue" autocomplete="off"></label>
      <label class="champ">Lieu<input type="text" name="lieu" autocomplete="off"></label>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer</button>
    </form>`;
}

function feuilleUrgence() {
  const service = store.consigneCourante(etat, 'numero_service');
  const choc = parole('un_choc_sans_malaise');
  const chocs = parole('chocs_repetes');
  const centre = store.consigneCourante(etat, 'dispositif_centre');
  return `<div class="feuille-tete"><h2>En cas d’urgence</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <div class="bloc">
      <a class="urgence-numero" href="tel:15">${ic('telephone', 28)}<div><strong>15</strong><br><span>SAMU, urgence médicale</span></div></a>
      <a class="urgence-numero" href="tel:112" style="background:var(--primaire-fonce)">${ic('telephone', 28)}<div><strong>112</strong><br><span>Numéro d’urgence européen</span></div></a>
      <section class="carte">
        <div class="carte-tete"><span class="pastille ambre">${ic('telephone')}</span><h2>Mon service</h2></div>
        ${service ? `<div class="valeur" style="font-weight:700;font-size:1.2rem">${ech(service.valeur)}</div>` : '<p class="vide">Numéro du service non renseigné sur la fiche.</p>'}
      </section>
      ${choc || chocs ? `<section class="carte"><div class="carte-tete"><span class="pastille corail">${ic('dispositif')}</span><h2>Défibrillateur : ce que le centre de suivi a écrit</h2></div>
        <div class="bloc">${choc ? `<div><p class="libelle discret">Un choc, sans malaise</p>${choc}</div>` : ''}${chocs ? `<div><p class="libelle discret">Plusieurs chocs</p>${chocs}</div>` : ''}</div>
        ${centre ? `<p class="discret" style="margin-top:10px">Centre de suivi : ${ech(centre.valeur)}</p>` : ''}</section>` : ''}
      <p class="mention">Le carnet ne juge pas de l’urgence. Dans le doute, appelez.</p>
    </div>`;
}

function feuilleMonEau() {
  const perso = etat.mesEaux ?? [];
  return `<div class="feuille-tete"><h2>Mon eau</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="mon-eau">
      <p class="discret">Recopiez l’étiquette de la bouteille. Le sodium est dans le tableau de composition, en mg par litre (mg/L).</p>
      <label class="champ">Nom de l’eau<input type="text" name="nom" placeholder="Nom écrit sur la bouteille" autocomplete="off" required></label>
      <label class="champ">Sodium<small>Écrit « Sodium » ou « Na+ » sur l’étiquette.</small><span class="champ-unite"><input type="text" name="sodium" inputmode="decimal" placeholder="11,6" autocomplete="off" required><span>mg/L</span></span></label>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer et boire cette eau</button>
      <p class="discret">Le sel vaut le sodium multiplié par 2,5 : c’est la règle de l’étiquetage.</p>
    </form>
    ${perso.length ? `<div class="bloc" style="margin-top:18px"><h3 style="font-size:1rem">Mes eaux enregistrées</h3>
      <ul class="liste">${perso.map((e) => `<li><div class="ligne"><div class="corps"><span class="valeur">${ech(e.nom)}</span><br><span class="meta">Sodium ${e.sodiumMgL.toLocaleString('fr-FR')} mg/L · ${enGrammesDeSel(store.selDeLEau(1000, e.sodiumMgL))} de sel par litre</span></div>
        <button class="bouton-rond" data-action="retirer-mon-eau:${e.code}" aria-label="Retirer ${ech(e.nom)}">${ic('croix', 18)}</button></div></li>`).join('')}</ul></div>` : ''}`;
}

function feuilleSeance(arg) {
  const fait = arg === 'fait';
  const ressenti = store.consigneCourante(etat, 'ressenti_effort');
  const puces = (nom, valeurs) => `<div class="coches choix-unique">${valeurs.map((v, i) => `<label><input type="radio" name="${nom}" value="${ech(v)}" ${i === 0 && fait ? 'checked' : ''}>${ech(v)}</label>`).join('')}</div>`;
  return `<div class="feuille-tete"><h2>${fait ? 'J’ai fait une séance' : 'Je n’ai pas pu faire ma séance'}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="seance" data-fait="${fait ? 'oui' : 'non'}">
      <label class="champ">Date<input type="date" name="date" value="${aujourdhui()}" max="${aujourdhui()}" required></label>
      ${fait ? `
        <div class="champ"><span class="titre-champ">Quoi</span>${puces('type', store.TYPES_SEANCE)}</div>
        <label class="champ">Durée<small>Facultatif.</small><span class="champ-unite"><input type="text" name="duree" inputmode="numeric" placeholder="30" autocomplete="off"><span>min</span></span></label>
        <label class="champ">Comment je l’ai ressentie<small>${ressenti ? `Votre fiche dit : ${ech(ressenti.valeur)}` : 'Facultatif. Avec les mots de l’échelle utilisée par votre service, si vous en avez une.'}</small><input type="text" name="ressenti" autocomplete="off"></label>`
      : `
        <div class="champ"><span class="titre-champ">Pourquoi</span><small>Facultatif.</small>${puces('raison', store.RAISONS_PAS_PU)}</div>
        <div class="bandeau priorite">${ic('alerte', 20)}<div class="corps">Une douleur dans la poitrine, un malaise, un essoufflement inhabituel : ne restez pas seul avec. <button type="button" data-action="ouvrir:urgence">Voir les numéros d’urgence</button></div></div>`}
      <label class="champ">Une remarque<small>Facultatif. Par exemple pour en parler au médecin.</small><textarea name="note"></textarea></label>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton large" type="submit">Enregistrer</button>
    </form>`;
}

function feuilleReglages() {
  return `<div class="feuille-tete"><h2>Sauvegarde</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <div class="bloc">
      <section class="carte">
        <p><b>Vos données ne quittent pas cet appareil.</b></p>
        <p class="discret" style="margin-top:6px">Aucun compte, aucun serveur. En contrepartie, si le téléphone est perdu, changé ou vidé, le carnet disparaît : faites une sauvegarde de temps en temps et gardez le fichier ailleurs.</p>
      </section>
      <button class="bouton large" data-action="exporter">Enregistrer une sauvegarde</button>
      <button class="bouton secondaire large" data-action="importer">Reprendre une sauvegarde</button>
      <input type="file" id="fichier-import" accept="application/json,.json" hidden>
      ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
      <button class="bouton danger large" data-action="tout-effacer">Tout effacer</button>
      <p class="mention">Mon carnet cœur · première version d’essai</p>
    </div>`;
}

function feuille() {
  if (!ui.feuille) return '';
  const { type, arg } = ui.feuille;
  const contenu = type === 'consigne' ? feuilleConsigne(arg)
    : type === 'medicament' ? feuilleMedicament(arg)
    : type === 'fiche-recue' ? feuilleFicheRecue(arg)
    : type === 'rdv' ? feuilleRdv()
    : type === 'photo' ? feuillePhoto(arg)
    : type === 'aliment' ? feuilleAliment(arg)
    : type === 'reception' ? feuilleReception(ui.feuille)
    : type === 'urgence' ? feuilleUrgence()
    : type === 'mon-eau' ? feuilleMonEau()
    : type === 'seance' ? feuilleSeance(arg)
    : type === 'document' ? feuilleDocument(arg)
    : type === 'ajout-document' ? feuilleAjoutDocument()
    : type === 'modif-document' ? (() => { const d = etat.documents.find((x) => x.id === arg); return d ? formulaireDocument(d, 'Renommer, classer', 'modif-document', d.id) : ''; })()
    : feuilleReglages();
  return `<div class="voile" data-voile><div class="feuille" role="dialog" aria-modal="true">${contenu}</div></div>`;
}

// ---------- Assemblage ----------

function rendre() {
  const contenu = ui.vue === 'fiche' ? vueFiche() : ui.vue === 'poids' ? vuePoids() : ui.vue === 'medicaments' ? vueMedicaments() : ui.vue === 'alimentation' ? vueAlimentation() : ui.vue === 'liquides' ? vueLiquides() : ui.vue === 'seances' ? vueSeances() : ui.vue === 'soignant' ? vueSoignant() : ui.vue === 'remplir' ? vueRemplir() : ui.vue === 'documents' ? vueDocuments() : vueAujourdhui();
  document.getElementById('app').innerHTML = `
    <header class="barre">
      ${ui.vue === 'aujourdhui'
        ? `<div class="marque"><span class="logo">${ic('coeur', 20)}</span>Mon carnet cœur</div>`
        : `<button class="retour" data-action="retour" aria-label="Revenir à l’accueil">${ic('retour', 22)} Accueil</button>`}
      <div class="barre-actions">
        <button class="bouton-urgence" data-action="ouvrir:urgence">${ic('telephone', 17)} Urgence</button>
        <button class="bouton-rond" data-action="ouvrir:reglages" aria-label="Sauvegarde">${ic('reglages')}</button>
      </div>
    </header>
    <main class="page">${contenu}</main>
    ${feuille()}`;
  document.body.style.overflow = ui.feuille ? 'hidden' : '';
  if (ui.vue === 'alimentation') filtrerAliments();
  if (ui.vue === 'documents') afficherPlace();
  remplirApercu();
}

function aller(vue) {
  ui.vue = vue; ui.feuille = null; ui.erreur = ''; ui.erreurLimite = ''; ui.erreurBoisson = ''; ui.erreurMedecin = ''; ui.erreurDocument = ''; ui.messageFiche = '';
  if (location.hash.slice(1) !== vue) {
    // Quitter l'accueil ajoute une étape à l'historique : le geste « retour » du téléphone ramène alors à l'accueil
    // au lieu de fermer l'appli.
    if (vue === 'aujourdhui') history.replaceState(null, '', '#aujourdhui');
    else { history.pushState(null, '', `#${vue}`); ui.retourPossible = true; }
  }
  rendre();
  window.scrollTo(0, 0);
}

/** La flèche en haut à gauche : même effet que le geste « retour » du téléphone. */
function revenir() {
  if (ui.retourPossible) { ui.retourPossible = false; history.back(); } else aller('aujourdhui');
}

/** Applique une modification ; affiche l'erreur à l'endroit de la saisie si elle est refusée. */
function tenter(modification, { fermer = true } = {}) {
  try {
    enregistrer(modification());
    ui.erreur = '';
    if (fermer) ui.feuille = null;
  } catch (e) {
    ui.erreur = e.message;
  }
  rendre();
}

function telecharger(nom, contenu) {
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
  lien.download = nom;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
}

// ---------- Gestes ----------

document.addEventListener('click', (evenement) => {
  const voile = evenement.target.closest('[data-voile]');
  if (voile && evenement.target === voile) { ui.feuille = null; ui.erreur = ''; rendre(); return; }

  const cible = evenement.target.closest('[data-action]');
  if (!cible) return;
  const [action, a, b] = cible.dataset.action.split(':');
  const jour = aujourdhui();

  if (action === 'nav') aller(a);
  else if (action === 'retour') revenir();
  else if (action === 'ouvrir') { ui.feuille = { type: a, arg: b }; ui.erreur = ''; rendre(); }
  else if (action === 'fermer') { ui.feuille = null; ui.erreur = ''; rendre(); }
  else if (action === 'accepter-reception') { const colis = ui.feuille?.colis; if (colis) tenter(() => store.recevoirConsignes(etat, colis, maintenant())); }
  else if (action === 'vu-reception') tenter(() => store.marquerReceptionVue(etat), { fermer: false });
  else if (action === 'copier-adresse-soignant') {
    navigator.clipboard.writeText(adressePageSoignant()).then(() => { cible.textContent = 'Adresse copiée'; }).catch(() => { document.querySelector('.lien-a-copier')?.select(); });
  }
  else if (action === 'partager-adresse-soignant') navigator.share({ title: 'Page soignant du carnet', url: adressePageSoignant() }).catch(() => {});
  else if (action === 'boire') { ui.erreurBoisson = ''; tenter(() => store.boire(etat, jour, a, maintenant(), eauPourBoire()), { fermer: false }); }
  else if (action === 'retirer-mon-eau') { if (confirm('Retirer cette eau de votre liste ? Les boissons déjà notées gardent leur sel.')) tenter(() => store.retirerMonEau(etat, a), { fermer: false }); }
  else if (action === 'ouvrir-seance') { ui.feuille = { type: 'seance', arg: a }; ui.erreur = ''; rendre(); }
  else if (action === 'ajouter-medecin') {
    const formulaire = cible.closest('form');
    const s = Object.fromEntries(new FormData(formulaire));
    try {
      enregistrer(store.ajouterMedecin(etat, { nom: s.nouveauNom, fonction: s.nouvelleFonction }, maintenant()));
      const saisie = { ...s, medecin: etat.medecins[etat.medecins.length - 1].id, nouveauNom: '', nouvelleFonction: '' };
      if (formulaire.dataset.form === 'remplir') sauverBrouillon(saisie); else if (ui.feuille) ui.feuille.saisie = saisie;
      ui.erreur = '';
    } catch (e) { ui.erreur = e.message; }
    rendre();
  }
  else if (action === 'ajouter-ligne-med' || action === 'retirer-ligne-med') {
    const formulaire = cible.closest('form');
    const s = Object.fromEntries(new FormData(formulaire));
    const lignes = lignesMedsDepuis(s);
    if (action === 'ajouter-ligne-med') lignes.push({ id: '', nom: '', dose: '', moments: {}, aQuoiCaSert: '', arreter: false });
    else lignes.splice(Number(a), 1);
    sauverBrouillon(saisieAvecLignes(s, lignes));
    ui.themesOuverts.add('medicaments');
    rendre();
    if (action === 'ajouter-ligne-med') document.querySelector(`[name="m${lignes.length - 1}-nom"]`)?.focus();
  }
  else if (action === 'retirer-medecin') { if (confirm('Retirer ce médecin de votre liste ? Les consignes déjà écrites gardent son nom.')) tenter(() => store.retirerMedecin(etat, a), { fermer: false }); }
  else if (action === 'abandonner-brouillon') { if (confirm('Abandonner cette fiche commencée ? Ce qui a été tapé et pas enregistré sera perdu.')) { effacerBrouillon(); aller('fiche'); } }
  else if (action === 'retirer-seance') { if (confirm('Retirer cette note ?')) tenter(() => store.retirerSeance(etat, a), { fermer: false }); }
  else if (action === 'vider-boissons') { if (confirm('Remettre la bouteille à plein ? Les boissons notées aujourd’hui seront effacées.')) tenter(() => store.viderBoissons(etat, jour), { fermer: false }); }
  else if (action === 'retirer-boisson') tenter(() => store.retirerBoisson(etat, jour, a), { fermer: false });
  else if (action === 'portion') {
    const bloc = cible.closest('[data-calcul]');
    bloc.querySelector('[data-entree="portion"]').value = a;
    calculerEtiquette(bloc);
  }
  else if (action === 'dicter') {
    const champ = cible.closest('form').querySelector('[name="kg"]');
    champ.inputMode = 'text';
    champ.focus();
  }
  else if (action === 'choisir-photo') document.getElementById('fichier-photo').click();
  else if (action === 'retirer-photo') { ui.feuille.photo = null; document.getElementById('bloc-photo').innerHTML = blocPhoto(null); }
  else if (action === 'periode') { ui.periode = Number(a); rendre(); }
  else if (action === 'tabac') tenter(() => store.noterCigarettes(etat, jour, Number(a), maintenant()), { fermer: false });
  else if (action === 'tabac-substitut') tenter(() => store.basculerSubstitut(etat, jour, maintenant()), { fermer: false });
  else if (action === 'tabac-activer') tenter(() => store.activerSuiviTabac(etat, true), { fermer: false });
  else if (action === 'tabac-masquer') { if (confirm('Ne plus afficher le suivi du tabac sur l’accueil ? Ce qui est noté est gardé ; vous pourrez le réafficher en bas de l’accueil.')) tenter(() => store.activerSuiviTabac(etat, false), { fermer: false }); }
  else if (action === 'choisir-document') document.getElementById('fichier-document').click();
  else if (action === 'retirer-document') {
    if (confirm('Retirer ce document du carnet ? Le fichier sera effacé de ce téléphone (l’original, dans vos mails ou vos fichiers, n’est pas touché).')) {
      coffre.retirer(a).catch((e) => console.error('Document non effacé', e));
      tenter(() => store.retirerDocument(etat, a));
    }
  }
  else if (action === 'ouvrir-moment') { ui.momentsOuverts.add(`${jour}|${a}`); rendre(); }
  else if (action === 'replier-moment') { ui.momentsOuverts.delete(`${jour}|${a}`); rendre(); }
  else if (action === 'tout-pris') tenter(() => store.cocherMoment(etat, jour, a, maintenant()), { fermer: false });
  else if (action === 'prise') { ui.momentsOuverts.delete(`${jour}|${b}`); tenter(() => store.basculerPrise(etat, jour, a, b, maintenant()), { fermer: false }); }
  else if (action === 'suppr-poids') { if (confirm(`Retirer la pesée du ${dateCourte(a)} ?`)) tenter(() => store.retirerPoids(etat, a)); }
  else if (action === 'suppr-rdv') { if (confirm('Retirer ce rendez-vous ?')) tenter(() => store.retirerRendezVous(etat, a)); }
  else if (action === 'arreter-med') { if (confirm('Retirer ce médicament de la liste du jour ? Les prises déjà cochées sont conservées.')) tenter(() => store.arreterMedicament(etat, a, jour)); }
  else if (action === 'exemple') tenter(() => store.etatExemple(jour));
  else if (action === 'effacer-exemple') { if (confirm('Effacer l’exemple fictif ?')) { remplacerPhotos({}); coffre.remplacer({}).catch(console.error); tenter(() => store.etatVide()); aller('aujourdhui'); } }
  else if (action === 'tout-effacer') { if (confirm('Effacer tout le carnet de cet appareil ? Sans sauvegarde, rien ne pourra être récupéré.')) { remplacerPhotos({}); coffre.remplacer({}).catch(console.error); tenter(() => store.etatVide()); aller('aujourdhui'); } }
  else if (action === 'exporter') {
    documentsPourSauvegarde()
      .then((docs) => telecharger(`carnet-coeur_${jour}.json`, store.exporter(etat, maintenant(), Object.fromEntries(photos), docs)))
      .catch((e) => { console.error(e); alert('Les documents n’ont pas pu être lus : la sauvegarde n’a pas été faite.'); });
  }
  else if (action === 'importer') document.getElementById('fichier-import').click();
});

document.addEventListener('submit', (evenement) => {
  const formulaire = evenement.target.closest('[data-form]');
  if (!formulaire) return;
  evenement.preventDefault();
  const s = Object.fromEntries(new FormData(formulaire));
  const type = formulaire.dataset.form;
  const id = formulaire.dataset.id;

  if (type === 'limite') {
    // La limite saisie sur place doit être un nombre lisible, sinon rien n'est enregistré.
    try {
      const essai = store.ecrireConsigne(etat, id, { valeur: s.valeur }, maintenant());
      const lue = id === 'sel_limite' ? store.limiteSelG(essai) : store.limiteBoissonsMl(essai);
      if (lue === null) throw new Error(id === 'sel_limite' ? 'Écrivez un nombre de grammes, par exemple 6.' : 'Écrivez un nombre de litres, par exemple 1,5.');
      enregistrer(essai);
      ui.erreurLimite = '';
    } catch (e) {
      ui.erreurLimite = e.message;
    }
    rendre();
  }
  else if (type === 'boisson') {
    // Erreur affichée dans la carte de la bouteille, pas à côté du poids.
    try { enregistrer(store.boire(etat, aujourdhui(), s.ml, maintenant(), eauPourBoire())); ui.erreurBoisson = ''; } catch (e) { ui.erreurBoisson = e.message; }
    rendre();
  }
  else if (type === 'document') {
    const f = ui.feuille?.fichier;
    if (!f) return;
    const id = store.nouvelIdDocument(maintenant());
    const saisie = { ...s, id, type: f.type, nomFichier: f.name, taille: f.size };
    let essai;
    try { essai = store.ajouterDocument(etat, saisie, maintenant()); } catch (e) { ui.erreur = e.message; rendre(); return; }
    // Le fichier d'abord : si le téléphone manque de place, rien n'est inscrit dans le carnet.
    coffre.poser(id, f)
      .then(() => { enregistrer(essai); ui.feuille = null; ui.erreur = ''; rendre(); coffre.demanderPersistance(); })
      .catch((e) => { console.error(e); ui.erreur = 'Le document n’a pas pu être rangé sur ce téléphone (place insuffisante ?).'; rendre(); });
  }
  else if (type === 'modif-document') tenter(() => store.modifierDocument(etat, id, s));
  else if (type === 'mon-eau') tenter(() => store.ajouterMonEau(etat, s, maintenant()));
  else if (type === 'seance') {
    const fait = formulaire.dataset.fait === 'oui';
    tenter(() => store.noterSeance(etat, { ...s, fait }, maintenant()));
  }
  else if (type === 'poids-rapide') tenter(() => store.noterPoids(etat, { date: aujourdhui(), kg: s.kg }, maintenant()));
  else if (type === 'poids') tenter(() => store.noterPoids(etat, s, maintenant()));
  else if (type === 'consigne') tenter(() => { const auteur = auteurDepuis(s); return store.ecrireConsigne(etat, id, { ...s, auteur }, maintenant()); });
  else if (type === 'medecin') {
    try { enregistrer(store.ajouterMedecin(etat, s, maintenant())); ui.erreurMedecin = ''; } catch (e) { ui.erreurMedecin = e.message; }
    rendre();
  }
  else if (type === 'remplir') {
    try {
      const auteur = auteurDepuis(s);
      const consignes = Object.fromEntries(Object.entries(s).filter(([nom]) => nom.startsWith('c-')).map(([nom, v]) => [nom.slice(2), v]));
      const { etat: rempli, ecrits, medicaments } = store.remplirFiche(etat, { auteur, date: s.date, consignes, medicaments: lignesMedsDepuis(s) }, maintenant());
      enregistrer(rempli);
      effacerBrouillon();
      // L'écran du formulaire est remplacé dans l'historique : « retour » n'y ramène pas.
      history.replaceState(null, '', '#fiche');
      aller('fiche');
      const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;
      const compte = (type) => medicaments.filter((m) => m.type === type).length;
      const parties = [
        ecrits.length ? `${pluriel(ecrits.length, 'renseignement')} rangé${ecrits.length > 1 ? 's' : ''}` : '',
        compte('nouveau') ? `${pluriel(compte('nouveau'), 'médicament')} ajouté${compte('nouveau') > 1 ? 's' : ''}` : '',
        compte('change') ? `${pluriel(compte('change'), 'médicament')} modifié${compte('change') > 1 ? 's' : ''}` : '',
        compte('arret') ? `${pluriel(compte('arret'), 'médicament')} arrêté${compte('arret') > 1 ? 's' : ''}` : '',
      ].filter(Boolean);
      ui.messageFiche = `${parties.join(', ')}${auteur ? ` · écrit par ${auteur}` : ''}${s.date ? ` le ${dateCourte(s.date)}` : ''}.`;
      rendre();
    } catch (e) {
      ui.erreur = e.message;
      rendre();
    }
  }
  else if (type === 'rdv') tenter(() => store.ajouterRendezVous(etat, { ...s, heure: s.heureH ? `${s.heureH}:${s.heureM || '00'}` : '' }, maintenant()));
  else if (type === 'medicament') {
    const saisie = { ...s, moments: Object.fromEntries(MOMENTS.map((m) => [m.id, s[`moment-${m.id}`] === 'on'])) };
    const photo = ui.feuille?.photo; // undefined : inchangée ; null : retirée ; texte : nouvelle image
    tenter(() => (id ? store.modifierMedicament(etat, id, saisie, maintenant()) : store.ajouterMedicament(etat, saisie, maintenant())));
    if (!ui.erreur && photo !== undefined) rangerPhoto(id || etat.medicaments[etat.medicaments.length - 1].id, photo);
  }
});

// ---------- Photos ----------

function signalerPhoto(e) {
  console.error('Photo non enregistrée', e);
  alert('La photo n’a pas pu être enregistrée sur cet appareil.');
}

/** Range (ou retire, si image est null) la photo d'un médicament, à l'écran tout de suite puis sur l'appareil. */
function rangerPhoto(id, image) {
  if (image) photos.set(id, image); else photos.delete(id);
  rendre();
  (image ? depot.poser(id, image) : depot.retirer(id)).catch(signalerPhoto);
}

function remplacerPhotos(objet) {
  photos = new Map(Object.entries(objet));
  depot.remplacer(objet).catch(signalerPhoto);
}

document.addEventListener('change', async (evenement) => {
  const fiche = evenement.target.closest('[data-form="remplir"]');
  if (fiche) {
    // La ligne d'un médicament à arrêter se voit tout de suite.
    if (evenement.target.name?.endsWith('-arreter')) evenement.target.closest('.med-soignant')?.classList.toggle('a-arreter', evenement.target.checked);
    sauverBrouillon(Object.fromEntries(new FormData(fiche)));
    return;
  }
  if (evenement.target.matches('[data-choix-eau]')) { tenter(() => store.choisirEau(etat, evenement.target.value), { fermer: false }); return; }
  if (evenement.target.id === 'fichier-photo') {
    const fichier = evenement.target.files[0];
    if (!fichier || !ui.feuille) return;
    try {
      // Pas de nouvel affichage complet ici : il effacerait ce qui est en cours de saisie dans la feuille.
      ui.feuille.photo = await depot.reduire(fichier);
      document.getElementById('bloc-photo').innerHTML = blocPhoto(ui.feuille.photo);
    } catch (e) {
      console.error('Photo illisible', e);
      alert('Cette image n’a pas pu être lue.');
    }
    return;
  }
  if (evenement.target.id === 'fichier-document') {
    const fichier = evenement.target.files[0];
    evenement.target.value = '';
    if (!fichier) return;
    ui.erreurDocument = '';
    ui.feuille = { type: 'ajout-document', fichier };
    ui.erreur = '';
    rendre();
    return;
  }
  if (evenement.target.id !== 'fichier-import') return;
  const fichier = evenement.target.files[0];
  if (!fichier) return;
  try {
    const contenu = await fichier.text();
    const lu = store.importer(contenu);
    const photosLues = store.photosDeLaSauvegarde(contenu);
    const documentsLus = store.documentsDeLaSauvegarde(contenu);
    if (carnetVide() || confirm('Remplacer le carnet de cet appareil par cette sauvegarde ?')) {
      enregistrer(lu);
      remplacerPhotos(photosLues);
      remplacerDocuments(documentsLus).catch((e) => { console.error(e); alert('Les documents de la sauvegarde n’ont pas pu être rangés sur ce téléphone.'); });
      aller('aujourdhui');
      return;
    }
  } catch (e) {
    ui.erreur = e.message;
  }
  rendre();
});

// Une famille d'aliments ouverte le reste quand l'écran est redessiné.
// Version 19 : sur le téléphone, toucher une case (Matin, Midi, Soir…) juste après avoir tapé un nom ferme le clavier ;
// la page change de hauteur et la case touchée partait hors de l'écran. On la remet là où le doigt l'a touchée,
// pendant une seconde seulement, pour ne jamais gêner le défilement fait à la main.
let caseTenue = null;
function tenirLaCase() {
  if (!caseTenue || Date.now() > caseTenue.jusqua) { caseTenue = null; return; }
  const el = caseTenue.el.isConnected ? caseTenue.el
    : document.querySelector(`[name="${CSS.escape(caseTenue.nom)}"][value="${CSS.escape(caseTenue.valeur)}"]`)?.closest('label');
  if (!el) return;
  const ecart = el.getBoundingClientRect().top - caseTenue.haut;
  if (Math.abs(ecart) > 2) window.scrollBy(0, ecart);
}
document.addEventListener('pointerdown', (evenement) => {
  const coche = evenement.target.closest?.('form label');
  const caseACocher = coche?.querySelector('input[type="checkbox"], input[type="radio"]');
  if (!caseACocher?.name) return;
  caseTenue = { el: coche, nom: caseACocher.name, valeur: caseACocher.value, haut: coche.getBoundingClientRect().top, jusqua: Date.now() + 1000 };
}, true);
window.visualViewport?.addEventListener('resize', tenirLaCase);
window.addEventListener('resize', tenirLaCase);
document.addEventListener('change', () => { if (caseTenue) { requestAnimationFrame(tenirLaCase); setTimeout(tenirLaCase, 350); setTimeout(tenirLaCase, 700); } }, true);

document.addEventListener('toggle', (evenement) => {
  const theme = evenement.target.closest?.('[data-theme-remplir]');
  if (theme && evenement.target === theme) { if (theme.open) ui.themesOuverts.add(theme.dataset.themeRemplir); else ui.themesOuverts.delete(theme.dataset.themeRemplir); return; }
  const famille = evenement.target.closest?.('.famille');
  if (!famille || (famille.closest('[data-liste="eaux"]') ? ui.rechercheEau : ui.recherche).trim()) return;
  if (famille.open) ui.famillesOuvertes.add(famille.dataset.famille); else ui.famillesOuvertes.delete(famille.dataset.famille);
}, true);

document.addEventListener('input', (evenement) => {
  const fiche = evenement.target.closest('[data-form="remplir"]');
  if (fiche) { sauverBrouillon(Object.fromEntries(new FormData(fiche))); return; }
  if (evenement.target.matches('[data-recherche]')) { ui.recherche = evenement.target.value; filtrerAliments(); return; }
  if (evenement.target.matches('[data-recherche-eau]')) { ui.rechercheEau = evenement.target.value; filtrerAliments(); return; }
  const bloc = evenement.target.closest('[data-calcul]');
  if (bloc) calculerEtiquette(bloc);
});

document.addEventListener('keydown', (evenement) => {
  if (evenement.key === 'Escape' && ui.feuille) { ui.feuille = null; ui.erreur = ''; rendre(); }
});

window.addEventListener('hashchange', async () => { ui.retourPossible = false; ui.vue = vueDepuisAdresse(); ui.feuille = null; ui.messageFiche = ''; ui.erreur = ''; await traiterReception(); rendre(); window.scrollTo(0, 0); });

// Hors ligne : seulement une fois en ligne, jamais pendant le développement sur l'ordinateur.
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  // Quand une nouvelle version prend la main sur un appareil qui avait déjà l'appli, on recharge une fois :
  // sinon l'ancienne version reste à l'écran jusqu'à la prochaine ouverture, et « rien n'a changé ».
  const avaitDejaUneVersion = Boolean(navigator.serviceWorker.controller);
  let recharge = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!avaitDejaUneVersion || recharge) return;
    recharge = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch((e) => console.error('Mode hors ligne indisponible', e));
}

rendre();
traiterReception().then(() => { if (ui.feuille) rendre(); });
depot.toutes().then((lues) => { photos = lues; if (lues.size) rendre(); }).catch((e) => console.error('Photos illisibles sur cet appareil', e));
