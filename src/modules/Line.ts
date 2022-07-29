import { lines, trains, trainSchedules } from "../stores";
import type { ILine, ITrainSchedule } from "../types";
import { GameObject } from "./GameObject";
import type { GameRenderer } from "./GameRenderer";
import { GameStorage } from "./GameStorage";

export class Line extends GameObject implements ILine {
    id: number;
    name: string;
    color: string;
    stationIds: number[];
    hidden: boolean;

    constructor(id: number, line: ILine) {
        super();

        this.id = id;
        this.name = line.name;
        this.color = line.color;
        this.stationIds = JSON.parse(JSON.stringify(line.stationIds));
        this.hidden = line.hidden;
    }

    /**
     * Adds a station to the line
     * @param renderer GameRenderer
     * @param stationId id of the station to add to the line
     */
    addStation(renderer: GameRenderer, stationId: number) {
        let station = renderer.stations.find(station => station.id === stationId);
        let lastStationId = this.stationIds[this.stationIds.length - 1];
        let lastStation = renderer.stations.find(station => station.id === lastStationId);

        if (lastStation && !renderer.links[station.id].find(l => l.to === lastStation.id)) {
            renderer.createLink(lastStation, station);
        }

        // Add the station to the line
        this.stationIds = [...this.stationIds, stationId];
        station.lineIds = [...station.lineIds, this.id];

        // Update the store
        lines.update(lines => { lines[this.id] = this; return lines; });

        renderer.updatePassengersItineraries([station.id]);
    }

    /**
     * Removes a station from the line
     * @param renderer GameRenderer
     * @param stationId id of the station to remove from the line
     */
    removeStation(renderer: GameRenderer, stationId: number) {
        let station = renderer.stations[stationId];
        this.stationIds = this.stationIds.filter(id => id !== stationId);
        station.lineIds = station.lineIds.filter(lineId => lineId !== this.id);

        // Update the store
        lines.update(lines => { lines[this.id] = this; return lines; });

        renderer.updatePassengersItineraries([station.id]);
    }

    /**
     * Inserts a station in the line
     * @param renderer GameRenderer
     * @param stationId id of the station to insert before	
     * @param index index to insert the station at
     */
    insertStation(renderer: GameRenderer, stationId: number, index: number) {
        const station = renderer.stations[stationId];

        // Insert the station in the line
        this.stationIds.splice(index, 0, station.id);
        station.lineIds = [...station.lineIds, this.id];

        // Create the links between the stations
        const prevStation = index - 1 >= 0 ? renderer.stations.find(station => station.id === this.stationIds[index - 1]) : null;
        const nextStation = index + 1 < this.stationIds.length ? renderer.stations.find(station => station.id === this.stationIds[index + 1]) : null;
        if (prevStation && !renderer.links[station.id].find(l => l.to === prevStation.id)) {
            renderer.createLink(prevStation, station);
        }
        if (nextStation && !renderer.links[station.id].find(l => l.to === nextStation.id)) {
            renderer.createLink(station, nextStation);
        }

        // Update the store
        lines.update(lines => { lines[this.id] = this; return lines; });
        renderer.updatePassengersItineraries([station.id]);
    }

    /**
     * Copies the line
     * @returns deep copy of the line
     */
    copy() {
        return new Line(this.id, this);
    }

    /**
     * Inits the lines list from the Storage
     */
    static initLines() {
        let lineObjs: ILine[] = GameStorage.exists(GameStorage.keys.LINES)
            ? GameStorage.get(GameStorage.keys.LINES)
            : [];
        lines.set(lineObjs.map(line => {
            let l = new Line(line.id, line);
            return l;
        }));

        let scheduleObjs: ITrainSchedule[] = GameStorage.exists(GameStorage.keys.TRAIN_SCHEDULES)
            ? GameStorage.get(GameStorage.keys.TRAIN_SCHEDULES)
            : [];
        trainSchedules.set(scheduleObjs);
    }

    /**
     * creates a new line from a JSON object
     * @param lineObj Line object
     * @returns new Line
     */
    static fromJSON(lineObj: ILine) {
        const line = new Line(lineObj.id, lineObj);
        return line;
    }
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            stationIds: this.stationIds,
            hidden: this.hidden,
        };
    }

    /**
     * Adds a new line to the lines list
     * @param line Line object
     */
    static addLine(line: ILine, trainSchedule: ITrainSchedule) {
        lines.update(lines => {
            const id = lines.length;
            trains.update(trains => {
                trains[id] = [];
                return trains;
            });

            trainSchedules.update(trainSchedules => {
                trainSchedules[id] = trainSchedule;
                return trainSchedules;
            });

            lines = [...lines, new Line(id, line)];
            return lines;
        });
        GameStorage.saveDynamic();
    }

    /**
     * Edits a line
     * @param line Line object
     */
    static editLine(line: ILine, trainSchedule: ITrainSchedule) {
        lines.update(lines => {
            lines[line.id].name = line.name;
            lines[line.id].color = line.color;
            lines[line.id].stationIds = line.stationIds;
            lines[line.id].hidden = line.hidden;
            return lines;
        });
        trainSchedules.update(trainSchedules => {
            trainSchedules[line.id] = trainSchedule;
            return trainSchedules;
        });
        GameStorage.saveDynamic();
    }
}