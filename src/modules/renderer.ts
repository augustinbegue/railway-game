import Two from "two.js";
import type { Path } from "two.js/src/path";
import type { Line as TwoLine } from "two.js/src/shapes/line";
import type { GameMap, GameData, Line, Link, Station, Train, Passenger } from "../types";
import { Storage } from "./storage";


export class GameRenderer {
    two: Two;

    gameData: GameData = {
        time: {
            multiplicator: 1,
            seconds: 12 * 60 * 60,
            nextStationSpawn: 0,
        },
        stats: {
            passengersCreated: 0,
            passengersServed: 0,
        },
        settings: {
            stationStartNumber: 3,
            stationSpawnTime: 600,
            stationSpawnTimeVariation: 120,
            passengerArrivalInterval: 60,
            passengerArrivalIntervalVariation: 30,
        }
    };

    map: GameMap;
    stations: Station[];
    links: Link[][] = [];
    tracks: TwoLine[][][] = [];
    lines: Line[] = [];
    trains: Train[] = [];

    constructor(map: GameMap, stations: Station[], lines: Line[], trains: Train[]) {
        this.map = map;
        this.stations = stations;
        this.lines = lines;
        this.trains = trains;

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
        this.two.scene.translation.x = -(this.stations[0].position.x);
        this.two.scene.translation.y = -(this.stations[0].position.y);

        this.draw();
    }

    // Add a new train type
    addTrainType(train: Train): Train {
        train.id = this.trains.length;
        this.trains.push(train);
        Storage.save(Storage.keys.TRAINS, this.trains);

        return train;
    }

    // Edit a train type
    editTrainType(train: Train) {
        let index = this.trains.findIndex(t => t.id === train.id);
        this.trains[index] = train;
        Storage.save(Storage.keys.TRAINS, this.trains);

        return train;
    }

    // Add a new line
    addLine(line: Line): Line {
        line.id = this.lines.length;
        console.log(line);
        this.lines.push(line);
        Storage.save(Storage.keys.LINES, this.lines);

        return line;
    }

    // Edit a line
    editLine(line: Line) {
        let index = this.lines.findIndex(l => l.id === line.id);
        this.lines[index] = line;
        Storage.save(Storage.keys.LINES, this.lines);

        return line;
    }

    // Add a train to a line
    addTrainToLine(lineId: number, trainId: number) {
        // Ensure nothing is passed as a reference
        let newTrain = JSON.parse(JSON.stringify(this.trains[trainId]));
        newTrain.id = this.lines[lineId].trains.length;
        this.lines[lineId].trains.push(newTrain);
        Storage.save(Storage.keys.LINES, this.lines);

        return newTrain;
    }

    /**
     * Add a station to a line
     * @param lineId id of the line
     * @param stationId id of the station
     */
    addStationToLine(lineId: number, stationId: number) {
        let line = this.lines.find(line => line.id === lineId);
        let station = this.stations.find(station => station.id === stationId);
        let lastStationId = line.stationIds[line.stationIds.length - 1];
        let lastStation = this.stations.find(station => station.id === lastStationId);

        if (lastStation && !this.links[station.id].find(l => l.to === lastStation.id)) {
            this.createLink(lastStation, station);
        }

        // Add the station to the line
        line.stationIds = [...line.stationIds, stationId];
        station.lineIds = [...station.lineIds, lineId];

        // Save modified data
        Storage.save(Storage.keys.LINES, this.lines);
        Storage.save(Storage.keys.LINKS, this.links.map(links => links.map(link => {
            link.drawn = false;
            return link;
        })));
        Storage.save(Storage.keys.STATIONS, this.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));

