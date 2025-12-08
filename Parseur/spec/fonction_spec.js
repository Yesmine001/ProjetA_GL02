const { capaciteSalle, sallesCours, disponibilitesSalle, verifierRecouvrements, sallesDisponibles, classementCapacite, tauxOccupation } = require('../../fonction/fonction');
const colors = require('colors');


describe("Unit testing of capaciteSalle", function () {

    beforeAll(function () {
        colors.disable();
    });

    it("peut trouver la capacité maximale d'une salle existante", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A101")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };


        expect(capaciteSalle(analyzer, "A101")).toBe(50);
    });

    it("gère le cas où la salle n'existe pas", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A101")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(capaciteSalle(analyzer, "C303")).toBeUndefined()

    });


});


describe("Unit testing of sallesCours", function () {

    beforeAll(function () {
        colors.disable();
    });

    it("peut trouver les salles pour un cours existant", function () {
        const analyzer = {
            parsedCRU: {
                "LE02": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A102"),
                    new (require('../Creneau'))("D3", 40, "V", ["10", "00"], ["12", "00"], "F3", "A101")
                ],
                "AP1B": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(sallesCours(analyzer, "LE02")).toEqual(["A101", "A102"]);

    });

    it("gère le cas où le cours n'existe pas", function () {
        const analyzer = {
            parsedCRU: {
                "LE02": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A102"),
                    new (require('../Creneau'))("D3", 40, "V", ["10", "00"], ["12", "00"], "F3", "A101")
                ],
                "AP1B": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(sallesCours(analyzer, "LE99")).toBeUndefined();
    });


});


describe("Unit testing of disponibilitesSalle", function () {

    beforeAll(function () {
        colors.disable();
    });

    it("peut trouver les disponibilités pour une salle existante", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A101"),
                    new (require('../Creneau'))("D3", 40, "L", ["12", "00"], ["13", "00"], "F3", "A101")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        console.log = jasmine.createSpy("logSpy");

        disponibilitesSalle(analyzer, "A101", "8:00", "18:00");

        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - L :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 9:00");
        expect(console.log).toHaveBeenCalledWith("De 11:00 à 12:00");
        expect(console.log).toHaveBeenCalledWith("De 13:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - MA :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - ME :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - J :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - V :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - S :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
        expect(console.log).toHaveBeenCalledWith("Disponibilités pour la salle A101 - D :");
        expect(console.log).toHaveBeenCalledWith("De 8:00 à 18:00");
    });

    it("gère le cas où la salle n'existe pas", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(disponibilitesSalle(analyzer, "C303", "8:00", "18:00")).toBeUndefined();

    });

    it("gère le cas où l'heure de début est après l'heure de fin", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                ],
            }
        };

        expect(disponibilitesSalle(analyzer, "A101", "18:00", "8:00")).toBeUndefined();

    });

    it("gère le cas où une des heures est invalide", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                ],
            }
        };

        expect(disponibilitesSalle(analyzer, "A101", "invalid", "18:00")).toBeUndefined();

    });


});

describe("Unit testing of verifierRecouvrements", function () {

    beforeAll(function () {
        colors.disable();
    });

    it("peut détecter des recouvrements dans une salle", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "L", ["10", "30"], ["12", "00"], "F2", "A101")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(verifierRecouvrements(analyzer)).toBeTrue();

    });

    it("indique l'absence de recouvrements", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["14", "00"], ["16", "00"], "F2", "A101")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "V", ["10", "00"], ["12", "00"], "F3", "B202")
                ]
            }
        };

        expect(verifierRecouvrements(analyzer)).toBeFalse();
    });

});



describe("Unit testing of sallesDisponibles", function () {

    beforeAll(function () {
        colors.disable();
    });

    it("peut trouver les salles disponibles dans un créneau donné", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["8", "00"], ["8", "30"], "F1", "A101"),
                    new (require('../Creneau'))("D2", 50, "M", ["9", "00"], ["11", "00"], "F2", "A102")
                ],
                "UE2": [
                    new (require('../Creneau'))("D1", 40, "L", ["10", "00"], ["12", "00"], "F3", "B202")
                ],
                "UE3": [
                    new (require('../Creneau'))("D1", 30, "L", ["8", "05"], ["8", "30"], "F1", "C203"),
                ]
            }
        };

        expect(sallesDisponibles(analyzer, "L", "8:00", "9:00")).toEqual(["A102", "B202"]);

    });

    it("gère le cas où l'heure de début est après l'heure de fin", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                ],
            }
        };

        expect(sallesDisponibles(analyzer, "L", "18:00", "8:00")).toBeUndefined();
        
    });

    it("gère le cas où une des heures est invalide", function () {
        const analyzer = {
            parsedCRU: {
                "UE1": [
                    new (require('../Creneau'))("D1", 30, "L", ["9", "00"], ["11", "00"], "F1", "A101"),
                ],
            }
        };

        expect(sallesDisponibles(analyzer, "L", "invalid", "18:00")).toBeUndefined();

    });


});