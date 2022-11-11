import { Writable, writable } from "svelte/store";
import type { Line } from "./modules/Line";
import type { Train } from "./modules/Train";
import type { GameData, ITrainSchedule } from "./types";

export const lines: Writable<Line[]> = writable([]);

export const trains: Writable<Train[][]> = writable([]);

export const trainSchedules: Writable<ITrainSchedule[]> = writable([]);

export const gameData: Writable<GameData> = writable({
    time: {
        multiplicator: 1,
        seconds: 12 * 60 * 60,
        nextStationSpawn: 0,
    },
    stats: {
        passengersCreated: 0,
        passengersServed: 0,
    },
    settings: {
        stationStartNumber: 3,
        stationSpawnTime: 600,
        stationSpawnTimeVariation: 120,
        passengerArrivalInterval: 60,
        passengerArrivalIntervalVariation: 30,
    },
    economy: {
        money: 2000,
    },
    prices: {
        link: {
            buy: 100,
            maintain: 10,
        },
        train: {
            buy: 1000,
            maintain: 100,
        },
    },
});
