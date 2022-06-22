<script lang="ts">
    import { onMount } from "svelte";

    import type { GameRenderer } from "../../modules/renderer";
    export let renderer: GameRenderer;
    function toggleLine(el: HTMLElement, lineIndex: number) {
        let child = el.childNodes[0] as HTMLElement;

        child.classList.toggle("fa-eye");
        child.classList.toggle("fa-eye-slash");

        renderer.lines[lineIndex].hidden = !renderer.lines[lineIndex].hidden;
        renderer.draw();
    }

    let editLineElement: HTMLElement;
    let editLineNameInput: HTMLInputElement;
    let editLineColorInput: HTMLInputElement;
    let currentLine: number;
    function editLine(el: HTMLElement, lineIndex: number) {
        editLineElement.style.display = null;
        currentLine = lineIndex;
        let line = renderer.lines[currentLine];

        editLineColorInput.value = line.color;
        editLineNameInput.value = line.name;
        line.stationIds;
        line.trains;
    }
    function cancelEditLine() {
        editLineElement.style.display = "none";
    }
    function submitEditLine() {
        let line = renderer.lines[currentLine];

        line.color = editLineColorInput.value;
        line.name = editLineNameInput.value;

        editLineElement.style.display = "none";
    }

    let addLineElement: HTMLElement;
    let addLineNameInput: HTMLInputElement;
    let addLineColorInput: HTMLInputElement;
    function showAddLineForm() {
        addLineElement.style.display = null;
    }
    function submitAddLineForm() {
        let name = addLineNameInput.value;
        let color = addLineColorInput.value;

        if (name.length > 0 && color.length > 0) {
            renderer.addLine(name, color);
            renderer.draw();
            hideAddLineForm();
        }
    }
    function hideAddLineForm() {
        addLineElement.style.display = "none";
        addLineNameInput.value = "";
        addLineColorInput.value = "";
    }

    onMount(() => {
        addLineElement.style.display = "none";
        editLineElement.style.display = "none";
    });
</script>

<div class="flex flex-row">
    <div class="box w-fit">
        <div>
            <button class="button" on:click={showAddLineForm}>
                <i class="fas fa-plus" /> New line
            </button>
            <p class="desc-text">Lines: {renderer.lines.length}</p>
        </div>
        {#each renderer.lines as line, i}
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

    <!-- Edit Line Form -->
    <div class="box" bind:this={editLineElement}>
        <div>
            <p>Name:</p>
            <input type="text" bind:this={editLineNameInput} />
        </div>
        <div>
            <p>Color:</p>
            <input type="color" bind:this={editLineColorInput} />
        </div>
        <div>
            <button class="button" on:click={submitEditLine}>Save</button>
            <button class="button" on:click={cancelEditLine}>Cancel</button>
        </div>
    </div>

    <!-- Add Line Form -->
    <div class="box" bind:this={addLineElement}>
        <div>
            <p>Name:</p>
            <input type="text" bind:this={addLineNameInput} />
        </div>
        <div>
            <p>Color:</p>
            <input type="color" bind:this={addLineColorInput} />
        </div>
        <div>
            <button class="button" on:click={submitAddLineForm}>Add line</button
            >
            <button class="button" on:click={hideAddLineForm}>Cancel</button>
        </div>
    </div>
</div>

<style lang="postcss">
</style>
