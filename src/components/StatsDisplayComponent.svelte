<script lang="ts">
    import { gameData } from "../stores";
</script>

<div class="mx-6 my-2 text-dark-500 pr-4 bg-dark-200 rounded-full w-fit">
    <span class="font-mono text-xl p-2 rounded-full bg-dark-100 grow">
        {Math.round($gameData.economy.money)}
    </span>
    <div class="inline-flex ml-2">
        <span class="font-semibold"> € </span>
    </div>
</div>

<div class="mx-6 my-2 text-dark-500 pr-4 bg-dark-200 rounded-full">
    <span class="font-mono text-xl p-2 rounded-full bg-dark-100">
        {$gameData.stats.passengersServed}
    </span>
    <div class="inline-flex ml-2">
        <span class="font-semibold"> Passenger Served </span>
    </div>
</div>
