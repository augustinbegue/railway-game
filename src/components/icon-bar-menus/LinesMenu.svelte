<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import type { GameRenderer } from "../../modules/GameRenderer";
    import { lines } from "../../stores";
    import LinesDetails from "./LinesDetails.svelte";

    export let renderer: GameRenderer;
    function toggleLine(el: HTMLElement, lineIndex: number) {
        let child = el.childNodes[0] as HTMLElement;

        child.classList.toggle("fa-eye");
        child.classList.toggle("fa-eye-slash");

        $lines[lineIndex].hidden = !$lines[lineIndex].hidden;
        renderer.draw();
    }

    // FORM SAVE/CANCEL
    let currentLineId: number;
    function cancelLineForm() {
        currentLineId = null;
    }

    // LINE
    function addLine() {
        currentLineId = -1;
    }
    function editLine(el: HTMLElement, lineIndex: number) {
        currentLineId = lineIndex;
    }

    onMount(() => {
        console.log("LinesMenu.onMount");

        cancelLineForm();
    });

    onDestroy(() => {
        console.log("LinesMenu.onDestroy");
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

    {#if currentLineId != null}
        <LinesDetails {cancelLineForm} {renderer} {currentLineId} />
    {/if}
</div>

<style lang="postcss">
</style>
