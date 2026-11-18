import { useEffect, useRef, useState } from "react";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import LineString from "ol/geom/LineString";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import Map from "ol/Map";
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";
import View from "ol/View";
import Projection from "ol/proj/Projection";
import TileLayer from "ol/layer/Tile";
import ImageLayer from "ol/layer/Image";
import Static from "ol/source/ImageStatic";

import "ol/ol.css";

const west = 137.55375;
const east = 137.86625;
const south = -5.61625;
const north = -5.30375;

const marsRadius = 3396190;

const marsProjection = new Projection({
    code: "MARS:GEOGRAPHIC",
    units: "degrees",
    metersPerUnit: (2 * Math.PI * marsRadius) / 360,
    extent: [west, south, east, north],
});


const scaleDenominators = [
    2.7922763629807472E+08,
    1.3961381814903736E+08,
    6.9806909074518681E+07,
    3.4903454537259340E+07,
    1.7451727268629670E+07,
    8.7258636343148351E+06,
    4.3629318171574175E+06,
    2.1814659085787088E+06,
    1.0907329542893544E+06,
    5.4536647714467719E+05,
    2.7268323857233860E+05,
    1.3634161928616930E+05,
];



const matrixSizes = scaleDenominators.map((_, index) => [2 ** (index + 1),2 ** index]);

const resolutions = matrixSizes.map(size => 360 / (size[0] * 256));

const matrixIds = scaleDenominators.map((_, index) => String(index));

const ctxTileGrid = new WMTSTileGrid({
    origin: [-180, 90],
    resolutions: resolutions,
    matrixIds: matrixIds,
    sizes: matrixSizes,
    tileSize: 256,
    extent: [-180, -90, 180, 90],
});

const scienceObjectives = [
    {
        id: 1,
        name: "Boxwork Formation",
        description: "Candidate target for studying boxwork ridge structures.",
        row: 10,
        col: 12
    },
    {
        id: 2,
        name: "Layered Outcrop",
        description: "Candidate target for examining exposed geological layers.",
        row: 20,
        col: 25
    },
    {
        id: 3,
        name: "Rock Texture",
        description: "Candidate target for examining surface rock textures.",
        row: 30,
        col: 18
    }
];


