// ==================== LEAFLET MAP INITIALIZATION ====================
function initializeMap() {
    // Initialize the map with a set view in Switzerland and a zoom level
    window.map = L.map('map').setView([46.9, 8.2], 8);

    // Set the background layer 
    L.tileLayer.provider('OpenStreetMap.Mapnik', {
        maxZoom: 18,
        attribution: '© OpenStreetMap'
    }).addTo(window.map);
    
    // Display coordinates and zoom in the footer            
    window.map.on('mousemove', function(e){
        let latlng = e.latlng;
        let EN = L.CRS.EPSG2056.project(latlng);
        let str = "<strong>WGS 84 (Lat, Long)</strong> : " + e.latlng.lat.toFixed(5) + ' - ' + e.latlng.lng.toFixed(5) + "  " + 
                 "<strong>CH1903+ /LV95 (E, N):</strong> " + EN.x.toFixed(0) + ' ' + EN.y.toFixed(0) + "  " +  
                 "<strong>Zoom Level:</strong> " + window.map.getZoom();
        document.getElementById('coordinates').innerHTML = str;
    });

    // Access coordinates in different coordinate systems
    window.map.on('click', function(e){
        let WGS84 = e.latlng;
        let LV95 = L.CRS.EPSG2056.project(WGS84);
        console.log('WGS 84 clicked on (lat/lng): ' + WGS84.lat + '/' + WGS84.lng);
        console.log('LV95 clicked on (E/N): ' + LV95.x.toFixed() + '/' + LV95.y);
    });

    // Initialize base layers
    window.lyrOTM = L.tileLayer.provider('OpenTopoMap');
    window.lyrOSM = L.tileLayer.provider('OpenStreetMap.Mapnik');
    window.lyrEWM = L.tileLayer.provider('Esri.WorldStreetMap');
    window.lyrCDM = L.tileLayer.provider('CartoDB.DarkMatter');
    window.lyrSMD = L.tileLayer.provider("Stadia.AlidadeSmoothDark");
    
    // Base map layers
    window.baseLayers = {
        "Open Street Maps": window.lyrOSM,                    
        "Open Topo Maps": window.lyrOTM,                    
        "ESRI World Street Maps": window.lyrEWM,
        "Smooth Dark": window.lyrSMD,
        "Carto Dark Matter": window.lyrCDM,
    };

    // Create feature groups for drawing polygons
    window.fgp = L.featureGroup().addTo(window.map);
    window.fgp1 = L.featureGroup().addTo(window.map);

    // Layer control        
    window.ctlLayers = L.control.layers(window.baseLayers, {}).addTo(window.map);

    // Add map synchronization listeners
    let mapUpdateTimeout;
    window.map.on('moveend zoomend', function() {
        // Debounce the updates to avoid too many sync calls
        clearTimeout(mapUpdateTimeout);
        mapUpdateTimeout = setTimeout(() => {
            if (typeof updateSyncStateFrom2D === 'function') {
                updateSyncStateFrom2D(window.map);
            }
        }, 100);
    });

    console.log('Map initialized successfully with synchronization');
}
