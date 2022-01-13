<script lang="ts">
    import { each } from "svelte/internal";
    import type { GameRenderer } from "../modules/renderer";

    import type { Link, Station } from "../types";

    export let renderer: GameRenderer;
    export let station: Station;
    export let open = false;

    function setTrackNumber(from: number, to: number, tracks: number) {
        if (from === to) {
            return;
        }

        let link1 = renderer.links[from].find((link) => link.to === to);
        let link2 = renderer.links[to].find((link) => link.to === from);

        link1.tracks = tracks;
        link2.tracks = tracks;

        link1.lines.forEach((line) => {
            line.remove();
        });
        link1.lines = [];
        link2.lines = [];

        renderer.drawLink(from);
        renderer.drawStation(renderer.stations[from]);
        renderer.drawStation(renderer.stations[to]);
    }
</script>

{#if station && open}
    <div class="container">
        <span class="title">{station.name}</span>
        <div class="subcontainer">
            <div>
                <span class="subtitle">Links</span>
                <div class="container-grid">
                    {#each station.linkedTo as i}
                        <div class="subsubcontainer">
                            <span class="subsubtitle"
                                >-> {renderer.stations[i].name}</span
                            >
                            <span
                                >Tracks: <input
                                    type="number"
                                    value={renderer.links[i].find(
                                        (l) => l.to === parseInt(station.id),
                                    ).tracks}
                                    on:change={(e) =>
                                        setTrackNumber(
                                            i,
                                            parseInt(station.id),
                                            e.target.value,
                                        )}
                                /></span
                            >
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<style lang="postcss">
    .container {
        @apply m-4 p-4 rounded bg-slate-500 text-white flex flex-col;
    }

    .title {
        @apply text-2xl font-semibold;
    }

    .subtitle {
        @apply text-lg font-semibold;
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
        @apply grid grid-rows-2 gap-4 grid-flow-col;
    }
</style>
