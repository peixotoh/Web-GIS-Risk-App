/**
 * ==================== DATA PROCESSING MODULE ====================
 * 
 * Purpose: Handle file uploads, data transformation, and coordinate conversion
 * 
 * Functions:
 * - processCustomDataFile()
 * - loadCustomHazardDataToMap()
 * - loadCustomBuildingsDataToMap()
 * - detectAndTransformCoordinates()
 * - transformSwissToWGS84()
 * - getSelectedHazardType()
 * 
 * Global Variables Used:
 * - window.map: Main Leaflet map instance for adding/removing layers
 * - window.hazardLayer: Current hazard layer on the map (polygons with intensity styling)
 * - window.buildingsLayer: Current buildings layer on the map (points/polygons with building data)
 * - window.buildingsData: Raw building data storage for analysis operations
 * - window.ctlLayers: Leaflet layer control for managing overlay visibility
 * - window.removeHazardFromMap: Function to remove existing hazard layers
 * - window.addHazardToMap: Function to add new hazard layers with unified styling
 * - window.removeOverlayByName: Function to remove specific overlays from layer control
 * - window.swissToWGS84: Coordinate transformation function (Swiss LV95 → WGS84)
 * 
 * Dependencies:
 * - Leaflet (L)
 * - FileReader API for file processing
 * - JSON parsing for GeoJSON validation
 * 
 * JSDoc Notation Guide:
 * @param {Type} name - Description of parameter
 * @returns {Type|null} - Description of return value (Type|null means can return Type or null)
 * @example: @returns {string|null} Selected hazard type or null
 *   - Returns a string containing the hazard type if one is selected
 *   - Returns null if no hazard type is currently selected
 */

console.log('📊 Data Processing module loading...');

// ==================== COORDINATE TRANSFORMATION FUNCTIONS ====================

/**
 * Convert Swiss LV95 coordinates to WGS84 (World Geodetic System 1984)
 * Based on proven transformation formulas used in Swiss applications
 * @param {number} east - Swiss LV95 Easting coordinate
 * @param {number} north - Swiss LV95 Northing coordinate
 * @returns {Object} Object with lat and lng properties in WGS84
 */
function swissToWGS84(east, north) {
    try {
        // Validate input coordinates
        if (isNaN(east) || isNaN(north)) {
            console.warn('⚠️ Invalid coordinates provided to swissToWGS84');
            return { lat: 46.8, lng: 8.2 }; // Default Swiss center
        }
        
        // Check if coordinates are in valid Swiss LV95 range
        if (east < 2400000 || east > 3000000 || north < 1000000 || north > 1400000) {
            console.warn('⚠️ Coordinates outside valid Swiss LV95 range');
            // Try to handle if coordinates might be in older LV03 system
            if (east < 900000 && north < 350000) {
                // Convert LV03 to LV95
                east = east + 2000000;
                north = north + 1000000;
            } else {
                console.warn(`⚠️ Coordinates [${east}, ${north}] outside expected range, using as-is`);
            }
        }
        
        // Swiss LV95 to WGS84 transformation - Official Swisstopo approximation formula
        // Auxiliary values (differences to Bern in 1000km units)
        const y_aux = (east - 2600000) / 1000000;
        const x_aux = (north - 1200000) / 1000000;
        
        // Longitude calculation (λ in decimal degrees)
        const lambda = 2.6779094 + 
                      4.728982 * y_aux + 
                      0.791484 * y_aux * x_aux + 
                      0.1306 * y_aux * x_aux * x_aux - 
                      0.0436 * y_aux * y_aux * y_aux;
        
        // Latitude calculation (φ in decimal degrees)  
        const phi = 16.9023892 + 
                   3.238272 * x_aux - 
                   0.270978 * y_aux * y_aux - 
                   0.002528 * x_aux * x_aux - 
                   0.0447 * y_aux * y_aux * x_aux - 
                   0.0140 * x_aux * x_aux * x_aux;
        
        // Convert to decimal degrees and apply WGS84 offset
        const longitude = lambda * 100 / 36; // Convert from centesimal to decimal degrees
        const latitude = phi * 100 / 36;     // Convert from centesimal to decimal degrees
        
        return {
            lat: latitude,
            lng: longitude
        };
        
    } catch (error) {
        console.error('❌ Error in Swiss coordinate transformation:', error);
        return { lat: 46.8, lng: 8.2 }; // Default Swiss center
    }
}

