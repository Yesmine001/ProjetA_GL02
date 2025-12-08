const fs = require('fs');
const path = require('path');
const CRUParser = require('../Parseur/CRUParser'); 
const ICalendar = require('../Parseur/ICalendar'); 

let analyzer = new CRUParser(); // Instance Globale, désormais exposée
const { exec } = require('child_process');
const Creneau = require('../Parseur/Creneau.js');

function capaciteSalle(analyzer, idSalle) {

    if (!idSalle) console.log("L'argument rentré est invalide".red);

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return;
    }

    const creneauxSalle = Object.values(analyzer.parsedCRU).flat().filter(
        creneau => creneau.salle === idSalle
    );

    if (creneauxSalle.length === 0) {
        console.log("Salle introuvable".red);
        return;
    }

    let capacity = creneauxSalle.reduce((maxCapa, creneau) =>
        Math.max(maxCapa, creneau.capacite), 0
    );

    console.log(`La capacité maximale de la salle ${idSalle} est de ${capacity} personnes.`);

    return capacity;

}

function sallesCours(analyzer, cours) {

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return;
    }

    if (!cours) {
        console.log("L'argument rentré est invalide".red);
        return;
    }

    if (!analyzer.parsedCRU[cours]) {
        console.log(`Le cours ${cours} est inconnu`.red);
        return;
    }

    const salles = [...new Set(analyzer.parsedCRU[cours].map(creneau => creneau.salle))].sort();

    // Affichage des salles
    console.log(`Les salles pour le cours ${cours} sont : ${salles.join(', ')}`);

    return salles
}


function toMinutesArr(hhmm) {
    const [h, m] = hhmm.map(Number);
    return h * 60 + m;
}

function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}



// Renvoie les disponibilités d'une salle 
function disponibilitesSalle(analyzer, salle, heureDebut = "8:00", heureFin = "20:00") {

    if (!salle) {
        console.log("L'argument rentré est invalide".red);
        return;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return;
    }

    // Validation des arguments heureDebut et heureFin
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(heureDebut) || !timeRegex.test(heureFin)) {
        console.log("Format invalide. Veuillez utiliser le format HH:MM.");
        return;
    }

    // Vérifie que la salle existe dans les créneaux
    const sallesExistantes = new Set(Object.values(analyzer.parsedCRU).flat().map(creneau => creneau.salle));
    if (!sallesExistantes.has(salle)) {
        console.log(`La salle ${salle} est inconnue`.red);
        return;
    }

    const debutMin = toMinutes(heureDebut);
    const finMin = toMinutes(heureFin);

    if (debutMin >= finMin) {
        console.log("L'heure de début doit être avant l'heure de fin".red);
        return;
    }

    let disponibilites = {};

    for (let jour of Creneau.jours) {
        let currentTimeMin = debutMin;
        disponibilites[jour] = [];

        // Récupérer les créneaux pour la salle et le jour donnés
        let creneauxJour = Object.values(analyzer.parsedCRU).flat().filter(
            creneau => creneau.salle === salle && creneau.jour === jour
        );

        // Trier les créneaux par heure de début
        creneauxJour.sort((a, b) => toMinutesArr(a.heureDebut) - toMinutesArr(b.heureDebut));

        for (let creneau of creneauxJour) {
            let creneauDebutMin = toMinutesArr(creneau.heureDebut);
            let creneauFinMin = toMinutesArr(creneau.heureFin);

            if (creneauDebutMin > currentTimeMin) {
                disponibilites[jour].push({
                    debut: `${Math.floor(currentTimeMin / 60)}:${String(currentTimeMin % 60).padStart(2, '0')}`,
                    fin: `${Math.floor(creneauDebutMin / 60)}:${String(creneauDebutMin % 60).padStart(2, '0')}`
                });
            }
            currentTimeMin = Math.max(currentTimeMin, creneauFinMin);
        }


        // On gère jusque fin de journée
        if (currentTimeMin < finMin) {
            disponibilites[jour].push({
                debut: `${Math.floor(currentTimeMin / 60)}:${String(currentTimeMin % 60).padStart(2, '0')}`,
                fin: `${Math.floor(finMin / 60)}:${String(finMin % 60).padStart(2, '0')}`
            });
        }

    }

    // Affichage des disponibilités
    for (let jour of Creneau.jours) {
        console.log(`Disponibilités pour la salle ${salle} - ${jour} :`.green);
        if (disponibilites[jour].length === 0) {
            console.log("Aucune disponibilité".red);
        } else {
            for (let plage of disponibilites[jour]) {
                console.log(`De ${plage.debut} à ${plage.fin}`.blue);
            }
        }
        console.log("");
    }

}



