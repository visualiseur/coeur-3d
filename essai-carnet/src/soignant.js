// Page du soignant, à part du carnet : il remplit les consignes, la page fabrique un QR code et un lien.
// Rien n'est enregistré ni envoyé : les consignes voyagent dans la partie de l'adresse après « # ».
// Le soignant n'a pas besoin du carnet ; c'est le téléphone du patient qui l'ouvre en scannant le code.

import { CHAMPS, MOMENTS } from './modele.js';
import { emballerCompact, deballerTout, CHAMPS_SOIGNANT } from './transmission.js';
import { qrCode, qrEnSvg } from './qr.js';
import { versIso } from './dates.js';
import { VERSION_APPLI, ech, ic } from './affichage.js';

// Gardé en mémoire le temps de la page seulement, pour ne pas tout retaper après une erreur.
const ui = { saisie: {}, medicaments: [], transmission: null, erreur: '', ouverts: new Set(['coeur']) };
const aujourdhui = () => versIso();
const adresseDuCarnet = () => new URL('./', location.href).href;

const medicamentVide = () => ({ nom: '', dose: '', moments: {}, aQuoiCaSert: '', arreter: false });

function champ(id) {
  const c = CHAMPS.get(id);
  const v = ech(ui.saisie[`c-${id}`] ?? '');
  const saisie = c.long
    ? `<textarea name="c-${id}" rows="2">${v}</textarea>`
    : `<span class="${c.unite ? 'champ-unite' : ''}"><input type="text" name="c-${id}" value="${v}" ${c.unite ? 'inputmode="decimal"' : ''} autocomplete="off">${c.unite ? `<span>${c.unite}</span>` : ''}</span>`;
  return `<label class="champ">${ech(c.libelle)}${c.aide ? `<small>${ech(c.aide)}</small>` : ''}${saisie}</label>`;
}

/** Un thème de la fiche, repliable ; il s'ouvre seul s'il contient déjà quelque chose. */
function theme(g) {
  const remplis = g.ids.filter((id) => String(ui.saisie[`c-${id}`] ?? '').trim()).length;
  const ouvert = ui.ouverts.has(g.id) || remplis > 0;
  return `<details class="carte theme-soignant" data-theme="${g.id}" ${ouvert ? 'open' : ''}>
      <summary class="carte-tete"><span class="pastille ${g.couleur}">${ic(g.icone)}</span><h2>${ech(g.titre)}</h2><span class="compte">${remplis ? `${remplis} rempli${remplis > 1 ? 's' : ''}` : ''}</span><span class="chevron">${ic('chevron', 18)}</span></summary>
      <div class="bloc">${g.ids.map(champ).join('')}</div>
    </details>`;
}

function ligneMedicament(m, i) {
  return `<div class="med-soignant${m.arreter ? ' a-arreter' : ''}">
      <div class="deux">
        <label class="champ">Nom<input type="text" name="m${i}-nom" value="${ech(m.nom)}" placeholder="Tel qu’écrit sur l’ordonnance" autocomplete="off"></label>
        <label class="champ">Dose<input type="text" name="m${i}-dose" value="${ech(m.dose)}" placeholder="5 mg" autocomplete="off"></label>
      </div>
      <div class="coches">${MOMENTS.map((mo) => `<label><input type="checkbox" name="m${i}-${mo.id}" ${m.moments[mo.id] ? 'checked' : ''}>${mo.libelle}</label>`).join('')}</div>
      <label class="champ">À quoi ça sert<small>Facultatif. Une ligne en français courant.</small><input type="text" name="m${i}-aQuoiCaSert" value="${ech(m.aQuoiCaSert)}" autocomplete="off"></label>
      <div class="rangee med-actions">
        <label class="arreter"><input type="checkbox" name="m${i}-arreter" ${m.arreter ? 'checked' : ''}> Arrêter ce médicament</label>
        <button class="lien" type="button" data-action="retirer-med:${i}">Retirer la ligne</button>
      </div>
    </div>`;
}

