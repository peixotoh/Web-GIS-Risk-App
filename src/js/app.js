// ==================== SIMPLE WORKING SYSTEM ====================

// console.log('📄 Simple app.js loading...');

// ------------------ Global variables (initialized at file top) ------------------
// Keep global/window-scoped state together here so they're easy to find.
if (typeof window.map === 'undefined') window.map = null;
// Canonical hazard variable; per-hazard custom layers removed
if (typeof window.hazardLayer === 'undefined') window.hazardLayer = null;
if (typeof window.drawnPolygon === 'undefined') window.drawnPolygon = null;
if (typeof window.selectedLocation === 'undefined') window.selectedLocation = null;
if (typeof window.selectedHazard === 'undefined') window.selectedHazard = null;
if (typeof window.buildingsEnabled === 'undefined') window.buildingsEnabled = false;
if (typeof window.currentBBox === 'undefined') window.currentBBox = null;
if (typeof window.fgp === 'undefined') window.fgp = null;
if (typeof window.fgp1 === 'undefined') window.fgp1 = null;
if (typeof window.drawControl === 'undefined') window.drawControl = null;
if (typeof window.ctlLayers === 'undefined') window.ctlLayers = null;
if (typeof window.swissAdminLayer === 'undefined') window.swissAdminLayer = null;
// Ensure buildings variables are present
// Single buildings variables used across all flows
if (typeof window.buildingsLayer === 'undefined') window.buildingsLayer = null;
if (typeof window.buildingsData === 'undefined') window.buildingsData = null;
// Spatial analysis variables
if (typeof window.latestAnalysisResults === 'undefined') window.latestAnalysisResults = null;
if (typeof window.latestExtractionResults === 'undefined') window.latestExtractionResults = null;
if (typeof window.analysisHighlightLayer === 'undefined') window.analysisHighlightLayer = null;
if (typeof window.currentAnalysisLayers === 'undefined') window.currentAnalysisLayers = null;
// Expose common building functions here for quick reference (overwritten by modules)
window.loadBuildingsFromSupabase = window.loadBuildingsFromSupabase || function() { console.warn('loadBuildingsFromSupabase not initialized'); };
window.removeBuildingsFromMap = window.removeBuildingsFromMap || function() { console.warn('removeBuildingsFromMap not initialized'); };
// ---------------------------------------------------------------------------------

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

    // After reset, ensure the selected hazard (default rockfall) is displayed
    try {
        const sel = window.currentAdministrativeSelection;
        if (sel && sel.layer && typeof fetchAndDisplayHazardLayer === 'function') {
            const b = sel.layer.getBounds();
            if (b && b.isValid()) {
                const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
                fetchAndDisplayHazardLayer(window.selectedHazard || 'rockfall', bbox);
            }
        }
    } catch (e) { /* ignore */ }
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

    // Keep rockfall selected by default after reset so a hazard is always selected
    const rockfallToggle = document.getElementById('rockfall-toggle');
    const debrisFlowToggle = document.getElementById('debris-flow-toggle');
    if (rockfallToggle) rockfallToggle.checked = true;
    if (debrisFlowToggle) debrisFlowToggle.checked = false;
    // Sync global selected hazard
    if (typeof window.selectedHazard !== 'undefined') window.selectedHazard = 'rockfall';
}

