# Projet_GL02
Repo principal pour notre projet GL02, de gestion d'emploi du temps de salle de travail en université.

# Execution
Pour exécuter le programme, utilisez les commandes suivantes depuis la racine du projet (Projet_GL02) :

Verifier que npm est installé et a jour : 
```bash
npm install
```

Ensuite pour lancer notre application :
```bash
node Parseur/caporalCli.js start
```

Ensuite pour parser :
```bash
parseFile Parseur/valideEdt.cru
```

Nous pouvons par la suite utiliser des fonctions : 
```bash
help
capaciteMax
sallesCours
dispoSalle
sallesDispo
classementCapacite
occupation
icalendar
parseFile
showData
exit
```


info: Command : capaciteMax
info: Description : Returns the max capacity for a room. Use example : capaciteMax S104.
 At least a single .cru file containing the room needed to search for a room.


info: Command : sallesCours
info: Description : Gives the rooms for a given course. Use case : sallesCours LE02
 At least a single file containing the class to return results.


info: Command : dispoSalle
info: Description : Returns all the moments when the room is unoccupied.
 Usage : dispoSalle ROOM_ID arg1 arg2
 optional arguments :
 arg1 : start hour (H:MM) | arg2 : end hour (H:MM)


info: Command : sallesDispo
info: Description : Returns all the rooms unoccupied for a given moment.
 Usage : sallesDispo ROOM_ID arg1 arg2 arg3
 arguments : arg1 : Day (M,MA,ME,J,V,S,D)
 arg2 : Start time (H:MM)
 arg3 : End time (H:MM)


info: Command : classementCapacite
info: Description : Displays all rooms ranked by capacity (descending order). No arguments needed.


info: Command : occupation
info: Description : Display a graph showing how much each room is used during the week. No arguments needed.        


info: Command : icalendar
info: Description : Generates an iCalendar (.ics) file for the selected University Courses (UEs) over a specified da
te range.
 Usage: icalendar FILE_CRU AAAA-MM-JJ (start) AAAA-MM-JJ (end) UE1 UE2 [...]  output.ics
 Option: <filename> to set the custom output filename.


info: Command : parseFile
info: Description : Parses the given file, if it contains no errors.
 Usage : parseFile PATH_TO_FILE
 Example usage : parseFile ./edt.cru


info: Command : exit
info: Description : Exit the application. No arguments needed


info: Command : showData
info: Description : Shows all of the currently parsed data. No arguments needed
