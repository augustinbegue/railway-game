<script lang="ts">
    import { onMount } from "svelte";

    import type { GameRenderer } from "../../modules/renderer";
    import { Storage } from "../../modules/storage";
    import type { Train } from "../../types";

    export let renderer: GameRenderer;

    let trainForm: HTMLElement;
    let currentTrainIndex: number;
    let currentTrain: Train = {
        id: -1,
        info: {
            name: "",
            maxSpeed: 0,
            capacity: 0,
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
            position: {
                x: 0,
                y: 0,
            },
        },
        element: null,
    };
    function addTrain() {
        trainForm.style.display = null;
        currentTrainIndex = -1;
    }
    function editTrain(trainIndex) {
        currentTrainIndex = trainIndex;
        currentTrain = renderer.trains[currentTrainIndex];
        trainForm.style.display = null;
    }
    function submitTrainForm() {
        if (currentTrain.info.name.length > 0) {
            if (currentTrainIndex != -1) {
                renderer.editTrainType(currentTrain);
            } else {
                renderer.addTrainType(currentTrain);
            }
            renderer.draw();
            cancelTrainForm();
        }
    }
    function cancelTrainForm() {
        trainForm.style.display = "none";
        currentTrain = {
            id: -1,
            info: {
                name: "",
                maxSpeed: 0,
                capacity: 0,
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
                position: {
                    x: 0,
                    y: 0,
                },
            },
            element: null,
        };
    }

    onMount(() => {
        cancelTrainForm();
    });
</script>

<div class="flex flex-row">
    <div class="box w-fit h-fit">
        <div>
            <button class="button" on:click={addTrain}>
                <i class="fas fa-plus" /> New train
            </button>
            <p class="desc-text">Trains: {renderer.trains.length}</p>
        </div>
        {#each renderer.trains as train, i}
            <div class="py-2 first:pt-0 last:pb-0 justify-between ">
                <p>
                    {train.info.name}
                </p>
                <p>
                    {train.info.capacity} <i class="fas fa-users" />
                </p>
                <p>
                    {train.info.maxSpeed} <i class="fas fa-tachometer-alt" />
                </p>
                <span
                    class="text-sm p-2"
                    on:click={(ev) => {
                        editTrain(i);
                    }}
                >
                    <i class="fas fa-edit cursor-pointer" />
                </span>
            </div>
        {/each}
    </div>

    <!-- Add Trains Form -->
    <div class="box" bind:this={trainForm}>
        <div>
            <p>Name:</p>
            <input type="text" bind:value={currentTrain.info.name} />
        </div>
        <div>
            <p>Capacity:</p>
            <input type="number" bind:value={currentTrain.info.capacity} />
        </div>
        <div>
            <p>Max Speed:</p>
            <input type="number" bind:value={currentTrain.info.maxSpeed} />
        </div>
        <div>
            <button class="button" on:click={submitTrainForm}>Save</button>
            <button class="button" on:click={cancelTrainForm}>Cancel</button>
        </div>
    </div>
</div>
