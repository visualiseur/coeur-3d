// La fiche de sortie est le schéma de données (2_Projet-outil/03).
// Un champ absent d'ici n'existe pas dans l'application. Aucune valeur par défaut, aucun calcul.
//
// Chaque champ : id, libellé, et éventuellement
//   unite  — affichée après la valeur
//   long   — texte de plusieurs lignes
//   aide   — précision affichée sous le champ à la saisie
//   simple — renseignement pratique (un contact) : pas d'auteur ni de date de réévaluation

export const THEMES = [
  {
    // Une valeur recopiée du compte rendu, jamais interprétée (2_Projet-outil/04, § 4). Ajouté en version 14.
    id: 'coeur', titre: 'Mon cœur', icone: 'coeur', couleur: 'primaire',
    champs: [
      { id: 'fevg', libelle: 'Fraction d’éjection (FEVG)', unite: '%', aide: 'La valeur écrite sur le compte rendu, sans l’arrondir.' },
      { id: 'fevg_examen', libelle: 'Mesurée par quel examen, et quand', aide: 'Exemple : échographie du 2 novembre 2026.' },
      // Pas d'unité imposée : les médecins écrivent « 120/70 » (mmHg) aussi bien que « 12/7 » (cmHg).
      { id: 'tension_moyenne', libelle: 'Tension moyenne', aide: 'Comme le médecin l’a écrite, avec l’unité. Exemple : 120/70 mmHg.' },
      { id: 'tension_basse', libelle: 'Tension, limite basse', aide: 'Comme le médecin l’a écrite, avec l’unité.' },
      { id: 'tension_haute', libelle: 'Tension, limite haute', aide: 'Comme le médecin l’a écrite, avec l’unité.' },
    ],
  },
  {
    id: 'activite', titre: 'Activité physique', icone: 'activite', couleur: 'vert',
    champs: [
      { id: 'fc_repos', libelle: 'Fréquence cardiaque de repos', unite: 'bpm' },
      { id: 'fc_cible_min', libelle: 'Fréquence cible, minimum', unite: 'bpm' },
      { id: 'fc_cible_max', libelle: 'Fréquence cible, maximum', unite: 'bpm' },
      { id: 'fc_ne_pas_depasser', libelle: 'Fréquence à ne pas dépasser', unite: 'bpm' },
      { id: 'ressenti_effort', libelle: 'Ressenti d’effort visé', aide: 'Avec le nom de l’échelle utilisée par le service.' },
      { id: 'duree_seance', libelle: 'Durée d’une séance', unite: 'min' },
      { id: 'frequence_semaine', libelle: 'Séances par semaine' },
      { id: 'activites_autorisees', libelle: 'Activités autorisées', long: true },
      { id: 'activites_deconseillees', libelle: 'Activités déconseillées', long: true },
      { id: 'port_charges', libelle: 'Port de charges, maximum', unite: 'kg' },
      { id: 'conduite', libelle: 'Conduite automobile' },
    ],
  },
  {
    id: 'alimentation', titre: 'Alimentation et poids', icone: 'alimentation', couleur: 'ambre',
    champs: [
      { id: 'sel_limite', libelle: 'Limite de sel par jour', unite: 'g', aide: 'En grammes de sel (pas de sodium), comme le médecin l’a écrit. Exemple : 6.' },
      { id: 'boissons_limite', libelle: 'Limite de boissons par jour', unite: 'L', aide: 'En litres, comme le médecin l’a écrit (thé, café et soupe). Exemple : 1,5. Sert à remplir la bouteille du jour.' },
      { id: 'alcool', libelle: 'Alcool' },
      { id: 'poids_reference', libelle: 'Poids de référence', unite: 'kg' },
      { id: 'automesure_poids', libelle: 'Pesée' },
      { id: 'consigne_poids', libelle: 'Consigne de surveillance du poids', long: true, aide: 'La phrase du médecin, mot pour mot.' },
      { id: 'suivi_dietetique', libelle: 'Suivi diététique' },
    ],
  },
  {
    id: 'voyages', titre: 'Voyages', icone: 'voyages', couleur: 'bleu',
    champs: [
      { id: 'avion', libelle: 'Avion' },
      { id: 'voyage_precautions', libelle: 'Précautions', long: true },
      { id: 'voyage_a_emporter', libelle: 'À emporter', long: true },
    ],
  },
  {
    id: 'vie', titre: 'Vie quotidienne', icone: 'maison', couleur: 'vert',
    champs: [
      { id: 'reprise_travail', libelle: 'Reprise du travail', long: true },
      { id: 'vie_intime', libelle: 'Vie intime', long: true },
      { id: 'bain_chaud', libelle: 'Bain chaud, sauna, hammam' },
    ],
  },
  {
    id: 'contacts', titre: 'Mes contacts', icone: 'telephone', couleur: 'ambre',
    champs: [
      { id: 'numero_service', libelle: 'Numéro du service', simple: true },
      { id: 'cardiologue', libelle: 'Cardiologue', simple: true },
      { id: 'medecin_traitant', libelle: 'Médecin traitant', simple: true },
      { id: 'assistante_sociale', libelle: 'Assistante sociale référente', simple: true },
      { id: 'phase_3', libelle: 'Club ou association (phase 3)', simple: true },
    ],
  },
];

