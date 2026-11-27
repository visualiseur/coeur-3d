// Contenu du volet Alimentation, séparé du code (2_Projet-outil/06, §5).
// Chaque repère porte sa source. Rien ici n'est une consigne personnelle : ce sont les repères
// publiés pour les adultes en général. La fiche du patient passe toujours avant.
//
// Rédaction propre à l'application. Les quantités et fréquences viennent de la source citée,
// lue en entier le 25 novembre 2026 ; rien n'a été ajouté de mémoire.

export const RELU_LE = '2026-11-25';

export const SOURCES = {
  hcsp: {
    titre: 'Haut Conseil de la santé publique, avis relatif à la révision des repères alimentaires pour les adultes',
    date: '16 février 2017',
    adresse: 'https://www.hcsp.fr/Explore.cgi/Telecharger?NomFichier=hcspa20170216_reperesalimentairesactua2017.pdf',
  },
  ciqual: {
    titre: 'Anses, table de composition nutritionnelle des aliments Ciqual 2025 (teneurs en sel des aliments)',
    date: 'novembre 2025',
    adresse: 'https://doi.org/10.57745/RDMHWY',
  },
  inco: {
    titre: 'Règlement (UE) n° 1169/2011 sur l’information des consommateurs, annexe I : sel = sodium × 2,5',
    date: '25 octobre 2011',
    adresse: 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32011R1169',
  },
};

/** Les champs de la fiche qui parlent d'alimentation : affichés en premier, tels qu'écrits. */
export const CHAMPS_DE_LA_FICHE = ['sel_limite', 'boissons_limite', 'alcool', 'suivi_dietetique'];

export const GROUPES = [
  {
    id: 'augmenter', titre: 'À augmenter', couleur: 'vert', icone: 'plus',
    reperes: [
      { titre: 'Fruits et légumes', repere: 'Au moins 5 par jour', detail: 'Frais, surgelés ou en conserve : tout compte. Une portion fait 80 à 100 g. Pas plus d’un verre de jus de fruit par jour.' },
      { titre: 'Fruits à coque sans sel ajouté', repere: 'Une petite poignée par jour', detail: 'Amandes, noix, noisettes, pistaches. Pas pour les personnes qui y sont allergiques.' },
      { titre: 'Légumes secs', repere: 'Au moins 2 fois par semaine', detail: 'Lentilles, pois chiches, haricots. Ils peuvent remplacer la viande ou la volaille.' },
      { titre: 'Pain, pâtes, riz et céréales', repere: 'Tous les jours', detail: 'De préférence complets ou peu raffinés.' },
    ],
  },
  {
    id: 'preferer', titre: 'À choisir de préférence', couleur: 'primaire', icone: 'coche',
    reperes: [
      { titre: 'Poisson et fruits de mer', repere: '2 fois par semaine, dont un poisson gras', detail: 'Varier les espèces et les lieux d’achat.' },
      { titre: 'Huiles de colza, de noix et d’olive', repere: 'À préférer aux autres huiles', detail: 'Sans augmenter la quantité habituelle de matières grasses. Les huiles de tournesol et d’arachide sont pauvres en oméga-3.' },
      { titre: 'Volaille', repere: 'À préférer à la viande rouge', detail: '' },
      { titre: 'Produits laitiers', repere: '2 par jour', detail: 'Une portion : 150 mL de lait, 125 g de yaourt ou 30 g de fromage. Préférer les fromages les moins gras.' },
      { titre: 'Eau', repere: 'La seule boisson recommandée', detail: 'Thé, café et infusions non sucrés comptent aussi. Pour la quantité à boire, c’est votre fiche qui fait foi.' },
    ],
  },
  {
    id: 'limiter', titre: 'À limiter', couleur: 'ambre', icone: 'horloge',
    reperes: [
      { titre: 'Sel', repere: 'À réduire', detail: 'Goûter avant de saler. Limiter le sel ajouté en cuisine et à table. Le sel se cumule sur la journée : le pain compte aussi.' },
      { titre: 'Charcuterie', repere: 'Pas plus de 150 g par semaine', detail: 'De préférence du jambon blanc.' },
      { titre: 'Viande rouge', repere: 'Pas plus de 500 g par semaine', detail: 'Bœuf, porc, veau, mouton…' },
      { titre: 'Beurre et graisses animales', repere: 'En petite quantité', detail: 'Plutôt crus ou en tartine que cuits.' },
      { titre: 'Produits sucrés', repere: 'À limiter', detail: 'Surtout ceux qui sont sucrés et gras à la fois : pâtisseries, chocolat, desserts lactés, glaces.' },
      { titre: 'Boissons sucrées', repere: 'Exceptionnelles, un verre par jour au plus', detail: 'Les boissons « light » entretiennent le goût du sucre.' },
      { titre: 'Grignotage', repere: 'À éviter entre les repas', detail: 'Surtout les produits gras, salés et sucrés.' },
    ],
    note: 'Limiter n’est pas interdire : ces aliments gardent leur place, moins souvent et en plus petite quantité.',
  },
];

/** Idées de cuisine pour saler moins. Ce sont des usages culinaires, pas des conseils médicaux. */
export const POUR_LE_GOUT = [
  'Ail, oignon, échalote', 'Persil, ciboulette, basilic', 'Thym, laurier, romarin', 'Estragon, cerfeuil, aneth',
  'Poivre, paprika, cumin', 'Curry, curcuma, gingembre', 'Vinaigre', 'Jus de citron', 'Cannelle, vanille (sucré)',
];
