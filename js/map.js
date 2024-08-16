const lightMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 18, attribution: "© OpenStreetMap contributors, © CARTO" }
);
const darkMap = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 18, attribution: "© OpenStreetMap contributors, © CARTO" }
);
const satelliteMap = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 18,
        attribution:
            "© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community",
    }
);
const baseMaps = {  Satellite: satelliteMap , Light: lightMap, Dark: darkMap};
const map = L.map("map", {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    layers: [baseMaps[DEFAULT_BASEMAP]],
});

L.control.layers(baseMaps).addTo(map);
L.control.sidebar({ container: "sidebar" }).addTo(map).open("home");

const createCustomCircleLayer = (featureType, featureData) => {
    var color = TREE_ITEMS.find((tree) => tree.name === featureType).color;
    const layerGroup = L.layerGroup(
        featureData.features
            .filter((feature) => feature.properties.treeType === featureType)
            .map((feature) =>
                L.circleMarker(
                    [
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0],
                    ],
                    {
                        radius: 8,
                        fillColor: color,
                        color: "#fff",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8,
                    }
                )
                    .bindPopup(
                        `<div class="popup-content">
                            <h2>${feature.properties.treeType}</h2>
                            <p><strong>ID:</strong> ${feature.properties.treeId}</p>
                            <p><strong>Age:</strong> ${feature.properties.age} years</p>
                            <p><strong>Health:</strong> ${feature.properties.health}</p>
                        </div>`
                    )
                    .bindTooltip(`${feature.properties.treeId}`, {
                        permanent: tooltipsVisible,
                        direction: "top",
                        offset: [0, -5],
                    })
            )
    );

    const countElement = document.getElementById(`${featureType}-count`);
    if (countElement) {
        countElement.textContent = layerGroup.getLayers().length;
    }

    return layerGroup;
};

const zoomToFitAll = () => {
    const bounds = L.latLngBounds(
        AllData.map((feature) => [
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
        ])
    );
    map.fitBounds(bounds);
};

const updateTooltipVisibility = () => {
    tooltipsVisible = $("#show-tooltips").is(":checked");
    Object.values(treeLayers).forEach((layerGroup) => {
        layerGroup.eachLayer((layer) =>
            tooltipsVisible ? layer.openTooltip() : layer.closeTooltip()
        );
    });
};

// Zoom to a specific tree type
const zoomToTreeType = (treeType) => {
    const bounds = L.latLngBounds(
        treeLayers[treeType].getLayers().map((layer) => layer.getLatLng())
    );
    map.fitBounds(bounds);
};