// Version 19 : « En cas d'oubli d'une prise » quitte le thème Traitements (supprimé) pour la partie Médicaments
// de la fiche (Remplir ma fiche, page soignant, écran Médicaments). Même identifiant : rien n'est perdu.
export const CHAMP_OUBLI = { id: 'en_cas_d_oubli', libelle: 'En cas d’oubli d’une prise', long: true, aide: 'La phrase du médecin ou du pharmacien, mot pour mot.' };

// Version 19 : champs retirés de la fiche (dispositif implanté et tabac : à repenser à part).
// Ils ne s'affichent plus et ne s'écrivent plus, mais restent connus : ce qui était déjà écrit reste dans le carnet,
// une ancienne sauvegarde s'ouvre, et un ancien code soignant qui en contient est lu sans eux.
export const CHAMPS_RETIRES = [
  { id: 'sel', libelle: 'Sel : précisions' },
  { id: 'boissons', libelle: 'Boissons : ce qui compte, précisions' },
  { id: 'interactions_a_eviter', libelle: 'Aliments ou produits à éviter' },
  { id: 'automesure_tension', libelle: 'Automesure de la tension' },
  { id: 'dispositif_modele', libelle: 'Dispositif : modèle' },
  { id: 'dispositif_date_pose', libelle: 'Dispositif : date de pose' },
  { id: 'dispositif_centre', libelle: 'Dispositif : centre de suivi' },
  { id: 'dispositif_telesurveillance', libelle: 'Dispositif : télésurveillance' },
  { id: 'un_choc_sans_malaise', libelle: 'Un choc, sans malaise : que faire' },
  { id: 'chocs_repetes', libelle: 'Plusieurs chocs : que faire' },
  { id: 'dispositif_a_eviter', libelle: 'Dispositif : à éviter' },
  { id: 'tabac_accompagnement', libelle: 'Tabac : accompagnement prévu' },
];

export const CHAMPS = new Map([
  ...THEMES.flatMap((t) => t.champs.map((c) => [c.id, { ...c, theme: t.id }])),
  [CHAMP_OUBLI.id, { ...CHAMP_OUBLI, theme: 'medicaments' }],
  ...CHAMPS_RETIRES.map((c) => [c.id, { ...c, theme: null, retire: true }]),
]);

export const MOMENTS = [
  { id: 'matin', libelle: 'Matin' },
  { id: 'midi', libelle: 'Midi' },
  { id: 'soir', libelle: 'Soir' },
];
