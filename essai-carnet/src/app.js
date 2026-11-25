// Écrans du carnet. Règle fondatrice : l'application ne décide jamais.
// Elle affiche ce qui a été écrit, par qui et quand ; elle ne juge aucune valeur et ne calcule aucun seuil.

import { THEMES, CHAMPS, MOMENTS } from './modele.js';
import * as store from './store.js';
import { geometrie } from './courbe.js';
import * as depot from './photos.js';
import { GROUPES, POUR_LE_GOUT, SOURCES, CHAMPS_DE_LA_FICHE, RELU_LE } from './alimentation.js';
import { FAMILLES_SEL, VERSION_CIQUAL } from './sel-aliments.js';
import { versIso, dateLongue, dateCourte, dateTresCourte } from './dates.js';

const CLE = 'carnet-coeur';
const VUES = [
  { id: 'aujourdhui', libelle: 'Accueil', icone: 'soleil' },
  { id: 'poids', libelle: 'Poids', icone: 'balance' },
  { id: 'alimentation', libelle: 'Alimentation', icone: 'alimentation' },
  { id: 'liquides', libelle: 'Liquides', icone: 'goutte' },
  { id: 'medicaments', libelle: 'Médicaments', icone: 'medicaments' },
];
// « Ma fiche » n'est plus dans la barre du bas : on y va depuis l'accueil.
const ROUTES = [...VUES.map((v) => v.id), 'fiche'];
// À changer avec VERSION dans sw.js à chaque mise en ligne : c'est ce qui dit quelle version on a sous les yeux.
const VERSION_APPLI = 9;

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
const ui = { vue: vueDepuisAdresse(), feuille: null, periode: 30, erreur: '', recherche: '', famillesOuvertes: new Set() };

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

// ---------- Petits outils d'affichage ----------

const ech = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nombre = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const TRACES = {
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
  alerte: '<path d="M12 4 2.500 20h19L12 4ZM12 10v4.500M12 17.300v.2"/>',
};

function ic(nom, taille = 20) {
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TRACES[nom] ?? ''}</svg>`;
}

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
  const prochain = store.rendezVousAVenir(etat, jour)[0];

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

  if (carnetVide()) {
    return `${bandeau}${tuilesAccueil()}
      <section class="carte">
        <div class="carte-tete"><span class="pastille primaire">${ic('coeur')}</span><h2>Bienvenue dans votre carnet</h2></div>
        <p class="discret">Il range au même endroit ce que vos soignants ont écrit pour vous, votre poids jour après jour et vos médicaments. Tout reste sur cet appareil.</p>
        <div class="rangee" style="margin-top:16px">
          <button class="bouton" data-action="nav:fiche">Remplir ma fiche</button>
          <button class="bouton secondaire" data-action="exemple">Voir un exemple</button>
        </div>
      </section>
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
    return `<div class="moment">${mo.libelle}</div>${duMoment.map((m) => {
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
      <div class="carte-tete"><span class="pastille ambre">${ic('calendrier')}</span><h2>Prochain rendez-vous</h2><button class="lien" data-action="ouvrir:rdv">Ajouter</button></div>
      ${prochain
        ? `<div class="ligne" style="padding:0"><div class="corps">
             <div class="valeur">${ech(dateLongue(prochain.date))}${prochain.heure ? ` à ${ech(prochain.heure)}` : ''}</div>
             <div class="libelle">${ech([prochain.avec, prochain.lieu].filter(Boolean).join(' · ')) || 'Sans précision'}</div>
           </div><button class="bouton-rond" data-action="suppr-rdv:${prochain.id}" aria-label="Retirer ce rendez-vous">${ic('croix', 18)}</button></div>`
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

  return `${bandeau}${bandeauExemple()}${tuilesAccueil()}${cartePoids}${carteMeds}${carteRdv}${carteRevoir}${lienFiche}${mention()}`;
}

/** Les trois priorités, toujours en haut de l'accueil : poids, alimentation, liquides. */
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
  </div>`;
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