// Make swissToWGS84 available globally
if (typeof window !== 'undefined') {
    window.swissToWGS84 = swissToWGS84;
}

// ==================== HAZARD TYPE SELECTION ====================

/**
 * Get the currently selected hazard type from radio buttons
 * @returns {string|null} Selected hazard type or null
 */
function getSelectedHazardType() {
    const hazardToggles = document.querySelectorAll('input[name="hazard-type"]');
    for (let toggle of hazardToggles) {
        if (toggle.checked) {
            return toggle.value;
        }
    }
    return null;
}

// ==================== FILE PROCESSING ====================

/**
 * Process uploaded custom data file (GeoJSON)
 * @param {File} file - The uploaded file
 * @param {string} inputType - Type of input ('hazard' or 'building')
 */
function processCustomDataFile(file, inputType) {
    console.log('📁 Processing custom data file:', file.name, 'type:', inputType);
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.geojson') && !file.name.toLowerCase().endsWith('.json')) {
        alert('⚠️ Please upload a GeoJSON file (.geojson or .json)');
        return;
    }
    
    // Determine input type (hazard or building)
    // Prefer explicit inputType param from onchange handlers
    let isBuildingUpload = (inputType === 'building');
    if (!isBuildingUpload && inputType === 'hazard') isBuildingUpload = false;
    
    // Fallback: try to infer from file input name
    if (isBuildingUpload === false && (file.name || '').toLowerCase().includes('build')) {
        // weak inference if filename contains 'build'
        isBuildingUpload = true;
    }
    
    // For buildings, no hazard selection required
    if (!isBuildingUpload) {
        const selectedHazard = getSelectedHazardType();
        if (!selectedHazard) {
            alert('⚠️ Please select a hazard type first');
            return;
        }
    }
    
    // Show loading feedback
    console.log('⏳ Reading file...');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            console.log('⏳ Parsing GeoJSON...');
            const geojsonData = JSON.parse(e.target.result);
            
            // Validate GeoJSON structure
            if (!geojsonData.type || geojsonData.type !== 'FeatureCollection') {
                alert('⚠️ Invalid GeoJSON format. Expected FeatureCollection.');
                return;
            }
            
            if (!geojsonData.features || geojsonData.features.length === 0) {
                alert('⚠️ No features found in the GeoJSON file.');
                return;
            }
            
            if (isBuildingUpload) {
                console.log(`✅ Loaded ${geojsonData.features?.length || 0} custom building features`);
                setTimeout(() => {
                    try {
                        loadCustomBuildingsDataToMap(geojsonData);
                    } catch (error) {
                        console.error('❌ Error loading custom buildings data to map:', error);
                        alert('⚠️ Error loading buildings data to map. Please check the console for details.');
                    }
                }, 100);
            } else {
                const selectedHazard = getSelectedHazardType();
                console.log(`✅ Loaded ${geojsonData.features?.length || 0} features for ${selectedHazard}`);
                setTimeout(() => {
                    try {
                        loadCustomHazardDataToMap(geojsonData, selectedHazard);
                    } catch (error) {
                        console.error('❌ Error loading custom hazard data to map:', error);
                        alert('⚠️ Error loading hazard data to map. Please check the console for details.');
                    }
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error parsing GeoJSON file:', error);
            alert('⚠️ Error parsing GeoJSON file. Please check the file format.');
        }
    };
    
    reader.onerror = function(error) {
        console.error('❌ Error reading file:', error);
        alert('⚠️ Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
}

// ==================== HAZARD DATA LOADING ====================

/**
 * Load custom hazard data to map
 * @param {Object} geojsonData - GeoJSON data
 * @param {string} hazardType - Type of hazard
 */
function loadCustomHazardDataToMap(geojsonData, hazardType) {
    console.log(`🗺️ Loading custom ${hazardType} data to map...`);
    
    try {
        // Remove existing hazard layers first
        if (typeof window.removeHazardFromMap === 'function') {
            window.removeHazardFromMap();
        }
        
        // Detect coordinate system and transform if needed
        console.log('⏳ Detecting and transforming coordinates...');
        const transformedGeoJSON = detectAndTransformCoordinates(geojsonData);
        
        // Check if transformation was successful
        if (!transformedGeoJSON) {
            console.error('❌ Coordinate transformation failed');
            alert('⚠️ Failed to process coordinates. Please check the coordinate system.');
            return;
        }
        
        if (!transformedGeoJSON.features || transformedGeoJSON.features.length === 0) {
            console.error('❌ No features after transformation');
            alert('⚠️ No valid features found after coordinate processing.');
            return;
        }
        
        console.log('⏳ Creating Leaflet layer...');
        
        // Create custom layer using existing styling patterns
        const customLayer = L.geoJSON(transformedGeoJSON, {
            style: function(feature) {
                try {
                    // Use classe_d_intensites for styling polygons
                    let intensityRaw = feature.properties.classe_d_intensites || feature.properties.intensity_ || feature.properties.intensity || '';
                    if (typeof intensityRaw !== 'string') intensityRaw = '';
                    const intensity = intensityRaw.trim().toLowerCase();
                    
                    let color, fillOpacity;
                    switch(intensity) {
                        case 'forte':
                        case 'high':
                            color = '#d73027';
                            fillOpacity = 0.8;
                            break;
                        case 'moyenne':
                        case 'medium':
                        case 'mean':
                            color = '#4575b4';
                            fillOpacity = 0.6;
                            break;
                        case 'faible':
                        case 'low':
                            color = '#fcf11bff';
                            fillOpacity = 0.4;
                            break;
                        default:
                            color = '#999999';
                            fillOpacity = 0.3;
                    }
                    
                    return {
                        color: color,
                        weight: 1,
                        opacity: 1,
                        fillColor: color,
                        fillOpacity: fillOpacity
                    };
                } catch (styleError) {
                    console.warn('⚠️ Error in styling feature:', styleError);
                    // Return default style
                    return {
                        color: '#999999',
                        weight: 1,
                        opacity: 1,
                        fillColor: '#999999',
                        fillOpacity: 0.3
                    };
                }
            },
            onEachFeature: function(feature, layer) {
                try {
                    // Create popup with available properties
                    const props = feature.properties || {};
                    let popupContent = `<div style="font-size: 12px;"><h4>🪨 Custom Hazard Data</h4>`;
                    
                    // Display intensity if available
                    if (props.classe_d_intensites || props.intensity_ || props.intensity) {
                        popupContent += `<p><strong>Intensity:</strong> ${props.classe_d_intensites || props.intensity_ || props.intensity}</p>`;
                    }
                    
                    // Display other available properties
                    Object.keys(props).forEach(key => {
                        if (key !== 'classe_d_intensites' && key !== 'intensity_' && key !== 'intensity' &&
                            props[key] !== null && props[key] !== undefined && props[key] !== '') {
                            popupContent += `<p><strong>${key.replace('_', ' ')}:</strong> ${props[key]}</p>`;
                        }
                    });
                    
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                } catch (popupError) {
                    console.warn('⚠️ Error creating popup for feature:', popupError);
                    layer.bindPopup(`<div style="font-size: 12px;"><h4>🪨 Custom Hazard Data</h4><p>Feature data available</p></div>`);
                }
            }
        });
        
        // Filter out aucune_atteinte features before adding to map
        const filteredGeoJSON = {
            ...transformedGeoJSON,
            features: transformedGeoJSON.features.filter(feature => {
                const intensity = feature.properties?.classe_d_intensites || feature.properties?.intensity_ || feature.properties?.intensity || '';
                const intensityLower = String(intensity).toLowerCase().trim();
                return intensityLower !== 'aucune_atteinte' && intensityLower !== 'aucune atteinte';
            })
        };

        console.log(`🔍 Filtered ${transformedGeoJSON.features.length - filteredGeoJSON.features.length} aucune_atteinte features`);

        // Delegate to unified hazard adder so we use single canonical window.hazardLayer
        if (window.map) {
            try {
                if (typeof window.addHazardToMap === 'function') {
                    window.addHazardToMap(filteredGeoJSON, hazardType === 'debris-flow' ? 'debris_flow' : hazardType);
                    console.log(`✅ Custom hazard data loaded with ${filteredGeoJSON.features.length} features (filtered out aucune_atteinte)`);
                    alert('✅ Custom hazard data loaded successfully!');
                    
                    // Clear file inputs and labels so the user can upload again (overwrite)
                    clearFileInputs();
                } else {
                    console.error('❌ addHazardToMap function not available');
                    alert('⚠️ Failed to add custom hazard to map. Function not available.');
                }
            } catch (error) {
                console.error('❌ Error adding custom hazard to map:', error);
                alert('⚠️ Failed to add custom hazard to map. See console.');
            }
        } else {
            console.error('❌ Map not available');
            alert('⚠️ Map not available. Please refresh the page and try again.');
        }
    } catch (error) {
        console.error('❌ Error in loadCustomHazardDataToMap:', error);
        alert('⚠️ Error loading custom hazard data to map: ' + error.message);
    }
}

// ==================== BUILDING DATA LOADING ====================

/**
 * Load custom buildings data to map
 * @param {Object} geojsonData - GeoJSON data
 */
function loadCustomBuildingsDataToMap(geojsonData) {
    console.log('🏢 Loading custom buildings data to map...');
    
    try {
        // Remove existing buildings layer if present (single variable)
        if (window.buildingsLayer && window.map) {
            try { 
                window.map.removeLayer(window.buildingsLayer); 
            } catch (e) {
                console.warn('⚠️ Error removing existing buildings layer:', e);
            }
            console.log('🗑️ Existing buildings were removed');
            window.buildingsLayer = null;
            window.buildingsData = null;
        }
        
        // Detect coordinate system and transform if needed
        const transformedGeoJSON = detectAndTransformCoordinates(geojsonData);
        if (!transformedGeoJSON || !transformedGeoJSON.features || transformedGeoJSON.features.length === 0) {
            alert('⚠️ No valid building features found after coordinate processing.');
            return;
        }
        
        // Create Leaflet layer for all geometry types and assign directly to the single global
        window.buildingsLayer = L.geoJSON(transformedGeoJSON, {
            pointToLayer: function(feature, latlng) {
                // Style for building points
                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: '#ff7800',
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                    interactive: true
                });
            },
            style: function(feature) {
                // Style for polygons (if any)
                return {
                    color: '#ff7800',
                    weight: 2,
                    opacity: 1,
                    fillColor: '#ffd580',
                    fillOpacity: 0.5
                };
            },
            onEachFeature: function(feature, layer) {
                try {
                    const props = feature.properties || {};
                    // Prioritized building fields (common Supabase fields + generic names)
                    const priority = ['EGID','GGDENAME','GDEKT','GKAT','GBAUJ','GAREA','GVOL','id','name','address','adresse','egid','gkd','gkode'];
                    const used = new Set();
                    let popupContent = `<div class="building-popup"><h6><strong>🏢 Building</strong></h6>`;

                    // Add priority fields first
                    for (const key of priority) {
                        if (props.hasOwnProperty(key) && props[key] !== null && props[key] !== undefined && props[key] !== '') {
                            const displayKey = key.replace(/_/g,' ');
                            let val = props[key];
                            if (typeof val === 'number') val = val.toLocaleString();
                            popupContent += `<p><strong>${displayKey}:</strong> ${String(val)}</p>`;
                            used.add(key);
                        }
                    }

                    // Add remaining properties
                    Object.keys(props).forEach(k => {
                        if (used.has(k)) return;
                        const v = props[k];
                        if (v === null || v === undefined || v === '') return;
                        let displayVal;
                        if (typeof v === 'object') {
                            try { displayVal = JSON.stringify(v); } catch(e) { displayVal = String(v); }
                        } else {
                            displayVal = String(v);
                        }
                        if (displayVal.length > 300) displayVal = displayVal.slice(0,300) + '…';
                        popupContent += `<p><strong>${k.replace(/_/g,' ')}:</strong> ${displayVal}</p>`;
                    });

                    // Show coordinates for points (lat,lng)
                    if (feature.geometry && feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
                        const [lng, lat] = feature.geometry.coordinates;
                        if (!isNaN(lat) && !isNaN(lng)) popupContent += `<p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>`;
                    }

                    // Add a small button to view full JSON in popup
                    const raw = JSON.stringify(feature.properties || {}, null, 2).replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    popupContent += `</div><details style="margin-top:6px;font-size:12px;"><summary style="cursor:pointer;">View full attributes (JSON)</summary><pre style="max-height:200px;overflow:auto;background:#f7f7f7;padding:8px;border-radius:4px;font-size:12px;">${raw}</pre></details>`;
                    layer.bindPopup(popupContent);
                    
                    try { 
                        layer.on && layer.on('click', function() { this.openPopup(); }); 
                    } catch (e) { 
                        console.warn('⚠️ Could not add click event to layer'); 
                    }
                } catch (err) {
                    console.warn('⚠️ Error creating building popup:', err);
                    layer.bindPopup('<div class="building-popup">Custom building feature</div>');
                    try { 
                        layer.on && layer.on('click', function() { this.openPopup(); }); 
                    } catch (e) { 
                        console.warn('⚠️ Could not add click event to layer'); 
                    }
                }
            }
        });
        
        // Add to map
        if (window.map) {
            // add global buildings layer to the map
            window.buildingsLayer.addTo(window.map);
            window.buildingsData = null;
            
            // Add to layer control so visibility can be toggled (use unified name)
            try {
                if (window.ctlLayers && typeof window.removeOverlayByName === 'function') {
                    window.removeOverlayByName('🏢 Buildings');
                    window.ctlLayers.addOverlay(window.buildingsLayer, '🏢 Buildings');
                }
            } catch (e) { 
                console.warn('⚠️ Could not add to layer control:', e); 
            }
            
            // Fit map to bounds
            if (window.buildingsLayer.getBounds && window.buildingsLayer.getBounds().isValid()) {
                window.map.fitBounds(window.buildingsLayer.getBounds().pad(0.1));
            }
            
            alert(`✅ Custom buildings data loaded successfully! (${transformedGeoJSON.features.length} features)`);
            
            // Clear file inputs and labels so the user can upload again (overwrite)
            clearFileInputs();
        } else {
            alert('⚠️ Map not available. Please refresh the page and try again.');
        }
    } catch (error) {
        console.error('❌ Error in loadCustomBuildingsDataToMap:', error);
        alert('⚠️ Error loading custom buildings data to map: ' + error.message);
    }
}

