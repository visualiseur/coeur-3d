// FICHIER FABRIQUÉ par scripts/ciqual-eaux.py : ne pas le modifier à la main.
// Sodium des eaux lu dans la table Ciqual de l’Anses (licence Etalab 2.0), en mg par litre.
// selGL = sodium × 2,5, en g par litre (règle de l’étiquetage). La colonne « sel » de Ciqual
// n’est PAS utilisée : pour les eaux, elle vient du chlorure (voir le script).
// Lignes écartées faute de sodium chiffré : 76017 Eau minérale Dax, embouteillée, plate, moyennement minéralisée (Dax, 40) (sodium : « - »); 76033 Eau minérale Propiac, embouteillée, plate, riche en sels minéraux (Propiac, 26) (sodium : « - »); 76052 Eau minérale Vals-Vivaraise, embouteillée, gazeuse, moyennement minéralisée (Vals, 07) (sodium : « - »).

export const VERSION_CIQUAL_EAUX = "Ciqual 2025 (fichier du 3 novembre 2025)";

export const EAUX = [
  {
    "code": 18046,
    "nom": "Eau minérale gazeuse (moyenne)",
    "nomCiqual": "Eau minérale, embouteilée, gazeuse (aliment moyen)",
    "courante": true,
    "origine": "",
    "sodiumMgL": 142.0,
    "selGL": 0.355
  },
  {
    "code": 18044,
    "nom": "Eau minérale (moyenne)",
    "nomCiqual": "Eau minérale (aliment moyen)",
    "courante": true,
    "origine": "",
    "sodiumMgL": 52.8,
    "selGL": 0.132
  },
  {
    "code": 18066,
    "nom": "Eau du robinet (moyenne)",
    "nomCiqual": "Eau du robinet",
    "courante": true,
    "origine": "",
    "sodiumMgL": 24.0,
    "selGL": 0.06
  },
  {
    "code": 18430,
    "nom": "Eau de source, plate ou gazeuse (moyenne)",
    "nomCiqual": "Eau de source gazeuse ou plate",
    "courante": true,
    "origine": "",
    "sodiumMgL": 21.7,
    "selGL": 0.054
  },
  {
    "code": 18045,
    "nom": "Eau minérale plate (moyenne)",
    "nomCiqual": "Eau minérale, embouteilée, plate (aliment moyen)",
    "courante": true,
    "origine": "",
    "sodiumMgL": 9.7,
    "selGL": 0.024
  },
  {
    "code": 18009,
    "nom": "Eau minérale faiblement minéralisée (moyenne)",
    "nomCiqual": "Eau minérale, embouteillée, faiblement minéralisée (aliment moyen)",
    "courante": true,
    "origine": "",
    "sodiumMgL": 9.1,
    "selGL": 0.023
  },
  {
    "code": 76023,
    "nom": "Hydroxydase, gazeuse",
    "nomCiqual": "Eau minérale Hydroxydase, embouteillée, gazeuse, riche en sels minéraux (Le Breuil sur Couze, 63)",
    "courante": false,
    "origine": "Le Breuil sur Couze, 63",
    "sodiumMgL": 1840.0,
    "selGL": 4.6
  },
  {
    "code": 76049,
    "nom": "St-Yorre, gazeuse",
    "nomCiqual": "Eau minérale St-Yorre, embouteillée, gazeuse, riche en sels minéraux (Saint-Yorre, 03)",
    "courante": false,
    "origine": "Saint-Yorre, 03",
    "sodiumMgL": 1710.0,
    "selGL": 4.275
  },
  {
    "code": 76055,
    "nom": "Vichy Célestins, gazeuse",
    "nomCiqual": "Eau minérale Vichy Célestins, embouteillée, gazeuse, riche en sels minéraux (Saint-Yorre, 03)",
    "courante": false,
    "origine": "Saint-Yorre, 03",
    "sodiumMgL": 1170.0,
    "selGL": 2.925
  },
  {
    "code": 76031,
    "nom": "Parot, gazeuse",
    "nomCiqual": "Eau minérale Parot, embouteillée, gazeuse, moyennement minéralisée (St-Romain-le-Puy, 42)",
    "courante": false,
    "origine": "St-Romain-le-Puy, 42",
    "sodiumMgL": 1010.0,
    "selGL": 2.525
  },
  {
    "code": 76013,
    "nom": "Chateauneuf, gazeuse",
    "nomCiqual": "Eau minérale Chateauneuf, embouteillée, gazeuse, riche en sels minéraux (Chateauneuf, 63)",
    "courante": false,
    "origine": "Chateauneuf, 63",
    "sodiumMgL": 703.0,
    "selGL": 1.758
  },
  {
    "code": 76085,
    "nom": "La Française, plate",
    "nomCiqual": "Eau minérale La Française, embouteillée, plate, riche en sels minéraux (Propiac, 26)",
    "courante": false,
    "origine": "Propiac, 26",
    "sodiumMgL": 680.0,
    "selGL": 1.7
  },
  {
    "code": 76007,
    "nom": "Ardesy, gazeuse",
    "nomCiqual": "Eau minérale Ardesy, embouteillée, gazeuse, riche en sels minéraux (Ardes, 63)",
    "courante": false,
    "origine": "Ardes, 63",
    "sodiumMgL": 650.0,
    "selGL": 1.625
  },
  {
    "code": 76037,
    "nom": "Rozana, gazeuse",
    "nomCiqual": "Eau minérale Rozana, embouteillée, gazeuse, riche en sels minéraux (Beauregard, 63)",
    "courante": false,
    "origine": "Beauregard, 63",
    "sodiumMgL": 493.0,
    "selGL": 1.232
  },
  {
    "code": 76034,
    "nom": "Puits St-Georges, gazeuse",
    "nomCiqual": "Eau minérale Puits St-Georges, embouteillée, gazeuse, moyennement minéralisée (St-Romain-le-Puy, 42)",
    "courante": false,
    "origine": "St-Romain-le-Puy, 42",
    "sodiumMgL": 430.0,
    "selGL": 1.075
  },
  {
    "code": 76096,
    "nom": "Vals, gazeuse",
    "nomCiqual": "Eau minérale Vals, embouteillée, gazeuse, moyennement minéralisée (Vals-les-Bains, 07)",
    "courante": false,
    "origine": "Vals-les-Bains, 07",
    "sodiumMgL": 381.0,
    "selGL": 0.953
  },
  {
    "code": 76079,
    "nom": "Appollinaris, plate",
    "nomCiqual": "Eau minérale Appollinaris, embouteillée, plate, riche en sels minéraux (Allemagne)",
    "courante": false,
    "origine": "Allemagne",
    "sodiumMgL": 380.0,
    "selGL": 0.95
  },
  {
    "code": 76066,
    "nom": "Christinen Brunnen, plate",
    "nomCiqual": "Eau minérale Christinen Brunnen, embouteillée, plate, moyennement minéralisée (Allemagne)",
    "courante": false,
    "origine": "Allemagne",
    "sodiumMgL": 370.0,
    "selGL": 0.925
  },
  {
    "code": 76047,
    "nom": "Ste-Marguerite, gazeuse",
    "nomCiqual": "Eau minérale Ste-Marguerite, embouteillée, gazeuse, moyennement minéralisée (St-Maurice, 63)",
    "courante": false,
    "origine": "St-Maurice, 63",
    "sodiumMgL": 302.0,
    "selGL": 0.755
  },
  {
    "code": 76093,
    "nom": "St-Géron, gazeuse",
    "nomCiqual": "Eau minérale St-Géron, embouteillée, gazeuse, moyennement minéralisée (St-Géron, 43)",
    "courante": false,
    "origine": "St-Géron, 43",
    "sodiumMgL": 256.0,
    "selGL": 0.64
  },
  {
    "code": 76006,
    "nom": "Arcens, gazeuse",
    "nomCiqual": "Eau minérale Arcens, embouteillée, gazeuse, moyennement minéralisée (Arcens, 07)",
    "courante": false,
    "origine": "Arcens, 07",
    "sodiumMgL": 252.0,
    "selGL": 0.63
  },
  {
    "code": 76092,
    "nom": "St-Alban, gazeuse",
    "nomCiqual": "Eau minérale St-Alban, embouteillée, gazeuse, moyennement minéralisée (St-Alban, 42)",
    "courante": false,
    "origine": "St-Alban, 42",
    "sodiumMgL": 250.0,
    "selGL": 0.625
  },
  {
    "code": 76036,
    "nom": "Reine des basaltes, gazeuse",
    "nomCiqual": "Eau minérale Reine des basaltes, embouteillée, gazeuse, moyennement minéralisée (Asperjoc, 07)",
    "courante": false,
    "origine": "Asperjoc, 07",
    "sodiumMgL": 246.0,
    "selGL": 0.615
  },
  {
    "code": 76014,
    "nom": "Chateldon, gazeuse",
    "nomCiqual": "Eau minérale Chateldon, embouteillée, gazeuse, riche en sels minéraux (Chateldon, 63)",
    "courante": false,
    "origine": "Chateldon, 63",
    "sodiumMgL": 240.0,
    "selGL": 0.6
  },
  {
    "code": 76083,
    "nom": "Cilaos, gazeuse",
    "nomCiqual": "Eau minérale Cilaos, embouteillée, gazeuse, riche en sels minéraux (Cilaos, 974)",
    "courante": false,
    "origine": "Cilaos, 974",
    "sodiumMgL": 238.0,
    "selGL": 0.595
  },
  {
    "code": 76088,
    "nom": "Nessel, gazeuse",
    "nomCiqual": "Eau minérale Nessel, embouteillée, gazeuse, moyennement minéralisée (Soultzmatt, 68)",
    "courante": false,
    "origine": "Soultzmatt, 68",
    "sodiumMgL": 231.0,
    "selGL": 0.578
  },
  {
    "code": 76061,
    "nom": "Badoit, gazeuse",
    "nomCiqual": "Eau minérale Badoit, embouteillée, gazeuse, moyennement minéralisée (St-Galmier, 42)",
    "courante": false,
    "origine": "St-Galmier, 42",
    "sodiumMgL": 180.0,
    "selGL": 0.45
  },
  {
    "code": 76094,
    "nom": "St-Michel-de-Mourcairol, gazeuse",
    "nomCiqual": "Eau minérale St-Michel-de-Mourcairol, embouteillée, gazeuse, moyennement minéralisée (Les Aires, 34)",
    "courante": false,
    "origine": "Les Aires, 34",
    "sodiumMgL": 175.0,
    "selGL": 0.438
  },
  {
    "code": 76019,
    "nom": "Didier, plate",
    "nomCiqual": "Eau minérale Didier, embouteillée, plate, riche en sels minéraux (Martinique)",
    "courante": false,
    "origine": "Martinique",
    "sodiumMgL": 130.0,
    "selGL": 0.325
  },
  {
    "code": 76054,
    "nom": "Vernet, gazeuse",
    "nomCiqual": "Eau minérale Vernet, embouteillée, gazeuse, faiblement minéralisée (Prades, 07)",
    "courante": false,
    "origine": "Prades, 07",
    "sodiumMgL": 129.0,
    "selGL": 0.323
  },
  {
    "code": 76018,
    "nom": "Didier, gazeuse",
    "nomCiqual": "Eau minérale Didier, embouteillée, gazeuse, riche en sels minéraux (Martinique)",
    "courante": false,
    "origine": "Martinique",
    "sodiumMgL": 126.0,
    "selGL": 0.315
  },
  {
    "code": 76035,
    "nom": "Quézac, gazeuse",
    "nomCiqual": "Eau minérale Quézac, embouteillée, gazeuse, moyennement minéralisée (Quézac, 48)",
    "courante": false,
    "origine": "Quézac, 48",
    "sodiumMgL": 110.0,
    "selGL": 0.275
  },
  {
    "code": 76024,
    "nom": "Vernière, gazeuse",
    "nomCiqual": "Eau minérale Vernière, embouteillée, gazeuse, moyennement minéralisée (Les Aires, 34)",
    "courante": false,
    "origine": "Les Aires, 34",
    "sodiumMgL": 110.0,
    "selGL": 0.275
  },
  {
    "code": 76000,
    "nom": "Abatilles, plate",
    "nomCiqual": "Eau minérale Abatilles, embouteillée, plate, faiblement minéralisée (Arcachon, 33)",
    "courante": false,
    "origine": "Arcachon, 33",
    "sodiumMgL": 100.0,
    "selGL": 0.25
  },
  {
    "code": 76038,
    "nom": "Sail-les-Bains, plate",
    "nomCiqual": "Eau minérale Sail-les-Bains, embouteillée, plate, faiblement minéralisée (Sail-les-Bains, 42)",
    "courante": false,
    "origine": "Sail-les-Bains, 42",
    "sodiumMgL": 85.0,
    "selGL": 0.212
  },
  {
    "code": 76062,
    "nom": "Avra, plate",
    "nomCiqual": "Eau minérale Avra, embouteillée, plate, faiblement minéralisée (Grèce)",
    "courante": false,
    "origine": "Grèce",
    "sodiumMgL": 84.0,
    "selGL": 0.21
  },
  {
    "code": 76046,
    "nom": "St-Diéry, gazeuse",
    "nomCiqual": "Eau minérale St-Diéry, embouteillée, gazeuse, riche en sels minéraux (St-Diéry, 63)",
    "courante": false,
    "origine": "St-Diéry, 63",
    "sodiumMgL": 77.0,
    "selGL": 0.193
  },
  {
    "code": 76004,
    "nom": "Amanda, plate",
    "nomCiqual": "Eau minérale Amanda, embouteillée, plate, riche en sels minéraux (St-Amand, 59)",
    "courante": false,
    "origine": "St-Amand, 59",
    "sodiumMgL": 55.0,
    "selGL": 0.138
  },
  {
    "code": 76029,
    "nom": "Orée du bois, plate",
    "nomCiqual": "Eau minérale Orée du bois, embouteillée, plate, moyennement minéralisée (St-Amand, 59)",
    "courante": false,
    "origine": "St-Amand, 59",
    "sodiumMgL": 49.2,
    "selGL": 0.123
  },
  {
    "code": 76065,
    "nom": "Chaudfontaine, plate",
    "nomCiqual": "Eau minérale Chaudfontaine, embouteillée, plate, faiblement minéralisée (Belgique)",
    "courante": false,
    "origine": "Belgique",
    "sodiumMgL": 44.0,
    "selGL": 0.11
  },
  {
    "code": 76075,
    "nom": "San Pellegrino, gazeuse",
    "nomCiqual": "Eau minérale San Pellegrino, embouteillée, gazeuse, moyennement minéralisée (Italie)",
    "courante": false,
    "origine": "Italie",
    "sodiumMgL": 44.0,
    "selGL": 0.11
  },
  {
    "code": 76071,
    "nom": "Néro, plate",
    "nomCiqual": "Eau minérale Néro, embouteillée, plate, faiblement minéralisée (Grèce)",
    "courante": false,
    "origine": "Grèce",
    "sodiumMgL": 41.0,
    "selGL": 0.102
  },
  {
    "code": 76097,
    "nom": "Vauban, plate",
    "nomCiqual": "Eau minérale Vauban, embouteillée, plate, moyennement minéralisée (St-Amand-les-Eaux, 59)",
    "courante": false,
    "origine": "St-Amand-les-Eaux, 59",
    "sodiumMgL": 40.0,
    "selGL": 0.1
  },
  {
    "code": 76089,
    "nom": "Ogeu, gazeuse",
    "nomCiqual": "Eau minérale Ogeu, embouteillée, gazeuse, faiblement minéralisée (Ogeu-les-Bains, 64)",
    "courante": false,
    "origine": "Ogeu-les-Bains, 64",
    "sodiumMgL": 31.0,
    "selGL": 0.077
  },
  {
    "code": 76032,
    "nom": "Plancoet, gazeuse ou plate",
    "nomCiqual": "Eau minérale Plancoet, embouteillée, gazeuse ou plate, faiblement minéralisée (Plancoet, 22)",
    "courante": false,
    "origine": "Plancoet, 22",
    "sodiumMgL": 31.0,
    "selGL": 0.077
  },
  {
    "code": 76015,
    "nom": "Clos de l'Abbaye, plate",
    "nomCiqual": "Eau minérale Clos de l'Abbaye, embouteillée, plate, moyennement minéralisée (St-Amand, 59)",
    "courante": false,
    "origine": "St-Amand, 59",
    "sodiumMgL": 29.4,
    "selGL": 0.073
  },
  {
    "code": 76043,
    "nom": "St-Amand, gazeuse ou plate",
    "nomCiqual": "Eau minérale St-Amand, embouteillée, gazeuse ou plate, moyennement minéralisée (St-Amand, 59)",
    "courante": false,
    "origine": "St-Amand, 59",
    "sodiumMgL": 28.0,
    "selGL": 0.07
  },
  {
    "code": 76082,
    "nom": "La Cairolle, plate",
    "nomCiqual": "Eau minérale La Cairolle, embouteillée, plate, riche en sels minéraux (Les Aires, 34)",
    "courante": false,
    "origine": "Les Aires, 34",
    "sodiumMgL": 27.0,
    "selGL": 0.068
  },
  {
    "code": 76090,
    "nom": "Ogeu, plate",
    "nomCiqual": "Eau minérale Ogeu, embouteillée, plate, faiblement minéralisée (Ogeu-les-Bains, 64)",
    "courante": false,
    "origine": "Ogeu-les-Bains, 64",
    "sodiumMgL": 27.0,
    "selGL": 0.068
  },
  {
    "code": 76081,
    "nom": "Biovive, plate",
    "nomCiqual": "Eau minérale Biovive, embouteillée, plate, faiblement minéralisée (Dax, 40)",
    "courante": false,
    "origine": "Dax, 40",
    "sodiumMgL": 18.6,
    "selGL": 0.046
  },
  {
    "code": 76022,
    "nom": "Hépar, plate",
    "nomCiqual": "Eau minérale Hépar, embouteillée, plate, riche en sels minéraux (Vittel, 88)",
    "courante": false,
    "origine": "Vittel, 88",
    "sodiumMgL": 14.2,
    "selGL": 0.035
  },
  {
    "code": 76012,
    "nom": "Chantemerle, plate",
    "nomCiqual": "Eau minérale Chantemerle, embouteillée, plate, faiblement minéralisée (Le Pestrin, 07)",
    "courante": false,
    "origine": "Le Pestrin, 07",
    "sodiumMgL": 13.4,
    "selGL": 0.034
  },
  {
    "code": 76053,
    "nom": "Ventadour, gazeuse",
    "nomCiqual": "Eau minérale Ventadour, embouteillée, gazeuse, faiblement minéralisée (Le Pestrin, 07)",
    "courante": false,
    "origine": "Le Pestrin, 07",
    "sodiumMgL": 13.4,
    "selGL": 0.034
  },
  {
    "code": 76057,
    "nom": "Volvic, plate",
    "nomCiqual": "Eau minérale Volvic, embouteillée, plate, faiblement minéralisée (Volvic, 63)",
    "courante": false,
    "origine": "Volvic, 63",
    "sodiumMgL": 12.0,
    "selGL": 0.03
  },
  {
    "code": 76058,
    "nom": "Volvic active, gazeuse",
    "nomCiqual": "Eau minérale Volvic active, embouteillée, gazeuse, faiblement minéralisée (Volvic, 63)",
    "courante": false,
    "origine": "Volvic, 63",
    "sodiumMgL": 11.7,
    "selGL": 0.029
  },
  {
    "code": 76011,
    "nom": "Chambon, plate",
    "nomCiqual": "Eau minérale Chambon, embouteillée, plate, faiblement minéralisée (Chambon, 45)",
    "courante": false,
    "origine": "Chambon, 45",
    "sodiumMgL": 10.6,
    "selGL": 0.026
  },
  {
    "code": 76103,
    "nom": "Velleminfroy, gazeuse ou plate",
    "nomCiqual": "Eau minérale Velleminfroy, embouteillée, gazeuse ou plate, riche en sels minéraux (Chatenois, 70)",
    "courante": false,
    "origine": "Chatenois, 70",
    "sodiumMgL": 10.3,
    "selGL": 0.026
  },
  {
    "code": 76060,
    "nom": "Perrier, gazeuse",
    "nomCiqual": "Eau minérale Perrier, embouteillée, gazeuse, faiblement minéralisée (Vergèse, 30)",
    "courante": false,
    "origine": "Vergèse, 30",
    "sodiumMgL": 9.5,
    "selGL": 0.024
  },
  {
    "code": 76016,
    "nom": "Contrex, plate",
    "nomCiqual": "Eau minérale Contrex, embouteillée, plate, riche en sels minéraux (Contrexéville, 88)",
    "courante": false,
    "origine": "Contrexéville, 88",
    "sodiumMgL": 9.4,
    "selGL": 0.024
  },
  {
    "code": 76091,
    "nom": "Prince Noir, plate",
    "nomCiqual": "Eau minérale Prince Noir, embouteillée, plate, riche en sels minéraux (St-Antonin-Noble-Val, 82)",
    "courante": false,
    "origine": "St-Antonin-Noble-Val, 82",
    "sodiumMgL": 9.0,
    "selGL": 0.022
  },
  {
    "code": 76044,
    "nom": "St-Antonin, plate",
    "nomCiqual": "Eau minérale St-Antonin, embouteillée, plate, riche en sels minéraux (St-Antonin-Noble-Val, 82)",
    "courante": false,
    "origine": "St-Antonin-Noble-Val, 82",
    "sodiumMgL": 7.9,
    "selGL": 0.02
  },
  {
    "code": 76030,
    "nom": "Orezza, gazeuse",
    "nomCiqual": "Eau minérale Orezza, embouteillée, gazeuse, moyennement minéralisée (Rapaggio, 20B)",
    "courante": false,
    "origine": "Rapaggio, 20B",
    "sodiumMgL": 7.0,
    "selGL": 0.018
  },
  {
    "code": 76039,
    "nom": "Salvetat, gazeuse",
    "nomCiqual": "Eau minérale Salvetat, embouteillée, gazeuse, moyennement minéralisée (La Salvetat, 34)",
    "courante": false,
    "origine": "La Salvetat, 34",
    "sodiumMgL": 7.0,
    "selGL": 0.018
  },
  {
    "code": 76020,
    "nom": "Evian, plate",
    "nomCiqual": "Eau minérale Evian, embouteillée, plate, faiblement minéralisée (Evian, 74)",
    "courante": false,
    "origine": "Evian, 74",
    "sodiumMgL": 6.5,
    "selGL": 0.016
  },
  {
    "code": 76070,
    "nom": "Luso, plate",
    "nomCiqual": "Eau minérale Luso, embouteillée, plate, très faiblement minéralisée (Portugal)",
    "courante": false,
    "origine": "Portugal",
    "sodiumMgL": 6.0,
    "selGL": 0.015
  },
  {
    "code": 76072,
    "nom": "Penacova, plate",
    "nomCiqual": "Eau minérale Penacova, embouteillée, plate, très faiblement minéralisée (Portugal)",
    "courante": false,
    "origine": "Portugal",
    "sodiumMgL": 6.0,
    "selGL": 0.015
  },
  {
    "code": 76050,
    "nom": "Thonon, plate",
    "nomCiqual": "Eau minérale Thonon, embouteillée, plate, faiblement minéralisée (Thonon, 74)",
    "courante": false,
    "origine": "Thonon, 74",
    "sodiumMgL": 5.7,
    "selGL": 0.014
  },
  {
    "code": 76056,
    "nom": "Vittel, plate",
    "nomCiqual": "Eau minérale Vittel, embouteillée, plate, moyennement minéralisée (Vittel, 88)",
    "courante": false,
    "origine": "Vittel, 88",
    "sodiumMgL": 5.2,
    "selGL": 0.013
  },
  {
    "code": 76001,
    "nom": "Aix-les-Bains, plate",
    "nomCiqual": "Eau minérale Aix-les-Bains, embouteillée, plate, faiblement minéralisée (Aix-les-Bains, 73)",
    "courante": false,
    "origine": "Aix-les-Bains, 73",
    "sodiumMgL": 4.4,
    "selGL": 0.011
  },
  {
    "code": 76102,
    "nom": "Eden (La Goa), plate",
    "nomCiqual": "Eau minérale Eden (La Goa), embouteillée, plate, faiblement minéralisée (Suisse)",
    "courante": false,
    "origine": "Suisse",
    "sodiumMgL": 4.0,
    "selGL": 0.01
  },
  {
    "code": 76027,
    "nom": "Mont-Roucous, plate",
    "nomCiqual": "Eau minérale Mont-Roucous, embouteillée, plate, très faiblement minéralisée (Lacaune, 81)",
    "courante": false,
    "origine": "Lacaune, 81",
    "sodiumMgL": 3.1,
    "selGL": 0.008
  },
  {
    "code": 76063,
    "nom": "Beckerich, plate",
    "nomCiqual": "Eau minérale Beckerich, embouteillée, plate, faiblement minéralisée (Luxembourg)",
    "courante": false,
    "origine": "Luxembourg",
    "sodiumMgL": 3.0,
    "selGL": 0.007
  },
  {
    "code": 76076,
    "nom": "Spa-Reine, gazeuse ou plate",
    "nomCiqual": "Eau minérale Spa-Reine, embouteillée, gazeuse ou plate, moyennement minéralisée (Belgique)",
    "courante": false,
    "origine": "Belgique",
    "sodiumMgL": 3.0,
    "selGL": 0.007
  },
  {
    "code": 76059,
    "nom": "Wattwiller, gazeuse ou plate",
    "nomCiqual": "Eau minérale Wattwiller, embouteillée, gazeuse ou plate, faiblement minéraliséee (Wattwiller, 68)",
    "courante": false,
    "origine": "Wattwiller, 68",
    "sodiumMgL": 3.0,
    "selGL": 0.007
  },
  {
    "code": 76095,
    "nom": "Treignac, plate",
    "nomCiqual": "Eau minérale Treignac, embouteillée, plate, très faiblement minéralisée (Treignac, 19)",
    "courante": false,
    "origine": "Treignac, 19",
    "sodiumMgL": 2.8,
    "selGL": 0.007
  },
  {
    "code": 76086,
    "nom": "Montcalm, plate",
    "nomCiqual": "Eau minérale Montcalm, embouteillée, plate, très faiblement minéralisée (Auzat, 09)",
    "courante": false,
    "origine": "Auzat, 09",
    "sodiumMgL": 2.2,
    "selGL": 0.005
  },
  {
    "code": 76069,
    "nom": "Levissima, plate",
    "nomCiqual": "Eau minérale Levissima, embouteillée, plate, faiblement minéralisée (Italie)",
    "courante": false,
    "origine": "Italie",
    "sodiumMgL": 2.0,
    "selGL": 0.005
  },
  {
    "code": 76087,
    "nom": "Montclar, plate",
    "nomCiqual": "Eau minérale Montclar, embouteillée, plate, faiblement minéralisée (Montclar, 04)",
    "courante": false,
    "origine": "Montclar, 04",
    "sodiumMgL": 2.0,
    "selGL": 0.005
  },
  {
    "code": 76078,
    "nom": "Valvert, plate",
    "nomCiqual": "Eau minérale Valvert, embouteillée, plate, faiblement minéralisée (Belgique)",
    "courante": false,
    "origine": "Belgique",
    "sodiumMgL": 2.0,
    "selGL": 0.005
  },
  {
    "code": 76101,
    "nom": "Mont-Blanc, plate",
    "nomCiqual": "Eau minérale Mont-Blanc, embouteillée, plate, faiblement minéralisée (Italie)",
    "courante": false,
    "origine": "Italie",
    "sodiumMgL": 1.6,
    "selGL": 0.004
  },
  {
    "code": 76002,
    "nom": "Aizac, gazeuse",
    "nomCiqual": "Eau minérale Aizac, embouteillée, gazeuse, faiblement minéralisée (Aizac, 07)",
    "courante": false,
    "origine": "Aizac, 07",
    "sodiumMgL": 1.3,
    "selGL": 0.003
  },
  {
    "code": 76010,
    "nom": "Celtic, gazeuse ou plate",
    "nomCiqual": "Eau minérale Celtic, embouteillée, gazeuse ou plate, très faiblement minéralisée (Niederbronn, 67)",
    "courante": false,
    "origine": "Niederbronn, 67",
    "sodiumMgL": 1.1,
    "selGL": 0.003
  },
  {
    "code": 76067,
    "nom": "Courmayeur, plate",
    "nomCiqual": "Eau minérale Courmayeur, embouteillée, plate, riche en sels minéraux (Italie)",
    "courante": false,
    "origine": "Italie",
    "sodiumMgL": 1.0,
    "selGL": 0.003
  },
  {
    "code": 76025,
    "nom": "Luchon, plate",
    "nomCiqual": "Eau minérale Luchon, embouteillée, plate, faiblement minéralisée (Luchon, 31)",
    "courante": false,
    "origine": "Luchon, 31",
    "sodiumMgL": 0.8,
    "selGL": 0.002
  },
  {
    "code": 76074,
    "nom": "San Bernardo, gazeuse ou plate",
    "nomCiqual": "Eau minérale San Bernardo, embouteillée, gazeuse ou plate, très faiblement minéralisée (Italie)",
    "courante": false,
    "origine": "Italie",
    "sodiumMgL": 0.5,
    "selGL": 0.001
  }
];
