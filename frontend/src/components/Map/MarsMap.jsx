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


export default function MarsMap(){

    const [selectionMode, setSelectionMode] = useState("start");
    const [startCell, setStartCell] = useState(null);
    const [destinationCell, setDestinationCell] = useState(null);
    const [route, setRoute] = useState([]);

    const selectionModeRef = useRef("start");
    const startCellRef = useRef(null);

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

            selectionModeRef.current = "destination";
            setSelectionMode("destination");

        } else {

            setDestinationCell(cell);

            try {
                const response = await fetch("http://localhost:8080/api/routes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        start: startCellRef.current,
                        destination: cell,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to calculate route");
                }

                const path = await response.json();

                setRoute(path);
                console.log("A* route received:", path);

            } catch (error) {
                console.error("Route calculation failed:", error);
                setRoute([]);
            }

            selectionModeRef.current = "start";
            setSelectionMode("start");
        }

        console.log("Click processed");
    };


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

    }, [startCell, destinationCell]);


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
        </div>
    );
}
