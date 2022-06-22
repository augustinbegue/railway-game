export class Storage {
    static keys = {
        LINES: "lines",
        LINKS: "links",
        STATIONS: "stations",
    }

    static save(key: string, value: object) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static exists(key): boolean {
        try {
            return JSON.parse(localStorage.getItem(key)) != null;
        } catch (error) {
            return null;
        }
    }

    static get(key): any {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    static reset() {
        localStorage.clear();
        window.location.reload();
    }
}