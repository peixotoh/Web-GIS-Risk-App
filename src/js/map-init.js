// ==================== LEAFLET MAP INITIALIZATION ====================
function initializeMap() {
    // Initialize the map with smooth zoom controls
    window.map = L.map('map', {
        // Smooth zoom settings for 1-level increments
        zoomSnap: 1,           // Snap to integer zoom levels
        zoomDelta: 1,          // Zoom by 1 level with each scroll/click
        wheelPxPerZoomLevel: 120, // Less sensitive wheel scrolling to prevent double jumps
    }).setView([46.9, 8.2], 9);

    // Set the background layer 
    L.tileLayer.provider('OpenStreetMap.Mapnik', {
        maxZoom: 18,
        attribution: ' OpenStreetMap'
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

    // Initialize Leaflet Draw control
    window.drawControl = new L.Control.Draw({
        position: 'topleft',
        draw: {
            polyline: {
                shapeOptions: {
                    color: '#f06eaa',
                    weight: 4
                }
            },
            polygon: {
                allowIntersection: false, // Restricts shapes to simple polygons
                drawError: {
                    color: '#e1e100', // Color the shape will turn when intersects
                    message: '<strong>Oh snap!</strong> you can\'t draw that!' // Message that will show when intersect
                },
                shapeOptions: {
                    color: '#2196F3',
                    fillColor: '#2196F3',
                    fillOpacity: 0.4
                }
            },
            circle: {
                shapeOptions: {
                    clickable: false,
                    color: '#662d91',
                    fillColor: '#662d91',
                    fillOpacity: 0.3
                }
            },
            rectangle: {
                shapeOptions: {
                    clickable: false,
                    color: '#ff7800',
                    fillColor: '#ff7800',
                    fillOpacity: 0.3
                }
            },
            marker: true,
            circlemarker: false
        },
        edit: {
            featureGroup: window.fgp, // REQUIRED!! This tells leaflet which FeatureGroup contains the layers that should be editable
            remove: true
        }
    });
    window.map.addControl(window.drawControl);

    // Layer control        
    window.ctlLayers = L.control.layers(window.baseLayers, {}).addTo(window.map);

    // Add Swiss Administrative Areas (with delay to ensure data is loaded)
    setTimeout(() => {
        addSwissAdminAreas();
    }, 1000);

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

// ==================== SWISS ADMINISTRATIVE AREAS ====================
function addSwissAdminAreas() {
    // console.log('🔍 Adding Swiss Administrative Areas...');
    
    // Check if the data is available
    if (typeof suisse_admin_lim === 'undefined') {
        console.error('❌ suisse_admin_lim variable not defined - check if script is loaded');
        return;
    }
    
    // Check if coordinate transformation function is available
    if (typeof swissToWGS84 !== 'function') {
        console.error('❌ swissToWGS84 transformation function not available');
        return;
    }
    
    // console.log('✅ suisse_admin_lim data found:', suisse_admin_lim);
    // console.log('📊 Features count:', suisse_admin_lim.features ? suisse_admin_lim.features.length : 'No features property');

    try {
        // Transform coordinates from Swiss LV95 to WGS84
        // console.log('🔄 Transforming coordinates from Swiss LV95 to WGS84...');
        
        const transformedData = {
            ...suisse_admin_lim,
            features: suisse_admin_lim.features.map(feature => {
                // Transform coordinates recursively
                function transformCoordArray(coords) {
                    if (typeof coords[0] === 'number') {
                        // This is a coordinate pair [east, north]
                        const [east, north] = coords;
                        const wgs84 = swissToWGS84(east, north);
                        return [wgs84.lng, wgs84.lat]; // GeoJSON format: [lng, lat]
                    } else {
                        // This is an array of coordinate arrays, recurse
                        return coords.map(transformCoordArray);
                    }
                }
                
                return {
                    ...feature,
                    geometry: {
                        ...feature.geometry,
                        coordinates: transformCoordArray(feature.geometry.coordinates)
                    }
                };
            })
        };
        
        // console.log('✅ Coordinates transformed successfully');
        
        // Create the admin areas layer with styling
        window.swissAdminLayer = L.geoJSON(transformedData, {
            style: function(feature) {
                return {
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    color: '#333d37ff',  // Sea green color for boundaries
                    weight: 2,
                    opacity: 1,
                    dashArray: '5,5'  // Dashed line style
                };
            },
            onEachFeature: function(feature, layer) {
                // console.log('🗺️ Processing feature:', feature.properties);
                
                // Set up hover interactions only
                layer.on({
                    mouseover: function(e) {
                        const layer = e.target;
                        
                        // Highlight on hover
                        layer.setStyle({
                            weight: 4,
                            color: '#FF6B35',  // Orange color on hover
                            dashArray: '',
                            fillOpacity: 0.1,
                            fillColor: '#FF6B35'
                        });
                        
                        // Get canton and commune names from properties
                        const props = feature.properties;
                        // console.log('🖱️ Hover properties:', props);
                        
                        // Use the specific property names from the new data
                        const canton = props.canton || 'Unknown Canton';
                        const commune = props.commune || 'Unknown Commune';
                        const bfsNumber = props.bfs_nummer || '';
                        
                        // Create and show tooltip
                        const tooltipContent = 
                            '<div style="font-family: Arial, sans-serif; font-size: 12px;">' +
                                '<strong style="color: #2E8B57;">🏛️ ' + canton + '</strong><br>' +
                                '<span style="color: #666;">📍 ' + commune + '</span>' +
                                (bfsNumber ? '<br><span style="color: #999; font-size: 10px;">BFS: ' + bfsNumber + '</span>' : '') +
                            '</div>';
                        
                        layer.bindTooltip(tooltipContent, {
                            permanent: false,
                            direction: 'top',
                            offset: [0, -10],
                            className: 'admin-tooltip'
                        }).openTooltip();
                    },
                    mouseout: function(e) {
                        const layer = e.target;
                        
                        // Reset style on mouse out
                        layer.setStyle({
                            weight: 2,
                            color: '#2E8B57',
                            dashArray: '5,5',
                            fillOpacity: 0,
                            fillColor: 'transparent'
                        });
                        
                        // Close tooltip
                        layer.closeTooltip();
                    }
                });
            }
        }).addTo(window.map);

        // Add to layer control
        window.ctlLayers.addOverlay(window.swissAdminLayer, "Swiss Administrative Areas");
        
        // Set strict bounds to Switzerland and restrict dragging
        const swissBounds = L.latLngBounds(
            L.latLng(45.8, 5.9),   // Southwest corner
            L.latLng(47.8, 10.5)   // Northeast corner
        );
        
        // Set max bounds to keep the map within Switzerland
        window.map.setMaxBounds(swissBounds);
        
        // Fit the map to show all administrative areas
        window.map.fitBounds(window.swissAdminLayer.getBounds(), {
            padding: [5, 5]
        });
        
        // Prevent dragging outside of bounds
        window.map.on('drag', function() {
            window.map.panInsideBounds(swissBounds, { animate: false });
        });
        
        // console.log('✅ Swiss Administrative Areas added to map successfully');
        // console.log('🗺️ Map bounds set to Switzerland region');
        
    } catch (error) {
        console.error('❌ Error processing Swiss Administrative Areas:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
    }
}
