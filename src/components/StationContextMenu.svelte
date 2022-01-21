<script lang="ts">
    import { each } from "svelte/internal";
    import type { GameRenderer } from "../modules/renderer";

    import type { Link, Station } from "../types";

    export let renderer: GameRenderer;
    export let station: Station;
    export let open = false;

    function increaseTrackNumber(from: number, to: number) {
        let input = document.querySelector(
            `#link${from}tracks`
        ) as HTMLInputElement;

        let newvalue = parseInt(input.value) + 1;

        if (newvalue > 10) {
            newvalue = 10;
        }

        input.value = newvalue.toString();

        setTrackNumber(from, to, parseInt(input.value));
    }

    function decreaseTrackNumber(from: number, to: number) {
        let input = document.querySelector(
            `#link${from}tracks`
        ) as HTMLInputElement;

        let newvalue = parseInt(input.value) - 1;

        if (newvalue < 0) {
            newvalue = 0;
        }

        input.value = newvalue.toString();

        setTrackNumber(from, to, parseInt(input.value));
    }

    function setTrackNumber(from: number, to: number, tracks: number) {
        if (from === to) {
            return;
        }

        if (tracks < 0) {
            tracks = 0;
        }
        if (tracks > 10) {
            tracks = 10;
        }

        let link1 = renderer.links[from].find((link) => link.to === to);
        let link2 = renderer.links[to].find((link) => link.to === from);

        link1.tracks = tracks;
        link2.tracks = tracks;
        link1.drawn = false;
        link2.drawn = false;

        renderer.draw();
    }
</script>

{#if station && open}
    <div class="m-4 p-4 rounded bg-dark-200 text-slate-200 flex flex-col">
        <span class="title text-white">{station.name}</span>
        <div class="subcontainer">
            <div>
                <span class="subtitle text-white">Links</span>
                <div class="container-grid">
                    {#each station.linkedTo as i}
                        <div class="subsubcontainer">
                            <span class="subsubtitle">
                                <i class="fas fa-arrows-alt-h" />
                                {renderer.stations[i].name}
                            </span>
                            <span>
                                Tracks:
                                <input
                                    id={`link${i}tracks`}
                                    class="bg-dark-200 p-1 w-8"
                                    type="text"
                                    value={renderer.links[i].find(
                                        (l) => l.to === parseInt(station.id)
                                    ).tracks}
                                    on:change={(e) =>
                                        setTrackNumber(
                                            i,
                                            parseInt(station.id),
                                            e.target.value
                                        )}
                                />
                                <button
                                    class="p-1 bg-dark-300 rounded leading-none hover:bg-dark-400 transition-all"
                                    on:click={(ev) =>
                                        increaseTrackNumber(
                                            i,
                                            parseInt(station.id)
                                        )}
                                >
                                    <i class="fas fa-plus" />
                                </button>

                                <button
                                    class="p-1 bg-dark-300 rounded leading-none hover:bg-dark-400 transition-all"
                                    on:click={(ev) =>
                                        decreaseTrackNumber(
                                            i,
                                            parseInt(station.id)
                                        )}
                                >
                                    <i class="fas fa-minus" />
                                </button>
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}

<style lang="postcss">
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
