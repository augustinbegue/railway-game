import Two from "two.js";
import type { Link, Station } from "../types";

export class GameRenderer {
    two: Two;

    stations: Station[];
    links: Link[][] = [];

    constructor(stations: Station[]) {
        this.two = new Two({
            fullscreen: true,
            autostart: true,
        });
        this.two.appendTo(document.body);

        this.stations = stations;
        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];
            this.links[i] = [];

            let tracks = 2;

            // Build the adjacency matrix of links between the stations
            for (let j = 0; j < station.linkedTo.length; j++) {
                let link: Link = {
                    from: i,
                    to: station.linkedTo[j],
                    tracks: tracks,
                    lines: [],
                };

                this.links[i].push(link);
            }
        }

        // Draw each link between stations
        for (let i = 0; i < stations.length; i++) {
            const station = stations[i];

            for (let j = 0; j < station.linkedTo.length; j++) {
                this.drawLink(i);
            }
        }

        // Draw each station
        for (let i = 0; i < stations.length; i++) {
            this.drawStation(stations[i]);
        }
    }

    drawStation(station: Station) {

        if (station.circle) {
            station.circle.remove();
        }
        station.circle = this.two.makeCircle(
            station.position.x,
            station.position.y,
            station.size,
        ) as any;

        station.circle.fill = "#8f9ebf";
        station.circle.clip = false;
        station.circle.noStroke();

        if (station.text) {
            station.text.remove();
        }
        station.text = this.two.makeText(
            station.name,
            station.position.x,
            station.position.y - station.size * 2,
            {},
        ) as any;

        station.text.size = 20;
        station.text.linewidth = 0.3;
        station.text.noStroke();
        station.text.fill = "#d6d9df";
        station.text.family = "Product Sans";
    }

    drawLink(from: number) {
        let linkAdjList = this.links[from];

        for (let i = 0; i < linkAdjList.length; i++) {
            const link = linkAdjList[i];

            if (link.lines.length != 0) {
                continue;
            }

            let fromStation = this.stations[from];
            let toStation = this.stations[link.to];

            let fromPosition = fromStation.position;
            let toPosition = toStation.position;

            let angle = Math.atan2(
                toPosition.y - fromPosition.y,
                toPosition.x - fromPosition.x,
            );

            let offset = -(link.tracks - 1);

            let oppositelink = this.links[link.to].find((l) => l.to === from);
            for (let t = 0; t < link.tracks; t++, offset += 2) {
                link.lines[t] = this.two.makeLine(
                    fromPosition.x - offset * Math.sin(angle),
                    fromPosition.y + offset * Math.cos(angle),
                    toPosition.x - offset * Math.sin(angle),
                    toPosition.y + offset * Math.cos(angle),
                );
                link.lines[t].linewidth = 1;
                link.lines[t].stroke = "#626c80";

                oppositelink.lines[t] = link.lines[t];
            }
        }
    }
}