        this.draw();
    }

    /**
     * Inserts a station between two stations on a line
     * @param lineId id of the line
     * @param stationId id of the station
     * @param index index to insert the station at
     */
    insertStationToLine(lineId: number, stationId: number, index: number) {
        const line = this.lines.find(line => line.id === lineId);
        const station = this.stations.find(station => station.id === stationId);

        // Insert the station in the line
        line.stationIds.splice(index, 0, station.id);

        // Create the links between the stations
        const prevStation = index - 1 >= 0 ? this.stations.find(station => station.id === line.stationIds[index - 1]) : null;
        const nextStation = index + 1 < line.stationIds.length ? this.stations.find(station => station.id === line.stationIds[index + 1]) : null;
        if (prevStation && !this.links[station.id].find(l => l.to === prevStation.id)) {
            this.createLink(prevStation, station);
        }
        if (nextStation && !this.links[station.id].find(l => l.to === nextStation.id)) {
            this.createLink(station, nextStation);
        }

        // Save modified data
        Storage.save(Storage.keys.LINES, this.lines);
        Storage.save(Storage.keys.LINKS, this.links.map(links => links.map(link => {
            link.drawn = false;
            return link;
        })));
        Storage.save(Storage.keys.STATIONS, this.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));

        this.draw();
    }


    /**
     * Removes a station from a line
     * @warning this does not removes the link between the stations
     * @param lineId id of the line
     * @param stationId id of the station
     * @returns 
     */
    removeStationFromLine(lineId: number, stationId: number) {
        let line = this.lines.find(line => line.id === lineId);
        let station = this.stations.find(station => station.id === stationId);

        // Remove the station from the line
        let index = line.stationIds.indexOf(station.id);
        line.stationIds.splice(index, 1);
        index = station.lineIds.indexOf(line.id);
        station.lineIds.splice(index, 1);

        // Save modified data
        Storage.save(Storage.keys.LINES, this.lines);
        Storage.save(Storage.keys.STATIONS, this.stations.map(station => {
            station.circle = null;
            station.text = null;
            return station;
        }));

        this.draw();
    }

    /**
         * Creates a link between two stations
         * @param station1 
         * @param station2 
         */
    private createLink(station1: Station, station2: Station) {
        console.log("Creating links between stations", station1.id, station2.id);
        // Create the links between the station and the line if it doesn't already exist
        let link1: Link = {
            from: station2.id,
            to: station1.id,
            tracks: 2,
        };
        this.links[station2.id].push(link1);
        let link2: Link = {
            from: station1.id,
            to: station2.id,
            tracks: 2,
        };
        this.links[station1.id].push(link2);

        station2.linkedTo.push(station1.id);
        station1.linkedTo.push(station2.id);
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
        // Updating GameTime
        let elapsedTime = (timeDelta / 1000) * this.gameData.time.multiplicator;
        this.gameData.time.seconds += (timeDelta / 1000) * this.gameData.time.multiplicator;

        // Update stations spawn time
        if (this.gameData.time.nextStationSpawn <= 0) {
            this.gameData.time.nextStationSpawn = this.gameData.settings.stationSpawnTime + Math.random() * this.gameData.settings.stationSpawnTimeVariation;
            let i = 0
            for (; i < this.stations.length && this.stations[i].spawned; i++) { }

            if (i < this.gameData.settings.stationStartNumber - 1)
                this.gameData.time.nextStationSpawn = 0;
            if (i < this.stations.length) {
                console.log("Spawning station", i);
                // Spawn station and set its initial values
                this.stations[i].spawned = true;

                this.stations[i].waitingPassengers = [];
                this.stations[i].waitingPassengersMax = 100;
                this.stations[i].passengersArrivalRate = 1;
                this.stations[i].nextPassengerArrival = this.gameData.settings.passengerArrivalInterval + Math.random() * this.gameData.settings.passengerArrivalIntervalVariation;

                this.draw();
            }
        } else {
            this.gameData.time.nextStationSpawn -= elapsedTime;
        }
        let spawnedStations = this.stations.filter(s => s.spawned);

        // Update station passengers
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];

            if (station.spawned) {
                if (station.nextPassengerArrival <= 0) {
                    let availableStations = spawnedStations.filter(s => s.id !== station.id);
                    let destinationStation = availableStations[Math.floor(Math.random() * availableStations.length)];

                    if (destinationStation) {
                        station.nextPassengerArrival = (this.gameData.settings.passengerArrivalInterval + Math.random() * this.gameData.settings.passengerArrivalIntervalVariation) / station.passengersArrivalRate;

                        let passenger: Passenger =
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

                        // console.log("Added passenger", passenger, "to station", station.id, "-", station.name);
                    }
                } else {
                    station.nextPassengerArrival -= elapsedTime;
                }
            }
        }

        // Update passengers itineraries
        for (let i = 0; i < this.stations.length; i++) {
            const station = this.stations[i];
            for (let j = 0; j < station.waitingPassengers.length; j++) {
                const p = station.waitingPassengers[j];
                p.itinerary = this.findPath(p.startStationId, p.endStationId);
            }
        }

        // Update Trains on each line
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];

            if (line.stationIds.length < 2)
                continue;

            for (let i = 0; i < line.trains.length; i++) {
                const train = line.trains[i];

                if (train.location.stopped) {
                    // Check if train stopping time is over
                    if (this.gameData.time.seconds - train.location.stoppedTime >= line.trainSchedule.stoppingTimeSeconds) {
                        train.location.stopped = false;
                        let newStationId = line.stationIds[train.location.stationIndex];
                        console.log(`${train.info.name}#${train.id} Now going to station ${this.stations[newStationId].name}`);
                    } else
                        continue;
                }

                // Train Animation
                if (!this.tracks) {
                    return;
                }

                // Train is not moving and we can start it => start its schedule
                if (!train.location.currentLink) {
                    if (this.gameData.time.seconds - line.trainSchedule.previousDepartureTime > line.trainSchedule.intervalSeconds) {
                        // Check if passengers need to board
                        this.boardPassengersToTrain(train, line.stationIds[0], line.stationIds[1]);

                        console.log(`Starting ${train.info.name}#${train.id} on line ${line.name}#${line.id}`);

                        line.trainSchedule.previousDepartureTime = this.gameData.time.seconds;
                        train.location.currentLink = this.links[line.stationIds[0]].find(l => l.to === line.stationIds[1]);
                        train.location.stationIndex = 1;
                    } else {
                        continue;
                    }
                }

                let track: Path;
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
                    let point = track.getPointAt(train.location.trackIsForward ? (train.location.percent / 100) : 1 - (train.location.percent / 100), null);
                    train.element = this.two.makeCircle(point.x, point.y, 1, 1);
                    train.location.position = { x: point.x, y: point.y };
                }

                let stationFrom = this.stations[train.location.currentLink.from];
                let stationTo = this.stations[train.location.currentLink.to];

                let meters = Math.sqrt(Math.pow(stationFrom.position.x - stationTo.position.x, 2) + Math.pow(stationFrom.position.y - stationTo.position.y, 2));

                let metersByMillisecond = train.info.maxSpeed * 1000 / 360000;
                let distanceTraveled = metersByMillisecond * timeDelta * this.gameData.time.multiplicator;
                let distancePercent = distanceTraveled / meters;

                train.location.percent = train.location.percent + distancePercent;

                // Train Reached Station
                if (train.location.percent > 100) {
                    // Get the next station
                    train.location.percent = 0;
                    let currentStationId = line.stationIds[train.location.stationIndex];
                    train.location.stationIndex = train.location.reverseTrip ? train.location.stationIndex - 1 : train.location.stationIndex + 1;

                    // Turn back if reached end of line
                    if (train.location.stationIndex >= line.stationIds.length) {
                        train.location.reverseTrip = true;
                        train.location.stationIndex -= 2;
                    } else if (train.location.stationIndex < 0) {
                        train.location.reverseTrip = false;
                        train.location.stationIndex = 0;
                    }

                    let newStationId = line.stationIds[train.location.stationIndex];

                    console.log(`${train.info.name} Reached station ${this.stations[currentStationId].name}`);

                    // Get the next link
                    train.location.currentLink = this.links[currentStationId].find(l => l.to === newStationId);
                    track = undefined;

                    // Pause the train for its stopping time
                    train.location.stopped = true;
                    train.location.stoppedTime = this.gameData.time.seconds;
                    console.log(`${train.info.name}#${train.id} is stopped for ${line.trainSchedule.stoppingTimeSeconds} seconds before going to ${this.stations[newStationId].name}`);

                    // Check if passengers need to disembark
                    this.disembarkPassengersFromTrain(train, currentStationId, newStationId);

                    // Check if passengers need to board
                    this.boardPassengersToTrain(train, currentStationId, newStationId);
                }
            }
        }
    }

    private disembarkPassengersFromTrain(train: Train, currentStationId: number, newStationId: number) {
        let currentStation = this.stations[currentStationId];

        for (let i = 0; i < train.passengers.length; i++) {
            const p = train.passengers[i];

            // A Passenger needs to disembark if:
            // - It is at the end of its itinerary
            // - The next station on the itinerary is not the same as the next station of the train
            let currentStationItineraryIndex = p.itinerary.indexOf(currentStationId);
            if ((p.itinerary.length - 1 === currentStationItineraryIndex) || (p.itinerary[currentStationItineraryIndex + 1] !== newStationId)) {
                // Disembark the passenger
                console.log(`${p.name} disembarked from ${train.info.name}#${train.id}`);
                train.passengers.splice(i, 1);
                i--;

                // If the passenger is at the end of its itinerary, don't add it to the station waiting list
                if (p.itinerary.length - 1 != currentStationItineraryIndex)
                    currentStation.waitingPassengers.push(p);
                else
                    this.gameData.stats.passengersServed = this.gameData.stats.passengersServed + 1;
            }
        }
    }

    private boardPassengersToTrain(train: Train, currentStationId: number, newStationId: number) {
        let currentStation = this.stations[currentStationId];

        for (let i = 0; i < currentStation.waitingPassengers.length; i++) {
            const p = currentStation.waitingPassengers[i];
            // A passenger can board if:
            // - The next station on the itinerary is the same as the next station of the train
            let currentStationItineraryIndex = p.itinerary.indexOf(currentStationId);
            if (p.itinerary[currentStationItineraryIndex + 1] === newStationId) {
                // Board the passenger
                console.log(`${p.name} boarded ${train.info.name}#${train.id}`);
                train.passengers.push(p);
                currentStation.waitingPassengers.splice(i, 1);
                i--;
            }
        }
    }

    /**
     * Finds the shortest path between two stations
     * @param from Station ID
     * @param to Station ID
     */
    private findPath(from: number, to: number, visited = new Set<number>()): number[] {
        // End of the path, return the last station
        if (from === to) {
            return [to];
        }

        let fromStation = this.stations.find(s => s.id === from);
        let toStation = this.stations.find(s => s.id === to);

        if (!fromStation || !toStation) {
            return [];
        }

        visited.add(from);
        let currentPath = [];
        for (let i = 0; i < fromStation.linkedTo.length; i++) {
            const id = fromStation.linkedTo[i];

            if (!visited.has(id)) {
                let path = this.findPath(id, to, visited);

                // If the path is not empty and the shortest, set it to the current path
                if (currentPath.length === 0 || (path.length < currentPath.length && currentPath.length != 0)) {
                    currentPath = path;
                }
            }
        }
        // Add the current station to the path only if the path is not empty
        return currentPath.length > 0 ? [from, ...currentPath] : [];
    }

    private drawStation(station: Station, fill = "#8f9ebf") {
        // TODO: Implement station colors

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

    private drawLink(from: number) {
        let linkAdjList = this.links[from];

        for (let i = 0; i < linkAdjList.length; i++) {
            const link = linkAdjList[i];

            if (!link.drawn) {
                this.tracks[link.from][link.to] = [];
                this.tracks[link.to][link.from] = [];

                let lines = this.drawTracks(link, 1);
                link.drawn = true;
                let oppositelink = this.links[link.to].find((l) => l.to === link.from);
                oppositelink.drawn = true;
                this.tracks[link.from][link.to] = lines;
            }
        }
    }

    private drawTracks(link: Link, width: number, colors = ["#626c80"], count?): TwoLine[] {
        let fromStation = this.stations[link.from];
        let toStation = this.stations[link.to];

        let fromPosition = fromStation.position;
        let toPosition = toStation.position;

        let angle = Math.atan2(
            toPosition.y - fromPosition.y,
            toPosition.x - fromPosition.x,
        );

        let num = count || link.tracks;


        let lines: TwoLine[] = [];
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
                (line as any).dashes = [10, 10];
                (line.dashes as any).offset = offset;
                lines.push(line);
            }
        }

        return lines;
    }

    private getLinesUsingLink(link: Link) {
        return this.lines.filter((l) => {
            let f = l.stationIds.indexOf(link.from);
            if (l.stationIds[f + 1] === link.to) {
                return true;
            } else {
                f = l.stationIds.indexOf(link.to)
                return l.stationIds[f + 1] === link.from;
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