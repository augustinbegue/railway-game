import { gameData, lines, trains, trainSchedules } from "../stores";
import type { Station } from "../types";
import type { Line } from "./Line";
import type { Train } from "./Train";

export class GameStorage {
    static readonly keys = {
        LINES: "lines",
        LINKS: "links",
        STATIONS: "stations",
        TRAINS: "trains",
        TRAIN_TYPES: "trainTypes",
        TRAIN_SCHEDULES: "trainSchedules",
        GAMEDATA: "gamedata",
    }

    static saveDynamic() {
        lines.update(lines => {
            localStorage.setItem(GameStorage.keys.LINES, JSON.stringify(lines));
            return lines;
        });
        trains.update(trains => {
            localStorage.setItem(GameStorage.keys.TRAINS, JSON.stringify(trains));
            return trains;
        });
        trainSchedules.update(trainSchedules => {
            localStorage.setItem(GameStorage.keys.TRAIN_SCHEDULES, JSON.stringify(trainSchedules));
            return trainSchedules;
        });
        gameData.update(gameData => {
            localStorage.setItem(GameStorage.keys.GAMEDATA, JSON.stringify(gameData));
            return gameData;
        });
    };

    static save(key: string, value: object) {
        switch (key) {
            case GameStorage.keys.TRAINS:
                value = (value as Train[][]).map((trains: Train[]) => trains.map((train: Train) => { return train.toJSON(); }));
                break;
            case GameStorage.keys.LINES:
                value = (value as Line[]).map((line: Line) => { return line.toJSON(); });
            case GameStorage.keys.STATIONS:
                value = (value as Station[]).map((station: Station) => {
                    station.circle = null;
                    station.text = null;
                    return station;
                });
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