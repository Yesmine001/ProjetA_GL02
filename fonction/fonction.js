const fs = require('fs');
const path = require('path');
const CRUParser = require('../Parseur/CRUParser');
const ICalendar = require('../Parseur/ICalendar');
const { exec } = require('child_process');
const Creneau = require('../Parseur/Creneau.js');

function capaciteSalle(analyzer, idSalle) {
    if (!idSalle) {
        console.log("L'argument rentré est invalide".red);
        return null;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return null;
    }

    const creneauxSalle = Object.values(analyzer.parsedCRU).flat().filter(
        creneau => creneau.salle === idSalle
    );

    if (creneauxSalle.length === 0) {
        console.log("Salle introuvable".red);
        return null;
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
        return null;
    }

    if (!cours) {
        console.log("L'argument rentré est invalide".red);
        return null;
    }

    if (!analyzer.parsedCRU[cours]) {
        console.log(`Le cours ${cours} est inconnu`.red);
        return null;
    }

    const salles = [...new Set(analyzer.parsedCRU[cours].map(creneau => creneau.salle))].sort();

    console.log(`Les salles pour le cours ${cours} sont : ${salles.join(', ')}`);

    return salles;
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
        return null;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return null;
    }

    // Validation des arguments heureDebut et heureFin
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(heureDebut) || !timeRegex.test(heureFin)) {
        console.log("Format invalide. Veuillez utiliser le format HH:MM.");
        return null;
    }

    // Vérifie que la salle existe dans les créneaux
    const sallesExistantes = new Set(Object.values(analyzer.parsedCRU).flat().map(creneau => creneau.salle));
    if (!sallesExistantes.has(salle)) {
        console.log(`La salle ${salle} est inconnue`.red);
        return null;
    }

    const debutMin = toMinutes(heureDebut);
    const finMin = toMinutes(heureFin);

    if (debutMin >= finMin) {
        console.log("L'heure de début doit être avant l'heure de fin".red);
        return null;
    }

    let disponibilites = {};

    for (let jour of Creneau.jours) {
        let currentTimeMin = debutMin;
        disponibilites[jour] = [];

        let creneauxJour = Object.values(analyzer.parsedCRU).flat().filter(
            creneau => creneau.salle === salle && creneau.jour === jour
        );

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

        if (currentTimeMin < finMin) {
            disponibilites[jour].push({
                debut: `${Math.floor(currentTimeMin / 60)}:${String(currentTimeMin % 60).padStart(2, '0')}`,
                fin: `${Math.floor(finMin / 60)}:${String(finMin % 60).padStart(2, '0')}`
            });
        }
    }

    // Affichage des disponibilités (inchangé)
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

    // NOUVEAU: retour pour --json
    return disponibilites;
}