function removeAllLayers() {
    // Remove hazard layers (both API and custom data)
    // Ensure any previous hazard layer is removed
    removeHazardFromMap();
    // Use canonical hazard remover
    removeHazardFromMap();
    
    // Use canonical hazard removal; removeHazardFromMap already called above
    
    // Remove ALL building layers (Supabase + static)
    if (typeof window.removeBuildingsFromMap === 'function') {
        window.removeBuildingsFromMap();
    }
    // Also remove any previous buildingsLayer used by static/custom flows
    if (window.buildingsLayer && window.map) {
        try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
        window.buildingsLayer = null;
        window.buildingsData = null;
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
        // Reset to Switzerland center and zoom level 8
        window.map.setView([46.9, 8.2], 8);
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
        // Preserve a default hazard selection after reset
        window.selectedHazard = 'rockfall';
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
    let selectedHazard = 'rockfall'; // Default to rockfall hazard
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

                    // Building fetch triggered by zoomToAdministrativeArea (sets window.currentBBox)
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

        // Select rockfall hazard by default
        if (rockfallToggle) {
            rockfallToggle.checked = true;
            selectedHazard = 'rockfall';
            // keep global selection in sync
            window.selectedHazard = 'rockfall';
        }

        if (rockfallToggle) {
            rockfallToggle.addEventListener('change', function(e) {
                if (e.target.checked) {
                    selectedHazard = 'rockfall';
                    // sync global selection
                    window.selectedHazard = 'rockfall';
                    console.log('Rockfall hazard selected');
                    if (debrisFlowToggle) debrisFlowToggle.checked = false;
                    // If an administrative area is selected, refresh hazards for that area
                    try {
                        const sel = window.currentAdministrativeSelection;
                        if (sel && sel.layer && typeof fetchAndDisplayHazardLayer === 'function') {
                            const b = sel.layer.getBounds();
                            if (b && b.isValid()) {
                                const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
                                fetchAndDisplayHazardLayer(window.selectedHazard, bbox);
                            }
                        }
                    } catch (err) { console.warn('⚠️ Could not refresh hazards after selecting rockfall', err); }
                } else {
                    selectedHazard = null;
                    window.selectedHazard = null;
                }
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
                    window.selectedHazard = 'debris-flow';
                    console.log('Debris flow hazard selected');
                    if (rockfallToggle) rockfallToggle.checked = false;
                    // Refresh hazards for current selection if present
                    try {
                        const sel = window.currentAdministrativeSelection;
                        if (sel && sel.layer && typeof fetchAndDisplayHazardLayer === 'function') {
                            const b = sel.layer.getBounds();
                            if (b && b.isValid()) {
                                const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
                                fetchAndDisplayHazardLayer(window.selectedHazard, bbox);
                            }
                        }
                    } catch (err) { console.warn('⚠️ Could not refresh hazards after selecting debris flow', err); }
                } else {
                    selectedHazard = null;
                    window.selectedHazard = null;
                }
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
        const uploadSection = document.getElementById('custom-upload-section');
        const hazardUploadInput = document.getElementById('custom-hazard-upload');
        const buildingUploadInput = document.getElementById('custom-building-upload');

        // remove after assign hazard and buil options
        const uploadInput = document.getElementById('custom-data-upload');
        
        // Initialize data source controls if elements exist
        if (dataSourceSelect) {
            dataSourceSelect.onchange = updateDataSourceDisplay;
            updateDataSourceDisplay();
        }
        
        // -------------handling hazards file upload
        if(hazardUploadInput){
            hazardUploadInput.onchange = function() {
                const fileName = this.value.split('\\').pop();
                const fileLabel = this.parentElement.querySelector('.custom-file-label');
                if (fileLabel) {
                    fileLabel.textContent = fileName || 'Choose file...';
                }
                if (this.files && this.files[0]) {
                    // pass explicit type so the processor knows this is a hazard file
                    processCustomDataFile(this.files[0], 'hazard');
                }
            }
        }

        // -------------handling buildings file upload
        if(buildingUploadInput){
            buildingUploadInput.onchange = function() {
                const fileName = this.value.split('\\').pop();
                const fileLabel = this.parentElement.querySelector('.custom-file-label');
                if (fileLabel) {
                    fileLabel.textContent = fileName || 'Choose file...';
                }
                if (this.files && this.files[0]) {
                    // pass explicit type so the processor knows this is a building file
                    processCustomDataFile(this.files[0], 'building');
                }
            }
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
                    // Decide explicit input type: if a hazard is selected, treat as hazard upload,
                    // otherwise treat as building upload (buildings uploads don't require hazard selection).
                    const selectedHazard = getSelectedHazardType();
                    const inputType = selectedHazard ? 'hazard' : 'building';
                    processCustomDataFile(this.files[0], inputType);
                }
            });
        }
        
        // Function to update data source display based on selections
        function updateDataSourceDisplay() {
            const dataSourceSelectElement = document.getElementById('data-source-select');
            const uploadSection = document.getElementById('custom-upload-section');
            const suisseSection = document.getElementById('suisse-data-section');
        
            const hazardUploadInput = document.getElementById('custom-hazard-upload');
            const buildingUploadInput = document.getElementById('custom-building-upload');
        
            const fileLabel = document.querySelector('.custom-file-label');
            const hazardSelected = checkHazardSelection();
        
            if (!dataSourceSelectElement) return;
        
            const selectedValue = dataSourceSelectElement.value;
            console.log('selected value data source:', selectedValue);
            console.log('hazard selected:', hazardSelected);
        
            if (selectedValue === 'custom') {
                // Show upload section, hide Swiss section
                if (uploadSection) uploadSection.style.display = 'block';
                if (suisseSection) suisseSection.style.display = 'none';
        
                // Enable hazard/building upload only if hazard is selected
                if (hazardUploadInput && buildingUploadInput) {
                    hazardUploadInput.disabled = !hazardSelected;
                    buildingUploadInput.disabled = !hazardSelected;
                    if (!hazardSelected) {
                        hazardUploadInput.value = '';
                        buildingUploadInput.value = '';
                        if (fileLabel) fileLabel.textContent = 'Select a hazard type first...';
                    } else {
                        if (fileLabel) fileLabel.textContent = 'Choose file...';
                    }
                }
            } else if (selectedValue === 'api') {
                // Show Swiss section, hide upload section
                if (uploadSection) uploadSection.style.display = 'none';
                if (suisseSection) suisseSection.style.display = 'block';
        
                // Disable hazard/building upload
                if (hazardUploadInput && buildingUploadInput) {
                    hazardUploadInput.disabled = true;
                    buildingUploadInput.disabled = true;
                    hazardUploadInput.value = '';
                    buildingUploadInput.value = '';
                    if (fileLabel) fileLabel.textContent = 'Choose file...';
                }
            } else {
                // Default: show Swiss section, hide upload section
                if (uploadSection) uploadSection.style.display = 'none';
                if (suisseSection) suisseSection.style.display = 'block';
                if (hazardUploadInput && buildingUploadInput) {
                    hazardUploadInput.disabled = true;
                    buildingUploadInput.disabled = true;
                    hazardUploadInput.value = '';
                    buildingUploadInput.value = '';
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
        window.getSelectedHazardType = getSelectedHazardType;
        
        // Function to load custom data to map
        // Function to load custom hazard data to map
        function loadCustomHazardDataToMap(geojsonData, hazardType) {
            console.log(`🗺️ Loading custom ${hazardType} data to map...`);
            try {
                // Remove existing hazard layers first
                // Ensure any previous hazard layer is removed
                removeHazardFromMap();
                // Ensure a single canonical hazard layer is removed
                removeHazardFromMap();
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
                                    color = '#fcf11bff';
                                    fillOpacity = 0.6;
                                    break;
                                case 'faible':
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
                // Delegate to unified hazard adder so we use single canonical window.hazardLayer
                if (window.map) {
                    try {
                        addHazardToMap(transformedGeoJSON, hazardType === 'debris-flow' ? 'debris_flow' : hazardType);
                        console.log(`✅ Custom hazard data loaded with ${transformedGeoJSON.features.length} features`);
                        alert('✅ Custom hazard data loaded successfully!');
                        // Clear file inputs and labels so the user can upload again (overwrite)
                        try {
                            const hazardUploadInputEl = document.getElementById('custom-hazard-upload');
                            const genericUploadInputEl = document.getElementById('custom-data-upload');
                            if (hazardUploadInputEl) {
                                hazardUploadInputEl.value = '';
                                const label = hazardUploadInputEl.parentElement && hazardUploadInputEl.parentElement.querySelector('.custom-file-label');
                                if (label) label.textContent = 'Choose file...';
                            }
                            if (genericUploadInputEl) {
                                genericUploadInputEl.value = '';
                                const label2 = genericUploadInputEl.parentElement && genericUploadInputEl.parentElement.querySelector('.custom-file-label');
                                if (label2) label2.textContent = 'Choose file...';
                            }
                        } catch (e) { /* ignore non-fatal */ }
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

        // Function to load custom buildings data to map
        function loadCustomBuildingsDataToMap(geojsonData) {
            if (window.buildingsLayer && window.map) {
                    try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
                    console.log('buildings were removed', window.buildingsLayer);
                    window.buildingsLayer = null;
                    window.buildingsData = null;
                    console.log('values set to null');

            }
            console.log('🏢 Loading custom buildings data to map...');
            try {
                // Remove existing buildings layer if present (single variable)
                if (window.buildingsLayer && window.map) {
                    try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
                    console.log('buildings were removed', window.buildingsLayer);
                    window.buildingsLayer = null;
                    window.buildingsData = null;
                    console.log('values set to null');

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
                            try { layer.on && layer.on('click', function() { this.openPopup(); }); } catch (e) { /* ignore */ }
                        } catch (err) {
                            layer.bindPopup('<div class="building-popup">Custom building feature</div>');
                            try { layer.on && layer.on('click', function() { this.openPopup(); }); } catch (e) { /* ignore */ }
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
                        if (window.ctlLayers) {
                            removeOverlayByName('🏢 Buildings');
                            window.ctlLayers.addOverlay(window.buildingsLayer, '🏢 Buildings');
                        }
                    } catch (e) { /* ignore non-fatal */ }
                    // Fit map to bounds
                    if (window.buildingsLayer.getBounds && window.buildingsLayer.getBounds().isValid()) {
                        window.map.fitBounds(window.buildingsLayer.getBounds().pad(0.1));
                    }
                    alert(`✅ Custom buildings data loaded successfully! (${transformedGeoJSON.features.length} features)`);
                    // Clear file inputs and labels so the user can upload again (overwrite)
                    try {
                        const buildingUploadInputEl = document.getElementById('custom-building-upload');
                        const genericUploadInputEl = document.getElementById('custom-data-upload');
                        if (buildingUploadInputEl) {
                            buildingUploadInputEl.value = '';
                            const label = buildingUploadInputEl.parentElement && buildingUploadInputEl.parentElement.querySelector('.custom-file-label');
                            if (label) label.textContent = 'Choose file...';
                        }
                        if (genericUploadInputEl) {
                            genericUploadInputEl.value = '';
                            const label2 = genericUploadInputEl.parentElement && genericUploadInputEl.parentElement.querySelector('.custom-file-label');
                            if (label2) label2.textContent = 'Choose file...';
                        }
                    } catch (e) { /* ignore non-fatal */ }
                } else {
                    alert('⚠️ Map not available. Please refresh the page and try again.');
                }
            } catch (error) {
                console.error('❌ Error in loadCustomBuildingsDataToMap:', error);
                alert('⚠️ Error loading custom buildings data to map: ' + error.message);
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
        
        // Separate function for Swiss coordinate transformation
        function transformSwissToWGS84(geojsonData) {
            try {
                const transformedFeatures = geojsonData.features.map((feature, index) => {
                    const newFeature = { ...feature };
                    
                    function transformCoordArray(coords) {
                        if (typeof coords[0] === 'number' && coords.length >= 2) {
                                    const [east, north] = coords;
                                    if (!isNaN(east) && !isNaN(north)) {
                                        // Use window.swissToWGS84 if available (more robust across load order)
                                        const conv = (typeof window !== 'undefined' && typeof window.swissToWGS84 === 'function') ? window.swissToWGS84 : (typeof swissToWGS84 === 'function' ? swissToWGS84 : null);
                                        if (conv) {
                                            const wgs84 = conv(east, north);
                                            return [wgs84.lng, wgs84.lat];
                                        } else {
                                            // No conversion function available, return original coords
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
    }
    
    // Building toggle functionality
    function initializeBuildingToggle() {
        const buildingsToggle = document.getElementById('buildings-toggle');
        
        if (buildingsToggle) {
            // Helper: enable toggle only when zoom >= 15
            const updateToggleAvailability = () => {
                try {
                    if (!window.map || typeof window.map.getZoom !== 'function') return;
                    const z = window.map.getZoom();
                    // Enable toggle when zoom >= 15, otherwise disable and remove buildings
                    if (z >= 15) {
                        buildingsToggle.disabled = false;
                    } else {
                        // If currently enabled, remove buildings because we're too zoomed out
                        if (buildingsToggle.checked) {
                            buildingsToggle.checked = false;
                            removeBuildingsData();
                        }
                        buildingsToggle.disabled = true;
                    }
                } catch (e) { /* ignore */ }
            };

            // Attach zoom handler to update toggle availability
            try {
                if (window._buildingToggleZoomHandler && window.map) {
                    window.map.off('zoomend', window._buildingToggleZoomHandler);
                }
                window._buildingToggleZoomHandler = updateToggleAvailability;
                if (window.map) window.map.on('zoomend', window._buildingToggleZoomHandler);
                // Run once to initialize state
                updateToggleAvailability();
            } catch (e) { /* ignore */ }

            buildingsToggle.addEventListener('change', function(e) {
                buildingsEnabled = e.target.checked;
                console.log('Buildings toggle:', buildingsEnabled);

                if (buildingsEnabled) {
                    // Only fetch buildings if zoom is sufficient and map is available
                    if (!window.map || typeof window.map.getZoom !== 'function') {
                        alert('Map not ready');
                        buildingsToggle.checked = false;
                        buildingsEnabled = false;
                        return;
                    }
                    const z = window.map.getZoom();
                    if (z < 15) {
                        alert('Zoom in to level 15 or more to load buildings.');
                        buildingsToggle.checked = false;
                        buildingsEnabled = false;
                        return;
                    }

                    // Compute current map view bbox (WGS84) and convert to Swiss LV95 for Supabase
                    try {
                        const bounds = window.map.getBounds();
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();
                        // convert to Swiss LV95 if converter available
                        if (typeof window.WGS84ToSwiss === 'function') {
                            const minSwiss = window.WGS84ToSwiss(sw.lng, sw.lat);
                            const maxSwiss = window.WGS84ToSwiss(ne.lng, ne.lat);
                            window.currentBBox = [minSwiss.east, minSwiss.north, maxSwiss.east, maxSwiss.north];
                        } else {
                            window.currentBBox = [sw.lng, sw.lat, ne.lng, ne.lat];
                        }
                        console.log('📦 Set window.currentBBox (from map view) for Supabase:', window.currentBBox);
                    } catch (err) {
                        console.warn('⚠️ Could not compute map bbox for Supabase query', err);
                    }

                    // Trigger the buildings load for the current bbox
                    console.log('Adding buildings layer for current map view...');
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

            // Remove existing buildings layer if present (single variable)
            if (window.buildingsLayer) {
                try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
                window.buildingsLayer = null;
                window.buildingsData = null;
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
                        fillOpacity: 0.8,
                        interactive: true
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
                    try { marker.on('click', function() { this.openPopup(); }); } catch (e) { /* ignore */ }
                    buildingMarkers.push(marker);

                } catch (error) {
                    console.warn(`⚠️ Error processing building ${building.properties?.egid}:`, error);
                }
            });

            // Create layer group and add to map
            if (buildingMarkers.length > 0) {
                window.buildingsLayer = L.layerGroup(buildingMarkers);
                window.buildingsLayer.addTo(window.map);
                
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
        
        // Remove any displayed buildings layer
        if (window.buildingsLayer && window.map) {
            try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
            window.buildingsLayer = null;
            window.buildingsData = null;
            console.log('✅ Buildings layer removed');
        }
        // Also remove any plain building layer reference
        try {
            if (window.buildingsPlainLayer && window.map && window.map.hasLayer(window.buildingsPlainLayer)) {
                window.map.removeLayer(window.buildingsPlainLayer);
            }
            window.buildingsPlainLayer = null;
        } catch (e) { /* ignore */ }
        // Remove any buildings overlay entries from layer control
        try {
            if (window.ctlLayers) removeOverlayByName('🏢 Buildings');
        } catch (e) { /* ignore */ }
        // Remove zoom toggle handler if present
        try {
            if (window._buildingsZoomToggleHandler && window.map) {
                window.map.off('zoomend', window._buildingsZoomToggleHandler);
                window._buildingsZoomToggleHandler = null;
            }
        } catch (e) { /* ignore */ }
    }

    // Single canonical function to add buildings to the map
    // Accepts either a GeoJSON FeatureCollection or an array of Supabase records
    // Helper: remove overlay(s) from layer control by display name
    function removeOverlayByName(name) {
        // Remove any overlay whose name matches or contains the provided name.
        // This helps cleaning up earlier variants like '🏢 Buildings (plain)' or
        // '🏢 Buildings (clustered)' so we only ever keep one buildings overlay.
        if (!window.ctlLayers || !window.ctlLayers._layers) return;
        try {
            Object.keys(window.ctlLayers._layers).forEach(k => {
                const item = window.ctlLayers._layers[k];
                if (!item || !item.name || !item.layer) return;
                try {
                    // Match exact or substring (case-sensitive for emoji/name stability)
                    if (item.name === name || item.name.indexOf(name) === 0 || item.name.includes(name)) {
                        try { window.ctlLayers.removeLayer(item.layer); } catch (e) { /* ignore */ }
                    }
                } catch (e) { /* ignore per-item errors */ }
            });
        } catch (e) { /* ignore */ }
    }

    // Helper to build building popup HTML from properties and optional geometry
    function buildBuildingPopupContent(props = {}, geometry = null) {
        try {
            const priority = ['EGID','GGDENAME','GDEKT','GKAT','GBAUJ','GAREA','GVOL','id','name','address','adresse','egid','gkd','gkode'];
            const used = new Set();
            let html = `<div class="building-popup"><h6><strong>🏢 Building</strong></h6>`;

            for (const key of priority) {
                if (props.hasOwnProperty(key) && props[key] !== null && props[key] !== undefined && props[key] !== '') {
                    const displayKey = key.replace(/_/g,' ');
                    let val = props[key];
                    if (typeof val === 'number') val = val.toLocaleString();
                    html += `<p><strong>${displayKey}:</strong> ${String(val)}</p>`;
                    used.add(key);
                }
            }

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
                html += `<p><strong>${k.replace(/_/g,' ')}:</strong> ${displayVal}</p>`;
            });

            // Coordinates if geometry point
            if (geometry && geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
                const [lng, lat] = geometry.coordinates;
                if (!isNaN(lat) && !isNaN(lng)) html += `<p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>`;
            }

            const raw = JSON.stringify(props || {}, null, 2).replace(/</g,'&lt;').replace(/>/g,'&gt;');
            html += `</div><details style="margin-top:6px;font-size:12px;"><summary style="cursor:pointer;">View full attributes (JSON)</summary><pre style="max-height:200px;overflow:auto;background:#f7f7f7;padding:8px;border-radius:4px;font-size:12px;">${raw}</pre></details>`;
            return html;
        } catch (err) {
            return `<div class="building-popup"><h6><strong>🏢 Building</strong></h6><p>Attributes unavailable</p></div>`;
        }
    }

    window.addBuildingsToMap = async function(data) {
        console.log('🗺️ window.addBuildingsToMap called');
        if (!window.map) { console.error('❌ Map not initialized'); return; }

        // Remove existing buildings layer and any cluster/plain layers and handlers
        if (window.buildingsLayer) {
            try { window.map.removeLayer(window.buildingsLayer); } catch (e) { /* ignore */ }
            window.buildingsLayer = null;
            window.buildingsData = null;
            console.log('🗑️ Existing buildings layer removed');
        }
        // Remove previous plain building layer if present (clusters are not used)
        try {
            if (window.buildingsPlainLayer && window.map && window.map.hasLayer(window.buildingsPlainLayer)) {
                window.map.removeLayer(window.buildingsPlainLayer);
            }
            window.buildingsPlainLayer = null;
        } catch (e) { /* ignore */ }
        // Remove previous zoom handler if set (leftover from cluster/zoom toggle behaviour)
        try {
            if (window._buildingsZoomToggleHandler && window.map) {
                try { window.map.off('zoomend', window._buildingsZoomToggleHandler); } catch(e) {}
            }
            // clear to avoid dangling references
            window._buildingsZoomToggleHandler = null;
        } catch (e) { /* ignore */ }

        // If GeoJSON FeatureCollection
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
            console.log('🔎 Detected GeoJSON FeatureCollection');
            try {
                const layer = L.geoJSON(data, {
                    pointToLayer: function(feature, latlng) {
                        return L.circleMarker(latlng, { radius: 6, fillColor: '#ff7800', color: '#000', weight:1, fillOpacity:0.8, interactive:true });
                    },
                    style: function(feature) { return { color:'#ff7800', weight:2, fillColor:'#ffd580', fillOpacity:0.5 }; },
                    onEachFeature: function(feature, layer) {
                        try {
                            const p = feature.properties || {};
                            const html = buildBuildingPopupContent(p, feature.geometry);
                            layer.bindPopup(html);
                        } catch (e) { layer.bindPopup('<div class="building-popup">Building feature</div>'); }
                    }
                });
                layer.addTo(window.map);
                window.buildingsLayer = layer;
                window.buildingsData = null;
                // Add to layer control so visibility can be toggled (use unified name)
                try {
                    if (window.ctlLayers) {
                        removeOverlayByName('🏢 Buildings');
                        window.ctlLayers.addOverlay(window.buildingsLayer, '🏢 Buildings');
                    }
                } catch (e) { console.warn('⚠️ Could not add buildings layer to layer control', e); }
                console.log(`✅ Added ${data.features.length} custom GeoJSON building features`);
                try { if (layer.getBounds && layer.getBounds().isValid()) window.map.fitBounds(layer.getBounds().pad(0.1)); } catch(e){}
            } catch (err) {
                console.error('❌ Error adding GeoJSON buildings:', err);
                alert('Error adding GeoJSON buildings. See console.');
            }
            return;
        }

        // If array of Supabase records: create a single plain layer (no clustering)
        if (Array.isArray(data)) {
            console.log('🔎 Detected Supabase records array (creating plain markers only)');
            const plainLayer = L.layerGroup();
            const coords = [];
            let added = 0;

            // Chunked rendering for large datasets to keep UI responsive
            const CHUNK_SIZE = 500; // number of records to process per chunk
            const CHUNK_DELAY_MS = 50; // delay between chunks to yield to UI

            const createMarkersForSlice = (slice) => {
                const markers = [];
                slice.forEach(b => {
                    try {
                        if (b.GKODE && b.GKODN) {
                            const conv = (typeof window.swissToWGS84 === 'function') ? window.swissToWGS84 : (typeof swissToWGS84 === 'function' ? swissToWGS84 : null);
                            const w = conv ? conv(b.GKODE, b.GKODN) : null;
                            if (w && !isNaN(w.lat) && !isNaN(w.lng)) {
                                const m = L.circleMarker([w.lat, w.lng], { radius:8, fillColor:'#e49321ff', color:'#0b0b0bff', weight:2, fillOpacity:0.7, interactive:true });
                                
                                // IMPORTANT: Attach building properties as feature so spatial analysis can access them
                                m.feature = {
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: [w.lng, w.lat]
                                    },
                                    properties: b || {}
                                };
                                
                                const props = b || {};
                                const html = buildBuildingPopupContent(props, null);
                                m.bindPopup(html);
                                try { m.on && m.on('click', function(){ this.openPopup(); }); } catch(e){}
                                markers.push(m);
                                coords.push([w.lat, w.lng]);
                                added++;
                            }
                        }
                    } catch(e){ console.warn('⚠️ Error processing record', e); }
                });
                return markers;
            };

            // Process in chunks
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                const slice = data.slice(i, i + CHUNK_SIZE);
                const markers = createMarkersForSlice(slice);
                if (markers.length > 0) {
                    try { markers.forEach(m => plainLayer.addLayer(m)); } catch(e) { markers.forEach(m => plainLayer.addLayer(m)); }
                }
                console.log(`🔁 Rendered ${Math.min(i + CHUNK_SIZE, data.length)} / ${data.length} building records`);
                await new Promise(resolve => setTimeout(resolve, CHUNK_DELAY_MS));
            }

            if (added > 0) {
                plainLayer.addTo(window.map);
                window.buildingsPlainLayer = plainLayer;
                // Canonical buildingsLayer is the plain layer
                window.buildingsLayer = plainLayer;
                window.buildingsData = data;
                try {
                    if (window.ctlLayers) {
                        removeOverlayByName('🏢 Buildings');
                        window.ctlLayers.addOverlay(plainLayer, '🏢 Buildings');
                    }
                } catch (e) { console.warn('⚠️ Could not add Supabase buildings layer to layer control', e); }
                console.log(`✅ Added ${added} Supabase building markers (chunked, plain)`);
                try {
                    if (plainLayer && typeof plainLayer.getLayers === 'function' && plainLayer.getLayers().length > 0) {
                        const g = new L.featureGroup(plainLayer.getLayers());
                        window.map.fitBounds(g.getBounds().pad(0.1));
                    } else if (coords.length === 1) {
                        window.map.setView(coords[0], 15);
                    }
                } catch(e){}
            } else {
                console.warn('⚠️ No valid Supabase building markers created');
                alert('No valid building markers created');
            }
            return;
        }

        console.error('❌ addBuildingsToMap received unsupported data type');
    };
    
    // Vulnerability controls functionality
    function initializeVulnerabilityControls() {
        const showCurvesBtn = document.getElementById('show-curves-btn');
        
        if (showCurvesBtn) {
            showCurvesBtn.addEventListener('click', function() {
                console.log('Show vulnerability curves clicked');
                // Implement vulnerability curves display
                //alert('Vulnerability curves will be displayed here');
            });
        }
    }
    
    // Analysis controls functionality
    function initializeAnalysisControls() {
        const runAnalysisBtn = document.getElementById('run-analysis-btn');
        const showResultsBtn = document.getElementById('show-results-btn');
        
        // Initialize show results button as disabled
        if (showResultsBtn) {
            showResultsBtn.disabled = true;
        }
        
        if (runAnalysisBtn) {
            runAnalysisBtn.addEventListener('click', async function() {
                console.log('🎯 Run analysis clicked - starting spatial analysis with Turf.js...');
                
                try {
                    // Check if Turf.js is available
                    if (typeof turf === 'undefined') {
                        alert('❌ Turf.js library not available. Please refresh the page and try again.');
                        return;
                    }
                    
                    // Check if we have all required data
                    if (!window.drawnPolygon) {
                        alert('⚠️ Please draw a polygon on the map first.');
                        return;
                    }
                    
                    if (!window.buildingsLayer) {
                        alert('⚠️ Buildings layer not available. Please ensure buildings are loaded on the map.');
                        return;
                    }
                    
                    if (!window.hazardLayer) {
                        alert('⚠️ Hazard layer not available. Please ensure a hazard is selected and displayed.');
                        return;
                    }
                    
                    // Disable button during analysis
                    runAnalysisBtn.disabled = true;
                    runAnalysisBtn.textContent = 'Running Step 1 Analysis...';
                    
                    console.log('📊 Starting Step 1: Extract data inside polygon with Turf.js:');
                    console.log('  - Polygon:', window.drawnPolygon);
                    console.log('  - Buildings layer:', window.buildingsLayer);
                    console.log('  - Hazard layer:', window.hazardLayer);
                    console.log('  - Selected hazard:', window.selectedHazard);
                    
                    // Perform Step 1: Extract data inside polygon
                    const extractionResults = await window.extractDataInsidePolygon(
                        window.drawnPolygon,
                        window.buildingsLayer,
                        window.hazardLayer
                    );
                    
                    console.log('✅ Step 1 extraction completed:', extractionResults);
                    
                    // Store results globally for next steps
                    window.latestExtractionResults = extractionResults;
                    
                    // Enable the show results button
                    if (showResultsBtn) {
                        showResultsBtn.disabled = false;
                        console.log('✅ Show results button enabled');
                    }
                    
                } catch (error) {
                    console.error('❌ Spatial analysis failed:', error);
                    alert(`❌ Analysis failed: ${error.message}\n\nPlease check the console for details.`);
                } finally {
                    // Re-enable button and restore text
                    runAnalysisBtn.disabled = false;
                    runAnalysisBtn.textContent = 'Run Analysis';
                }
            });
        }
        
        if (showResultsBtn) {
            showResultsBtn.addEventListener('click', function() {
                console.log('📊 Show results clicked');
                
                // Check if we have latest extraction results
                if (!window.latestExtractionResults) {
                    alert('⚠️ No analysis results available. Please run an analysis first.');
                    return;
                }
                
                // Show the analysis results modal
                showAnalysisResultsModal(window.latestExtractionResults);
            });
        }
    }
    
    // Function to show the analysis results modal
    function showAnalysisResultsModal(extractionResults) {
        console.log('📊 Showing analysis results modal with data:', extractionResults);
        
        const modal = document.getElementById('analysis-results-modal');
        if (!modal) {
            console.error('❌ Analysis results modal not found');
            return;
        }
        
        // Populate summary statistics
        populateAnalysisSummary(extractionResults);
        
        // Create AG Grid table with buildings analyzed data
        createAnalysisAGGridTable(extractionResults.buildingsAnalyzed);
        
        // Show the modal
        modal.style.display = 'block';
        
        // Set up close button handler (remove previous handlers first)
        const closeBtn = document.getElementById('close-analysis-results-modal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
            };
        }
        
        // Close modal when clicking outside
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    // Function to populate analysis summary
    function populateAnalysisSummary(extractionResults) {
        const summaryContent = document.getElementById('analysis-summary-content');
        if (!summaryContent) return;
        
        const buildingsInside = extractionResults.buildingsInside || [];
        const buildingsAnalyzed = extractionResults.buildingsAnalyzed || [];
        const hazardsInside = extractionResults.hazardsInside || [];
        
        // Calculate statistics
        const totalBuildings = buildingsInside.length;
        const buildingsWithHazard = buildingsAnalyzed.length;
        const buildingsNoHazard = totalBuildings - buildingsWithHazard;
        const hazardCoverage = totalBuildings > 0 ? ((buildingsWithHazard / totalBuildings) * 100).toFixed(1) : 0;
        
        // Count by intensity
        const intensityCount = {};
        buildingsAnalyzed.forEach(building => {
            const intensity = building.intensity || 'Unknown';
            intensityCount[intensity] = (intensityCount[intensity] || 0) + 1;
        });
        
        // Create summary HTML
        const summaryHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h5>📊 Basic Statistics</h5>
                    <p><strong>Total Buildings in Polygon:</strong> ${totalBuildings}</p>
                    <p><strong>Buildings with Hazard Exposure:</strong> ${buildingsWithHazard}</p>
                    <p><strong>Buildings with No Hazard:</strong> ${buildingsNoHazard}</p>
                    <p><strong>Hazard Coverage:</strong> ${hazardCoverage}%</p>
                    <p><strong>Total Hazard Features:</strong> ${hazardsInside.length}</p>
                </div>
                <div class="col-md-6">
                    <h5>🚨 Intensity Distribution</h5>
                    ${Object.keys(intensityCount).map(intensity => 
                        `<p><strong>${intensity}:</strong> ${intensityCount[intensity]} buildings</p>`
                    ).join('')}
                </div>
            </div>
            <div class="mt-3">
                <small class="text-muted">
                    Analysis completed: ${new Date().toLocaleString()} | 
                    Selected hazard: ${window.selectedHazard || 'Unknown'}
                </small>
            </div>
        `;
        
        summaryContent.innerHTML = summaryHTML;
    }
    
    // Function to create AG Grid table with buildings analyzed data
    function createAnalysisAGGridTable(buildingsAnalyzed) {
        console.log('📊 Creating AG Grid table with buildings analyzed data (Updated version - no deprecated props):', buildingsAnalyzed);
        
        const gridContainer = document.getElementById('analysis-ag-grid');
        if (!gridContainer) {
            console.error('❌ AG Grid container not found');
            return;
        }
        
        // Clear any existing grid
        gridContainer.innerHTML = '';
        
        if (!buildingsAnalyzed || buildingsAnalyzed.length === 0) {
            gridContainer.innerHTML = 
                '<div class="text-center p-4"><h5>No buildings with hazard intersections found</h5></div>';
            return;
        }
        
        // Prepare row data for AG Grid
        const rowData = buildingsAnalyzed.map((building, index) => ({
            index: index + 1,
            egid: building.buildingProperties?.EGID || 'N/A',
            buildingName: building.buildingProperties?.GGDENAME || 'N/A',
            canton: building.buildingProperties?.GDEKT || 'N/A',
            category: building.buildingProperties?.GKAT || 'N/A',
            constructionYear: building.buildingProperties?.GBAUJ || 'N/A',
            area: building.buildingProperties?.GAREA || 'N/A',
            volume: building.buildingProperties?.GVOL || 'N/A',
            apartments: building.buildingProperties?.GANZWHG || 'N/A',
            hazardType: building.hazardType || 'N/A',
            hazardIntensity: building.intensity || 'None',
            hazardRecurrence: building.recurrence || 'None',
            originalBuildingId: building.originalBuildingId || 'N/A'
        }));
        
        // Define column definitions
        const columnDefs = [
            {
                headerName: 'Index',
                field: 'index',
                width: 80,
                cellStyle: { fontWeight: 'bold' }
            },
            {
                headerName: 'EGID',
                field: 'egid',
                width: 120,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Building Name',
                field: 'buildingName',
                width: 150,
                filter: 'agTextColumnFilter',
                tooltipField: 'buildingName'
            },
            {
                headerName: 'Canton',
                field: 'canton',
                width: 100,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Category',
                field: 'category',
                width: 120,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Construction Year',
                field: 'constructionYear',
                width: 140,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Area (m²)',
                field: 'area',
                width: 120,
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toLocaleString() : 'N/A'
            },
            {
                headerName: 'Volume (m³)',
                field: 'volume',
                width: 130,
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toLocaleString() : 'N/A'
            },
            {
                headerName: 'Apartments',
                field: 'apartments',
                width: 110,
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Hazard Type',
                field: 'hazardType',
                width: 120,
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff3cd' }
            },
            {
                headerName: 'Hazard Intensity',
                field: 'hazardIntensity',
                width: 130,
                filter: 'agTextColumnFilter',
                cellStyle: params => {
                    const intensity = params.value?.toLowerCase();
                    if (intensity?.includes('forte') || intensity?.includes('high')) {
                        return { backgroundColor: '#f8d7da', fontWeight: 'bold' };
                    } else if (intensity?.includes('moyenne') || intensity?.includes('medium')) {
                        return { backgroundColor: '#fff3cd', fontWeight: 'bold' };
                    } else if (intensity?.includes('faible') || intensity?.includes('low')) {
                        return { backgroundColor: '#d1edff', fontWeight: 'bold' };
                    }
                    return { backgroundColor: '#f8f9fa' };
                }
            },
            {
                headerName: 'Hazard Recurrence',
                field: 'hazardRecurrence',
                width: 140,
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff3cd' }
            },
            {
                headerName: 'Original Building ID',
                field: 'originalBuildingId',
                width: 160,
                filter: 'agTextColumnFilter'
            }
        ];
        
        // Grid options
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            defaultColDef: {
                sortable: true,
                resizable: true,
                filter: true,
                floatingFilter: true
            },
            pagination: true,
            paginationPageSize: 50,
            rowSelection: {
                mode: 'multiRow',
                enableClickSelection: true
            },
            animateRows: true,
            getRowStyle: params => {
                if (params.node.rowIndex % 2 === 0) {
                    return { backgroundColor: '#f8f9fa' };
                }
                return { backgroundColor: '#ffffff' };
            },
            onGridReady: function(params) {
                console.log('✅ AG Grid ready with', rowData.length, 'rows');
                // Auto-size columns to fit content
                params.api.sizeColumnsToFit();
            }
        };
        
        // Create the grid
        try {
            // Use the correct AG Grid API
            agGrid.createGrid(gridContainer, gridOptions);
            console.log('✅ AG Grid table created successfully');
        } catch (error) {
            console.error('❌ Error creating AG Grid table:', error);
            gridContainer.innerHTML = 
                '<div class="text-center p-4 text-danger"><h5>Error creating table visualization</h5><p>' + error.message + '</p></div>';
        }
    }
    
    // Function to display detailed analysis results
    function displayAnalysisResults(results) {
        console.log('📊 Displaying analysis results:', results);
        
        if (!results || !results.success) {
            alert('❌ Invalid analysis results');
            return;
        }
        
        const summary = results.summary;
        const buildingsAnalyzed = results.buildingsAnalyzed;
        const hazardType = results.hazardType;
        
        // Create detailed results message
        let resultsMessage = `🎯 SPATIAL ANALYSIS RESULTS (Turf.js)\n`;
        resultsMessage += `═══════════════════════════════════════\n\n`;
        resultsMessage += `📊 SUMMARY STATISTICS:\n`;
        resultsMessage += `• Total buildings analyzed: ${summary.totalBuildings}\n`;
        resultsMessage += `• Buildings with hazard exposure: ${summary.buildingsWithHazard}\n`;
        resultsMessage += `• Buildings with no hazard exposure: ${summary.buildingsNoHazard}\n`;
        resultsMessage += `• Hazard coverage: ${summary.hazardCoverage}%\n`;
        resultsMessage += `• Hazard type: ${hazardType}\n\n`;
        
        resultsMessage += `🚨 RISK DISTRIBUTION:\n`;
        resultsMessage += `• Very High Risk: ${summary.riskDistribution.very_high} buildings\n`;
        resultsMessage += `• High Risk: ${summary.riskDistribution.high} buildings\n`;
        resultsMessage += `• Medium Risk: ${summary.riskDistribution.medium} buildings\n`;
        resultsMessage += `• Low Risk: ${summary.riskDistribution.low} buildings\n`;
        resultsMessage += `• Unknown Risk: ${summary.riskDistribution.unknown} buildings\n\n`;
        
        resultsMessage += `📅 Analysis completed: ${new Date(results.timestamp).toLocaleString()}\n\n`;
        
        // Show limited number of detailed building results
        const maxDetails = 5;
        if (buildingsAnalyzed.length > 0) {
            resultsMessage += `🏢 SAMPLE BUILDING DETAILS (showing ${Math.min(maxDetails, buildingsAnalyzed.length)} of ${buildingsAnalyzed.length}):\n`;
            resultsMessage += `─────────────────────────────\n`;
            
            for (let i = 0; i < Math.min(maxDetails, buildingsAnalyzed.length); i++) {
                const building = buildingsAnalyzed[i];
                const hazardInfo = building.hazardInfo;
                
                resultsMessage += `Building ${i + 1}:\n`;
                resultsMessage += `  • ID: ${building.building.id}\n`;
                resultsMessage += `  • Risk Level: ${hazardInfo.riskLevel}\n`;
                
                if (hazardInfo.recurrence) {
                    resultsMessage += `  • Recurrence Period: ${hazardInfo.recurrence}\n`;
                }
                if (hazardInfo.intensity) {
                    resultsMessage += `  • Intensity: ${hazardInfo.intensity}\n`;
                }
                
                resultsMessage += `  • Hazard Overlaps: ${building.overlappingHazards.length}\n\n`;
            }
            
            if (buildingsAnalyzed.length > maxDetails) {
                resultsMessage += `... and ${buildingsAnalyzed.length - maxDetails} more buildings\n`;
            }
        }
        
        // Display results in a scrollable alert/modal
        alert(resultsMessage);
        
        // Also log detailed results to console for developers
        console.log('📋 Complete analysis results:', results);
        console.log('🏢 Building details:', buildingsAnalyzed);
        
        // Optionally highlight analyzed buildings on map
        highlightAnalyzedBuildings(buildingsAnalyzed);
    }
    
    // Function to highlight analyzed buildings on the map
    function highlightAnalyzedBuildings(analyzedBuildings) {
        if (!window.map || !analyzedBuildings || analyzedBuildings.length === 0) {
            return;
        }
        
        console.log('🎨 Highlighting analyzed buildings on map...');
        
        // Remove any existing highlight layer
        if (window.analysisHighlightLayer) {
            window.map.removeLayer(window.analysisHighlightLayer);
        }
        
        // Create new layer group for highlights
        window.analysisHighlightLayer = L.layerGroup();
        
        analyzedBuildings.forEach((buildingAnalysis, index) => {
            const building = buildingAnalysis.building;
            const riskLevel = buildingAnalysis.hazardInfo.riskLevel;
            
            if (building.latLng) {
                // Define colors for risk levels
                const riskColors = {
                    'very_high': '#FF0000',  // Red
                    'high': '#FF8C00',       // Orange
                    'medium': '#FFD700',     // Gold
                    'low': '#90EE90',        // Light Green
                    'unknown': '#808080'     // Gray
                };
                
                const color = riskColors[riskLevel] || '#808080';
                
                // Create a circle marker for each building
                const marker = L.circleMarker(building.latLng, {
                    radius: 8,
                    fillColor: color,
                    color: '#000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                
                // Add popup with building information
                marker.bindPopup(`
                    <div>
                        <h6>Building Analysis Result</h6>
                        <strong>Building ID:</strong> ${building.id}<br>
                        <strong>Risk Level:</strong> ${riskLevel}<br>
                        <strong>Recurrence:</strong> ${buildingAnalysis.hazardInfo.recurrence || 'N/A'}<br>
                        <strong>Intensity:</strong> ${buildingAnalysis.hazardInfo.intensity || 'N/A'}<br>
                        <strong>Hazard Overlaps:</strong> ${buildingAnalysis.overlappingHazards.length}
                    </div>
                `);
                
                window.analysisHighlightLayer.addLayer(marker);
            }
        });
        
        // Add highlight layer to map
        window.map.addLayer(window.analysisHighlightLayer);
        
        console.log(`✅ Highlighted ${analyzedBuildings.length} analyzed buildings`);
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
        // const cantons = ['Aargau','Appenzell Ausserrhoden','Appenzell Innerrhoden','Basel-Landschaft',
        //     'Basel-Stadt','Bern','Fribourg','Genève','Glarus','Graubünden','Jura','Luzern',
        //     'Neuchâtel','Nidwalden','Obwalden','Schaffhausen','Schwyz','Solothurn','St. Gallen',
        //     'Thurgau','Ticino','Uri','Valais','Vaud','Zug','Zürich'].sort(); // Sort alphabetically 
        
        const cantons = ['Graubünden','Ticino','Valais'].sort(); // Sort alphabetically 
    
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

// === Unified hazard handling ===
// Canonical hazard layer stored on window.hazardLayer
window.hazardLayer = window.hazardLayer || null;

// Helper: remove overlay(s) from layer control by display name (global)
function removeOverlayByName(name) {
    if (!window.ctlLayers || !window.ctlLayers._layers) return;
    try {
        Object.keys(window.ctlLayers._layers).forEach(k => {
            const item = window.ctlLayers._layers[k];
            if (item && item.name === name && item.layer) {
                try { window.ctlLayers.removeLayer(item.layer); } catch (e) { /* ignore */ }
            }
        });
    } catch (e) { /* ignore */ }
}

function addHazardToMap(geojson, hazardType = 'hazard') {
    // Normalize hazardType to a consistent token (accept 'debris-flow' or 'debris_flow')
    if (typeof hazardType === 'string') hazardType = hazardType.replace(/-/g, '_');
    console.log(`🪨 addHazardToMap called (normalized type=${hazardType})`);
    if (!geojson || !geojson.type) {
        console.error('❌ Invalid GeoJSON passed to addHazardToMap');
        return;
    }

    // Debug: log a sample feature to help troubleshooting uploads
    try {
        const sample = Array.isArray(geojson.features) && geojson.features.length > 0 ? geojson.features[0] : null;
        if (sample && sample.geometry && Array.isArray(sample.geometry.coordinates)) {
            console.log('📐 Sample feature geometry type:', sample.geometry.type);
            const coords = (Array.isArray(sample.geometry.coordinates[0]) ? sample.geometry.coordinates[0] : sample.geometry.coordinates);
            if (Array.isArray(coords) && coords.length >= 2) console.log('📍 Sample coordinate (first):', coords[0], coords[1]);
        }
        // Debug: log first few properties to inspect which fields are present (helps diagnose invisible styling)
        if (Array.isArray(geojson.features) && geojson.features.length > 0) {
            try {
                const propsPreview = geojson.features.slice(0, 5).map(f => f.properties || {});
                console.log('🧾 First features properties preview:', propsPreview);
            } catch (e) { /* ignore */ }
        }
    } catch (e) { /* ignore debug errors */ }

    // Remove any existing hazard layer first
    if (window.hazardLayer && window.map) {
        try { window.map.removeLayer(window.hazardLayer); } catch(e) { /* ignore */ }
        try { if (window.ctlLayers) window.ctlLayers.removeLayer(window.hazardLayer); } catch(e) { /* ignore */ }
        window.hazardLayer = null;
    }

    // Create layer with per-hazard styling and popups
    // Helper to build popup content dynamically from feature properties
    function buildPopupContent(props = {}, feature) {
        try {
            const lines = [];
            const title = (hazardType === 'rockfall') ? '🪨 Chute de pierres / Rockfall' : (hazardType === 'debris_flow') ? '🌊 Debris flow' : '🪨 Hazard';

            // Priority fields per hazard type (try to show most relevant info first)
            const priority = [];
            if (hazardType === 'rockfall') {
                priority.push('classe_d_intensites','intensity_','intensity','subproc_sy','canton','commentaire','designation_cantonale_du_processus','evenement_extreme','proprietaire_des_donnees','t_id');
            } else if (hazardType === 'debris_flow') {
                priority.push('intensity_','intensity','return_per','subproc_sy','canton','comments','t_id');
            } else {
                priority.push('t_id','id','name','subproc_sy','canton');
            }

            const used = new Set();
            // Add priority fields if present
            for (const key of priority) {
                if (props.hasOwnProperty(key) && props[key] !== null && props[key] !== undefined && props[key] !== '') {
                    lines.push(`<p><strong>${key.replace(/_/g,' ')}:</strong> ${String(props[key])}</p>`);
                    used.add(key);
                }
            }

            // Add all remaining properties
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
                // Truncate long values for readability
                if (displayVal.length > 300) displayVal = displayVal.slice(0,300) + '…';
                lines.push(`<p><strong>${k.replace(/_/g,' ')}:</strong> ${displayVal}</p>`);
            });

            // Add coordinates for point geometries
            if (feature && feature.geometry && feature.geometry.type === 'Point' && Array.isArray(feature.geometry.coordinates)) {
                const [lng, lat] = feature.geometry.coordinates;
                if (!isNaN(lat) && !isNaN(lng)) {
                    lines.unshift(`<p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>`);
                }
            }

            const content = `
                <div style="font-size:12px;">
                    <h4>${title}</h4>
                    ${lines.join('\n')}
                </div>`;
            return content;
        } catch (err) {
            return `<div style="font-size:12px;"><h4>🪨 Hazard</h4><p>Feature data available</p></div>`;
        }
    }

    const layer = L.geoJSON(geojson, {
        style: function(feature) {
            try {
                const props = feature.properties || {};
                if (hazardType === 'rockfall') {
                    // Use classe_d_intensites for rockfall styling
                    let intensityRaw = props.classe_d_intensites;
                    if (typeof intensityRaw !== 'string') intensityRaw = '';
                    const intensity = intensityRaw.trim().toLowerCase();
                    let color, fillOpacity;
                    switch(intensity) {
                        case 'forte':
                            color = '#d73027'; fillOpacity = 0.8; break;
                        case 'moyenne':
                            color = '#fcf11bff'; fillOpacity = 0.6; break;
                        case 'faible':
                            color = '#4575b4'; fillOpacity = 0.4; break;
                        default:
                            color = '#999999'; fillOpacity = 0.0; // hide/transparent
                    }
                    return { color: color, weight: 1, opacity: fillOpacity > 0 ? 1 : 0, fillColor: color, fillOpacity: fillOpacity };
                } else if (hazardType === 'debris_flow') {
                    // More robust symbology for debris flow:
                    // 1) Try a set of likely property names for intensity / probability / return period
                    // 2) Map known textual categories to colors
                    // 3) If unknown, produce a deterministic color per feature so all features are visible
                    function findIntensityValue(properties) {
                        if (!properties) return null;
                        const keysToTry = [
                            'classe_d_intensites','intensity_','intensity','return_per','return_period','probabilite','probability','prob','epaisseur','niveau','level','category'
                        ];
                        for (const k of keysToTry) {
                            if (properties.hasOwnProperty(k) && properties[k] !== null && properties[k] !== undefined && properties[k] !== '') {
                                return { key: k, val: properties[k] };
                            }
                        }
                        // fallback: try to find any property that looks like an intensity number or small string
                        for (const k of Object.keys(properties)) {
                            const v = properties[k];
                            if (typeof v === 'number') return { key: k, val: v };
                            if (typeof v === 'string' && v.length > 0 && v.length < 40 && /[a-zA-Z0-9]/.test(v)) return { key: k, val: v };
                        }
                        return null;
                    }

                    const found = findIntensityValue(props);
                    let color = '#999999';
                    let fillOpacity = 0.45;
                    if (found) {
                        let v = found.val;
                        if (typeof v === 'number') {
                            // numerical mapping (example thresholds) - adjust if you know exact ranges
                            if (v >= 0.66) { color = '#d73027'; fillOpacity = 0.8; }
                            else if (v >= 0.33) { color = '#fcf11bff'; fillOpacity = 0.6; }
                            else { color = '#4575b4'; fillOpacity = 0.4; }
                        } else {
                            // string mapping
                            const s = String(v).trim().toLowerCase();
                            if (s.match(/forte|high|élevé|eleve|elev/)) { color = '#d73027'; fillOpacity = 0.8; }
                            else if (s.match(/moyenne|mean|moyen|moderate/)) { color = '#fcf11bff'; fillOpacity = 0.6; }
                            else if (s.match(/faible|low|faibl/)) { color = '#4575b4'; fillOpacity = 0.4; }
                            else {
                                // unknown string -> deterministic color by hashing string
                                const str = s || (found.key + '::' + JSON.stringify(v));
                                let h = 0;
                                for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
                                const hue = Math.abs(h) % 360;
                                color = `hsl(${hue},70%,45%)`;
                                fillOpacity = 0.55;
                            }
                        }
                    } else {
                        // no useful property found: deterministic color per-feature based on properties content
                        const str = JSON.stringify(props || {}) || Math.random().toString();
                        let h = 0;
                        for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
                        const hue = Math.abs(h) % 360;
                        color = `hsl(${hue},65%,50%)`;
                        fillOpacity = 0.5;
                    }
                    return { color: color, weight: 1, opacity: 1, fillColor: color, fillOpacity: fillOpacity };
                }
            } catch (e) {
                // fallback
            }
            return { color: '#d95f02', weight: 1, opacity: 1, fillColor: '#fec44f', fillOpacity: 0.5 };
        },
        onEachFeature: function(feature, lyr) {
            try {
                const props = feature.properties || {};
                const popupContent = buildPopupContent(props, feature);
                lyr.bindPopup(popupContent);
            } catch (e) {
                try { lyr.bindPopup('<div style="font-size:12px;">Hazard feature</div>'); } catch(ignore) {}
            }
        }
    });

    // Add to map and make canonical
    if (window.map) {
        layer.addTo(window.map);
        window.hazardLayer = layer;
        // register overlay in layer control (create control if it doesn't exist)
        try {
            if (!window.ctlLayers && window.map) {
                // create a basic layer control using existing baseLayers if available
                window.ctlLayers = L.control.layers(window.baseLayers || {}, {}).addTo(window.map);
            }
            if (window.ctlLayers) {
                removeOverlayByName('🪨 Hazard');
                window.ctlLayers.addOverlay(window.hazardLayer, '🪨 Hazard');
            }
        } catch(e) {
            console.warn('⚠️ Failed to register hazard overlay in layer control', e);
        }

        // try to fit bounds
        try {
            if (window.hazardLayer.getBounds && window.hazardLayer.getBounds().isValid()) {
                window.map.fitBounds(window.hazardLayer.getBounds());
            }
        } catch(e) { /* ignore */ }

        try {
            if (window.hazardLayer.bringToFront) window.hazardLayer.bringToFront();
            console.log('🌐 Hazard layer bounds:', window.hazardLayer.getBounds ? window.hazardLayer.getBounds() : null);
        } catch(e) { /* ignore */ }

        console.log('✅ Hazard layer added and registered as window.hazardLayer');
    } else {
        console.error('❌ Map not available when adding hazard');
    }
}

function removeHazardFromMap() {
    if (window.hazardLayer && window.map) {
        try { window.map.removeLayer(window.hazardLayer); } catch(e) { /* ignore */ }
        try { if (window.ctlLayers) window.ctlLayers.removeLayer(window.hazardLayer); } catch(e) { /* ignore */ }
        window.hazardLayer = null;
        console.log('🗑️ Hazard layer removed');
    }
}

// Debris flow wrappers removed — use fetchAndDisplayHazardLayer(...) and removeHazardFromMap() directly

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
// ==================== HAZARD API FETCH & DISPLAY ====================
/**
 * Fetch hazard data from 3 API URLs (rockfall or debris flow) and display on map
 * @param {string} hazardType - 'rockfall' or 'debris-flow'
 * @param {Array} bbox - [minLng, minLat, maxLng, maxLat] in WGS84
 */
async function fetchAndDisplayHazardLayer(hazardType, bbox) {
    if (!window.map) {
        console.error('❌ Map not available');
        return;
    }
    // Remove previous hazard layer (use canonical remover)
    removeHazardFromMap();

    // If the data source selector is set to custom, prefer custom uploaded hazard
    try {
        const dataSourceSelect = document.getElementById('data-source-select');
        const selectedSource = dataSourceSelect ? dataSourceSelect.value : null;
        if (selectedSource === 'custom') {
            console.log('ℹ️ Data source set to custom — trying to use uploaded hazard (window.hazardLayer)');
            if (window.hazardLayer) {
                try {
                    // If the hazardLayer has GeoJSON, try to extract it
                    let geo = null;
                    if (typeof window.hazardLayer.toGeoJSON === 'function') {
                        geo = window.hazardLayer.toGeoJSON();
                    } else if (window.hazardLayer instanceof L.FeatureGroup && window.hazardLayer.getLayers) {
                        const merged = { type: 'FeatureCollection', features: [] };
                        window.hazardLayer.getLayers().forEach(l => {
                            try { merged.features.push(l.toGeoJSON()); } catch(e) { /* ignore */ }
                        });
                        geo = merged;
                    }
                    if (geo && geo.features && geo.features.length > 0) {
                        addHazardToMap(geo, hazardType === 'debris-flow' ? 'debris_flow' : hazardType);
                        return;
                    }
                } catch (e) {
                    console.warn('⚠️ Could not extract GeoJSON from window.hazardLayer, falling back to API', e);
                }
            }
            // If we reach here there is no usable custom hazard — fall back to API
        }
    } catch (e) { console.warn('⚠️ Error checking data-source-select, falling back to API', e); }

    // Normalize hazardType so callers can pass either 'debris-flow' or 'debris_flow'
    let hazardToken = (typeof hazardType === 'string') ? hazardType.replace(/_/g, '-').toLowerCase() : String(hazardType);
    console.log('🔍 fetchAndDisplayHazardLayer received hazardType:', hazardType, 'normalized to:', hazardToken);

    // Build API URLs
    const bboxStr = Array.isArray(bbox) ? bbox.join(',') : bbox;
    let urls;
    if (hazardToken === 'rockfall') {
        urls = [
            `https://www.geodienste.ch/db/gefahrenkarten_v1_3_0/fra/ogcapi/collections/intensite_chute_recurrence_de_0_a_30_ans/items?f=json&limit=1000&bbox=${bboxStr}`,
            `https://www.geodienste.ch/db/gefahrenkarten_v1_3_0/fra/ogcapi/collections/intensite_chute_recurrence_de_100_a_300_ans/items?f=json&limit=1000&bbox=${bboxStr}`,
            `https://www.geodienste.ch/db/gefahrenkarten_v1_3_0/fra/ogcapi/collections/intensite_chute_recurrence_de_30_a_100_ans/items?f=json&limit=1000&bbox=${bboxStr}`
        ];
    } else if (hazardToken === 'debris-flow') {
        // Use the epaisseur_du_debordement_de_lave_torrentielle collection for debris-flow
        // Match the URL format you indicated (offset & limit parameters)
        urls = [
            `https://www.geodienste.ch/db/gefahrenkarten_v1_3_0/fra/ogcapi/collections/epaisseur_du_debordement_de_lave_torrentielle/items?f=json&offset=0&limit=20&bbox=${bboxStr}`
        ];
    } else {
        console.warn('⚠️ Unknown hazard type for API fetch:', hazardType, 'normalized:', hazardToken);
        return;
    }
    console.log('🔎 Hazard API debug info:');
    console.log('  Hazard type:', hazardType);
    console.log('  BBOX:', bboxStr);
    urls.forEach((url, i) => console.log(`  API URL ${i + 1}:`, url));
    try {
        const responses = await Promise.all(urls.map(async (url, idx) => {
            const resp = await fetch(url);
            console.log(`  [API ${idx + 1}] Status:`, resp.status, resp.statusText);
            if (!resp.ok) {
                console.warn(`  [API ${idx + 1}] Response not OK:`, url);
                return null;
            }
            const json = await resp.json();
            console.log(`  [API ${idx + 1}] Features:`, json.features ? json.features.length : 'No features');
            return json;
        }));
        const allFeatures = responses
            .filter(j => j && j.features)
            .flatMap(j => j.features);
        console.log('  Total combined features:', allFeatures.length);
        if (allFeatures.length === 0) {
            alert('No hazard features found in the combined GeoJSON data.');
            return;
        }
        // Debug log for classe_d_intensites for API-fetched rockfall features
        if (hazardType === 'rockfall' && Array.isArray(allFeatures)) {
            allFeatures.forEach(f => {
                let raw = f.properties.classe_d_intensites;
                if (typeof raw !== 'string') raw = '';
                const norm = raw.trim().toLowerCase();
                // console.log('Rockfall feature intensity:', raw, '->', norm);
            });
        }
        const combinedGeoJSON = {
            type: "FeatureCollection",
            features: allFeatures
        };
    // Delegate to unified adder so styling/overlay registration is consistent
    // Convert normalized token back to the form expected by addHazardToMap (debris_flow)
    const addType = (hazardToken === 'debris-flow') ? 'debris_flow' : hazardToken;
    addHazardToMap(combinedGeoJSON, addType);
        console.log(`✅ Hazard layer (${hazardType}) added with ${allFeatures.length} features.`);
    } catch (error) {
        console.error('Error fetching combined GeoJSON:', error);
        alert('Failed to fetch combined GeoJSON data.');
    }
}
// ==================== WGS84 TO SWISS LV95 COORDINATE TRANSFORMATION ====================
/**
 * Convert WGS84 (longitude, latitude) to Swiss LV95 (east, north)
 * @param {number} lng - Longitude (WGS84)
 * @param {number} lat - Latitude (WGS84)
 * @returns {{east: number, north: number}} - Swiss LV95 coordinates
 */
function WGS84ToSwiss(lng, lat) {
    // Convert decimal degrees to sexagesimal seconds
    function degToSec(angle) {
        return angle * 3600.0;
    }
    // Reference point (Bern)
    const lng0 = 7.439583333; // Bern longitude
    const lat0 = 46.952405555; // Bern latitude
    // Convert input to sexagesimal seconds
    const L = degToSec(lng);
    const B = degToSec(lat);
    const L0 = degToSec(lng0);
    const B0 = degToSec(lat0);
    // Auxiliary values
    const l = (L - L0) / 10000.0;
    const b = (B - B0) / 10000.0;
    // Swiss LV03 formulas
    let east = 600072.37 + 211455.93 * l - 10938.51 * l * b - 0.36 * l * b * b - 44.54 * l * l * l;
    let north = 200147.07 + 308807.95 * b + 3745.25 * l * l + 76.63 * b * b - 194.56 * l * l * b + 119.79 * b * b * b;
    // Convert to LV95 by adding offsets
    east = east + 2000000;
    north = north + 1000000;
    return { east, north };
}
window.WGS84ToSwiss = WGS84ToSwiss;
function initializeDrawFunctionality() {
    console.log('🎨 Initializing Leaflet Draw functionality...');
    
    // Wait for map to be ready
    if (!window.map || !window.drawControl) {
        console.warn('⚠️ Map or draw control not ready, retrying...');
        setTimeout(initializeDrawFunctionality, 500);
        return;
    }
    
    // Add draw event handlers
    window.map.on('draw:created', async function (e) {
        console.log('🖌️ draw:created event fired');
        const type = e.layerType;
        const layer = e.layer;
        console.log('🖌️ Shape type:', type);

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

            // Get bounds and set bbox in Swiss coordinates
            const bounds = layer.getBounds();
            if (bounds) {
                console.log('bound: ', bounds);
                // Always convert bounds to Swiss LV95 coordinates for Supabase query
                if (typeof window.WGS84ToSwiss === 'function') {
                    const sw = bounds.getSouthWest();
                    const ne = bounds.getNorthEast();
                    const minSwiss = window.WGS84ToSwiss(sw.lng, sw.lat);
                    const maxSwiss = window.WGS84ToSwiss(ne.lng, ne.lat);
                    window.currentBBox = [minSwiss.east, minSwiss.north, maxSwiss.east, maxSwiss.north];
                    console.log('📦 Set window.currentBBox (Swiss, for Supabase):', window.currentBBox);
                } else {
                    window.currentBBox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
                    console.warn('⚠️ WGS84ToSwiss not available, using WGS84 bbox (may not work for Supabase):', window.currentBBox);
                }
            }

            // Instead of fetching new data, use existing buildings and hazard layers for spatial analysis
            console.log('� Preparing for spatial analysis with existing layers...');
            
            // Check if we have the required data for analysis
            if (!window.buildingsData) {
                console.warn('⚠️ No buildings data available. Please ensure buildings are loaded on the map.');
                return;
            }
            
            if (!window.hazardLayer) {
                console.warn('⚠️ No hazard layer available. Please ensure a hazard is selected and displayed.');
                return;
            }
            
            console.log('✅ Required data available for spatial analysis:');
            console.log('  - Buildings data:', window.buildingsData ? 'Available' : 'Missing');
            console.log('  - Hazard layer:', window.hazardLayer ? 'Available' : 'Missing');
            console.log('  - Selected hazard:', window.selectedHazard || 'None');
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
            try {
                // Also set window.currentBBox in Swiss LV95 for Supabase queries (same as polygon flow)
                    if (bounds && bounds.isValid()) {
                        const sw = bounds.getSouthWest();
                        const ne = bounds.getNorthEast();
                        // Set currentBBox for compatibility but do NOT auto-load buildings here
                        if (typeof window.WGS84ToSwiss === 'function') {
                            const minSwiss = window.WGS84ToSwiss(sw.lng, sw.lat);
                            const maxSwiss = window.WGS84ToSwiss(ne.lng, ne.lat);
                            window.currentBBox = [minSwiss.east, minSwiss.north, maxSwiss.east, maxSwiss.north];
                        } else {
                            window.currentBBox = [sw.lng, sw.lat, ne.lng, ne.lat];
                        }
                        console.log('📦 Set window.currentBBox (from selection) for Supabase:', window.currentBBox);

                        // Instead of loading buildings for the whole canton (which can be large),
                        // fetch and display hazard layers for the selected hazard type within the canton bbox.
                        try {
                            let hazardType = (typeof window.selectedHazard === 'string' && window.selectedHazard) ? window.selectedHazard : 'rockfall';
                            const bboxWGS84 = [sw.lng, sw.lat, ne.lng, ne.lat];
                            console.log('🌋 Fetching hazard layer for selection:', hazardType, bboxWGS84);
                            fetchAndDisplayHazardLayer(hazardType, bboxWGS84);
                        } catch (err) {
                            console.warn('⚠️ Could not fetch hazards for selection', err);
                        }
                    }
            } catch (err) { console.warn('⚠️ Could not set currentBBox from selection', err); }
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
    console.log('bounds:', bounds);
    if (bounds.isValid()) {
        window.map.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: type === 'commune' ? 13 : 10  // Closer zoom for communes
        });
        console.log(`🎯 Zoomed to selected ${type}: ${name}`);

        // Only trigger API fetch if commune is selected
        if (type === 'commune') {
            // Get bounding box coordinates
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            const bboxArr = [sw.lng, sw.lat, ne.lng, ne.lat];
            // Use unified fetch which accepts hazard tokens like 'rockfall' or 'debris-flow'
            try {
                const hazardType = (typeof window.selectedHazard === 'string' && window.selectedHazard) ? window.selectedHazard : 'rockfall';
                console.log('Fetching hazard layer for selected administrative area:', hazardType, bboxArr);
                // Ensure fetchAndDisplayHazardLayer is available
                if (typeof fetchAndDisplayHazardLayer === 'function') {
                    fetchAndDisplayHazardLayer(hazardType, bboxArr);
                } else {
                    console.warn('⚠️ fetchAndDisplayHazardLayer not available, skipping hazard fetch for selection');
                }
            } catch (err) { console.warn('⚠️ Error fetching hazards for selection', err); }
        }
    }
    
    // Fetch hazard maps from Suisse API for a bounding box
    function fetchHazardDataFromSuisseAPI(bbox) {
        // Example endpoint for Suisse API OGC Features
        // You may need to adjust the collection name and query params for your use case
        const endpoint = `https://www.geodienste.ch/db/gefahrenkarten_v1_3_0/fra/ogcapi/collections/gefahrenkarten/items?bbox=${bbox}&f=json`;
        console.log('API request:', endpoint);
        fetch(endpoint)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                console.log('Hazard data received:', data);
                // TODO: Add logic to display hazard data on the map
                // For example, add as a GeoJSON layer:
                if (window.map && data && data.features) {
                    // Remove previous API hazard layer if present
                    if (window.suisseHazardLayer) {
                        window.map.removeLayer(window.suisseHazardLayer);
                    }
                    window.suisseHazardLayer = L.geoJSON(data, {
                        style: function(feature) {
                            return {
                                color: '#d73027',
                                weight: 2,
                                opacity: 0.8,
                                fillColor: '#fcf11bff',
                                fillOpacity: 0.3
                            };
                        },
                        onEachFeature: function(feature, layer) {
                            const props = feature.properties || {};
                            const popupContent = `
                                <div style="font-size:12px;">
                                    <h4>Hazard Map</h4>
                                    <p><strong>Type:</strong> ${props.gefahrentyp || 'N/A'}</p>
                                    <p><strong>Intensity:</strong> ${props.gefahrenintensitaet || 'N/A'}</p>
                                    <p><strong>Commune:</strong> ${props.gemeindename || 'N/A'}</p>
                                    <p><strong>Canton:</strong> ${props.kanton || 'N/A'}</p>
                                </div>
                            `;
                            layer.bindPopup(popupContent);
                        }
                    }).addTo(window.map);
                    // Fit map to new hazard layer
                    if (window.suisseHazardLayer.getBounds && window.suisseHazardLayer.getBounds().isValid()) {
                        window.map.fitBounds(window.suisseHazardLayer.getBounds().pad(0.1));
                    }
                    console.log('✅ Suisse hazard layer added to map');
                }
            })
            .catch(error => {
                console.error('❌ Error fetching hazard data from Suisse API:', error);
                alert('Could not fetch hazard data for this area.');
            });
    }
    
    // Add to layer control for toggle functionality
    // Prepare a layer name and register it in the layer control
    let layerName = `🎯 Selected ${type.charAt(0).toUpperCase() + type.slice(1)}: ${name}`;
    if (window.ctlLayers) {
        // Debug: Check if layer control exists and log current state
        console.log(`📋 Adding '${layerName}' to layer control`);
        console.log(`📋 Current layer control exists:`, !!window.ctlLayers);
        console.log(`📋 Current layer being added:`, currentSelectionLayer);
        try {
            window.ctlLayers.addOverlay(currentSelectionLayer, layerName);
            console.log(`📋 Successfully added '${layerName}' to layer control`);
        } catch (err) {
            console.warn('⚠️ Failed to add selection overlay to layer control', err);
        }
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
