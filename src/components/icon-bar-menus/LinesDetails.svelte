<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    import type { GameRenderer } from "../../modules/GameRenderer";
    import { InteractiveElements } from "../../modules/InteractiveElements";
    import { Line } from "../../modules/Line";
    import { Train } from "../../modules/Train";
    import { gameData, lines, trains, trainSchedules } from "../../stores";
    import type { ILine, ITrainSchedule } from "../../types";

    export let renderer: GameRenderer;
    export let cancelLineForm: () => void;
    export let currentLineId: number;

    let defaultLine: ILine = {
        id: -1,
        name: "",
        color: "#ffffff",
        hidden: false,
        stationIds: [],
    };
    let defaultSchedule: ITrainSchedule = {
        intervalSeconds: 10 * 60,
        stoppingTimeSeconds: 30,
        previousDepartureTime: 0,
    };
    let currentLine: ILine = defaultLine;
    let currentSchedule: ITrainSchedule = defaultSchedule;

    function submitLineForm() {
        if (currentLine.name.length > 0) {
            if (currentLineId != -1) {
                Line.editLine(currentLine, currentSchedule);
            } else {
                Line.addLine(currentLine, currentSchedule);
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
    let unsubscribeLine: () => void;
    let unsubscribeTrainsSchedules: () => void;
    let lineFormElement: HTMLElement;
    onMount(() => {
        toggleAddTrainDropdown = InteractiveElements.Dropdown(AddTrainDropdown);
        InteractiveElements.Tabs(lineFormElement);

        // Stores
        unsubscribeLine = lines.subscribe((lines) => {
            if (currentLineId != -1) {
                currentLine = lines[currentLineId].copy();
            }
        });
        unsubscribeTrainsSchedules = trainSchedules.subscribe((schedules) => {
            if (currentLineId != -1) {
                currentSchedule = JSON.parse(
                    JSON.stringify(schedules[currentLineId]),
                );
            }
        });
    });

    onDestroy(() => {
        unsubscribeLine();
        unsubscribeTrainsSchedules();
    });
</script>

<div bind:this={lineFormElement} class="box-tabs">
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
        {#if currentLineId != -1}
            <div>
                <p>
                    Count: {$trains[currentLineId].length}
                </p>
                <p>
                    Time interval: {Math.round(
                        $trainSchedules[currentLineId].intervalSeconds / 60,
                    )}min
                </p>
                <p>
                    Train last departed {Math.round(
                        ($gameData.time.seconds -
                            $trainSchedules[currentLineId]
                                .previousDepartureTime) /
                            60,
                    )}min ago
                </p>
            </div>
            <ul class="trains-list">
                <!-- TODO: Improve this display -->
                {#each $trains[currentLineId] as train}
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
        {/if}
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
            <input type="number" bind:value={currentSchedule.intervalSeconds} />
        </span>
        <span>
            <p>Stopping time at stations:</p>
            <input
                type="number"
                bind:value={currentSchedule.stoppingTimeSeconds}
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
