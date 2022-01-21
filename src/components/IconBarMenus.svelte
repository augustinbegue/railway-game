<script lang="ts">
    import type { Line } from "../types";

    import LinesIconBarMenu from "./LinesIconBarMenu.svelte";

    export let lines: Line[];
</script>

<div class="icon-bar">
    <div class="flex-col grow-0">
        <button class="icon-bar-button">Lines</button>
    </div>
    <div>
        <LinesIconBarMenu {lines} />
    </div>
</div>

<style lang="postcss">
    .icon-bar {
        @apply absolute left-0 p-4 flex flex-row text-xl;
    }

    .icon-bar-button {
        @apply py-2 px-4 m-2 rounded-full font-semibold text-dark-500 hover:text-white focus:text-white bg-dark-200 hover:bg-dark-300 focus:bg-dark-300 transition-all;
    }
</style>
