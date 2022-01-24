import Two from "two.js";
import type { GameMap, GameTime, Line, Link, GeoPosition, Station } from "../types";


export class GameRenderer {
    two: Two;

    gameTime: GameTime = {
        multiplicator: 1,
        seconds: 12 * 60 * 60
    };

    map: GameMap;
    stations: Station[];
    links: Link[][] = [];
    tracks: Two.Line[][][] = [];
    lines: Line[] = [];

    constructor(map: GameMap, stations: Station[], lines: Line[]) {
        this.map = map;
        this.stations = stations;
        this.lines = lines;

        this.two = new Two({
            fullscreen: true,
            autostart: true,
        });
        this.two.appendTo(document.body);
        this.two.bind('update', (a, b) => {
            this.update(a, b);
        });

        let mapStartLat = parseFloat(this.map.startLat);
        let mapStartLong = parseFloat(this.map.startLong);
        let mapEndLat = parseFloat(this.map.endLat);
        let mapEndLong = parseFloat(this.map.endLong);

        let diagMeters = this.measure(mapStartLat, mapStartLong, mapEndLat, mapEndLong);
        // 10 meters = 1 pixel;
        this.map.size = diagMeters / 10;

        console.log(diagMeters, this.map.size)

        let scaleFactor = 1;

        let mapStartX = (mapStartLong * this.map.size) / scaleFactor;
        let mapStartY = 1 - (mapStartLat * this.map.size) / scaleFactor;

        // Init links and tracks array
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];
            this.links[i] = [];
            this.tracks[i] = [];

            let tracks = 2;

            // Convert Long and Lat to pixels according to the map
            let lat = parseFloat(station.position.lat);
            let long = parseFloat(station.position.long);

            station.position.x = (long * this.map.size) / scaleFactor - mapStartX;
            station.position.y = 1 - (lat * this.map.size) / scaleFactor - mapStartY;

            console.log(station.position.x, station.position.y);

            // Build the adjacency matrix of links between the stations
            for (let j = 0; j < station.linkedTo.length; j++) {
                let link: Link = {
                    from: i,
                    to: station.linkedTo[j],
                    tracks: tracks,
                };

                this.links[i].push(link);
                this.tracks[i][link.to] = [];
            }
        }

        let rect = document.body.getBoundingClientRect();

        // Center the camera on the first station
        this.two.scene.translation.x = (- this.stations[0].position.x / 2);
        this.two.scene.translation.y = (- this.stations[0].position.y / 2);

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

        console.log(this.tracks)

        // Draw each station
        for (let i = 0; i < this.stations.length; i++) {
            this.drawStation(this.stations[i]);
        }
    }

    update(frameCount: number, timeDelta: number) {
        // Updating GameTime
        this.gameTime.seconds += (timeDelta / 1000) * this.gameTime.multiplicator;

        // Update Trains on each line
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            for (let i = 0; i < line.trains.length; i++) {
                const train = line.trains[i];

                if (train.location.stopped) {
                    continue;
                }

                // Train Animation
                if (!this.tracks) {
                    return;
                }

                // Get first link
                if (!train.location.currentLink) {
                    train.location.currentLink = this.links[line.stations[0]].find(l => l.to === line.stations[1]);
                    train.location.stationIndex = 1;
                }

                let track: Two.Path;
                // Get first track of link and its direction
                if (!track) {
                    train.location.trackIsForward = true;
                    let tracks = this.tracks[train.location.currentLink.from][train.location.currentLink.to];
                    if (tracks.length === 0) {
                        train.location.trackIsForward = false;
                        tracks = this.tracks[train.location.currentLink.to][train.location.currentLink.from];
                    }

                    if (tracks.length !== 0) {
                        track = train.location.trackIsForward ? tracks[tracks.length - 1] : tracks[0];
                    }
                }

                train.element?.remove();
                if (track) {
                    let point = track.getPointAt(train.location.trackIsForward ? (train.location.percent / 100) : 1 - (train.location.percent / 100));
                    train.element = this.two.makeCircle(point.x, point.y, 1, 1);
                    train.location.position = { x: point.x, y: point.y };
                }

                let stationFrom = this.stations[train.location.currentLink.from];
                let stationTo = this.stations[train.location.currentLink.to];

                let meters = Math.sqrt(Math.pow(stationFrom.position.x - stationTo.position.x, 2) + Math.pow(stationFrom.position.y - stationTo.position.y, 2)) * 10
                let metersByMillisecond = train.info.maxSpeed * 1000 / 360000;
                let distanceTraveled = metersByMillisecond * timeDelta * this.gameTime.multiplicator;
                let distancePercent = distanceTraveled / meters;

                train.location.percent = train.location.percent + distancePercent;

                // Ended -> Get the next link
                if (train.location.percent > 100) {
                    train.location.percent = 0;
                    let currentStation = line.stations[train.location.stationIndex];
                    train.location.stationIndex = train.location.reverseTrip ? train.location.stationIndex - 1 : train.location.stationIndex + 1;

                    // Turn back
                    if (train.location.stationIndex >= line.stations.length) {
                        train.location.reverseTrip = true;
                        train.location.stationIndex -= 2;
                    } else if (train.location.stationIndex < 0) {
                        train.location.reverseTrip = false;
                        train.location.stationIndex = 0;
                    }

                    let newStation = line.stations[train.location.stationIndex];

                    console.log(`${train.info.name} Reached station ${this.stations[currentStation].name}`);

                    // Get the next link
                    train.location.currentLink = this.links[currentStation].find(l => l.to === newStation);
                    track = undefined;

                    // Pause the train for its stopping time
                    train.location.stopped = true;
                    setTimeout(() => {
                        train.location.stopped = false;
                        console.log(`${train.info.name} Now going to station ${this.stations[newStation].name}`);
                    }, train.schedule.stoppingTimeSeconds * 1000);
                }
            }
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
                this.tracks[link.from][link.to] = [];
                this.tracks[link.to][link.from] = [];
                if (linesUsingLink.length > 0 && !linesUsingLink.every(l => l.hidden)) {
                    this.drawTracks(link, 8, linesUsingLink.filter(l => !l.hidden).map(l => l.color), 1)
                    link.drawn = true;
                } else {
                    let lines = this.drawTracks(link, 1);
                    link.drawn = true;
                    let oppositelink = this.links[link.to].find((l) => l.to === link.from);
                    oppositelink.drawn = true;
                    this.tracks[link.from][link.to] = lines;
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
            // In this case, we draw the actual tracks
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
            // In this case, we draw the network lines
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

    private measure(lat1: number, lon1: number, lat2: number, lon2: number) {  // generally used geo measurement function
        var R = 6378.137; // Radius of earth in KM
        var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d * 1000; // meters
    }
}