function sallesDisponibles(analyzer, jour, heureDebut, heureFin) {
    let sallesIndisponibles = new Set();
    let sallesListe = new Set();

    if (!heureDebut || !heureFin || !jour) {
        console.log("Erreur dans les arguments".red);
        return null;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return null;
    }

    if (Creneau.jours.indexOf(jour) === -1) {
        console.log("Invalid day argument");
        return null;
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(heureDebut) || !timeRegex.test(heureFin)) {
        console.log("Format invalide. Veuillez utiliser le format HH:MM.");
        return null;
    }

    const debutMin = toMinutes(heureDebut);
    const finMin = toMinutes(heureFin);

    if (debutMin >= finMin) {
        console.log("L'heure de début doit être avant l'heure de fin".red);
        return null;
    }

    for (const creneau of Object.values(analyzer.parsedCRU).flat()) {
        sallesListe.add(creneau.salle);

        if (creneau.jour === jour) {
            const creneauDebutMin = toMinutesArr(creneau.heureDebut);
            const creneauFinMin = toMinutesArr(creneau.heureFin);

            if (creneauDebutMin < finMin && creneauFinMin > debutMin) {
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
        return null;
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
 * Retourne maintenant un objet (utile pour --json).
 */
function genererIcal(dateDebutStr, dateFinStr, ues, outputFilename, analyzer) {
    console.log("generer ical test");
    console.log(dateDebutStr, dateFinStr, ues, outputFilename);

    const result = {
        success: false,
        output: outputFilename || 'schedule_export.ics',
        eventsCount: 0,
        uesFound: [],
        uesMissing: [],
        errors: []
    };

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier à la base de donnée");
        result.errors.push("NO_PARSED_DATA");
        return result;
    }

    if (!dateDebutStr || !dateFinStr || !ues || ues.length === 0) {
        console.log("Arguments manquants ou invalides (dateDebut, dateFin, UEs)");
        result.errors.push("INVALID_ARGUMENTS");
        return result;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateDebutStr) || !dateRegex.test(dateFinStr)) {
        console.log("Format de date invalide. Veuillez utiliser le format YYYY-MM-DD (ex: 2025-01-01).".red);
        result.errors.push("INVALID_DATE_FORMAT");
        return result;
    }

    if (new Date(dateDebutStr) > new Date(dateFinStr)) {
        console.log("Erreur : La date de début ne peut pas être postérieur à la date de fin".red);
        result.errors.push("START_AFTER_END");
        return result;
    }

    let eventsContent = [];

    for (let ue of ues) {
        if (analyzer.parsedCRU[ue]) {
            result.uesFound.push(ue);

            for (let creneau of analyzer.parsedCRU[ue]) {
                try {
                    const event = ICalendar.generateEvent(creneau, dateDebutStr, dateFinStr);
                    eventsContent.push(event);
                } catch (error) {
                    console.log(`Erreur lors de la génération de l'événement pour ${ue} : ${error.message}`);
                    result.errors.push(`EVENT_GEN_ERROR:${ue}:${error.message}`);
                }
            }
        } else {
            console.log(`Attention : L'UE ${ue} est introuvable.`);
            result.uesMissing.push(ue);
        }
    }

    if (eventsContent.length === 0) {
        console.log("Aucun créneau trouvé pour les critères spécifiés. Fichier non généré.");
        result.errors.push("NO_EVENTS");
        return result;
    }

    try {
        const icalFileContent = ICalendar.generateICalFile(eventsContent.join('\n'));
        const finalFilename = outputFilename || 'schedule_export.ics';

        fs.writeFileSync(finalFilename, icalFileContent);
        console.log(`Export iCalendar réussi ! Fichier généré : ${finalFilename}`.green);

        result.success = true;
        result.output = finalFilename;
        result.eventsCount = eventsContent.length;

        return result;
    } catch (error) {
        console.log(`Erreur lors de la génération ou l'écriture du fichier : ${error.message}`.red);
        result.errors.push(`WRITE_ERROR:${error.message}`);
        return result;
    }
}

function tauxOccupation(analyzer) {
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier à la base de données.");
        return null;
    }

    let sallesOccupation = {};
    let jourSemaine = {};
    let dataVega = [];

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
        // Even if writing fails, return computed data
    }

    let commande;
    switch (process.platform) {
        case 'darwin':
            commande = `open "${cheminHtml}"`;
            break;
        case 'win32':
            commande = `start "" "${cheminHtml}"`;
            break;
        default:
            commande = `xdg-open "${cheminHtml}"`;
    }

    console.log(`Ouverture du graphique : ${cheminHtml}`);

    exec(commande, (error) => {
        if (error) {
            console.error("Erreur lors de l'ouverture automatique :", error);
            console.log("Veuillez ouvrir 'occupation.html' manuellement.");
        }
    });

    // NOUVEAU: retour pour --json
    return dataVega;
}

module.exports = {
    capaciteSalle,
    sallesCours,
    disponibilitesSalle,
    sallesDisponibles,
    classementCapacite,
    verifierRecouvrements,
    genererIcal,
    tauxOccupation
};
