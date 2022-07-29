<script lang="ts">
    import { gameData } from "../stores";
</script>

<div class="m-6 text-dark-500 pr-4 bg-dark-200 rounded-full">
    <span class="font-mono text-xl p-2 rounded-full bg-dark-100">
        {$gameData.stats.passengersServed}
    </span>
    <div class="inline-flex ml-2">
        <span class="font-semibold"> Passenger Served </span>
    </div>
</div>
