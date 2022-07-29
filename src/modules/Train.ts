import type { Path } from "two.js/src/path";
import type { ILine, ILink, IPassenger, ITrain, Position } from "../types";
import type { GameRenderer } from "./GameRenderer";
import { Storage } from "./Storage";
import trainsJSON from "../data/trains/rer.json";
import type { Line } from "./Line";
import { lines } from "../stores";
import { GameObject } from "./GameObject";

export class Train extends GameObject implements ITrain {
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
        super();

        this.id = id;
        this.info = trainType.info;
        this.location = JSON.parse(JSON.stringify(trainType.location));
        this.element = null;
        this.passengers = [];
    }

    disembarkPassengers(renderer: GameRenderer, line: Line, currentStationId: number) {
        const currentStation = renderer.stations[currentStationId];
        const newStation = renderer.stations[line.stationIds[this.location.stationIndex]];

        let passengerServed = 0;
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
                    passengerServed++;
            }
        }

        return passengerServed;
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

    update(renderer: GameRenderer, line: Line, timeDelta: number) {
        if (this.location.stopped) {
            // Check if this stopping time is over
            if (this._gameData.time.seconds - this.location.stoppedTime >= line.trainSchedule.stoppingTimeSeconds) {
                this.location.stopped = false;
            } else
                return 0;
        }

        // train Animation
        if (!renderer.tracks) {
            return 0;
        }

        // train is not moving and we can start it => start its schedule
        if (!this.location.currentLink) {
            if (this._gameData.time.seconds - line.trainSchedule.previousDepartureTime > line.trainSchedule.intervalSeconds) {
                this.location.stationIndex = 1;
                line.trainSchedule.previousDepartureTime = this._gameData.time.seconds;
                this.location.currentLink = renderer.links[line.stationIds[0]].find(l => l.to === line.stationIds[1]);

                // Check if passengers need to board
                this.boardPassengers(renderer, line, line.stationIds[0]);
            } else {
                return 0;
            }
        }

        let track: Path;
        // Get first track of link and its direction
        if (!track) {
            this.location.trackIsForward = true;
            let tracks = renderer.tracks[this.location.currentLink.from][this.location.currentLink.to];
            if (tracks.length === 0) {
                this.location.trackIsForward = false;
                tracks = renderer.tracks[this.location.currentLink.to][this.location.currentLink.from];
            }

            if (tracks.length !== 0) {
                track = this.location.trackIsForward ? tracks[tracks.length - 1] : tracks[0];
            }
        }

        this.element?.remove();
        if (track) {
            let point = track.getPointAt(this.location.trackIsForward ? (this.location.percent / 100) : 1 - (this.location.percent / 100), null);
            this.element = renderer.two.makeCircle(point.x, point.y, 1, 1);
            if (this.passengers.length > this.info.capacity)
                this.element.fill = renderer.overcrowdedColor;
            this.location.position = { x: point.x, y: point.y };
        }

        let stationFrom = renderer.stations[this.location.currentLink.from];
        let stationTo = renderer.stations[this.location.currentLink.to];

        let meters = Math.sqrt(Math.pow(stationFrom.position.x - stationTo.position.x, 2) + Math.pow(stationFrom.position.y - stationTo.position.y, 2));

        let metersByMillisecond = this.info.maxSpeed * 1000 / 360000;
        let distanceTraveled = metersByMillisecond * timeDelta * this._gameData.time.multiplicator;
        let distancePercent = distanceTraveled / meters;

        this.location.percent = this.location.percent + distancePercent;

        let passengersServed = 0;
        // train Reached Station
        if (this.location.percent > 100) {
            // Get the next station
            this.location.percent = 0;
            let currentStationId = line.stationIds[this.location.stationIndex];
            let currentStation = renderer.stations[currentStationId];
            this.location.stationIndex = this.location.reverseTrip ? this.location.stationIndex - 1 : this.location.stationIndex + 1;

            // Turn back if reached end of line
            if (this.location.stationIndex >= line.stationIds.length) {
                this.location.reverseTrip = true;
                this.location.stationIndex -= 2;
            } else if (this.location.stationIndex < 0) {
                this.location.reverseTrip = false;
                this.location.stationIndex = 0;
            }

            let newStationId = line.stationIds[this.location.stationIndex];

            // Get the next link
            this.location.currentLink = renderer.links[currentStationId].find(l => l.to === newStationId);
            track = undefined;

            // Pause the this for its stopping time
            this.location.stopped = true;
            this.location.stoppedTime = this._gameData.time.seconds;

            let prevPassengerCount = currentStation.waitingPassengers.length;
            // Check if passengers need to disembark
            passengersServed = this.disembarkPassengers(renderer, line, currentStationId);

            // Check if passengers need to board
            this.boardPassengers(renderer, line, currentStationId);

            // Check if the station needs to be redrawn
            renderer.checkStationForRedraw(prevPassengerCount, currentStation);
        }

        return passengersServed;
    }

    copy() {
        let t = new Train(this.id, this);
        t.passengers = JSON.parse(JSON.stringify(this.passengers));
        return t;
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