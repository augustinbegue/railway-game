import type { Line } from "./Line";
import type { Train } from "./Train";

export class Storage {
    static readonly keys = {
        LINES: "lines",
        LINKS: "links",
        STATIONS: "stations",
        TRAINS: "trains",
        TRAIN_TYPES: "trainTypes",
        TRAIN_SCHEDULES: "trainSchedules",
        GAMEDATA: "gamedata",
    }

    static save(key: string, value: object) {
        switch (key) {
            case Storage.keys.TRAINS:
                value = (value as Train[][]).map((trains: Train[]) => trains.map((train: Train) => { return train.toJSON(); }));
                break;
            case Storage.keys.LINES:
                value = (value as Line[]).map((line: Line) => { return line.toJSON(); });
            default:
                break;
        }

        localStorage.setItem(key, JSON.stringify(value));
    }

    static exists(key): boolean {
        try {
            return JSON.parse(localStorage.getItem(key)) != null;
        } catch (error) {
            return null;
        }
    }

    static get(key): any {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    static reset() {
        window.location.reload();
        localStorage.clear();
    }
}