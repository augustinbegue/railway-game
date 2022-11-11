import Two from "two.js";
import type { Stop } from "two.js/src/effects/stop";
import type { Line as TwoLine } from "two.js/src/shapes/line";
import { gameData, lines, trains, trainSchedules } from "../stores";
import type { GameMap, GameData, ILink, Station, IPassenger, ITrainSchedule } from "../types";
import type { Line } from "./Line";
import { GameStorage } from "./GameStorage";
import type { Train } from "./Train";

export class GameRenderer {
    two: Two;

    gameData: GameData;

    map: GameMap;
    stations: Station[];
    links: ILink[][] = [];
    tracks: TwoLine[][][] = [];
    lines: Line[] = [];
    trainSchedules: ITrainSchedule[] = [];
    trains: Train[][] = [];
    paths: number[][][] = [];

    readonly overcrowdedColor = "#f54242";

    constructor(map: GameMap, stations: Station[]) {
        this.map = map;
        this.stations = stations;

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

        let scaleFactor = 1;

        let mapStartX = (mapStartLong * this.map.size) / scaleFactor;
        let mapStartY = 1 - (mapStartLat * this.map.size) / scaleFactor;

        // TODO: Compute station distance from the center to determine their spawn order

        // Init links and tracks array
        this.links = [];
        this.tracks = [];
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

            // Build the adjacency matrix of links between the stations
            for (let j = 0; j < station.linkedTo.length; j++) {
                let link: ILink = {
                    from: i,
                    to: station.linkedTo[j],
                    tracks: tracks,
                };

                this.links[i].push(link);
                this.tracks[i][link.to] = [];
            }
        }

        // Center the camera on the first station
        this.two.scene.translation.x = -(this.stations[0].position.x);
        this.two.scene.translation.y = -(this.stations[0].position.y);

        lines.subscribe(lines => {
            this.lines = lines;
            if (this.lines.length > 0)
                this.draw();
        });
        gameData.subscribe(gameData => {
            this.gameData = gameData;
        });
        trains.subscribe(trains => {
            this.trains = trains;
        });
        trainSchedules.subscribe(trainSchedules => {
            this.trainSchedules = trainSchedules;
        });