function sallesDisponibles(analyzer, jour, heureDebut, heureFin) {

    let sallesIndisponibles = new Set();
    let sallesListe = new Set();


    if (!heureDebut || !heureFin || !jour) {
        console.log("Erreur dans les arguments".red);
        return;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return;
    }

    // Validation des arguments jour et heures
    if (Creneau.jours.indexOf(jour) === -1) {
        console.log("Invalid day argument");
        return;
    }

    // Validation des arguments heureDebut et heureFin
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(heureDebut) || !timeRegex.test(heureFin)) {
        console.log("Format invalide. Veuillez utiliser le format HH:MM.");
        return;
    }

    const debutMin = toMinutes(heureDebut);
    const finFin = toMinutes(heureFin);

    if (debutMin >= finFin) {
        console.log("L'heure de début doit être avant l'heure de fin".red);
        return;
    }

    for (const creneau of Object.values(analyzer.parsedCRU).flat()) {
        sallesListe.add(creneau.salle);

        if (creneau.jour === jour) {
            const creneauDebutMin = toMinutesArr(creneau.heureDebut);
            const creneauFinMin = toMinutesArr(creneau.heureFin);

            // Vérifie si les créneaux se chevauchent
            if (creneauDebutMin < finFin && creneauFinMin > debutMin) {
                sallesIndisponibles.add(creneau.salle);
            }
        }
    }

    const sallesDispo = [...sallesListe].filter(salle => !sallesIndisponibles.has(salle)).sort();

    console.log(`Salles disponibles le ${jour} de ${heureDebut} à ${heureFin} : ${sallesDispo.join(', ')}`.green);

    return sallesDispo;
}

function verifierRecouvrements(analyzer) {
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return false;
    }

    // Recouvrement = une meme salle a deux cours en même temps
    creneauxSalles = new Map();
    for (const [ue, creneaux] of Object.entries(analyzer.parsedCRU)) {
        for (const creneau of creneaux) {
            if (!creneauxSalles.has(creneau.salle)) {
                creneauxSalles.set(creneau.salle, []);
            }
            creneauxSalles.get(creneau.salle).push({ cours: ue, ...creneau });
        }
    }

    let hasRecouvrement = false;

    for (const [salle, creneaux] of creneauxSalles.entries()) {
        // Trier les créneaux par horaire de début
        creneaux.sort((a, b) => {
            return a.debutTotMin - b.debutTotMin;
        });

        for (let i = 1; i < creneaux.length; i++) {
            let prevCreneau = creneaux[i - 1];
            let currCreneau = creneaux[i];

            if (prevCreneau.finTotMin > currCreneau.debutTotMin) {
                console.log(`Recouvrement détecté dans la salle ${salle} entre les créneaux :`.red);
                console.log(` - ${prevCreneau.jour}, ${prevCreneau.heureDebut.join(":")} à ${prevCreneau.heureFin.join(":")} pour ${prevCreneau.cours}`.yellow);
                console.log(` - ${currCreneau.jour}, ${currCreneau.heureDebut.join(":")} à ${currCreneau.heureFin.join(":")} pour ${currCreneau.cours}`.yellow);
                hasRecouvrement = true;
            }
        }
    }

    if (!hasRecouvrement) {
        console.log("Aucun recouvrement détecté entre les créneaux.".green);
    }

    return hasRecouvrement;
}

function classementCapacite(analyzer) {
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier en entrée.".red);
        return;
    }

    let sallesUniques = {};

    for (const [ue, creneaux] of Object.entries(analyzer.parsedCRU)) {
        for (const [id, variable] of Object.entries(creneaux)) {
            if (variable.salle && variable.capacite) {

                if (sallesUniques[variable.salle] === undefined) {
                    sallesUniques[variable.salle] = parseInt(variable.capacite, 10);
                } else if (sallesUniques[variable.salle] < parseInt(variable.capacite, 10)) {
                    sallesUniques[variable.salle] = parseInt(variable.capacite, 10);
                }
            }
        }
    }

    let tableauSalles = Object.entries(sallesUniques).map(([nom, cap]) => {
        return { nom: nom, cap: cap };
    });

    tableauSalles.sort((a, b) => b.cap - a.cap);

    console.log("--- Classement des salles par capacité (Décroissant) ---".green);
    tableauSalles.forEach(salle => {
        console.log(`Salle : ${salle.nom} - Capacité : ${salle.cap}`);
    });

    return tableauSalles;
}

/**
 * Génère le fichier iCalendar pour les UEs et la période spécifiées.
 * @param {string} dateDebutStr - Date de début (YYYY-MM-DD).
 * @param {string} dateFinStr - Date de fin (YYYY-MM-DD).
 * @param {Array<string>} ues - Liste des UEs à inclure.
 * @param {string} outputFilename - Nom du fichier de sortie (nouvel argument).
 */
