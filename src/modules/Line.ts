import { writable } from "svelte/store";
import { lines } from "../stores";
import type { ILine, ITrain } from "../types";
import { GameObject } from "./GameObject";
import type { GameRenderer } from "./GameRenderer";
import { Storage } from "./Storage";
import { Train } from "./Train";

export class Line extends GameObject implements ILine {
    id: number;
    name: string;
    color: string;
    stationIds: number[];
    hidden: boolean;
    trains: Train[];
    trainSchedule: {
        intervalSeconds: number;
        stoppingTimeSeconds: number;
        previousDepartureTime: number;
    }

    constructor(id: number, line: ILine) {
        super();

        this.id = id;
        this.name = line.name;
        this.color = line.color;
        this.stationIds = line.stationIds;
        this.hidden = line.hidden;
        this.trains = [];
        this.trainSchedule = JSON.parse(JSON.stringify(line.trainSchedule));

        this.store = writable(this);
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

        // TODO: Join store update and storage save
        // Save modified data
        Storage.save(Storage.keys.LINKS, renderer.links.map(links => links.map(link => {
            link.drawn = false;
            return link;
        })));
        Storage.save(Storage.keys.STATIONS, renderer.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));
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

        // Save modified data
        Storage.save(Storage.keys.STATIONS, renderer.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));
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

        // Create the links between the stations
        const prevStation = index - 1 >= 0 ? renderer.stations.find(station => station.id === this.stationIds[index - 1]) : null;
        const nextStation = index + 1 < this.stationIds.length ? renderer.stations.find(station => station.id === this.stationIds[index + 1]) : null;
        if (prevStation && !renderer.links[station.id].find(l => l.to === prevStation.id)) {
            renderer.createLink(prevStation, station);
        }
        if (nextStation && !renderer.links[station.id].find(l => l.to === nextStation.id)) {
            renderer.createLink(station, nextStation);
        }

        // Save modified data
        Storage.save(Storage.keys.LINKS, renderer.links.map(links => links.map(link => {
            link.drawn = false;
            return link;
        })));
        Storage.save(Storage.keys.STATIONS, renderer.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));
        // Update the store
        lines.update(lines => { lines[this.id] = this; return lines; });
        renderer.updatePassengersItineraries([station.id]);
    }

    /**
     * Copies the line
     * @returns deep copy of the line
     */
    copy() {
        let c = new Line(this.id, this);
        c.trains = this.trains.map(train => train.copy());
        return c;
    }

    /**
     * Inits the lines list from the Storage
     */
    static initLines() {
        let lineObjs: ILine[] = Storage.exists(Storage.keys.LINES)
            ? Storage.get(Storage.keys.LINES)
            : [];

        console.log("Init lines", lineObjs);

        lines.set(lineObjs.map(line => {
            let l = new Line(line.id, line);
            l.trains = line.trains.map(train => new Train(train.id, train));
            return l;
        }));
    }

    /**
     * creates a new line from a JSON object
     * @param lineObj Line object
     * @returns new Line
     */
    static fromJSON(lineObj: ILine) {
        const line = new Line(lineObj.id, lineObj);
        line.trains = lineObj.trains.map((train: ITrain) => Train.fromJSON(train));
        return line;
    }

    /**
     * Adds a new line to the lines list
     * @param line Line object
     */
    static addLine(line: ILine) {
        lines.update(lines => [...lines, new Line(lines.length, line)]);
    }

    /**
     * Edits a line
     * @param line Line object
     */
    static editLine(line: ILine) {
        lines.update(lines => {
            lines[line.id].name = line.name;
            lines[line.id].color = line.color;
            lines[line.id].stationIds = line.stationIds;
            lines[line.id].hidden = line.hidden;
            lines[line.id].trainSchedule = line.trainSchedule;
            return lines;
        });
    }
}