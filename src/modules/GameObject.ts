import { gameData } from "../stores";
import type { GameData } from "../types";

export class GameObject {
    protected _gameData: GameData;

    constructor() {
        gameData.subscribe((data: GameData) => {
            this._gameData = data;
        });
    }

    /**
     * @returns Copy of the GameObject
     */
    copy?(): GameObject;
    static fromJSON?(obj: any): GameObject;
    toJSON?(): any;
}