// ==================== 3D MAP IMPLEMENTATION WITH CESIUM.JS ====================

console.log('🚀 map-3d.js is loading...');

// Global 3D map variables
let cesiumViewer = null;
let cesiumInitialized = false;

// Sync state between 2D and 3D maps
let mapSyncState = {
    center: { lat: 46.8182, lng: 8.2275 }, // Switzerland center
    zoom: 8,
    altitude: 1000000 // For 3D view
};

// Coordinate conversion utilities
function leafletZoomToCesiumAltitude(zoom) {
    // Simple linear mapping for more predictable behavior
    // Leaflet zoom 1 = 15,000km altitude (world view)
    // Leaflet zoom 18 = 500m altitude (street level)
    
    const zoomToAltitudeMap = {
        1: 15000000,   // 15,000km
        2: 8000000,    // 8,000km
        3: 4000000,    // 4,000km
        4: 2000000,    // 2,000km
        5: 1000000,    // 1,000km
        6: 500000,     // 500km
        7: 250000,     // 250km
        8: 125000,     // 125km
        9: 65000,      // 65km
        10: 32000,     // 32km
        11: 16000,     // 16km
        12: 8000,      // 8km
        13: 4000,      // 4km
        14: 2000,      // 2km
        15: 1000,      // 1km
        16: 500,       // 500m
        17: 250,       // 250m
        18: 125        // 125m
    };
    
    // Round zoom to nearest integer for lookup
    const roundedZoom = Math.round(Math.max(1, Math.min(18, zoom)));
    return zoomToAltitudeMap[roundedZoom] || 1000000;
}

function cesiumAltitudeToLeafletZoom(altitude) {
    // Reverse lookup: find the closest zoom level for given altitude
    const altitudeToZoomMap = {
        15000000: 1,
        8000000: 2,
        4000000: 3,
        2000000: 4,
        1000000: 5,
        500000: 6,
        250000: 7,
        125000: 8,
        65000: 9,
        32000: 10,
        16000: 11,
        8000: 12,
        4000: 13,
        2000: 14,
        1000: 15,
        500: 16,
        250: 17,
        125: 18
    };
    
    // Find the closest altitude match
    let closestZoom = 8; // default
    let smallestDiff = Infinity;
    
    for (const [alt, zoom] of Object.entries(altitudeToZoomMap)) {
        const diff = Math.abs(altitude - parseInt(alt));
        if (diff < smallestDiff) {
            smallestDiff = diff;
            closestZoom = parseInt(zoom);
        }
    }
    
    return closestZoom;
}

// Update sync state from 2D map
function updateSyncStateFrom2D(map) {
    if (!map) return;
    
    const center = map.getCenter();
    const zoom = map.getZoom();
    const altitude = leafletZoomToCesiumAltitude(zoom);
    
    mapSyncState.center = {
        lat: center.lat,
        lng: center.lng
    };
    mapSyncState.zoom = zoom;
    mapSyncState.altitude = altitude;
    
    console.log(`🔄 2D→Sync: Zoom ${zoom} → Altitude ${Math.round(altitude)}m`);
    showSyncIndicator('2D');
}

// Update sync state from 3D map
function updateSyncStateFrom3D() {
    if (!cesiumViewer) return;
    
    const camera = cesiumViewer.camera;
    const position = camera.positionCartographic;
    const altitude = position.height;
    const zoom = cesiumAltitudeToLeafletZoom(altitude);
    
    mapSyncState.center = {
        lat: Cesium.Math.toDegrees(position.latitude),
        lng: Cesium.Math.toDegrees(position.longitude)
    };
    mapSyncState.altitude = altitude;
    mapSyncState.zoom = zoom;
    
    console.log(`🔄 3D→Sync: Altitude ${Math.round(altitude)}m → Zoom ${zoom}`);
    showSyncIndicator('3D');
}

// Apply sync state to 2D map
function applySyncStateTo2D(map) {
    if (!map || !mapSyncState.center) return;
    
    console.log(`📍 Syncing to 2D: Altitude ${Math.round(mapSyncState.altitude)}m → Zoom ${mapSyncState.zoom}`);
    map.setView([mapSyncState.center.lat, mapSyncState.center.lng], mapSyncState.zoom);
    showSyncIndicator('→2D');
}

