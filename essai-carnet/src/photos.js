// Photos des médicaments : rangées sur l'appareil (IndexedDB), jamais lues ni analysées.
// Une photo est une image réduite, au format « data:image/jpeg;base64,… », rangée sous l'identifiant du médicament.

const BASE = 'carnet-coeur-photos';
const RAYON = 'photos';

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
      const resultat = action(transaction.objectStore(RAYON));
      transaction.oncomplete = () => resoudre(resultat);
      transaction.onerror = () => rejeter(transaction.error);
      transaction.onabort = () => rejeter(transaction.error);
    });
  } finally {
    base.close();
  }
}

/** Toutes les photos : Map identifiant du médicament → image. */
export async function toutes() {
  const photos = new Map();
  await operation('readonly', (rayon) => {
    rayon.openCursor().onsuccess = (e) => {
      const curseur = e.target.result;
      if (curseur) { photos.set(curseur.key, curseur.value); curseur.continue(); }
    };
  });
  return photos;
}

export const poser = (id, image) => operation('readwrite', (rayon) => { rayon.put(image, id); });
export const retirer = (id) => operation('readwrite', (rayon) => { rayon.delete(id); });

/** Remplace tout le rangement par les photos données ({ identifiant: image }). */
export const remplacer = (photos) => operation('readwrite', (rayon) => {
  rayon.clear();
  for (const [id, image] of Object.entries(photos)) rayon.put(image, id);
});

/** Réduit une photo prise au téléphone : 1400 points au plus sur le grand côté, en JPEG. */
export async function reduire(fichier, cote = 1400) {
  const image = await createImageBitmap(fichier, { imageOrientation: 'from-image' });
  const rapport = Math.min(1, cote / Math.max(image.width, image.height));
  const toile = document.createElement('canvas');
  toile.width = Math.round(image.width * rapport);
  toile.height = Math.round(image.height * rapport);
  toile.getContext('2d').drawImage(image, 0, 0, toile.width, toile.height);
  image.close?.();
  return toile.toDataURL('image/jpeg', 0.82);
}
