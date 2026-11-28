// Coffre à documents (version 21) : les fichiers eux-mêmes (PDF, images), rangés sur l'appareil (IndexedDB).
// Le carnet garde à part leur fiche (nom, catégorie, date) dans store.js. Rien n'est envoyé, rien n'est lu ni analysé.

const BASE = 'carnet-coeur-documents';
const RAYON = 'fichiers';

function ouvrir() {
  return new Promise((resoudre, rejeter) => {
    const demande = indexedDB.open(BASE, 1);
    demande.onupgradeneeded = () => demande.result.createObjectStore(RAYON);
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error);
  });
}

async function operation(mode, action) {
  const base = await ouvrir();
  try {
    return await new Promise((resoudre, rejeter) => {
      const transaction = base.transaction(RAYON, mode);
      let resultat;
      const requete = action(transaction.objectStore(RAYON));
      if (requete) requete.onsuccess = () => { resultat = requete.result; };
      transaction.oncomplete = () => resoudre(resultat);
      transaction.onerror = () => rejeter(transaction.error);
      transaction.onabort = () => rejeter(transaction.error);
    });
  } finally {
    base.close();
  }
}

/** Le fichier d'un document (Blob), ou undefined s'il n'est pas sur cet appareil. */
export const lire = (id) => operation('readonly', (rayon) => rayon.get(id));
export const poser = (id, fichier) => operation('readwrite', (rayon) => { rayon.put(fichier, id); });
export const retirer = (id) => operation('readwrite', (rayon) => { rayon.delete(id); });

/** Tous les fichiers : Map identifiant → Blob (pour la sauvegarde). */
export async function tous() {
  const fichiers = new Map();
  await operation('readonly', (rayon) => {
    rayon.openCursor().onsuccess = (e) => {
      const curseur = e.target.result;
      if (curseur) { fichiers.set(curseur.key, curseur.value); curseur.continue(); }
    };
  });
  return fichiers;
}

/** Remplace tout le coffre par les fichiers donnés ({ identifiant: Blob }). */
export const remplacer = (fichiers) => operation('readwrite', (rayon) => {
  rayon.clear();
  for (const [id, f] of Object.entries(fichiers)) rayon.put(f, id);
});

export const versDataUrl = (blob) => new Promise((resoudre, rejeter) => {
  const lecteur = new FileReader();
  lecteur.onload = () => resoudre(lecteur.result);
  lecteur.onerror = () => rejeter(lecteur.error);
  lecteur.readAsDataURL(blob);
});

export const depuisDataUrl = async (url) => (await fetch(url)).blob();

/**
 * Demande au navigateur de ne pas effacer seul les données du carnet quand la place manque.
 * Le navigateur peut refuser : la sauvegarde reste la seule vraie protection.
 */
export async function demanderPersistance() {
  try { return Boolean(await navigator.storage?.persist?.()); } catch { return false; }
}

/** La place occupée par tout le carnet sur cet appareil, et celle disponible : { utilise, quota } en octets, ou null. */
export async function placeOccupee() {
  try {
    const e = await navigator.storage?.estimate?.();
    return e ? { utilise: e.usage ?? 0, quota: e.quota ?? 0 } : null;
  } catch { return null; }
}