function blocResultat() {
  if (!ui.transmission) return '';
  let code, dense = false;
  // Au-delà d'environ 100 modules de côté (version 21 de la norme), certains téléphones peinent à lire le code sur un écran.
  try { const matrice = qrCode(new TextEncoder().encode(ui.transmission.lien)); dense = matrice.taille > 100; code = qrEnSvg(matrice); } catch (e) { code = `<p class="erreur">${ech(e.message)} Utilisez le lien ci-dessous.</p>`; }
  return `<section class="carte transmission">
      <div class="carte-tete"><span class="pastille vert">${ic('coche')}</span><h2>À transmettre au patient</h2></div>
      <p class="discret">Le patient scanne ce code avec l’appareil photo de son téléphone : son carnet s’ouvre, lui montre ce qui change et lui propose de l’ajouter.</p>
      <div class="cadre-qr">${code}</div>
      ${dense ? '<p class="discret"><b>Code très chargé.</b> Si le téléphone ne le lit pas, rapprochez-le de l’écran, ou envoyez plutôt le lien ; vous pouvez aussi transmettre la fiche en deux fois.</p>' : ''}
      <p class="discret">Ou envoyez-lui ce lien :</p>
      <textarea class="lien-a-copier" readonly rows="3" aria-label="Lien à transmettre">${ech(ui.transmission.lien)}</textarea>
      <div class="rangee">
        <button class="bouton secondaire" data-action="copier-lien">Copier le lien</button>
        ${navigator.share ? '<button class="bouton secondaire" data-action="partager-lien">Partager</button>' : ''}
      </div>
      <a class="bouton large" style="margin-top:10px" href="${ech(ui.transmission.lien)}">Ouvrir dans le carnet de ce téléphone</a>
      <p class="discret" style="margin-top:6px">Ce bouton sert seulement si vous remplissez directement sur le téléphone du patient.</p>
      <button class="bouton neutre large" style="margin-top:10px" data-action="effacer">Effacer et recommencer</button>
    </section>`;
}

function rendre() {
  const s = ui.saisie;
  document.getElementById('app').innerHTML = `
    <header class="barre">
      <div class="marque"><span class="logo">${ic('coeur', 20)}</span>Espace soignant</div>
    </header>
    <main class="page page-soignant">
      <h1 class="titre-page">Consignes pour le carnet d’un patient</h1>
      <p class="sous-titre">Remplissez ce que vous voulez transmettre : une fiche entière à la sortie, ou seulement ce qui change ensuite. Rien n’est enregistré ni envoyé par cette page : les consignes passent de cet écran au téléphone du patient, par un code à scanner.</p>
      ${blocResultat()}
      <form data-form="soignant" class="formulaire-soignant">
        <section class="carte">
          <div class="carte-tete"><span class="pastille primaire">${ic('fiche')}</span><h2>Qui écrit</h2></div>
          <div class="bloc">
            <label class="champ">Nom et fonction<input type="text" name="auteur" value="${ech(s.auteur ?? '')}" placeholder="Dr Martin, cardiologue" autocomplete="off" required></label>
            <div class="deux">
              <label class="champ">Écrit le<input type="date" name="date" value="${ech(s.date ?? aujourdhui())}" max="${aujourdhui()}" required></label>
              <label class="champ">À réévaluer le<input type="date" name="reevaluerLe" value="${ech(s.reevaluerLe ?? '')}"></label>
            </div>
          </div>
        </section>
        <section class="carte">
          <div class="carte-tete"><span class="pastille bleu">${ic('medicaments')}</span><h2>Médicaments</h2></div>
          <p class="discret">Indiquez les médicaments à ajouter ou dont la dose change, avec leur nom tel qu’il est écrit sur l’ordonnance. Pour en retirer un, écrivez son nom et cochez « Arrêter ». Les médicaments que vous ne citez pas restent inchangés dans le carnet.</p>
          <div class="bloc">${ui.medicaments.map(ligneMedicament).join('')}</div>
          <button class="bouton secondaire large" type="button" data-action="ajouter-med" style="margin-top:12px">${ic('plus', 18)} Ajouter un médicament</button>
        </section>
        <h2 class="titre-section">La fiche de sortie</h2>
        ${CHAMPS_SOIGNANT.map(theme).join('')}
        ${ui.erreur ? `<p class="erreur">${ech(ui.erreur)}</p>` : ''}
        <button class="bouton large" type="submit">Préparer le code à scanner</button>
        <p class="discret" style="text-align:center">Seuls les champs remplis sont transmis.</p>
      </form>
      <p class="mention">Le carnet affiche au patient ce que vous avez écrit, avec votre nom et la date. Il ne vérifie pas qui a écrit : même niveau de preuve qu’une fiche papier. Il ne remplace ni l’ordonnance ni aucun avis médical.<br>Version ${VERSION_APPLI} · <a href="${ech(adresseDuCarnet())}">Le carnet du patient</a></p>
    </main>`;
}

