<script lang="ts">
    import { onMount } from "svelte";

    import type { GameRenderer } from "../../modules/GameRenderer";
    import { Storage } from "../../modules/Storage";

    import LinesMenu from "./LinesMenu.svelte";
    import TrainsMenu from "./TrainsMenu.svelte";

    export let renderer: GameRenderer;

    type tab = "lines" | "trains";
    let currentTab: tab | "" = "lines";
    let linesButton: HTMLElement;
    let linesMenu: HTMLElement;
    let trainsButton: HTMLElement;
    let trainsMenu: HTMLElement;
    function setActiveIcon(pressed: tab) {
        linesButton.classList.remove("active");
        linesMenu.style.display = "none";
        trainsButton.classList.remove("active");
        trainsMenu.style.display = "none";

        if (pressed === "lines" && currentTab != "lines") {
            linesButton.classList.add("active");
            linesMenu.style.display = null;
            currentTab = "lines";
        } else if (pressed === "trains" && currentTab != "trains") {
            trainsButton.classList.add("active");
            trainsMenu.style.display = null;
            currentTab = "trains";
        } else {
            currentTab = "";
        }
    }

    onMount(() => {
        setActiveIcon("lines");
    });
</script>

<div class="icon-bar">
    <div class="flex-col grow-0">
        <button
            class="icon-bar-button active"
            bind:this={linesButton}
            on:click={() => setActiveIcon("lines")}>Lines</button
        >
        <button
            class="icon-bar-button"
            bind:this={trainsButton}
            on:click={() => setActiveIcon("trains")}>Trains</button
        >
        <button class="icon-bar-button" on:click={Storage.reset}>Reset</button>
    </div>
    <div bind:this={linesMenu}>
        <LinesMenu {renderer} />
    </div>
    <div bind:this={trainsMenu}>
        <TrainsMenu {renderer} />
    </div>
</div>

<style lang="postcss">
    .icon-bar {
        @apply absolute left-0 p-4 flex flex-col text-xl;
    }

    .icon-bar-button {
        @apply py-2 px-4 m-2 rounded-full font-semibold text-dark-500 hover:text-white focus:text-white bg-dark-100 hover:bg-dark-200 focus:bg-dark-200 transition-all;
    }

    .active {
        @apply bg-dark-200 text-white;
    }
</style>
