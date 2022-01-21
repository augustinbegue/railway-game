import Two from "two.js";
import type { Line, Link, Position, Station } from "../types";


export class GameRenderer {
    two: Two;

    stations: Station[];
    links: Link[][] = [];
    lines: Line[] = [];

    constructor(stations: Station[], lines: Line[]) {
        this.two = new Two({
            fullscreen: true,
            autostart: true,
        });
        this.two.appendTo(document.body);

        this.stations = stations;
        this.lines = lines;

        // Init links array
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];
            this.links[i] = [];

            let tracks = 2;

            // Build the adjacency matrix of links between the stations
            for (let j = 0; j < station.linkedTo.length; j++) {
                let link: Link = {
                    from: i,
                    to: station.linkedTo[j],
                    tracks: tracks,
                };

                this.links[i].push(link);
            }
        }

        this.draw();
    }

    draw() {
        // Reset scene drawing states
        this.two.clear();
        for (let i = 0; i < this.links.length; i++) {
            this.links[i].forEach((l) => l.drawn = false);
        }

        // Draw each link between stations
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];

            for (let j = 0; j < station.linkedTo.length; j++) {
                this.drawLink(i);
            }
        }

        // Draw each station
        for (let i = 0; i < this.stations.length; i++) {
            this.drawStation(this.stations[i]);
        }
    }

    drawStation(station: Station, fill = "#8f9ebf") {
        // TODO: Implement station colors

        if (station.circle) {
            station.circle.remove();
        }
        station.circle = this.two.makeCircle(
            station.position.x,
            station.position.y,
            station.size,
        ) as any;

        station.circle.fill = fill;
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
        station.text.family = "sans-serif";
    }

    drawLink(from: number) {
        let linkAdjList = this.links[from];

        for (let i = 0; i < linkAdjList.length; i++) {
            const link = linkAdjList[i];

            let linesUsingLink = this.getLinesUsingLink(link);

            if (!link.drawn) {
                if (linesUsingLink.length > 0 && !linesUsingLink.every(l => l.hidden)) {
                    this.drawTracks(link, 8, linesUsingLink.filter(l => !l.hidden).map(l => l.color), 1)
                    link.drawn = true;
                } else {
                    this.drawTracks(link, 1);
                    link.drawn = true;
                    let oppositelink = this.links[link.to].find((l) => l.to === link.from);
                    oppositelink.drawn = true;
                }
            }
        }
    }

    private drawTracks(link: Link, width: number, colors = ["#626c80"], count?): Two.Line[] {
        let fromStation = this.stations[link.from];
        let toStation = this.stations[link.to];

        let fromPosition = fromStation.position;
        let toPosition = toStation.position;

        let angle = Math.atan2(
            toPosition.y - fromPosition.y,
            toPosition.x - fromPosition.x,
        );

        let num = count || link.tracks;


        let lines = [];
        if (colors.length === 1) {
            let offset = -(num - 1);
            let color = colors[0];
            for (let t = 0; t < num; t++, offset += 2) {
                let line = this.two.makeLine(
                    fromPosition.x - offset * Math.sin(angle),
                    fromPosition.y + offset * Math.cos(angle),
                    toPosition.x - offset * Math.sin(angle),
                    toPosition.y + offset * Math.cos(angle),
                );
                line.linewidth = width;
                line.stroke = color;
                lines.push(line);
            }
        } else {
            let offset = 0;
            for (let i = 0; i < colors.length; i++, offset += 20 / colors.length) {
                const color = colors[i];
                let line = this.two.makeLine(
                    fromPosition.x,
                    fromPosition.y,
                    toPosition.x,
                    toPosition.y,
                );
                line.linewidth = width;
                line.stroke = color;
                line.dashes = [10, 10]
                line.dashes.offset = offset;
                lines.push(line);
            }
        }

        return lines;
    }

    private getLinesUsingLink(link: Link) {
        return this.lines.filter((l) => {
            let f = l.stations.indexOf(link.from);
            if (l.stations[f + 1] === link.to) {
                return true;
            } else {
                f = l.stations.indexOf(link.to)
                return l.stations[f + 1] === link.from;
            }
        });
    }
}