// ---------- La bouteille du jour ----------

const RECIPIENTS = [
  { libelle: 'Tasse', ml: 150 },
  { libelle: 'Verre', ml: 200 },
  { libelle: 'Mug', ml: 250 },
  { libelle: 'Bol', ml: 350 },
  { libelle: 'Petite bouteille', ml: 500 },
];

const enMl = (n) => `${n.toLocaleString('fr-FR')} mL`;
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
  const precision = parole('boissons');

  const verres = `<div class="recipients">${RECIPIENTS.map((r) => `<button class="recipient" data-action="boire:${r.ml}"><b>${r.libelle}</b><span>${r.ml} mL</span></button>`).join('')}</div>
    <form class="saisie-rapide" data-form="boisson" style="margin-top:10px">
      <div class="champ-unite"><input type="text" name="ml" inputmode="numeric" placeholder="Autre quantité" aria-label="Autre quantité en millilitres" autocomplete="off" required><span>mL</span></div>
      <button class="bouton secondaire" type="submit">Ajouter</button>
    </form>
    ${ui.erreurBoisson ? `<p class="erreur" style="margin-top:10px">${ech(ui.erreurBoisson)}</p>` : ''}`;

  const journal = boissons.length ? `<div class="journal-boissons">${boissons.map((b, i) => `<button data-action="retirer-boisson:${i}" aria-label="Retirer ${b.ml} mL"><span>${b.ml} mL</span>${ic('croix', 14)}</button>`).join('')}</div>
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
    ${limite === null ? '' : precision ? `<div style="margin-top:14px">${precision}</div>` : '<p class="discret" style="margin-top:12px">Ce qui compte comme boisson (soupe, café, yaourt…) : c’est au médecin de le dire. Vous pouvez noter sa réponse dans la fiche.</p>'}
    ${limite === null ? '' : '<p class="discret" style="margin-top:8px">Les tailles de verre sont des tailles courantes : utilisez « Autre quantité » pour les vôtres. La bouteille repart pleine toute seule chaque matin.</p>'}
  </section>`;
}

