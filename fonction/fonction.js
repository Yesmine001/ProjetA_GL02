const fs = require('fs');
const path = require('path');
const CRUParser = require('../Parseur/CRUParser');

let analyzer = new CRUParser();

function parseFile(){
    // A completer plus tardd
}

function capaciteSalle(idSalle){
    var capacity=-1;

    if(!idSalle) console.log("L'argument rentré est invalide");

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0){
        console.log("Veuillez ajouter un fichier à la base de donnée");
        return;
    }

	for(const[key,value] of Object.entries(analyzer.parsedCRU)){
		for(const[key2,value2] of Object.entries(value)){
            
                let currentCap = parseInt(value2.capacite, 10);

                if (currentCap > capacity) {
                    capacity = currentCap;
                }
		}
	}
    if(capacity===-1){
        console.log("La salle n'est pas trouvé");
        return;
    }else{
        console.log("la salle numero %s a une capacité de %d",idSalle,capacity);
        return ;
    }
    // Ici on retourne rien, on l'affiche seulement, si besoin faut changer le return
    
}

function toMinutes(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
}

function salleDisponible(heureDebut, heureFin, jour){

    let sallesIndisponibles = new Set();
    let sallesListe = new Set();
    let sallesDispo = [];


    if(!heureDebut || !heureFin || !jour){
        console.log("erreur dans les arguments");
        return ;
    }

    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0){
        console.log("Veuillez ajouter un fichier à la base de donnée");
    }

    const debut = toMinutes(heureDebut);
    const fin = toMinutes(heureFin);
    
	for(const[key,value] of Object.entries(analyzer.parsedCRU)){
        for(const[key2,value2] of Object.entries(value)){
            
            let debut2 = toMinutes(value2.heureDebut);
            let fin2 = toMinutes(value2.heureFin);

            sallesListe.add(value2.salle);

            if (value2.jour === jour && debut < fin2 && fin > debut2){
                sallesIndisponibles.add(value2.salle);
            }
		}
	}

    for(let salle of sallesListe){
        if(!sallesIndisponibles.has(salle)){
            sallesDispo.push(salle);
        }
    }

    return sallesDispo ;
}

function classementCapacite(){
    if (!analyzer.parsedCRU || Object.keys(analyzer.parsedCRU).length === 0) {
        console.log("Veuillez d'abord ajouter un fichier à la base de données.");
        return;
    }

    let sallesUniques = {};

    for (const [ue, creneaux] of Object.entries(analyzer.parsedCRU)) {
        for (const [id, variable] of Object.entries(creneaux)) {
            if (variable.salle && variable.capacite) {

                if(sallesUniques[variable.salle] == undefined){
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

    console.log("--- Classement des salles par capacité (Décroissant) ---");
    tableauSalles.forEach(salle => {
        console.log(`Salle : ${salle.nom} - Capacité : ${salle.cap}`);
    });

    return tableauSalles;
}