// Apply sync state to 3D map
function applySyncStateTo3D() {
    if (!cesiumViewer || !mapSyncState.center) return;
    
    console.log(`🌍 Syncing to 3D: Zoom ${mapSyncState.zoom} → Altitude ${Math.round(mapSyncState.altitude)}m`);
    cesiumViewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
            mapSyncState.center.lng,
            mapSyncState.center.lat,
            mapSyncState.altitude
        )
    });
    showSyncIndicator('→3D');
}

// Visual sync indicator
function showSyncIndicator(type) {
    // Create or get sync indicator
    let indicator = document.getElementById('sync-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'sync-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = `🔄 Sync ${type}`;
    indicator.style.opacity = '1';
    
    // Fade out after 1.5 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 1500);
}

// Swiss coordinate system settings for Cesium
const swissCoordinates = {
    center: {
        longitude: 7.4474,  // Switzerland center longitude
        latitude: 46.9480,  // Switzerland center latitude
        height: 15000       // Initial height in meters
    },
    bounds: {
        west: 5.9559,   // Switzerland western boundary
        south: 45.8180, // Switzerland southern boundary  
        east: 10.4921,  // Switzerland eastern boundary
        north: 47.8084  // Switzerland northern boundary
    }
};

// Check WebGL support manually
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!(gl && gl.getExtension);
    } catch (e) {
        return false;
    }
}

