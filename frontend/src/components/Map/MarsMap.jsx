import { useEffect, useRef, useState } from "react";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

import Map from "ol/Map";
import View from "ol/View";
import Projection from "ol/proj/Projection";
import ImageLayer from "ol/layer/Image";
import Static from "ol/source/ImageStatic";

import "ol/ol.css";

const west = 137.55375;
const east = 137.86625;
const south = -5.61625;
const north = -5.30375;

const marsProjection = new Projection({
    code: "MARS:GEOGRAPHIC",
    units: "degrees",
    extent: [west, south, east, north],
});

export default function MarsMap(){

    const [selectionMode, setSelectionMode] = useState("start");
    const [startCell, setStartCell] = useState(null);
    const [destinationCell, setDestinationCell] = useState(null);
    const selectionModeRef = useRef("start");
    
    const mapElement = useRef(null);

    const handleMapClick = (event) => {
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
            setStartCell(cell);
            selectionModeRef.current = "destination";
            setSelectionMode("destination");
        } else {
            setDestinationCell(cell);
            selectionModeRef.current = "start";
            setSelectionMode("start");
        }
        console.log("Click processed");
    };

    
    useEffect(() => {
        if (!mapElement.current) return;

        const elevationLayer = new ImageLayer({
            source: new Static({
                url: "/data/sajama_elevation_raster.png",
                projection: marsProjection,
                imageExtent: [west, south, east, north],
            }),
        });

        const markerSource = new VectorSource();

        const markerLayer = new VectorLayer({
            source: markerSource,
        });

        const view = new View({
            projection: marsProjection,
            center: [137.71, -5.46],
            minZoom: 0,
            maxZoom: 12,
        });

        const map = new Map({
            target: mapElement.current,
            layers: [elevationLayer, markerLayer],
            view: view,
        });

        map.on("click", handleMapClick);

        const updateMarkers = () => {
        markerSource.clear();

        const addMarker = (cell, color) => {
            if (!cell) return;

            const longitude = west + (cell.col + 0.5) * (east - west) / 40;
            const latitude = north - (cell.row + 0.5) * (north - south) / 40;

            const marker = new Feature({
                geometry: new Point([longitude, latitude]),
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
    };

    updateMarkers();

        map.updateSize();

        view.fit([west, south, east, north], {
            size: map.getSize(),
            padding: [30, 30, 30, 30],
        });

        return () => {
            map.un("click", handleMapClick);
            map.setTarget(undefined);
        };
    }, [startCell, destinationCell]);


    return (
        <div>
            <div ref={mapElement} className="mars-map" />

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