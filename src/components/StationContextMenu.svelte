<script lang="ts">
    import { each } from "svelte/internal";
    import type { GameRenderer } from "../modules/renderer";
    import { Storage } from "../modules/storage";

    import type { Line, Station } from "../types";

    export let renderer: GameRenderer;
    export let station: Station;
    export let open = false;

    function increaseTrackNumber(from: number, to: number) {
        let input = document.querySelector(
            `#link${from}tracks`,
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
            `#link${from}tracks`,
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

    let addToLineToggle = false;
    let addToLineSelect: HTMLSelectElement;
    $: linesNotInStation = renderer.lines?.filter(
        (l) => !l.stationIds.includes(station?.id),
    );
    function addToLineClicked(e: MouseEvent) {
        addToLineToggle = !addToLineToggle;
        if (addToLineToggle) {
            linesNotInStation = renderer.lines.filter(
                (l) => !l.stationIds.includes(station.id),
            );
        }
    }
    function addToLine() {
        let id = addToLineSelect.value;
        console.log("Adding station ", station.id, " to line ", id);
        renderer.addStationToLine(parseInt(id), station.id);
        linesNotInStation = renderer.lines.filter(
            (l) => !l.stationIds.includes(station.id),
        );
    }
</script>

<!-- Add To Line Form -->
{#if station && open && addToLineToggle && linesNotInStation.length > 0}
    <div class="box w-fit">
        <p>Add {station.name} to a line</p>
        <select bind:this={addToLineSelect}>
            {#each linesNotInStation as line}
                <option value={line.id}>
                    <span
                        class="p-3 rounded-lg"
                        style="background-color: {line.color};"
                    />
                    <p>
                        {line.name}
                    </p>
                </option>
            {/each}
        </select>
        <div>
            <button class="button" on:click={addToLine}>Save</button>
            <button class="button" on:click={addToLineClicked}>Cancel</button>
        </div>
    </div>
{/if}

{#if station && open}
    <div class="m-4 p-4 rounded-lg bg-dark-100 text-slate-200 flex flex-col">
        <span class="title text-white">{station.name}</span>
        <!-- Links List -->
        {#if station.linkedTo.length > 0}
            <div class="subcontainer">
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
                                    class="bg-dark-100 p-1 w-8"
                                    type="text"
                                    value={renderer.links[i].find(
                                        (l) => l.to === parseInt(station.id),
                                    ).tracks}
                                    on:change={(e) =>
                                        setTrackNumber(
                                            i,
                                            station.id,
                                            e.target.value,
                                        )}
                                />
                                <button
                                    class="p-1 bg-dark-200 rounded leading-none hover:bg-dark-400 transition-all"
                                    on:click={(ev) =>
                                        increaseTrackNumber(i, station.id)}
                                >
                                    <i class="fas fa-plus" />
                                </button>

                                <button
                                    class="p-1 bg-dark-200 rounded leading-none hover:bg-dark-400 transition-all"
                                    on:click={(ev) =>
                                        decreaseTrackNumber(i, station.id)}
                                >
                                    <i class="fas fa-minus" />
                                </button>
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        <!-- Lines List -->
        {#if station.lineIds.length > 0}
            <div class="subcontainer">
                <span class="subtitle text-white">Lines</span>
                <div class="flex flex-row">
                    {#each station.lineIds as i}
                        <div class="inline-flex flex-row items-center pl-2">
                            <span
                                class="p-3 rounded-lg"
                                style="background-color: {renderer.lines[i]
                                    .color};"
                            />
                            <span class="subsubtitle pl-2">
                                {renderer.lines[i].name}
                            </span>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
        <!-- Add to Line -->
        {#if linesNotInStation.length > 0}
            <div class="subcontainer">
                <div>
                    <button class="button" on:click={addToLineClicked}>
                        Add to line
                    </button>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="postcss">
</style>
