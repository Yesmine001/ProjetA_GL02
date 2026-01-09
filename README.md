# Projet GL02 - Gestionnaire d'Emploi du Temps Universitaire (SRU)

Application en ligne de commande pour la gestion et l'analyse des emplois du temps de l'Université centrale de la république de Sealand (SRU). Ce projet permet de parser, consulter et analyser les fichiers au format CRU (Course Room Usage) et de générer des exports au format iCalendar.

## Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Commandes disponibles](#-commandes-disponibles)
- [Exemples d'utilisation](#-exemples-dutilisation)
- [Structure du projet](#-structure-du-projet)
- [Tests](#-tests)
- [Auteurs](#-auteurs)
- [Licence](#-licence)

## Fonctionnalités

- **Parsing de fichiers CRU** : Analyse et validation des fichiers d'emploi du temps au format CRU (parseFile)
- **Consultation des salles** : Capacité maximale (capaciteMax), disponibilité (creneauxDispo et sallesDispo), occupation 
- **Recherche de cours** : Liste des salles associées à un cours donné (fonction sallesCours)
- **Analyse des créneaux** : Détection des conflits et recouvrements d'horaires
- **Classement** : Classement des salles par capacité par ordre décroissant.
- **Export iCalendar** : Génération de fichiers .ics compatibles avec les calendriers numériques
- **Visualisations** : Graphiques du taux d'occupation des salles (Vega-Lite)
- **Mode interactif** : Interface en ligne de commande avec auto-complétion

## Prérequis

- **Node.js** : version 16.x ou supérieure
- **npm** : version 7.x ou supérieure

## Installation et Execution
Pour exécuter le programme, utilisez les commandes suivantes depuis la racine du projet (Projet_GL02) :

Verifier que npm est installé et a jour : 
```bash
npm install
```

Ensuite pour lancer notre application :
```bash
node Parseur/caporalCli.js start
```

Ensuite pour parser un fichier :
```bash
parseFile Parseur/fichier.cru
La commande peut être utilisée plusieurs fois d'affilées pour parser plusieurs fichiers.
```

Nous pouvons par la suite utiliser des fonctions : 
```bash
help
capaciteMax (ex : capaciteMax P101)
sallesCours (ex : sallesCours AP03)
creneauxDispo (ex : creneauxDispo EXT1)
sallesDispo (ex : sallesDispo L 8:00 20:00)
classementCapacite
occupation
icalendar (ex : icalendar 2025-01-01 2025-05-12 AP03)
parseFile
showData 
exit
```

## Commandes

info: Commande : capaciteMax

info: Description : Renvoie la capacité maximale d'une salle. Exemple d'utilisation : capaciteMax S104.

Au moins un fichier .cru contenant les informations de la salle est nécessaire pour effectuer la recherche.

info: Commande : sallesCours

info: Description : Affiche les salles pour un cours donné. Exemple d'utilisation : sallesCours LE02

Au moins un fichier contenant la classe qui renvoie les résultats est nécessaire.

info: Commande : creneauxDispo
info: Description : Renvoie tous les moments où la salle est inoccupée.

Utilisation : creneauxDispo ROOM_ID arg1 arg2 ou creneauxDispo ROOM_ID

Arguments optionnels :

arg1 : heure de début (H:MM) | arg2 : heure de fin (H:MM)

info: Commande : sallesDispo

info: Description : Renvoie toutes les salles inoccupées à un instant donné. Utilisation : sallesDispo ROOM_ID arg1 arg2 arg3

Arguments : arg1 : Jour (L, MA, ME, J, V, S, J)

arg2 : Heure de début (H:MM)

arg3 : Heure de fin (H:MM)

Info : Commande : classementCapacite

Info : Description : Affiche toutes les salles classées par capacité (ordre décroissant). Aucun argument requis.

Info : Commande : occupation

Info : Description : Affiche un graphique montrant le taux d'utilisation de chaque salle au cours de la semaine. Aucun argument requis.

Info : Commande : icalendar

Info : Description : Génère un fichier iCalendar (.ics) pour les cours universitaires sélectionnés sur une période spécifiée.

Utilisation : icalendar FILE_CRU AAAA-MM-JJ (début) AAAA-MM-JJ (fin) UE1 UE2 [...] output.ics

Option : <nom_de_fichier> pour définir le nom du fichier de sortie personnalisé.

## Auteurs
**Équipe les Téssécink :**
Antonin JACROT
Baptiste CORDIER
Tristan CREMONA
Jules BARBE
Nicolas ANTOINE

**Équipe Javaholics :** 🍻
Thomas CHARPENTIER
Ilias CHOUHIB
Gabriel EWENCZYK
Yasmine FATHALLAH
Mohamad FAWAZ

## Licence
Ce projet est publié sous licence MIT.
Cette licence autorise l’utilisation, la copie, la modification et la redistribution du code source, sous réserve de conserver les mentions de copyright ainsi que la référence aux équipes de développement **Téssécink** et **Javaholics**.

## Signaler un bug
Pour signaler un bug ou proposer une amélioration, veuillez créer une issue sur le dépôt GitHub.

**Note** : Ce projet est un travail universitaire réalisé dans le cadre du cours de Génie Logiciel (GL02).