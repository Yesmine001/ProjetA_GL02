const fs = require('fs');
const colors = require('colors');
const CRUParser = require('./CRUParser.js');
const readline = require('readline');

const {capaciteSalle, sallesCours, disponibilitesSalle, verifierRecouvrements, sallesDisponibles} = require('../fonction/fonction.js');

const vg = require('vega');
const vegalite = require('vega-lite');
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
	  
			var analyzer = new CRUParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);
			
			if(analyzer.errorCount === 0 && Object.keys(analyzer.parsedCRU).length > 0){
				logger.info("The .cru file is a valid cru file".green);
			}else{
				logger.info("The .cru file contains error, contains no UE or is in the wrong format".red);
			}
			
			logger.debug(analyzer.parsedCRU);

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
		let helpCmds = ["capaciteMax", "sallesCours", "dispoSalle", "sallesDispo", "parseFile", "exit","showData"];
		let helpCmdsDesc = [
			"Returns the max capacity for a room. Use example : capaciteMax S104. \n At least a single .cru file containing the room needed to search for a room.",
			"Gives the rooms for a given course. Use case : sallesCours LE02\n At least a single file containing the class to return results.",
			"Returns all the moments when the room is unoccupied.\n Usage : dispoSalle ROOM_ID arg1 arg2\n optional arguments :\n arg1 : start hour (H:MM) | arg2 : end hour (H:MM)",
			"Returns all the rooms unoccupied for a given moment.\n Usage : sallesDispo ROOM_ID arg1 arg2 arg3\n arguments : arg1 : Day (M,MA,ME,J,V,S,D)\n arg2 : Start time (H:MM)\n arg3 : End time (H:MM)",
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
						disponibilitesSalle(mainAnalyzer,rest[0])
						break;
					case 'sallesDispo':
						if (!rest[0]){
							logger.warn("No argument 1 selected, please enter a room to search for.")
							break;
						}
						if (!rest[1]){
							logger.warn("No argument 2 selected, please enter a start time (EX: 8:00).")
							break;
						}
						if (!rest[2]){
							logger.warn("No argument 2 selected, please enter an end time (EX: 8:00).")
							break;
						}
						if (!mainAnalyzer.parsedCRU || Object.keys(mainAnalyzer.parsedCRU).length === 0){
							logger.warn("No data parsed, please include at least a single .cru file.")
							break;
						}
						disponibilitesSalle(mainAnalyzer, rest[0], rest[1], rest[2])
						break;
					case 'parseFile':
						if (!rest[0]){
							logger.warn("No file selected, please select a file to parse.");
							break;
						}
						let newParser = new CRUParser()
						fs.readFile(rest[0], 'utf8', function (err,data){
							newParser.parse(data);
							if(newParser.errorCount>0){
								logger.warn("File contains error : Unable to add data, please fix data first")
								return
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

			// Validation des arguments jour et heures
			if (Creneau.jours.indexOf(args.day) === -1) {
				return logger.warn("Invalid day argument");
			}

			// Validation des arguments heureDebut et heureFin
			const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
			if (!timeRegex.test(args.startTime) || !timeRegex.test(args.endTime)) {
				return logger.warn("Invalid time format. Please use HH:MM format.");
			}

			var analyzer = new CRUParser(false, false);
			analyzer.parse(data);
			sallesDisponibles(analyzer, args.day, args.startTime, args.endTime);
		});
	})

	// readme
	//.command('readme', 'Display the README.txt file')
	//.action(({args, options, logger}) =>
	//  ...
	//})
	
	
		

	
cli.run(process.argv.slice(2));
	