// ==================== COORDINATE TRANSFORMATION ====================

/**
 * Detect coordinate system and transform if needed
 * @param {Object} geojsonData - GeoJSON data
 * @returns {Object} Transformed GeoJSON data
 */
function detectAndTransformCoordinates(geojsonData) {
    console.log('🔍 Detecting coordinate system...');
    
    try {
        if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
            console.warn('⚠️ No features to process');
            return geojsonData;
        }
        
        // Sample first coordinate to detect CRS
        const firstFeature = geojsonData.features[0];
        
        // Quick validation without stopping
        if (!firstFeature || !firstFeature.geometry || !firstFeature.geometry.coordinates) {
            console.warn('⚠️ Invalid feature structure, using original coordinates');
            return geojsonData;
        }
        
        // Get sample coordinate based on geometry type
        let sampleCoord = null;
        const coords = firstFeature.geometry.coordinates;
        
        switch (firstFeature.geometry.type) {
            case 'Point':
                sampleCoord = coords;
                break;
            case 'Polygon':
                sampleCoord = coords && coords[0] && coords[0][0] ? coords[0][0] : null;
                break;
            case 'MultiPolygon':
                sampleCoord = coords && coords[0] && coords[0][0] && coords[0][0][0] ? coords[0][0][0] : null;
                break;
            case 'LineString':
                sampleCoord = coords && coords[0] ? coords[0] : null;
                break;
            default:
                console.warn('⚠️ Unsupported geometry type:', firstFeature.geometry.type);
                return geojsonData;
        }
        
        if (!sampleCoord || !Array.isArray(sampleCoord) || sampleCoord.length < 2) {
            console.warn('⚠️ Could not extract valid coordinate, using original data');
            return geojsonData;
        }
        
        const [x, y] = sampleCoord;
        console.log(`📍 Sample coordinate: [${x}, ${y}]`);
        
        // Quick coordinate system detection
        let isSwissCoordinates = false;
        
        // Swiss LV95 detection: X: 2.4M-3M, Y: 1M-1.4M
        if (x >= 2400000 && x <= 3000000 && y >= 1000000 && y <= 1400000) {
            isSwissCoordinates = true;
            console.log('🇨🇭 Swiss LV95 detected');
        } else if (x >= -180 && x <= 180 && y >= -90 && y <= 90) {
            console.log('🌍 WGS84 detected');
        } else {
            console.warn('⚠️ Unknown CRS, assuming WGS84');
        }
        
        // Transform if needed — prefer the window-scoped swissToWGS84 if present
        const hasSwissFn = (typeof window !== 'undefined' && typeof window.swissToWGS84 === 'function') || (typeof swissToWGS84 === 'function');
        
        if (isSwissCoordinates && hasSwissFn) {
            console.log('🔄 Converting Swiss → WGS84...');
            return transformSwissToWGS84(geojsonData);
        } else if (isSwissCoordinates) {
            console.error('❌ Swiss coordinates detected but no transformation function');
            alert('⚠️ Swiss coordinates detected but transformation not available. Please use WGS84.');
            return geojsonData;
        } else {
            console.log('✅ Using coordinates as WGS84');
            return geojsonData;
        }
        
    } catch (error) {
        console.error('❌ Error in coordinate detection:', error);
        return geojsonData;
    }
}

