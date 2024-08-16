// Define tree colors
const MODUL = "Plantation";
const DEFAULT_ZOOM = 5;
const DEFAULT_CENTER = [37.0902, -105.7129];
const DEFAULT_BASEMAP = "Satellite";
const DATA = "../data/plants.geojson";

let AllData = [];
const treeLayers = {};
let tooltipsVisible = true;

const TREE_ITEMS = [
    { name: "Oak", color: "#6B4C41"},
    { name: "Pine", color: "#003D34"},
    { name: "Maple", color: "#F44336"},
    { name: "Birch", color: "#CFD8DC"},
    { name: "Palm", color: "#FF5722"},
    { name: "Cedar", color: "#C62828"},
    { name: "Fir", color: "#004D40"},
    { name: "Cherry", color: "#D32F2F"},
    { name: "Redwood", color: "#8B4513"},
];

fetch(DATA)
    .then((response) => response.json())
    .then((geojson) => {
        AllData = geojson.features;

        $(document).ready(() => {
            setupLegend();
            updateLayers(geojson);

            $('input[type="checkbox"]').change(() => updateLayers(geojson));
            $("#show-tooltips").change(updateTooltipVisibility);
            $("#zoom-all").click(zoomToFitAll);
        });
    })
    .catch(console.error);

// Setup Legend
function setupLegend() {
    var div_legend = $("#tree-legend");
    div_legend.html("");
    div_legend.append(appendTreeItems());
}

function appendTreeItems() {
    let ctx = '<h4 title="Click Number to zoom to the location.">Tree</h4>';

    $.each(TREE_ITEMS, function (i, val) {
        const { name, color } = val;
        ctx += `  <div>
                    <input type="checkbox" id="${name}" class="tree-checkbox" checked> 
                    <i style="background: ${color};"></i> ${name} <span class="feature-count" id="${name}-count" data-type="${name}">0</span>
                </div>`;
    });

    return ctx;
}

// Update layers and tree counts based on checkbox status
const updateLayers = (geojson) => {
    $('input[class="tree-checkbox"]').each(function () {
        const treeType = this.id;
        if (this.checked) {
            if (!treeLayers[treeType]) {
                treeLayers[treeType] = createCustomCircleLayer(
                    treeType,
                    geojson
                ).addTo(map);
            }
        } else {
            if (treeLayers[treeType]) {
                map.removeLayer(treeLayers[treeType]);
                delete treeLayers[treeType];
            }
        }
    });
    updateTreeCounts(geojson);
};

// Update tree counts and set click events
const updateTreeCounts = (geojson) => {
    $(".feature-count").each(function () {
        const treeType = $(this).data("type");
        $(this)
            .text(
                geojson.features.filter(
                    (feature) => feature.properties.treeType === treeType
                ).length
            )
            .click(() => zoomToTreeType(treeType));
    });
};
