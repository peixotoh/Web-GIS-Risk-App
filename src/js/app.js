// ==================== SIMPLE WORKING SYSTEM ====================

// console.log('📄 Simple app.js loading...');

// Reset map functionality
function initializeResetButton() {
    const resetBtn = document.getElementById('reset-map-btn');
    if (!resetBtn) return;
    
    resetBtn.addEventListener('click', function() {
        resetMap();
    });
}

function resetMap() {
    console.log('🔄 Resetting map to initial state...');
    
    // Show visual feedback
    const resetBtn = document.getElementById('reset-map-btn');
    if (resetBtn) {
        resetBtn.style.transform = 'scale(0.95)';
        resetBtn.style.opacity = '0.7';
    }
    
    // Reset all form controls
    resetFormControls();
    
    // Remove all layers
    removeAllLayers();
    
    // Reset map view to initial extent
    resetMapView();
    
    // Reset state variables
    resetStateVariables();
    
    // Restore button appearance
    setTimeout(() => {
        if (resetBtn) {
            resetBtn.style.transform = '';
            resetBtn.style.opacity = '';
        }
    }, 200);
    
    console.log('✅ Map reset completed');
}

function resetFormControls() {
    // Reset location dropdowns
    const cantonSelect = document.getElementById('canton-select');
    const communeSelect = document.getElementById('commune-select');
    const polygonSelect = document.getElementById('polygon-select');
    
    if (cantonSelect) cantonSelect.value = '';
    if (communeSelect) {
        communeSelect.innerHTML = '<option value="">Select Commune</option>';
        communeSelect.disabled = true;
        communeSelect.value = '';
    }
    if (polygonSelect) {
        polygonSelect.innerHTML = '<option value="">Select Polygon</option>';
        polygonSelect.disabled = true;
        polygonSelect.value = '';
    }
    
    // Reset hazard toggles (radio buttons)
    const hazardToggles = document.querySelectorAll('input[name="hazard-type"]');
    hazardToggles.forEach(toggle => {
        toggle.checked = false;
    });
    
    // Reset building toggle
    const buildingToggle = document.getElementById('buildings-toggle');
    if (buildingToggle) buildingToggle.checked = false;
    
    // Reset vulnerability controls
    const vulnerabilitySelect = document.getElementById('vulnerability-select');
    if (vulnerabilitySelect) vulnerabilitySelect.value = '';
}

function removeAllLayers() {
    // Remove hazard layers (both API and custom data)
    if (typeof removeRockfallLayer === 'function') {
        removeRockfallLayer();
    }
    if (typeof removeDebrisFlowLayer === 'function') {
        removeDebrisFlowLayer();
    }
    
    // Remove custom hazard layers if they exist as separate variables
    if (window.customRockfallLayer && window.map) {
        window.map.removeLayer(window.customRockfallLayer);
        window.customRockfallLayer = null;
    }
    if (window.customDebrisFlowLayer && window.map) {
        window.map.removeLayer(window.customDebrisFlowLayer);
        window.customDebrisFlowLayer = null;
    }
    
    // Remove ALL building layers (Supabase + static)
    if (typeof window.removeBuildingsFromMap === 'function') {
        window.removeBuildingsFromMap();
    }
    if (window.staticBuildingsLayer && window.map) {
        window.map.removeLayer(window.staticBuildingsLayer);
        window.staticBuildingsLayer = null;
    }
    
    // Remove selection highlight
    if (typeof removeSelectionHighlight === 'function') {
        removeSelectionHighlight();
    }
    
    // Remove drawn polygon
    if (window.drawnPolygon && window.map) {
        window.map.removeLayer(window.drawnPolygon);
        window.drawnPolygon = null;
    }
    
    // Note: We intentionally do NOT remove the Swiss administrative boundaries layer
    // (window.swissAdminLayer) as it should remain visible as a base reference layer
}

function resetMapView() {
    if (window.map) {
        // Reset to Switzerland extent or default view
        window.map.setView([46.8182, 8.2275], 9); // Center of Switzerland
    }
}

function resetStateVariables() {
    // Reset global state variables
    window.drawnPolygon = null;
    
    // Reset workflow state variables if they exist globally
    if (typeof window.selectedLocation !== 'undefined') {
        window.selectedLocation = null;
    }
    if (typeof window.selectedHazard !== 'undefined') {
        window.selectedHazard = null;
    }
    if (typeof window.buildingsEnabled !== 'undefined') {
        window.buildingsEnabled = false;
    }
}

