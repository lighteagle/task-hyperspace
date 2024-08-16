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

let AllData = [
    { name: "Ships", features: [], markers: [] },
    { name: "Docks", features: [], markers: [] },
    { name: "Containers", features: [], markers: [] },
];

let tooltipsVisible = false; 

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
        setupCheckboxes();
        setupIDToggle();
    });
});

function setupLegend() {
    var div_legend = $("#ship-legend");
    div_legend.html("");
    div_legend.append(appendItems());
}

function appendItems() {
    let ctx = '<h4>Location</h4>';
    $.each(ITEMS, function (i, val) {
        const { name, color } = val;
        ctx += `<div>
                    <input type="checkbox" id="${name}" class="tree-checkbox" checked> 
                    <i style="background: ${color};"></i> ${name} <span class="feature-count" id="${name}-count" data-type="${name}">0</span>
                </div>`;
    });

    return ctx;
}

function addMarkers() {
    AllData.forEach((dataset, index) => {
        const color = ITEMS[index].color;
        dataset.features.forEach((feature) => {
            const coordinates = feature.geometry.coordinates;
            let ctxPopup =''
            let ctxLabel =''
            switch (dataset.name) {
                case "Ships":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.shipName}</h2>
                                    <p><strong>Ship ID:</strong> ${feature.properties.shipId}</p>
                                    <p><strong>Destination:</strong> ${feature.properties.dockId} | "Dock Name"</p>
                                    <p><strong>Time:</strong> ${new Date(feature.properties.timestamp).toLocaleString()}</p>
                                </div>`
                    ctxLabel =`${feature.properties.shipId} | ${feature.properties.shipName}`

                    break;

                case "Docks":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.dockName}</h2> 
                                    <p><strong>ID:</strong> ${feature.properties.dockId}</p>
                                    <p><strong>Capacity:</strong> ${feature.properties.capacity}</p>
                                </div>`
                    ctxLabel =`${feature.properties.dockId} | ${feature.properties.dockName}`

                    break;

                case "Containers":
                    ctxPopup = `<div class="popup-content">
                                    <h2>${feature.properties.containerId}</h2> 
                                    <p><strong>Type:</strong> ${feature.properties.containerType}</p>
                                    <p><strong>Size:</strong> ${feature.properties.containerSize}</p>
                                    <p><strong>Content:</strong> ${feature.properties.contents}</p>
                                    <p><strong>Destination:</strong> ${feature.properties.destinationDock}</p>
                                    </div>`
                    ctxLabel =`${feature.properties.containerId} | Destination : ${feature.properties.destinationDock}`

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
            dataset.markers.push(marker); // Store the marker
        });
    });
}

function setupCheckboxes() {
    $('.tree-checkbox').change(function() {
        const name = $(this).attr('id');
        const checked = $(this).is(':checked');

        AllData.forEach(dataset => {
            if (dataset.name === name) {
                dataset.markers.forEach(marker => {
                    if (checked) {
                        marker.addTo(map);
                    } else {
                        map.removeLayer(marker);
                    }
                });
            }
        });
    });
}

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
