var Creneau = require('./Creneau');


// CRUParser

var CRUParser = function(sTokenize, sParsedSymb){
	// The list of POI parsed from the input file.
	this.parsedCRU = {}; // Nouvelle structure de données (UE -> [Créneaux]) ON associe l'ue à ses créneau au lieu d'avoir un seul POI
	this.symb = ["+", ",", "P=", "H=", "-", "S=", "//", ":"];
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
    const separator = /(\r\n|,|P=|H=|-|S=|\/\/|\+)/g; // Ajout de '|+' pour le +UE du des cours
	data = data.split(separator);
	data = data.filter((val) => val.trim() !== ''); // Supprime les éléments vides
    
    // Simplification : Supprimer les CRLF non critiques si le parsing devient trop complexe
    data = data.map(item => item.trim()).filter(item => item !== '');  //filter redondant en vrai opn pourrait l'enlever
    
	return data;
}

// parse : analyze data by calling the first non terminal rule of the grammar
CRUParser.prototype.parse = function(data){
	let tData = this.tokenize(data);
	if(this.showTokenize){
		console.log(tData);
	}
	// La boucle se fait dans la fonction cours() maintenant, car il n'y a plus de symbole de fin .
	this.cours(tData); 


	if(tData.length > 0) {
	    this.errMsg("Unused tokens remaining, file incomplete or malformed", tData);
	}
}

// <Cours> = '+' UE CRLF 1*(<Créneau> '//' CRLF)
CRUParser.prototype.cours = function(input){
    if(input.length === 0) return false;

    if(this.check("+", input)){
        this.expect("+", input);
        let ueName = this.ue(input); // Récupère le nom de l'UE
        this.parsedCRU[ueName] = []; // Initialise la liste de créneaux pour cette UE

        // Lecture des créneaux associés
        while (this.check("1", input) && input.length > 0) {
            let c = this.creneau(input);
            this.parsedCRU[ueName].push(c);
            this.expect("//", input); // Fin d'un Créneau
        }

        // Si le tableau d'entrée n'est pas vide, on cherche le prochain cours
        if(input.length > 0){
            this.cours(input);
        }
        return true;
    }else{
        return false;
    }
}
// <UE> = 2*4UPPERALPHA 2DIGIT
CRUParser.prototype.ue = function(input){       
    let curS = this.next(input);
	matched = curS.match(/[A-Z]{2,4}[0-9]{2}/)   // il y a un problème avec l'ABNF du cc, on peut pas écrire AP1A par ex avec ce système
    if(matched){
        return matched[0];
    }else{
        this.errMsg("Invalid UE format", input);
    }
}

// <Créneau> = ‘1,’ <Type> ‘,’ <Capa> ‘,’ <Horaire> ‘,’ <Index> ‘,’ <Salle>
CRUParser.prototype.creneau = function(input){
    
}

// <Type> = 1UPPERALPHA 1DIGIT
CRUParser.prototype.type = function(input){
    
}

// <Capacité> = ‘P=’ 1*DIGIT
CRUParser.prototype.capa= function(input){
    
}

// <Index> = 1UPPERALPHA 1DIGIT
CRUParser.prototype.index = function(input){
    
}

// <Salle> = ‘S=’ 4(UPPERALPHA / DIGIT)
CRUParser.prototype.salle = function(input){
    this.expect("S=", input);
    let curS = this.next(input);
    matched = curS.match(/[A-Z0-9]{4}/i)    // /i permet l'insensibilité majuscules/minuscules)
    if(matched){
        return matched[0];
    }else{
        this.errMsg("Invalid Salle format", input);
    }
}

// <Horaire> = ‘H=’ <Jour> WSD <Heure> ‘-’ <Heure>
CRUParser.prototype.horaire = function(input){
   
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

// expect : expect the next symbol to be s.
CRUParser.prototype.expect = function(s, input){
	if(s == this.next(input)){
		//console.log("Reckognized! "+s)
		return true;
	}else{
		this.errMsg("symbol "+s+" doesn't match", input);
	}
	return false;
}


// Parser rules

// <liste_poi> = *(<poi>) "$$"
CRUParser.prototype.listPoi = function(input){
	this.poi(input);
	this.expect("$$", input);
}

// <poi> = "START_POI" <eol> <body> "END_POI"
CRUParser.prototype.poi = function(input){

	if(this.check("START_POI", input)){
		this.expect("START_POI", input);
		var args = this.body(input);
		var p = new POI(args.nm, args.lt, args.lg, []);
		this.note(input, p);
		this.expect("END_POI",input);
		this.parsedPOI.push(p);
		if(input.length > 0){
			this.poi(input);
		}
		return true;
	}else{
		return false;
	}

}

// <body> = <name> <eol> <latlng> <eol> <optional>
CRUParser.prototype.body = function(input){
	var nm = this.name(input);
	var ltlg = this.latlng(input);
	return { nm: nm, lt: ltlg.lat, lg: ltlg.lng };
}

// <name> = "name: " 1*WCHAR
CRUParser.prototype.name = function(input){
	this.expect("name",input)
	var curS = this.next(input);
	if(matched = curS.match(/[\wàéèêîù'\s]+/i)){
		return matched[0];
	}else{
		this.errMsg("Invalid name", input);
	}
}

// <latlng> = "latlng: " ?"-" 1*3DIGIT "." 1*DIGIT", " ?"-" 1*3DIGIT "." 1*DIGIT
CRUParser.prototype.latlng = function(input){
	this.expect("latlng",input)
	var curS = this.next(input);
	if(matched = curS.match(/(-?\d+(\.\d+)?);(-?\d+(\.\d+)?)/)){
		return { lat: matched[1], lng: matched[3] };
	}else{
		this.errMsg("Invalid latlng", input);
	}
}

// <optional> = *(<note>)
// <note> = "note: " "0"/"1"/"2"/"3"/"4"/"5"
CRUParser.prototype.note = function (input, curPoi){
	if(this.check("note", input)){
		this.expect("note", input);
		var curS = this.next(input);
		if(matched = curS.match(/[12345]/)){
			curPoi.addRating(matched[0]);
			if(input.length > 0){
				this.note(input, curPoi);
			}
		}else{
			this.errMsg("Invalid note");
		}	
	}
}

module.exports = CRUParser;