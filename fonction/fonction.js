const CRUParser = require('../Parseur/CRUParser.js');


function parseFile() {
    // A completer plus tardd
}

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
function disponibilitesSalle(analyzer, salle, heureDebut="8:00", heureFin="20:00") {
    
    if (!salle) {
        console.log("L'argument rentré est invalide".red);
        return;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
        return;
    }

    // Vérifie que la salle existe dans les créneaux
    const sallesExistantes = new Set(Object.values(analyzer.parsedCRU).flat().map(creneau => creneau.salle));
    if (!sallesExistantes.has(salle)) {
        console.log(`La salle ${salle} est inconnue`.red);
        return;
    }

    const jours = ['L', 'MA', 'ME', 'J', 'V', 'S', 'D'];
    const debut = toMinutes(heureDebut);
    const fin = toMinutes(heureFin);

    let disponibilites = {};

    for (let jour of jours) {
        let currentTimeMin = debut;
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
        if (currentTimeMin < fin) {
            disponibilites[jour].push({
                debut: `${Math.floor(currentTimeMin / 60)}:${String(currentTimeMin % 60).padStart(2, '0')}`,
                fin: `${Math.floor(fin / 60)}:${String(fin % 60).padStart(2, '0')}`
            });
        }

    }

    // Affichage des disponibilités
    for (let jour of jours) {
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



function sallesDisponibles(analyzer,jour, heureDebut, heureFin) {

    let sallesIndisponibles = new Set();
    let sallesListe = new Set();


    if (!heureDebut || !heureFin || !jour) {
        console.log("Erreur dans les arguments".red);
        return;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez ajouter un fichier en entrée".red);
    }

    const debutMin = toMinutes(heureDebut);
    const finFin = toMinutes(heureFin);

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

    const sallesDispo = [...sallesListe].filter(salle => !sallesIndisponibles.has(salle));

    console.log(`Salles disponibles le ${jour} de ${heureDebut} à ${heureFin} : ${sallesDispo.join(', ')}`.green);

    return sallesDispo ;
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
            creneauxSalles.get(creneau.salle).push({cours: ue, ...creneau});
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

function classementCapacite(analyzer){
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier en entrée.".red);
        return;
    }

    let sallesUniques = {};

    for (const [ue, creneaux] of Object.entries(analyzer.parsedCRU)) {
        for (const [id, variable] of Object.entries(creneaux)) {
            if (variable.salle && variable.capacite) {

                if(sallesUniques[variable.salle] === undefined){
                    sallesUniques[variable.salle] = parseInt(variable.capacite, 10);
                }else if (sallesUniques[variable.salle] < parseInt(variable.capacite, 10)){
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

function tauxOccupation(analyzer){
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier à la base de données.");
        return;
    }

    let sallesOccupation = {};
    let jourSemaine = {};
    let dataVega = []

    for (const creneau of Object.values(analyzer.parsedCRU).flat()) {
        const heureDebut=toMinutesArr(creneau.heureDebut);
        const heureFin=toMinutesArr(creneau.heureFin);
        const duree= heureFin-heureDebut;
        const salle = creneau.salle;
        const jour = creneau.jour;

        if (!sallesOccupation[salle]) {
            sallesOccupation[salle] = 0;
        }

        sallesOccupation[salle] += duree;

        if (!jourSemaine[jour]){
            jourSemaine[jour] = [heureDebut, heureFin];
        }
        if(jourSemaine[jour][0]>heureDebut){
            jourSemaine[jour][0]=heureDebut;
        }
        if(jourSemaine[jour][1]<heureFin){
            jourSemaine[jour][1]=heureFin;
        }
    }

    let totalSemaine = 0;
    for(const jour of Object.values(jourSemaine)){
        const debutJour = jour[0];
        const finJour = jour[1];
        const duree = finJour-debutJour;

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

    const cheminJson = path.join(__dirname, 'occupation.json'); 
    const cheminHtml = path.join(__dirname, 'occupation.html');

    try {
        fs.writeFileSync(cheminJson, JSON.stringify(dataVega, null, 2));
        console.log(`Fichier json généré ici : ${cheminJson}`);
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
    tauxOccupation
}