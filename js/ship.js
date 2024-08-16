// Define constants
const MODUL = "ship";
const DEFAULT_ZOOM = 2;
const DEFAULT_CENTER = [0, 0];
const DEFAULT_BASEMAP = "Light";
const MULTIDATA = [
    { name: "Ships", data: "../data/ships.geojson" },
    { name: "Docks", data: "../data/docks.geojson" },
    { name: "Containers", data: "../data/containers.geojson" },
];
const ITEMS = [
    { name: "Ships", color: "blue" },
    { name: "Docks", color: "orange" },
    { name: "Containers", color: "gray" },
];

// Define global variables
let tooltipsVisible = false; 
let AllData = [
    { name: "Ships", features: [], markers: [], lines: [] },
    { name: "Docks", features: [], markers: [] },
    { name: "Containers", features: [], markers: [], lines: [] },
];

// Fetch data
Promise.all(
    MULTIDATA.map((source, index) =>
        fetch(source.data)
            .then((response) => response.json())
            .then((geojson) => {
                AllData[index].features = geojson.features;
            })
            .catch(console.error)
    )
).then(() => {
    console.log(AllData);
    $(document).ready(() => {
        setupLegend();
        addMarkers();
        addLines(); 
        setupCheckboxes();
        setupIDToggle();
    });
});

// Setup Legend
function setupLegend() {
    var div_legend = $("#ship-legend");
    div_legend.html("");
    div_legend.append(appendItems());
}

// Append items to legend
function appendItems() {
    let ctx = '<h4>Location</h4>';
    $.each(ITEMS, function (i, val) {
        const { name, color } = val;
        ctx += `<div>
                    <input type="checkbox" id="${name}" class="tree-checkbox" checked> 
                    <i style="background: ${color};"></i> ${name} <span class="feature-count" id="${name}-count" data-type="${name}">0</span>
                </div>`;
    });

    ctx += '<h4>Connections</h4>';
    ctx += `<div>
                <input type="checkbox" id="ship-lines" class="tree-checkbox" checked>
                <i style="background: blue;"></i> Ships to Docks
            </div>`;
    ctx += `<div>
                <input type="checkbox" id="container-lines" class="tree-checkbox" checked>
                <i style="background: gray;"></i> Containers to Docks
            </div>`;

    return ctx;
}

// Add Markers for each dataset including popup & labels
function addMarkers() {
    AllData.forEach((dataset, index) => {
        const color = ITEMS[index].color;
        let count = 0; 
        dataset.features.forEach(feature => {
            const coordinates = feature.geometry.coordinates;
            let ctxPopup = '';
            let ctxLabel = '';
            switch (dataset.name) {
                case "Ships":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.shipName}</h2>
                                    <p><strong>Ship ID:</strong> ${feature.properties.shipId}</p>
                                    <p><strong>Destination:</strong> ${feature.properties.dockId} | ${getDockName(feature.properties.dockId)}</p>
                                    <p><strong>Time:</strong> ${new Date(feature.properties.timestamp).toLocaleString()}</p>
                                </div>`;
                    ctxLabel = `${feature.properties.shipId} | ${feature.properties.shipName}`;
                    break;

                case "Docks":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.dockName}</h2> 
                                    <p><strong>ID:</strong> ${feature.properties.dockId}</p>
                                    <p><strong>Capacity:</strong> ${feature.properties.capacity}</p>
                                </div>`;
                    ctxLabel = `${feature.properties.dockId} | ${feature.properties.dockName}`;
                    break;

                case "Containers":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.containerId}</h2> 
                                    <p><strong>Type:</strong> ${feature.properties.containerType}</p>
                                    <p><strong>Size:</strong> ${feature.properties.containerSize}</p>
                                    <p><strong>Content:</strong> ${feature.properties.contents}</p>
                                    <p><strong>Destination:</strong> ${getDockName(feature.properties.destinationDock)}</p>
                                </div>`;
                    ctxLabel = `${feature.properties.containerId} | Destination: ${feature.properties.destinationDock}`;
                    break;
            }
            const marker = L.circleMarker(
                [coordinates[1], coordinates[0]],
                {
                    radius: 8,
                    fillColor: color,
                    color: "#fff",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                }
            )
                .bindPopup(ctxPopup)
                .bindTooltip(ctxLabel, {
                    permanent: tooltipsVisible,
                    direction: "top",
                    offset: [0, -5],
                });

            marker.addTo(map);
            dataset.markers.push(marker); 
            count++; 
        });
        
        $(`#${dataset.name}-count`).text(count);
    });
}

// Add Connection Lines from feature to Destination Docks
function addLines() {
    const docks = {};
    AllData[1].features.forEach(feature => {
        const coordinates = feature.geometry.coordinates;
        docks[feature.properties.dockId] = coordinates;
    });

    // Add lines from ships to destination docks
    AllData[0].markers.forEach(marker => {
        const shipId = marker.getTooltip().getContent().split('|')[0].trim();
        const dockId = AllData[0].features.find(feature => feature.properties.shipId === shipId).properties.dockId;
        if (docks[dockId]) {
            const line = L.polyline([
                marker.getLatLng(),
                L.latLng(docks[dockId][1], docks[dockId][0])
            ], {
                color: 'blue',
                weight: 2,
                opacity: 0.7
            }).addTo(map);

            AllData[0].lines.push(line);
        }
    });

    // Add lines from containers to destination docks
    AllData[2].markers.forEach(marker => {
        const containerId = marker.getTooltip().getContent().split('|')[0].trim();
        const dockId = AllData[2].features.find(feature => feature.properties.containerId === containerId).properties.destinationDock;
        if (docks[dockId]) {
            const line = L.polyline([
                marker.getLatLng(),
                L.latLng(docks[dockId][1], docks[dockId][0])
            ], {
                color: 'gray',
                weight: 2,
                opacity: 0.7
            }).addTo(map);

            AllData[2].lines.push(line);
        }
    });
}

// Setup checkboxes for show/hide feature
function setupCheckboxes() {
    $('.tree-checkbox').change(function() {
        const id = $(this).attr('id');
        const checked = $(this).is(':checked');

        if (id === "ship-lines") {
            AllData[0].lines.forEach(line => {
                if (checked) {
                    line.addTo(map);
                } else {
                    map.removeLayer(line);
                }
            });
        } else if (id === "container-lines") {
            AllData[2].lines.forEach(line => {
                if (checked) {
                    line.addTo(map);
                } else {
                    map.removeLayer(line);
                }
            });
        } else {
            AllData.forEach(dataset => {
                if (dataset.name === id) {
                    dataset.markers.forEach(marker => {
                        if (checked) {
                            marker.addTo(map);
                        } else {
                            map.removeLayer(marker);
                        }
                    });
                }
            });
        }
    });
}

// Setup toggle for show/hide tooltips
function setupIDToggle() {
    $('#show-tooltips').change(function() {
        tooltipsVisible = $(this).is(':checked');
        
        AllData.forEach(dataset => {
            dataset.markers.forEach(marker => {
                if (tooltipsVisible) {
                    marker.bindTooltip(marker.getTooltip().getContent(), {
                        permanent: true,
                        direction: "top",
                        offset: [0, -5],
                    }).openTooltip();
                } else {
                    marker.closeTooltip();
                }
            });
        });
    });
}

// Helper function to get dock name from dockId
function getDockName(dockId) {
    const dock = AllData[1].features.find(feature => feature.properties.dockId === dockId);
    return dock ? dock.properties.dockName : "Unknown Dock";
}
