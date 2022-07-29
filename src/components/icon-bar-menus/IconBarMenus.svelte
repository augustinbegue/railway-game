<script lang="ts">
    import { onMount } from "svelte";

    import type { GameRenderer } from "../../modules/GameRenderer";
    import { GameStorage } from "../../modules/GameStorage";

    import LinesMenu from "./LinesMenu.svelte";
    import TrainsMenu from "./TrainsMenu.svelte";

    export let renderer: GameRenderer;

    type tab = "lines" | "trains";
    let currentTab: tab | "" = "lines";
    let linesButton: HTMLElement;
    let trainsButton: HTMLElement;
    let linesMenu = false;
    let trainsMenu = false;

    function setActiveIcon(pressed: tab) {
        linesButton.classList.remove("active");
        trainsButton.classList.remove("active");
        linesMenu = false;
        trainsMenu = false;

        if (pressed === "lines" && currentTab != "lines") {
            linesButton.classList.add("active");
            currentTab = "lines";
            linesMenu = true;
        } else if (pressed === "trains" && currentTab != "trains") {
            trainsButton.classList.add("active");
            currentTab = "trains";
            trainsMenu = true;
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
        <button class="icon-bar-button" on:click={GameStorage.reset}
            >Reset</button
        >
    </div>
    {#if linesMenu}
        <LinesMenu {renderer} />
    {/if}
    {#if trainsMenu}
        <TrainsMenu {renderer} />
    {/if}
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
