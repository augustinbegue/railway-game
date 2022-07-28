import type Two from "src/two";
import type { Circle } from "two.js/src/shapes/circle";
import type { Text } from "two.js/src/text";

export interface GameData {
    time: {
        multiplicator: number,
        seconds: number,
        nextStationSpawn: number,
    },
    stats: {
        passengersCreated: number,
        passengersServed: number,
    },
    settings: {
        stationStartNumber: number,
        stationSpawnTime: number,
        stationSpawnTimeVariation: number,
        passengerArrivalInterval: number,
        passengerArrivalIntervalVariation: number,
    }
}

export interface Position {
    x: number;
    y: number;
}

export interface GeoPosition {
    long: string;
    lat: string;
    x?: number;
    y?: number;
}

export interface GameMap {
    startLong: string;
    startLat: string;
    endLong: string;
    endLat: string;
    size?: number,
}

// Graph Vertices
export interface Station {
    id: number;
    name: string;
    position: GeoPosition;
    lineIds: number[];
    linkedTo: number[];
    size: number;
    circle?: Circle;
    text?: Text;
    spawned: boolean;
    // Passengers in the station
    waitingPassengers: Passenger[];
    // Max number of passengers that can be waiting at this station
    waitingPassengersMax: number;
    // Number of passengers arriving at this station per minute
    passengersArrivalRate: number;
    // Next time a passenger will arrive at this station
    nextPassengerArrival: number;
}

export interface Passenger {
    id: number;
    name: string;
    startStationId: number;
    endStationId: number;
    itinerary: number[];
    startTime: number;
    endTime: number;
    waiting: boolean;
}

// Graph Edges
export interface Link {
    from: number;
    to: number;
    tracks: number;
    drawn?: boolean;
}

export interface Line {
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
}

export interface Train {
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
        currentLink: Link;
        percent: number;
        trackIsForward: boolean;
        reverseTrip: boolean;
    };
    element: Two.Shape;
    passengers: Passenger[];
}