function vueLiquides() {
  return `<h1 class="titre-page">Liquides</h1>
    <p class="sous-titre">Ma limite de liquide du jour : la bouteille se vide à chaque boisson notée.</p>
    ${bandeauExemple()}${carteBoissons()}${mention()}`;
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

// ---------- Écran : Ma fiche ----------

function vueFiche() {
  const themes = THEMES.map((t) => {
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
      <ul class="liste">${lignes}</ul>
    </section>`;
  }).join('');

  return `<h1 class="titre-page">Ma fiche</h1>
    <p class="sous-titre">Ce que vos soignants ont écrit pour vous. Un champ vide reste vide : rien n’est complété à leur place.</p>
    ${bandeauExemple()}${themes}${mention()}`;
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
      ${consigne || `<p class="vide">Aucune consigne de surveillance du poids n’est notée sur votre fiche.</p>
        <p class="discret" style="margin-top:6px">Demandez à votre médecin de l’écrire, puis recopiez sa phrase mot pour mot.</p>
        <button class="bouton secondaire large" style="margin-top:12px" data-action="ouvrir:consigne:consigne_poids">Recopier la consigne</button>`}
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

  return `<section class="carte">
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

/** Applique la recherche à la liste affichée, sans la redessiner (la saisie garderait mal le curseur). */
function filtrerAliments() {
  const q = sansAccent(ui.recherche.trim());
  let total = 0;
  for (const famille of document.querySelectorAll('.famille')) {
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
  const aucun = document.querySelector('[data-aucun]');
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
  const maFiche = CHAMPS_DE_LA_FICHE.filter((id) => !['sel_limite', 'boissons_limite', 'boissons'].includes(id)).map((id) => {
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
  const valeur = c.long
    ? `<textarea name="valeur" required>${ech(v?.valeur)}</textarea>`
    : `<span class="${c.unite ? 'champ-unite' : ''}"><input type="text" name="valeur" value="${ech(v?.valeur)}" ${c.unite ? 'inputmode="decimal"' : ''} autocomplete="off" required>${c.unite ? `<span>${c.unite}</span>` : ''}</span>`;
  return `<div class="feuille-tete"><h2>${ech(c.libelle)}</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <form data-form="consigne" data-id="${id}">
      <label class="champ">${c.simple ? 'Renseignement' : 'Ce qui est écrit'}${c.aide ? `<small>${ech(c.aide)}</small>` : ''}${valeur}</label>
      ${c.simple ? '' : `
        <label class="champ">Écrit par<small>Nom et fonction du soignant.</small><input type="text" name="auteur" value="${ech(v?.auteur)}" autocomplete="off"></label>
        <div class="deux">
          <label class="champ">Écrit le<input type="date" name="date" value="${ech(v?.date)}" max="${aujourdhui()}"></label>
          <label class="champ">À réévaluer le<input type="date" name="reevaluerLe" value="${ech(v?.reevaluerLe)}"></label>
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
        <label class="champ">Heure<input type="time" name="heure"></label>
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
  return `<div class="feuille-tete"><h2>En cas d’urgence</h2><button class="bouton-rond" data-action="fermer" aria-label="Fermer">${ic('croix', 18)}</button></div>
    <div class="bloc">
      <a class="urgence-numero" href="tel:15">${ic('telephone', 28)}<div><strong>15</strong><br><span>SAMU, urgence médicale</span></div></a>
      <a class="urgence-numero" href="tel:112" style="background:var(--primaire-fonce)">${ic('telephone', 28)}<div><strong>112</strong><br><span>Numéro d’urgence européen</span></div></a>
      <section class="carte">
        <div class="carte-tete"><span class="pastille ambre">${ic('telephone')}</span><h2>Mon service</h2></div>
        ${service ? `<div class="valeur" style="font-weight:700;font-size:1.2rem">${ech(service.valeur)}</div>` : '<p class="vide">Numéro du service non renseigné sur la fiche.</p>'}
      </section>
      ${choc || chocs ? `<section class="carte"><div class="carte-tete"><span class="pastille corail">${ic('dispositif')}</span><h2>Défibrillateur : ce que le service a écrit</h2></div>
        <div class="bloc">${choc ? `<div><p class="libelle discret">Un choc, sans malaise</p>${choc}</div>` : ''}${chocs ? `<div><p class="libelle discret">Plusieurs chocs</p>${chocs}</div>` : ''}</div></section>` : ''}
      <p class="mention">Le carnet ne juge pas de l’urgence. Dans le doute, appelez.</p>
    </div>`;
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
    : type === 'rdv' ? feuilleRdv()
    : type === 'photo' ? feuillePhoto(arg)
    : type === 'aliment' ? feuilleAliment(arg)
    : type === 'urgence' ? feuilleUrgence()
    : feuilleReglages();
  return `<div class="voile" data-voile><div class="feuille" role="dialog" aria-modal="true">${contenu}</div></div>`;
}

// ---------- Assemblage ----------

function rendre() {
  const contenu = ui.vue === 'fiche' ? vueFiche() : ui.vue === 'poids' ? vuePoids() : ui.vue === 'medicaments' ? vueMedicaments() : ui.vue === 'alimentation' ? vueAlimentation() : ui.vue === 'liquides' ? vueLiquides() : vueAujourdhui();
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
}

function aller(vue) {
  ui.vue = vue; ui.feuille = null; ui.erreur = ''; ui.erreurLimite = ''; ui.erreurBoisson = '';
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
  else if (action === 'boire') { ui.erreurBoisson = ''; tenter(() => store.boire(etat, jour, a, maintenant()), { fermer: false }); }
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
  else if (action === 'prise') tenter(() => store.basculerPrise(etat, jour, a, b, maintenant()), { fermer: false });
  else if (action === 'suppr-poids') { if (confirm(`Retirer la pesée du ${dateCourte(a)} ?`)) tenter(() => store.retirerPoids(etat, a)); }
  else if (action === 'suppr-rdv') { if (confirm('Retirer ce rendez-vous ?')) tenter(() => store.retirerRendezVous(etat, a)); }
  else if (action === 'arreter-med') { if (confirm('Retirer ce médicament de la liste du jour ? Les prises déjà cochées sont conservées.')) tenter(() => store.arreterMedicament(etat, a, jour)); }
  else if (action === 'exemple') tenter(() => store.etatExemple(jour));
  else if (action === 'effacer-exemple') { if (confirm('Effacer l’exemple fictif ?')) { remplacerPhotos({}); tenter(() => store.etatVide()); aller('aujourdhui'); } }
  else if (action === 'tout-effacer') { if (confirm('Effacer tout le carnet de cet appareil ? Sans sauvegarde, rien ne pourra être récupéré.')) { remplacerPhotos({}); tenter(() => store.etatVide()); aller('aujourdhui'); } }
  else if (action === 'exporter') telecharger(`carnet-coeur_${jour}.json`, store.exporter(etat, maintenant(), Object.fromEntries(photos)));
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
    try { enregistrer(store.boire(etat, aujourdhui(), s.ml, maintenant())); ui.erreurBoisson = ''; } catch (e) { ui.erreurBoisson = e.message; }
    rendre();
  }
  else if (type === 'poids-rapide') tenter(() => store.noterPoids(etat, { date: aujourdhui(), kg: s.kg }, maintenant()));
  else if (type === 'poids') tenter(() => store.noterPoids(etat, s, maintenant()));
  else if (type === 'consigne') tenter(() => store.ecrireConsigne(etat, id, s, maintenant()));
  else if (type === 'rdv') tenter(() => store.ajouterRendezVous(etat, s, maintenant()));
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
  if (evenement.target.id !== 'fichier-import') return;
  const fichier = evenement.target.files[0];
  if (!fichier) return;
  try {
    const contenu = await fichier.text();
    const lu = store.importer(contenu);
    const photosLues = store.photosDeLaSauvegarde(contenu);
    if (carnetVide() || confirm('Remplacer le carnet de cet appareil par cette sauvegarde ?')) {
      enregistrer(lu);
      remplacerPhotos(photosLues);
      aller('aujourdhui');
      return;
    }
  } catch (e) {
    ui.erreur = e.message;
  }
  rendre();
});

// Une famille d'aliments ouverte le reste quand l'écran est redessiné.
document.addEventListener('toggle', (evenement) => {
  const famille = evenement.target.closest?.('.famille');
  if (!famille || ui.recherche.trim()) return;
  if (famille.open) ui.famillesOuvertes.add(famille.dataset.famille); else ui.famillesOuvertes.delete(famille.dataset.famille);
}, true);

document.addEventListener('input', (evenement) => {
  if (evenement.target.matches('[data-recherche]')) { ui.recherche = evenement.target.value; filtrerAliments(); return; }
  const bloc = evenement.target.closest('[data-calcul]');
  if (bloc) calculerEtiquette(bloc);
});

document.addEventListener('keydown', (evenement) => {
  if (evenement.key === 'Escape' && ui.feuille) { ui.feuille = null; ui.erreur = ''; rendre(); }
});

window.addEventListener('hashchange', () => { ui.retourPossible = false; ui.vue = vueDepuisAdresse(); ui.feuille = null; rendre(); window.scrollTo(0, 0); });

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
depot.toutes().then((lues) => { photos = lues; if (lues.size) rendre(); }).catch((e) => console.error('Photos illisibles sur cet appareil', e));
