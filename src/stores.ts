import { Writable, writable } from "svelte/store";
import type { Line } from "./modules/Line";
import { Storage } from "./modules/Storage";
import type { GameData } from "./types";

export const lines: Writable<Line[]> = writable([]);

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
});