import type Two from "src/two";

export interface GameTime {
    seconds: number;
    multiplicator: number;
}

export interface Position {
    x: number;
    y: number;
}

export interface Map {
    width: number;
    height: number;
}

// Graph Vertices
export interface Station {
    id: string;
    name: string;
    position: Position;
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
    stats: {
        maxSpeed: number;
        capacity: number;
    };
    schedule: {
        startTimeSeconds: number;
        stoppingTimeSeconds: number;
    }
    location: {
        stopped: boolean;
        stationIndex: number;
        currentLink: Link;
        percent: number;
        trackIsForward: boolean;
        reverseTrip: boolean;
    };
    element: Two.Shape;
}