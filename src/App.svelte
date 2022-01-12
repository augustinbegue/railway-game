<script lang="ts">
    import { onMount } from "svelte";
    import Two from "two.js";

    import type { Map, Line, Station, Link, Position } from "./types";

    let map: Map = {
        width: 10000,
        height: 10000,
    };

    let stations: Station[] = [
        {
            id: "0",
            name: "Gare de Lyon",
            position: {
                x: 750,
                y: 450,
            },
            linesIndex: [0],
            linkedTo: [1, 4],
        },
        {
            id: "1",
            name: "Chatelet",
            position: {
                x: 550,
                y: 400,
            },
            linesIndex: [0],
            linkedTo: [0, 3, 5, 6],
        },
        {
            id: "2",
            name: "Etoile",
            position: {
                x: 100,
                y: 350,
            },
            linesIndex: [0],
            linkedTo: [3],
        },
        {
            id: "3",
            name: "Auber",
            position: {
                x: 350,
                y: 350,
            },
            linesIndex: [0],
            linkedTo: [1, 2],
        },
        {
            id: "4",
            name: "Nation",
            position: {
                x: 820,
                y: 410,
            },
            linesIndex: [0],
            linkedTo: [0],
        },
        {
            id: "5",
            name: "Gare du Nord",
            position: {
                x: 500,
                y: 220,
            },
            linesIndex: [1],
            linkedTo: [1],
        },
        {
            id: "6",
            name: "Saint-Michel",
            position: {
                x: 570,
                y: 450,
            },
            linesIndex: [1],
            linkedTo: [1],
        },
    ];

    let lines: Line[] = [
        {
            id: "1",
            name: "RER A",
            stations: [4, 0, 1, 3, 2],
        },
        {
            id: "2",
            name: "RER B",
            stations: [6, 1, 5],
        },
    ];

    // Drawing constants
    let two: Two;
    let STATION_RADIUS = 10;

    function render() {
        two = new Two({
            fullscreen: true,
            autostart: true,
        }).appendTo(document.body);

        // Build the links graph adjacency matrix
        let links: Link[][] = [];

        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];
            links[i] = [];

            for (let j = 0; j < station.linkedTo.length; j++) {
                let link: Link = {
                    from: i,
                    to: station.linkedTo[j],
                    tracks: 2,
                    line: undefined,
                };

                links[i].push(link);
            }
        }

        console.log(links);

        // Draw each link between stations
        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];

            for (let j = 0; j < station.linkedTo.length; j++) {
                drawLink(two, links, i);
            }
        }

        for (let k = 0; k < stations.length; k++) {
            const station = stations[k];

            let circle = two.makeCircle(
                station.position.x,
                station.position.y,
                STATION_RADIUS,
            );
            circle.fill = "#8f9ebf";
            circle.clip = false;
            circle.noStroke();

            let text = two.makeText(
                station.name,
                station.position.x,
                station.position.y - STATION_RADIUS * 2,
                {},
            );

            text.size = 20;
            text.linewidth = 0.3;
            text.noStroke();
            text.fill = "#d6d9df";
            text.family = "Product Sans";
        }
    }

    function drawLink(two: Two, links: Link[][], from: number) {
        let linkAdjList = links[from];

        for (let i = 0; i < linkAdjList.length; i++) {
            const link = linkAdjList[i];

            if (link.line) {
                continue;
            }

            let fromStation = stations[from];
            let toStation = stations[link.to];

            let fromPosition = fromStation.position;
            let toPosition = toStation.position;

            link.line = two.makeLine(
                fromPosition.x,
                fromPosition.y,
                toPosition.x,
                toPosition.y,
            );
            link.line.linewidth = 6;
            link.line.stroke = "#626c80";

            let oppositelink = links[link.to].find((l) => l.to === from);
            console.log(oppositelink, link.to, from);
            oppositelink.line = link.line;
        }
    }

    onMount(() => {
        render();

        document.body.onwheel = (e) => {
            two.scene.scale -= e.deltaY / 1000;
            if (two.scene.scale < 0.1) {
                two.scene.scale = 0.1;
            }
        };

        let dragging = false;
        let dragStart: Position = { x: 0, y: 0 };
        document.body.onmousedown = (e) => {
            dragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
        };

        document.body.onmousemove = (e) => {
            if (!dragging) {
                return;
            }

            let dx = e.clientX - dragStart.x;
            let dy = e.clientY - dragStart.y;

            two.scene.translation.x += dx;
            two.scene.translation.y += dy;

            dragStart = { x: e.clientX, y: e.clientY };
        };

        document.body.onmouseup = (e) => {
            dragging = false;
        };
    });

    // TODO: Data structure:
    // Graph containing stations as vertices and links as edges
</script>

<style lang="postcss">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