/**
 * Transform Swiss LV95 coordinates to WGS84
 * @param {Object} geojsonData - GeoJSON data with Swiss coordinates
 * @returns {Object} GeoJSON data with WGS84 coordinates
 */
function transformSwissToWGS84(geojsonData) {
    try {
        const transformedFeatures = geojsonData.features.map((feature, index) => {
            const newFeature = { ...feature };
            
            function transformCoordArray(coords) {
                if (typeof coords[0] === 'number' && coords.length >= 2) {
                    const [east, north] = coords;
                    if (!isNaN(east) && !isNaN(north)) {
                        // Use window.swissToWGS84 if available (more robust across load order)
                        const conv = (typeof window !== 'undefined' && typeof window.swissToWGS84 === 'function') ? 
                                     window.swissToWGS84 : 
                                     (typeof swissToWGS84 === 'function' ? swissToWGS84 : null);
                        
                        if (conv) {
                            const wgs84 = conv(east, north);
                            return [wgs84.lng, wgs84.lat];
                        } else {
                            // No conversion function available, return original coords
                            console.warn('⚠️ No coordinate conversion function available');
                            return coords;
                        }
                    }
                }
                return Array.isArray(coords) ? coords.map(transformCoordArray) : coords;
            }
            
            if (newFeature.geometry && newFeature.geometry.coordinates) {
                newFeature.geometry = {
                    ...feature.geometry,
                    coordinates: transformCoordArray(feature.geometry.coordinates)
                };
            }
            
            return newFeature;
        });
        
        console.log('✅ Transformation completed');
        return {
            type: "FeatureCollection",
            features: transformedFeatures
        };
    } catch (error) {
        console.error('❌ Transformation error:', error);
        return geojsonData;
    }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clear file inputs and labels after successful upload
 */
function clearFileInputs() {
    try {
        const inputSelectors = [
            '#custom-hazard-upload',
            '#custom-building-upload',
            '#custom-data-upload'
        ];
        
        inputSelectors.forEach(selector => {
            const input = document.querySelector(selector);
            if (input) {
                input.value = '';
                const label = input.parentElement && input.parentElement.querySelector('.custom-file-label');
                if (label) label.textContent = 'Choose file...';
            }
        });
    } catch (e) { 
        console.warn('⚠️ Could not clear file inputs:', e); 
    }
}

// ==================== GLOBAL EXPORTS ====================

// Expose functions to window for use by other modules
window.processCustomDataFile = processCustomDataFile;
window.loadCustomHazardDataToMap = loadCustomHazardDataToMap;
window.loadCustomBuildingsDataToMap = loadCustomBuildingsDataToMap;
window.detectAndTransformCoordinates = detectAndTransformCoordinates;
window.transformSwissToWGS84 = transformSwissToWGS84;
window.swissToWGS84 = swissToWGS84; // Make coordinate transformation function globally available
window.getSelectedHazardType = getSelectedHazardType;

console.log('✅ Data Processing module loaded successfully');