const fs = require('fs');
const colors = require('colors');
const CRUParser = require('./CRUParser.js');
const readline = require('readline');

// Import des fonctions, y compris l'analyzer global dans le mode direct (pour les commandes Caporal).
const {capaciteSalle, sallesCours, disponibilitesSalle, verifierRecouvrements, sallesDisponibles, classementCapacite, genererIcal, tauxOccupation} = require('../fonction/fonction.js');

// vega and vega-lite will be loaded async when needed (ESM modules)
const Creneau = require('./Creneau.js');
//Functions used in this script :


const cli = require("@caporal/core").default;
cli
	.version('cru-parser-cli')
	.version('0.07')	// check CRU
	.command('check', 'Check if <file> is a valid CRU file')
	.argument('<file>', 'The file to check with CRU parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator : cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({args, options, logger}) => {
		
		fs.readFile(args.file, 'utf8', function (err,data) {
			if (err) {
				return logger.warn(err);
			}
	  
			// Crée une instance locale pour le check/affichage, qui ne doit PAS être l'analyzer global
			var localAnalyzer = new CRUParser(options.showTokenize, options.showSymbols); 
			localAnalyzer.parse(data);
			
			if(localAnalyzer.errorCount === 0 && Object.keys(localAnalyzer.parsedCRU).length > 0){
				logger.info("The .cru file is a valid cru file".green);
			}else{
				logger.info("The .cru file contains error, contains no UE or is in the wrong format".red);
			}
			
			logger.debug(localAnalyzer.parsedPOI);

		});
			
	})


	.command('printTokens','Prints the tokenized input file')
	.argument('<file>', 'The file to print tokens from')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser();
			analyzer.dataPrinter(data);
		});
	})

	.command('start','Start the CRU schedule application')
	.action(({args, options, logger}) => {
		let helpCmds = ["capaciteMax", "sallesCours", "dispoSalle", "sallesDispo", "classementCapacite", "occupation", "icalendar", "parseFile", "exit","showData"];
		let helpCmdsDesc = [
			"Returns the max capacity for a room. Use example : capaciteMax S104. \n At least a single .cru file containing the room needed to search for a room.",
			"Gives the rooms for a given course. Use case : sallesCours LE02\n At least a single file containing the class to return results.",
			"Returns all the moments when the room is unoccupied.\n Usage : dispoSalle ROOM_ID arg1 arg2\n optional arguments :\n arg1 : start hour (H:MM) | arg2 : end hour (H:MM)",
			"Returns all the rooms unoccupied for a given moment.\n Usage : sallesDispo ROOM_ID arg1 arg2 arg3\n arguments : arg1 : Day (M,MA,ME,J,V,S,D)\n arg2 : Start time (H:MM)\n arg3 : End time (H:MM)",
			"Displays all rooms ranked by capacity (descending order). No arguments needed.",
			"Display a graph showing how much each room is used during the week. No arguments needed.",
			"Generates an iCalendar (.ics) file for the selected University Courses (UEs) over a specified date range. \n Usage: icalendar [FILE_CRU] AAAA-MM-JJ_start AAAA-MM-JJ_end UE1 UE2 [...] [filename.ics] \n Note: You can pass the .cru file as the first argument, or use 'parseFile' beforehand.",
            "Parses the given file, if it contains no errors.\n Usage : parseFile PATH_TO_FILE\n Example usage : parseFile ./edt.cru",
			"Exit the application. No arguments needed",
			"Shows all of the currently parsed data. No arguments needed",
			"",
		]
		console.log("\n\n\n\n\n")
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		let mainAnalyzer = new CRUParser()
		logger.info("Interactive mode. Type 'exit' to quit.");
		logger.info("Type 'help' to see available commands.");

		const loop = () => {
			rl.question('> ', async (line) => {
				const input = line.trim();
				if (!input) {
					return loop();
				}

				if (input === 'exit' || input === 'quit') {
					rl.close();
					logger.info("Bye!");
					return;
				}

				// TODO: parse the command
				// e.g. "capaciteMax mon.cru S104"
				const [cmd, ...rest] = input.split(/\s+/);

				// Example of simple dispatch:
				switch (cmd) {
					case 'help':
						for (let i in helpCmds){
							logger.info("Command : "+helpCmds[i])
							logger.info("Description : "+helpCmdsDesc[i])
							console.log("\n")
						}
						break;
					case 'capaciteMax':
						// call your JS helper, or maybe call cli.run([...]) (see option B)
						if (!rest[0]){
							logger.warn("No argument selected, please enter a room to search for.")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						capaciteSalle(mainAnalyzer,rest[0])
						break;
					case 'classementCapacite':
						// call your JS helper, or maybe call cli.run([...]) (see option B)
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						classementCapacite(mainAnalyzer)
						break;
					case 'occupation':
						// call your JS helper, or maybe call cli.run([...]) (see option B)
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						tauxOccupation(mainAnalyzer)
						break;
          			case "icalendar" :
                        // PATCH: Détection et chargement automatique du fichier .cru s'il est fourni en 1er argument
                        if (rest.length > 0 && rest[0].endsWith('.cru')) {
                            const filename = rest.shift(); // On retire le fichier des arguments pour la suite
                            try {
                                const data = fs.readFileSync(filename, 'utf8');
                                mainAnalyzer.parse(data);
                                logger.info(`Fichier ${filename} parsé avec succès.`.green);
                            } catch (err) {
                                logger.warn(`Impossible de lire le fichier ${filename} : ${err.message}`.red);
                                break;
                            }
                        }

						if (rest.length < 3) {
							logger.warn("Arguments manquants. Usage : icalendar [FILE_CRU] AAAA-MM-JJ_start AAAA-MM-JJ_end UE1 [UE2 ...] [filename.ics]")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0) {
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}

						const startDate = rest[0];
						const endDate = rest[1];
						
						let outputName = 'schedule_export.ics';
						let uesList = rest.slice(2);
						
						if (uesList.length > 0 && uesList[uesList.length - 1].toLowerCase().endsWith('.ics')) {
							outputName = uesList.pop();
						}
						
						if (uesList.length === 0) {
						    logger.warn("Aucune UE spécifiée pour l'export.");
						    break;
						}

						genererIcal(startDate, endDate, uesList, outputName, mainAnalyzer);
						break;

					case 'sallesCours':
						if (!rest[0]){
							logger.warn("No argument selected, please enter a lecture to search for.")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						sallesCours(mainAnalyzer, rest[0]);
						break;

					case 'dispoSalle':
						if (!rest[0]){
							logger.warn("No argument selected, please enter a room to search for.")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						disponibilitesSalle(mainAnalyzer, rest[0], rest[1], rest[2])
						break;
						
					case 'sallesDispo':
						if (!rest[0]){
							logger.warn("No argument 1 selected, please enter a Day (L, MA, ME, J, V, S, D).")
							break;
						}
						if (!rest[1]){
							logger.warn("No argument 2 selected, please enter a start time (EX: 8:00).")
							break;
						}
						if (!rest[2]){
							logger.warn("No argument 3 selected, please enter an end time (EX: 8:00).")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						
						sallesDisponibles(mainAnalyzer, rest[0], rest[1], rest[2])
						break;

					case 'parseFile':
						if (!rest[0]){
							logger.warn("No file selected, please select a file to parse.");
							break;
						}
						let newParser = new CRUParser()
						fs.readFile(rest[0], 'utf8', function (err,data){
							if(err){
								logger.error("Le fichier .cru passé n'existe pas");
								return;
							}
							newParser.parse(data);
							if(newParser.errorCount>0){
								logger.warn("File contains error(s).")
							}
							mainAnalyzer.parse(data)
						});
						break;
					case 'showData'	:
						if(!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No parsed data, please parse at least one file.")
							break;
						}
						mainAnalyzer.getParsedCRU()
						break;
					default:
						logger.warn(`Unknown command: ${cmd}`);
				}


				loop(); // ask next line
			});
		};

		loop();
	})

	.command('capaciteMax','Get the maximum capacity for a given room')
	.argument('<file>', 'The file to check with Vpf parser')
	.argument('<roomId>', 'The room id to get the maximum capacity from')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			capaciteSalle(analyzer, args.roomId);
		});
	})

	.command('sallesCours','Get the rooms for a given course')
	.argument('<file>', 'The file to check with Vpf parser')
	.argument('<courseId>', 'The course id to get the rooms from')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			sallesCours(analyzer, args.courseId);
		});
	})

	.command('dispoSalle','Get the availability of a given room')
	.argument('<file>', 'The file to check with Vpf parser')
	.argument('<roomId>', 'The room id to get the availability from')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			disponibilitesSalle(analyzer, args.roomId);
		});
	})

	.command('qualiteData','Get the data quality of a given file')
	.argument('<file>', 'The file to get the data quality from')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			verifierRecouvrements(analyzer);
		});
	})

	.command('sallesDispo', 'Get the available rooms for a given time')
	.argument('<file>', 'The file to check with Vpf parser')
	.argument('<day>', 'Day of the week (L, MA, ME, J, V, S, D)')
	.argument('<startTime>', 'Start time in HH:MM format')
	.argument('<endTime>', 'End time in HH:MM format')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}

			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			sallesDisponibles(analyzer, args.day, args.startTime, args.endTime);
		});
	})

	// *******************************************************************
	// COMMANDE ICALENDAR (MODE LIGNE DE COMMANDE DIRECTE)
	// *******************************************************************
	.command('icalendar', 'Génère un fichier iCalendar pour les UEs entre 2 dates.')
	.argument('<file>', 'Le fichier CRU à parser.')
	.argument('<startDate>', 'Date de début de la période (YYYY-MM-DD).')
	.argument('<endDate>', 'Date de fin de la période (YYYY-MM-DD).')
	.argument('<ues...>', 'Liste des UEs à inclure, séparées par des espaces (ex: LE01 MT03).')
    .option('-o, --output <filename>', 'Nom du fichier de sortie iCalendar (inclure .ics)', { default: 'schedule_export.ics', validator: cli.STRING })
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
			
			// Création d'un analyzer local pour la commande CLI. 
            // On peut aussi utiliser l'analyzer global importé si c'est la seule source de données
			var analyzer = new CRUParser(); 
			analyzer.parse(data); 
			
			if (analyzer.errorCount === 0 && Object.keys(analyzer.parsedCRU).length > 0) {
				// Utiliser l'analyzer local pour passer les données à genererIcal
				genererIcal(args.startDate, args.endDate, args.ues, options.output, analyzer);
			} else {
				logger.info("Impossible de parser le fichier CRU pour l'export iCalendar.".red);
			}
		});
	})

	// *******************************************************************
	// COMMANDES D'ANALYSE ET GRAPHIQUES (A FAIRE)
	// *******************************************************************
	.command('classementCapacite','Display rooms ranked by capacity (descending order)')
	.argument('<file>', 'The file to check with CRU parser')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			classementCapacite(analyzer);
		});
	})

	.command('occupation','Display a graph showing how much each room is used during the week')
	.argument('<file>', 'The file to check with CRU parser')
	.action(({args, options, logger}) => {
		fs.readFile(args.file, 'utf8', function (err,data){
			if (err){
				return logger.warn(err);
			}
			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			tauxOccupation(analyzer);
		});
	})

	// readme
	//.command('readme', 'Display the README.txt file')
	//.action(({args, options, logger}) =>
	//  ...
	//})
	
	
		

	
cli.run(process.argv.slice(2));