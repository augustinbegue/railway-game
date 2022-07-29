<script lang="ts">
    import { onMount } from "svelte";
    import { InteractiveElements } from "../../modules/InteractiveElements";
    import type { GameRenderer } from "../../modules/GameRenderer";
    import type { ILine, ITrain } from "../../types";
    import { Train } from "../../modules/Train";
    import { Line } from "../../modules/Line";
    import { gameData, lines } from "../../stores";

    export let renderer: GameRenderer;
    function toggleLine(el: HTMLElement, lineIndex: number) {
        let child = el.childNodes[0] as HTMLElement;

        child.classList.toggle("fa-eye");
        child.classList.toggle("fa-eye-slash");

        $lines[lineIndex].hidden = !$lines[lineIndex].hidden;
        renderer.draw();
    }

    let lineFormElement: HTMLElement;
    let currentLineId: number = -1;
    let defaultLine: ILine = {
        id: -1,
        name: "",
        color: "#ffffff",
        hidden: false,
        stationIds: [],
        trains: [],
        trainSchedule: {
            intervalSeconds: 10 * 60,
            stoppingTimeSeconds: 120,
            previousDepartureTime: 0,
        },
    };
    let currentLine: ILine = defaultLine;
    // LINE
    function addLine() {
        lineFormElement.style.display = null;
        currentLineId = -1;
        currentLine = defaultLine;
    }
    function editLine(el: HTMLElement, lineIndex: number) {
        lineFormElement.style.display = null;
        currentLineId = lineIndex;
        currentLine = $lines[currentLineId].copy();
    }

    // FORM SAVE/CANCEL
    function cancelLineForm() {
        lineFormElement.style.display = "none";
        currentLine = defaultLine;
        currentLineId = -1;
    }
    function submitLineForm() {
        if (currentLine.name.length > 0) {
            if (currentLineId != -1) {
                Line.editLine(currentLine);
            } else {
                Line.addLine(currentLine);
            }
            cancelLineForm();
        }
    }

    // STATIONS
    function removeStation(stationId: number) {
        $lines[currentLine.id].removeStation(renderer, stationId);
    }
    let movedStationId: number;
    let movedStationEl: HTMLElement;
    function moveStation(el: HTMLElement, stationId: number) {
        movedStationId = stationId;
        movedStationEl = el;
        el.style.opacity = "0.5";
    }
    function moveStationHere(index: number) {
        $lines[currentLine.id].removeStation(renderer, movedStationId);
        $lines[currentLine.id].insertStation(renderer, movedStationId, index);
        cancelMoveStation();
    }
    function cancelMoveStation() {
        movedStationEl.style.opacity = "1";
        movedStationId = undefined;
        movedStationEl = undefined;
    }

    // TRAINS
    let AddTrainDropdown: HTMLElement;
    function addTrain(trainId: number) {
        Train.addToLine(trainId, $lines[currentLine.id]);
        toggleAddTrainDropdown();
    }

    let toggleAddTrainDropdown: () => void;
    onMount(() => {
        cancelLineForm();
        InteractiveElements.Tabs(lineFormElement);
        toggleAddTrainDropdown = InteractiveElements.Dropdown(AddTrainDropdown);

        // Stores
        lines.subscribe((lines) => {
            if (currentLineId != -1) {
                currentLine = lines[currentLineId].copy();
            }
        });
    });
</script>

