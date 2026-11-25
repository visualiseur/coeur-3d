// FICHIER FABRIQUÉ par scripts/ciqual-sel.py : ne pas le modifier à la main.
// Teneur en sel (g pour 100 g) lue dans la table Ciqual de l’Anses, licence Etalab 2.0.
// « nom » est le nom court du carnet, « nomCiqual » le nom exact de la table.

export const VERSION_CIQUAL = "Ciqual 2025 (fichier du 3 novembre 2025)";

export const FAMILLES_SEL = [
  {
    "id": "charcuterie",
    "titre": "Charcuterie",
    "aliments": [
      {
        "code": 28812,
        "nom": "Jambon sec",
        "nomCiqual": "Jambon sec",
        "sel": 5.7
      },
      {
        "code": 30300,
        "nom": "Saucisson sec",
        "nomCiqual": "Saucisson sec",
        "sel": 4.75
      },
      {
        "code": 28727,
        "nom": "Bacon",
        "nomCiqual": "Filet de bacon",
        "sel": 3.18
      },
      {
        "code": 28725,
        "nom": "Lardons fumés, cuits",
        "nomCiqual": "Lardon fumé, cuit",
        "sel": 2.59
      },
      {
        "code": 30005,
        "nom": "Chipolata, cuite",
        "nomCiqual": "Chipolata cuite",
        "sel": 2.15
      },
      {
        "code": 30150,
        "nom": "Merguez",
        "nomCiqual": "Merguez crue",
        "sel": 2.01
      },
      {
        "code": 30742,
        "nom": "Saucisse de Strasbourg (knack)",
        "nomCiqual": "Saucisse de Strasbourg ou knack, à cuire",
        "sel": 1.99
      },
      {
        "code": 28900,
        "nom": "Jambon blanc",
        "nomCiqual": "Jambon cuit, supérieur",
        "sel": 1.87
      },
      {
        "code": 28963,
        "nom": "Blanc de poulet en tranches",
        "nomCiqual": "Jambon de poulet ou blanc de poulet en tranche",
        "sel": 1.86
      },
      {
        "code": 8211,
        "nom": "Pâté de campagne",
        "nomCiqual": "Pâté ou terrine de campagne",
        "sel": 1.54
      },
      {
        "code": 8001,
        "nom": "Rillettes",
        "nomCiqual": "Rillettes pur porc",
        "sel": 0.97
      }
    ]
  },
  {
    "id": "fromages",
    "titre": "Fromages et laitages",
    "aliments": [
      {
        "code": 12500,
        "nom": "Roquefort",
        "nomCiqual": "Roquefort (fromage de brebis)",
        "sel": 3.22
      },
      {
        "code": 12300,
        "nom": "Fromage fondu en tranchettes",
        "nomCiqual": "Fromage fondu en tranchettes",
        "sel": 2.46
      },
      {
        "code": 12066,
        "nom": "Feta",
        "nomCiqual": "Feta, au lait de brebis 70% minimum et lait de chèvre 30% maximum",
        "sel": 2.27
      },
      {
        "code": 16402,
        "nom": "Beurre demi-sel",
        "nomCiqual": "Beurre à 80% MG, demi-sel",
        "sel": 1.9
      },
      {
        "code": 12749,
        "nom": "Fromage à raclette",
        "nomCiqual": "Raclette (fromage)",
        "sel": 1.69
      },
      {
        "code": 12812,
        "nom": "Chèvre en bûche",
        "nomCiqual": "Fromage de chèvre bûche",
        "sel": 1.58
      },
      {
        "code": 12120,
        "nom": "Parmesan",
        "nomCiqual": "Parmesan",
        "sel": 1.57
      },
      {
        "code": 12001,
        "nom": "Camembert",
        "nomCiqual": "Camembert, sans précision sur le type de lait (pasteurisé ou cru)",
        "sel": 1.45
      },
      {
        "code": 12110,
        "nom": "Comté",
        "nomCiqual": "Comté",
        "sel": 0.84
      },
      {
        "code": 12115,
        "nom": "Emmental",
        "nomCiqual": "Emmental ou emmenthal",
        "sel": 0.61
      },
      {
        "code": 19590,
        "nom": "Mozzarella",
        "nomCiqual": "Mozzarella au lait de vache",
        "sel": 0.6
      },
      {
        "code": 19593,
        "nom": "Yaourt nature",
        "nomCiqual": "Yaourt ou lait fermenté, nature",
        "sel": 0.1
      },
      {
        "code": 19501,
        "nom": "Fromage blanc",
        "nomCiqual": "Fromage blanc, nature ou aux fruits (aliment moyen)",
        "sel": 0.09
      },
      {
        "code": 19041,
        "nom": "Lait demi-écrémé",
        "nomCiqual": "Lait demi-écrémé, UHT",
        "sel": 0.088
      },
      {
        "code": 16400,
        "nom": "Beurre doux",
        "nomCiqual": "Beurre à 80% MG minimum, doux",
        "sel": 0.035
      }
    ]
  },
  {
    "id": "pains",
    "titre": "Pain et féculents",
    "aliments": [
      {
        "code": 7300,
        "nom": "Biscotte",
        "nomCiqual": "Biscotte classique",
        "sel": 1.36
      },
      {
        "code": 7001,
        "nom": "Pain blanc, baguette",
        "nomCiqual": "Pain blanc (par ex. : baguette, boule…)",
        "sel": 1.25
      },
      {
        "code": 7603,
        "nom": "Croissant",
        "nomCiqual": "Croissant, sans précision (aliment moyen)",
        "sel": 1.19
      },
      {
        "code": 7110,
        "nom": "Pain complet",
        "nomCiqual": "Pain complet ou intégral (à la farine T150)",
        "sel": 1.17
      },
      {
        "code": 7200,
        "nom": "Pain de mie",
        "nomCiqual": "Pain de mie blanc, préemballé",
        "sel": 1.07
      },
      {
        "code": 4003,
        "nom": "Pommes de terre à l’eau",
        "nomCiqual": "Pomme de terre, bouillie/cuite à l'eau",
        "sel": 0.051
      },
      {
        "code": 9811,
        "nom": "Pâtes cuites, sans sel ajouté",
        "nomCiqual": "Pâtes sèches, standard, cuites, sans sel ajouté",
        "sel": 0.048
      },
      {
        "code": 9104,
        "nom": "Riz cuit, sans sel ajouté",
        "nomCiqual": "Riz blanc, cuit, sans sel ajouté",
        "sel": 0.045
      },
      {
        "code": 20360,
        "nom": "Lentilles cuites",
        "nomCiqual": "Lentille, bouillie/cuite à l'eau (aliment moyen)",
        "sel": 0.015
      },
      {
        "code": 7160,
        "nom": "Pain sans sel",
        "nomCiqual": "Pain blanc, sans sel ajouté",
        "sel": 0.013
      },
      {
        "code": 7310,
        "nom": "Biscotte sans sel ajouté",
        "nomCiqual": "Biscotte, sans sel ajouté",
        "sel": 0.0075
      }
    ]
  },
  {
    "id": "mer",
    "titre": "Poissons et fruits de mer",
    "aliments": [
      {
        "code": 26177,
        "nom": "Anchois salés à l’huile",
        "nomCiqual": "Anchois, filets, salés, à l'huile, semi-conserve, égouttés",
        "sel": 14.4
      },
      {
        "code": 26037,
        "nom": "Saumon fumé",
        "nomCiqual": "Saumon fumé",
        "sel": 2.86
      },
      {
        "code": 26046,
        "nom": "Surimi",
        "nomCiqual": "Surimi, bâtonnets, tranche ou râpé saveur crabe",
        "sel": 1.77
      },
      {
        "code": 10007,
        "nom": "Crevettes cuites",
        "nomCiqual": "Crevette, cuite",
        "sel": 1.61
      },
      {
        "code": 10011,
        "nom": "Huîtres",
        "nomCiqual": "Huître, sans précision, crue",
        "sel": 1.45
      },
      {
        "code": 26034,
        "nom": "Sardines à l’huile, en boîte",
        "nomCiqual": "Sardine, à l'huile, appertisée, égouttée",
        "sel": 0.88
      },
      {
        "code": 10013,
        "nom": "Moules cuites",
        "nomCiqual": "Moule, bouillie/cuite à l'eau",
        "sel": 0.8
      },
      {
        "code": 26039,
        "nom": "Thon au naturel, en boîte",
        "nomCiqual": "Thon, au naturel, appertisé, égoutté",
        "sel": 0.74
      },
      {
        "code": 25997,
        "nom": "Cabillaud cuit",
        "nomCiqual": "Cabillaud, cuit, sans précision (aliment moyen)",
        "sel": 0.2
      }
    ]
  },
  {
    "id": "viandes",
    "titre": "Viandes et œufs",
    "aliments": [
      {
        "code": 22010,
        "nom": "Œuf dur",
        "nomCiqual": "Oeuf dur",
        "sel": 0.31
      },
      {
        "code": 6253,
        "nom": "Steak haché cuit",
        "nomCiqual": "Boeuf, steak haché 10% MG cuit",
        "sel": 0.17
      },
      {
        "code": 36018,
        "nom": "Filet de poulet cuit",
        "nomCiqual": "Poulet, filet sans peau grillé/poêlé",
        "sel": 0.14
      }
    ]
  },
  {
    "id": "condiments",
    "titre": "Condiments et sauces",
    "aliments": [
      {
        "code": 11058,
        "nom": "Sel de table",
        "nomCiqual": "Sel blanc alimentaire, iodé, non fluoré (marin, ignigène ou gemme)",
        "sel": 97.8
      },
      {
        "code": 11174,
        "nom": "Bouillon de volaille en cube ou en poudre",
        "nomCiqual": "Bouillon de volaille, déshydraté",
        "sel": 56.4
      },
      {
        "code": 11194,
        "nom": "Nuoc-mâm",
        "nomCiqual": "Sauce nuoc mâm ou sauce au poisson, préemballée",
        "sel": 22.2
      },
      {
        "code": 11104,
        "nom": "Sauce soja",
        "nomCiqual": "Sauce soja, préemballée",
        "sel": 13.1
      },
      {
        "code": 11013,
        "nom": "Moutarde",
        "nomCiqual": "Moutarde",
        "sel": 6.3
      },
      {
        "code": 11040,
        "nom": "Câpres",
        "nomCiqual": "Câpres, au vinaigre",
        "sel": 4.06
      },
      {
        "code": 13033,
        "nom": "Olives vertes",
        "nomCiqual": "Olive verte, en saumure, égouttée",
        "sel": 2.94
      },
      {
        "code": 11008,
        "nom": "Ketchup",
        "nomCiqual": "Ketchup, préemballé",
        "sel": 2.35
      },
      {
        "code": 11110,
        "nom": "Vinaigrette du commerce",
        "nomCiqual": "Sauce vinaigrette (50 à 75% d'huile), préemballée",
        "sel": 2.2
      },
      {
        "code": 13032,
        "nom": "Olives noires",
        "nomCiqual": "Olive noire, en saumure, égouttée",
        "sel": 1.77
      },
      {
        "code": 11004,
        "nom": "Cornichons",
        "nomCiqual": "Cornichon, au vinaigre",
        "sel": 1.72
      },
      {
        "code": 11054,
        "nom": "Mayonnaise",
        "nomCiqual": "Mayonnaise (70% MG min.), préemballée",
        "sel": 1.4
      }
    ]
  },
  {
    "id": "aperitif",
    "titre": "Apéritif",
    "aliments": [
      {
        "code": 38107,
        "nom": "Mini bretzels, sticks",
        "nomCiqual": "Biscuit ou cracker apéritif, mini bretzel ou sticks",
        "sel": 4.43
      },
      {
        "code": 38402,
        "nom": "Biscuits apéritif, crackers",
        "nomCiqual": "Biscuit ou cracker apéritif, à base de blé, nature ou aromatisé",
        "sel": 2.32
      },
      {
        "code": 15009,
        "nom": "Pistaches salées",
        "nomCiqual": "Pistache, grillée, salée",
        "sel": 1.67
      },
      {
        "code": 4004,
        "nom": "Chips",
        "nomCiqual": "Chips de pommes de terre nature ou aromatisées",
        "sel": 1.35
      },
      {
        "code": 15002,
        "nom": "Cacahuètes salées",
        "nomCiqual": "Cacahuète, grillée, salée",
        "sel": 1.26
      }
    ]
  },
  {
    "id": "plats",
    "titre": "Plats préparés et conserves",
    "aliments": [
      {
        "code": 25517,
        "nom": "Sandwich jambon beurre",
        "nomCiqual": "Sandwich baguette, jambon beurre, fait maison",
        "sel": 1.78
      },
      {
        "code": 25435,
        "nom": "Pizza jambon fromage",
        "nomCiqual": "Pizza jambon fromage, préemballée",
        "sel": 1.33
      },
      {
        "code": 25413,
        "nom": "Hamburger",
        "nomCiqual": "Hamburger, de restauration rapide",
        "sel": 1.23
      },
      {
        "code": 25405,
        "nom": "Quiche lorraine",
        "nomCiqual": "Quiche lorraine, préemballée",
        "sel": 1.01
      },
      {
        "code": 25081,
        "nom": "Lasagnes à la bolognaise",
        "nomCiqual": "Lasagnes ou canellonis à la viande (bolognaise), préemballés",
        "sel": 0.97
      },
      {
        "code": 25002,
        "nom": "Cassoulet en boîte",
        "nomCiqual": "Cassoulet, appertisé",
        "sel": 0.97
      },
      {
        "code": 25019,
        "nom": "Raviolis en boîte",
        "nomCiqual": "Ravioli au boeuf, sauce tomate, appertisé",
        "sel": 0.96
      },
      {
        "code": 20062,
        "nom": "Haricots verts en boîte",
        "nomCiqual": "Haricot vert, appertisé, égoutté",
        "sel": 0.65
      },
      {
        "code": 20036,
        "nom": "Petits pois en boîte",
        "nomCiqual": "Petits pois, appertisés, égouttés",
        "sel": 0.65
      },
      {
        "code": 25903,
        "nom": "Soupe de légumes en brique",
        "nomCiqual": "Soupe aux légumes variés, préemballée à réchauffer",
        "sel": 0.63
      },
      {
        "code": 20066,
        "nom": "Maïs en boîte",
        "nomCiqual": "Maïs doux, appertisé, égoutté",
        "sel": 0.59
      }
    ]
  },
  {
    "id": "frais",
    "titre": "Fruits et légumes frais",
    "aliments": [
      {
        "code": 20307,
        "nom": "Carottes vapeur",
        "nomCiqual": "Carotte, cuite à la vapeur",
        "sel": 0.11
      },
      {
        "code": 13039,
        "nom": "Pomme",
        "nomCiqual": "Pomme, chair et peau, crue",
        "sel": 0.0037
      }
    ]
  }
];
