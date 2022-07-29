import type { Path } from "two.js/src/path";
import type { ILine, ILink, IPassenger, ITrain, Position } from "../types";
import type { GameRenderer } from "./GameRenderer";
import { Storage } from "./Storage";
import trainsJSON from "../data/trains/rer.json";
import type { Line } from "./Line";
import { lines } from "../stores";

export class Train implements ITrain {
    id: number;
    info: {
        name: string;
        maxSpeed: number;
        capacity: number;
    };
    location: {
        position: Position;
        running: boolean;
        stopped: boolean;
        stoppedTime: number;
        stationIndex: number;
        currentLink: ILink;
        percent: number;
        trackIsForward: boolean;
        reverseTrip: boolean;
    };
    element: Path;
    passengers: IPassenger[];

    constructor(id: number, trainType: ITrain) {
        this.id = id;
        this.info = trainType.info;
        this.location = JSON.parse(JSON.stringify(trainType.location));
        this.element = null;
        this.passengers = [];
    }

    disembarkPassengers(renderer: GameRenderer, line: Line, currentStationId: number) {
        const currentStation = renderer.stations[currentStationId];
        const newStation = renderer.stations[line.stationIds[this.location.stationIndex]];

        for (let i = 0; i < this.passengers.length; i++) {
            const p = this.passengers[i];

            // A Passenger needs to disembark if:
            // - It is at the end of its itinerary
            // - The next station on the itinerary is not the same as the next station of the train
            let currentStationItineraryIndex = p.itinerary.indexOf(currentStationId);
            if ((p.itinerary.length - 1 === currentStationItineraryIndex) || (p.itinerary[currentStationItineraryIndex + 1] !== newStation.id)) {
                // Disembark the passenger
                this.passengers.splice(i, 1);
                i--;

                // If the passenger is at the end of its itinerary, don't add it to the station waiting list
                if (p.itinerary.length - 1 != currentStationItineraryIndex)
                    currentStation.waitingPassengers.push(p);
                else
                    renderer.gameData.stats.passengersServed = renderer.gameData.stats.passengersServed + 1;
            }
        }
    }

    boardPassengers(renderer: GameRenderer, line: Line, currentStationId: number) {
        const currentStation = renderer.stations[currentStationId];
        const newStation = renderer.stations[line.stationIds[this.location.stationIndex]];

        for (let i = 0; i < currentStation.waitingPassengers.length; i++) {
            if (this.passengers.length > this.info.capacity)
                break;

            const p = currentStation.waitingPassengers[i];
            // A passenger can board if:
            // - The next station on the itinerary is the same as the next station of the train
            let currentStationItineraryIndex = p.itinerary.indexOf(currentStationId);
            if (p.itinerary[currentStationItineraryIndex + 1] === newStation.id) {
                // Board the passenger
                this.passengers.push(p);
                currentStation.waitingPassengers.splice(i, 1);
                i--;
            }
        }
    }

    copy() {
        return new Train(this.id, this);
    }

    static types: ITrain[] = [];

    /**
     * Inits train types from storage
     */
    static initTypes() {
        this.types = Storage.exists(Storage.keys.TRAINS)
            ? Storage.get(Storage.keys.TRAINS)
            : [];

        if (this.types.length === 0) {
            for (let i = 0; i < trainsJSON.length; i++) {
                const t = trainsJSON[i];

                this.types.push({
                    id: i,
                    info: {
                        name: t.info.name,
                        maxSpeed: parseInt(t.info.maxSpeed),
                        capacity: parseInt(t.info.capacity),
                    },
                    location: {
                        running: false,
                        stopped: false,
                        stoppedTime: 0,
                        stationIndex: 0,
                        currentLink: null,
                        percent: 0,
                        trackIsForward: true,
                        reverseTrip: false,
                        position: {
                            x: 0,
                            y: 0,
                        },
                    },
                    element: null,
                    passengers: [],
                });
            }
        }
    }

    static fromJSON(train: ITrain) {
        const t = new Train(train.id, train);
        return t;
    }

    /**
     * Adds a new train type
     * @param trainType new train type
     */
    static addType(trainType: ITrain) {
        trainType.id = Train.types.length;
        Train.types.push(trainType);
        Storage.save(Storage.keys.TRAINS, this.types);
    }

    /**
     * Edits a train type
     * @param trainType new train type
     */
    static editType(trainType: ITrain) {
        Train.types[trainType.id] = trainType;
        Storage.save(Storage.keys.TRAINS, this.types);
    }

    /**
     * Add a new Train to a line
     * @param typeId id of the train type to add
     * @param lineId id of the line to add the train to
     */
    static addToLine(typeId: number, line: Line) {
        const train = new Train(line.trains.length, Train.types[typeId]);
        line.trains.push(train);

        // Update the store
        lines.update(lines => { lines[line.id] = line; return lines; });
    }
}