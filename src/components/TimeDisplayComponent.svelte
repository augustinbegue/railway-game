<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { gameData } from "../stores";
    import type { GameData } from "../types";

    let _gameData: GameData;
    let timestring = "12:00:00";

    const updateTime = () => {
        let hours = Math.floor(_gameData.time.seconds / 3600);
        let minutes = Math.floor(_gameData.time.seconds / 60 - hours * 60);
        let seconds = Math.floor(
            _gameData.time.seconds - (minutes * 60 + hours * 3600),
        );
        timestring = `${hours}:${minutes < 10 ? `0${minutes}` : minutes}:${
            seconds < 10 ? `0${seconds}` : seconds
        }`;

        setTimeout(updateTime, 900 / _gameData.time.multiplicator);
    };

    let unsubscribe: () => void;
    onMount(() => {
        unsubscribe = gameData.subscribe((data) => {
            _gameData = data;
            step = multiplicatorSteps.indexOf(_gameData.time.multiplicator);
            updateTime();
        });

        setTimeout(updateTime, 900 / _gameData.time.multiplicator);
    });

    onDestroy(() => {
        unsubscribe();
    });

    let step = 0;
    let multiplicatorSteps = [1, 2, 5, 10, 20, 50, 100];
    function setMultiplicator(step) {
        step =
            step < 0
                ? 0
                : step >= multiplicatorSteps.length
                ? multiplicatorSteps.length - 1
                : step;

        let multiplicator = multiplicatorSteps[step];
        if (multiplicator < 1) {
            multiplicator = 1;
        }

        if (multiplicator > 100) {
            multiplicator = 100;
        }

        $gameData.time.multiplicator = multiplicator;
    }
</script>

<div class="m-6 text-dark-500 pr-4 bg-dark-200 rounded-full w-fit">
    <span class="font-mono text-xl p-2 rounded-full bg-dark-100">
        {timestring}
    </span>
    <div class="inline-flex ml-2">
        <span class="font-semibold">
            x{$gameData.time.multiplicator}
        </span>
        <span class="text-sm inline-flex items-center">
            <i
                class="ml-1 fas fa-plus cursor-pointer"
                on:click={() => {
                    setMultiplicator(++step);
                }}
            />
            <i
                class="ml-1 fas fa-minus cursor-pointer"
                on:click={() => {
                    setMultiplicator(--step);
                }}
            />
        </span>
    </div>
</div>
