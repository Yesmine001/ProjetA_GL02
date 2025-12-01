var Creneau = require('./Creneau');


// CRUParser

var CRUParser = function(sTokenize, sParsedSymb){
	// The list of POI parsed from the input file.
	this.parsedCRU = {}; // Nouvelle structure de données (UE -> [Créneaux]) ON associe l'ue à ses créneau au lieu d'avoir un seul POI
	this.symb = ["+", ",", "P=", "H=", "-", "S=", "//", ":", "/"];
	this.showTokenize = sTokenize;
	this.showParsedSymbols = sParsedSymb;
	this.errorCount = 0;
}

// Parser procedure

// tokenize : tranform the data input into a list
// <eol> = CRLF
CRUParser.prototype.tokenize = function(data){

	// Séparateurs : retour à la ligne, ',', 'P=', 'H=', '-', 'S=', '//', ':'
	// On garde les séparateurs importants pour le parsing
    const separator = /(\r\n|,| |:|\n|P=|H=|-|S=|\/\/|\/|\+)/g; // Ajout de '|+' pour le +UE du des cours
	data = data.split(separator);
	data = data.filter((val) => val.trim() !== ''); // Supprime les éléments vides

    // On retire le texte du début, inintéressant.
    const firstPlus = data.indexOf("+");
	if (firstPlus !== -1){
		data = data.slice(firstPlus)
	}


	return data;
}

CRUParser.prototype.dataPrinter = function(data){
	let tData = this.tokenize(data);
	for (let ith of tData){
		console.log(ith);
	}
	if(!tData){
		console.log("No data to print");
	}
	return true
}

// parse : analyze data by calling the first non terminal rule of the grammar
CRUParser.prototype.parse = function(data){
	let tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	console.log(tData)
	// La boucle se fait dans la fonction cours() maintenant, car il n'y a plus de symbole de fin .
	this.cours(tData);
	this.getParsedCRU()
	if(tData.length > 0) {
	    this.errMsg("Unused tokens remaining, file incomplete or malformed", tData);
	}

}

CRUParser.prototype.getParsedCRU = function(){
	for(const[key,value]  of Object.entries(this.parsedCRU)){
		console.log("Key : ",key,"\n Value : ",value);
		if(!key || !value){
			this.errMsg("Error while parsing file, please check the file format.", "")
			return false;
		}
		console.log("---------------------------------------");
	}
}

// <Cours> = '+' UE CRLF 1*(<Créneau> '//' CRLF)
CRUParser.prototype.cours = function(input){
    if(input.length === 0) return false;

	while (input.length > 0 && input[0] !== "+") {
		this.next(input); // on jette ce token si ce n'est pas un +UE
	}

	if (input.length === 0) return false;

    if(this.check("+", input)){
        this.expect("+", input);
        let ueName = this.ue(input); // Récupère le nom de l'UE
		console.log(ueName);
		//Vérification d'erreur OU de l'UE test
		if(ueName === "UE_ERR") {
			this.errMsg("Invalid UE name", input);
			return false;
		}else if(ueName === "UE_TEST"){
			this.next(input);
			return this.cours(input);
		}

        this.parsedCRU[ueName] = []; // Initialise la liste de créneaux pour cette UE

        // Lecture des créneaux associés

        while (this.checkSTR("1", input) && input.length > 0) {//expect car on retire le "1"
			this.next(input);
            let c = this.creneau(input);
			if(!c){
				this.errMsg("Invalid creneau format.", input);
				return false;
			}
            this.parsedCRU[ueName].push(c);

			while (this.checkSTR("/",input)){
				this.expect("/",input);
				let cSup = this.creneauSup(input,c);
				this.parsedCRU[ueName].push(cSup);
			}
            this.expect("//", input); // Fin d'un Créneau
        }
		if(Object.keys(this.parsedCRU[ueName]).length === 0){
			this.errMsg("No creneau found for UE "+ueName, input);
		}
        // Si le tableau d'entrée n'est pas vide, on cherche le prochain cours
        if(input.length > 0){
            this.cours(input);
        }

        return true;
    }
}
// <UE> = 2*4UPPERALPHA 2DIGIT
CRUParser.prototype.ue = function(input){
	let curS = this.next(input);
    if(curS === "UVUV"){
		return "UE_TEST"
	}else if(!curS){
		return "UE_ERR"
	}
	return curS;
}

