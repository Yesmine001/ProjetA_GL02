
class Creneau {
    constructor(day, startHour, startMinute, endHour, endMinute, room, cours, nbStudents) {

        if ((room === null && cours !== null) || (room !== null && cours === null)) {
            throw new Error("Both room and cours must be either null or non-null");
        }

        if (startHour > endHour || (startHour === endHour && startMinute > endMinute)) {
            throw new Error("Start time must be before end time");
        }

        this.day = day;
        this.startHour = startHour;
        this.startMinute = startMinute;
        this.endHour = endHour;
        this.endMinute = endMinute;
        this.nbStudents = nbStudents;

        this.room = room;
        this.cours = cours;

        // Normaliser en minutes pour check plus facilement les overlaps
        this.startTotalMinutes = day * (60 * 24) + startHour * 60 + startMinute;
        this.endTotalMinutes = day * (60 * 24) + endHour * 60 + endMinute;
    }

    static nonAttributed(day, startHour, startMinute, endHour, endMinute, nbStudents) {
        return new Creneau(day, startHour, startMinute, endHour, endMinute, null, null, nbStudents);
    }

    static attributed(day, startHour, startMinute, endHour, endMinute, room, cours, nbStudents) {
        return new Creneau(day, startHour, startMinute, endHour, endMinute, room, cours, nbStudents);
    }

    isAttributed() {
        return this.room !== null && this.cours !== null;
    }

    overlapsWith(other) {
        return !(this.endTotalMinutes <= other.startTotalMinutes || this.startTotalMinutes >= other.endTotalMinutes);
    }

}


class Room {
    constructor(name) {
        this.name = name;
        this.creneaux = [];
        this.capacity = 0;
    }

    addCrenau(creneau) {
        if (!this.isAvailableAtCreneau(creneau)) {
            throw new Error("Creneau overlaps with an existing one for this room")
        }
        this.creneaux.push(creneau);

        // Mettre à jour la capacité de la salle si nécessaire
        if (creneau.nbStudents > this.capacity) {
            this.capacity = creneau.nbStudents;
        }
    }

    // Retoourne les créneaux disponibles dans la salle entre les horaires données pour n'importe quel jour
    getAvailableSlots(minHour, minMinute, maxHour, maxMinute) {

        if (minHour > maxHour || (minHour === maxHour && minMinute >= maxMinute)) {
            throw new Error("Begin time must be before end time");
        }

        // Sort les créneaux par temps
        this.creneaux.sort((a, b) => a.startTotalMinutes - b.startTotalMinutes);


        const availableSlots = [];
        let lastCreneau = Creneau.nonAttributed(0, 0, 0, 0, 0, 0);

        for (let creneau of this.creneaux.concat([Creneau.nonAttributed(6, 23, 60, 0, 0, 0)])) {


            let lastEndMinute = lastCreneau.endMinute
            let lastEndHour = lastCreneau.endHour
            let lastDay = lastCreneau.day

            // Traite les jours entre deux
            while (lastDay < creneau.day) {
                const startMinute = Math.max(lastEndMinute, minMinute);
                const startHour = Math.max(lastEndHour, minHour);

                const endMinute = maxMinute;
                const endHour = maxHour;

                if (startHour < endHour || (startHour == endHour && startMinute < endMinute)) {
                    availableSlots.push(Creneau.nonAttributed(lastDay, startHour, startMinute, endHour, endMinute, 0));
                }

                lastDay += 1
                lastEndHour = minHour
                lastEndMinute = minMinute
            }


            const startHour = Math.max(lastEndHour, minHour);
            const startMinute = startHour == minHour ? Math.max(lastEndMinute, minMinute) : lastEndMinute;


            const endHour = Math.min(creneau.startHour, maxHour);
            const endMinute = endHour == maxHour ? Math.min(creneau.startMinute, maxMinute) : creneau.startMinute;

            if (startHour < endHour || (startHour == endHour && startMinute < endMinute)) {
                availableSlots.push(Creneau.nonAttributed(lastDay, startHour, startMinute, endHour, endMinute, 0));
            }

            lastCreneau = creneau

        }


        return availableSlots;
    }

    isAvailableAtCreneau(creneau) {
        for (let existingCreneau of this.creneaux) {
            if (creneau.overlapsWith(existingCreneau)) {
                return false;
            }
        }
        return true;
    }
}



class Cours {
    constructor(name) {
        this.name = name;
        this.creneaux = [];
    }

    addCrenau(newCreneau) {
        // Check overlaps avec les créneaux existants
        for (let creneau of this.creneaux) {
            if (newCreneau.overlapsWith(creneau)) {
                throw new Error("Creneau overlaps with an existing one for this course");
            }
        }
        this.creneaux.push(newCreneau);
    }


    getRooms() {
        const rooms = new Set();
        for (let creneau of this.creneaux) {
            rooms.add(creneau.room);
        }
        return Array.from(rooms);
    }


}

// Test
const cours1 = new Cours("MM01")
const room1 = new Room("C201")

const creneau1 = new Creneau(0, 10, 0, 12, 0, room1, cours1, 36)
const creneau2 = new Creneau(0, 14, 12, 18, 0, room1, cours1, 50)
cours1.addCrenau(creneau1)
room1.addCrenau(creneau1)
cours1.addCrenau(creneau2)
room1.addCrenau(creneau2)



console.log(cours1.getRooms())