export default function MarsMap(){

    const [selectionMode, setSelectionMode] = useState("start");
    const [startCell, setStartCell] = useState(null);
    const [destinationCell, setDestinationCell] = useState(null);
    const [route, setRoute] = useState([]);
    const [routeMetrics, setRouteMetrics] = useState(null);
    const [maxSlope, setMaxSlope] = useState(20);
    const [walkingSpeed, setWalkingSpeed] = useState(1.0);
    const [evaTimeBudget, setEvaTimeBudget] = useState(240);
    const [selectedObjectives, setSelectedObjectives] = useState([]);

    const selectionModeRef = useRef("start");
    const startCellRef = useRef(null);
    const selectedObjectivesRef = useRef([]);

    const mapElement = useRef(null);
    const markerSourceRef = useRef(null);
    const routeSourceRef = useRef(null);

    const handleMapClick = async (event) => {
        console.log("MAP CLICK DETECTED", event.coordinate);

        const [longitude, latitude] = event.coordinate;

        const col = Math.floor(((longitude - west) / (east - west)) * 40);

        const row = Math.floor(((north - latitude) / (north - south)) * 40);

        console.log("Selected cell:", { row, col });
        console.log("Selection mode:", selectionModeRef.current);

        if (row < 0 || row >= 40 || col < 0 || col >= 40) {
            return;
        }

        const cell = { row, col };

        if (selectionModeRef.current === "start") {

            startCellRef.current = cell;

            setStartCell(cell);
            setDestinationCell(null);
            setRoute([]);
            setRouteMetrics(null);

            selectionModeRef.current = "destination";
            setSelectionMode("destination");

        } else {

            setDestinationCell(cell);

            console.log("Selected waypoints:",
                scienceObjectives
                    .filter(objective =>
                        selectedObjectivesRef.current.includes(objective.id)
                    )
                    .map(objective => ({
                        row: objective.row,
                        col: objective.col
                    }))
            );

            try {
                const response = await fetch("http://localhost:8080/api/routes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        start: startCellRef.current,
                        destination: cell,
                        maxSlope: maxSlope,
                        walkingSpeed: walkingSpeed,
                        waypoints: scienceObjectives.filter((objective) => 
                            selectedObjectivesRef.current.includes(objective.id)
                        ).map((objective) => ({
                            row: objective.row,
                            col: objective.col
                        }))
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to calculate route");
                }

                const data = await response.json();
                console.log("Returned route:", data.path);

                setRoute(data.path);
                setRouteMetrics(data.metrics);

                console.log("Route metrics:", data.metrics);

            } catch (error) {
                console.error("Route calculation failed:", error);
                setRoute([]);
                setRouteMetrics(null);
            }

            selectionModeRef.current = "start";
            setSelectionMode("start");
        }

        console.log("Click processed");
    };

    useEffect(() => {
        selectedObjectivesRef.current = selectedObjectives;
    }, [selectedObjectives]);


    useEffect(() => {
        if (!mapElement.current) return;

        const ctxSource = new WMTS({
            url: "https://api.nasa.gov/mars-wmts/catalog/curiosity_ctx_mosaic/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
            layer: "curiosity_ctx_mosaic",
            matrixSet: "default028mm",
            format: "image/png",
            projection: marsProjection,
            tileGrid: ctxTileGrid,
            style: "default",
            requestEncoding: "REST",
        });

        const ctxLayer = new TileLayer({
            source: ctxSource,
        });

        const markerSource = new VectorSource();
        markerSourceRef.current = markerSource;

        const routeSource = new VectorSource();
        routeSourceRef.current = routeSource;

        const routeLayer = new VectorLayer({
            source: routeSource,
        });

        const markerLayer = new VectorLayer({
            source: markerSource,
        });

        const terrainLayer = new ImageLayer({
            source: new Static({
                url: "/data/terrain_overlay.png",
                projection: marsProjection,
                imageExtent: [west, south, east, north],
            }),
            opacity: 0.30,
        });

        const view = new View({
            projection: marsProjection,
            center: [137.71, -5.46],
            minZoom: 0,
            maxZoom: 12,
        });

        const map = new Map({
            target: mapElement.current,
            layers: [ctxLayer, terrainLayer, routeLayer, markerLayer],
            view: view,
        });

        map.on("click", handleMapClick);

        map.updateSize();

        view.fit([west, south, east, north], {
            size: map.getSize(),
            padding: [30, 30, 30, 30],
        });

        return () => {
            map.un("click", handleMapClick);
            map.setTarget(undefined);

            markerSourceRef.current = null;
            routeSourceRef.current = null;
        };

    }, []);


    useEffect(() => {

        const markerSource = markerSourceRef.current;

        if (!markerSource) return;

        markerSource.clear();

        const cellToCoordinate = (cell) => {

            const longitude = west + (cell.col + 0.5) * (east - west) / 40;
            const latitude = north - (cell.row + 0.5) * (north - south) / 40;

            return [longitude, latitude];
        };

        const addMarker = (cell, color) => {

            if (!cell) return;

            const marker = new Feature({
                geometry: new Point(cellToCoordinate(cell)),
            });

            marker.setStyle(new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({ color }),
                    stroke: new Stroke({
                        color: "#ffffff",
                        width: 2,
                    }),
                }),
            }));

            markerSource.addFeature(marker);
        };

        addMarker(startCell, "#22c55e");
        addMarker(destinationCell, "#ef4444");

        scienceObjectives.forEach((objective) => {
            const isSelected = selectedObjectives.includes(objective.id);

            addMarker(
                { row: objective.row, col: objective.col },
                isSelected ? "#f59e0b" : "#a78bfa"
            );
        });

    }, [startCell, destinationCell, selectedObjectives]);


    useEffect(() => {

        const routeSource = routeSourceRef.current;

        if (!routeSource) return;

        routeSource.clear();

        if (route.length === 0) return;

        const coordinates = route.map((cell) => {

            const longitude = west + (cell.col + 0.5) * (east - west) / 40;
            const latitude = north - (cell.row + 0.5) * (north - south) / 40;

            return [longitude, latitude];
        });

        const routeFeature = new Feature({geometry: new LineString(coordinates),
        });

        routeFeature.setStyle(new Style({
            stroke: new Stroke({
                color: "#2563eb",
                width: 4,
            }),
        }));

        routeSource.addFeature(routeFeature);

    }, [route]);

    const estimatedWalkingMinutes = routeMetrics ? routeMetrics.distanceMeters / walkingSpeed / 60 : 0;

    const isWithinEvaBudget = routeMetrics !== null && estimatedWalkingMinutes <= evaTimeBudget;


    return (
        <div className="map-container">
            <div ref={mapElement} className="mars-map" />

            <div className="terrain-legend">
                <h3>Terrain Difficulty</h3>

                <div className="legend-item">
                    <span className="legend-color low"></span>
                    <span>Lower cost (1)</span>
                </div>

                <div className="legend-item">
                    <span className="legend-color medium"></span>
                    <span>Moderate cost (3)</span>
                </div>

                <div className="legend-item">
                    <span className="legend-color high"></span>
                    <span>Higher cost (8)</span>
                </div>

                <p>Derived from MOLA elevation and slope</p>

            </div>

            <div className="slope-control">
                <h3>Astronaut Suit Constraints</h3>

                <label>
                    Maximum allowable slope: {maxSlope}°
                </label>

                <input
                    type="range" min="5" max="40" step="1" value={maxSlope}
                    onChange={(event) => {
                        setMaxSlope(Number(event.target.value));
                    }}
                />

                <div className="slope-range">
                    <span>5°</span>
                    <span>40°</span>
                </div>

                <div className="walking-speed-control">
                    <label>
                        Walking speed: {walkingSpeed.toFixed(1)} m/s
                    </label>

                    <input
                        type="range" min="0.2" max="1.5" step="0.1" value={walkingSpeed}
                        onChange={(event) => setWalkingSpeed(Number(event.target.value))}
                    />
                </div>

                <div className="eva-budget-control">
                    <label>
                        EVA time budget: {evaTimeBudget} minutes
                        ({(evaTimeBudget / 60).toFixed(1)} hours)
                    </label>

                    <input
                        type="range" min="60" max="480" step="15" value={evaTimeBudget} onChange={(event) => setEvaTimeBudget(Number(event.target.value))}
                    />
                </div>
            </div>

            <div className="science-objectives">
                <h3>Science Objectives</h3>

                {scienceObjectives.map((objective) => (
                    <label key={objective.id} className="objective-item">
                        <input
                            type="checkbox"
                            checked={selectedObjectives.includes(objective.id)}
                            onChange={(event) => {
                                const updatedSelection = event.target.checked ? 
                                [...selectedObjectivesRef.current, objective.id] :
                                 selectedObjectivesRef.current.filter((id) => id !== objective.id);
                                
                                selectedObjectivesRef.current = updatedSelection;
                                setSelectedObjectives(updatedSelection);
                            }}
                        />

                        <div>
                            <strong>{objective.name}</strong>
                            <p>{objective.description}</p>
                        </div>
                    </label>
                ))}

                <div className="selected-count">
                    Selected objectives: {selectedObjectives.length}
                </div>
            </div>

            
            
            <div className="selection-info">
                <p>
                    Selection mode: {selectionMode}
                </p>

                <p>
                    Start: {startCell
                        ? `Row ${startCell.row}, Col ${startCell.col}`
                        : "Not selected"}
                </p>

                <p>
                    Destination: {destinationCell
                        ? `Row ${destinationCell.row}, Col ${destinationCell.col}`
                        : "Not selected"}
                </p>
            </div>
            {routeMetrics && (
                <div className="route-metrics">
                    <h3>Route Metrics</h3>

                    <p>Distance: {(routeMetrics.distanceMeters / 1000).toFixed(2)} km</p>

                    <p>
                        Estimated walking time: {
                            (routeMetrics.distanceMeters / walkingSpeed / 60).toFixed(1)
                        } min
                    </p>
                    <p>
                        EVA feasibility: {isWithinEvaBudget ? "Within time budget" : "Exceeds time budget"}
                    </p>

                    <p> Terrain cost: {routeMetrics.terrainCost.toFixed(0)} </p>

                    <p>Walking speed: {walkingSpeed.toFixed(1)} m/s</p>
                </div>
            )}
        </div>
    );
}