<div class="flex flex-row">
    <div class="box w-fit h-fit">
        <div>
            <button class="button" on:click={addLine}>
                <i class="fas fa-plus" /> New line
            </button>
            <p class="desc-text">Lines: {$lines.length}</p>
        </div>
        {#each $lines as line, i (line.id)}
            <div class="py-2 first:pt-0 last:pb-0 justify-evenly ">
                <span
                    class="text-sm p-2"
                    on:click={(ev) => {
                        toggleLine(ev.currentTarget, i);
                    }}
                >
                    <i
                        class="far cursor-pointer
                    {line.hidden ? 'fa-eye-slash' : 'fa-eye'}"
                    />
                </span>
                <span
                    class="p-3 rounded-lg"
                    style="background-color: {line.color};"
                />
                <p>
                    {line.name}
                </p>
                <span
                    class="text-sm p-2"
                    on:click={(ev) => {
                        editLine(ev.currentTarget, i);
                    }}
                >
                    <i class="fas fa-edit cursor-pointer" />
                </span>
            </div>
        {/each}
    </div>

    <!-- Line Form -->
    <div class="box-tabs" bind:this={lineFormElement}>
        <span class="box-tabs-header">
            <!-- svelte-ignore a11y-missing-attribute -->
            <a class="active">Properties</a>
            <!-- svelte-ignore a11y-missing-attribute -->
            <a>Stations</a>
            <!-- svelte-ignore a11y-missing-attribute -->
            <a>Trains</a>
        </span>
        <div class="box-tabs-content active">
            <span>
                <p>Name:</p>
                <input type="text" bind:value={currentLine.name} />
            </span>
            <span>
                <p>Color:</p>
                <input type="color" bind:value={currentLine.color} />
            </span>
        </div>
        <div class="box-tabs-content">
            <span>
                <p>
                    {#key currentLine.stationIds}
                        Count: {currentLine.stationIds.length}
                    {/key}
                </p>
            </span>
            <ul class="stations-list" style="--line-color: {currentLine.color}">
                {#each currentLine.stationIds as stationId, i}
                    <li
                        class="inline-flex w-full row justify-between"
                        data-index={i}
                        data-station-id={stationId}
                    >
                        <span />
                        <p class="w-full mr-2">
                            {renderer.stations[stationId].name}
                        </p>
                        <span>
                            {#if movedStationId != undefined}
                                {#if movedStationId == stationId}
                                    <i
                                        class="fas fa-times cursor-pointer"
                                        on:click={() => cancelMoveStation()}
                                    />
                                {:else}
                                    <i
                                        class="fas fa-check cursor-pointer"
                                        on:click={() => moveStationHere(i)}
                                    />
                                {/if}
                            {:else}
                                <i
                                    class="fas fa-arrows-alt-v cursor-pointer"
                                    on:click={(e) => {
                                        moveStation(
                                            e.currentTarget.parentElement
                                                .parentElement,
                                            stationId,
                                        );
                                    }}
                                />
                                <i
                                    class="ml-2 fas fa-times cursor-pointer"
                                    on:click={() => {
                                        removeStation(stationId);
                                    }}
                                />
                            {/if}
                        </span>
                    </li>
                {/each}
            </ul>
        </div>
        <div class="box-tabs-content">
            <div>
                <p>
                    Count: {currentLine.trains.length}
                </p>
                <p>
                    Time interval: {Math.round(
                        currentLine.trainSchedule.intervalSeconds / 60,
                    )}min
                </p>
                <p>
                    Train last departed {Math.round(
                        ($gameData.time.seconds -
                            currentLine.trainSchedule.previousDepartureTime) /
                            60,
                    )}min ago
                </p>
            </div>
            <ul class="trains-list">
                <!-- TODO: Improve this display -->
                {#each currentLine.trains as train}
                    <li>
                        {train.info.name}#{train.id}
                        {#if train.location.currentLink}
                            | {train.passengers.length}/{train.info.capacity}
                            |
                            {#if train.location.stopped && train.location.stationIndex}
                                Stopped: {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.reverseTrip
                                            ? train.location.stationIndex + 1
                                            : train.location.stationIndex - 1
                                    ]
                                ]?.name}
                            {:else if train.location.stationIndex && train.location.stationIndex < currentLine.stationIds.length && !train.location.reverseTrip}
                                {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.stationIndex - 1
                                    ]
                                ]?.name} -> {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.stationIndex
                                    ]
                                ]?.name}
                            {:else if train.location.stationIndex && train.location.stationIndex + 1 < currentLine.stationIds.length && train.location.reverseTrip}
                                {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.stationIndex + 1
                                    ]
                                ]?.name} -> {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.stationIndex
                                    ]
                                ]?.name}
                            {:else}
                                Terminus: {renderer.stations[
                                    currentLine.stationIds[
                                        train.location.stationIndex
                                    ]
                                ]?.name}
                            {/if}
                        {:else}
                            | Waiting for the next departure
                        {/if}
                    </li>
                {/each}
            </ul>
            <div class="button-dropdown" bind:this={AddTrainDropdown}>
                <button>
                    <i class="fas fa-plus" /> Add a train
                </button>
                <div>
                    {#each Train.types as train}
                        <span on:click={() => addTrain(train.id)}>
                            <p>
                                {train.info.name}
                            </p>
                            <p>
                                {train.info.capacity} <i class="fas fa-users" />
                            </p>
                            <p>
                                {train.info.maxSpeed}
                                <i class="fas fa-tachometer-alt" />
                            </p>
                        </span>
                    {/each}
                </div>
            </div>
            <span>
                <p>Interval between trains:</p>
                <input
                    type="number"
                    bind:value={currentLine.trainSchedule.intervalSeconds}
                />
            </span>
            <span>
                <p>Stopping time at stations:</p>
                <input
                    type="number"
                    bind:value={currentLine.trainSchedule.stoppingTimeSeconds}
                />
            </span>
        </div>
        <div class="span">
            <span>
                <button class="button" on:click={submitLineForm}>Save</button>
                <button class="button" on:click={cancelLineForm}>Cancel</button>
            </span>
        </div>
    </div>
</div>

<style lang="postcss">
</style>
