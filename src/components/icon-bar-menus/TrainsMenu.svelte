<script lang="ts">
    import type { GameRenderer } from "../../modules/renderer";

    export let renderer: GameRenderer;

    function showAddTrainForm() {}
</script>

<div class="flex flex-row">
    <div class="box w-fit">
        <div>
            <button class="button" on:click={showAddTrainForm}>
                <i class="fas fa-plus" /> New train
            </button>
            <p class="desc-text">Trains: {renderer.trains.length}</p>
        </div>
    </div>
</div>
