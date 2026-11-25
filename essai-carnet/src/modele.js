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
      { id: 'sel', libelle: 'Sel', aide: 'Préciser s’il s’agit de sel ou de sodium : ce n’est pas la même quantité.' },
      { id: 'boissons_limite', libelle: 'Limite de boissons par jour', unite: 'L', aide: 'En litres, comme le médecin l’a écrit. Exemple : 1,5. Sert à remplir la bouteille du jour.' },
      { id: 'boissons', libelle: 'Boissons : ce qui compte, précisions', long: true, aide: 'La phrase du médecin : ce qui compte comme boisson (soupe, café, yaourt…), cas particuliers.' },
      { id: 'alcool', libelle: 'Alcool' },
      { id: 'interactions_a_eviter', libelle: 'Aliments ou produits à éviter', long: true },
      { id: 'poids_reference', libelle: 'Poids de référence', unite: 'kg' },
      { id: 'consigne_poids', libelle: 'Consigne de surveillance du poids', long: true, aide: 'La phrase du médecin, mot pour mot.' },
      { id: 'suivi_dietetique', libelle: 'Suivi diététique' },
    ],
  },
  {
    id: 'traitements', titre: 'Traitements', icone: 'medicaments', couleur: 'bleu',
    champs: [
      { id: 'en_cas_d_oubli', libelle: 'En cas d’oubli d’une prise', long: true, aide: 'La phrase du médecin ou du pharmacien, mot pour mot.' },
      { id: 'automesure_tension', libelle: 'Automesure de la tension', long: true },
      { id: 'automesure_poids', libelle: 'Pesée' },
    ],
  },
  {
    id: 'dispositif', titre: 'Dispositif implanté', icone: 'dispositif', couleur: 'corail',
    champs: [
      { id: 'dispositif_modele', libelle: 'Modèle' },
      { id: 'dispositif_date_pose', libelle: 'Date de pose' },
      { id: 'dispositif_centre', libelle: 'Centre de suivi' },
      { id: 'dispositif_telesurveillance', libelle: 'Télésurveillance' },
      { id: 'un_choc_sans_malaise', libelle: 'Un choc, sans malaise : que faire', long: true, aide: 'La phrase du service, mot pour mot.' },
      { id: 'chocs_repetes', libelle: 'Plusieurs chocs : que faire', long: true, aide: 'La phrase du service, mot pour mot.' },
      { id: 'dispositif_a_eviter', libelle: 'À éviter', long: true },
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
      { id: 'tabac_accompagnement', libelle: 'Tabac : accompagnement prévu', long: true },
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

export const CHAMPS = new Map(THEMES.flatMap((t) => t.champs.map((c) => [c.id, { ...c, theme: t.id }])));

export const MOMENTS = [
  { id: 'matin', libelle: 'Matin' },
  { id: 'midi', libelle: 'Midi' },
  { id: 'soir', libelle: 'Soir' },
];
