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

