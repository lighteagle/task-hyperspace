// Define constants
const MODUL             = "Wildlife";
const DEFAULT_ZOOM      = 4;
const DEFAULT_CENTER    = [9.082, 8.6753];
const DEFAULT_BASEMAP   = "Satellite";
const DATA              = "../data/animals.geojson";

// Define global variables
let allAnimalData       = [];
let speciesList         = [];
let animalIds           = [];
let dates               = [];
let times               = [];
let animalPath          = null;
let speciesSelect       = $('#species-select');
let animalSelect        = $('#animal-select');
let dateSelect          = $('#date-select');
let timeSlider          = $('#time-slider');
let timeDisplay         = $('#time-display');

// Fetch data
fetch(DATA)
    .then(response => response.json())
    .then(animalData => {
        allAnimalData = animalData.features;
        populateSpeciesSelect(allAnimalData);
    })
    .catch(console.error);

// Populate species dropdown
function populateSpeciesSelect(data) {
    speciesList = [...new Set(data.map(feature => feature.properties.species))];
    speciesSelect.html('<option value="">--Select Species--</option>'); // Reset options
    speciesList.forEach(species => {
        speciesSelect.append(`<option value="${species}">${species}</option>`);
    });
}

// Handle species selection
speciesSelect.on('change', function() {
    const selectedSpecies = $(this).val();
    if (selectedSpecies) {
        const filteredData = allAnimalData.filter(feature => feature.properties.species === selectedSpecies);
        populateAnimalSelect(filteredData);
        animalSelect.parent().show();
        $('#animal-select-container').show();
    } else {
        animalSelect.parent().hide();
        dateSelect.parent().hide();
        timeSlider.parent().hide();
        $('#animal-select-container').hide();
        $('#date-select-container').hide();
        $('#time-slider-container').hide();
        clearMarkers();
        clearPolyline();
    }
});

// Populate animal ID dropdown
function populateAnimalSelect(data) {
    animalIds = [...new Set(data.map(feature => feature.properties.animalId))];
    animalSelect.html('<option value="">--Select Animal--</option>'); // Reset options
    animalIds.forEach(id => {
        animalSelect.append(`<option value="${id}">${id}</option>`);
    });

    animalSelect.off('change').on('change', function() {
        const selectedAnimalId = $(this).val();
        if (selectedAnimalId) {
            const filteredData = allAnimalData.filter(feature => feature.properties.animalId === selectedAnimalId);
            populateDateSelect(filteredData);
            dateSelect.parent().show();
            $('#date-select-container').show();
        } else {
            dateSelect.parent().hide();
            timeSlider.parent().hide();
            $('#date-select-container').hide();
            $('#time-slider-container').hide();
            clearMarkers();
            clearPolyline();
        }
    });
}

// Populate date dropdown
function populateDateSelect(data) {
    dates = [...new Set(data.map(feature => new Date(feature.properties.timestamp).toLocaleDateString()))];
    dateSelect.html('<option value="">--Select Date--</option>'); // Reset options
    dates.forEach(date => {
        dateSelect.append(`<option value="${date}">${date}</option>`);
    });

    dateSelect.off('change').on('change', function() {
        const selectedDate = $(this).val();
        if (selectedDate) {
            const filteredData = allAnimalData.filter(feature => new Date(feature.properties.timestamp).toLocaleDateString() === selectedDate);
            initializeTimeSlider(filteredData);
            zoomToEarliestMarker(filteredData); // Zoom to the earliest marker position
            drawAnimalPath(filteredData); // Draw the animal path
            timeSlider.parent().show();
            $('#time-slider-container').show();
        } else {
            timeSlider.parent().hide();
            $('#time-slider-container').hide();
            clearMarkers();
            clearPolyline();
        }
    });
}

// Initialize the time slider
function initializeTimeSlider(data) {
    times = getUniqueTimes(data);
    timeSlider.attr('max', times.length - 1);
    timeSlider.attr('step', 1);
    timeSlider.val(0);

    updateTimeDisplay(times[0]);
    timeSlider.off('input').on('input', function() {
        updateTimeDisplay(times[$(this).val()]);
        updateMarkers(data);
    });
}

// Get unique times from the data
function getUniqueTimes(data) {
    const times = [...new Set(data.map(feature => 
        new Date(feature.properties.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    ))];
    times.sort();
    return times;
}

// Update the time display
function updateTimeDisplay(time) {
    timeDisplay.text(time);
}

// Zoom to the earliest marker position on the selected date
function zoomToEarliestMarker(data) {
    if (data.length === 0) return;

    // Find the earliest timestamp for the selected date
    const earliestFeature = data.reduce((earliest, feature) => {
        const featureTime = new Date(feature.properties.timestamp).getTime();
        const earliestTime = new Date(earliest.properties.timestamp).getTime();
        return featureTime < earliestTime ? feature : earliest;
    });

    const latLng = [earliestFeature.geometry.coordinates[1], earliestFeature.geometry.coordinates[0]];
    map.setView(latLng, 15); // Zoom level of 15 is typically close enough to view individual markers
}

// Draw the path of the animal for the selected date
function drawAnimalPath(data) {
    if (data.length === 0) return;

    // Sort the data by timestamp
    data.sort((a, b) => new Date(a.properties.timestamp) - new Date(b.properties.timestamp));

    // Extract coordinates
    const latLngs = data.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);

    // Add polyline to map
    if (animalPath) {
        map.removeLayer(animalPath); // Remove previous path if exists
    }
    animalPath = L.polyline(latLngs, {color: 'blue', weight: 3}).addTo(map);
}

// Update markers based on filters
function updateMarkers(data) {
    const selectedSpecies = speciesSelect.val();
    const selectedAnimalId = animalSelect.val();
    const selectedDate = dateSelect.val();
    const selectedTime = timeDisplay.text();

    const filteredData = data.filter(feature => {
        const featureDate = new Date(feature.properties.timestamp).toLocaleDateString();
        const featureTime = new Date(feature.properties.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return (selectedSpecies === "" || feature.properties.species === selectedSpecies) &&
               (selectedAnimalId === "" || feature.properties.animalId === selectedAnimalId) &&
               (selectedDate === "" || featureDate === selectedDate) &&
               (selectedTime === "" || featureTime === selectedTime);
    });

    // Clear existing markers and add filtered ones
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    addMarkers(filteredData);
}

// Function to add markers based on GeoJSON data
function addMarkers(geojson) {
    L.geoJSON(geojson, {
        pointToLayer: (feature, latlng) => {
            const { species, animalId, animalName, timestamp } = feature.properties;
            return L.marker(latlng, {
                icon: createIcon(species),
            }).bindPopup(
                `<div class="popup-content">
                    <h2>${species}</h2>
                    <p><strong>Animal ID:</strong> ${animalId}</p>
                    <p><strong>Animal Name:</strong> ${animalName}</p>
                    <p><strong>Date:</strong> ${new Date(timestamp).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${new Date(timestamp).toLocaleTimeString()}</p>
                </div>`
            ).addTo(map);
        }
    });
}

// Function to create custom icons
function createIcon(species) {
    return L.icon({
        iconUrl: `../assets/${species.toLowerCase()}.png`,
        iconSize: [32, 23],
        iconAnchor: [16, 16],
        popupAnchor: [0, -32]
    });
}

// Clear all markers from the map
function clearMarkers() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
}

// Clear polyline from the map
function clearPolyline() {
    if (animalPath) {
        map.removeLayer(animalPath);
        animalPath = null;
    }
}
