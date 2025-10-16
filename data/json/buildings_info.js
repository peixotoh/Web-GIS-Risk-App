window.buildings = [
  {
    id: "14",
    description: "Gare",
    valeur_base: 530,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1241"]
  },
  {
    id: "9",
    description: "Centre commercial",
    valeur_base: 540,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1230"]
  },
  {
    id: "64",
    description: "Autre type de bâtiment",
    valeur_base: 1,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1212", "1274", "1271"]
  },
  {
    id: "5",
    description: "Hôtel",
    valeur_base: 492,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1211"]
  },
  {
    id: "6",
    description: "Bâtiment industriel ou artisanal",
    valeur_base: 280,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1251"]
  },
  {
    id: "91",
    description: "Cave (uniquement pour les processus hydrologiques)",
    valeur_base: 1,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0, moyenne: 0, forte: 0 },
    letalite: { faible: 0, moyenne: 0, forte: 0 },
    classes: []
  },
  {
    id: "12",
    description: "Église",
    valeur_base: 720,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1272"]
  },
  {
    id: "18",
    description: "Bâtiment public",
    valeur_base: 810,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1241", "1261", "1262", "1273"]
  },
  {
    id: "88",
    description: "Parking public",
    valeur_base: 3000,
    unite: "CHF/unité",
    occupation: 0,
    vulnerabilite: { faible: 0.3, moyenne: 0.6, forte: 1 },
    letalite: { faible: 0, moyenne: 0.5, forte: 1 },
    classes: []
  },
  {
    id: "10",
    description: "École / école enfantine",
    valeur_base: 580,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1263"]
  },
  {
    id: "3",
    description: "Hangar / remise",
    valeur_base: 80,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.8, moyenne: 0.9, forte: 0.9 },
    letalite: { faible: 0, moyenne: 0.03, forte: 0.5 },
    classes: ["1252", "1278"]
  },
  {
    id: "11",
    description: "Hôpital",
    valeur_base: 850,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1264"]
  },
  {
    id: "15",
    description: "Installation sportive (bâtiment)",
    valeur_base: 370,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1265"]
  },
  {
    id: "63",
    description: "Station (bâtiment) de remontée mécanique",
    valeur_base: 500,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1265"]
  },
  {
    id: "2",
    description: "Étable à bétail",
    valeur_base: 180,
    unite: "CHF/m³",
    occupation: 0,
    vulnerabilite: { faible: 0.3, moyenne: 0.3, forte: 0.6 },
    letalite: { faible: 0, moyenne: 0.003, forte: 0.2 },
    classes: ["1276"]
  },
  {
    id: "4",
    description: "Garage (unité de parking)",
    valeur_base: 60000,
    unite: "CHF/unité",
    occupation: 0,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1242"]
  },
  {
    id: "1",
    description: "Unité de logement maison individuelle",
    valeur_base: 650000,
    unite: "CHF/unité résidentielle",
    occupation: 2.24,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1110"]
  },
  {
    id: "87",
    description: "Unité de logement dans immeuble résidentiel",
    valeur_base: 550000,
    unite: "CHF/unité résidentielle",
    occupation: 2.24,
    vulnerabilite: { faible: 0.01, moyenne: 0.1, forte: 0.3 },
    letalite: { faible: 0, moyenne: 0.0002, forte: 0.06 },
    classes: ["1110", "1121", "1122"]
  }
];