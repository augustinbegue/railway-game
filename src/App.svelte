<script lang="ts">
    import type { GameMap, Line, Station, Link, Position } from "./types";
    import Two from "two.js";
    import { onMount } from "svelte";
    import { GameRenderer } from "./modules/renderer";
    import StationContextMenu from "./components/StationContextMenu.svelte";
    import IconBarMenus from "./components/icon-bar-menus/IconBarMenus.svelte";
    import TimeDisplayComponent from "./components/TimeDisplayComponent.svelte";
    import stationsJSON from "./data/scraping/stations-rer.json";
    import { Storage } from "./modules/storage";

    let map: GameMap = {
        startLat: "49.467176211864015",
        startLong: "1.716613634109379",
        endLat: "48.18105026996368",
        endLong: "2.778065636995385",
    };

    let stations: Station[] = Storage.exists(Storage.keys.STATIONS)
        ? Storage.get(Storage.keys.STATIONS)
        : [];

    if (stations.length === 0) {
        for (let i = 0; i < stationsJSON.length; i++) {
            const s = stationsJSON[i];

            stations.push({
                id: i,
                name: s.stationName,
                position: {
                    lat: s.coordinates.lat,
                    long: s.coordinates.long,
                },
                lineIds: [],
                linkedTo: [],
                size: 10,
            });
        }
    }

    let lines: Line[] = Storage.exists(Storage.keys.LINES)
        ? Storage.get(Storage.keys.LINES)
        : [];

    // Drawing constants
    let renderer: GameRenderer;

    // onClick station
    let hoveredStation: Station | null = null;
    let selectedStation: Station | null = null;
    let stationContextMenuOpen: boolean = false;

    let minscale = 0.1;

    onMount(() => {
        renderer = new GameRenderer(map, stations, lines);

        document.body.onwheel = (e) => {
            const amount = e.deltaY < 0 ? -0.1 : 0.1;
            let ratio =
                1 -
                (renderer.two.scene.scale - amount) / renderer.two.scene.scale;

            if (renderer.two.scene.scale - amount >= minscale) {
                renderer.two.scene.scale -= amount;

                renderer.two.scene.translation.x +=
                    (e.clientX - renderer.two.scene.translation.x) * ratio;
                renderer.two.scene.translation.y +=
                    (e.clientY - renderer.two.scene.translation.y) * ratio;
            } else {
                ratio = 1 - minscale / renderer.two.scene.scale;

                renderer.two.scene.scale = minscale;

                renderer.two.scene.translation.x +=
                    (e.clientX - renderer.two.scene.translation.x) * ratio;
                renderer.two.scene.translation.y +=
                    (e.clientY - renderer.two.scene.translation.y) * ratio;
            }
        };

        /*
         * Mouse Events
         */

        // onClick station
        let stationOnClick = (e: MouseEvent) => {
            stationContextMenuOpen = true;
        };

        // dragging events
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
                        renderer.two.scene.scale,
                );

                for (let i = 0; i < stations.length; i++) {
                    const station = stations[i];

                    let v = new Two.Vector(
                        station.position.x - correctedMouse.x,
                        station.position.y - correctedMouse.y,
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

    .box,
    .box-tabs {
        @apply bg-dark-100 p-4 m-2 rounded-lg flex flex-col text-dark-500;
    }

    .box div {
        @apply inline-flex flex-row items-center;
    }

    .box p,
    .box-tabs p {
        @apply text-sm font-semibold;
    }

    .box-tabs a {
        @apply text-sm font-semibold cursor-pointer p-2;
    }

    .box-tabs a:hover {
        @apply text-dark-400;
    }

    .box-tabs a.active {
        @apply text-dark-500 underline;
    }

    .box-tabs-content {
        @apply p-2;
        display: none !important;
    }

    .box-tabs-content.active {
        @apply text-dark-500;
        display: inline-flex !important;
    }

    .box button {
        @apply bg-dark-50;
    }

    .box-tabs div {
        @apply flex flex-col;
    }

    .box-tabs span {
        @apply inline-flex flex-row items-center;
    }

    .box-tabs span.box-tabs-header {
        @apply inline-flex flex-row items-center justify-start;
    }

    .box-tabs ul.stations-list,
    .box-tabs ul.trains-list {
        @apply text-base flex flex-col flex-nowrap items-start;
    }

    .box-tabs ul.stations-list li {
        @apply inline-flex items-center justify-center;
    }

    .box-tabs ul.stations-list li span:first-child:before {
        @apply inline-block relative z-0 w-2 h-8 left-2;
        background-color: var(--line-color);
        content: "";
    }

    .box-tabs ul.stations-list li span:first-child::after {
        @apply inline-block relative z-10 w-4 h-4 rounded-full bg-dark-300 right-1;
        content: "";
    }

    .box-tabs ul.stations-list li:first-child {
        @apply mt-4;
    }

    input,
    select {
        @apply p-1 m-2 rounded-lg bg-dark-50 text-sm font-bold;
    }

    input[type="color"] {
        @apply h-8;
    }

    .title {
        @apply text-2xl font-semibold;
    }

    .subtitle {
        @apply text-lg font-semibold p-2;
    }

    .subsubtitle {
        @apply text-base font-semibold;
    }

    .subcontainer {
        @apply flex flex-row;
    }

    .subsubcontainer {
        @apply flex flex-col;
    }

    .container-grid {
        @apply grid grid-rows-2 gap-4 grid-flow-col p-2;
    }

    .button {
        @apply py-2 px-4 m-2 rounded-full font-semibold text-dark-500 hover:text-white focus:text-white bg-dark-50 hover:bg-dark-100 focus:bg-dark-200 transition-all text-sm;
    }

    .desc-text {
        @apply py-2 px-4 m-2 text-sm text-dark-500;
    }

    .button-dropdown {
        @apply m-2;
    }

    .button-dropdown button {
        @apply button;
        margin: 0 !important;
    }

    .button-dropdown div {
        @apply hidden absolute flex-col bg-dark-100 rounded-lg mt-9;
    }

    .button-dropdown div.active {
        @apply flex;
    }

    .button-dropdown span {
        @apply cursor-pointer hover:bg-dark-200 p-2 inline-flex flex-row items-center justify-between border-b-2 border-dark-200;
    }

    .button-dropdown span p {
        @apply text-sm font-semibold mr-2;
    }

    .button-dropdown span:first-child {
        @apply rounded-t-lg;
    }

    .button-dropdown span:last-child {
        @apply border-0 rounded-b-lg;
    }

    .box .button-dropdown div,
    .box-tabs .button-dropdown div {
        @apply bg-dark-200;
    }

    .box .button-dropdown span,
    .box-tabs .button-dropdown span {
        @apply hover:bg-dark-300 border-dark-300;
    }

    .dragging {
        @apply outline outline-2 rounded opacity-50;
        outline-color: var(--line-color);
    }
</style>