// Workflow functionality
function initializeWorkflow() {
    console.log('� Setting up workflow functionality...');
    
    // Variables to track workflow state
    let selectedLocation = null;
    let selectedHazard = null;
    let buildingsEnabled = false;
    let drawnPolygons = [];
    
    // Initialize location dropdowns
    initializeLocationControls();
    
    // Initialize hazard toggles  
    initializeHazardToggles();
    
    // Initialize data source controls
    initializeDataSourceControls();
    
    // Initialize building toggle
    initializeBuildingToggle();
    
    // Initialize vulnerability controls
    initializeVulnerabilityControls();
    
    // Initialize analysis controls
    initializeAnalysisControls();
    
    // Location controls functionality
    function initializeLocationControls() {
        const cantonSelect = document.getElementById('canton-select');
        const communeSelect = document.getElementById('commune-select');
        const polygonSelect = document.getElementById('polygon-select');
        
        // Populate the canton dropdown with real data
        populateCantons();
        
        if (cantonSelect) {
            cantonSelect.addEventListener('change', function(e) {
                selectedLocation = e.target.value;
                console.log('Canton selected:', selectedLocation);
                
                // Enable commune dropdown when canton is selected
                if (e.target.value) {
                    communeSelect.disabled = false;
                    // Here you would populate communes based on canton
                    populateCommunes(e.target.value);
                    
                    // Zoom to the selected canton
                    zoomToAdministrativeArea('canton', e.target.value);
                } else {
                    communeSelect.disabled = true;
                    communeSelect.innerHTML = '<option value="">Select Commune</option>';
                }
                
                checkWorkflowProgress();
            });
        }
        
        if (communeSelect) {
            communeSelect.addEventListener('change', function(e) {
                console.log('Commune selected:', e.target.value);
                
                // Zoom to the selected commune
                if (e.target.value) {
                    // Get the actual commune name from the option text
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    const communeName = selectedOption.textContent;
                    zoomToAdministrativeArea('commune', communeName);
                }
                
                checkWorkflowProgress();
            });
        }
        
        if (polygonSelect) {
            polygonSelect.addEventListener('change', function(e) {
                console.log('Polygon selected:', e.target.value);
                checkWorkflowProgress();
            });
        }
    }
    
    // Hazard toggles functionality
    function initializeHazardToggles() {
        const rockfallToggle = document.getElementById('rockfall-toggle');
        const debrisFlowToggle = document.getElementById('debris-flow-toggle');
        
        if (rockfallToggle) {
            rockfallToggle.addEventListener('change', function(e) {
                if (e.target.checked) {
                    selectedHazard = 'rockfall';
                    console.log('Rockfall hazard selected');
                    
                    // Uncheck debris flow toggle (ensure mutual exclusivity)
                    if (debrisFlowToggle) {
                        debrisFlowToggle.checked = false;
                    }
                    
                    // Remove debris flow layer from map
                    if (typeof removeDebrisFlowLayer === 'function') {
                        removeDebrisFlowLayer();
                    }
                    
                    // Add rockfall layer to map
                    if (typeof addRockfallLayer === 'function') {
                        addRockfallLayer();
                    }
                } else {
                    // If unchecked, remove rockfall layer
                    selectedHazard = null;
                    if (typeof removeRockfallLayer === 'function') {
                        removeRockfallLayer();
                    }
                }
                
                // Update data source display when hazard selection changes
                if (typeof updateDataSourceDisplay === 'function') {
                    updateDataSourceDisplay();
                }
                
                checkWorkflowProgress();
            });
        }
        
        if (debrisFlowToggle) {
            debrisFlowToggle.addEventListener('change', function(e) {
                if (e.target.checked) {
                    selectedHazard = 'debris-flow';
                    console.log('Debris flow hazard selected');
                    
                    // Uncheck rockfall toggle (ensure mutual exclusivity)
                    if (rockfallToggle) {
                        rockfallToggle.checked = false;
                    }
                    
                    // Remove rockfall layer from map
                    if (typeof removeRockfallLayer === 'function') {
                        removeRockfallLayer();
                    }
                    
                    // Add debris flow layer to map
                    if (typeof addDebrisFlowLayer === 'function') {
                        addDebrisFlowLayer();
                    }
                } else {
                    // If unchecked, remove debris flow layer
                    selectedHazard = null;
                    if (typeof removeDebrisFlowLayer === 'function') {
                        removeDebrisFlowLayer();
                    }
                }
                
                // Update data source display when hazard selection changes
                if (typeof updateDataSourceDisplay === 'function') {
                    updateDataSourceDisplay();
                }
                
                checkWorkflowProgress();
            });
        }
    }
    
    // Data source controls functionality
    function initializeDataSourceControls() {
        const dataSourceSelect = document.getElementById('data-source-select');
        const uploadSection = document.getElementById('upload-section');
        const uploadInput = document.getElementById('custom-data-upload');
        
        // Initialize data source controls if elements exist
        if (dataSourceSelect) {
            // Handle data source dropdown change
            dataSourceSelect.addEventListener('change', function() {
                updateDataSourceDisplay();
            });
            
            // Initialize display on page load
            updateDataSourceDisplay();
        }
        
        if (uploadInput) {
            // Handle file input change to update label
            uploadInput.addEventListener('change', function() {
                const fileName = this.value.split('\\').pop();
                const fileLabel = this.parentElement.querySelector('.custom-file-label');
                if (fileLabel) {
                    fileLabel.textContent = fileName || 'Choose file...';
                }
                
                // Process uploaded file
                if (this.files && this.files[0]) {
                    processCustomDataFile(this.files[0]);
                }
            });
        }
        
        // Function to update data source display based on selections
        function updateDataSourceDisplay() {
            const dataSourceSelectElement = document.getElementById('data-source-select');
            if (!dataSourceSelectElement) return; // Exit if element doesn't exist
            
            const selectedValue = dataSourceSelectElement.value;
            const fileLabel = document.querySelector('.custom-file-label');
            const hazardSelected = checkHazardSelection();
            
            if (selectedValue === 'custom') {
                // Show upload section
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) uploadSection.style.display = 'block';
                
                // Enable upload only if hazard is selected
                const uploadInput = document.getElementById('custom-data-upload');
                if (uploadInput) {
                    uploadInput.disabled = !hazardSelected;
                    if (!hazardSelected) {
                        uploadInput.value = '';
                        if (fileLabel) fileLabel.textContent = 'Select a hazard type first...';
                    } else {
                        if (fileLabel) fileLabel.textContent = 'Choose file...';
                    }
                }
            } else {
                // Hide upload section and disable upload button
                const uploadSection = document.getElementById('upload-section');
                if (uploadSection) uploadSection.style.display = 'none';
                const uploadInput = document.getElementById('custom-data-upload');
                if (uploadInput) {
                    uploadInput.disabled = true;
                    uploadInput.value = ''; // Clear any selected file
                }
                if (fileLabel) fileLabel.textContent = 'Choose file...';
            }
        }
        
        // Make updateDataSourceDisplay globally available for hazard toggle callbacks
        window.updateDataSourceDisplay = updateDataSourceDisplay;
        
        // Function to check if a hazard is selected
        function checkHazardSelection() {
            const hazardToggles = document.querySelectorAll('input[name="hazard-type"]');
            return Array.from(hazardToggles).some(toggle => toggle.checked);
        }
        
        // Function to process uploaded custom data file
        function processCustomDataFile(file) {
            console.log('📁 Processing custom data file:', file.name);
            
            // Check file type
            if (!file.name.toLowerCase().endsWith('.geojson') && !file.name.toLowerCase().endsWith('.json')) {
                alert('⚠️ Please upload a GeoJSON file (.geojson or .json)');
                return;
            }
            
            // Get selected hazard type
            const selectedHazard = getSelectedHazardType();
            if (!selectedHazard) {
                alert('⚠️ Please select a hazard type first');
                return;
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
                    
                    console.log(`✅ Loaded ${geojsonData.features?.length || 0} features for ${selectedHazard}`);
                    
                    // Load custom data to map with timeout to prevent blocking
                    setTimeout(() => {
                        try {
                            loadCustomDataToMap(geojsonData, selectedHazard);
                        } catch (error) {
                            console.error('❌ Error loading custom data to map:', error);
                            alert('⚠️ Error loading data to map. Please check the console for details.');
                        }
                    }, 100);
                    
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
        
        // Function to get selected hazard type
        function getSelectedHazardType() {
            const hazardToggles = document.querySelectorAll('input[name="hazard-type"]');
            for (let toggle of hazardToggles) {
                if (toggle.checked) {
                    return toggle.value;
                }
            }
            return null;
        }
        
        // Function to load custom data to map
        function loadCustomDataToMap(geojsonData, hazardType) {
            console.log(`🗺️ Loading custom ${hazardType} data to map...`);
            
            try {
                // Remove existing hazard layers first
                if (typeof removeRockfallLayer === 'function') {
                    removeRockfallLayer();
                }
                if (typeof removeDebrisFlowLayer === 'function') {
                    removeDebrisFlowLayer();
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
                            // Use styling similar to existing hazard layers
                            if (hazardType === 'rockfall') {
                                const intensity = feature.properties.intensity_ || feature.properties.intensity || 'unknown';
                                let color, fillOpacity;
                                
                                switch(intensity.toLowerCase()) {
                                    case 'high':
                                        color = '#d73027';
                                        fillOpacity = 0.8;
                                        break;
                                    case 'medium':
                                    case 'mean':
                                        color = '#fcf11bff';
                                        fillOpacity = 0.6;
                                        break;
                                    case 'low':
                                        color = '#4575b4';
                                        fillOpacity = 0.4;
                                        break;
                                    default:
                                        color = '#d73027'; // Default rockfall color
                                        fillOpacity = 0.6;
                                }
                                
                                return {
                                    color: color,
                                    weight: 1,
                                    opacity: 1,
                                    fillColor: color,
                                    fillOpacity: fillOpacity
                                };
                            } else if (hazardType === 'debris-flow') {
                                const intensity = feature.properties.intensity_ || feature.properties.intensity || 'unknown';
                                let color, fillOpacity;
                                
                                switch(intensity.toLowerCase()) {
                                    case 'high':
                                        color = '#c02015ff';
                                        fillOpacity = 0.8;
                                        break;
                                    case 'medium':
                                    case 'mean':
                                        color = '#e5d718ff';
                                        fillOpacity = 0.6;
                                        break;
                                    case 'low':
                                        color = '#2979ceff';
                                        fillOpacity = 0.4;
                                        break;
                                    default:
                                        color = '#2979ce'; // Default debris flow color
                                        fillOpacity = 0.6;
                                }
                                
                                return {
                                    color: color,
                                    weight: 1,
                                    opacity: 1,
                                    fillColor: color,
                                    fillOpacity: fillOpacity
                                };
                            }
                        } catch (styleError) {
                            console.warn('⚠️ Error in styling feature:', styleError);
                            // Return default style
                            return {
                                color: hazardType === 'rockfall' ? '#d73027' : '#2979ce',
                                weight: 1,
                                opacity: 1,
                                fillColor: hazardType === 'rockfall' ? '#d73027' : '#2979ce',
                                fillOpacity: 0.6
                            };
                        }
                    },
                    onEachFeature: function(feature, layer) {
                        try {
                            // Create popup with available properties
                            const props = feature.properties || {};
                            const hazardIcon = hazardType === 'rockfall' ? '🪨' : '🌊';
                            let popupContent = `<div style="font-size: 12px;"><h4>${hazardIcon} Custom ${hazardType.replace('-', ' ')} Data</h4>`;
                            
                            // Display intensity if available
                            if (props.intensity_ || props.intensity) {
                                popupContent += `<p><strong>Intensity:</strong> ${props.intensity_ || props.intensity}</p>`;
                            }
                            
                            // Display return period if available
                            if (props.return_per || props.return_period) {
                                popupContent += `<p><strong>Return Period:</strong> ${props.return_per || props.return_period} years</p>`;
                            }
                            
                            // Display other available properties
                            Object.keys(props).forEach(key => {
                                if (key !== 'intensity_' && key !== 'intensity' && key !== 'return_per' && key !== 'return_period' &&
                                    props[key] !== null && props[key] !== undefined && props[key] !== '') {
                                    popupContent += `<p><strong>${key.replace('_', ' ')}:</strong> ${props[key]}</p>`;
                                }
                            });
                            
                            popupContent += '</div>';
                            layer.bindPopup(popupContent);
                        } catch (popupError) {
                            console.warn('⚠️ Error creating popup for feature:', popupError);
                            layer.bindPopup(`<div style="font-size: 12px;"><h4>${hazardType === 'rockfall' ? '🪨' : '🌊'} Custom ${hazardType.replace('-', ' ')} Data</h4><p>Feature data available</p></div>`);
                        }
                    }
                });
                
                // Add to map and assign to the appropriate global variable
                if (window.map) {
                    console.log('⏳ Adding layer to map...');
                    customLayer.addTo(window.map);
                    
                    // Assign to existing global variables used by the application
                    if (hazardType === 'rockfall') {
                        // Use the same global variable as the API rockfall layer
                        window.rockfallLayer = customLayer;
                        rockfallLayer = customLayer; // Also assign to local variable
                        console.log('✅ Custom rockfall data assigned to rockfallLayer');
                    } else if (hazardType === 'debris-flow') {
                        // Use the same global variable as the API debris flow layer
                        window.debrisFlowLayer = customLayer;
                        debrisFlowLayer = customLayer; // Also assign to local variable
                        console.log('✅ Custom debris flow data assigned to debrisFlowLayer');
                    }
                    
                    // Fit map to custom data bounds
                    console.log('⏳ Fitting map to bounds...');
                    if (customLayer.getBounds && customLayer.getBounds().isValid()) {
                        window.map.fitBounds(customLayer.getBounds());
                    }
                    
                    console.log(`✅ Custom ${hazardType.replace('-', ' ')} data loaded with ${transformedGeoJSON.features.length} features`);
                    alert(`✅ Custom ${hazardType.replace('-', ' ')} data loaded successfully!`);
                } else {
                    console.error('❌ Map not available');
                    alert('⚠️ Map not available. Please refresh the page and try again.');
                }
                
            } catch (error) {
                console.error('❌ Error in loadCustomDataToMap:', error);
                alert('⚠️ Error loading custom data to map: ' + error.message);
            }
        }
        
        // Function to detect coordinate system and transform if needed
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
                
                // Skip detailed logging to avoid debugger interference
                
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
                
                // Transform if needed
                if (isSwissCoordinates && typeof swissToWGS84 === 'function') {
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
        
        // Separate function for Swiss coordinate transformation
        function transformSwissToWGS84(geojsonData) {
            try {
                const transformedFeatures = geojsonData.features.map((feature, index) => {
                    const newFeature = { ...feature };
                    
                    function transformCoordArray(coords) {
                        if (typeof coords[0] === 'number' && coords.length >= 2) {
                            const [east, north] = coords;
                            if (!isNaN(east) && !isNaN(north)) {
                                const wgs84 = swissToWGS84(east, north);
                                return [wgs84.lng, wgs84.lat];
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
    }
    
    // Building toggle functionality
    function initializeBuildingToggle() {
        const buildingsToggle = document.getElementById('buildings-toggle');
        
        if (buildingsToggle) {
            buildingsToggle.addEventListener('change', function(e) {
                buildingsEnabled = e.target.checked;
                console.log('Buildings toggle:', buildingsEnabled);
                
                if (buildingsEnabled) {
                    // Add buildings layer to map
                    console.log('Adding buildings layer...');
                    loadBuildingsData();
                } else {
                    // Remove buildings layer from map
                    console.log('Removing buildings layer...');
                    removeBuildingsData();
                }
                checkWorkflowProgress();
            });
        }
    }

    // Function to load buildings data (tries multiple sources)
    function loadBuildingsData() {
        console.log('🏢 Loading buildings data...');
        
        // Try Supabase first (if available)
        if (typeof window.loadBuildingsFromSupabase === 'function') {
            console.log('📡 Attempting to load buildings from Supabase...');
            window.loadBuildingsFromSupabase();
        }
        // Fallback to static ti_buildings data
        else if (typeof ti_buildings !== 'undefined') {
            console.log('📄 Loading buildings from static ti_buildings data...');
            loadStaticBuildingsData();
        }
        // Final fallback
        else {
            console.warn('⚠️ No buildings data source available');
            alert('No buildings data available. Please check data sources.');
        }
    }

    // Function to load static buildings data from ti_buildings.js
    function loadStaticBuildingsData() {
        try {
            console.log(`📊 Processing ti_buildings with ${ti_buildings.features?.length || 0} features`);
            
            if (!ti_buildings.features || ti_buildings.features.length === 0) {
                console.warn('⚠️ No building features found in ti_buildings data');
                return;
            }

            // Check if map is available
            if (!window.map) {
                console.error('❌ Map not available');
                return;
            }

            // Remove existing buildings layer if present
            if (window.staticBuildingsLayer) {
                window.map.removeLayer(window.staticBuildingsLayer);
            }

            // Transform Swiss coordinates to WGS84 and create markers
            const buildingMarkers = [];

            ti_buildings.features.forEach((building, index) => {
                try {
                    const coords = building.geometry.coordinates;
                    const props = building.properties;
                    
                    // Transform Swiss LV95 coordinates to WGS84
                    let lat, lng;
                    if (typeof swissToWGS84 === 'function') {
                        const wgs84 = swissToWGS84(coords[0], coords[1]);
                        lat = wgs84.lat;
                        lng = wgs84.lng;
                    } else {
                        console.warn('⚠️ swissToWGS84 function not available, skipping coordinate transformation');
                        return;
                    }

                    // Validate coordinates
                    if (!lat || !lng || isNaN(lat) || isNaN(lng) || 
                        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                        return;
                    }

                    // Create marker
                    const marker = L.circleMarker([lat, lng], {
                        radius: 6,
                        fillColor: '#ff7800',
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });

                    // Create popup content
                    const popupContent = `
                        <div class="building-popup">
                            <h6><strong>🏢 Building ${props.egid}</strong></h6>
                            <p><strong>Status:</strong> ${props.buildingStatus || 'Unknown'}</p>
                            <p><strong>Category:</strong> ${props.buildingCategory || 'Unknown'}</p>
                            <p><strong>Class:</strong> ${props.buildingClass || 'Unknown'}</p>
                            <p><strong>Municipality:</strong> ${props.municipalityName || 'Unknown'}</p>
                            <p><strong>Canton:</strong> ${props.canton || 'Unknown'}</p>
                            <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    buildingMarkers.push(marker);

                } catch (error) {
                    console.warn(`⚠️ Error processing building ${building.properties?.egid}:`, error);
                }
            });

            // Create layer group and add to map
            if (buildingMarkers.length > 0) {
                window.staticBuildingsLayer = L.layerGroup(buildingMarkers);
                window.staticBuildingsLayer.addTo(window.map);
                
                console.log(`✅ Added ${buildingMarkers.length} buildings to map`);
                
                // Zoom to extent of buildings
                const group = new L.featureGroup(buildingMarkers);
                window.map.fitBounds(group.getBounds().pad(0.1));
                
            } else {
                console.warn('⚠️ No valid building markers created');
            }

        } catch (error) {
            console.error('❌ Error loading static buildings data:', error);
        }
    }

    // Function to remove buildings data
    function removeBuildingsData() {
        console.log('🗑️ Removing buildings data...');
        
        // Remove Supabase buildings layer
        if (typeof window.removeBuildingsFromMap === 'function') {
            window.removeBuildingsFromMap();
        }
        
        // Remove static buildings layer
        if (window.staticBuildingsLayer && window.map) {
            window.map.removeLayer(window.staticBuildingsLayer);
            window.staticBuildingsLayer = null;
            console.log('✅ Static buildings layer removed');
        }
    }
    
    // Vulnerability controls functionality
    function initializeVulnerabilityControls() {
        const showCurvesBtn = document.getElementById('show-curves-btn');
        
        if (showCurvesBtn) {
            showCurvesBtn.addEventListener('click', function() {
                console.log('Show vulnerability curves clicked');
                // Implement vulnerability curves display
                alert('Vulnerability curves will be displayed here');
            });
        }
    }
    
    // Analysis controls functionality
    function initializeAnalysisControls() {
        const runAnalysisBtn = document.getElementById('run-analysis-btn');
        const showResultsBtn = document.getElementById('show-results-btn');
        
        if (runAnalysisBtn) {
            runAnalysisBtn.addEventListener('click', function() {
                console.log('Run analysis clicked');
                // Implement analysis functionality
                alert('Analysis will be run here');
                
                // Enable show results button after analysis
                if (showResultsBtn) {
                    showResultsBtn.disabled = false;
                }
            });
        }
        
        if (showResultsBtn) {
            showResultsBtn.addEventListener('click', function() {
                console.log('Show results clicked');
                // Implement results display
                alert('Results will be displayed here');
            });
        }
    }
    
    // Check workflow progress and enable/disable buttons
    function checkWorkflowProgress() {
        const runAnalysisBtn = document.getElementById('run-analysis-btn');
        
        // Enable analysis if location and hazard are selected
        const canRunAnalysis = selectedLocation && selectedHazard;
        
        if (runAnalysisBtn) {
            runAnalysisBtn.disabled = !canRunAnalysis;
        }
    }
    
    // Helper function to populate cantons
    function populateCantons() {
        console.log('Populating cantons...');
        
        // Extract unique cantons from the Swiss administrative data
        // Based on the data structure found in suisse_admin_lim.js
        const cantons = [
            'Aargau',
            'Appenzell Ausserrhoden',
            'Appenzell Innerrhoden', 
            'Basel-Landschaft',
            'Basel-Stadt',
            'Bern',
            'Fribourg',
            'Genève',
            'Glarus',
            'Graubünden',
            'Jura',
            'Luzern',
            'Neuchâtel',
            'Nidwalden',
            'Obwalden',
            'Schaffhausen',
            'Schwyz',
            'Solothurn',
            'St. Gallen',
            'Thurgau',
            'Ticino',
            'Uri',
            'Valais',
            'Vaud',
            'Zug',
            'Zürich'
        ].sort(); // Sort alphabetically for better user experience
        
        const cantonSelect = document.getElementById('canton-select');
        
        if (!cantonSelect) return;
        
        // Clear existing options except the first one
        cantonSelect.innerHTML = '<option value="">Sélectionner un canton...</option>';
        
        // Add canton options
        cantons.forEach(canton => {
            const option = document.createElement('option');
            option.value = canton;
            option.textContent = canton;
            cantonSelect.appendChild(option);
        });
        
        console.log(`Loaded ${cantons.length} cantons into dropdown`);
    }

    // Helper function to populate communes dynamically from suisse_admin_lim data
    function populateCommunes(canton) {
        const communeSelect = document.getElementById('commune-select');
        if (!communeSelect) return;
        
        console.log(`Populating communes for canton: ${canton}`);
        
        // Check if suisse_admin_lim data is available
        if (typeof suisse_admin_lim === 'undefined') {
            console.error('⚠️ suisse_admin_lim data not available');
            // Fallback to sample data
            const fallbackCommunes = ['Données non disponibles'];
            communeSelect.innerHTML = '<option value="">Sélectionner une commune...</option>';
            fallbackCommunes.forEach(commune => {
                const option = document.createElement('option');
                option.value = commune.toLowerCase();
                option.textContent = commune;
                communeSelect.appendChild(option);
            });
            return;
        }
        
        try {
            // Extract communes for the selected canton from the real data
            const communesForCanton = [];
            
            // Debug: Log data structure info
            console.log(`📊 Processing suisse_admin_lim data with ${suisse_admin_lim.features?.length || 0} features`);
            
            // Iterate through all features to find communes in the selected canton
            if (suisse_admin_lim.features) {
                suisse_admin_lim.features.forEach(feature => {
                    const properties = feature.properties;
                    if (properties && properties.canton === canton && properties.commune) {
                        // Add commune if not already in the list
                        if (!communesForCanton.includes(properties.commune)) {
                            communesForCanton.push(properties.commune);
                        }
                    }
                });
            }
            
            // Sort communes alphabetically
            communesForCanton.sort();
            
            // Clear existing options
            communeSelect.innerHTML = '<option value="">Sélectionner une commune...</option>';
            
            // Populate dropdown with communes
            if (communesForCanton.length > 0) {
                communesForCanton.forEach(commune => {
                    const option = document.createElement('option');
                    option.value = commune.toLowerCase().replace(/\s+/g, '-');
                    option.textContent = commune;
                    communeSelect.appendChild(option);
                });
                
                console.log(`✅ Loaded ${communesForCanton.length} communes for ${canton}:`, communesForCanton.slice(0, 5));
            } else {
                // No communes found for this canton
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Aucune commune trouvée';
                option.disabled = true;
                communeSelect.appendChild(option);
                
                console.warn(`⚠️ No communes found for canton: ${canton}`);
            }
            
        } catch (error) {
            console.error('❌ Error extracting communes from data:', error);
            
            // Fallback to show error message
            communeSelect.innerHTML = '<option value="">Erreur lors du chargement</option>';
        }
    }
    
    // Function to update polygon dropdown when polygons are drawn
    window.updatePolygonDropdown = function(polygons) {
        const polygonSelect = document.getElementById('polygon-select');
        if (!polygonSelect) return;
        
        drawnPolygons = polygons;
        polygonSelect.innerHTML = '<option value="">Select Polygon</option>';
        
        if (polygons.length === 0) {
            polygonSelect.innerHTML = '<option value="">No polygons available</option>';
            polygonSelect.disabled = true;
        } else {
            polygonSelect.disabled = false;
            polygons.forEach((polygon, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Polygon ${index + 1}`;
                polygonSelect.appendChild(option);
            });
        }
    };
}

// Rockfall layer functionality
let rockfallLayer = null;

function addRockfallLayer() {
    // console.log('🪨 Adding rockfall layer...');
    
    // Check if rockfall_hazards is available
    if (typeof rockfall_hazards === 'undefined') {
        console.error('❌ rockfall_hazards data not available');
        // alert('Hazards data not loaded. Please refresh the page.');
        return;
    }
    
    // Check if swissToWGS84 function is available
    if (typeof swissToWGS84 !== 'function') {
        console.error('❌ swissToWGS84 transformation function not available');
        // alert('Coordinate transformation function not loaded. Please refresh the page.');
        return;
    }
    
    // Filter for rockfall features only
    const rockfallFeatures = rockfall_hazards.features.filter(feature => 
        feature.properties.subproc_sy === 'rock_fall'
    );
    
    // console.log(`📊 Found ${rockfallFeatures.length} rockfall features`);
    
    if (rockfallFeatures.length === 0) {
        // console.warn('⚠️ No rockfall features found');
        // alert('No rockfall hazards found in the data.');
        return;
    }
    
    // Transform coordinates using existing swissToWGS84 function
    const transformedFeatures = rockfallFeatures.map(feature => {
        const newFeature = { ...feature };
        
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
        
        newFeature.geometry = {
            ...feature.geometry,
            coordinates: transformCoordArray(feature.geometry.coordinates)
        };
        
        return newFeature;
    });
    
    // console.log('🔄 Coordinates transformed using swissToWGS84 function');
    
    // Sample first transformed coordinate for verification
    // if (transformedFeatures[0]?.geometry?.coordinates) {
    //     const sampleCoord = transformedFeatures[0].geometry.coordinates[0][0][0];
    //     console.log('📍 Sample transformed coordinate:', sampleCoord);
    // }
    
    // Create GeoJSON object with transformed features
    const rockfallGeoJSON = {
        type: "FeatureCollection",
        features: transformedFeatures
    };
    
    // Remove existing layer if present
    if (rockfallLayer && window.map) {
        window.map.removeLayer(rockfallLayer);
    }
    
    // Create and add the rockfall layer
    if (window.map) {
        rockfallLayer = L.geoJSON(rockfallGeoJSON, {
            style: function(feature) {
                // Style based on intensity
                const intensity = feature.properties.intensity_;
                let color, fillOpacity;
                
                switch(intensity) {
                    case 'high':
                        color = '#d73027';
                        fillOpacity = 0.8;
                        break;
                    case 'mean':
                        color = '#fcf11bff';
                        fillOpacity = 0.6;
                        break;
                    case 'low':
                        color = '#4575b4';
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
            },
            onEachFeature: function(feature, layer) {
                // Add popup with hazard information
                const props = feature.properties;
                const popupContent = `
                    <div style="font-size: 12px;">
                        <h4>🪨 Rockfall Hazard</h4>
                        <p><strong>Intensity:</strong> ${props.intensity_}</p>
                        <p><strong>Return Period:</strong> ${props.return_per} years</p>
                        <p><strong>Canton:</strong> ${props.canton}</p>
                        <p><strong>Type:</strong> ${props.cantonal_t || 'N/A'}</p>
                        ${props.comments ? `<p><strong>Comments:</strong> ${props.comments}</p>` : ''}
                    </div>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(window.map);
        
        // console.log('✅ Rockfall layer added successfully');
        // alert(`Rockfall layer added! Found ${rockfallFeatures.length} features.`);
        
        // Fit map to show the layer (center on Ticino)
        if (rockfallLayer.getBounds && rockfallLayer.getBounds().isValid()) {
            window.map.fitBounds(rockfallLayer.getBounds());
            // console.log('🗺️ Map fitted to rockfall layer bounds');
        }
    } else {
        console.error('❌ Map not available');
        // alert('Map not initialized. Please try again.');
    }
}

function removeRockfallLayer() {
    // console.log('🪨 Removing rockfall layer...');
    
    if (rockfallLayer && window.map) {
        window.map.removeLayer(rockfallLayer);
        rockfallLayer = null;
        // console.log('✅ Rockfall layer removed');
        // alert('Rockfall layer removed.');
    } else {
        // console.log('⚠️ No rockfall layer to remove');
        // alert('No rockfall layer currently active.');
    }
}

// ==================== DEBRIS FLOW LAYER FUNCTIONALITY ====================

// Global variable to store debris flow layer
let debrisFlowLayer = null;

function addDebrisFlowLayer() {
    console.log('🌊 Adding debris flow layer...');
    
    // Check if debris_flow_hazards is available
    if (typeof debris_flow_hazards === 'undefined') {
        console.error('❌ debris_flow_hazards data not available');
        return;
    }
    
    // Check if swissToWGS84 function is available
    if (typeof swissToWGS84 !== 'function') {
        console.error('❌ swissToWGS84 transformation function not available');
        return;
    }
    
    // Filter for debris flow features only
    const debrisFlowFeatures = debris_flow_hazards.features.filter(feature => 
        feature.properties.subproc_sy === 'debris_flow'
    );
    
    console.log(`📊 Found ${debrisFlowFeatures.length} debris flow features`);
    
    if (debrisFlowFeatures.length === 0) {
        console.warn('⚠️ No debris flow features found');
        return;
    }
    
    // Transform coordinates using existing swissToWGS84 function
    const transformedFeatures = debrisFlowFeatures.map(feature => {
        const newFeature = { ...feature };
        
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
        
        newFeature.geometry = {
            ...feature.geometry,
            coordinates: transformCoordArray(feature.geometry.coordinates)
        };
        
        return newFeature;
    });
    
    console.log('🔄 Debris flow coordinates transformed using swissToWGS84 function');
    
    // Create GeoJSON object with transformed features
    const debrisFlowGeoJSON = {
        type: "FeatureCollection",
        features: transformedFeatures
    };
    
    // Remove existing layer if present
    if (debrisFlowLayer && window.map) {
        window.map.removeLayer(debrisFlowLayer);
    }
    
    // Create and add the debris flow layer
    if (window.map) {
        debrisFlowLayer = L.geoJSON(debrisFlowGeoJSON, {
            style: function(feature) {
                // Style based on intensity - using blue tones for debris flow
                const intensity = feature.properties.intensity_;
                let color, fillOpacity;
                
                switch(intensity) {
                    case 'high':
                        color = '#c02015ff';      // Dark blue for high intensity
                        fillOpacity = 0.8;
                        break;
                    case 'mean':
                        color = '#e5d718ff';      // Medium blue for mean intensity  
                        fillOpacity = 0.6;
                        break;
                    case 'low':
                        color = '#2979ceff';      // Light blue for low intensity
                        fillOpacity = 0.4;
                        break;
                    default:
                        color = '#d9e5f0ff';      // Very light blue for undefined
                        fillOpacity = 0.3;
                }
                
                return {
                    color: color,
                    weight: 1,
                    opacity: 1,
                    fillColor: color,
                    fillOpacity: fillOpacity
                };
            },
            onEachFeature: function(feature, layer) {
                // Add popup with hazard information
                const props = feature.properties;
                const popupContent = `
                    <div style="font-size: 12px;">
                        <h4>🌊 Debris Flow Hazard</h4>
                        <p><strong>Intensity:</strong> ${props.intensity_}</p>
                        <p><strong>Return Period:</strong> ${props.return_per} years</p>
                        <p><strong>Canton:</strong> ${props.canton}</p>
                        <p><strong>Type:</strong> ${props.cantonal_t || 'N/A'}</p>
                        <p><strong>Extreme Scenario:</strong> ${props.extreme_sc ? 'Yes' : 'No'}</p>
                        ${props.comments ? `<p><strong>Comments:</strong> ${props.comments}</p>` : ''}
                    </div>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(window.map);
        
        console.log('✅ Debris flow layer added successfully');
        
        // Fit map to show the layer
        if (debrisFlowLayer.getBounds && debrisFlowLayer.getBounds().isValid()) {
            window.map.fitBounds(debrisFlowLayer.getBounds());
            console.log('🗺️ Map fitted to debris flow layer bounds');
        }
    } else {
        console.error('❌ Map not available');
    }
}

function removeDebrisFlowLayer() {
    console.log('🌊 Removing debris flow layer...');
    
    if (debrisFlowLayer && window.map) {
        window.map.removeLayer(debrisFlowLayer);
        debrisFlowLayer = null;
        console.log('✅ Debris flow layer removed');
    } else {
        console.log('⚠️ No debris flow layer to remove');
    }
}

// ==================== HAZARDS ATTRIBUTES TABLE FUNCTIONALITY ====================

// Global variable to store current hazards data for attributes table
let currentHazardsData = null;

// Function to show the hazards attributes table
function showHazardsAttributesTable(hazardType = 'all') {
    if (typeof rockfall_hazards === 'undefined') {
        // alert('⚠️ Hazards data not available. Please refresh the page.');
        console.error('⚠️ Hazards data not available');
        return;
    }
    
    // Filter hazards data based on type
    let filteredData = rockfall_hazards.features;
    if (hazardType !== 'all') {
        filteredData = rockfall_hazards.features.filter(feature => 
            feature.properties.subproc_sy === hazardType
        );
    }
    
    if (filteredData.length === 0) {
        // alert('⚠️ No hazards data found for the selected type.');
        console.warn('⚠️ No hazards data found for the selected type:', hazardType);
        return;
    }
    
    // Store current data globally
    currentHazardsData = filteredData;
    
    // Remove existing table if it exists
    closeHazardsAttributesTable();
    
    // Create the table window
    createHazardsAttributesWindow(hazardType);
}

// Function to close/remove the hazards attributes table
function closeHazardsAttributesTable() {
    const existingWindow = document.getElementById('hazards-attributes-window');
    if (existingWindow) {
        existingWindow.remove();
    }
}

// Function to create the draggable hazards attributes window
function createHazardsAttributesWindow(hazardType) {
    // Create the main window container
    const windowDiv = document.createElement('div');
    windowDiv.id = 'hazards-attributes-window';
    windowDiv.className = 'attributes-window';
    
    // Window styles
    windowDiv.style.cssText = `
        position: fixed;
        top: 120px;
        left: 120px;
        width: 1000px;
        height: 600px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
        border: 2px solid #e74c3c;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
        backdrop-filter: blur(10px);
        resize: both;
        min-width: 700px;
        min-height: 400px;
    `;
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'attributes-header';
    header.style.cssText = `
        background: rgba(255,255,255,0.1);
        padding: 15px 20px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(5px);
    `;
    
    const title = document.createElement('h4');
    const hazardTypeLabel = hazardType === 'all' ? 'All Hazards' : hazardType.replace('_', ' ').toUpperCase();
    title.textContent = `🚨 ${hazardTypeLabel} Attributes (${currentHazardsData.length} records)`;
    title.style.cssText = `
        margin: 0;
        color: white;
        font-weight: 600;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        font-size: 18px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,0,0,0.6)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
    closeBtn.onclick = closeHazardsAttributesTable;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create table container
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = `
        padding: 20px;
        height: calc(100% - 80px);
        overflow: auto;
        background: rgba(255,255,255,0.05);
    `;
    
    // Create the table
    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        background: rgba(255,255,255,0.9);
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    `;
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = `
        background: linear-gradient(135deg, #e74c3c, #c0392b);
        color: white;
    `;
    
    // Define columns to display
    const columns = [
        { key: 't_id', label: 'Hazard ID' },
        { key: 'subproc_sy', label: 'Hazard Type' },
        { key: 'intensity_', label: 'Intensity' },
        { key: 'cantonal_t', label: 'Cantonal Type' },
        { key: 'return_per', label: 'Return Period (years)' },
        { key: 'extreme_sc', label: 'Extreme Scenario' },
        { key: 'process_so', label: 'Process Source' },
        { key: 'canton', label: 'Canton' },
        { key: 'data_respo', label: 'Data Responsible' },
        { key: 'comments', label: 'Comments' }
    ];
    
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        th.style.cssText = `
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            border-right: 1px solid rgba(255,255,255,0.2);
            font-size: 14px;
        `;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    currentHazardsData.forEach((feature, index) => {
        const hazard = feature.properties;
        const row = document.createElement('tr');
        row.style.cssText = `
            transition: all 0.3s ease;
            ${index % 2 === 0 ? 'background: rgba(0,0,0,0.02);' : 'background: white;'}
        `;
        row.onmouseover = () => row.style.background = 'rgba(231, 76, 60, 0.1)';
        row.onmouseout = () => row.style.background = index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white';
        
        columns.forEach(col => {
            const td = document.createElement('td');
            let value = hazard[col.key];
            
            // Format specific values
            if (col.key === 'extreme_sc') {
                value = value ? 'Yes' : 'No';
            } else if (col.key === 'subproc_sy') {
                value = value ? value.replace('_', ' ').toUpperCase() : 'N/A';
            } else if (col.key === 'intensity_') {
                value = value ? value.toUpperCase() : 'N/A';
            }
            
            td.textContent = value || 'N/A';
            td.style.cssText = `
                padding: 10px 8px;
                border-right: 1px solid rgba(0,0,0,0.1);
                border-bottom: 1px solid rgba(0,0,0,0.05);
                font-size: 13px;
                color: #333;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;
            
            // Add title for full text on hover
            if (value && value.length > 20) {
                td.title = value;
            }
            
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    // Assemble the window
    windowDiv.appendChild(header);
    windowDiv.appendChild(tableContainer);
    
    // Add to document
    document.body.appendChild(windowDiv);
    
    // Make it draggable using the same function as buildings
    if (typeof makeDraggable === 'function') {
        makeDraggable(windowDiv, header);
    } else {
        // Implement basic draggable functionality
        makeWindowDraggable(windowDiv, header);
    }
}

// Basic draggable functionality for hazards table
function makeWindowDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        handle.style.cursor = 'grabbing';
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        handle.style.cursor = 'move';
    }
}

// Make functions globally available
window.showHazardsAttributesTable = showHazardsAttributesTable;
window.closeHazardsAttributesTable = closeHazardsAttributesTable;

// Layer section expand/collapse
function initializeLayerControls() {
    console.log('🔧 Setting up layer controls...');
    
    // Note: Layer controls have been integrated into the workflow-based sidebar
    // The rockfall functionality is now handled by initializeHazardToggles()
    // Buildings functionality is handled by initializeBuildingToggle()
    
    // Check if there are any legacy layer control elements that need to be handled
    const legacyElements = [
        'build-hide-show',
        'rockfall-hide-show', 
        'dem-hide-show',
        'add-rock-lyr',
        'rem-rock-lyr',
        'att-rock-table'
    ];
    
    let foundLegacyElements = false;
    legacyElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            foundLegacyElements = true;
            console.log(`📋 Found legacy layer control element: ${elementId}`);
            // Handle legacy elements if needed
        }
    });
    
    if (!foundLegacyElements) {
        console.log('✅ No legacy layer control elements found - using workflow-based controls');
    }
    
    console.log('✅ Layer controls initialization complete');
}

// ==================== LEAFLET DRAW FUNCTIONALITY ====================
function initializeDrawFunctionality() {
    console.log('🎨 Initializing Leaflet Draw functionality...');
    
    // Wait for map to be ready
    if (!window.map || !window.drawControl) {
        console.warn('⚠️ Map or draw control not ready, retrying...');
        setTimeout(initializeDrawFunctionality, 500);
        return;
    }
    
    // Add draw event handlers
    window.map.on('draw:created', function (e) {
        const type = e.layerType;
        const layer = e.layer;

        console.log('✏️ Shape drawn:', type);

        // Add the drawn layer to the feature group
        window.fgp.addLayer(layer);

        // If it's a polygon, store it for analysis
        if (type === 'polygon') {
            console.log('📐 Polygon created for analysis');
            window.drawnPolygon = layer;
            
            // Enable analysis button
            const runAnalysisBtn = document.getElementById('run-analysis');
            if (runAnalysisBtn) {
                runAnalysisBtn.disabled = false;
                console.log('✅ Analysis button enabled');
            }

            // Update the area selector to show "Drawn polygon" is available
            updateAreaSelector();
        }
    });

    window.map.on('draw:edited', function (e) {
        const layers = e.layers;
        layers.eachLayer(function (layer) {
            console.log('✏️ Shape edited');
            // Update stored polygon if it was edited
            if (layer === window.drawnPolygon) {
                console.log('📐 Updated polygon coordinates');
            }
        });
    });

    window.map.on('draw:deleted', function (e) {
        const layers = e.layers;
        layers.eachLayer(function (layer) {
            console.log('🗑️ Shape deleted');
            // If the deleted layer was our stored polygon, clear it
            if (layer === window.drawnPolygon) {
                window.drawnPolygon = null;
                
                // Disable analysis button
                const runAnalysisBtn = document.getElementById('run-analysis');
                if (runAnalysisBtn) {
                    runAnalysisBtn.disabled = true;
                    console.log('❌ Analysis button disabled');
                }
            }
        });
    });

    // Note: "Start polygon" button is reserved for future keyboard drawing implementation
    // Only Leaflet Draw toolbar functionality is active
    
    console.log('✅ Leaflet Draw functionality initialized');
    console.log('ℹ️ Use the draw toolbar on the map to create polygons');
}

// Helper function to update area selector when polygon is drawn
function updateAreaSelector() {
    const typeSelector = document.getElementById('type-sel');
    if (typeSelector && window.drawnPolygon) {
        // Set to "Drawn polygon" option (value="2")
        typeSelector.value = '2';
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        typeSelector.dispatchEvent(event);
    }
}

// Main initialization
function initializeEverything() {
    // console.log('🚀 Starting initialization...');
    
    // Initialize reset button
    initializeResetButton();
    
    // Initialize workflow
    initializeWorkflow();
    
    // Initialize layer controls
    initializeLayerControls();
    
    // Initialize map
    // console.log('🗺️ Checking for map initialization...');
    if (typeof initializeMap === 'function') {
        // console.log('✅ Found initializeMap, calling it...');
        initializeMap();
        
        // Initialize draw functionality after map is ready
        setTimeout(() => {
            initializeDrawFunctionality();
        }, 1500);
    } else {
        console.warn('⚠️ initializeMap not found, will retry...');
        setTimeout(() => {
            if (typeof initializeMap === 'function') {
                // console.log('✅ Found initializeMap on retry, calling it...');
                initializeMap();
                
                // Initialize draw functionality after map is ready
                setTimeout(() => {
                    initializeDrawFunctionality();
                }, 1500);
            } else {
                console.error('❌ initializeMap still not available');
            }
        }, 1000);
    }
    
    // console.log('✅ Initialization complete');
}

// ==================== ZOOM TO ADMINISTRATIVE AREAS ====================

// Global variable to store the current selection highlight layer
let currentSelectionLayer = null;

/**
 * Zoom to a specific administrative area (canton or commune) and highlight it
 * @param {string} type - 'canton' or 'commune'
 * @param {string} name - Name of the administrative area
 */
function zoomToAdministrativeArea(type, name) {
    console.log(`🔍 Zooming to ${type}: ${name}`);
    
    // Check if map and Swiss administrative layer are available
    if (!window.map) {
        console.error('❌ Map not available for zooming');
        return;
    }
    
    if (!window.swissAdminLayer) {
        console.error('❌ Swiss administrative layer not available for zooming');
        return;
    }
    
    if (!name || name === '') {
        console.warn('⚠️ No administrative area name provided');
        return;
    }
    
    // Remove previous selection highlight
    removeSelectionHighlight();
    
    try {
        // Find the matching features in the Swiss administrative layer
        const matchingFeatures = [];
        const matchingGeoJSONFeatures = [];
        
        window.swissAdminLayer.eachLayer(function(layer) {
            const properties = layer.feature.properties;
            
            if (type === 'canton' && properties.canton === name) {
                matchingFeatures.push(layer);
                matchingGeoJSONFeatures.push(layer.feature);
            } else if (type === 'commune' && properties.commune === name) {
                matchingFeatures.push(layer);
                matchingGeoJSONFeatures.push(layer.feature);
            }
        });
        
        if (matchingFeatures.length > 0) {
            // Create a feature group to get combined bounds
            const featureGroup = new L.featureGroup(matchingFeatures);
            const bounds = featureGroup.getBounds();
            
            // Create yellow highlight layer for selection
            createSelectionHighlight(matchingGeoJSONFeatures, type, name);
            
            // Zoom to the bounds with some padding
            window.map.fitBounds(bounds, {
                padding: [20, 20], // Add 20px padding on all sides
                maxZoom: type === 'commune' ? 14 : 10 // Closer zoom for communes
            });
            
            console.log(`✅ Zoomed to ${type}: ${name} (${matchingFeatures.length} features)`);
        } else {
            console.warn(`⚠️ No matching features found for ${type}: ${name}`);
            
            // Fallback: try to find in the raw data if layer search fails
            if (typeof suisse_admin_lim !== 'undefined' && suisse_admin_lim.features) {
                const fallbackFeatures = suisse_admin_lim.features.filter(feature => {
                    const props = feature.properties;
                    return (type === 'canton' && props.canton === name) ||
                           (type === 'commune' && props.commune === name);
                });
                
                if (fallbackFeatures.length > 0) {
                    // Create yellow highlight layer for fallback selection
                    createSelectionHighlight(fallbackFeatures, type, name);
                    
                    // Calculate bounds from GeoJSON coordinates
                    const bounds = calculateGeoJSONBounds(fallbackFeatures);
                    if (bounds) {
                        window.map.fitBounds(bounds, {
                            padding: [20, 20],
                            maxZoom: type === 'commune' ? 12 : 10
                        });
                        console.log(`✅ Fallback zoom to ${type}: ${name}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error(`❌ Error zooming to ${type} ${name}:`, error);
    }
}

/**
 * Create a yellow highlight layer for the selected administrative area
 * @param {Array} features - Array of GeoJSON features to highlight
 * @param {string} type - 'canton' or 'commune'
 * @param {string} name - Name of the administrative area
 */
function createSelectionHighlight(features, type, name) {
    if (!features || features.length === 0) return;
    
    // Remove previous selection first (ensure only one selection at a time)
    removeSelectionHighlight();
    
    // Create GeoJSON object for highlighting
    const highlightGeoJSON = {
        type: "FeatureCollection",
        features: features
    };
    
    // Create the highlight layer with yellow styling
    currentSelectionLayer = L.geoJSON(highlightGeoJSON, {
        style: function(feature) {
            return {
                color: '#ffd700',           // Gold border
                weight: 3,                  // Thicker border for visibility
                opacity: 1,                 // Full opacity for border
                fillColor: '#ffff00',       // Yellow fill
                fillOpacity: 0.3,           // Semi-transparent fill
                dashArray: '5, 5'           // Dashed line for distinction
            };
        },
        onEachFeature: function(feature, layer) {
            // Add popup with selection information
            const props = feature.properties;
            const popupContent = `
                <div style="font-size: 14px; font-weight: bold; color: #ff8c00;">
                    <h4 style="margin: 5px 0; color: #ff8c00;">🎯 Selected ${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                    ${props.canton ? `<p style="margin: 5px 0;"><strong>Canton:</strong> ${props.canton}</p>` : ''}
                    ${props.commune ? `<p style="margin: 5px 0;"><strong>Commune:</strong> ${props.commune}</p>` : ''}
                    <p style="margin: 5px 0; font-size: 12px; color: #666;">
                        <em>This area is currently selected for analysis</em>
                    </p>
                </div>
            `;
            layer.bindPopup(popupContent);
        }
    });
    
    // Add the highlight layer to the map
    currentSelectionLayer.addTo(window.map);
    
    // Zoom to the selected area
    const bounds = currentSelectionLayer.getBounds();
    if (bounds.isValid()) {
        window.map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: type === 'commune' ? 13 : 10  // Closer zoom for communes
        });
        console.log(`🎯 Zoomed to selected ${type}: ${name}`);
    }
    
    // Add to layer control for toggle functionality
    if (window.ctlLayers) {
        const layerName = `🎯 Selected ${type.charAt(0).toUpperCase() + type.slice(1)}: ${name}`;
        
        // Debug: Check if layer control exists and log current state
        console.log(`📋 Adding '${layerName}' to layer control`);
        console.log(`📋 Current layer control exists:`, !!window.ctlLayers);
        console.log(`📋 Current layer being added:`, currentSelectionLayer);
        
        window.ctlLayers.addOverlay(currentSelectionLayer, layerName);
        console.log(`📋 Successfully added '${layerName}' to layer control`);
    }
    
    // Store reference to the selection for later removal
    window.currentAdministrativeSelection = {
        type: type,
        name: name,
        layer: currentSelectionLayer,
        layerName: layerName
    };
    
    console.log(`🎯 Added yellow highlight for selected ${type}: ${name}`);
}

/**
 * Remove the current selection highlight layer
 */
function removeSelectionHighlight() {
    console.log('🧹 removeSelectionHighlight called');
    console.log('🧹 currentSelectionLayer exists:', !!currentSelectionLayer);
    console.log('🧹 window.map exists:', !!window.map);
    
    if (currentSelectionLayer && window.map) {
        // Remove from map first
        console.log('🧹 Removing layer from map...');
        window.map.removeLayer(currentSelectionLayer);
        
        // Remove from layer control - need to remove the actual layer object
        if (window.ctlLayers && currentSelectionLayer) {
            try {
                console.log('🧹 Attempting to remove layer from control...');
                // This is the correct way to remove a layer from Leaflet layer control
                window.ctlLayers.removeLayer(currentSelectionLayer);
                console.log(`📋 Successfully removed selection layer from layer control`);
            } catch (error) {
                console.warn('⚠️ Could not remove layer from control:', error);
            }
        }
        
        // Clean up references
        currentSelectionLayer = null;
        window.currentAdministrativeSelection = null;
        console.log('🧹 Cleaned up references - selection highlight removed');
    } else {
        console.log('🧹 No current selection layer to remove');
    }
}

/**
 * Get the currently selected administrative area
 * @returns {Object|null} Object with type, name, and layer, or null if none selected
 */
function getCurrentAdministrativeSelection() {
    return window.currentAdministrativeSelection || null;
}

// Make the selection functions globally available
window.removeSelectionHighlight = removeSelectionHighlight;
window.getCurrentAdministrativeSelection = getCurrentAdministrativeSelection;

/**
 * Calculate bounds from GeoJSON features
 * @param {Array} features - Array of GeoJSON features
 * @returns {L.LatLngBounds} Leaflet bounds object
 */
function calculateGeoJSONBounds(features) {
    if (!features || features.length === 0) return null;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
            // Handle different geometry types
            const coords = flattenCoordinates(feature.geometry.coordinates);
            
            coords.forEach(coord => {
                const lng = coord[0];
                const lat = coord[1];
                
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
            });
        }
    });
    
    if (minLat !== Infinity && maxLat !== -Infinity && 
        minLng !== Infinity && maxLng !== -Infinity) {
        return L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
    }
    
    return null;
}

/**
 * Flatten nested coordinate arrays (handles Polygon, MultiPolygon, etc.)
 * @param {Array} coordinates - Nested coordinate array
 * @returns {Array} Flattened array of [lng, lat] pairs
 */
function flattenCoordinates(coordinates) {
    const result = [];
    
    function flatten(arr) {
        if (Array.isArray(arr[0])) {
            arr.forEach(flatten);
        } else {
            // This is a coordinate pair [lng, lat]
            result.push(arr);
        }
    }
    
    flatten(coordinates);
    return result;
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEverything);
} else {
    initializeEverything();
}

// console.log('📄 Simple app.js loaded');
