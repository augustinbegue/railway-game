import type { ILine } from "../types";

export class Storage {
    static keys = {
        LINES: "lines",
        LINKS: "links",
        STATIONS: "stations",
        TRAINS: "trains",
        GAMEDATA: "gamedata",
    }

    static save(key: string, value: object) {
        switch (key) {
            case Storage.keys.LINES:
                value = (value as ILine[]).map(line => {
                    line.trains = line.trains.map(train => {
                        train.element = null;
                        return train;
                    })
                    return line;
                })
                break;

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