// Initialize Cesium 3D viewer
function initializeCesium3D() {
    console.log('🚀 Starting Cesium 3D initialization');
    
    // Test if Cesium is available
    if (typeof Cesium === 'undefined') {
        throw new Error('Cesium library not loaded');
    }
    console.log('✅ Cesium library is available');
    console.log('Cesium version:', Cesium.VERSION || 'Unknown');
    
    if (cesiumInitialized) {
        console.log('Cesium already initialized');
        return cesiumViewer;
    }

    try {
        // Check WebGL support first
        if (!checkWebGLSupport()) {
            throw new Error('WebGL is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        }

        console.log('✅ WebGL support confirmed');

        // Ensure the container exists and is visible
        const container = document.getElementById('map-3d');
        if (!container) {
            throw new Error('3D map container not found');
        }

        console.log('✅ Container found');

        // Clear any existing content
        container.innerHTML = '';

        // DISABLE Cesium Ion completely
        if (typeof Cesium !== 'undefined' && Cesium.Ion) {
            Cesium.Ion.defaultAccessToken = undefined;
        }

        console.log('Creating ultra-minimal Cesium viewer...');
        
        // Create the simplest possible Cesium viewer - just like the working test
        cesiumViewer = new Cesium.Viewer('map-3d', {
            // Disable ALL UI components
            animation: false,
            timeline: false,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            baseLayerPicker: false,
            vrButton: false,
            creditContainer: document.createElement('div'), // Hide credits
            
            // Use most basic providers - same as working test
            terrainProvider: new Cesium.EllipsoidTerrainProvider(),
            
            // Start with no imagery to show the blue globe first
            imageryProvider: false
        });

        console.log('✅ Basic Cesium viewer created');

        // Enable the basic globe display
        cesiumViewer.scene.globe.show = true;
        cesiumViewer.scene.skyBox.show = true;
        cesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

        // Improve performance settings
        cesiumViewer.scene.fog.enabled = false;
        cesiumViewer.scene.globe.enableLighting = false;
        cesiumViewer.scene.globe.depthTestAgainstTerrain = false;
        
        // Speed up camera movement
        cesiumViewer.camera.percentageChanged = 0.5; // Default is 0.1, higher = less sensitive
        cesiumViewer.camera.defaultMoveAmount = 100000; // Faster movement
        
        console.log('✅ Performance settings applied');

        // Set camera to Switzerland immediately
        cesiumViewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(8.2275, 46.8182, 1000000) // Switzerland, 1000km up
        });

        console.log('✅ Camera set to Switzerland');

        // Add imagery after the viewer is stable
        setTimeout(() => {
            try {
                const imageryProvider = new Cesium.OpenStreetMapImageryProvider({
                    url: 'https://a.tile.openstreetmap.org/'
                });
                cesiumViewer.imageryLayers.addImageryProvider(imageryProvider);
                console.log('✅ Imagery added');
            } catch (e) {
                console.warn('Could not add imagery:', e);
                // Keep the blue globe if imagery fails
            }
        }, 1000);

        // Add keyboard navigation improvements
        document.addEventListener('keydown', function(event) {
            if (document.getElementById('map-3d').style.display !== 'none') {
                const camera = cesiumViewer.camera;
                const moveAmount = 50000; // meters
                
                switch(event.key) {
                    case '+':
                    case '=':
                        event.preventDefault();
                        camera.moveForward(moveAmount);
                        break;
                    case '-':
                        event.preventDefault();
                        camera.moveBackward(moveAmount);
                        break;
                    case 'Home':
                        event.preventDefault();
                        // Return to Switzerland
                        camera.setView({
                            destination: Cesium.Cartesian3.fromDegrees(8.2275, 46.8182, 1000000)
                        });
                        break;
                }
            }
        });

        // Add camera movement listener for synchronization
        let cameraUpdateTimeout;
        cesiumViewer.camera.changed.addEventListener(() => {
            // Debounce the updates to avoid too many sync calls
            clearTimeout(cameraUpdateTimeout);
            cameraUpdateTimeout = setTimeout(() => {
                updateSyncStateFrom3D();
            }, 100);
        });

        console.log('✅ 3D map synchronization enabled');

        // Ensure proper sizing
        setTimeout(() => {
            const canvas = cesiumViewer.canvas;
            const container = document.getElementById('map-3d');
            
            // Force container to proper size
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.position = 'relative';
            container.style.overflow = 'hidden';
            
            // Force canvas to fit container exactly
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            
            cesiumViewer.resize();
            console.log('✅ Viewer resized to fit container');
        }, 100);

        // Add coordinate display
        // try {
        //     addCoordinateDisplay();
        //     console.log('Coordinate display added');
        // } catch (coordError) {
        //     console.warn('Coordinate display failed:', coordError);
        // }

        // Add mouse event handlers
        // try {
        //     addMouseHandlers();
        //     console.log('Mouse handlers added');
        // } catch (mouseError) {
        //     console.warn('Mouse handlers failed:', mouseError);
        // }

        cesiumInitialized = true;
        console.log('✅ Cesium 3D map initialized successfully (minimal mode)');
        
        return cesiumViewer;

    } catch (error) {
        console.error('❌ Error initializing Cesium 3D map:', error);
        showCesiumError(error);
        return null;
    }
}

// Add offline-compatible imagery layers
function addOfflineImageryLayers() {
    try {
        // Add additional base layers that don't require authentication
        
        // Satellite imagery (Bing - requires key but has free tier)
        // Commented out to avoid API key issues
        /*
        const bingSatellite = new Cesium.BingMapsImageryProvider({
            url: '//dev.virtualearth.net',
            key: 'YOUR_BING_MAPS_KEY', // You would need to get this
            mapStyle: Cesium.BingMapsStyle.AERIAL
        });
        cesiumViewer.imageryLayers.addImageryProvider(bingSatellite);
        */

        // OpenTopoMap for topographic view
        const openTopoMap = new Cesium.UrlTemplateImageryProvider({
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c'],
            maximumLevel: 17,
            credit: '© OpenTopoMap contributors'
        });
        
        // CartoDB Positron for clean look
        const cartoPositron = new Cesium.UrlTemplateImageryProvider({
            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            subdomains: ['a', 'b', 'c', 'd'],
            maximumLevel: 18,
            credit: '© CartoDB'
        });

        // Add these as additional layers (they won't be visible by default)
        cesiumViewer.imageryLayers.addImageryProvider(openTopoMap, 0.0);
        cesiumViewer.imageryLayers.addImageryProvider(cartoPositron, 0.0);
        
        console.log('Offline imagery layers added to 3D map');
    } catch (error) {
        console.warn('Could not add some imagery layers:', error);
    }
}