        this.paths = GameStorage.exists(GameStorage.keys.PATHS) ? GameStorage.get(GameStorage.keys.PATHS) : [];
    }

    /**
     * Creates a link between two stations
     * @param station1 
     * @param station2 
     */
    createLink(station1: Station, station2: Station): boolean {
        // Check if the player can afford the link
        if (this.gameData.economy.money < this.gameData.prices.link.buy) {
            return false;
        } else {
            this.gameData.economy.money -= this.gameData.prices.link.buy;
            gameData.set(this.gameData);
        }

        // Create the links between the station and the line if it doesn't already exist
        let link1: ILink = {
            from: station2.id,
            to: station1.id,
            tracks: 2,
        };
        this.links[station2.id].push(link1);
        let link2: ILink = {
            from: station1.id,
            to: station2.id,
            tracks: 2,
        };
        this.links[station1.id].push(link2);

        station2.linkedTo.push(station1.id);
        station1.linkedTo.push(station2.id);

        if (this.paths[station1.id] && this.paths[station1.id][station2.id])
            this.paths[station1.id][station2.id] = [];

        if (this.paths[station2.id] && this.paths[station2.id][station1.id])
            this.paths[station2.id][station1.id] = [];

        // Save modified data
        GameStorage.save(GameStorage.keys.LINKS, this.links);
        GameStorage.save(GameStorage.keys.STATIONS, this.stations);

        return true;
    }

    /**
     * Deletes a link between two stations
     * @param station1Id 
     * @param station2Id 
     */
    deleteLink(station1Id: number, station2Id: number) {
        this.links[station1Id].splice(this.links[station1Id].findIndex(l => l.to === station2Id), 1);
        this.links[station2Id].splice(this.links[station2Id].findIndex(l => l.to === station1Id), 1);

        this.stations[station1Id].linkedTo.splice(this.stations[station1Id].linkedTo.indexOf(station2Id), 1);
        this.stations[station2Id].linkedTo.splice(this.stations[station2Id].linkedTo.indexOf(station1Id), 1);

        // Save modified data
        GameStorage.save(GameStorage.keys.LINKS, this.links);
        GameStorage.save(GameStorage.keys.STATIONS, this.stations);
    }

    /**
     * Updates the screen
     */
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

        // Draw each line
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (!line.hidden) {
                for (let i = 0; i < line.stationIds.length - 1; i++) {
                    const idFrom = line.stationIds[i];
                    const idTo = line.stationIds[i + 1];

                    let path = this.findPath(idFrom, idTo);

                    if (path.length > 0) {
                        for (let i = 0; i < path.length - 1; i++) {
                            const pIdFrom = path[i];
                            const pIdTo = path[i + 1];

                            let link = this.links[pIdFrom].find(l => l.to === pIdTo);
                            this.drawTracks(link, 8, [line.color], 1)
                        }
                    }
                }
            }
        }

        // Draw each station
        for (let i = 0; i < this.stations.length; i++) {
            this.drawStation(this.stations[i]);
        }
    }

    update(frameCount: number, timeDelta: number) {
        let startMoney = this.gameData.economy.money;

        // Updating GameTime
        let elapsedSeconds = (timeDelta / 1000) * this.gameData.time.multiplicator;
        this.gameData.time.seconds += elapsedSeconds;

        // Substract maintenance costs
        let linksNumber = 0;
        this.links.forEach(l => linksNumber += l.length);
        this.gameData.economy.money -= linksNumber * (this.gameData.prices.link.maintain / (60 * 60)) * elapsedSeconds;
        let trainsNumber = 0;
        this.trains.forEach(t => trainsNumber += t.length);
        this.gameData.economy.money -= trainsNumber * (this.gameData.prices.train.maintain / (60 * 60)) * elapsedSeconds;


        // Update stations spawn time
        if (this.gameData.time.nextStationSpawn <= 0) {
            this.gameData.time.nextStationSpawn = this.gameData.settings.stationSpawnTime + Math.random() * this.gameData.settings.stationSpawnTimeVariation;
            let i = 0
            for (; i < this.stations.length && this.stations[i].spawned; i++) { }

            if (i < this.gameData.settings.stationStartNumber - 1)
                this.gameData.time.nextStationSpawn = 0;
            if (i < this.stations.length) {
                // Spawn station and set its initial values
                this.stations[i].spawned = true;

                this.stations[i].waitingPassengers = [];
                this.stations[i].waitingPassengersMax = 100;
                this.stations[i].passengersArrivalRate = 1;
                this.stations[i].nextPassengerArrival = this.gameData.settings.passengerArrivalInterval + Math.random() * this.gameData.settings.passengerArrivalIntervalVariation;

                this.draw();
            }
        } else {
            this.gameData.time.nextStationSpawn -= elapsedSeconds;
        }
        let spawnedStations = this.stations.filter(s => s.spawned);

        // Update station passengers
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];

            if (station.spawned) {
                if (station.nextPassengerArrival <= 0) {
                    let prevStationCount = station.waitingPassengers.length;
                    let availableStations = spawnedStations.filter(s => s.id !== station.id);
                    let destinationStation = availableStations[Math.floor(Math.random() * (availableStations.length - 1))];

                    if (destinationStation) {
                        station.nextPassengerArrival = (this.gameData.settings.passengerArrivalInterval + Math.random() * this.gameData.settings.passengerArrivalIntervalVariation) / station.passengersArrivalRate;

                        let passenger: IPassenger =
                        {
                            id: this.gameData.stats.passengersCreated++,
                            name: "Passenger " + this.gameData.stats.passengersCreated,
                            startStationId: station.id,
                            endStationId: destinationStation.id,
                            itinerary: this.findPath(station.id, destinationStation.id),
                            startTime: this.gameData.time.seconds,
                            endTime: 0,
                            waiting: true,
                        };

                        station.waitingPassengers = [...station.waitingPassengers, passenger];

                        // Redraw the station if it became overcrowded or not overcrowded
                        this.checkStationForRedraw(prevStationCount, station);
                    }
                } else {
                    station.nextPassengerArrival -= elapsedSeconds;
                }
            }
        }

        // Update Trains on each line
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (line.stationIds.length < 2)
                continue;

            for (let i = 0; i < this.trains[line.id].length; i++) {
                this.gameData.stats.passengersServed += this.trains[line.id][i].update(this, line, this.trainSchedules[line.id], timeDelta);
            }
        }

        gameData.set(this.gameData);
        trains.set(this.trains);

        let endMoney = this.gameData.economy.money;
        let moneyDelta = endMoney - startMoney;
    }

    checkStationForRedraw(prevStationCount: number, station: Station) {
        if (prevStationCount < station.waitingPassengersMax && station.waitingPassengers.length >= station.waitingPassengersMax
            || prevStationCount >= station.waitingPassengersMax && station.waitingPassengers.length < station.waitingPassengersMax) {
            this.drawStation(station);
        }
    }

    /**
     * Updates the itineraries of passengers linked to the specified stations.
     * @param affectedStationIds Station Ids that need to be redrawn
     */
    updatePassengersItineraries(affectedStationIds: number[]) {
        let itinerariesNotFound: boolean[][] = [];

        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];
            for (let j = 0; j < station.waitingPassengers.length; j++) {
                const p = station.waitingPassengers[j];

                if (!itinerariesNotFound[p.startStationId])
                    itinerariesNotFound[p.startStationId] = [];
                if (!itinerariesNotFound[p.endStationId])
                    itinerariesNotFound[p.endStationId] = [];

                if ((p.itinerary.length === 0 || p.itinerary.find(sId => affectedStationIds.includes(sId))) && !itinerariesNotFound[p.startStationId][p.endStationId]) {
                    p.itinerary = this.findPath(p.startStationId, p.endStationId);

                    if (p.itinerary.length === 0) {
                        console.log(`No path found for passenger ${p.name}: ${this.stations[p.startStationId].name} -> ${this.stations[p.endStationId].name}`);

                        itinerariesNotFound[p.startStationId][p.endStationId] = true;
                        itinerariesNotFound[p.endStationId][p.startStationId] = true;
                    }
                }
            }
        }
    }

    /**
     * Finds the shortest path between two stations
     * @param from Station ID
     * @param to Station ID
     */
    private findPath(from: number, to: number, visited: number[] = []): number[] {
        let fromStation = this.stations[from];
        let toStation = this.stations[to];

        if (!fromStation || !toStation) {
            return [];
        }

        // If a path was already found, return it
        if (this.paths[from] && this.paths[from][to]) {
            return this.paths[from][to];
        }

        visited.push(from);
        let currentPath = [];
        for (let i = 0; i < fromStation.linkedTo.length; i++) {
            const id = fromStation.linkedTo[i];

            if (!visited.includes(id)) {
                if (id === to) {
                    currentPath = [id];
                    break;
                }

                let path = this.findPath(id, to, [...visited]);

                // If the path is not empty and the shortest, set it to the current path
                if (currentPath.length === 0 || (path.length != 0 && path.length < currentPath.length)) {
                    currentPath = path;
                }
            }
        }

        // If a path was found, store it
        if (currentPath.length > 0) {
            if (!this.paths[from])
                this.paths[from] = [];
            this.paths[from][to] = [from, ...currentPath];

            if (!this.paths[to])
                this.paths[to] = [];
            this.paths[to][from] = [...this.paths[from][to]].reverse();
        }

        // Add the current station to the path only if the path is not empty
        return currentPath.length > 0 ? [from, ...currentPath] : [];
    }

    private drawStation(station: Station, fill = "#8f9ebf") {
        if (!station.spawned)
            return;

        if (station.circle) {
            station.circle.remove();
        }
        station.circle = this.two.makeCircle(
            station.position.x,
            station.position.y,
            station.size,
        ) as any;

        station.circle.fill = fill;

        // Overcrowded station indication
        if (station.waitingPassengers.length > station.waitingPassengersMax) {
            station.circle.fill = this.overcrowdedColor;
        }

        // Station lines
        let gradientStops: Stop[] = [];
        for (let i = 0; i < station.lineIds.length; i++) {
            const lineId = station.lineIds[i];
            const line = this.lines[lineId];

            gradientStops.push(new Two.Stop(i / station.lineIds.length, line.color));
            gradientStops.push(new Two.Stop((i + 1) / station.lineIds.length, line.color));
        }

        station.circle.stroke = this.two.makeLinearGradient(
            0,
            0,
            1,
            1,
            ...gradientStops
        );
        station.circle.linewidth = 5;

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

    private drawLink(from: number) {
        let linkAdjList = this.links[from];

        for (let i = 0; i < linkAdjList.length; i++) {
            const link = linkAdjList[i];

            if (!link.drawn) {
                this.tracks[link.from][link.to] = [];
                this.tracks[link.to][link.from] = [];

                let tracks = this.drawTracks(link, 1);
                link.drawn = true;
                let oppositelink = this.links[link.to].find((l) => l.to === link.from);
                if (!oppositelink) {
                    console.error(`No oppositelink found for link ${link.from} -> ${link.to}`);
                } else {
                    oppositelink.drawn = true;
                    this.tracks[link.from][link.to] = tracks;
                }
            }
        }
    }

    private drawTracks(link: ILink, width: number, colors = ["#626c80"], count?): TwoLine[] {
        let fromStation = this.stations[link.from];
        let toStation = this.stations[link.to];

        let fromPosition = fromStation.position;
        let toPosition = toStation.position;

        let angle = Math.atan2(
            toPosition.y - fromPosition.y,
            toPosition.x - fromPosition.x,
        );

        let num = count || link.tracks;


        let tracks: TwoLine[] = [];
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
                tracks.push(line);
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
                (line as any).dashes = [10, 10];
                (line.dashes as any).offset = offset;
                tracks.push(line);
            }
        }

        return tracks;
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
