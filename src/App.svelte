<script lang="ts">
    import { onMount } from "svelte";
    import StationContextMenu from "./components/StationContextMenu.svelte";
    import { GameRenderer } from "./modules/renderer";
    import type { Map, Line, Station, Link, Position } from "./types";
    import Two from "two.js";
    import IconBarMenus from "./components/IconBarMenus.svelte";
    import TimeDisplayComponent from "./components/TimeDisplayComponent.svelte";
    import type { element } from "svelte/internal";

    let map: Map = {
        startLat: "49.06184534469902",
        startLong: "1.9905683951191235",
        endLat: "48.73086675443339",
        endLong: "2.800477633990632",
    };

    let stations: Station[] = [
        {
            id: "0",
            name: "Gare de Lyon",
            position: {
                lat: "48.844331423536104",
                long: "2.3743789755592752",
            },
            linesIndex: [0],
            linkedTo: [1, 4, 7],
            size: 10,
        },
        {
            id: "1",
            name: "Chatelet",
            position: {
                lat: "48.86214501019702",
                long: "2.3469808486242782",
            },
            linesIndex: [0],
            linkedTo: [0, 3, 5, 6],
            size: 10,
        },
        {
            id: "2",
            name: "Etoile",
            position: {
                lat: "48.8740320341854",
                long: "2.2954183548242755",
            },
            linesIndex: [0],
            linkedTo: [3],
            size: 10,
        },
        {
            id: "3",
            name: "Auber",
            position: {
                lat: "48.872953508800514",
                long: "2.3297494951888225",
            },
            linesIndex: [0],
            linkedTo: [1, 2],
            size: 10,
        },
        {
            id: "4",
            name: "Nation",
            position: {
                lat: "48.84887653031363",
                long: "2.397037739771677",
            },
            linesIndex: [0],
            linkedTo: [0, 8],
            size: 10,
        },
        {
            id: "5",
            name: "Gare du Nord",
            position: {
                lat: "48.881041137398256",
                long: "2.3553216153040224",
            },
            linesIndex: [1],
            linkedTo: [1],
            size: 10,
        },
        {
            id: "6",
            name: "Saint-Michel",
            position: {
                lat: "48.8537757118776",
                long: "2.3449661735682734",
            },
            linesIndex: [1],
            linkedTo: [1],
            size: 10,
        },
        {
            id: "7",
            name: "Maisons-Alfort",
            position: {
                lat: "48.80226232608523",
                long: "2.426887820649135",
            },
            linesIndex: [1],
            linkedTo: [0],
            size: 10,
        },
        {
            id: "8",
            name: "Vincennes",
            position: {
                lat: "48.84731139381693",
                long: "2.4332493504876904",
            },
            linesIndex: [1],
            linkedTo: [4],
            size: 10,
        },
    ];

    let lines: Line[] = [
        {
            id: "1",
            name: "RER A",
            stations: [8, 4, 0, 1, 3, 2],
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
            stations: [6, 1, 5],
            color: "#7ba4db",
            hidden: true,
            trains: [],
        },
        {
            id: "4",
            name: "RER D",
            stations: [7, 0, 1, 5],
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

    // Drawing constants
    let renderer: GameRenderer;

    // onClick station
    let hoveredStation: Station | null = null;
    let selectedStation: Station | null = null;
    let stationContextMenuOpen: boolean = false;

    onMount(() => {
        renderer = new GameRenderer(map, stations, lines);

        document.body.onwheel = (e) => {
            const amount = e.deltaY / 100;
            let ratio =
                1 -
                (renderer.two.scene.scale - amount) / renderer.two.scene.scale;

            console.log(amount, ratio);

            if (renderer.two.scene.scale - amount >= 0.5) {
                renderer.two.scene.scale -= amount;

                renderer.two.scene.translation.x +=
                    (e.clientX - renderer.two.scene.translation.x) * ratio;
                renderer.two.scene.translation.y +=
                    (e.clientY - renderer.two.scene.translation.y) * ratio;
            } else {
                ratio = 1 - 0.5 / renderer.two.scene.scale;

                renderer.two.scene.scale = 0.5;

                renderer.two.scene.translation.x +=
                    (e.clientX - renderer.two.scene.translation.x) * ratio;
                renderer.two.scene.translation.y +=
                    (e.clientY - renderer.two.scene.translation.y) * ratio;
            }
        };

        // Mouse Events
        let stationOnClick = (e: MouseEvent) => {
            stationContextMenuOpen = true;
        };

        let dragging = false;
        let dragStart = { x: 0, y: 0 };
        document.body.onmousedown = (e) => {
            dragging = true;
            dragStart = { x: e.clientX, y: e.clientY };

            if (hoveredStation) {
                selectedStation = hoveredStation;
                stationOnClick(e);
            } else {
            }
        };

        let mouse = new Two.Vector(0, 0);
        document.body.onmousemove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            if (dragging) {
                let dx = e.clientX - dragStart.x;
                let dy = e.clientY - dragStart.y;

                renderer.two.scene.translation.x += dx;
                renderer.two.scene.translation.y += dy;

                dragStart = { x: e.clientX, y: e.clientY };
            } else {
                let correctedMouse = new Two.Vector(
                    (mouse.x - renderer.two.scene.translation.x) /
                        renderer.two.scene.scale,
                    (mouse.y - renderer.two.scene.translation.y) /
                        renderer.two.scene.scale
                );

                for (let i = 0; i < stations.length; i++) {
                    const station = stations[i];

                    let v = new Two.Vector(
                        station.position.x - correctedMouse.x,
                        station.position.y - correctedMouse.y
                    );

                    const dist = Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));

                    if (dist < station.size) {
                        hoveredStation = station;
                        document.body.style.cursor = "pointer";
                        return;
                    } else {
                        document.body.style.cursor = "default";
                    }
                }

                hoveredStation = null;
            }
        };

        document.body.onmouseup = (e) => {
            dragging = false;
        };
    });
</script>

{#if renderer}
    <div class="w-full absolute z-20">
        <TimeDisplayComponent {renderer} />
    </div>
    <div class="h-full w-full absolute z-10">
        <IconBarMenus {renderer} />
        <div class="absolute w-full bottom-0">
            <StationContextMenu
                {renderer}
                open={stationContextMenuOpen}
                station={selectedStation}
            />
        </div>
    </div>
{/if}

<style lang="postcss" global>
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
</style>