// Legacy function for compatibility
function addSwissLayers() {
    // This function is now replaced by addOfflineImageryLayers
    addOfflineImageryLayers();
}

// Add coordinate display for 3D map
function addCoordinateDisplay() {
    const coordinatesDiv = document.getElementById('coordinates');
    if (!coordinatesDiv) return;

    // Update coordinates on mouse move
    cesiumViewer.canvas.addEventListener('mousemove', function(event) {
        const pickedPosition = cesiumViewer.camera.pickEllipsoid(
            new Cesium.Cartesian2(event.clientX, event.clientY), 
            cesiumViewer.scene.globe.ellipsoid
        );
        
        if (pickedPosition) {
            const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;
            
            // Convert to Swiss coordinates if needed
            coordinatesDiv.innerHTML = `
                <strong>3D View:</strong> 
                Lat: ${latitude.toFixed(6)}°, 
                Lon: ${longitude.toFixed(6)}°, 
                Alt: ${height.toFixed(0)}m
            `;
        }
    });
}

// Add mouse event handlers for 3D interaction
function addMouseHandlers() {
    // Handle clicks for feature selection
    cesiumViewer.cesiumWidget.screenSpaceEventHandler.setInputAction(function(click) {
        const pickedObject = cesiumViewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
            console.log('3D object clicked:', pickedObject);
            // Handle 3D object interaction
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// Sync data layers from 2D to 3D
function syncLayersTo3D() {
    if (!cesiumViewer) return;

    console.log('Syncing layers from 2D to 3D...');
    
    // Sync buildings layer
    if (window.buildingsLayer && window.buildingsLayer._layers) {
        addBuildingsTo3D();
    }
    
    // Sync hazard layers
    if (window.rockfallLayer) {
        addHazardLayerTo3D();
    }
    
    // Sync DEM data
    if (window.demLayer) {
        addDEMTo3D();
    }
}

// Add buildings to 3D view
function addBuildingsTo3D() {
    try {
        // Create 3D building entities
        // This would need actual building height data
        console.log('Adding buildings to 3D view...');
        
        // Example: Add simple 3D buildings
        // In a real implementation, you'd load actual 3D building data
        
    } catch (error) {
        console.error('Error adding buildings to 3D:', error);
    }
}

// Add hazard layer to 3D
function addHazardLayerTo3D() {
    try {
        console.log('Adding hazard layers to 3D view...');
        
        // Convert 2D hazard polygons to 3D visualization
        // This could include extruded polygons or 3D symbols
        
    } catch (error) {
        console.error('Error adding hazard layer to 3D:', error);
    }
}

// Add DEM data to 3D
function addDEMTo3D() {
    try {
        console.log('Adding DEM data to 3D view...');
        
        // DEM data is typically used for terrain in 3D
        // Cesium can use terrain providers for this
        
    } catch (error) {
        console.error('Error adding DEM to 3D:', error);
    }
}

// Handle Cesium initialization errors
function showCesiumError(error) {
    const placeholder = document.querySelector('.map-3d-placeholder');
    let errorMessage = error.message;
    let troubleshooting = 'Please check your internet connection and try again.';
    
    // Provide specific help for common errors
    if (errorMessage.includes('access token') || errorMessage.includes('INVALID_TOKEN')) {
        troubleshooting = 'Using offline mode - no authentication required.';
    } else if (errorMessage.includes('WebGL')) {
        troubleshooting = 'Your browser does not support WebGL. Please use Chrome, Firefox, or Safari.';
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        troubleshooting = 'Check your internet connection and firewall settings.';
    }
    
    if (placeholder) {
        placeholder.innerHTML = `
            <h4>⚠️ 3D View Error</h4>
            <p>Could not initialize 3D visualization</p>
            <div class="error-details">
                <small><strong>Error:</strong> ${errorMessage}</small><br>
                <small><strong>Solution:</strong> ${troubleshooting}</small>
            </div>
            <button onclick="retryInitialize3D()" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
                🔄 Retry
            </button>
        `;
    } else {
        // If no placeholder, create one in the map container
        const mapContainer = document.getElementById('map-3d');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="map-3d-placeholder">
                    <h4>⚠️ 3D View Error</h4>
                    <p>Could not initialize 3D visualization</p>
                    <div class="error-details">
                        <small><strong>Error:</strong> ${errorMessage}</small><br>
                        <small><strong>Solution:</strong> ${troubleshooting}</small>
                    </div>
                    <button onclick="retryInitialize3D()" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
                        🔄 Retry
                    </button>
                </div>
            `;
        }
    }
}

// Retry 3D initialization
function retryInitialize3D() {
    cesiumInitialized = false;
    cesiumViewer = null;
    initialize3DMap();
}

// Cleanup 3D map when switching to 2D
function cleanup3DMap() {
    if (cesiumViewer && !cesiumViewer.isDestroyed()) {
        cesiumViewer.destroy();
        cesiumViewer = null;
        cesiumInitialized = false;
    }
}

// ==================== 3D BUTTON FUNCTIONALITY ====================

// Initialize 3D button functionality
function initialize3DButtons() {
    console.log('🌍 Initializing 3D view buttons...');
    
    const btn2D = document.getElementById('btn-2d');
    const btn3D = document.getElementById('btn-3d');
    const map2DContainer = document.getElementById('map-2d-container');
    const map3DContainer = document.getElementById('map-3d-container');
    
    console.log('🔍 Button elements found:');
    console.log('- btn-2d:', !!btn2D);
    console.log('- btn-3d:', !!btn3D);
    console.log('- map-2d-container:', !!map2DContainer);
    console.log('- map-3d-container:', !!map3DContainer);
    
    if (!btn2D || !btn3D) {
        console.error('❌ 3D view buttons not found!');
        console.log('🔍 Available buttons:', 
            Array.from(document.querySelectorAll('button')).map(b => b.id).filter(id => id)
        );
        return;
    }
    
    // 2D button click handler
    btn2D.addEventListener('click', function() {
        console.log('🗺️ Switching to 2D view');
        
        // Update button states
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        
        // Show/hide containers
        if (map2DContainer) map2DContainer.style.display = 'block';
        if (map3DContainer) map3DContainer.style.display = 'none';
        
        // Cleanup 3D map if it exists
        cleanup3DMap();
    });
    
    // 3D button click handler
    btn3D.addEventListener('click', function(e) {
        console.log('🌍 3D BUTTON CLICKED!');
        console.log('🔍 Event:', e);
        
        // Update button states
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        console.log('✅ Button states updated');
        
        // Show/hide containers
        if (map2DContainer) {
            map2DContainer.style.display = 'none';
            console.log('✅ 2D container hidden');
        }
        if (map3DContainer) {
            map3DContainer.style.display = 'block';
            console.log('✅ 3D container shown');
        }
        
        // Initialize 3D map
        console.log('🚀 Starting 3D initialization...');
        setTimeout(() => {
            try {
                initializeCesium3D();
                console.log('✅ 3D initialization called');
            } catch (error) {
                console.error('❌ 3D initialization failed:', error);
            }
        }, 500); // Small delay to ensure container is visible
    });
    
    console.log('✅ 3D view buttons initialized');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, initializing 3D system...');
    // Small delay to ensure all elements are loaded
    setTimeout(() => {
        console.log('⏰ Timeout reached, calling initialize3DButtons...');
        initialize3DButtons();
    }, 1000);
});

// Also try immediate initialization if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('📄 Document still loading, waiting for DOMContentLoaded...');
} else {
    console.log('📄 Document already loaded, initializing immediately...');
    setTimeout(initialize3DButtons, 500);
}

// Export functions for global access
window.initializeCesium3D = initializeCesium3D;
window.syncLayersTo3D = syncLayersTo3D;
window.cleanup3DMap = cleanup3DMap;
window.initialize3DButtons = initialize3DButtons;

// Export cesiumViewer getter to ensure it's always current
Object.defineProperty(window, 'cesiumViewer', {
    get: function() {
        return cesiumViewer;
    },
    set: function(value) {
        cesiumViewer = value;
    }
});
