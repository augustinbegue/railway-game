import { Writable, writable } from "svelte/store";
import type { Line } from "./modules/Line";
import { Storage } from "./modules/Storage";

export const lines: Writable<Line[]> = writable([]);
lines.subscribe(lines => {
    if (lines.length > 0)
        Storage.save(Storage.keys.LINES, lines);
});