// <Créneau> = ‘1,’ <Type> ‘,’ <Capa> ‘,’ <Horaire> ‘,’ <Index> ‘,’ <Salle>
CRUParser.prototype.creneau = function(input){

	const type = this.type(input);
	const capa = this.capa(input);
	const horaire = this.horaire(input);
	const index = this.index(input);
	const salle = this.salle(input);
	if(!type || !capa || !horaire || !index || !salle){
		this.errMsg("Invalid creneau format.", input);
	}
	return new Creneau(type, capa, horaire[0], horaire[1], horaire[2], index, salle);

}
CRUParser.prototype.creneauSup = function(input,lastCreneau){
	const horaire = this.horaireSup(input);
	const type = this.type(input);
	const salle = this.salle(input);
	return new Creneau(type, lastCreneau.capacite, horaire[0], horaire[1], horaire[2], lastCreneau.index, salle)
}

// <Type> = 1UPPERALPHA 1DIGIT
CRUParser.prototype.type = function(input){
	this.expect(",", input);
    let curS = this.next(input);
	const matched = curS.match(/^[A-Z]+(\d)+$/);
	if (matched){
		return matched[0];
	}else{
		this.errMsg("Invalid type : ", curS," please enter a valid, or verify the given document.");
		return false
	}
}

// <Capacité> = ‘P=’ 1*DIGIT
CRUParser.prototype.capa= function(input){
    this.next(input); //saut de la ,
	if (!this.expect("P=", input)){
		this.errMsg("Wrong class format.");
		return false;
	}
	let curS = this.next(input);
	const matched = curS.match(/^\d+$/)
	if(matched){
		return matched[0];
	}else{
		this.errMsg("Invalid capacity : ", curS," please enter a valid, or verify the given document.");
		return false
	}
}

// <Index> = 1UPPERALPHA 1DIGIT
CRUParser.prototype.index = function(input){
    this.next(input);
	let curS=this.next(input);
	const matched = curS.match(/^[A-Z]{1,2}(\d)?$/);
	if(matched){
		return matched[0];
	}else{
		this.errMsg("Invalid index : ", curS," please enter a valid, or verify the given document.");
		return false
	}
}

// <Salle> = ‘S=’ 4(UPPERALPHA / DIGIT)
CRUParser.prototype.salle = function(input){
	this.next(input)
	if (!this.expect("S=",input)){
		this.errMsg("Wrong class format.")
		return false;
	}
	let curS = this.next(input)
	const matched = curS.match(/^[A-Z]+\d+$/);
	if (matched){
		return matched[0];
	}else{
		this.errMsg("Invalid salle : ", curS," please enter a valid, or verify the given document.");
		return false
	}

}
CRUParser.prototype.getHoraire = function(input){
	let horaire = [];
	let horaire_h = this.next(input);
	this.expect(":", input);
	let horaire_min = this.next(input);
	horaire.push(horaire_h, horaire_min);
	return horaire;
}

// <Horaire> = ‘H=’ <Jour> WSD <Heure> ‘-’ <Heure>
CRUParser.prototype.horaire = function(input){
    this.next(input);//jet de la ","
	this.expect("H=", input);
	let jour = this.next(input)
	let horaire_deb = this.getHoraire(input);
	this.expect("-", input);
	let horaire_end = this.getHoraire(input);
	return [jour,horaire_deb,horaire_end];
}
CRUParser.prototype.horaireSup = function(input){
	let jour = this.next(input);
	let horaireDeb = this.getHoraire(input)
	this.expect("-",input)
	let horaireFin = this.getHoraire(input)
	return [jour,horaireDeb,horaireFin]
}







CRUParser.prototype.errMsg = function(msg, input){
	this.errorCount++;
	console.log("Parsing Error ! on "+input+" -- msg : "+msg);
}

// Read and return a symbol from input
CRUParser.prototype.next = function(input){
	var curS = input.shift();
	if(this.showParsedSymbols){
		console.log(curS);
	}
	return curS
}

// accept : verify if the arg s is part of the language symbols.
CRUParser.prototype.accept = function(s){
	var idx = this.symb.indexOf(s);
	// index 0 exists
	if(idx === -1){
		this.errMsg("symbol "+s+" unknown", [" "]);
		return false;
	}

	return idx;
}



// check : check whether the arg elt is on the head of the list
CRUParser.prototype.check = function(s, input){
	if(this.accept(input[0]) == this.accept(s)){
		return true;	
	}
	return false;
}
CRUParser.prototype.checkSTR = function(s, input){
	if(input[0] === s){
		return true;
	}
}

// expect : expect the next symbol to be s.
CRUParser.prototype.expect = function(s, input){
	let val = this.next(input);
	console.log(val);
	if(s === val){
		//console.log("Reckognized! "+s)
		return true;
	}else{
		this.errMsg("symbol "+s+" doesn't match", input);
	}
	return false;
}


// Parser rules


module.exports = CRUParser;