function genererIcal(dateDebutStr, dateFinStr, ues, outputFilename, analyzer) {
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier à la base de donnée");
        return;
    }
    
    // Vérification des arguments (simplifiée, une validation de date plus robuste serait idéale)
    if (!dateDebutStr || !dateFinStr || !ues || ues.length === 0) {
        console.log("Arguments manquants ou invalides (dateDebut, dateFin, UEs)");
        return;
    }

    let eventsContent = [];

    // 1. Filtrer les créneaux pour les UEs demandées
    for (let ue of ues) {
        if (analyzer.parsedCRU[ue]) {
            for (let creneau of analyzer.parsedCRU[ue]) {
                // L'UE est déjà sur le créneau (ajouté dans CRUParser.js)
                
                // 2. Générer l'événement iCalendar
                try {
                    const event = ICalendar.generateEvent(creneau, dateDebutStr, dateFinStr);
                    eventsContent.push(event);
                } catch (error) {
                    console.log(`Erreur lors de la génération de l'événement pour ${ue} : ${error.message}`);
                }
            }
        } else {
            console.log(`Attention : L'UE ${ue} est introuvable.`);
        }
    }

    if (eventsContent.length === 0) {
        console.log("Aucun créneau trouvé pour les critères spécifiés. Fichier non généré.");
        return;
    }

    // 3. Générer le fichier complet et l'écrire
    const icalFileContent = ICalendar.generateICalFile(eventsContent.join('\n'));
    
    // UTILISATION DU NOM DE FICHIER PASSÉ EN ARGUMENT
    const finalFilename = outputFilename || 'schedule_export.ics';

    try {
        require('fs').writeFileSync(finalFilename, icalFileContent); 
        console.log(`Export iCalendar réussi ! Fichier généré : ${finalFilename}`.green);
    } catch (error) {
        console.log(`Erreur lors de l'écriture du fichier ${finalFilename}: ${error.message}`.red);
    }
}


function tauxOccupation(analyzer) {
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier à la base de données.");
        return;
    }

    let sallesOccupation = {};
    let jourSemaine = {};
    let dataVega = []

    for (const creneau of Object.values(analyzer.parsedCRU).flat()) {
        const heureDebut = toMinutesArr(creneau.heureDebut);
        const heureFin = toMinutesArr(creneau.heureFin);
        const duree = heureFin - heureDebut;
        const salle = creneau.salle;
        const jour = creneau.jour;

        if (!sallesOccupation[salle]) {
            sallesOccupation[salle] = 0;
        }

        sallesOccupation[salle] += duree;

        if (!jourSemaine[jour]) {
            jourSemaine[jour] = [heureDebut, heureFin];
        }
        if (jourSemaine[jour][0] > heureDebut) {
            jourSemaine[jour][0] = heureDebut;
        }
        if (jourSemaine[jour][1] < heureFin) {
            jourSemaine[jour][1] = heureFin;
        }
    }

    let totalSemaine = 0;
    for (const jour of Object.values(jourSemaine)) {
        const debutJour = jour[0];
        const finJour = jour[1];
        const duree = finJour - debutJour;

        totalSemaine += duree;
    }


    for (const salle in sallesOccupation) {
        const pourcentage = (sallesOccupation[salle] / totalSemaine) * 100;

        sallesOccupation[salle] = pourcentage.toFixed(2);

        dataVega.push({
            "nom_salle": salle,
            "taux_occupation": parseFloat(pourcentage.toFixed(2))
        });
    }

    const cheminData = path.join(__dirname, 'data_occupation.js');
    const cheminHtml = path.join(__dirname, 'occupation.html');


    try {
        const contenuFichier = `var dataOccupation = ${JSON.stringify(dataVega, null, 2)};`;

        fs.writeFileSync(cheminData, contenuFichier);
        console.log(`Fichier de données JS généré ici : ${cheminData}`);
    } catch (err) {
        console.error("Erreur d'écriture :", err);
    }


    let commande;

    switch (process.platform) {
        case 'darwin': // Mac
            commande = `open "${cheminHtml}"`;
            break;
        case 'win32': // Windows
            commande = `start "" "${cheminHtml}"`;
            break;
        default: // Linux
            commande = `xdg-open "${cheminHtml}"`;
    }


    console.log(`Ouverture du graphique : ${cheminHtml}`);

    exec(commande, (error) => {
        if (error) {
            console.error("Erreur lors de l'ouverture automatique :", error);
            console.log("Veuillez ouvrir 'occupation.html' manuellement.");
        }
    });

}

module.exports = {
    capaciteSalle,
    sallesCours,
    disponibilitesSalle,
    sallesDisponibles,
    classementCapacite,
    verifierRecouvrements,
    genererIcal,
    analyzer, // EXPORT DE L'INSTANCE GLOBALE
    tauxOccupation
}