import Two from "two.js";

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
}

// Graph Edges
export interface Link {
    from: number;
    to: number;
    tracks: number;
    line: Two.Line;
}

export interface Line {
    id: string;
    name: string;
    stations: number[];
}

