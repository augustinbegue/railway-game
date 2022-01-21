<script lang="ts">
    import type { Line } from "../types";

    function toggleLine(el: HTMLElement, lineIndex: number) {
        let child = el.childNodes[0] as HTMLElement;

        child.classList.toggle("fa-eye");
        child.classList.toggle("fa-eye-slash");
    }

    export let lines: Line[];
</script>

<div class="bg-dark-200 p-4 m-2 rounded flex flex-col text-dark-500">
    {#each lines as line, i}
        <div
            class="py-2 first:pt-0 last:pb-0 inline-flex justify-evenly items-center"
        >
            <button
                class="text-sm pr-2"
                on:click={(ev) => {
                    toggleLine(ev.target, i);
                }}
            >
                <i class="far fa-eye pointer-events-none" />
            </button>
            <span>
                {line.name}
            </span>
        </div>
    {/each}
</div>
