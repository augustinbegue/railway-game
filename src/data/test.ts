import type { Line, Station } from "../types";

export let stations: Station[] = [
    {
        id: 0,
        name: "Gare de Lyon",
        position: {
            lat: "48.844331423536104",
            long: "2.3743789755592752",
        },
        lineIds: [0],
        linkedTo: [1, 4, 7],
        size: 10,
    },
    {
        id: 1,
        name: "Chatelet",
        position: {
            lat: "48.86214501019702",
            long: "2.3469808486242782",
        },
        lineIds: [0],
        linkedTo: [0, 3, 5, 6],
        size: 10,
    },
    {
        id: 2,
        name: "Etoile",
        position: {
            lat: "48.8740320341854",
            long: "2.2954183548242755",
        },
        lineIds: [0],
        linkedTo: [3],
        size: 10,
    },
    {
        id: 3,
        name: "Auber",
        position: {
            lat: "48.872953508800514",
            long: "2.3297494951888225",
        },
        lineIds: [0],
        linkedTo: [1, 2],
        size: 10,
    },
    {
        id: 4,
        name: "Nation",
        position: {
            lat: "48.84887653031363",
            long: "2.397037739771677",
        },
        lineIds: [0],
        linkedTo: [0, 8],
        size: 10,
    },
    {
        id: 5,
        name: "Gare du Nord",
        position: {
            lat: "48.881041137398256",
            long: "2.3553216153040224",
        },
        lineIds: [1],
        linkedTo: [1],
        size: 10,
    },
    {
        id: 6,
        name: "Saint-Michel",
        position: {
            lat: "48.8537757118776",
            long: "2.3449661735682734",
        },
        lineIds: [1],
        linkedTo: [1],
        size: 10,
    },
    {
        id: 7,
        name: "Maisons-Alfort",
        position: {
            lat: "48.80226232608523",
            long: "2.426887820649135",
        },
        lineIds: [1],
        linkedTo: [0],
        size: 10,
    },
    {
        id: 8,
        name: "Vincennes",
        position: {
            lat: "48.84731139381693",
            long: "2.4332493504876904",
        },
        lineIds: [1],
        linkedTo: [4],
        size: 10,
    },
];

export let lines: Line[] = [
    {
        id: "1",
        name: "RER A",
        stationIds: [8, 4, 0, 1, 3, 2],
        color: "#da291c",
        hidden: false,
        trains: [
            {
                info: {
                    name: "Mi09 #1",
                    maxSpeed: 140,
                    capacity: 1300,
                },
                schedule: {
                    startTimeSeconds: 0,
                    stoppingTimeSeconds: 0,
                },
                location: {
                    running: false,
                    stopped: false,
                    stationIndex: 0,
                    currentLink: null,
                    percent: 0,
                    trackIsForward: true,
                    reverseTrip: false,
                },
                element: null,
            },
        ],
    },
    {
        id: "2",
        name: "RER B",
        stationIds: [6, 1, 5],
        color: "#7ba4db",
        hidden: true,
        trains: [],
    },
    {
        id: "4",
        name: "RER D",
        stationIds: [7, 0, 1, 5],
        color: "#007a53",
        hidden: true,
        trains: [
            {
                info: {
                    name: "Regio 2N #1",
                    maxSpeed: 140,
                    capacity: 1300,
                },
                schedule: {
                    startTimeSeconds: 0,
                    stoppingTimeSeconds: 0,
                },
                location: {
                    running: false,
                    stopped: false,
                    stationIndex: 0,
                    currentLink: null,
                    percent: 0,
                    trackIsForward: true,
                    reverseTrip: false,
                },
                element: null,
            },
        ],
    },
];