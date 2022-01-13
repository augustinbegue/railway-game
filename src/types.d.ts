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
    size: number;
    circle?: any;
    text?: any;
}

// Graph Edges
export interface Link {
    from: number;
    to: number;
    tracks: number;
    lines: Two.Line[];
}

export interface Line {
    id: string;
    name: string;
    stations: number[];
}

