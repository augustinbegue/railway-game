<script lang="ts">
    import type { GameRenderer } from "../modules/renderer";
    export let renderer: GameRenderer;

    function toggleLine(el: HTMLElement, lineIndex: number) {
        let child = el.childNodes[0] as HTMLElement;

        child.classList.toggle("fa-eye");
        child.classList.toggle("fa-eye-slash");

        renderer.lines[lineIndex].hidden = !renderer.lines[lineIndex].hidden;
        renderer.draw();
    }
</script>

<div class="bg-dark-200 p-4 m-2 rounded flex flex-col text-dark-500">
    {#each renderer.lines as line, i}
        <div
            class="py-2 first:pt-0 last:pb-0 inline-flex justify-evenly items-center"
        >
            <button
                class="text-sm pr-2"
                on:click={(ev) => {
                    toggleLine(ev.target, i);
                }}
            >
                <i
                    class="far pointer-events-none 
                    {line.hidden ? 'fa-eye-slash' : 'fa-eye'}"
                />
            </button>
            <span>
                {line.name}
            </span>
        </div>
    {/each}
</div>
