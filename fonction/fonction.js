const path = require('path');
const CRUParser = require('../Parseur/CRUParser');

let analyzer = new CRUParser();

function parseFile() {
    // A completer plus tardd
}

function capaciteSalle(idSalle) {

    if (!idSalle) console.log("L'argument rentré est invalide");

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier à la base de donnée");
        return;
    }

    const creneauxSalle = Object.values(analyzer.parsedCRU).flat().filter(
        creneau => creneau.salle === idSalle
    );

    if (creneauxSalle.length === 0) {
        console.log("Salle introuvable dans les créneaux");
        return;
    }

    let capacity = creneauxSalle.reduce((maxCapa, creneau) =>
        Math.max(maxCapa, creneau.capacite), 0
    );

    console.log(`La capacité maximale de la salle ${idSalle} est de ${capacity} personnes.`);

}

function sallesCours(analyzer, cours) {

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier à la base de donnée");
        return;
    }

    if (!cours) {
        console.log("L'argument rentré est invalide");
        return;
    }

    if (!analyzer.parsedCRU[cours]) {
        console.log(`Les cours ${cours} est inconnu`);
        return;
    }

    const salles = [...new Set(analyzer.parsedCRU[cours].map(creneau => creneau.salle))].sort();

    // Affichage des salles
    console.log(`Les salles pour le cours ${cours} sont : ${salles.join(', ')}`);
}





function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

function salleDisponible(heureDebut, heureFin, jour) {

    let sallesIndisponibles = new Set();
    let sallesListe = new Set();
    let sallesDispo = [];


    if (!heureDebut || !heureFin || !jour) {
        console.log("erreur dans les arguments");
        return;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier à la base de donnée");
    }

    const debut = toMinutes(heureDebut);
    const fin = toMinutes(heureFin);

    for (const [key, value] of Object.entries(analyzer.parsedCRU)) {
        for (const [key2, value2] of Object.entries(value)) {

            let debut2 = toMinutes(value2.heureDebut);
            let fin2 = toMinutes(value2.heureFin);

            sallesListe.add(value2.salle);

            if (value2.jour === jour && debut < fin2 && fin > debut2) {
                sallesIndisponibles.add(value2.salle);
            }
        }
    }

    for (let salle of sallesListe) {
        if (!sallesIndisponibles.has(salle)) {
            sallesDispo.push(salle);
        }
    }

    return sallesDispo;
}

module.exports = {
    parseFile,
    capaciteSalle,
    sallesCours,
    salleDisponible
};