/** Relit le formulaire dans ui, pour ne rien perdre quand la page est redessinée. */
function lireFormulaire() {
  const formulaire = document.querySelector('[data-form="soignant"]');
  if (!formulaire) return;
  const s = Object.fromEntries(new FormData(formulaire));
  ui.saisie = s;
  ui.medicaments = ui.medicaments.map((_, i) => ({
    nom: s[`m${i}-nom`] ?? '',
    dose: s[`m${i}-dose`] ?? '',
    moments: Object.fromEntries(MOMENTS.map((mo) => [mo.id, s[`m${i}-${mo.id}`] === 'on'])),
    aQuoiCaSert: s[`m${i}-aQuoiCaSert`] ?? '',
    arreter: s[`m${i}-arreter`] === 'on',
  }));
}

document.addEventListener('click', (evenement) => {
  const cible = evenement.target.closest('[data-action]');
  if (!cible) return;
  const [action, a] = cible.dataset.action.split(':');
  if (action === 'ajouter-med') { lireFormulaire(); ui.medicaments.push(medicamentVide()); rendre(); document.querySelector(`[name="m${ui.medicaments.length - 1}-nom"]`)?.focus(); }
  else if (action === 'retirer-med') { lireFormulaire(); ui.medicaments.splice(Number(a), 1); rendre(); }
  else if (action === 'effacer') { ui.saisie = {}; ui.medicaments = []; ui.transmission = null; ui.erreur = ''; rendre(); window.scrollTo(0, 0); }
  else if (action === 'copier-lien') {
    navigator.clipboard.writeText(ui.transmission.lien).then(() => { cible.textContent = 'Lien copié'; }).catch(() => { document.querySelector('.lien-a-copier')?.select(); });
  }
  else if (action === 'partager-lien') navigator.share({ title: 'Consignes pour votre carnet', url: ui.transmission.lien }).catch(() => {});
});

document.addEventListener('change', (evenement) => {
  // La ligne d'un médicament à arrêter se voit tout de suite.
  if (evenement.target.name?.endsWith('-arreter')) evenement.target.closest('.med-soignant')?.classList.toggle('a-arreter', evenement.target.checked);
});

document.addEventListener('toggle', (evenement) => {
  const d = evenement.target.closest?.('[data-theme]');
  if (d) { if (d.open) ui.ouverts.add(d.dataset.theme); else ui.ouverts.delete(d.dataset.theme); }
}, true);

document.addEventListener('submit', async (evenement) => {
  if (!evenement.target.matches('[data-form="soignant"]')) return;
  evenement.preventDefault();
  lireFormulaire();
  const s = ui.saisie;
  try {
    const consignes = Object.fromEntries(Object.entries(s).filter(([nom]) => nom.startsWith('c-')).map(([nom, v]) => [nom.slice(2), v]));
    const fragment = await emballerCompact({ auteur: s.auteur, date: s.date, reevaluerLe: s.reevaluerLe, consignes, medicaments: ui.medicaments });
    ui.transmission = { lien: `${adresseDuCarnet()}#${fragment}`, colis: await deballerTout(fragment) };
    ui.erreur = '';
  } catch (e) {
    ui.transmission = null;
    ui.erreur = e.message;
  }
  rendre();
  window.scrollTo(0, 0);
});

rendre();
