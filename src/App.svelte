<script lang="ts">
    import { onMount } from "svelte";
    import StationContextMenu from "./components/StationContextMenu.svelte";
    import { GameRenderer } from "./modules/renderer";
    import type { Map, Line, Station, Link, Position } from "./types";
    import Two from "two.js";
    import IconBarMenus from "./components/IconBarMenus.svelte";

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
            linkedTo: [1, 4, 7],
            size: 10,
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
            size: 10,
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
            size: 10,
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
            size: 10,
        },
        {
            id: "4",
            name: "Nation",
            position: {
                x: 820,
                y: 410,
            },
            linesIndex: [0],
            linkedTo: [0, 8],
            size: 10,
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
            size: 10,
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
            size: 10,
        },
        {
            id: "7",
            name: "Maisons-Alfort",
            position: {
                x: 1000,
                y: 650,
            },
            linesIndex: [1],
            linkedTo: [0],
            size: 10,
        },
        {
            id: "8",
            name: "Vincennes",
            position: {
                x: 1100,
                y: 400,
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
            stations: [4, 0, 1, 3, 2],
        },
        {
            id: "2",
            name: "RER B",
            stations: [6, 1, 5],
        },
    ];

    // Drawing constants
    let renderer: GameRenderer;

    // onClick station
    let hoveredStation: Station | null = null;
    let selectedStation: Station | null = null;
    let stationContextMenuOpen: boolean = false;

    onMount(() => {
        renderer = new GameRenderer(stations);

        document.body.onwheel = (e) => {
            renderer.two.scene.scale -= e.deltaY / 500;
            if (renderer.two.scene.scale < 0.1) {
                renderer.two.scene.scale = 0.1;
            }
            renderer.two.scene.translation.x += e.deltaY;
            renderer.two.scene.translation.y += e.deltaY;
        };

        // Mouse Events
        let stationOnClick = (e: MouseEvent) => {
            stationContextMenuOpen = true;
        };

        let dragging = false;
        let dragStart: Position = { x: 0, y: 0 };
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
    <div class="h-full w-full absolute z-10">
        <IconBarMenus {lines} />
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
