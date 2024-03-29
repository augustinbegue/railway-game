<script lang="ts">
    import type { GameRenderer } from "../modules/GameRenderer";
    import { lines } from "../stores";

    import type { Station } from "../types";

    export let renderer: GameRenderer;
    export let station: Station;
    export let open = false;

    // Track Management
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
    function deleteLink(from: number, to: number) {
        renderer.deleteLink(from, to);
    }

    // Line Management
    let addToLineToggle = false;
    let addToLineSelect: HTMLSelectElement;
    $: linesNotInStation = $lines.filter(
        (l) => !l.stationIds.includes(station?.id),
    );
    function addToLineClicked(e: MouseEvent) {
        addToLineToggle = !addToLineToggle;
    }
    function addToLine() {
        let id = addToLineSelect.value;
        $lines[parseInt(id)]?.addStation(renderer, station.id);
    }

    // Passengers Information
    $: passengersDestinations = station?.waitingPassengers.reduce((acc, p) => {
        acc[p.endStationId] = (acc[p.endStationId] || 0) + 1;
        return acc;
    }, []);
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
        <div class="flex flex-row justify-between">
            <span class="title text-white">{station.name} [{station.id}]</span>
            <span class="cursor-pointer">
                <i
                    class="fas fa-times"
                    on:click={() => {
                        station = null;
                    }}
                />
            </span>
        </div>
        <!-- Station Info -->
        <div class="subcontainer">
            <span class="subtitle text-white">Passengers Waiting</span>
            <span class="subtitle text-gray-400">
                {station.waitingPassengers
                    .length}/{station.waitingPassengersMax}
            </span>
        </div>
        <span class="subtitle text-white">Destinations</span>
        <div class="subcontainer">
            <div
                class="flex flex-row justify-start items-center flex-nowrap flex-shrink-0 gap-2 divide-x divide-dashed"
            >
                {#each passengersDestinations as passengers, id}
                    {#if passengers > 0}
                        <span class="pl-2 subsubtitle text-white">
                            <span class="text-gray-400">
                                {passengers}
                            </span>
                            {renderer.stations[id].name}
                        </span>
                    {/if}
                {/each}
            </div>
        </div>
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
                                        (l) => l.to === station.id,
                                    ).tracks}
                                    on:change={(e) =>
                                        setTrackNumber(
                                            i,
                                            station.id,
                                            e.currentTarget.valueAsNumber,
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

                                <button
                                    class="p-1 bg-dark-200 rounded leading-none hover:bg-dark-400 transition-all"
                                    on:click={(ev) => deleteLink(i, station.id)}
                                >
                                    <i class="fas fa-times" />
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
                                style="background-color: {$lines[i].color};"
                            />
                            <span class="subsubtitle pl-2">
                                {$lines[i].name}
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
