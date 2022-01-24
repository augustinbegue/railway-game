import type Two from "src/two";

export interface GameTime {
    seconds: number;
    multiplicator: number;
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
    id: string;
    name: string;
    position: GeoPosition;
    linesIndex: number[];
    linkedTo: number[];
    size: number;
    circle?: any;
    text?: any;
}

// Graph Edges
export interface Link {
    from: number;
    to: number;
    tracks: number;
    drawn?: boolean;
}

export interface Line {
    id: string;
    name: string;
    color: string;
    stations: number[];
    hidden: boolean;
    trains: Train[];
}

export interface Train {
    info: {
        name: string;
        maxSpeed: number;
        capacity: number;
    };
    schedule: {
        startTimeSeconds: number;
        stoppingTimeSeconds: number;
    }
    location: {
        position: Position;
        running: boolean;
        stopped: boolean;
        stationIndex: number;
        currentLink: Link;
        percent: number;
        trackIsForward: boolean;
        reverseTrip: boolean;
    };
    element: Two.Shape;
}