import type { Writable } from "svelte/store";

export class GameObject {
    /**
     * @returns Copy of the GameObject
     */
    copy?(): GameObject;
}