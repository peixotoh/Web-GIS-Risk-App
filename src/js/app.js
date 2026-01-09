// ==================== SIMPLE WORKING SYSTEM ====================

// console.log('📄 Simple app.js loading...');

// ==================== GLOBAL STATE MANAGEMENT - MODULAR ARCHITECTURE ====================
// Centralized global variable initialization for the modular application

// Core Map Variables
if (typeof window.map === 'undefined') window.map = null;
if (typeof window.hazardLayer === 'undefined') window.hazardLayer = null;
if (typeof window.drawControl === 'undefined') window.drawControl = null;
if (typeof window.ctlLayers === 'undefined') window.ctlLayers = null;
if (typeof window.swissAdminLayer === 'undefined') window.swissAdminLayer = null;

// Application State Variables
if (typeof window.selectedLocation === 'undefined') window.selectedLocation = null;
if (typeof window.selectedHazard === 'undefined') window.selectedHazard = 'rockfall';
if (typeof window.buildingsEnabled === 'undefined') window.buildingsEnabled = false;
if (typeof window.currentBBox === 'undefined') window.currentBBox = null;
if (typeof window.drawnPolygon === 'undefined') window.drawnPolygon = null;

// Module Data Variables (managed by respective modules)
if (typeof window.buildingsLayer === 'undefined') window.buildingsLayer = null;     // → building-management.js
if (typeof window.buildingsData === 'undefined') window.buildingsData = null;      // → building-management.js
if (typeof window.latestAnalysisResults === 'undefined') window.latestAnalysisResults = null;      // → analysis-visualization.js
if (typeof window.latestExtractionResults === 'undefined') window.latestExtractionResults = null;  // → spatial-analysis.js
if (typeof window.analysisHighlightLayer === 'undefined') window.analysisHighlightLayer = null;    // → analysis-visualization.js
if (typeof window.currentAnalysisLayers === 'undefined') window.currentAnalysisLayers = null;      // → spatial-analysis.js

// Legacy Map Variables (for compatibility)
if (typeof window.fgp === 'undefined') window.fgp = null;
if (typeof window.fgp1 === 'undefined') window.fgp1 = null;

// Module Function Placeholders (overwritten by respective modules)
window.loadBuildingsFromSupabase = window.loadBuildingsFromSupabase || function() { 
    console.warn('⚠️ loadBuildingsFromSupabase not loaded - building-management.js required'); 
};
window.removeBuildingsFromMap = window.removeBuildingsFromMap || function() { 
    console.warn('⚠️ removeBuildingsFromMap not loaded - building-management.js required'); 
};
// ==================================================================================

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
    
    // Reset building button (no state to reset since button always adds/refreshes)
    // Building state is managed by the button click action
    
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
    
    // Remove analysis layers
    if (typeof window.removeExistingAnalysisLayers === 'function') {
        window.removeExistingAnalysisLayers();
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
    console.log('⚙️ Setting up workflow functionality...');
    
    // Variables to track workflow state
    let selectedLocation = null;
    let selectedHazard = 'rockfall'; // Default to rockfall hazard
    let buildingsEnabled = false;
    let drawnPolygons = [];
    
    // ============================
    // MODULAR INITIALIZATION SEQUENCE
    // ============================
    
    // Core application controls
    initializeLocationControls();
    initializeHazardToggles();
    initializeDataSourceControls();
    
    // Modular components (delegated to respective modules)
    initializeBuildingButton();      // → building-management.js
    initializeVulnerabilityControls(); // → vulnerability.js 
    initializeAnalysisControls();    // → analysis-visualization.js
    initializeCATExportButton();     // → CAT Model CSV export functionality
    
    // CAT Model Export functionality (CSV & Excel)
    function initializeCATExportButton() {
        const csvExportBtn = document.getElementById('export-cat-csv');
        const excelExportBtn = document.getElementById('export-cat-excel');
        
        if (csvExportBtn) {
            csvExportBtn.addEventListener('click', function() {
                exportCATResultsToCSV();
            });
            console.log('✅ CAT Model CSV export button initialized');
        } else {
            console.warn('⚠️ Export CAT CSV button not found');
        }
        
        if (excelExportBtn) {
            excelExportBtn.addEventListener('click', function() {
                exportCATResultsToExcel();
            });
            console.log('✅ CAT Model Excel export button initialized');
        } else {
            console.warn('⚠️ Export CAT Excel button not found');
        }
    }
    
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
        
        // NOTE: Data processing functions moved to data-processing.js module
        // - processCustomDataFile()
        // - loadCustomHazardDataToMap()
        // - loadCustomBuildingsDataToMap()
        // - detectAndTransformCoordinates()
        // - transformSwissToWGS84()
        // - getSelectedHazardType()
    }
    
    // ============================
    // MODULAR ARCHITECTURE - BUILDING MANAGEMENT
    // ============================
    // Building management functions moved to building-management.js module
    
    // Vulnerability controls functionality
    // Moved to vulnerability.js module - Step 5 Enhancement
    function initializeVulnerabilityControls() {
        // The vulnerability modal setup is now handled by vulnerability.js module
        console.log('✅ Vulnerability controls initialization delegated to vulnerability.js module');
    }
    
    // ============================
    // ANALYSIS CONTROLS - MODULAR ARCHITECTURE  
    // ============================
    // Analysis functions moved to analysis-visualization.js module
    
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

                // Log buildings analysed data and use it perform the risk assessment.
                console.table('Table data for risk assessment');
                console.table(window.latestExtractionResults.buildingsAnalyzed || {});
                
                // ===============================================================================
                // =================== POISSON-DISTRIBUTED SIMULATIONS =========================
                // ===============================================================================
                // The number of simulations is now determined using Poisson distribution:
                // - Input value becomes the expected/mean number of simulations (λ)
                // - Random variability is added through inverse Poisson sampling
                // - This provides realistic simulation count variations around the expected value
                // =============================================================================== 
                
                // Convert numeric fields to proper types for calculations
                if (window.latestExtractionResults && window.latestExtractionResults.buildingsAnalyzed) {
                    console.log('🔢 Converting numeric fields to proper types and calculating missing values...');
                    
                    // iteration through each building property
                    window.latestExtractionResults.buildingsAnalyzed.forEach((building, index) => {
                        const props = building.buildingProperties || {};
                        const hazardProps = building.hazardProperties || {};
                        
                        // Debug: Log building properties for first few buildings
                        if (index < 3) {
                            console.log(`🔍 Building ${index + 1} properties:`, props);
                            console.log(`🔍 Building ${index + 1} keys:`, Object.keys(props));
                            console.log(`🔍 Building ${index + 1} EGID:`, building.EGID || props.EGID || props.egid || building.egid || 'missing');
                            console.log(`🔍 Building ${index + 1} GKLAS:`, building.GKLAS || props.GKLAS || props.buildingCl || building.buildingCl || 'missing');
                        }
                        
                        // Create comprehensive variables for building properties
                        // Use fallbacks for GeoAdmin data structure
                        let constructionYear = props.GBAUJ || props.baujahr;
                        let buildingArea = props.GAREA || props.gebaeudeflaeche || props.area;
                        let buildingVolume = props.GVOL || props.volumen || props.volume;
                        let numberOfFloors = (props.GASTW !== "N/A" && props.GASTW !== null) ? props.GASTW : 
                                           (props.stockwerke !== "N/A" && props.stockwerke !== null) ? props.stockwerke : 2;
                        let numberOfApartments = (props.GANZWHG !== "N/A" && props.GANZWHG !== null) ? props.GANZWHG : 
                                               (props.wohnungen !== "N/A" && props.wohnungen !== null) ? props.wohnungen : 1;
                        let buildingClass = props.GKLAS || props.klasse || props.buildingCl || building.GKLAS || building.buildingCl;
                        let constructionPeriod = props.GBAUP || props.bauperiode;
                        let coordinateE = props.GKODE || building.geometry?.coordinates?.[0];
                        let coordinateN = props.GKODN || building.geometry?.coordinates?.[1];
                        let communeNumber = props.GGDENR;
                        let buildingNumber = props.GEBNR;
                        let constructionMonth = props.GBAUM;

                        // Debug: Show extracted values for first few buildings
                        if (index < 3) {
                            console.log(`🔍 Building ${index + 1} extracted values:`);
                            console.log(`  - Construction Year: ${constructionYear}`);
                            console.log(`  - Building Area: ${buildingArea}`);
                            console.log(`  - Building Volume: ${buildingVolume}`);
                            console.log(`  - Number of Floors: ${numberOfFloors}`);
                            console.log(`  - Number of Apartments: ${numberOfApartments}`);
                            console.log(`  - Building Class (GKLAS): ${buildingClass}`);
                            console.log(`  - Construction Period: ${constructionPeriod}`);
                        }

                        // Convert string numbers to integers/floats for calculations
                        if (constructionYear) props.GBAUJ = parseInt(constructionYear) || constructionYear;
                        if (buildingArea) props.GAREA = parseFloat(buildingArea) || buildingArea;
                        if (numberOfFloors) props.GASTW = parseInt(numberOfFloors) || numberOfFloors;
                        if (numberOfApartments) props.GANZWHG = parseInt(numberOfApartments) || numberOfApartments;
                        if (buildingClass) props.GKLAS = parseInt(buildingClass) || buildingClass;
                        if (coordinateE) props.GKODE = parseFloat(coordinateE) || coordinateE;
                        if (coordinateN) props.GKODN = parseFloat(coordinateN) || coordinateN;
                        if (communeNumber) props.GGDENR = parseInt(communeNumber) || communeNumber;
                        if (buildingNumber) props.GEBNR = parseInt(buildingNumber) || buildingNumber;
                        if (constructionMonth) props.GBAUM = parseInt(constructionMonth) || constructionMonth;


                        // ================================================================================================
                        // ===========================   NEW FIELDS CALCULATION SECTION  ==================================
                        // ================================================================================================                       
                       

                        // Ensure we have valid numeric values with defaults for missing GeoAdmin data
                        if (!constructionYear || constructionYear === 0 || constructionYear === 'N/A') {
                            constructionYear = 1970; // Default construction year
                        }
                        if (!buildingArea || buildingArea === 0 || buildingArea === 'N/A') {
                            buildingArea = 120; // Default building area in m²
                        }
                        if (!numberOfFloors || numberOfFloors === 0 || numberOfFloors === 'N/A') {
                            numberOfFloors = 2; // Default number of floors
                        }
                        if (!numberOfApartments || numberOfApartments === 0 || numberOfApartments === 'N/A') {
                            numberOfApartments = 1; // Default number of apartments
                        }
                        if (!buildingClass || buildingClass === 'N/A') {
                            buildingClass = 1110; // Default to residential
                        }
                        
                        // Handle building volume - convert if available, calculate if missing
                        if (buildingVolume && buildingVolume !== "N/A" && !isNaN(parseFloat(buildingVolume))) {
                            buildingVolume = parseFloat(buildingVolume);
                        } else if (buildingArea && numberOfFloors && buildingArea > 0 && numberOfFloors > 0) {
                            buildingVolume = window.volumeBuilding ? window.volumeBuilding(buildingArea, numberOfFloors) : buildingArea * numberOfFloors * 2.7;
                        } else {
                            buildingVolume = 120 * 2 * 2.7; // Default volume calculation
                        }
                        
                        // Update props with calculated/default values
                        props.GBAUJ = constructionYear;
                        props.GAREA = buildingArea;
                        props.GVOL = buildingVolume;
                        props.GASTW = numberOfFloors;
                        props.GANZWHG = numberOfApartments;
                        props.GKLAS = buildingClass;
                        
                        // Keep original construction period code and create new converted year field
                        let convertedYearFromPeriod = null;
                        
                        if(constructionPeriod && !isNaN(parseInt(constructionPeriod))) {
                            console.log(`🔍 Original construction period code: ${constructionPeriod} (type: ${typeof constructionPeriod})`);
                            convertedYearFromPeriod = window.constructionPeriodCodeToYears ? window.constructionPeriodCodeToYears(parseInt(constructionPeriod)) : 1950;
                            
                            // Keep original period code in GBAUP
                            props.GBAUP = constructionPeriod;
                            // Create new field for converted year
                            props.GBAUP_YEAR = convertedYearFromPeriod;
                            
                            console.log(`🏗️ Period code ${constructionPeriod} → converted year ${convertedYearFromPeriod}`);
                            console.log(`📋 GBAUP (original): ${props.GBAUP}, GBAUP_YEAR (converted): ${props.GBAUP_YEAR}`);
                        }

                        //  --- construction year - use converted year if original is missing
                        if (!constructionYear || isNaN(parseInt(constructionYear))) {
                            if (convertedYearFromPeriod) {
                                // Use the converted year from period code
                                props.GBAUJ = convertedYearFromPeriod;
                                console.log(`📅 Set construction year to ${convertedYearFromPeriod} from period code`);
                            } else {
                                // Fallback to random year
                                const fallbackYear = window.constructionYear ? window.constructionYear(null, null) : 1950;
                                props.GBAUJ = fallbackYear;
                                console.log(`🎲 Set construction year to fallback ${fallbackYear}`);
                            }
                        }                       
                        
                                                
                        // Description - lookup building description from GKLAS
                        if (buildingClass && window.buildings) {
                            const buildingInfo = window.buildings.find(info => 
                                info.classes.includes(String(buildingClass))
                            );
                            props.DESCRIPTION = buildingInfo ? buildingInfo.description : 'Unknown building type';
                        } else {
                            props.DESCRIPTION = 'No class information';
                        }
                        
                        // Volume - calculate if not present using volumeBuilding function
                        if (!buildingVolume || buildingVolume === 'N/A' || buildingVolume <= 0) {
                            if (buildingArea && numberOfFloors && buildingArea > 0 && numberOfFloors > 0) {
                                buildingVolume = window.volumeBuilding ? window.volumeBuilding(buildingArea, numberOfFloors) : buildingArea * numberOfFloors * 2.7;
                                props.GVOL = buildingVolume;
                                console.log(`📦 Calculated volume: ${buildingVolume} m³ for building with area ${buildingArea} m² and ${numberOfFloors} floors`);
                            } else {
                                buildingVolume = 'N/A';
                                props.GVOL = buildingVolume;
                            }
                        } else {
                            props.GVOL = parseFloat(buildingVolume);
                        }
                        
                        // Cost & Cost units
                        if (buildingClass && window.buildings) {
                            const buildingInfo = window.buildings.find(info => 
                                info.classes.includes(String(buildingClass))
                            );
                            if (buildingInfo) {
                                props.BASE_COST = buildingInfo.valeur_base;
                                props.COST_UNITS = buildingInfo.unite;
                                
                                // Calculate total cost based on units
                                if (buildingInfo.unite === "CHF/m³" && props.GVOL && props.GVOL !== 'N/A') {
                                    props.TOTAL_COST = buildingInfo.valeur_base * parseFloat(props.GVOL);
                                } else if (buildingInfo.unite === "CHF/unité résidentielle" && numberOfApartments && numberOfApartments > 0) {
                                    props.TOTAL_COST = buildingInfo.valeur_base * parseInt(numberOfApartments);
                                } else if (buildingInfo.unite === "CHF/m²" && buildingArea && buildingArea > 0) {
                                    props.TOTAL_COST = buildingInfo.valeur_base * parseFloat(buildingArea);
                                } else {
                                    // Default calculation using volume if available
                                    props.TOTAL_COST = buildingInfo.valeur_base * (props.GVOL !== 'N/A' ? parseFloat(props.GVOL) : 1);
                                }
                            } else {
                                props.BASE_COST = 'Unknown';
                                props.COST_UNITS = 'Unknown';
                                props.TOTAL_COST = 'N/A';
                            }
                        } else {
                            props.BASE_COST = 'No class info';
                            props.COST_UNITS = 'No class info';
                            props.TOTAL_COST = 'N/A';
                        }
                        
                        console.log(`💰 Building ${index + 1}: Cost=${props.BASE_COST} ${props.COST_UNITS}, Total=${props.TOTAL_COST}`);
                        
                        console.log(`🏗️ Building ${index + 1}: Class=${buildingClass}, Description=${props.DESCRIPTION}, Volume=${props.GVOL}`);
                        
                        // DEBUG: Check if functions are available
                        if (index === 0) {
                            console.log('🔧 Available functions check:');
                            console.log('  - window.buildings:', !!window.buildings);
                            console.log('  - window.volumeBuilding:', !!window.volumeBuilding);
                            console.log('  - Buildings data sample:', window.buildings?.[0]);
                        }
                        

                        // Step 5: Temporal Hazard Probability - calculate using temporaHazardProbability function
                        let temporalHazardProb = 'N/A';
                        
                        // Support multiple field names for return period: recurrence, return_per, returnPeriod
                        const recurrenceValue = building?.recurrence || building?.return_per || building?.returnPeriod || hazardProps?.return_per || hazardProps?.recurrence;
                        
                        if (recurrenceValue && window.temporaHazardProbability && window.selectedHazard) {
                            // Extract return period number from recurrence string or use directly if numeric
                            const returnPeriod = typeof recurrenceValue === 'number' ? recurrenceValue : parseInt(String(recurrenceValue).match(/\d+/)?.[0]);
                            
                            if (returnPeriod) {
                                temporalHazardProb = window.temporaHazardProbability(window.selectedHazard, returnPeriod) || 'N/A';
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.TEMPORAL_HAZARD_PROB = temporalHazardProb;

                        // Step 6: Spatial Hazard Probability - calculate using spatialHazardProbValdorisk function
                        // Function now available from enhanced spatial-analysis.js module
                        let spatialHazardProb = 'N/A';
                        
                        // Support multiple field names for return period: recurrence, return_per, returnPeriod
                        const recurrenceValueSpatial = building?.recurrence || building?.return_per || building?.returnPeriod || hazardProps?.return_per || hazardProps?.recurrence;
                        
                        if (recurrenceValueSpatial && typeof window.spatialHazardProbValdorisk === 'function' && window.selectedHazard) {
                            // Extract return period number from recurrence string or use directly if numeric
                            const returnPeriod = typeof recurrenceValueSpatial === 'number' ? recurrenceValueSpatial : parseInt(String(recurrenceValueSpatial).match(/\d+/)?.[0]);
                            
                            if (returnPeriod) {
                                // Debug logging for Step 6
                                if (index < 3) {
                                    console.log(`🔧 Step 6 Debug Building ${index + 1}:`);
                                    console.log(`  - Return Period: ${returnPeriod}`);
                                    console.log(`  - Hazard Type: ${window.selectedHazard}`);
                                    console.log(`  - Function available: ${typeof spatialHazardProbValdorisk}`);
                                }
                                
                                spatialHazardProb = window.spatialHazardProbValdorisk(returnPeriod, window.selectedHazard) || 'N/A';
                                
                                if (index < 3) {
                                    console.log(`  - Calculated spatial hazard prob: ${spatialHazardProb}`);
                                }
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.SPATIAL_HAZARD_PROB = spatialHazardProb;

                        // Step 7: Vulnerability (EconoMe) - based on GKLAS and hazard intensity
                        let vulnerability = 'N/A';
                        
                        // Support multiple field names for intensity: intensity, intensity_ (with underscore)
                        const intensityValue = building.intensity || building.intensity_ || hazardProps?.intensity || hazardProps?.intensity_;
                        
                        if (buildingClass && intensityValue && window.buildings) {
                            // Debug logging for Step 7
                            if (index < 3) {
                                console.log(`🔧 Step 7 Debug Building ${index + 1}:`);
                                console.log(`  - Building Class (GKLAS): ${buildingClass}`);
                                console.log(`  - Hazard Intensity: ${intensityValue}`);
                            }
                            
                            // Find building info based on GKLAS
                            const buildingInfo = window.buildings.find(b => 
                                b.classes && b.classes.includes(String(buildingClass))
                            );
                            
                            if (buildingInfo && buildingInfo.vulnerabilite) {
                                // Map intensity to vulnerability key
                                let intensityKey = null;
                                const intensity = String(intensityValue).toLowerCase();
                                
                                if (intensity.includes('faible') || intensity.includes('low')) {
                                    intensityKey = 'faible';
                                } else if (intensity.includes('moyenne') || intensity.includes('medium') || intensity.includes('mean')) {
                                    intensityKey = 'moyenne';
                                } else if (intensity.includes('forte') || intensity.includes('high')) {
                                    intensityKey = 'forte';
                                }
                                
                                if (intensityKey && buildingInfo.vulnerabilite[intensityKey] !== undefined) {
                                    vulnerability = buildingInfo.vulnerabilite[intensityKey];
                                    
                                    if (index < 3) {
                                        console.log(`  - Found building info: ${buildingInfo.description}`);
                                        console.log(`  - Intensity key: ${intensityKey}`);
                                        console.log(`  - Vulnerability value: ${vulnerability}`);
                                        console.log(`  - Full vulnerabilite object:`, buildingInfo.vulnerabilite);
                                    }
                                } else {
                                    if (index < 3) {
                                        console.log(`  - No matching intensity key found for: ${intensity}`);
                                    }
                                }
                            } else {
                                if (index < 3) {
                                    console.log(`  - No building info found for GKLAS: ${buildingClass}`);
                                }
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.VULNERABILITY = vulnerability;

                        // Step 8: Damage (EconoMe) - Multiplication of all risk components
                        let damage = 'N/A';
                        
                        // Extract all required values for damage calculation
                        const temporalProb = building.TEMPORAL_HAZARD_PROB;
                        const spatialProb = building.SPATIAL_HAZARD_PROB;
                        const vuln = building.VULNERABILITY;
                        const cost = building.buildingProperties?.TOTAL_COST;
                        
                        // Check if all values are available and numeric
                        if (temporalProb !== 'N/A' && temporalProb !== null && temporalProb !== undefined && !isNaN(temporalProb) &&
                            spatialProb !== 'N/A' && spatialProb !== null && spatialProb !== undefined && !isNaN(spatialProb) &&
                            vuln !== 'N/A' && vuln !== null && vuln !== undefined && !isNaN(vuln) &&
                            cost !== 'N/A' && cost !== null && cost !== undefined && !isNaN(cost)) {
                            
                            // Calculate damage: Temporal Hazard Probability * Spatial Hazard Probability * Vulnerability * Cost
                            damage = parseFloat(temporalProb) * parseFloat(spatialProb) * parseFloat(vuln) * parseFloat(cost);
                            
                            // Debug logging for Step 8
                            if (index < 3) {
                                console.log(`🔧 Step 8 Debug Building ${index + 1}:`);
                                console.log(`  - Temporal Hazard Prob: ${temporalProb} (${typeof temporalProb})`);
                                console.log(`  - Spatial Hazard Prob: ${spatialProb} (${typeof spatialProb})`);
                                console.log(`  - Vulnerability: ${vuln} (${typeof vuln})`);
                                console.log(`  - Total Cost: ${cost} (${typeof cost})`);
                                console.log(`  - Damage = ${temporalProb} * ${spatialProb} * ${vuln} * ${cost} = ${damage}`);
                                console.log(`  - Damage (CHF): ${damage.toLocaleString('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                            }
                        } else {
                            // Debug logging for missing values
                            if (index < 3) {
                                console.log(`🔧 Step 8 Debug Building ${index + 1}: Cannot calculate damage - missing values:`);
                                console.log(`  - Temporal Hazard Prob: ${temporalProb} (valid: ${temporalProb !== 'N/A' && !isNaN(temporalProb)})`);
                                console.log(`  - Spatial Hazard Prob: ${spatialProb} (valid: ${spatialProb !== 'N/A' && !isNaN(spatialProb)})`);
                                console.log(`  - Vulnerability: ${vuln} (valid: ${vuln !== 'N/A' && !isNaN(vuln)})`);
                                console.log(`  - Total Cost: ${cost} (valid: ${cost !== 'N/A' && !isNaN(cost)})`);
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.DAMAGE = damage;

                        // Step 9: Vulnerability (Literature) - using vulBorterBart function
                        let vulnerabilityLiterature = 'N/A';
                        
                        if (window.selectedHazard && typeof vulBorterBart === 'function') {
                            // Get construction year with fallback logic
                            let constructionYear = building.buildingProperties?.GBAUJ;
                            
                            // If construction year not present, use construction period year
                            if (!constructionYear || constructionYear === 'N/A' || constructionYear === null || constructionYear === undefined) {
                                constructionYear = building.buildingProperties?.GBAUP_YEAR;
                            }
                            
                            // If construction period year is also null/not present, use 1960
                            if (!constructionYear || constructionYear === 'N/A' || constructionYear === null || constructionYear === undefined) {
                                constructionYear = 1960;
                            }
                            
                            // Convert to integer
                            const year = parseInt(constructionYear);
                            
                            // Map hazard type to function expected format
                            let hazard = null;
                            if (window.selectedHazard === 'rockfall' || window.selectedHazard === 'rock-fall' || window.selectedHazard === 'rock_fall') {
                                hazard = 'rock_fall';
                            } else if (window.selectedHazard === 'debris_flow' || window.selectedHazard === 'debrisflow' || window.selectedHazard === 'debris-flow') {
                                hazard = 'debris_flow';
                            }
                            
                            // Map intensity level to function expected format
                            // Support multiple field names for intensity: intensity, intensity_ (with underscore)
                            const intensityValueLit = building.intensity || building.intensity_ || hazardProps?.intensity || hazardProps?.intensity_;
                            let intensityLevel = null;
                            if (intensityValueLit) {
                                const intensity = String(intensityValueLit).toLowerCase();
                                if (intensity.includes('faible') || intensity.includes('low')) {
                                    intensityLevel = 'low';
                                } else if (intensity.includes('moyenne') || intensity.includes('medium') || intensity.includes('mean')) {
                                    intensityLevel = 'mean';
                                } else if (intensity.includes('forte') || intensity.includes('high')) {
                                    intensityLevel = 'high';
                                }
                            }
                            
                            // Calculate vulnerability if all parameters are valid
                            if (hazard && !isNaN(year) && intensityLevel) {
                                vulnerabilityLiterature = vulBorterBart(hazard, year, intensityLevel);
                                
                                // Debug logging for Step 9
                                if (index < 3) {
                                    console.log(`🔧 Step 9 Debug Building ${index + 1}:`);
                                    console.log(`  - Original construction year: ${building.buildingProperties?.GBAUJ}`);
                                    console.log(`  - Construction period year: ${building.buildingProperties?.GBAUP_YEAR}`);
                                    console.log(`  - Final year used: ${year}`);
                                    console.log(`  - Hazard type: ${window.selectedHazard} → ${hazard}`);
                                    console.log(`  - Intensity: ${intensityValueLit} → ${intensityLevel}`);
                                    console.log(`  - vulBorterBart(${hazard}, ${year}, ${intensityLevel}) = ${vulnerabilityLiterature}`);
                                }
                            } else {
                                // Debug logging for missing parameters
                                if (index < 3) {
                                    console.log(`🔧 Step 9 Debug Building ${index + 1}: Cannot calculate - missing parameters:`);
                                    console.log(`  - Hazard: ${window.selectedHazard} → ${hazard} (valid: ${!!hazard})`);
                                    console.log(`  - Year: ${year} (valid: ${!isNaN(year)})`);
                                    console.log(`  - Intensity: ${building.intensity} → ${intensityLevel} (valid: ${!!intensityLevel})`);
                                }
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.VULNERABILITY_LITERATURE = vulnerabilityLiterature;

                        // Step 10: Damage (Literature) - Multiplication of all risk components with Literature vulnerability
                        let damageLiterature = 'N/A';
                        
                        // Extract all required values for damage calculation
                        const temporalProbLit = building.TEMPORAL_HAZARD_PROB;
                        const spatialProbLit = building.SPATIAL_HAZARD_PROB;
                        const vulnLit = building.VULNERABILITY_LITERATURE;
                        const costLit = building.buildingProperties?.TOTAL_COST;
                        
                        // Check if all values are available and numeric
                        if (temporalProbLit !== 'N/A' && temporalProbLit !== null && temporalProbLit !== undefined && !isNaN(temporalProbLit) &&
                            spatialProbLit !== 'N/A' && spatialProbLit !== null && spatialProbLit !== undefined && !isNaN(spatialProbLit) &&
                            vulnLit !== 'N/A' && vulnLit !== null && vulnLit !== undefined && !isNaN(vulnLit) &&
                            costLit !== 'N/A' && costLit !== null && costLit !== undefined && !isNaN(costLit)) {
                            
                            // Calculate damage: Temporal Hazard Probability * Spatial Hazard Probability * Vulnerability (Literature) * Cost
                            damageLiterature = parseFloat(temporalProbLit) * parseFloat(spatialProbLit) * parseFloat(vulnLit) * parseFloat(costLit);
                            
                            // Debug logging for Step 10
                            if (index < 3) {
                                console.log(`🔧 Step 10 Debug Building ${index + 1}:`);
                                console.log(`  - Temporal Hazard Prob: ${temporalProbLit} (${typeof temporalProbLit})`);
                                console.log(`  - Spatial Hazard Prob: ${spatialProbLit} (${typeof spatialProbLit})`);
                                console.log(`  - Vulnerability (Literature): ${vulnLit} (${typeof vulnLit})`);
                                console.log(`  - Total Cost: ${costLit} (${typeof costLit})`);
                                console.log(`  - Damage = ${temporalProbLit} * ${spatialProbLit} * ${vulnLit} * ${costLit} = ${damageLiterature}`);
                                console.log(`  - Damage (CHF): ${damageLiterature.toLocaleString('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                                
                                // Compare with EconoMe damage if available
                                if (building.DAMAGE !== 'N/A' && building.DAMAGE !== null && building.DAMAGE !== undefined && !isNaN(building.DAMAGE)) {
                                    const damageEconome = parseFloat(building.DAMAGE);
                                    const ratio = damageLiterature / damageEconome;
                                    console.log(`  - EconoMe Damage: ${damageEconome.toLocaleString('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF`);
                                    console.log(`  - Literature/EconoMe Ratio: ${ratio.toFixed(3)}`);
                                }
                            }
                        } else {
                            // Debug logging for missing values
                            if (index < 3) {
                                console.log(`🔧 Step 10 Debug Building ${index + 1}: Cannot calculate damage - missing values:`);
                                console.log(`  - Temporal Hazard Prob: ${temporalProbLit} (valid: ${temporalProbLit !== 'N/A' && !isNaN(temporalProbLit)})`);
                                console.log(`  - Spatial Hazard Prob: ${spatialProbLit} (valid: ${spatialProbLit !== 'N/A' && !isNaN(spatialProbLit)})`);
                                console.log(`  - Vulnerability (Literature): ${vulnLit} (valid: ${vulnLit !== 'N/A' && !isNaN(vulnLit)})`);
                                console.log(`  - Total Cost: ${costLit} (valid: ${costLit !== 'N/A' && !isNaN(costLit)})`);
                            }
                        }
                        
                        // Store the value directly on the building object
                        building.DAMAGE_LITERATURE = damageLiterature;
                        
                        // End of new fields section
                        // ===============================
                        
                        // Debug: Log calculated fields for first few buildings
                        if (index < 3) {
                            console.log(`✅ Building ${index + 1} final calculated values:`);
                            console.log(`  - TOTAL_COST: ${building.buildingProperties?.TOTAL_COST}`);
                            console.log(`  - TEMPORAL_HAZARD_PROB: ${building.TEMPORAL_HAZARD_PROB}`);
                            console.log(`  - SPATIAL_HAZARD_PROB: ${building.SPATIAL_HAZARD_PROB}`);
                            console.log(`  - VULNERABILITY: ${building.VULNERABILITY}`);
                            console.log(`  - DAMAGE: ${building.DAMAGE}`);
                            console.log(`  - VULNERABILITY_LITERATURE: ${building.VULNERABILITY_LITERATURE}`);
                            console.log(`  - DAMAGE_LITERATURE: ${building.DAMAGE_LITERATURE}`);
                        }
                    });                    
                    console.log('✅ Numeric fields converted and calculations completed for', window.latestExtractionResults.buildingsAnalyzed.length, 'buildings');
                }

                // ===============================================================================
                // ================= CAT MODEL METHOD 3 - MONTE CARLO SIMULATIONS ================
                // ===============================================================================
                
                console.log('🎲 Starting CAT Model Method 3 Monte Carlo Analysis...');
                
                // Initialize Method 3 results array for new analysis (clear previous results)
                window.method3Results = [];
                console.log('🔄 Method 3 results array initialized for multi-building analysis');
                
                // Get expected simulation count from input and apply Poisson distribution
                const simulationCountElement = document.getElementById('simulation-count');
                const expectedSimulations = simulationCountElement ? parseInt(simulationCountElement.value) : 1000; // Default expected value
                
                // Generate actual number of simulations using Poisson distribution
                let numSimulations = expectedSimulations;
                if (typeof window.generatePoissonSimulations === 'function') {
                    numSimulations = window.generatePoissonSimulations(expectedSimulations);
                } else {
                    console.warn('⚠️ Poisson simulation function not available, using expected value directly');
                    numSimulations = expectedSimulations;
                }
                
                console.log(`🎲 Simulations: Expected=${expectedSimulations}, Actual=${numSimulations} (Poisson-distributed)`);
                
                // Spatial probability will be calculated per building based on return period and hazard type
                const hazardType = window.selectedHazard || 'rockfall';
                console.log('Selected hazard type:', hazardType);
                console.log('spatialHazardProbValdorisk function available:', typeof window.spatialHazardProbValdorisk);
                
                // Note: Spatial probability will be calculated individually for each building based on its return period
                console.log('🎯 Spatial probability will be calculated per building using spatialHazardProbValdorisk(returnPeriod, hazardType)');
                
                // Method 3: Loop through all buildings, find first real hazard exposure per building
                // For each building, collect ALL rows first, then find the best combination
                if (window.latestExtractionResults && window.latestExtractionResults.buildingsAnalyzed) {
                    const allBuildings = window.latestExtractionResults.buildingsAnalyzed;
                    const processedBuildings = new Set(); // Track which buildings we've already processed
                    let buildingsProcessedCount = 0;
                    
                    console.log(`Method 3: Scanning ${allBuildings.length} building rows to find real hazard exposures...`);
                    
                    // Group buildings by EGID (unique building identifier) first to understand the data structure
                    const buildingGroups = new Map();
                    allBuildings.forEach((building, index) => {
                        const props = building.buildingProperties || {};
                        const egid = props.EGID || building.EGID; // Use EGID as the unique identifier
                        
                        if (!egid) {
                            console.warn(`⚠️ Row ${index + 1}: No EGID found, skipping...`);
                            return;
                        }
                        
                        if (!buildingGroups.has(egid)) {
                            buildingGroups.set(egid, []);
                        }
                        buildingGroups.get(egid).push({
                            building: building,
                            index: index,
                            intensity: building.intensity || 'aucune_atteinte',
                            gklas: building.GKLAS || props.GKLAS,
                            gebnr: props.GEBNR || building.id
                        });
                    });
                    
                    console.log(`Method 3: Found ${buildingGroups.size} unique buildings (by EGID) with multiple exposures`);
                    
                    // Process each building group
                    buildingGroups.forEach((buildingRows, egid) => {
                        console.log(`\n🏢 Processing EGID ${egid} with ${buildingRows.length} rows:`);
                        
                        // Log all rows for this building
                        buildingRows.forEach((row, i) => {
                            console.log(`  Row ${i + 1}: Intensity="${row.intensity}", GKLAS=${row.gklas}, GEBNR=${row.gebnr}`);
                        });
                        
                        // Find the best row: real hazard + consistent GKLAS
                        // Priority: 1) Real hazard, 2) Most common GKLAS, 3) Highest intensity
                        const realHazardRows = buildingRows.filter(row => {
                            const intensity = row.intensity;
                            return intensity && 
                                   intensity !== 'aucune_atteinte' && 
                                   intensity !== 'aucune atteinte' && 
                                   intensity !== 'None' && 
                                   intensity.toLowerCase() !== 'none';
                        });
                        
                        if (realHazardRows.length === 0) {
                            console.log(`  ❌ No real hazard exposures found for EGID ${egid}`);
                            return;
                        }
                        
                        console.log(`  ✅ Found ${realHazardRows.length} real hazard exposures`);
                        
                        // Find the most common GKLAS among real hazard rows
                        const gklasCount = {};
                        realHazardRows.forEach(row => {
                            const gklas = row.gklas;
                            gklasCount[gklas] = (gklasCount[gklas] || 0) + 1;
                        });
                        
                        const mostCommonGklas = Object.keys(gklasCount).reduce((a, b) => 
                            gklasCount[a] > gklasCount[b] ? a : b
                        );
                        
                        console.log(`  📊 GKLAS distribution in real hazard rows:`, gklasCount);
                        console.log(`  🎯 Most common GKLAS: ${mostCommonGklas}`);
                        
                        // Select the best row: same GKLAS as most common, highest intensity
                        const bestRow = realHazardRows
                            .filter(row => row.gklas == mostCommonGklas)
                            .sort((a, b) => {
                                const intensityRank = (intensity) => {
                                    const intensityStr = String(intensity || '').toLowerCase();
                                    if (intensityStr.includes('forte') || intensityStr.includes('high')) return 4;
                                    if (intensityStr.includes('moyenne') || intensityStr.includes('mean')) return 3;
                                    if (intensityStr.includes('faible') || intensityStr.includes('low')) return 2;
                                    return 1;
                                };
                                return intensityRank(b.intensity) - intensityRank(a.intensity);
                            })[0];
                        
                        if (!bestRow) {
                            console.log(`  ❌ No suitable row found for EGID ${egid}`);
                            return;
                        }
                        
                        console.log(`  🏆 Selected row: Intensity="${bestRow.intensity}", GKLAS=${bestRow.gklas}, GEBNR=${bestRow.gebnr}`);
                        
                        // Process this building with Method 3
                        buildingsProcessedCount++;
                        const building = bestRow.building;
                        const props = building.buildingProperties || {};
                        const buildCost = building.TOTAL_COST || props.TOTAL_COST || 1000000;
                        
                        // Calculate spatial probability for this specific building based on its return period
                        let spatialProb = 0.03; // Default fallback for rockfall
                        if (building.recurrence && typeof window.spatialHazardProbValdorisk === 'function') {
                            const returnPeriod = parseInt(String(building.recurrence).match(/\d+/)?.[0]);
                            if (returnPeriod) {
                                spatialProb = window.spatialHazardProbValdorisk(returnPeriod, hazardType) || 0.03;
                                console.log(`🎯 Method 3 - EGID ${egid}: Return period ${returnPeriod}, Spatial probability: ${spatialProb}`);
                            }
                        }
                        
                        // Call Method 3 function for this building
                        if (typeof window.method3CatModel === 'function') {
                            console.log(`📞 Calling method3CatModel for EGID ${egid}: GKLAS=${bestRow.gklas}, intensity=${bestRow.intensity}, spatialProb=${spatialProb}`);
                            
                            const method3Result = window.method3CatModel(hazardType, buildCost, spatialProb, numSimulations, bestRow.gklas, bestRow.intensity, egid);
                            
                            if (method3Result) {
                                // Store Method 3 results on building object
                                building.METHOD3_RESULTS = method3Result;
                                building.METHOD3_MEAN_DAMAGE = method3Result?.meanDamage || 0;
                                building.METHOD3_MIN_DAMAGE = method3Result?.minDamage || 0;
                                building.METHOD3_MAX_DAMAGE = method3Result?.maxDamage || 0;
                                building.METHOD3_STD_DEV = method3Result?.stdDev || 0;
                                building.METHOD3_INTENSITY_USED = bestRow.intensity;
                                building.METHOD3_GKLAS_USED = bestRow.gklas;
                                
                                console.log(`✅ Method 3 completed for EGID ${egid}: GKLAS=${bestRow.gklas}, intensity=${bestRow.intensity}, mean damage=${building.METHOD3_MEAN_DAMAGE.toFixed(2)} CHF`);
                            } else {
                                console.error(`❌ Method 3 returned null for EGID ${egid}`);
                            }
                        } else {
                            console.warn('⚠️ method3CatModel function not found');
                        }
                    });
                    
                    console.log(`✅ Method 3 completed: Processed ${buildingsProcessedCount} unique buildings with real hazard exposures`);
                    
                    // Additional debugging for Method 3 verification
                    console.log(`🔍 Method 3 Verification Summary:`);
                    console.log(`  - Total building rows in analysis: ${allBuildings.length}`);
                    console.log(`  - Unique buildings (by EGID): ${buildingGroups.size}`);
                    console.log(`  - Buildings processed by Method 3: ${buildingsProcessedCount}`);
                    console.log(`  - Simulations per building: ${numSimulations}`);
                    console.log(`  - Expected total Method 3 points: ${buildingsProcessedCount * numSimulations}`);
                    console.log(`  - Actual Method 3 points generated: ${window.method3Results?.length || 0}`);
                    
                    // Check if the numbers match
                    const expectedPoints = buildingsProcessedCount * numSimulations;
                    const actualPoints = window.method3Results?.length || 0;
                    if (expectedPoints === actualPoints) {
                        console.log(`  ✅ Method 3 point count verification: PASSED`);
                    } else {
                        console.warn(`  ⚠️ Method 3 point count verification: FAILED (expected ${expectedPoints}, got ${actualPoints})`);
                    }
                }
                // ================= END CAT MODEL METHOD 3 =================

                
                // ===============================================================================
                // ================= CAT MODEL METHOD 4, 5 and 6 - MONTE CARLO SIMULATIONS ================
                // ===============================================================================

                console.log('🎲 Starting CAT Model Method 4, 5 and 6 Monte Carlo Analysis...');
                console.log(`🎲 Using same Poisson-distributed simulation count: ${numSimulations}`);

                // CAT Model - Method 4 Monte Carlo Simulations (Return Period & Hazard Intensity)
                console.log('\n🎯 === CAT Model Method 4 Analysis ===');
                
                // Method 4 iterates through ALL buildings analyzed (not unique like Method 3)
                // Each building row represents a specific return period and hazard intensity
                if (window.latestExtractionResults && window.latestExtractionResults.buildingsAnalyzed) {
                    const allBuildings = window.latestExtractionResults.buildingsAnalyzed;
                    
                    // Clear Method 4 results before starting new analysis
                    window.method4Results = [];
                    window.method4ResultsByLevel = {};
                    console.log('🔄 Cleared Method 4 results for new analysis');
                    
                    console.log(`Processing Method 4 for ${allBuildings.length} building rows (including different return periods)...`);
                    
                    // Process each building row with Method 4
                    allBuildings.forEach((building, index) => {
                        const props = building.buildingProperties || {};
                        const buildCost = building.TOTAL_COST || props.TOTAL_COST || 1000000;
                        
                        // Extract EGID for building identification
                        const egid = building.EGID || props.EGID || `building_${index + 1}`;
                        
                        // Try both locations for GKLAS (direct on building or in buildingProperties)
                        const gklas = building.GKLAS || props.GKLAS;
                        
                        // Get hazard intensity directly from building object
                        const hazardIntensity = building.intensity || 'aucune atteinte'; // default to no hazard
                        
                        // Extract return period from recurrence field
                        let returnPeriod = 100; // default
                        if (building.recurrence) {
                            const match = String(building.recurrence).match(/\d+/);
                            if (match) {
                                returnPeriod = parseInt(match[0]);
                            }
                        }
                        
                        // Calculate spatial probability for this specific building based on its return period
                        let spatialProb = 0.03; // Default fallback for rockfall
                        if (returnPeriod && typeof window.spatialHazardProbValdorisk === 'function') {
                            spatialProb = window.spatialHazardProbValdorisk(returnPeriod, hazardType) || 0.03;
                            console.log(`🎯 Method 4 - Building ${index + 1}: Return period ${returnPeriod}, Spatial probability: ${spatialProb}`);
                        }
                        
                        console.log(`Method 4 - Processing building ${index + 1}/${allBuildings.length} (Intensity: ${hazardIntensity}, Return period: ${returnPeriod}, GKLAS: ${gklas}, spatial prob: ${spatialProb})`);
                        
                        // Call Method 4 for this building row
                        if (typeof window.method4CatModel === 'function') {
                            console.log(`🔍 Calling Method 4 for building ${index + 1} with:`);
                            console.log(`  - numSimulations: ${numSimulations} (type: ${typeof numSimulations})`);
                            console.log(`  - hazardIntensity: ${hazardIntensity}`);
                            console.log(`  - buildCost: ${buildCost}`);
                            console.log(`  - spatialProb: ${spatialProb}`);
                            
                            const method4Result = window.method4CatModel(
                                hazardType,
                                buildCost,
                                spatialProb,
                                numSimulations,
                                gklas,
                                returnPeriod,
                                hazardIntensity,  // Pass intensity instead of danger level
                                egid  // Pass building EGID for tracking
                            );
                            
                            if (method4Result) {
                                console.log(`✅ Method 4 completed for building ${index + 1}: ${method4Result.meanDamage.toFixed(2)} CHF (${hazardIntensity} intensity)`);
                                
                                // Store Method 4 results on building object
                                building.METHOD4_RESULTS = method4Result;
                                building.METHOD4_MEAN_DAMAGE = method4Result?.meanDamage || 0;
                                building.METHOD4_HAZARD_INTENSITY = hazardIntensity;
                                building.METHOD4_RETURN_PERIOD = returnPeriod;
                                
                                // Store results by hazard intensity for visualization
                                if (!window.method4ResultsByLevel) {
                                    window.method4ResultsByLevel = {};
                                }
                                
                                // Map hazard intensity to simple group names for consistency
                                let intensityGroup = 'other';
                                if (hazardIntensity === 'aucune atteinte' || !hazardIntensity) {
                                    intensityGroup = 'no_hazard';
                                } else if (hazardIntensity === 'faible') {
                                    intensityGroup = 'low';
                                } else if (hazardIntensity === 'moyenne') {
                                    intensityGroup = 'mean';
                                } else if (hazardIntensity === 'forte') {
                                    intensityGroup = 'high';
                                }
                                
                                if (!window.method4ResultsByLevel[intensityGroup]) {
                                    window.method4ResultsByLevel[intensityGroup] = [];
                                }
                                window.method4ResultsByLevel[intensityGroup].push({
                                    building: index + 1,
                                    buildingId: props.GEBNR || building.id || index,
                                    gklas: gklas,
                                    returnPeriod: returnPeriod,
                                    hazardIntensity: hazardIntensity,
                                    meanDamage: method4Result.meanDamage,
                                    results: method4Result.results
                                });
                                
                                console.log(`🔍 Stored Method 4 results for building ${index + 1} in group ${intensityGroup}: ${method4Result.results.length} simulation points`);
                            }
                        } else {
                            console.warn('⚠️ method4CatModel function not found');
                        }
                    });
                    
                    console.log('✅ Method 4 Monte Carlo analysis completed for all building rows');
                    console.log('🔍 Method 4 Summary:');
                    console.log(`  - Buildings processed: ${allBuildings.length}`);
                    console.log(`  - Simulations per building: ${numSimulations}`);
                    console.log(`  - Expected total points: ${allBuildings.length * numSimulations}`);
                    console.log(`  - Actual global method4Results: ${window.method4Results ? window.method4Results.length : 0} total simulation points`);
                    console.log('  - method4ResultsByLevel structure:', Object.keys(window.method4ResultsByLevel || {}).map(level => `${level}: ${window.method4ResultsByLevel[level].length} buildings`));
                    
                    // Detailed analysis by intensity level
                    if (window.method4ResultsByLevel) {
                        Object.keys(window.method4ResultsByLevel).forEach(level => {
                            const buildings = window.method4ResultsByLevel[level];
                            const totalPoints = buildings.reduce((sum, building) => sum + building.results.length, 0);
                            console.log(`  - ${level}: ${buildings.length} buildings, ${totalPoints} total points`);
                        });
                    }
                    
                    // Update existing Method 3 graphs to include Method 4 data
                    if (window.method3Results && window.method3Results.length > 0) {
                        createCATModelVulnerabilityGraph(); // This will now include Method 4 points
                        // createMethod3ExceedanceGraph(); // Removed - will be called once at end
                    }
                    
                    // Create the new comparison graph
                    createMethodsComparisonGraph();
                    
                    // Create cumulative distribution graphs
                    createIntensityCumulativeGraph();
                    createFrequencyCumulativeGraph();
                    
                    // Create CAT models summary table
                    createCATModelsSummaryTable();
                }

                // CAT Model - Method 5 Monte Carlo Simulations (Return Period Based)
                console.log('\n🎯 === CAT Model Method 5 Analysis ===');
                
                // Method 5 iterates through ALL buildings analyzed (same as Method 4)
                // Each building row represents a specific return period
                if (window.latestExtractionResults && window.latestExtractionResults.buildingsAnalyzed) {
                    const allBuildings = window.latestExtractionResults.buildingsAnalyzed;
                    
                    // Clear Method 5 & 6 results before starting new analysis
                    window.method5Results = [];
                    window.method5ResultsByPeriod = {};
                    window.method6Results = [];
                    window.method6ResultsByPeriod = {};
                    console.log('🔄 Cleared Method 5 & 6 results for new analysis');
                    
                    console.log(`Processing Method 5 & 6 for ${allBuildings.length} building rows (return period + hazard level based)...`);
                    
                    // Process each building row with Method 5
                    allBuildings.forEach((building, index) => {
                        const props = building.buildingProperties || {};
                        const buildCost = building.TOTAL_COST || props.TOTAL_COST || 1000000;
                        
                        // Extract EGID for building identification
                        // Support multiple field names: EGID, egid
                        const egid = building.EGID || props.EGID || building.egid || props.egid || `building_${index + 1}`;
                        
                        // Try both locations for GKLAS (direct on building or in buildingProperties)
                        const gklas = building.GKLAS || props.GKLAS || props.buildingCl || building.buildingCl;
                        
                        // Get hazard intensity for Method 6 (same as Method 4)
                        // Support multiple field names: intensity, intensity_
                        const hazardLevel = building.intensity || building.intensity_ || building.hazardProperties?.intensity || building.hazardProperties?.intensity_ || null; // Method 6 requires hazard level
                        
                        // Extract return period from recurrence field
                        // Support multiple field names: recurrence, return_per, returnPeriod
                        let returnPeriod = 100; // default
                        const recurrenceField = building.recurrence || building.return_per || building.returnPeriod || building.hazardProperties?.return_per || building.hazardProperties?.recurrence;
                        if (recurrenceField) {
                            // If it's already a number, use it directly
                            if (typeof recurrenceField === 'number') {
                                returnPeriod = recurrenceField;
                            } else {
                                // Otherwise extract number from string
                                const match = String(recurrenceField).match(/\d+/);
                                if (match) {
                                    returnPeriod = parseInt(match[0]);
                                }
                            }
                        }
                        
                        // Calculate spatial probability for this specific building based on its return period
                        let spatialProb = 0.03; // Default fallback for rockfall
                        if (returnPeriod && typeof window.spatialHazardProbValdorisk === 'function') {
                            spatialProb = window.spatialHazardProbValdorisk(returnPeriod, hazardType) || 0.03;
                            console.log(`🎯 Method 5 & 6 - Building ${index + 1}: Return period ${returnPeriod}, Spatial probability: ${spatialProb}`);
                        }
                        
                        console.log(`Method 5 & 6 - Processing building ${index + 1}/${allBuildings.length} (Return period: ${returnPeriod}, Hazard level: ${hazardLevel}, GKLAS: ${gklas}, spatial prob: ${spatialProb})`);
                        
                        // Call Method 5 & 6 for this building row
                        if (typeof window.method5And6CatModel === 'function') {
                            console.log(`🔍 Calling Method 5 & 6 for building ${index + 1} with:`);
                            console.log(`  - numSimulations: ${numSimulations} (type: ${typeof numSimulations})`);
                            console.log(`  - returnPeriod: ${returnPeriod}`);
                            console.log(`  - hazardLevel: ${hazardLevel}`);
                            console.log(`  - buildCost: ${buildCost}`);
                            console.log(`  - spatialProb: ${spatialProb}`);
                            
                            const method5And6Result = window.method5And6CatModel(
                                hazardType,
                                buildCost,
                                spatialProb,
                                numSimulations,
                                gklas,
                                returnPeriod,
                                hazardLevel,  // Pass hazard level to enable Method 6
                                egid  // Pass building EGID for tracking
                            );
                            
                            if (method5And6Result && method5And6Result.method5) {
                                const method5Data = method5And6Result.method5;
                                console.log(`✅ Method 5 completed for building ${index + 1}: ${method5Data.meanDamage.toFixed(2)} CHF (${returnPeriod} year return period)`);
                                
                                // Store Method 5 results on building object
                                building.METHOD5_RESULTS = method5Data;
                                building.METHOD5_MEAN_DAMAGE = method5Data?.meanDamage || 0;
                                building.METHOD5_RETURN_PERIOD = returnPeriod;
                                
                                // Store results by return period for visualization
                                if (!window.method5ResultsByPeriod) {
                                    window.method5ResultsByPeriod = {};
                                }
                                
                                // Group by return period
                                const rpGroup = `rp_${returnPeriod}`;
                                
                                if (!window.method5ResultsByPeriod[rpGroup]) {
                                    window.method5ResultsByPeriod[rpGroup] = [];
                                }
                                window.method5ResultsByPeriod[rpGroup].push({
                                    building: index + 1,
                                    buildingId: props.GEBNR || building.id || index,
                                    gklas: gklas,
                                    returnPeriod: returnPeriod,
                                    meanDamage: method5Data.meanDamage,
                                    results: method5Data.results
                                });
                                
                                console.log(`🔍 Stored Method 5 results for building ${index + 1} in group ${rpGroup}: ${method5Data.results.length} simulation points`);
                            }
                            
                            // Handle Method 6 results if available
                            if (method5And6Result && method5And6Result.method6) {
                                const method6Data = method5And6Result.method6;
                                console.log(`✅ Method 6 completed for building ${index + 1}: ${method6Data.meanDamage.toFixed(2)} CHF (${returnPeriod} year return period, ${hazardLevel} hazard level)`);
                                
                                // Store Method 6 results on building object
                                building.METHOD6_RESULTS = method6Data;
                                building.METHOD6_MEAN_DAMAGE = method6Data?.meanDamage || 0;
                                building.METHOD6_RETURN_PERIOD = returnPeriod;
                                building.METHOD6_HAZARD_LEVEL = hazardLevel;
                                
                                // Store results by return period and hazard level for visualization
                                if (!window.method6ResultsByPeriod) {
                                    window.method6ResultsByPeriod = {};
                                }
                                
                                // Group by return period and hazard level
                                const rpHazardGroup = `rp_${returnPeriod}_${hazardLevel}`;
                                
                                if (!window.method6ResultsByPeriod[rpHazardGroup]) {
                                    window.method6ResultsByPeriod[rpHazardGroup] = [];
                                }
                                window.method6ResultsByPeriod[rpHazardGroup].push({
                                    building: index + 1,
                                    buildingId: props.GEBNR || building.id || index,
                                    gklas: gklas,
                                    returnPeriod: returnPeriod,
                                    hazardLevel: hazardLevel,
                                    meanDamage: method6Data.meanDamage,
                                    results: method6Data.results
                                });
                                
                                console.log(`🔍 Stored Method 6 results for building ${index + 1} in group ${rpHazardGroup}: ${method6Data.results.length} simulation points`);
                            }
                        } else {
                            console.warn('⚠️ method5And6CatModel function not found');
                        }
                    });
                    
                    console.log('✅ Method 5 & 6 Monte Carlo analysis completed for all building rows');
                    console.log('🔍 Method 5 Summary:');
                    console.log(`  - Buildings processed: ${allBuildings.length}`);
                    console.log(`  - Simulations per building: ${numSimulations}`);
                    console.log(`  - Expected total points: ${allBuildings.length * numSimulations}`);
                    console.log(`  - Actual global method5Results: ${window.method5Results ? window.method5Results.length : 0} total simulation points`);
                    console.log('  - method5ResultsByPeriod structure:', Object.keys(window.method5ResultsByPeriod || {}).map(level => `${level}: ${window.method5ResultsByPeriod[level].length} buildings`));
                    
                    console.log('🔍 Method 6 Summary:');
                    console.log(`  - Actual global method6Results: ${window.method6Results ? window.method6Results.length : 0} total simulation points`);
                    console.log('  - method6ResultsByPeriod structure:', Object.keys(window.method6ResultsByPeriod || {}).map(level => `${level}: ${window.method6ResultsByPeriod[level].length} buildings`));
                    
                    // Detailed analysis by return period level
                    if (window.method5ResultsByPeriod) {
                        Object.keys(window.method5ResultsByPeriod).forEach(level => {
                            const buildings = window.method5ResultsByPeriod[level];
                            const totalPoints = buildings.reduce((sum, building) => sum + building.results.length, 0);
                            console.log(`  - ${level}: ${buildings.length} buildings, ${totalPoints} total points`);
                        });
                    }
                    
                    // Create/update graphs to include Method 5 & 6 data
                    if (window.method5ResultsByPeriod) {
                        console.log('🎯 Creating graphs with Method 5 data...');
                        // Update exceedance graph to include Method 5 curves
                        // createMethod3ExceedanceGraph(); // Removed - will be called once at end
                        // Update vulnerability graph
                        createCATModelVulnerabilityGraph();
                        // Update comparison graph
                        createMethodsComparisonGraph();
                        
                        // Create cumulative distribution graphs
                        createIntensityCumulativeGraph();
                        createFrequencyCumulativeGraph();
                        
                        // Create CAT models summary table
                        createCATModelsSummaryTable();
                    }
                    
                    if (window.method6ResultsByPeriod && Object.keys(window.method6ResultsByPeriod).length > 0) {
                        console.log('🎯 Creating graphs with Method 6 data...');
                        // Method 6 graphs will be integrated into the same visualization functions
                        // createMethod3ExceedanceGraph(); // Removed - will be called once at end
                        createCATModelVulnerabilityGraph();
                        createMethodsComparisonGraph();
                        
                        // Create cumulative distribution graphs
                        createIntensityCumulativeGraph();
                        createFrequencyCumulativeGraph();
                        
                        // Create CAT models summary table
                        createCATModelsSummaryTable();
                    }
                }

                // execute CAT MODEL functions
                
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
    
    // ============================
    // ANALYSIS RESULTS MODAL
    // ============================
    // Moved to analysis-visualization.js module
    // Function: showAnalysisResultsModal()
    
    function showAnalysisResultsModal(extractionResults) {
        console.log('📊 Showing analysis results modal with data:', extractionResults);
        console.log('📊 Buildings analyzed count:', extractionResults?.buildingsAnalyzed?.length || 0);
        console.log('📊 Buildings inside count:', extractionResults?.buildingsInside?.length || 0);
        
        const modal = document.getElementById('analysis-results-modal');
        if (!modal) {
            console.error('❌ Analysis results modal not found');
            return;
        }
        
        // Populate summary statistics
        populateAnalysisSummary(extractionResults);
        
        // Create AG Grid table with buildings analyzed data
        createAnalysisAGGridTable(extractionResults.buildingsAnalyzed || []);
        
        // Create damage analysis graphs
        createDamageAnalysisGraphs(extractionResults.buildingsAnalyzed || []);
        
        // Show the modal
        modal.style.display = 'block';
        
        // Set up close button handler (remove previous handlers first)
        const closeBtn = document.getElementById('close-analysis-results-modal');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.style.display = 'none';
            };
        }

        // Set up PDF export button handler
        const pdfBtn = document.getElementById('export-results-pdf');
        if (pdfBtn) {
            pdfBtn.onclick = function() {
                exportResultsToPDF(extractionResults);
            };
        }
        
        // Close modal when clicking outside
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    // ============================
    // PDF EXPORT FUNCTIONALITY  
    // ============================
    // PDF export moved to analysis-visualization.js module
    
    function exportResultsToPDF(extractionResults) {
        console.log('📄 Starting enhanced PDF export of analysis results...');
        
        // Show loading indicator
        const pdfBtn = document.getElementById('export-results-pdf');
        const originalText = pdfBtn.textContent;
        pdfBtn.textContent = '⏳ Generating PDF...';
        pdfBtn.disabled = true;

        try {
            // Check if required libraries are available
            console.log('🔍 Checking for jsPDF and html2canvas availability...');
            console.log('window.jsPDF:', typeof window.jsPDF);
            console.log('window.html2canvas:', typeof window.html2canvas);
            
            let jsPDFConstructor = null;
            
            // Try different ways jsPDF might be available
            if (typeof window.jsPDF !== 'undefined') {
                jsPDFConstructor = window.jsPDF;
                console.log('✅ Found window.jsPDF');
            } else if (typeof window.jspdf !== 'undefined') {
                jsPDFConstructor = window.jspdf.jsPDF;
                console.log('✅ Found window.jspdf.jsPDF');
            } else if (typeof jsPDF !== 'undefined') {
                jsPDFConstructor = jsPDF;
                console.log('✅ Found global jsPDF');
            }
            
            if (!jsPDFConstructor) {
                console.error('❌ jsPDF not found in any expected location');
                alert('PDF export library not available. Please ensure jsPDF is loaded.');
                return;
            }

            if (typeof window.html2canvas === 'undefined') {
                console.error('❌ html2canvas not found');
                alert('html2canvas library not available. Please ensure it is loaded.');
                return;
            }

            // Get the modal content to capture
            const modalContent = document.querySelector('#analysis-results-modal .modal-body');
            if (!modalContent) {
                alert('Modal content not found. Please ensure the analysis results modal is open.');
                return;
            }

            console.log('📸 Capturing modal content...');

            // Use html2canvas to capture the modal content
            window.html2canvas(modalContent, {
                scale: 2, // Higher resolution
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: modalContent.scrollWidth,
                height: modalContent.scrollHeight,
                scrollX: 0,
                scrollY: 0
            }).then(canvas => {
                console.log('✅ Modal content captured successfully');
                
                // Create new jsPDF instance
                const pdf = new jsPDFConstructor('p', 'mm', 'a4');
                
                // PDF dimensions
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const contentWidth = pageWidth - 2 * margin;
                const contentHeight = pageHeight - 2 * margin;
                
                // Add title page
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.text('Spatial Analysis Results Report', margin, 20);
                
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                const now = new Date();
                pdf.text(`Generated on: ${now.toLocaleString()}`, margin, 30);
                
                // Add summary info
                if (extractionResults) {
                    pdf.text(`Buildings Analyzed: ${extractionResults.buildingsAnalyzed?.length || 0}`, margin, 40);
                    pdf.text(`Buildings Inside Polygon: ${extractionResults.buildingsInside?.length || 0}`, margin, 47);
                    pdf.text(`Hazard Type: ${window.selectedHazard || 'Not specified'}`, margin, 54);
                }
                
                // Calculate image dimensions to fit the page
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(contentWidth / (imgWidth * 0.264583), contentHeight / (imgHeight * 0.264583)); // Convert px to mm
                
                const finalWidth = imgWidth * 0.264583 * ratio;
                const finalHeight = imgHeight * 0.264583 * ratio;
                
                // Add new page for the captured content
                pdf.addPage();
                
                // Add the captured image
                pdf.addImage(
                    canvas.toDataURL('image/png'),
                    'PNG',
                    margin,
                    margin,
                    finalWidth,
                    finalHeight
                );
                
                // If the content is too tall, we might need multiple pages
                let remainingHeight = finalHeight - contentHeight;
                let pageOffset = contentHeight;
                
                while (remainingHeight > 0) {
                    pdf.addPage();
                    
                    // Create a new canvas for the remaining content
                    const remainingCanvas = document.createElement('canvas');
                    const ctx = remainingCanvas.getContext('2d');
                    remainingCanvas.width = canvas.width;
                    remainingCanvas.height = Math.min(canvas.height - (pageOffset / 0.264583 / ratio), canvas.height);
                    
                    ctx.drawImage(
                        canvas,
                        0, pageOffset / 0.264583 / ratio,
                        canvas.width, remainingCanvas.height,
                        0, 0,
                        canvas.width, remainingCanvas.height
                    );
                    
                    const nextPageHeight = Math.min(remainingHeight, contentHeight);
                    pdf.addImage(
                        remainingCanvas.toDataURL('image/png'),
                        'PNG',
                        margin,
                        margin,
                        finalWidth,
                        nextPageHeight
                    );
                    
                    remainingHeight -= contentHeight;
                    pageOffset += contentHeight;
                }
                
                // Save the PDF
                const filename = `spatial_analysis_results_${now.toISOString().split('T')[0]}.pdf`;
                pdf.save(filename);
                
                console.log('✅ Enhanced PDF export completed successfully');
                alert('PDF exported successfully with all tables and graphs!');
                
            }).catch(error => {
                console.error('❌ Error capturing modal content:', error);
                alert('Failed to capture modal content. Falling back to text-only PDF...');
                
                // Fallback to simple text-based PDF
                createSimpleTextPDF(jsPDFConstructor, extractionResults);
            });
            
        } catch (error) {
            console.error('❌ PDF export failed:', error);
            alert('PDF export failed. Please check the console for details.');
        } finally {
            // Restore button
            if (pdfBtn) {
                pdfBtn.textContent = originalText;
                pdfBtn.disabled = false;
            }
        }
    }

    // Fallback function for simple text-based PDF
    function createSimpleTextPDF(jsPDFConstructor, extractionResults) {
        console.log('📄 Creating fallback text-based PDF...');
        
        const pdf = new jsPDFConstructor('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;
        let yPosition = margin;
        
        // Title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Spatial Analysis Results Report', margin, yPosition);
        yPosition += 10;
        
        // Date and time
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const now = new Date();
        pdf.text(`Generated on: ${now.toLocaleString()}`, margin, yPosition);
        yPosition += 15;
        
        // Summary Statistics
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary Statistics', margin, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        if (extractionResults) {
            const summary = [
                `Buildings Analyzed: ${extractionResults.buildingsAnalyzed?.length || 0}`,
                `Buildings Inside Polygon: ${extractionResults.buildingsInside?.length || 0}`,
                `Hazard Type: ${window.selectedHazard || 'Not specified'}`,
                `Analysis Date: ${now.toLocaleDateString()}`
            ];
            
            summary.forEach(line => {
                pdf.text(line, margin, yPosition);
                yPosition += 6;
            });
        }
        
        // Save the fallback PDF
        const filename = `spatial_analysis_results_${new Date().toISOString().split('T')[0]}_simple.pdf`;
        pdf.save(filename);
        
        console.log('✅ Fallback PDF created successfully');
    }
    
    // ============================
    // ANALYSIS SUMMARY - MODULAR ARCHITECTURE
    // ============================
    // Analysis summary moved to analysis-visualization.js module
    
    function populateAnalysisSummary(extractionResults) {
        const summaryContent = document.getElementById('analysis-summary-content');
        if (!summaryContent) return;
        
        const buildingsInside = extractionResults.buildingsInside || [];
        const buildingsAnalyzed = extractionResults.buildingsAnalyzed || [];
        const hazardsInside = extractionResults.hazardsInside || [];
        
        // Calculate statistics - distinguish between unique buildings and building-hazard combinations
        const totalBuildings = buildingsInside.length;
        const buildingHazardCombinations = buildingsAnalyzed.length;
        
        // Count unique buildings in buildingsAnalyzed by EGID
        const uniqueBuildingsInAnalyzed = new Set();
        buildingsAnalyzed.forEach(building => {
            const egid = building.buildingProperties?.EGID || building.originalBuildingId || 'unknown';
            uniqueBuildingsInAnalyzed.add(egid);
        });
        const uniqueBuildingsWithHazard = uniqueBuildingsInAnalyzed.size;
        const buildingsNoHazard = totalBuildings - uniqueBuildingsWithHazard;
        const hazardCoverage = totalBuildings > 0 ? ((uniqueBuildingsWithHazard / totalBuildings) * 100).toFixed(1) : 0;
        
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
                    <p><strong>Unique Buildings with Hazard Exposure:</strong> ${uniqueBuildingsWithHazard}</p>
                    <p><strong>Buildings with No Hazard:</strong> ${buildingsNoHazard}</p>
                    <p><strong>Total Hazard Features:</strong> ${hazardsInside.length}</p>
                    <hr>
                    <p><small><strong>Building-Hazard Combinations:</strong> ${buildingHazardCombinations} entries</small></p>
                    <p><small class="text-muted">Note: Buildings may have multiple hazard exposures, creating more combinations than unique buildings.</small></p>
                </div>
                <div class="col-md-6">
                    <h5>🚨 Intensity Distribution</h5>
                    ${Object.keys(intensityCount).map(intensity => 
                        `<p><strong>${intensity}:</strong> ${intensityCount[intensity]} building-hazard combinations</p>`
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
    
    // ============================
    // AG GRID TABLE - MODULAR ARCHITECTURE
    // ============================
    // AG Grid functionality moved to analysis-visualization.js module
    
    function createAnalysisAGGridTable(buildingsAnalyzed) {
        console.log('📊 Creating AG Grid table with buildings analyzed data (Updated version - no deprecated props):', buildingsAnalyzed);
        console.log('📊 Number of buildings to display:', buildingsAnalyzed?.length || 0);
        console.log('📊 First building sample:', buildingsAnalyzed?.[0] || 'No data');
        
        const gridContainer = document.getElementById('analysis-ag-grid');
        if (!gridContainer) {
            console.error('❌ AG Grid container not found');
            return;
        }
        
        // Clear any existing grid
        gridContainer.innerHTML = '';
        
        if (!buildingsAnalyzed || buildingsAnalyzed.length === 0) {
            console.warn('⚠️ No buildings analyzed data available');
            gridContainer.innerHTML = 
                '<div class="text-center p-4"><h5>No buildings with hazard intersections found</h5><p>Try running the analysis again or check if buildings and hazards overlap.</p></div>';
            return;
        }
        
        // Filter out buildings with "aucune_atteinte" intensity for cleaner analysis
        const buildingsToShow = buildingsAnalyzed.filter(building => {
            const intensity = building.intensity || building.hazardIntensity || 'Unknown';
            return intensity !== 'aucune_atteinte';
        });
        
        console.log(`📊 Showing ${buildingsToShow.length} buildings analyzed (filtered out "aucune_atteinte")`);
        
        // Count different intensity types for logging
        const intensityCounts = {};
        buildingsToShow.forEach(building => {
            const intensity = building.intensity || building.hazardIntensity || 'Unknown';
            intensityCounts[intensity] = (intensityCounts[intensity] || 0) + 1;
        });
        console.log(`📊 Intensity distribution:`, intensityCounts);
        
        // Prepare row data for AG Grid using all buildings
        const rowData = buildingsToShow.map((building, index) => {
            // Extract temporal hazard probability with robust access
            let temporalHazardProbValue = 'N/A';
            
            if (building.TEMPORAL_HAZARD_PROB !== undefined && building.TEMPORAL_HAZARD_PROB !== null) {
                temporalHazardProbValue = building.TEMPORAL_HAZARD_PROB;
            } else if (building?.recurrence && window.temporaHazardProbability && window.selectedHazard) {
                // Fallback: calculate on-the-fly if stored value not accessible
                const returnPeriod = parseInt(String(building.recurrence).match(/\d+/)?.[0]);
                if (returnPeriod) {
                    temporalHazardProbValue = window.temporaHazardProbability(window.selectedHazard, returnPeriod) || 'N/A';
                }
            }

            // Extract spatial hazard probability with robust access
            let spatialHazardProbValue = 'N/A';
            
            if (building.SPATIAL_HAZARD_PROB !== undefined && building.SPATIAL_HAZARD_PROB !== null) {
                spatialHazardProbValue = building.SPATIAL_HAZARD_PROB;
            } else if (building?.recurrence && typeof window.spatialHazardProbValdorisk === 'function' && window.selectedHazard) {
                // Fallback: calculate on-the-fly if stored value not accessible
                const returnPeriod = parseInt(String(building.recurrence).match(/\d+/)?.[0]);
                if (returnPeriod) {
                    spatialHazardProbValue = window.spatialHazardProbValdorisk(returnPeriod, window.selectedHazard) || 'N/A';
                }
            }

            // Extract vulnerability with robust access
            let vulnerabilityValue = 'N/A';
            
            if (building.VULNERABILITY !== undefined && building.VULNERABILITY !== null) {
                vulnerabilityValue = building.VULNERABILITY;
            } else if (building?.buildingProperties?.GKLAS || building?.buildingProperties?.buildingCl || building?.GKLAS || building?.buildingCl) {
                // Check if we have both building class and intensity (with any field name)
                const hasIntensity = building?.intensity || building?.intensity_ || building?.hazardProperties?.intensity || building?.hazardProperties?.intensity_;
                
                if (hasIntensity && window.buildings) {
                    // Fallback: calculate on-the-fly if stored value not accessible
                    // Support multiple field names: GKLAS, buildingCl
                    const buildingClass = building.buildingProperties?.GKLAS || building.buildingProperties?.buildingCl || building.GKLAS || building.buildingCl;
                    const buildingInfo = window.buildings.find(b => 
                        b.classes && b.classes.includes(String(buildingClass))
                    );
                    
                    if (buildingInfo && buildingInfo.vulnerabilite) {
                        // Support multiple field names: intensity, intensity_
                        const intensityValue = building.intensity || building.intensity_ || building.hazardProperties?.intensity || building.hazardProperties?.intensity_;
                        if (intensityValue) {
                            const intensity = String(intensityValue).toLowerCase();
                            let intensityKey = null;
                            
                            if (intensity.includes('faible') || intensity.includes('low')) {
                                intensityKey = 'faible';
                            } else if (intensity.includes('moyenne') || intensity.includes('medium') || intensity.includes('mean')) {
                                intensityKey = 'moyenne';
                            } else if (intensity.includes('forte') || intensity.includes('high')) {
                                intensityKey = 'forte';
                            }
                            
                            if (intensityKey && buildingInfo.vulnerabilite[intensityKey] !== undefined) {
                                vulnerabilityValue = buildingInfo.vulnerabilite[intensityKey];
                            }
                        }
                    }
                }
            }

            // Extract damage with robust access
            let damageValue = 'N/A';
            
            if (building.DAMAGE !== undefined && building.DAMAGE !== null) {
                damageValue = building.DAMAGE;
            } else {
                // Fallback: calculate on-the-fly if stored value not accessible
                const temporalProb = temporalHazardProbValue;
                const spatialProb = spatialHazardProbValue;
                const vuln = vulnerabilityValue;
                const cost = building.buildingProperties?.TOTAL_COST;
                
                // Check if all values are available and numeric
                if (temporalProb !== 'N/A' && temporalProb !== null && temporalProb !== undefined && !isNaN(temporalProb) &&
                    spatialProb !== 'N/A' && spatialProb !== null && spatialProb !== undefined && !isNaN(spatialProb) &&
                    vuln !== 'N/A' && vuln !== null && vuln !== undefined && !isNaN(vuln) &&
                    cost !== 'N/A' && cost !== null && cost !== undefined && !isNaN(cost)) {
                    
                    damageValue = parseFloat(temporalProb) * parseFloat(spatialProb) * parseFloat(vuln) * parseFloat(cost);
                }
            }

            // Extract vulnerability literature with robust access
            let vulnerabilityLiteratureValue = 'N/A';
            
            if (building.VULNERABILITY_LITERATURE !== undefined && building.VULNERABILITY_LITERATURE !== null) {
                vulnerabilityLiteratureValue = building.VULNERABILITY_LITERATURE;
            } else if (window.selectedHazard && typeof vulBorterBart === 'function') {
                // Fallback: calculate on-the-fly if stored value not accessible
                let constructionYear = building.buildingProperties?.GBAUJ;
                
                // If construction year not present, use construction period year
                if (!constructionYear || constructionYear === 'N/A' || constructionYear === null || constructionYear === undefined) {
                    constructionYear = building.buildingProperties?.GBAUP_YEAR;
                }
                
                // If construction period year is also null/not present, use 1960
                if (!constructionYear || constructionYear === 'N/A' || constructionYear === null || constructionYear === undefined) {
                    constructionYear = 1960;
                }
                
                const year = parseInt(constructionYear);
                
                // Map hazard type
                let hazard = null;
                if (window.selectedHazard === 'rockfall' || window.selectedHazard === 'rock-fall' || window.selectedHazard === 'rock_fall') {
                    hazard = 'rock_fall';
                } else if (window.selectedHazard === 'debris_flow' || window.selectedHazard === 'debrisflow' || window.selectedHazard === 'debris-flow') {
                    hazard = 'debris_flow';
                }
                
                // Map intensity level
                // Support multiple field names: intensity, intensity_
                const intensityValueGrid = building.intensity || building.intensity_ || building.hazardProperties?.intensity || building.hazardProperties?.intensity_;
                let intensityLevel = null;
                if (intensityValueGrid) {
                    const intensity = String(intensityValueGrid).toLowerCase();
                    if (intensity.includes('faible') || intensity.includes('low')) {
                        intensityLevel = 'low';
                    } else if (intensity.includes('moyenne') || intensity.includes('medium') || intensity.includes('mean')) {
                        intensityLevel = 'mean';
                    } else if (intensity.includes('forte') || intensity.includes('high')) {
                        intensityLevel = 'high';
                    }
                }
                
                // Calculate if all parameters are valid
                if (hazard && !isNaN(year) && intensityLevel) {
                    vulnerabilityLiteratureValue = vulBorterBart(hazard, year, intensityLevel);
                }
            }

            // Extract damage literature with robust access
            let damageLiteratureValue = 'N/A';
            
            if (building.DAMAGE_LITERATURE !== undefined && building.DAMAGE_LITERATURE !== null) {
                damageLiteratureValue = building.DAMAGE_LITERATURE;
            } else {
                // Fallback: calculate on-the-fly if stored value not accessible
                const temporalProbLit = temporalHazardProbValue;
                const spatialProbLit = spatialHazardProbValue;
                const vulnLit = vulnerabilityLiteratureValue;
                const costLit = building.buildingProperties?.TOTAL_COST;
                
                // Check if all values are available and numeric
                if (temporalProbLit !== 'N/A' && temporalProbLit !== null && temporalProbLit !== undefined && !isNaN(temporalProbLit) &&
                    spatialProbLit !== 'N/A' && spatialProbLit !== null && spatialProbLit !== undefined && !isNaN(spatialProbLit) &&
                    vulnLit !== 'N/A' && vulnLit !== null && vulnLit !== undefined && !isNaN(vulnLit) &&
                    costLit !== 'N/A' && costLit !== null && costLit !== undefined && !isNaN(costLit)) {
                    
                    damageLiteratureValue = parseFloat(temporalProbLit) * parseFloat(spatialProbLit) * parseFloat(vulnLit) * parseFloat(costLit);
                }
            }
            
            // Try different ways to access the value
            if (building.TEMPORAL_HAZARD_PROB !== undefined && building.TEMPORAL_HAZARD_PROB !== null) {
                temporalHazardProbValue = building.TEMPORAL_HAZARD_PROB;
                // console.log(`✅ AG Grid Row ${index + 1}: Found TEMPORAL_HAZARD_PROB = ${temporalHazardProbValue}`);
            } else if (building['TEMPORAL_HAZARD_PROB'] !== undefined && building['TEMPORAL_HAZARD_PROB'] !== null) {
                temporalHazardProbValue = building['TEMPORAL_HAZARD_PROB'];
                // console.log(`✅ AG Grid Row ${index + 1}: Found via bracket notation = ${temporalHazardProbValue}`);
            } else {
                // console.log(`❌ AG Grid Row ${index + 1}: TEMPORAL_HAZARD_PROB not found`);
                // console.log(`🔍 Available building keys:`, Object.keys(building));
                // console.log(`🔍 Building recurrence:`, building.recurrence);
                
                // Fallback: calculate on the fly
                if (building?.recurrence && window.temporaHazardProbability && window.selectedHazard) {
                    const returnPeriod = parseInt(String(building.recurrence).match(/\d+/)?.[0]);
                    if (returnPeriod) {
                        temporalHazardProbValue = window.temporaHazardProbability(window.selectedHazard, returnPeriod) || 'N/A';
                        console.log(`🔄 AG Grid Row ${index + 1}: Calculated on-the-fly = ${temporalHazardProbValue}`);
                    }
                }
            }
            
            // Debug: Log temporal hazard prob for first few buildings
            if (index < 5) {
                console.log(`📊 AG Grid Row ${index + 1}: temporalHazardProbValue = ${temporalHazardProbValue} (type: ${typeof temporalHazardProbValue})`);
                console.log(`📊 AG Grid Row ${index + 1}: recurrence = ${building.recurrence}`);
                console.log(`📊 AG Grid Row ${index + 1}: building ID = ${building.buildingProperties?.EGID || building.originalBuildingId}`);
                
                // CRITICAL: Check exactly what's in the building object
                console.log(`🔎 AG Grid Building ${index + 1} TEMPORAL_HAZARD_PROB check:`);
                console.log(`  - Direct access: building.TEMPORAL_HAZARD_PROB =`, building.TEMPORAL_HAZARD_PROB);
                console.log(`  - Has property?`, building.hasOwnProperty('TEMPORAL_HAZARD_PROB'));
                console.log(`  - Object keys containing TEMPORAL:`, Object.keys(building).filter(k => k.includes('TEMPORAL')));
                
                // DEBUG: Compare expected vs actual value for RP 30, 300, 100
                const expectedValue = building.recurrence === 30 ? 0.02333 : 
                                     building.recurrence === 300 ? 0.00333 : 
                                     building.recurrence === 100 ? 0.00667 : 'unknown';
                console.log(`🔎 AG Grid Row ${index + 1}: Expected value for RP ${building.recurrence} = ${expectedValue}, Actual = ${temporalHazardProbValue}`);
                
                // DEBUG: Check spatial hazard probability
                console.log(`🔎 AG Grid Building ${index + 1} SPATIAL_HAZARD_PROB check:`);
                console.log(`  - Direct access: building.SPATIAL_HAZARD_PROB =`, building.SPATIAL_HAZARD_PROB);
                console.log(`  - Has property?`, building.hasOwnProperty('SPATIAL_HAZARD_PROB'));
                console.log(`  - Object keys containing SPATIAL:`, Object.keys(building).filter(k => k.includes('SPATIAL')));
                
                // DEBUG: Compare expected spatial values for rockfall RP 30, 300, 100
                const expectedSpatialValue = building.recurrence === 30 ? 0.01 : 
                                            building.recurrence === 300 ? 0.05 : 
                                            building.recurrence === 100 ? 0.03 : 'unknown';
                console.log(`🔎 AG Grid Row ${index + 1}: Expected spatial value for RP ${building.recurrence} = ${expectedSpatialValue}, Actual = ${spatialHazardProbValue}`);
            }
            
            // Debug: Log temporal hazard prob for first few buildings
            if (index < 5) {
                console.log(`� AG Grid Row ${index + 1}: temporalHazardProbValue = ${temporalHazardProbValue} (type: ${typeof temporalHazardProbValue})`);
                console.log(`📊 AG Grid Row ${index + 1}: recurrence = ${building.recurrence}`);
            }
            
            const rowObject = {
                index: index + 1,
                
                // Building Identification
                // Support multiple field names: EGID, egid
                egid: building.buildingProperties?.EGID || building.buildingProperties?.egid || building.EGID || building.egid || 'N/A',
                
                // Location Information
                canton: building.buildingProperties?.GDEKT || building.buildingProperties?.canton || building.canton || 'N/A',
                communeName: building.buildingProperties?.GGDENAME || building.buildingProperties?.municipa_1 || building.municipa_1 || 'N/A',
                
                // Coordinates
                coordinateE: building.buildingProperties?.GKODE || 'N/A',
                coordinateN: building.buildingProperties?.GKODN || 'N/A',
                
                // Building Characteristics
                buildingCategory: building.buildingProperties?.GKAT || building.buildingProperties?.buildingCa || building.buildingCa || 'N/A',
                buildingClass: building.buildingProperties?.GKLAS || building.buildingProperties?.buildingCl || building.GKLAS || building.buildingCl || 'N/A',
                buildingDescription: building.buildingProperties?.DESCRIPTION || 'N/A',
                
                // Construction Information
                constructionYear: building.buildingProperties?.GBAUJ || 'N/A',
                constructionPeriod: building.buildingProperties?.GBAUP || 'N/A',
                constructionPeriodYear: building.buildingProperties?.GBAUP_YEAR || 'N/A',
                
                // Physical Characteristics
                buildingArea: building.buildingProperties?.GAREA || 'N/A',
                buildingVolume: building.buildingProperties?.GVOL || 'N/A',
                numberOfFloors: building.buildingProperties?.GASTW || 'N/A',
                numberOfApartments: building.buildingProperties?.GANZWHG || 'N/A',
                
                // Cost Information
                baseCost: building.buildingProperties?.BASE_COST || 'N/A',
                costUnits: building.buildingProperties?.COST_UNITS || 'N/A',
                totalCost: building.buildingProperties?.TOTAL_COST || 'N/A',
                
                // Hazard Analysis
                // Support multiple field names for intensity and recurrence
                hazardType: building.hazardType || 'N/A',
                hazardIntensity: building.intensity || building.intensity_ || building.hazardProperties?.intensity || building.hazardProperties?.intensity_ || 'None',
                hazardRecurrence: building.recurrence || building.return_per || building.returnPeriod || building.hazardProperties?.return_per || building.hazardProperties?.recurrence || 'None',
                temporalHazardProb: temporalHazardProbValue,
                spatialHazardProb: spatialHazardProbValue,
                vulnerability: vulnerabilityValue,
                damage: damageValue,
                vulnerabilityLiterature: vulnerabilityLiteratureValue,
                damageLiterature: damageLiteratureValue,
                
                // Analysis Metadata
                exportDate: building.buildingProperties?.GEXPDAT || 'N/A'
            };
            
            // Debug: Log the complete row object for first few buildings
            if (index < 5) {
                console.log(`🎯 AG Grid Row ${index + 1} complete object:`, rowObject);
                console.log(`🎯 AG Grid Row ${index + 1} temporalHazardProb in object:`, rowObject.temporalHazardProb);
                console.log(`🎯 AG Grid Row ${index + 1} spatialHazardProb in object:`, rowObject.spatialHazardProb);
                console.log(`🎯 AG Grid Row ${index + 1} vulnerability in object:`, rowObject.vulnerability);
                console.log(`🎯 AG Grid Row ${index + 1} damage in object:`, rowObject.damage);
                console.log(`🎯 AG Grid Row ${index + 1} vulnerabilityLiterature in object:`, rowObject.vulnerabilityLiterature);
            }
            
            return rowObject;
        });
        
        console.log('📊 Prepared row data length:', rowData.length);
        console.log('📊 First 3 rows temporal hazard probs:', 
            rowData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${row.temporalHazardProb}`));
        console.log('📊 First 3 rows spatial hazard probs:', 
            rowData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${row.spatialHazardProb}`));
        console.log('📊 First 3 rows vulnerabilities:', 
            rowData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${row.vulnerability}`));
        console.log('📊 First 3 rows damages:', 
            rowData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${row.damage}`));
        console.log('📊 First 3 rows vulnerability literature:', 
            rowData.slice(0, 3).map((row, i) => `Row ${i + 1}: ${row.vulnerabilityLiterature}`));
        console.log('📊 First row complete sample:', rowData[0]);
        
        // Define column definitions
        const columnDefs = [
            // Basic Info
            {
                headerName: 'Index',
                field: 'index',
                cellStyle: { fontWeight: 'bold' }
            },
            {
                headerName: 'EGID',
                field: 'egid',
                width: 100,
                pinned: 'left',
                filter: 'agTextColumnFilter',
                cellStyle: { fontWeight: 'bold', backgroundColor: '#f8f9fa' }
            },
            
            // Location Information
            {
                headerName: 'Canton',
                field: 'canton',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Commune Name',
                field: 'communeName',
                filter: 'agTextColumnFilter',
                tooltipField: 'communeName'
            },
            
            // Coordinates
            {
                headerName: 'Coordinate E',
                field: 'coordinateE',
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toFixed(2) : 'N/A'
            },
            {
                headerName: 'Coordinate N',
                field: 'coordinateN',
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toFixed(2) : 'N/A'
            },
            
            // Building Characteristics
            {
                headerName: 'Building Category',
                field: 'buildingCategory',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Building Class',
                field: 'buildingClass',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Building Description',
                field: 'buildingDescription',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#e8f5e8', fontWeight: 'bold' }
            },
            
            // Construction Information
            {
                headerName: 'Construction Year',
                field: 'constructionYear',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Construction Period Code',
                field: 'constructionPeriod',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Construction Period Year',
                field: 'constructionPeriodYear',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#e7f3ff', fontWeight: 'bold' }
            },
            
            // Physical Characteristics
            {
                headerName: 'Area (m²)',
                field: 'buildingArea',
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toLocaleString() : 'N/A'
            },
            {
                headerName: 'Volume (m³)',
                field: 'buildingVolume',
                filter: 'agTextColumnFilter',
                valueFormatter: params => params.value !== 'N/A' ? Number(params.value).toLocaleString() : 'N/A'
            },
            {
                headerName: 'Number of Floors',
                field: 'numberOfFloors',
                filter: 'agTextColumnFilter'
            },
            {
                headerName: 'Number of Apartments',
                field: 'numberOfApartments',
                filter: 'agTextColumnFilter'
            },
            
            // Cost Information
            {
                headerName: 'Base Cost',
                field: 'baseCost',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff4e6', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || params.value === 'Unknown' || params.value === 'No class info') return params.value;
                    return Number(params.value).toLocaleString();
                }
            },
            {
                headerName: 'Cost Units',
                field: 'costUnits',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff4e6' }
            },
            {
                headerName: 'Total Cost (CHF)',
                field: 'totalCost',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#e6f7ff', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || params.value === 'Unknown' || params.value === 'No class info') return params.value;
                    return Number(params.value).toLocaleString();
                }
            },
            
            // Hazard Information
            {
                headerName: 'Hazard Type',
                field: 'hazardType',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff3cd' }
            },
            {
                headerName: 'Hazard Intensity',
                field: 'hazardIntensity',
                filter: 'agTextColumnFilter',
                cellStyle: params => {
                    const intensity = params.value?.toLowerCase();
                    if (intensity?.includes('forte') || intensity?.includes('high')) {
                        return { backgroundColor: '#f8d7da', fontWeight: 'bold', color: '#721c24' };
                    } else if (intensity?.includes('moyenne') || intensity?.includes('medium')) {
                        return { backgroundColor: '#cfe2ff', fontWeight: 'bold', color: '#084298' };
                    } else if (intensity?.includes('faible') || intensity?.includes('low')) {
                        return { backgroundColor: '#fff3cd', fontWeight: 'bold', color: '#856404' };
                    }
                    return { backgroundColor: '#f8f9fa' };
                }
            },
            {
                headerName: 'Hazard Recurrence',
                field: 'hazardRecurrence',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#fff3cd' }
            },
            {
                headerName: 'Temporal Hazard Probability',
                field: 'temporalHazardProb',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#e8f5e8', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toFixed(5);
                }
            },
            {
                headerName: 'Spatial Hazard Probability',
                field: 'spatialHazardProb',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#ffe8e8', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toFixed(5);
                }
            },
            {
                headerName: 'Vulnerability (EconoMe)',
                field: 'vulnerability',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#e8e8ff', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toFixed(3);
                }
            },
            {
                headerName: 'Damage (EconoMe)',
                field: 'damage',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#ffe8f0', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toLocaleString('en-CH', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }) + ' CHF';
                }
            },
            {
                headerName: 'Vulnerability (Literature)',
                field: 'vulnerabilityLiterature',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#f0f8ff', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toFixed(3);
                }
            },
            {
                headerName: 'Damage (Literature)',
                field: 'damageLiterature',
                filter: 'agTextColumnFilter',
                cellStyle: { backgroundColor: '#f8f0ff', fontWeight: 'bold' },
                valueFormatter: params => {
                    if (params.value === 'N/A' || isNaN(params.value)) return params.value;
                    return Number(params.value).toLocaleString('en-CH', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }) + ' CHF';
                }
            },
            
            // Metadata
            {
                headerName: 'Export Date',
                field: 'exportDate',
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
                floatingFilter: true,
                minWidth: 100,
                // Remove flex when using autoSizeStrategy
                suppressSizeToFit: false
            },
            pagination: true,
            paginationPageSize: 20, // Use default page size
            paginationPageSizeSelector: [20, 50, 100], // Explicitly set page size options
            rowSelection: {
                mode: 'multiRow',
                enableClickSelection: true
            },
            animateRows: true,
            suppressHorizontalScroll: false, // Allow horizontal scroll if needed
            // Remove autoSizeStrategy to avoid flex conflict
            getRowStyle: params => {
                if (params.node.rowIndex % 2 === 0) {
                    return { backgroundColor: '#f8f9fa' };
                }
                return { backgroundColor: '#ffffff' };
            },
            onGridReady: function(params) {
                console.log('✅ AG Grid ready with', rowData.length, 'rows');
                console.log('📊 Sample row data:', rowData.slice(0, 2));
                
                // Debug: Check what AG Grid actually has as row data
                console.log('🔍 AG Grid internal row data check:');
                params.api.forEachNode((node, index) => {
                    if (index < 3) {
                        console.log(`🔍 AG Grid Node ${index + 1} data:`, node.data);
                        console.log(`🔍 AG Grid Node ${index + 1} temporalHazardProb:`, node.data?.temporalHazardProb);
                    }
                });
                
                // Size columns to fit the grid width
                params.api.sizeColumnsToFit();
                
                // Add resize listener to adjust columns when modal is resized
                const resizeObserver = new ResizeObserver(() => {
                    if (params.api) {
                        params.api.sizeColumnsToFit();
                    }
                });
                resizeObserver.observe(gridContainer);
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
    
    // ============================
    // DETAILED RESULTS DISPLAY
    // ============================
    // Moved to analysis-visualization.js module
    // Function: displayAnalysisResults()
    
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
    
    // ============================
    // DAMAGE ANALYSIS GRAPHS
    // ============================
    // Moved to analysis-visualization.js module
    // Function: createDamageAnalysisGraphs()
    
    function createDamageAnalysisGraphs(buildingsAnalyzed) {
        if (!buildingsAnalyzed || buildingsAnalyzed.length === 0) {
            console.log('⚠️ No buildings analyzed - cannot create damage graphs');
            return;
        }

        console.log('📊 Creating damage analysis graphs...');
        console.log('📊 Buildings data received:', buildingsAnalyzed.length, 'buildings');
        console.log('📊 First building structure:', buildingsAnalyzed[0]);

        // Add a small delay to ensure modal is fully rendered
        setTimeout(() => {
            try {
                // Check if graph containers exist
                const economeContainer = document.getElementById('econome-damage-graph');
                const literatureContainer = document.getElementById('literature-damage-graph');
                
                if (!economeContainer) {
                    console.error('❌ EconoMe graph container not found in DOM');
                    return;
                }
                if (!literatureContainer) {
                    console.error('❌ Literature graph container not found in DOM');
                    return;
                }
                
                console.log('📊 Graph containers found, proceeding with data processing...');

                // Initialize damage totals for different return periods
                const economeDamageTotals = {
                    period30: 0,
                    period100: 0, 
                    period300: 0
                };

                const literatureDamageTotals = {
                    period30: 0,
                    period100: 0,
                    period300: 0
                };

                // Process each building to calculate damage totals by return period
                buildingsAnalyzed.forEach((building, index) => {
                    // Debug first few buildings to understand data structure
                    if (index < 3) {
                        console.log(`📊 Building ${index + 1} data:`, building);
                        console.log(`📊 Building ${index + 1} recurrence properties:`, {
                            recurrence: building.recurrence,
                            hazardRecurrence: building.hazardRecurrence,
                            returnPeriod: building.returnPeriod,
                            return_period: building.return_period
                        });
                        console.log(`📊 Building ${index + 1} damage properties:`, {
                            damage: building.damage,
                            DAMAGE: building.DAMAGE,
                            damageLiterature: building.damageLiterature,
                            DAMAGE_LITERATURE: building.DAMAGE_LITERATURE
                        });
                    }

                    // Get hazard properties for return period identification - try multiple possible field names
                    const returnPeriod = building.recurrence || building.return_per || building.hazardRecurrence || building.returnPeriod || building.return_period || building.hazardProperties?.return_per || building.hazardProperties?.recurrence;
                    
                    // Get damage values - try multiple possible field names
                    const economeDamage = parseFloat(building.damage || building.DAMAGE) || 0;
                    const literatureDamage = parseFloat(building.damageLiterature || building.DAMAGE_LITERATURE) || 0;

                    if (index < 3) {
                        console.log(`📊 Processing building ${index + 1}: period=${returnPeriod}, econome=${economeDamage}, literature=${literatureDamage}`);
                    }

                    // Sum damages by return period
                    if (returnPeriod === 30 || returnPeriod === '30') {
                        economeDamageTotals.period30 += economeDamage;
                        literatureDamageTotals.period30 += literatureDamage;
                    } else if (returnPeriod === 100 || returnPeriod === '100') {
                        economeDamageTotals.period100 += economeDamage;
                        literatureDamageTotals.period100 += literatureDamage;
                    } else if (returnPeriod === 300 || returnPeriod === '300') {
                        economeDamageTotals.period300 += economeDamage;
                        literatureDamageTotals.period300 += literatureDamage;
                    }
                });

                // Calculate totals (sum of all periods)
                const economeTotal = economeDamageTotals.period30 + economeDamageTotals.period100 + economeDamageTotals.period300;
                const literatureTotal = literatureDamageTotals.period30 + literatureDamageTotals.period100 + literatureDamageTotals.period300;

                console.log('📊 Damage totals calculated:');
                console.log('📊 EconoMe totals:', economeDamageTotals);
                console.log('📊 Literature totals:', literatureDamageTotals);
                console.log('📊 EconoMe total sum:', economeTotal);
                console.log('📊 Literature total sum:', literatureTotal);

                // Prepare data for graphs
                const economeDamageValues = [
                    economeDamageTotals.period30,
                    economeDamageTotals.period100,
                    economeDamageTotals.period300,
                    economeTotal
                ];

                const literatureDamageValues = [
                    literatureDamageTotals.period30,
                    literatureDamageTotals.period100,
                    literatureDamageTotals.period300,
                    literatureTotal
                ];

                const returnPeriodLabels = ['T30', 'T100', 'T300', 'TOTAL'];
                const barColors = ['rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(75, 192, 192, 0.7)', 'rgba(255, 194, 152, 0.7)'];

                // Create EconoMe damage graph
                const economeGraphData = [{
                    x: returnPeriodLabels,
                    y: economeDamageValues,
                    type: 'bar',
                    name: 'EconoMe Method',
                    marker: {
                        color: barColors,
                        line: {
                            color: 'rgba(0,0,0,0.2)',
                            width: 1
                        }
                    },
                    text: economeDamageValues.map(val => `${val.toLocaleString('en-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF`),
                    textposition: 'auto'
                }];

                const economeGraphLayout = {
                    title: {
                        text: `Building Damage Costs - EconoMe Method (${window.selectedHazard || 'Unknown Hazard'})`,
                        font: { size: 16 }
                    },
                    xaxis: {
                        title: 'Return Periods and Total',
                        font: { size: 12 }
                    },
                    yaxis: {
                        title: 'Damage Cost (CHF) per year',
                        font: { size: 12 },
                        tickformat: ',.0f'
                    },
                    margin: { l: 80, r: 50, t: 60, b: 60 },
                    showlegend: false,
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)'
                };

                // Create Literature damage graph
                const literatureGraphData = [{
                    x: returnPeriodLabels,
                    y: literatureDamageValues,
                    type: 'bar',
                    name: 'Literature Method',
                    marker: {
                        color: barColors,
                        line: {
                            color: 'rgba(0,0,0,0.2)',
                            width: 1
                        }
                    },
                    text: literatureDamageValues.map(val => `${val.toLocaleString('en-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CHF`),
                    textposition: 'auto'
                }];

                const literatureGraphLayout = {
                    title: {
                        text: `Building Damage Costs - Literature Method (${window.selectedHazard || 'Unknown Hazard'})`,
                        font: { size: 16 }
                    },
                    xaxis: {
                        title: 'Return Periods and Total',
                        font: { size: 12 }
                    },
                    yaxis: {
                        title: 'Damage Cost (CHF) per year',
                        font: { size: 12 },
                        tickformat: ',.0f'
                    },
                    margin: { l: 80, r: 50, t: 60, b: 60 },
                    showlegend: false,
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)'
                };

                // Configuration for responsive graphs
                const graphConfig = {
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d']
                };

                // Create the graphs using Plotly
                console.log('📊 Creating EconoMe graph with data:', economeDamageValues);
                console.log('📊 Creating Literature graph with data:', literatureDamageValues);
                
                Plotly.newPlot('econome-damage-graph', economeGraphData, economeGraphLayout, graphConfig);
                Plotly.newPlot('literature-damage-graph', literatureGraphData, literatureGraphLayout, graphConfig);
                
                console.log('✅ Damage analysis graphs created successfully');
                console.log(`📊 EconoMe totals: T30=${economeDamageTotals.period30.toLocaleString()}, T100=${economeDamageTotals.period100.toLocaleString()}, T300=${economeDamageTotals.period300.toLocaleString()}, Total=${economeTotal.toLocaleString()}`);
                console.log(`📚 Literature totals: T30=${literatureDamageTotals.period30.toLocaleString()}, T100=${literatureDamageTotals.period100.toLocaleString()}, T300=${literatureDamageTotals.period300.toLocaleString()}, Total=${literatureTotal.toLocaleString()}`);
                
            } catch (error) {
                console.error('❌ Error creating damage analysis graphs:', error);
                
                // Create fallback content for the graph containers
                const economeContainer = document.getElementById('econome-damage-graph');
                const literatureContainer = document.getElementById('literature-damage-graph');
                
                if (economeContainer) {
                    economeContainer.innerHTML = 
                        '<div class="text-center p-4 text-danger"><h5>Error creating EconoMe graph</h5><p>' + error.message + '</p></div>';
                }
                if (literatureContainer) {
                    literatureContainer.innerHTML = 
                        '<div class="text-center p-4 text-danger"><h5>Error creating Literature graph</h5><p>' + error.message + '</p></div>';
                }
            }
        }, 100); // 100ms delay to ensure modal is rendered
        
        // Create Method 3 graphs
        createCATModelVulnerabilityGraph();
        createMethod3ExceedanceGraph();
        
        // Create cumulative distribution graphs
        createIntensityCumulativeGraph();
        createFrequencyCumulativeGraph();
        
        // Create CAT models summary table
        createCATModelsSummaryTable();
    }
    
    // Function to create Method 3 vulnerability curves graph
    function createCATModelVulnerabilityGraph() {
        setTimeout(() => {
            const container = document.getElementById('method3-vulnerability-graph');
            if (!container) {
                console.warn('⚠️ Method 3 vulnerability graph container not found');
                return;
            }
            
            console.log('📊 Creating Method 3 vulnerability curves...');
            
            try {
                // Check if vulnerability parameters are available
                if (typeof rockVulnerabilityChanged === 'undefined' && typeof rockVulnerabilityDefaults === 'undefined') {
                    container.innerHTML = '<div class="text-center p-4 text-warning"><h5>Vulnerability data not available</h5></div>';
                    return;
                }
                
                // Create intensity range for curves (0 to 1000 kJ)
                const intensityRange = [];
                for (let i = 0; i <= 1000; i += 5) {
                    intensityRange.push(i);
                }
                
                // Define colors for each class
                const classColors = {
                    class1: '#1f77b4', // blue
                    class2: '#ff7f0e', // orange  
                    class3: '#2ca02c', // green
                    class4: '#d62728'  // red
                };
                
                const traces = [];
                
                // Create vulnerability curves for each class (min, mean, max)
                ['class1', 'class2', 'class3', 'class4'].forEach(classKey => {
                    // Use rockVulnerabilityChanged (user-modified) or fallback to defaults
                    let params = null;
                    if (typeof rockVulnerabilityChanged !== 'undefined' && rockVulnerabilityChanged[classKey]) {
                        params = rockVulnerabilityChanged[classKey];
                    } else if (typeof rockVulnerabilityDefaults !== 'undefined' && rockVulnerabilityDefaults[classKey]) {
                        params = rockVulnerabilityDefaults[classKey];
                    }
                    
                    if (!params) return;
                    const className = `Class ${classKey.replace('class', '')}`;
                    
                    // Calculate curves for min, mean, max using repartTriangle function
                    const meanCurve = [];
                    const minCurve = [];
                    const maxCurve = [];
                    
                    intensityRange.forEach(intensity => {
                        if (typeof repartTriangle === 'function') {
                            meanCurve.push(repartTriangle(intensity, params.mean));
                            minCurve.push(repartTriangle(intensity, params.min));
                            maxCurve.push(repartTriangle(intensity, params.max));
                        } else {
                            // Fallback to reference points interpolation if repartTriangle not available
                            meanCurve.push(0);
                            minCurve.push(0);
                            maxCurve.push(0);
                        }
                    });
                    
                    // Mean curve (solid line)
                    traces.push({
                        x: intensityRange,
                        y: meanCurve,
                        name: `${className} Mean`,
                        type: 'scatter',
                        mode: 'lines',
                        line: {
                            color: classColors[classKey],
                            width: 2
                        },
                        visible: classKey === 'class1' ? true : 'legendonly',
                        legendgroup: classKey
                    });
                    
                    // Min curve (dotted line)
                    traces.push({
                        x: intensityRange,
                        y: minCurve,
                        name: `${className} Min`,
                        type: 'scatter',
                        mode: 'lines',
                        line: {
                            color: classColors[classKey],
                            width: 2,
                            dash: 'dot'
                        },
                        visible: classKey === 'class1' ? true : 'legendonly',
                        legendgroup: classKey,
                        showlegend: false
                    });
                    
                    // Max curve (dashed line)
                    traces.push({
                        x: intensityRange,
                        y: maxCurve,
                        name: `${className} Max`,
                        type: 'scatter',
                        mode: 'lines',
                        line: {
                            color: classColors[classKey],
                            width: 2,
                            dash: 'dash'
                        },
                        visible: classKey === 'class1' ? true : 'legendonly',
                        legendgroup: classKey,
                        showlegend: false
                    });
                    
                    // Add reference points as scatter
                    if (params.intensities && params.vulnerabilities) {
                        traces.push({
                            x: params.intensities,
                            y: params.vulnerabilities,
                            name: `${className} Points`,
                            type: 'scatter',
                            mode: 'markers',
                            marker: {
                                color: classColors[classKey],
                                size: 8,
                                symbol: 'circle-open'
                            },
                            visible: classKey === 'class1' ? true : 'legendonly',
                            legendgroup: classKey,
                            showlegend: false
                        });
                    }
                });
                
                // Add Monte Carlo vulnerability points of method 3
                if (window.method3Results && window.method3Results.length > 0) {
                    const intensities = window.method3Results.map(r => r.intensity);
                    const vulnerabilities = window.method3Results.map(r => r.vulnerability);
                    
                    traces.push({
                        x: intensities,
                        y: vulnerabilities,
                        name: 'Method 3',
                        type: 'scatter',
                        mode: 'markers',
                        marker: {
                            color: '#ff7f0e', // Orange
                            size: 4,
                            opacity: 0.7,
                            symbol: 'circle'
                        },
                        visible: true
                    });
                }
                
                // Add Monte Carlo vulnerability points of method 4 (all hazard intensities combined)
                if (window.method4ResultsByLevel) {
                    console.log('🔍 Method 4 data structure:', window.method4ResultsByLevel);
                    
                    // Combine all Method 4 results from all hazard intensities  
                    const allMethod4Results = [];
                    
                    Object.keys(window.method4ResultsByLevel).forEach(intensityLevel => {
                        console.log(`🔍 Processing intensity level: ${intensityLevel}`, window.method4ResultsByLevel[intensityLevel]);
                        
                        if (window.method4ResultsByLevel[intensityLevel] && window.method4ResultsByLevel[intensityLevel].length > 0) {
                            const levelResults = window.method4ResultsByLevel[intensityLevel].flatMap(building => building.results);
                            console.log(`🔍 Level ${intensityLevel} results:`, levelResults.length);
                            allMethod4Results.push(...levelResults);
                        }
                    });
                    
                    console.log(`🔍 Total Method 4 results: ${allMethod4Results.length}`);
                    
                    if (allMethod4Results.length > 0) {
                        // Filter for non-zero intensity points (keep all of them)
                        const nonZeroResults = allMethod4Results.filter(r => r.intensity > 0);
                        console.log(`🔍 Method 4 non-zero intensity results: ${nonZeroResults.length} (out of ${allMethod4Results.length} total)`);
                        
                        // Use ALL non-zero results (no sampling to ensure complete visualization)
                        console.log(`� Method 4 plotting ALL ${nonZeroResults.length} non-zero data points`);
                        
                        if (nonZeroResults.length > 0) {
                            const intensities = nonZeroResults.map(r => r.intensity);
                            const vulnerabilities = nonZeroResults.map(r => r.vulnerability);
                            
                            console.log('🔍 Method 4 intensities range:', Math.min(...intensities), 'to', Math.max(...intensities));
                            console.log('🔍 Method 4 vulnerabilities range:', Math.min(...vulnerabilities), 'to', Math.max(...vulnerabilities));
                            
                            traces.push({
                                x: intensities,
                                y: vulnerabilities,
                                name: 'Method 4',
                                type: 'scatter',
                                mode: 'markers',
                                marker: {
                                    color: '#d62728', // Red color
                                    size: 3,
                                    opacity: 0.6,
                                    symbol: 'diamond'
                                },
                                visible: true
                            });
                        }
                    }
                }
                
                // Add Monte Carlo vulnerability points of method 5 (all return periods combined)
                if (window.method5ResultsByPeriod) {
                    console.log('🔍 Method 5 data structure:', window.method5ResultsByPeriod);
                    
                    // Combine all Method 5 results from all return periods
                    const allMethod5Results = [];
                    
                    Object.keys(window.method5ResultsByPeriod).forEach(returnPeriod => {
                        console.log(`🔍 Processing return period: ${returnPeriod}`, window.method5ResultsByPeriod[returnPeriod]);
                        
                        if (window.method5ResultsByPeriod[returnPeriod] && window.method5ResultsByPeriod[returnPeriod].length > 0) {
                            const periodResults = window.method5ResultsByPeriod[returnPeriod].flatMap(building => building.results);
                            console.log(`🔍 Return period ${returnPeriod} results:`, periodResults.length);
                            allMethod5Results.push(...periodResults);
                        }
                    });
                    
                    console.log(`🔍 Total Method 5 results: ${allMethod5Results.length}`);
                    
                    if (allMethod5Results.length > 0) {
                        // Filter for non-zero intensity points
                        const nonZeroResults = allMethod5Results.filter(r => r.intensity > 0);
                        console.log(`🔍 Method 5 non-zero intensity results: ${nonZeroResults.length} (out of ${allMethod5Results.length} total)`);
                        
                        // Use ALL non-zero results for complete visualization
                        console.log(`⭐ Method 5 plotting ALL ${nonZeroResults.length} non-zero data points`);
                        
                        if (nonZeroResults.length > 0) {
                            const intensities = nonZeroResults.map(r => r.intensity);
                            const vulnerabilities = nonZeroResults.map(r => r.vulnerability);
                            
                            console.log('🔍 Method 5 intensities range:', Math.min(...intensities), 'to', Math.max(...intensities));
                            console.log('🔍 Method 5 vulnerabilities range:', Math.min(...vulnerabilities), 'to', Math.max(...vulnerabilities));
                            
                            traces.push({
                                x: intensities,
                                y: vulnerabilities,
                                name: 'Method 5',
                                type: 'scatter',
                                mode: 'markers',
                                marker: {
                                    color: '#9467bd', // Purple color
                                    size: 3,
                                    opacity: 0.6,
                                    symbol: 'triangle-up'
                                },
                                visible: true
                            });
                        }
                    }
                }
                
                // Add Monte Carlo vulnerability points of method 6 (all return periods and hazard levels combined)
                if (window.method6ResultsByPeriod) {
                    console.log('🔍 Method 6 data structure:', window.method6ResultsByPeriod);
                    
                    // Combine all Method 6 results from all return periods and hazard levels
                    const allMethod6Results = [];
                    
                    Object.keys(window.method6ResultsByPeriod).forEach(periodHazardKey => {
                        console.log(`🔍 Processing period-hazard group: ${periodHazardKey}`, window.method6ResultsByPeriod[periodHazardKey]);
                        
                        if (window.method6ResultsByPeriod[periodHazardKey] && window.method6ResultsByPeriod[periodHazardKey].length > 0) {
                            const groupResults = window.method6ResultsByPeriod[periodHazardKey].flatMap(building => building.results);
                            console.log(`🔍 Group ${periodHazardKey} results:`, groupResults.length);
                            allMethod6Results.push(...groupResults);
                        }
                    });
                    
                    console.log(`🔍 Total Method 6 results: ${allMethod6Results.length}`);
                    
                    if (allMethod6Results.length > 0) {
                        // Filter for non-zero intensity points
                        const nonZeroResults = allMethod6Results.filter(r => r.intensity > 0);
                        console.log(`🔍 Method 6 non-zero intensity results: ${nonZeroResults.length} (out of ${allMethod6Results.length} total)`);
                        
                        // Use ALL non-zero results for complete visualization
                        console.log(`⭐ Method 6 plotting ALL ${nonZeroResults.length} non-zero data points`);
                        
                        if (nonZeroResults.length > 0) {
                            const intensities = nonZeroResults.map(r => r.intensity);
                            const vulnerabilities = nonZeroResults.map(r => r.vulnerability);
                            
                            console.log('🔍 Method 6 intensities range:', Math.min(...intensities), 'to', Math.max(...intensities));
                            console.log('🔍 Method 6 vulnerabilities range:', Math.min(...vulnerabilities), 'to', Math.max(...vulnerabilities));
                            
                            traces.push({
                                x: intensities,
                                y: vulnerabilities,
                                name: 'Method 6',
                                type: 'scatter',
                                mode: 'markers',
                                marker: {
                                    color: '#8c564b', // Brown color
                                    size: 3,
                                    opacity: 0.6,
                                    symbol: 'triangle-down'
                                },
                                visible: true
                            });
                        }
                    }
                }

                const layout = {
                    title: 'CAT Model Methods - Vulnerability Curves',
                    xaxis: {
                        title: 'Intensity (Energy of impact KJ)',
                        gridcolor: '#eee'
                    },
                    yaxis: {
                        title: 'Vulnerability',
                        range: [0, 1],
                        gridcolor: '#eee'
                    },
                    legend: {
                        orientation: 'h',
                        y: -0.2,
                        groupclick: 'togglegroup'
                    },
                    margin: { t: 60, b: 100, l: 60, r: 60 },
                    plot_bgcolor: '#fafafa',
                    height: 450
                };
                
                Plotly.newPlot(container, traces, layout, {responsive: true});
                console.log('✅ Method 3 vulnerability curves created');
                
            } catch (error) {
                console.error('❌ Error creating Method 3 vulnerability curves:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating vulnerability curves</h5></div>';
            }
        }, 200);
    }
    
    // Function to create Method 3 damage exceedance curve
    function createMethod3ExceedanceGraph() {
        setTimeout(() => {
            const container = document.getElementById('method3-exceedance-graph');
            if (!container) {
                console.warn('⚠️ Method 3 exceedance graph container not found');
                return;
            }
            
            // Clear any existing plot to prevent trace accumulation
            container.innerHTML = '';
            console.log('🧹 Cleared existing exceedance plot traces');
            
            console.log('📊 Creating Method 3 exceedance curve...');
            console.log(`📊 Method 3 results array size: ${window.method3Results?.length || 0} points`);
            
            // Add debugging info for all CAT model data points
            console.log(`🔍 Exceedance Curve Data Summary:`);
            console.log(`  - Method 3 points: ${window.method3Results?.length || 0}`);
            
            if (window.method4ResultsByLevel) {
                let method4TotalPoints = 0;
                Object.keys(window.method4ResultsByLevel).forEach(level => {
                    const buildings = window.method4ResultsByLevel[level] || [];
                    const points = buildings.reduce((sum, building) => sum + (building.results?.length || 0), 0);
                    method4TotalPoints += points;
                    console.log(`  - Method 4 (${level}): ${buildings.length} buildings, ${points} points`);
                });
                console.log(`  - Method 4 total: ${method4TotalPoints} points`);
            }
            
            if (window.method5ResultsByPeriod) {
                let method5TotalPoints = 0;
                Object.keys(window.method5ResultsByPeriod).forEach(period => {
                    const buildings = window.method5ResultsByPeriod[period] || [];
                    const points = buildings.reduce((sum, building) => sum + (building.results?.length || 0), 0);
                    method5TotalPoints += points;
                    console.log(`  - Method 5 (${period}): ${buildings.length} buildings, ${points} points`);
                });
                console.log(`  - Method 5 total: ${method5TotalPoints} points`);
            }
            
            if (window.method6ResultsByPeriod) {
                let method6TotalPoints = 0;
                Object.keys(window.method6ResultsByPeriod).forEach(key => {
                    const buildings = window.method6ResultsByPeriod[key] || [];
                    const points = buildings.reduce((sum, building) => sum + (building.results?.length || 0), 0);
                    method6TotalPoints += points;
                    console.log(`  - Method 6 (${key}): ${buildings.length} buildings, ${points} points`);
                });
                console.log(`  - Method 6 total: ${method6TotalPoints} points`);
            }
            
            try {
                // Check if Method 3 results are available
                if (!window.method3Results || window.method3Results.length === 0) {
                    container.innerHTML = '<div class="text-center p-4 text-warning"><h5>Method 3 results not available</h5><p>Run analysis first to generate Monte Carlo results</p></div>';
                    return;
                }
                
                // Sort damages in ascending order
                const sortedResults = [...window.method3Results].sort((a, b) => a.damage - b.damage);
                console.log(`📊 Sorted results for exceedance curve: ${sortedResults.length} points`);
                
                // Calculate exceedance probabilities
                const damages = [];
                const exceedanceProbs = [];
                const returnPeriods = [];
                
                sortedResults.forEach((result, index) => {
                    damages.push(result.damage);
                    // Standard cumulative exceedance probability: 1 - (rank / total)
                    const exceedanceProb = 1 - (index / sortedResults.length);
                    exceedanceProbs.push(exceedanceProb);
                    const returnPeriod = exceedanceProb > 0 ? 1 / exceedanceProb : 1000000;
                    returnPeriods.push(returnPeriod);
                });
                
                // No control needed - Plotly has built-in zoom functionality
                
                const traces = [];
                
                console.log('🎯 EXCEEDANCE CURVES: Creating traces...');
                
                // Method 3 trace
                console.log('🎯 Method 3: Single trace with', damages.length, 'points');
                traces.push({
                    x: damages,
                    y: exceedanceProbs,
                    name: 'Method 3',
                    type: 'scatter',
                    mode: 'lines',
                    line: {
                        color: '#ff7f0e',
                        width: 3
                    }
                });
                
                // Method 4 trace - COMPLETELY FLATTEN ALL RESULTS INTO ONE ARRAY
                let allDamages = [...damages]; // Start with Method 3 damages for range calculation
                
                if (window.method4ResultsByLevel) {
                    console.log('🔍 METHOD 4 CONSOLIDATION:');
                    console.log('  - Input structure keys:', Object.keys(window.method4ResultsByLevel));
                    
                    // STEP 1: Create ONE consolidated array by completely flattening everything
                    const consolidatedMethod4Results = [];
                    
                    // STEP 2: Extract ALL individual simulation results from ALL levels and ALL buildings
                    Object.keys(window.method4ResultsByLevel).forEach(level => {
                        const buildingsAtLevel = window.method4ResultsByLevel[level] || [];
                        console.log(`  - Level "${level}": ${buildingsAtLevel.length} buildings`);
                        
                        buildingsAtLevel.forEach((building, buildingIndex) => {
                            const buildingResults = building.results || [];
                            console.log(`    Building ${buildingIndex + 1}: ${buildingResults.length} results`);
                            
                            // Add each individual result to consolidated array
                            buildingResults.forEach(result => {
                                consolidatedMethod4Results.push({
                                    damage: result.damage,
                                    frequency: result.frequency,
                                    intensity: result.intensity,
                                    vulnerability: result.vulnerability,
                                    sourceLevel: level,
                                    sourceBuildingId: building.buildingId || result.buildingId
                                });
                            });
                        });
                    });
                    
                    console.log(`  - CONSOLIDATED TOTAL: ${consolidatedMethod4Results.length} individual results`);
                    
                    if (consolidatedMethod4Results.length > 0) {
                        // STEP 3: Sort all damages in ascending order
                        consolidatedMethod4Results.sort((a, b) => a.damage - b.damage);
                        
                        // STEP 4: Create single damage array and single exceedance probability array
                        const singleDamageArray = consolidatedMethod4Results.map(r => r.damage);
                        const singleExceedanceArray = consolidatedMethod4Results.map((_, index) => {
                            return 1 - (index / consolidatedMethod4Results.length);
                        });

                        // Debug consolidated results
                        const uniqueDamages = [...new Set(singleDamageArray)];
                        const minDamage = Math.min(...singleDamageArray);
                        const maxDamage = Math.max(...singleDamageArray);
                        const zeroDamages = singleDamageArray.filter(d => d === 0).length;
                        console.log('🔍 Method 4 FINAL CONSOLIDATED ANALYSIS:');
                        console.log(`  - Total consolidated points: ${singleDamageArray.length}`);
                        console.log(`  - Unique damage values: ${uniqueDamages.length}`);
                        console.log(`  - Damage range: ${minDamage.toFixed(2)} to ${maxDamage.toFixed(2)}`);
                        console.log(`  - Zero damages: ${zeroDamages} (${((zeroDamages/singleDamageArray.length)*100).toFixed(1)}%)`);

                        allDamages = allDamages.concat(singleDamageArray);
                        
                        // STEP 5: Create SINGLE trace for Method 4
                        console.log('🎯 Method 4: SINGLE CONSOLIDATED trace with', singleDamageArray.length, 'points');
                        traces.push({
                            x: singleDamageArray,
                            y: singleExceedanceArray,
                            name: 'Method 4',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#d62728', width: 2 }
                        });
                        
                        window.method4ExceedanceData = { 
                            damages: singleDamageArray, 
                            exceedanceProbs: singleExceedanceArray, 
                            sortedResults: consolidatedMethod4Results 
                        };
                    } else {
                        console.warn('⚠️ Method 4: No results to consolidate');
                    }
                }
                
                // Method 5 trace - COMPLETELY FLATTEN ALL RESULTS INTO ONE ARRAY
                if (window.method5ResultsByPeriod) {
                    console.log('🔍 METHOD 5 CONSOLIDATION:');
                    console.log('  - Input structure keys:', Object.keys(window.method5ResultsByPeriod));
                    
                    // STEP 1: Create ONE consolidated array by completely flattening everything
                    const consolidatedMethod5Results = [];
                    
                    // STEP 2: Extract ALL individual simulation results from ALL periods and ALL buildings
                    Object.keys(window.method5ResultsByPeriod).forEach(period => {
                        const buildingsAtPeriod = window.method5ResultsByPeriod[period] || [];
                        console.log(`  - Period "${period}": ${buildingsAtPeriod.length} buildings`);
                        
                        buildingsAtPeriod.forEach((building, buildingIndex) => {
                            const buildingResults = building.results || [];
                            console.log(`    Building ${buildingIndex + 1}: ${buildingResults.length} results`);
                            
                            // Add each individual result to consolidated array
                            buildingResults.forEach(result => {
                                consolidatedMethod5Results.push({
                                    damage: result.damage,
                                    frequency: result.frequency,
                                    intensity: result.intensity,
                                    vulnerability: result.vulnerability,
                                    sourcePeriod: period,
                                    sourceBuildingId: building.buildingId || result.buildingId
                                });
                            });
                        });
                    });
                    
                    console.log(`  - CONSOLIDATED TOTAL: ${consolidatedMethod5Results.length} individual results`);
                    
                    if (consolidatedMethod5Results.length > 0) {
                        // STEP 3: Sort all damages in ascending order
                        consolidatedMethod5Results.sort((a, b) => a.damage - b.damage);
                        
                        // STEP 4: Create single damage array and single exceedance probability array
                        const singleDamageArray = consolidatedMethod5Results.map(r => r.damage);
                        const singleExceedanceArray = consolidatedMethod5Results.map((_, index) => {
                            return 1 - (index / consolidatedMethod5Results.length);
                        });

                        // Debug consolidated results
                        const uniqueDamages = [...new Set(singleDamageArray)];
                        const minDamage = Math.min(...singleDamageArray);
                        const maxDamage = Math.max(...singleDamageArray);
                        const zeroDamages = singleDamageArray.filter(d => d === 0).length;
                        console.log('🔍 Method 5 FINAL CONSOLIDATED ANALYSIS:');
                        console.log(`  - Total consolidated points: ${singleDamageArray.length}`);
                        console.log(`  - Unique damage values: ${uniqueDamages.length}`);
                        console.log(`  - Damage range: ${minDamage.toFixed(2)} to ${maxDamage.toFixed(2)}`);
                        console.log(`  - Zero damages: ${zeroDamages} (${((zeroDamages/singleDamageArray.length)*100).toFixed(1)}%)`);

                        allDamages = allDamages.concat(singleDamageArray);
                        
                        // STEP 5: Create SINGLE trace for Method 5
                        console.log('🎯 Method 5: SINGLE CONSOLIDATED trace with', singleDamageArray.length, 'points');
                        traces.push({
                            x: singleDamageArray,
                            y: singleExceedanceArray,
                            name: 'Method 5',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#9467bd', width: 2 }
                        });
                        
                        window.method5ExceedanceData = { 
                            damages: singleDamageArray, 
                            exceedanceProbs: singleExceedanceArray, 
                            sortedResults: consolidatedMethod5Results 
                        };
                    } else {
                        console.warn('⚠️ Method 5: No results to consolidate');
                    }
                }
                
                // Method 6 trace - COMPLETELY FLATTEN ALL RESULTS INTO ONE ARRAY
                if (window.method6ResultsByPeriod) {
                    console.log('🔍 METHOD 6 CONSOLIDATION:');
                    console.log('  - Input structure keys:', Object.keys(window.method6ResultsByPeriod));
                    
                    // STEP 1: Create ONE consolidated array by completely flattening everything
                    const consolidatedMethod6Results = [];
                    
                    // STEP 2: Extract ALL individual simulation results from ALL periods/hazards and ALL buildings
                    Object.keys(window.method6ResultsByPeriod).forEach(periodHazardKey => {
                        const buildingsAtKey = window.method6ResultsByPeriod[periodHazardKey] || [];
                        console.log(`  - Period/Hazard "${periodHazardKey}": ${buildingsAtKey.length} buildings`);
                        
                        buildingsAtKey.forEach((building, buildingIndex) => {
                            const buildingResults = building.results || [];
                            console.log(`    Building ${buildingIndex + 1}: ${buildingResults.length} results`);
                            
                            // Add each individual result to consolidated array
                            buildingResults.forEach(result => {
                                consolidatedMethod6Results.push({
                                    damage: result.damage,
                                    frequency: result.frequency,
                                    intensity: result.intensity,
                                    vulnerability: result.vulnerability,
                                    sourcePeriodHazard: periodHazardKey,
                                    sourceBuildingId: building.buildingId || result.buildingId
                                });
                            });
                        });
                    });
                    
                    console.log(`  - CONSOLIDATED TOTAL: ${consolidatedMethod6Results.length} individual results`);
                    
                    if (consolidatedMethod6Results.length > 0) {
                        // STEP 3: Sort all damages in ascending order
                        consolidatedMethod6Results.sort((a, b) => a.damage - b.damage);
                        
                        // STEP 4: Create single damage array and single exceedance probability array
                        const singleDamageArray = consolidatedMethod6Results.map(r => r.damage);
                        const singleExceedanceArray = consolidatedMethod6Results.map((_, index) => {
                            return 1 - (index / consolidatedMethod6Results.length);
                        });

                        // Debug consolidated results
                        const uniqueDamages = [...new Set(singleDamageArray)];
                        const minDamage = Math.min(...singleDamageArray);
                        const maxDamage = Math.max(...singleDamageArray);
                        const zeroDamages = singleDamageArray.filter(d => d === 0).length;
                        console.log('🔍 Method 6 FINAL CONSOLIDATED ANALYSIS:');
                        console.log(`  - Total consolidated points: ${singleDamageArray.length}`);
                        console.log(`  - Unique damage values: ${uniqueDamages.length}`);
                        console.log(`  - Damage range: ${minDamage.toFixed(2)} to ${maxDamage.toFixed(2)}`);
                        console.log(`  - Zero damages: ${zeroDamages} (${((zeroDamages/singleDamageArray.length)*100).toFixed(1)}%)`);

                        allDamages = allDamages.concat(singleDamageArray);
                        
                        // STEP 5: Create SINGLE trace for Method 6
                        console.log('🎯 Method 6: SINGLE CONSOLIDATED trace with', singleDamageArray.length, 'points');
                        traces.push({
                            x: singleDamageArray,
                            y: singleExceedanceArray,
                            name: 'Method 6',
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#8c564b', width: 2 }
                        });
                        
                        window.method6ExceedanceData = { 
                            damages: singleDamageArray, 
                            exceedanceProbs: singleExceedanceArray, 
                            sortedResults: consolidatedMethod6Results 
                        };
                    } else {
                        console.warn('⚠️ Method 6: No results to consolidate');
                    }
                }

                // Use reduce to avoid stack overflow with large arrays
                const maxDamage = allDamages.length > 0 ? allDamages.reduce((max, val) => Math.max(max, val), 0) : 1000;
                
                const layout = {
                    title: `CAT Model Methods - Damage Exceedance Probability`,
                    xaxis: {
                        title: 'Damage (CHF)',
                        type: 'log',
                        autorange: true,
                        gridcolor: '#eee'
                    },
                    yaxis: {
                        title: 'Exceedance Probability',
                        // range: [0, 0.125],
                        range: [0, 1],
                        gridcolor: '#eee'
                    },
                    margin: { t: 80, b: 60, l: 80, r: 60 },
                    plot_bgcolor: '#fafafa',
                    height: 450
                };
                
                // Add graph container
                container.innerHTML = '<div id="exceedance-plot" style="width: 100%; height: 470px;"></div>';
                
                const plotContainer = document.getElementById('exceedance-plot');
                
                console.log(`🎯 FINAL TRACE COUNT: ${traces.length} traces total`);
                traces.forEach((trace, index) => {
                    console.log(`  Trace ${index + 1}: "${trace.name}" with ${trace.x.length} points`);
                    
                    // Check for duplicate traces (same name)
                    const duplicates = traces.filter(t => t.name === trace.name);
                    if (duplicates.length > 1) {
                        console.error(`❌ DUPLICATE TRACE DETECTED: "${trace.name}" appears ${duplicates.length} times!`);
                        duplicates.forEach((dup, dupIndex) => {
                            console.error(`  - Duplicate ${dupIndex + 1}: ${dup.x.length} points`);
                        });
                    }
                });
                
                Plotly.newPlot(plotContainer, traces, layout, {responsive: true});
                
                // Store data globally for update function
                window.exceedanceData = { damages, exceedanceProbs, sortedResults };
                
                console.log('✅ Method 3 exceedance curve created');
                
            } catch (error) {
                console.error('❌ Error creating Method 3 exceedance curve:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating exceedance curve</h5></div>';
            }
        }, 300);
    }
    
    // updateExceedanceGraph function removed - Plotly's built-in zoom functionality is sufficient

    // ================= METHODS COMPARISON FUNCTION =================
    
    // Create methods comparison bar chart
    function createMethodsComparisonGraph() {
        setTimeout(() => {
            const container = document.getElementById('methods-comparison-graph');
            if (!container) {
                console.warn('⚠️ Methods comparison graph container not found');
                return;
            }
            
            console.log('📊 Creating methods comparison chart...');
            
            try {
                const traces = [];
                const methods = [];
                const meanDamages = [];
                
                // Calculate EconoMe and Literature totals from building analysis results (Methods 1 & 2)
                if (window.latestExtractionResults && window.latestExtractionResults.buildingsAnalyzed) {
                    const buildings = window.latestExtractionResults.buildingsAnalyzed;
                    
                    // Method 1: Calculate EconoMe total (sum of all building damages)
                    let economeTotalDamage = 0;
                    let economeValidCount = 0;
                    
                    console.log('🔍 Method 1 Debug: Checking DAMAGE values...');
                    buildings.forEach((building, index) => {
                        const damage = building.DAMAGE;
                        if (index < 5) { // Log first 5 buildings for debugging
                            console.log(`  Building ${index + 1}: DAMAGE = ${damage} (type: ${typeof damage})`);
                        }
                        if (damage !== 'N/A' && damage !== null && damage !== undefined && !isNaN(damage) && damage > 0) {
                            economeTotalDamage += parseFloat(damage);
                            economeValidCount++;
                        }
                    });
                    
                    console.log(`🔍 Method 1: Found ${economeValidCount} buildings with valid DAMAGE values, total: ${economeTotalDamage.toFixed(2)} CHF`);
                    
                    if (economeValidCount > 0) {
                        methods.push('Method 1<br>EconoMe Total');
                        meanDamages.push(economeTotalDamage);
                    }
                    
                    // Method 2: Calculate Literature total (sum of all building literature damages)
                    let literatureTotalDamage = 0;
                    let literatureValidCount = 0;
                    
                    console.log('🔍 Method 2 Debug: Checking DAMAGE_LITERATURE values...');
                    buildings.forEach((building, index) => {
                        const damage = building.DAMAGE_LITERATURE;
                        if (index < 5) { // Log first 5 buildings for debugging
                            console.log(`  Building ${index + 1}: DAMAGE_LITERATURE = ${damage} (type: ${typeof damage})`);
                        }
                        if (damage !== 'N/A' && damage !== null && damage !== undefined && !isNaN(damage) && damage > 0) {
                            literatureTotalDamage += parseFloat(damage);
                            literatureValidCount++;
                        }
                    });
                    
                    console.log(`🔍 Method 2: Found ${literatureValidCount} buildings with valid DAMAGE_LITERATURE values, total: ${literatureTotalDamage.toFixed(2)} CHF`);
                    
                    if (literatureValidCount > 0) {
                        methods.push('Method 2<br>Literature Total');
                        meanDamages.push(literatureTotalDamage);
                    }
                }
                
                // Method 3: CAT Model Monte Carlo mean damage - SUM of building means (not average of all points)
                if (window.method3Results && window.method3Results.length > 0 && window.latestExtractionResults?.buildingsAnalyzed) {
                    // Get total damage by SUMMING the mean damage of each building
                    const buildingsWithMethod3 = window.latestExtractionResults.buildingsAnalyzed.filter(building => 
                        building.METHOD3_MEAN_DAMAGE !== undefined && building.METHOD3_MEAN_DAMAGE > 0
                    );
                    
                    if (buildingsWithMethod3.length > 0) {
                        const method3Total = buildingsWithMethod3.reduce((sum, building) => sum + building.METHOD3_MEAN_DAMAGE, 0);
                        console.log(`🔍 Method 3: ${buildingsWithMethod3.length} buildings, total damage = ${method3Total.toFixed(2)} CHF`);
                        methods.push('Method 3<br>CAT Model Mean');
                        meanDamages.push(method3Total);
                    }
                }
                
                // Method 4: CAT Model Monte Carlo mean damage - SUM of building means (not average of all points)
                if (window.method4ResultsByLevel && window.latestExtractionResults?.buildingsAnalyzed) {
                    console.log('🔍 Comparison: Method 4 data available:', window.method4ResultsByLevel);
                    
                    // Get total damage by SUMMING the mean damage of each building
                    const buildingsWithMethod4 = window.latestExtractionResults.buildingsAnalyzed.filter(building => 
                        building.METHOD4_MEAN_DAMAGE !== undefined && building.METHOD4_MEAN_DAMAGE > 0
                    );
                    
                    if (buildingsWithMethod4.length > 0) {
                        const method4Total = buildingsWithMethod4.reduce((sum, building) => sum + building.METHOD4_MEAN_DAMAGE, 0);
                        console.log(`🔍 Method 4: ${buildingsWithMethod4.length} buildings, total damage = ${method4Total.toFixed(2)} CHF`);
                        methods.push('Method 4<br>CAT Model Mean');
                        meanDamages.push(method4Total);
                    }
                } else {
                    console.log('🔍 Comparison: No Method 4 data available');
                }
                
                // Method 5: CAT Model Monte Carlo mean damage - SUM of building means (not average of all points)
                if (window.method5ResultsByPeriod && window.latestExtractionResults?.buildingsAnalyzed) {
                    console.log('🔍 Comparison: Method 5 data available:', window.method5ResultsByPeriod);
                    
                    // Get total damage by SUMMING the mean damage of each building
                    const buildingsWithMethod5 = window.latestExtractionResults.buildingsAnalyzed.filter(building => 
                        building.METHOD5_MEAN_DAMAGE !== undefined && building.METHOD5_MEAN_DAMAGE > 0
                    );
                    
                    if (buildingsWithMethod5.length > 0) {
                        const method5Total = buildingsWithMethod5.reduce((sum, building) => sum + building.METHOD5_MEAN_DAMAGE, 0);
                        console.log(`🔍 Method 5: ${buildingsWithMethod5.length} buildings, total damage = ${method5Total.toFixed(2)} CHF`);
                        methods.push('Method 5<br>CAT Model Mean');
                        meanDamages.push(method5Total);
                    }
                } else {
                    console.log('🔍 Comparison: No Method 5 data available');
                }
                
                // Method 6: CAT Model Monte Carlo mean damage - SUM of building means (not average of all points)
                if (window.method6ResultsByPeriod && window.latestExtractionResults?.buildingsAnalyzed) {
                    console.log('🔍 Comparison: Method 6 data available:', window.method6ResultsByPeriod);
                    
                    // Get total damage by SUMMING the mean damage of each building
                    const buildingsWithMethod6 = window.latestExtractionResults.buildingsAnalyzed.filter(building => 
                        building.METHOD6_MEAN_DAMAGE !== undefined && building.METHOD6_MEAN_DAMAGE > 0
                    );
                    
                    if (buildingsWithMethod6.length > 0) {
                        const method6Total = buildingsWithMethod6.reduce((sum, building) => sum + building.METHOD6_MEAN_DAMAGE, 0);
                        console.log(`🔍 Method 6: ${buildingsWithMethod6.length} buildings, total damage = ${method6Total.toFixed(2)} CHF`);
                        methods.push('Method 6<br>CAT Model Mean');
                        meanDamages.push(method6Total);
                    }
                } else {
                    console.log('🔍 Comparison: No Method 6 data available');
                }
                
                console.log('🔍 Comparison: Final methods:', methods);
                console.log('🔍 Comparison: Final damages:', meanDamages);
                
                const trace = {
                    x: methods,
                    y: meanDamages,
                    type: 'bar',
                    marker: {
                        color: ['#2ca02c', '#1f77b4', '#ff7f0e', '#d62728', '#9467bd', '#8c564b', '#17becf'],
                        opacity: 0.8
                    },
                    text: meanDamages.map(val => `${val.toFixed(1)} CHF`),
                    textposition: 'auto',
                    width: Array(methods.length).fill(0.8)  // Set uniform bar width
                };
                
                const layout = {
                    title: 'CAT Model Methods: Mean Damage Comparison',
                    xaxis: {
                        title: 'Different Methods used for Damage Estimation',
                        type: 'category',
                        categoryorder: 'array',
                        categoryarray: methods,
                        tickangle: 0,
                        automargin: true,
                        range: [-0.5, methods.length - 0.5]  // Force full range usage
                    },
                    yaxis: {
                        title: 'Mean Damage (CHF)'
                    },
                    margin: { t: 60, b: 120, l: 80, r: 60 },
                    plot_bgcolor: '#fafafa',
                    height: 450,
                    bargap: 0.2,  // Slightly increased gap for better distribution
                    bargroupgap: 0.1,
                    width: null,  // Let it use full container width
                    autosize: true  // Enable automatic sizing
                };
                
                container.innerHTML = '<div id="comparison-plot" style="width: 100%; height: 470px;"></div>';
                
                const plotContainer = document.getElementById('comparison-plot');
                
                const config = {
                    responsive: true, 
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
                    toImageButtonOptions: {
                        format: 'png',
                        filename: 'methods_comparison',
                        height: 450,
                        width: 1200,
                        scale: 1
                    }
                };
                
                Plotly.newPlot(plotContainer, [trace], layout, config);
                
                // Force resize to ensure full width utilization
                setTimeout(() => {
                    Plotly.Plots.resize(plotContainer);
                }, 100);
                
                console.log('✅ Methods comparison chart created');
                
            } catch (error) {
                console.error('❌ Error creating methods comparison chart:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating comparison chart</h5></div>';
            }
        }, 600);
    }

    // Function to create cumulative intensity distribution graph
    function createIntensityCumulativeGraph() {
        setTimeout(() => {
            const container = document.getElementById('intensity-cumulative-graph');
            if (!container) {
                console.warn('⚠️ Intensity cumulative graph container not found');
                return;
            }
            
            console.log('⚡ Creating cumulative intensity distribution...');
            
            try {
                const allIntensities = [];
                const methodColors = {
                    'Method 3': '#ff7f0e',
                    'Method 4': '#d62728', 
                    'Method 5': '#9467bd',
                    'Method 6': '#8c564b'
                };
                
                // Collect intensity data from all CAT model methods
                
                // Method 3 intensities
                if (window.method3Results && window.method3Results.length > 0) {
                    const method3Intensities = window.method3Results
                        .map(r => r.intensity)
                        .filter(val => val > 0)
                        .sort((a, b) => b - a); // Sort descending
                    
                    if (method3Intensities.length > 0) {
                        allIntensities.push({
                            name: 'Method 3',
                            values: method3Intensities,
                            color: methodColors['Method 3']
                        });
                    }
                }
                
                // Method 4 intensities (from all hazard intensity levels)
                if (window.method4ResultsByLevel) {
                    const allMethod4Intensities = [];
                    Object.keys(window.method4ResultsByLevel).forEach(intensityLevel => {
                        if (window.method4ResultsByLevel[intensityLevel] && window.method4ResultsByLevel[intensityLevel].length > 0) {
                            const levelResults = window.method4ResultsByLevel[intensityLevel].flatMap(building => building.results);
                            levelResults.forEach(result => {
                                if (result.intensity > 0) {
                                    allMethod4Intensities.push(result.intensity);
                                }
                            });
                        }
                    });
                    
                    if (allMethod4Intensities.length > 0) {
                        allMethod4Intensities.sort((a, b) => b - a); // Sort descending
                        allIntensities.push({
                            name: 'Method 4',
                            values: allMethod4Intensities,
                            color: methodColors['Method 4']
                        });
                    }
                }
                
                // Method 5 intensities (from all return periods)
                if (window.method5ResultsByPeriod) {
                    const allMethod5Intensities = [];
                    Object.keys(window.method5ResultsByPeriod).forEach(returnPeriod => {
                        if (window.method5ResultsByPeriod[returnPeriod] && window.method5ResultsByPeriod[returnPeriod].length > 0) {
                            const periodResults = window.method5ResultsByPeriod[returnPeriod].flatMap(building => building.results);
                            periodResults.forEach(result => {
                                if (result.intensity > 0) {
                                    allMethod5Intensities.push(result.intensity);
                                }
                            });
                        }
                    });
                    
                    if (allMethod5Intensities.length > 0) {
                        allMethod5Intensities.sort((a, b) => b - a); // Sort descending
                        allIntensities.push({
                            name: 'Method 5',
                            values: allMethod5Intensities,
                            color: methodColors['Method 5']
                        });
                    }
                }
                
                // Method 6 intensities (from all return periods and hazard levels)
                if (window.method6ResultsByPeriod) {
                    const allMethod6Intensities = [];
                    Object.keys(window.method6ResultsByPeriod).forEach(periodHazardKey => {
                        if (window.method6ResultsByPeriod[periodHazardKey] && window.method6ResultsByPeriod[periodHazardKey].length > 0) {
                            const groupResults = window.method6ResultsByPeriod[periodHazardKey].flatMap(building => building.results);
                            groupResults.forEach(result => {
                                if (result.intensity > 0) {
                                    allMethod6Intensities.push(result.intensity);
                                }
                            });
                        }
                    });
                    
                    if (allMethod6Intensities.length > 0) {
                        allMethod6Intensities.sort((a, b) => b - a); // Sort descending
                        allIntensities.push({
                            name: 'Method 6',
                            values: allMethod6Intensities,
                            color: methodColors['Method 6']
                        });
                    }
                }
                
                if (allIntensities.length === 0) {
                    container.innerHTML = '<div class="text-center p-4 text-muted"><h5>No intensity data available</h5></div>';
                    return;
                }
                
                // Create cumulative probability traces
                const traces = allIntensities.map(methodData => {
                    const sortedValues = methodData.values;
                    const n = sortedValues.length;
                    const cumulativeProb = sortedValues.map((_, index) => (index + 1) / n);
                    
                    return {
                        x: sortedValues,
                        y: cumulativeProb,
                        type: 'scatter',
                        mode: 'lines',
                        name: methodData.name,
                        line: {
                            color: methodData.color,
                            width: 3
                        },
                        hovertemplate: `<b>${methodData.name}</b><br>` +
                                     'Intensity: %{x:.1f} kJ<br>' +
                                     'Cumulative Probability: %{y:.3f}<br>' +
                                     '<extra></extra>'
                    };
                });
                
                const layout = {
                    title: {
                        text: 'Cumulative Intensity Distribution - CAT Models',
                        font: { size: 16 }
                    },
                    xaxis: {
                        title: 'Intensity (Energy kJ)',
                        type: 'log',
                        autorange: true
                    },
                    yaxis: {
                        title: 'Cumulative Probability',
                        range: [0, 1]
                    },
                    margin: { t: 60, b: 80, l: 80, r: 60 },
                    plot_bgcolor: '#fafafa',
                    height: 450,
                    showlegend: true,
                    legend: {
                        x: 0.02,
                        y: 0.98,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        bordercolor: '#ccc',
                        borderwidth: 1
                    }
                };
                
                container.innerHTML = '<div id="intensity-cumulative-plot" style="width: 100%; height: 470px;"></div>';
                
                const plotContainer = document.getElementById('intensity-cumulative-plot');
                
                const config = {
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
                    toImageButtonOptions: {
                        format: 'png',
                        filename: 'intensity_cumulative_distribution',
                        height: 450,
                        width: 1200,
                        scale: 1
                    }
                };
                
                Plotly.newPlot(plotContainer, traces, layout, config);
                
                console.log('✅ Cumulative intensity distribution created');
                
            } catch (error) {
                console.error('❌ Error creating cumulative intensity distribution:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating intensity distribution</h5></div>';
            }
        }, 800);
    }

    // Function to create cumulative frequency distribution graph
    function createFrequencyCumulativeGraph() {
        setTimeout(() => {
            const container = document.getElementById('frequency-cumulative-graph');
            if (!container) {
                console.warn('⚠️ Frequency cumulative graph container not found');
                return;
            }
            
            console.log('📈 Creating cumulative frequency distribution...');
            
            try {
                const allFrequencies = [];
                const methodColors = {
                    'Method 3': '#ff7f0e',
                    'Method 4': '#d62728', 
                    'Method 5': '#9467bd',
                    'Method 6': '#8c564b'
                };
                
                // Collect frequency data from all CAT model methods
                
                // Method 3 frequencies  
                if (window.method3Results && window.method3Results.length > 0) {
                    const method3Frequencies = window.method3Results
                        .map(r => r.frequency)
                        .filter(val => val > 0)
                        .sort((a, b) => b - a); // Sort descending
                    
                    if (method3Frequencies.length > 0) {
                        allFrequencies.push({
                            name: 'Method 3',
                            values: method3Frequencies,
                            color: methodColors['Method 3']
                        });
                    }
                }
                
                // Method 4 frequencies (from all hazard intensity levels)
                if (window.method4ResultsByLevel) {
                    const allMethod4Frequencies = [];
                    Object.keys(window.method4ResultsByLevel).forEach(intensityLevel => {
                        if (window.method4ResultsByLevel[intensityLevel] && window.method4ResultsByLevel[intensityLevel].length > 0) {
                            const levelResults = window.method4ResultsByLevel[intensityLevel].flatMap(building => building.results);
                            levelResults.forEach(result => {
                                if (result.frequency > 0) {
                                    allMethod4Frequencies.push(result.frequency);
                                }
                            });
                        }
                    });
                    
                    if (allMethod4Frequencies.length > 0) {
                        allMethod4Frequencies.sort((a, b) => b - a); // Sort descending
                        allFrequencies.push({
                            name: 'Method 4',
                            values: allMethod4Frequencies,
                            color: methodColors['Method 4']
                        });
                    }
                }
                
                // Method 5 frequencies (from all return periods)
                if (window.method5ResultsByPeriod) {
                    const allMethod5Frequencies = [];
                    
                    Object.keys(window.method5ResultsByPeriod).forEach(returnPeriod => {
                        if (window.method5ResultsByPeriod[returnPeriod] && window.method5ResultsByPeriod[returnPeriod].length > 0) {
                            window.method5ResultsByPeriod[returnPeriod].forEach((building) => {
                                if (building.results && building.results.length > 0) {
                                    building.results.forEach(result => {
                                        if (result.frequency > 0) {
                                            allMethod5Frequencies.push(result.frequency);
                                        }
                                    });
                                }
                            });
                        }
                    });
                    
                    if (allMethod5Frequencies.length > 0) {
                        allMethod5Frequencies.sort((a, b) => b - a); // Sort descending
                        allFrequencies.push({
                            name: 'Method 5',
                            values: allMethod5Frequencies,
                            color: methodColors['Method 5']
                        });
                    }
                }
                
                // Fallback: Check global method5Results array
                if (window.method5Results && window.method5Results.length > 0 && !allFrequencies.find(d => d.name === 'Method 5')) {
                    const globalMethod5Frequencies = window.method5Results
                        .map(r => r.frequency)
                        .filter(val => val > 0)
                        .sort((a, b) => b - a); // Sort descending
                    
                    if (globalMethod5Frequencies.length > 0) {
                        allFrequencies.push({
                            name: 'Method 5 (Global)',
                            values: globalMethod5Frequencies,
                            color: methodColors['Method 5']
                        });
                    }
                }
                
                // Method 6 frequencies (from all return periods and hazard levels)
                if (window.method6ResultsByPeriod) {
                    const allMethod6Frequencies = [];
                    Object.keys(window.method6ResultsByPeriod).forEach(periodHazardKey => {
                        if (window.method6ResultsByPeriod[periodHazardKey] && window.method6ResultsByPeriod[periodHazardKey].length > 0) {
                            const groupResults = window.method6ResultsByPeriod[periodHazardKey].flatMap(building => building.results);
                            groupResults.forEach(result => {
                                if (result.frequency > 0) {
                                    allMethod6Frequencies.push(result.frequency);
                                }
                            });
                        }
                    });
                    
                    if (allMethod6Frequencies.length > 0) {
                        allMethod6Frequencies.sort((a, b) => b - a); // Sort descending
                        allFrequencies.push({
                            name: 'Method 6',
                            values: allMethod6Frequencies,
                            color: methodColors['Method 6']
                        });
                    }
                }
                
                if (allFrequencies.length === 0) {
                    container.innerHTML = '<div class="text-center p-4 text-muted"><h5>No frequency data available</h5></div>';
                    return;
                }
                
                // Create cumulative probability traces
                const traces = allFrequencies.map(methodData => {
                    const sortedValues = methodData.values;
                    const n = sortedValues.length;
                    const cumulativeProb = sortedValues.map((_, index) => (index + 1) / n);
                    
                    return {
                        x: sortedValues,
                        y: cumulativeProb,
                        type: 'scatter',
                        mode: 'lines',
                        name: methodData.name,
                        line: {
                            color: methodData.color,
                            width: 3
                        },
                        hovertemplate: `<b>${methodData.name}</b><br>` +
                                     'Frequency: %{x:.6f}<br>' +
                                     'Cumulative Probability: %{y:.3f}<br>' +
                                     '<extra></extra>'
                    };
                });
                
                const layout = {
                    title: {
                        text: 'Cumulative Frequency Distribution - CAT Models',
                        font: { size: 16 }
                    },
                    xaxis: {
                        title: 'Frequency (events/year)',
                        type: 'log',
                        autorange: true
                    },
                    yaxis: {
                        title: 'Cumulative Probability',
                        range: [0, 1]
                    },
                    margin: { t: 60, b: 80, l: 80, r: 60 },
                    plot_bgcolor: '#fafafa',
                    height: 450,
                    showlegend: true,
                    legend: {
                        x: 0.02,
                        y: 0.98,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        bordercolor: '#ccc',
                        borderwidth: 1
                    }
                };
                
                container.innerHTML = '<div id="frequency-cumulative-plot" style="width: 100%; height: 470px;"></div>';
                
                const plotContainer = document.getElementById('frequency-cumulative-plot');
                
                const config = {
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
                    toImageButtonOptions: {
                        format: 'png',
                        filename: 'frequency_cumulative_distribution',
                        height: 450,
                        width: 1200,
                        scale: 1
                    }
                };
                
                Plotly.newPlot(plotContainer, traces, layout, config);
                
                console.log('✅ Cumulative frequency distribution created');
                
            } catch (error) {
                console.error('❌ Error creating cumulative frequency distribution:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating frequency distribution</h5></div>';
            }
        }, 1000);
    }

    // Function to create CAT Models summary statistics table with AG Grid
    function createCATModelsSummaryTable() {
        setTimeout(() => {
            const container = document.getElementById('cat-models-summary-table');
            if (!container) {
                console.warn('⚠️ CAT models summary table container not found');
                return;
            }
            
            console.log('📊 Creating CAT models summary statistics table with AG Grid...');
            
            try {
                const summaryData = [];
                
                // Helper function to count non-zero values by method-specific categories
                const getMethodSpecificCounts = (methodName, results) => {
                    console.log(`🔧 getMethodSpecificCounts called for ${methodName}`);
                    
                    const counts = {
                        rp30: 0, rp100: 0, rp300: 0,
                        levelLow: 0, levelMean: 0, levelHigh: 0
                    };
                    
                    if (methodName === 'Method 3') {
                        // Method 3 doesn't use return periods or hazard levels - leave all counts at 0
                        console.log(`🔧 Method 3 - returning zero counts`);
                        return counts;
                    } else if (methodName === 'Method 4') {
                        // Method 4: Use the SAME allMethod4Results approach as vulnerability graphs
                        if (window.method4ResultsByLevel) {
                            console.log('🔍 Method 4 - Using allMethod4Results approach (same as graphs)');
                            
                            // Create allMethod4Results exactly like the graphs do
                            const allMethod4Results = [];
                            Object.keys(window.method4ResultsByLevel).forEach(intensityLevel => {
                                if (window.method4ResultsByLevel[intensityLevel] && window.method4ResultsByLevel[intensityLevel].length > 0) {
                                    const levelResults = window.method4ResultsByLevel[intensityLevel].flatMap(building => building.results);
                                    allMethod4Results.push(...levelResults);
                                }
                            });
                            
                            console.log(`🔍 Total Method 4 results (same as graphs): ${allMethod4Results.length}`);
                            
                            if (allMethod4Results.length > 0) {
                                // Count by hazard intensity property (same pattern as Methods 5&6)
                                // BUT ONLY count results with intensity > 0 (same filter as vulnerability graphs!)
                                
                                console.log('🔍 Method 4 - Debugging hazard intensity values:');
                                const intensityValues = new Set();
                                let sampleCount = 0;
                                allMethod4Results.forEach(result => {
                                    if (result.intensity > 0 && result.hazardIntensity && sampleCount < 10) {
                                        intensityValues.add(result.hazardIntensity);
                                        console.log(`🔍 Sample ${sampleCount + 1}: hazardIntensity = "${result.hazardIntensity}"`);
                                        sampleCount++;
                                    }
                                });
                                console.log('🔍 Unique hazardIntensity values found:', Array.from(intensityValues));
                                
                                allMethod4Results.forEach(result => {
                                    if (result.intensity > 0 && result.hazardIntensity) {
                                        const level = String(result.hazardIntensity).toLowerCase();
                                        
                                        if (level.includes('faible') || level.includes('low') || level.includes('weak')) {
                                            counts.levelLow++;
                                        } else if (level.includes('moyenne') || level.includes('mean') || level.includes('medium') || level.includes('moderate')) {
                                            counts.levelMean++;
                                        } else if (level.includes('forte') || level.includes('high') || level.includes('strong')) {
                                            counts.levelHigh++;
                                        }
                                    }
                                });
                                
                                console.log('🔍 Method 4 - Final counts from allMethod4Results (intensity > 0 filter):', counts);
                                console.log(`  - Level Low: ${counts.levelLow}`);
                                console.log(`  - Level Mean: ${counts.levelMean}`);  
                                console.log(`  - Level High: ${counts.levelHigh}`);
                                console.log(`  - Total counted: ${counts.levelLow + counts.levelMean + counts.levelHigh}`);
                            }
                            
                        } else {
                            console.log(`❌ Method 4 - window.method4ResultsByLevel not available`);
                        }
                        return counts;

                                        


                                            console.log(`� `);

                            
                    } else if (methodName === 'Method 5') {
                        // Method 5 only uses return periods
                        results.forEach(r => {
                            if (r.frequency > 0 && r.returnPeriod) {
                                const rp = r.returnPeriod;
                                if (rp === 30) counts.rp30++;
                                else if (rp === 100) counts.rp100++;
                                else if (rp === 300) counts.rp300++;
                            }
                        });
                    } else if (methodName === 'Method 6') {
                        // Method 6 uses ONLY hazard levels (remove return period counting to avoid duplication)
                        results.forEach(r => {
                            if (r.frequency > 0) {
                                // Count ONLY by hazard level (NOT by return period to avoid duplication)
                                if (r.hazardLevel || r.hazardIntensity) {
                                    const level = String(r.hazardLevel || r.hazardIntensity).toLowerCase();
                                    if (level.includes('faible') || level.includes('low')) {
                                        counts.levelLow++;
                                    } else if (level.includes('moyenne') || level.includes('mean') || level.includes('medium')) {
                                        counts.levelMean++;
                                    } else if (level.includes('forte') || level.includes('high')) {
                                        counts.levelHigh++;
                                    }
                                }
                            }
                        });
                    }
                    
                    return counts;
                };
                
                // Method 3 statistics - using only NON-ZERO values
                if (window.method3Results && window.method3Results.length > 0) {
                    // Filter for non-zero values only
                    const nonZeroVulnerabilities = window.method3Results.map(r => r.vulnerability).filter(v => v !== null && !isNaN(v) && v > 0);
                    const nonZeroFrequencies = window.method3Results.map(r => r.frequency).filter(f => f !== null && !isNaN(f) && f > 0);
                    const nonZeroIntensities = window.method3Results.map(r => r.intensity).filter(i => i !== null && !isNaN(i) && i > 0);
                    
                    if (nonZeroVulnerabilities.length > 0 || nonZeroFrequencies.length > 0 || nonZeroIntensities.length > 0) {
                        const meanFreq = nonZeroFrequencies.length > 0 ? (nonZeroFrequencies.reduce((sum, f) => sum + f, 0) / nonZeroFrequencies.length) : null;
                        const returnPeriod = meanFreq && meanFreq > 0 ? (1 / meanFreq) : null;
                        const methodCounts = getMethodSpecificCounts('Method 3', window.method3Results);
                        
                        summaryData.push({
                            method: 'Method 3',
                            description: 'CAT Model Fixed Frequency',
                            meanVulnerability: nonZeroVulnerabilities.length > 0 ? (nonZeroVulnerabilities.reduce((sum, v) => sum + v, 0) / nonZeroVulnerabilities.length) : null,
                            meanFrequency: meanFreq,
                            meanReturnPeriod: returnPeriod,
                            meanIntensity: nonZeroIntensities.length > 0 ? (nonZeroIntensities.reduce((sum, i) => sum + i, 0) / nonZeroIntensities.length) : null,
                            sampleSize: window.method3Results.length,
                            ...methodCounts
                        });
                    }
                }
                
                // Method 4 statistics - using only NON-ZERO values
                if (window.method4ResultsByLevel) {
                    const allMethod4Results = [];
                    Object.keys(window.method4ResultsByLevel).forEach(intensityLevel => {
                        if (window.method4ResultsByLevel[intensityLevel] && window.method4ResultsByLevel[intensityLevel].length > 0) {
                            const levelResults = window.method4ResultsByLevel[intensityLevel].flatMap(building => building.results);
                            allMethod4Results.push(...levelResults);
                        }
                    });
                    
                    if (allMethod4Results.length > 0) {
                        // Filter for non-zero values only
                        const nonZeroVulnerabilities = allMethod4Results.map(r => r.vulnerability).filter(v => v !== null && !isNaN(v) && v > 0);
                        const nonZeroFrequencies = allMethod4Results.map(r => r.frequency).filter(f => f !== null && !isNaN(f) && f > 0);
                        const nonZeroIntensities = allMethod4Results.map(r => r.intensity).filter(i => i !== null && !isNaN(i) && i > 0);
                        
                        const meanFreq = nonZeroFrequencies.length > 0 ? (nonZeroFrequencies.reduce((sum, f) => sum + f, 0) / nonZeroFrequencies.length) : null;
                        const returnPeriod = meanFreq && meanFreq > 0 ? (1 / meanFreq) : null;
                        const methodCounts = getMethodSpecificCounts('Method 4', allMethod4Results);
                        
                        summaryData.push({
                            method: 'Method 4',
                            description: 'CAT Model by Hazard Intensity',
                            meanVulnerability: nonZeroVulnerabilities.length > 0 ? (nonZeroVulnerabilities.reduce((sum, v) => sum + v, 0) / nonZeroVulnerabilities.length) : null,
                            meanFrequency: meanFreq,
                            meanReturnPeriod: returnPeriod,
                            meanIntensity: nonZeroIntensities.length > 0 ? (nonZeroIntensities.reduce((sum, i) => sum + i, 0) / nonZeroIntensities.length) : null,
                            sampleSize: allMethod4Results.length,
                            ...methodCounts
                        });
                    }
                }
                
                // Method 5 statistics - using only NON-ZERO values
                if (window.method5ResultsByPeriod) {
                    const allMethod5Results = [];
                    console.log('🔍 Method 5 Debug: Processing results by return period...');
                    Object.keys(window.method5ResultsByPeriod).forEach(returnPeriod => {
                        if (window.method5ResultsByPeriod[returnPeriod] && window.method5ResultsByPeriod[returnPeriod].length > 0) {
                            console.log(`  - Period ${returnPeriod}: ${window.method5ResultsByPeriod[returnPeriod].length} buildings`);
                            const periodResults = window.method5ResultsByPeriod[returnPeriod].flatMap(building => {
                                console.log(`    Building has ${building.results?.length || 0} results`);
                                return building.results || [];
                            });
                            allMethod5Results.push(...periodResults);
                        }
                    });
                    console.log(`🔍 Method 5 Debug: Total combined results: ${allMethod5Results.length}`);
                    
                    if (allMethod5Results.length > 0) {
                        // Filter for non-zero values only
                        const nonZeroVulnerabilities = allMethod5Results.map(r => r.vulnerability).filter(v => v !== null && !isNaN(v) && v > 0);
                        const nonZeroFrequencies = allMethod5Results.map(r => r.frequency).filter(f => f !== null && !isNaN(f) && f > 0);
                        const nonZeroIntensities = allMethod5Results.map(r => r.intensity).filter(i => i !== null && !isNaN(i) && i > 0);
                        
                        const meanFreq = nonZeroFrequencies.length > 0 ? (nonZeroFrequencies.reduce((sum, f) => sum + f, 0) / nonZeroFrequencies.length) : null;
                        const returnPeriod = meanFreq && meanFreq > 0 ? (1 / meanFreq) : null;
                        const methodCounts = getMethodSpecificCounts('Method 5', allMethod5Results);
                        
                        summaryData.push({
                            method: 'Method 5',
                            description: 'CAT Model by Return Period',
                            meanVulnerability: nonZeroVulnerabilities.length > 0 ? (nonZeroVulnerabilities.reduce((sum, v) => sum + v, 0) / nonZeroVulnerabilities.length) : null,
                            meanFrequency: meanFreq,
                            meanReturnPeriod: returnPeriod,
                            meanIntensity: nonZeroIntensities.length > 0 ? (nonZeroIntensities.reduce((sum, i) => sum + i, 0) / nonZeroIntensities.length) : null,
                            sampleSize: allMethod5Results.length,
                            ...methodCounts
                        });
                    }
                }
                
                // Method 6 statistics - using only NON-ZERO values
                if (window.method6ResultsByPeriod) {
                    const allMethod6Results = [];
                    Object.keys(window.method6ResultsByPeriod).forEach(periodHazardKey => {
                        if (window.method6ResultsByPeriod[periodHazardKey] && window.method6ResultsByPeriod[periodHazardKey].length > 0) {
                            const groupResults = window.method6ResultsByPeriod[periodHazardKey].flatMap(building => building.results);
                            allMethod6Results.push(...groupResults);
                        }
                    });
                    
                    if (allMethod6Results.length > 0) {
                        // Filter for non-zero values only
                        const nonZeroVulnerabilities = allMethod6Results.map(r => r.vulnerability).filter(v => v !== null && !isNaN(v) && v > 0);
                        const nonZeroFrequencies = allMethod6Results.map(r => r.frequency).filter(f => f !== null && !isNaN(f) && f > 0);
                        const nonZeroIntensities = allMethod6Results.map(r => r.intensity).filter(i => i !== null && !isNaN(i) && i > 0);
                        
                        const meanFreq = nonZeroFrequencies.length > 0 ? (nonZeroFrequencies.reduce((sum, f) => sum + f, 0) / nonZeroFrequencies.length) : null;
                        const returnPeriod = meanFreq && meanFreq > 0 ? (1 / meanFreq) : null;
                        const methodCounts = getMethodSpecificCounts('Method 6', allMethod6Results);
                        
                        summaryData.push({
                            method: 'Method 6',
                            description: 'CAT Model by Return Period & Hazard',
                            meanVulnerability: nonZeroVulnerabilities.length > 0 ? (nonZeroVulnerabilities.reduce((sum, v) => sum + v, 0) / nonZeroVulnerabilities.length) : null,
                            meanFrequency: meanFreq,
                            meanReturnPeriod: returnPeriod,
                            meanIntensity: nonZeroIntensities.length > 0 ? (nonZeroIntensities.reduce((sum, i) => sum + i, 0) / nonZeroIntensities.length) : null,
                            sampleSize: allMethod6Results.length,
                            ...methodCounts
                        });
                    }
                }
                
                if (summaryData.length === 0) {
                    container.innerHTML = '<div class="text-center p-4 text-muted"><h5>No CAT model data available for summary</h5></div>';
                    return;
                }
                
                // Helper function to format numbers
                const formatNumber = (value) => {
                    if (value === null || value === undefined || isNaN(value)) return 'N/A';
                    if (value < 0.001) return value.toExponential(3);
                    if (value < 1) return value.toFixed(4);
                    return value.toFixed(3);
                };
                
                // Helper function to format integers
                const formatInteger = (value) => {
                    if (value === null || value === undefined || isNaN(value)) return 'N/A';
                    return value.toLocaleString();
                };
                
                // Define AG Grid column definitions
                const columnDefs = [
                    {
                        headerName: 'Cat models general stats',
                        headerClass: 'header-group',
                        children: [
                            {
                                headerName: 'CAT Method',
                                field: 'method',
                                width: 140,
                                minWidth: 140,
                                cellStyle: {
                                    'font-weight': 'bold',
                                    'text-align': 'center',
                                    'background-color': '#f8f9fa'
                                }
                            },
                            {
                                headerName: 'Description',
                                field: 'description',
                                width: 280,
                                minWidth: 280
                            },
                            {
                                headerName: 'Mean Vulnerability',
                                field: 'meanVulnerability',
                                width: 200,
                                minWidth: 200,
                                cellRenderer: (params) => formatNumber(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'font-family': 'monospace'
                                }
                            },
                            {
                                headerName: 'Mean Frequency',
                                field: 'meanFrequency',
                                width: 180,
                                minWidth: 180,
                                cellRenderer: (params) => formatNumber(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'font-family': 'monospace'
                                }
                            },
                            {
                                headerName: 'Mean Return Period',
                                field: 'meanReturnPeriod',
                                width: 200,
                                minWidth: 200,
                                cellRenderer: (params) => formatNumber(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'font-family': 'monospace',
                                    'background-color': '#e3f2fd'
                                }
                            },
                            {
                                headerName: 'Mean Intensity',
                                field: 'meanIntensity',
                                width: 180,
                                minWidth: 180,
                                cellRenderer: (params) => formatNumber(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'font-family': 'monospace'
                                }
                            },
                            {
                                headerName: 'Sample Size',
                                field: 'sampleSize',
                                width: 140,
                                minWidth: 140,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'font-weight': 'bold'
                                }
                            }
                        ]
                    },
                    {
                        headerName: 'Return Periods & Hazard Levels (Non-Zero Values)',
                        headerClass: 'header-group',
                        children: [
                            {
                                headerName: 'RP 30',
                                field: 'rp30',
                                width: 100,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#e3f2fd'
                                }
                            },
                            {
                                headerName: 'RP 100',
                                field: 'rp100',
                                width: 100,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#e8f5e8'
                                }
                            },
                            {
                                headerName: 'RP 300',
                                field: 'rp300',
                                width: 100,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#f3e5f5'
                                }
                            },
                            {
                                headerName: 'Level Low',
                                field: 'levelLow',
                                width: 120,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#fff3e0'
                                }
                            },
                            {
                                headerName: 'Level Mean',
                                field: 'levelMean',
                                width: 120,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#fff8e1'
                                }
                            },
                            {
                                headerName: 'Level High',
                                field: 'levelHigh',
                                width: 120,
                                cellRenderer: (params) => formatInteger(params.value),
                                cellStyle: {
                                    'text-align': 'center',
                                    'background-color': '#ffebee'
                                }
                            }
                        ]
                    }
                ];
                
                // Clear container and create AG Grid wrapper
                container.innerHTML = `
                    <div style="padding: 15px; background-color: #f8f9fa;">
                        <div id="cat-summary-ag-grid" class="ag-theme-alpine" style="height: 500px; width: 100%;"></div>
                        <div style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                            <strong>Note:</strong> Mean values are calculated from NON-ZERO simulation results only for each method. 
                            Return Period = 1/Frequency (non-zero frequencies only). 
                            <br><strong>Column Distribution:</strong> Method 3 - uses sample size only (no RP/level specific). 
                            Method 4 - uses hazard levels only. Method 5 - uses return periods only. Method 6 - uses both return periods and hazard levels.
                            <br><strong>Return Periods:</strong> 30, 100, and 300 years supported.
                        </div>
                    </div>
                `;
                
                // Create AG Grid
                const gridDiv = document.getElementById('cat-summary-ag-grid');
                const gridOptions = {
                    columnDefs: columnDefs,
                    rowData: summaryData,
                    defaultColDef: {
                        sortable: true,
                        filter: true,
                        resizable: true,
                        minWidth: 100,
                        headerTooltip: true
                    },
                    suppressRowHoverHighlight: false,
                    rowSelection: 'single',
                    animateRows: true,
                    suppressMenuHide: true,
                    headerHeight: 50,
                    rowHeight: 50,
                    domLayout: 'normal',
                    suppressHorizontalScroll: false,
                    alwaysShowHorizontalScroll: true
                };
                
                // Initialize the grid using multiple fallback methods for compatibility
                let gridApi;
                try {
                    // Try modern AG Grid API first
                    if (typeof agGrid.createGrid === 'function') {
                        console.log('Using agGrid.createGrid method');
                        gridApi = agGrid.createGrid(gridDiv, gridOptions);
                    } else if (typeof agGrid.Grid === 'function') {
                        console.log('Using agGrid.Grid constructor');
                        gridApi = new agGrid.Grid(gridDiv, gridOptions);
                    } else {
                        console.log('Available AG Grid methods:', Object.keys(agGrid));
                        throw new Error('AG Grid constructor not found');
                    }
                } catch (gridError) {
                    console.error('AG Grid initialization failed:', gridError);
                    // Fallback to basic HTML table
                    container.innerHTML = `
                        <div style="padding: 15px; background-color: #f8f9fa;">
                            <div class="alert alert-warning">
                                <strong>Note:</strong> AG Grid failed to initialize. Displaying basic table instead.
                            </div>
                            <div style="overflow-x: auto;">
                                <table class="table table-striped table-bordered" style="margin: 0; background-color: white; min-width: 1200px;">
                                    <thead style="background-color: #343a40; color: white;">
                                        <tr>
                                            <th style="padding: 8px; text-align: center;">Method</th>
                                            <th style="padding: 8px; text-align: center;">Description</th>
                                            <th style="padding: 8px; text-align: center;">Mean Vuln</th>
                                            <th style="padding: 8px; text-align: center;">Mean Freq</th>
                                            <th style="padding: 8px; text-align: center;">Mean Return Period</th>
                                            <th style="padding: 8px; text-align: center;">Mean Intensity</th>
                                            <th style="padding: 8px; text-align: center;">Sample Size</th>
                                            <th style="padding: 8px; text-align: center;">RP30 Low</th>
                                            <th style="padding: 8px; text-align: center;">RP30 Med</th>
                                            <th style="padding: 8px; text-align: center;">RP30 High</th>
                                            <th style="padding: 8px; text-align: center;">RP100 Low</th>
                                            <th style="padding: 8px; text-align: center;">RP100 Med</th>
                                            <th style="padding: 8px; text-align: center;">RP100 High</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${summaryData.map(row => `
                                            <tr>
                                                <td style="padding: 8px; text-align: center; font-weight: bold;">${row.method}</td>
                                                <td style="padding: 8px;">${row.description}</td>
                                                <td style="padding: 8px; text-align: center; font-family: monospace;">${formatNumber(row.meanVulnerability)}</td>
                                                <td style="padding: 8px; text-align: center; font-family: monospace;">${formatNumber(row.meanFrequency)}</td>
                                                <td style="padding: 8px; text-align: center; font-family: monospace; background-color: #e3f2fd;">${formatNumber(row.meanReturnPeriod)}</td>
                                                <td style="padding: 8px; text-align: center; font-family: monospace;">${formatNumber(row.meanIntensity)}</td>
                                                <td style="padding: 8px; text-align: center; font-weight: bold;">${formatInteger(row.sampleSize)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #fff3e0;">${formatInteger(row.rp30_low)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #fff8e1;">${formatInteger(row.rp30_medium)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #ffebee;">${formatInteger(row.rp30_high)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #e8f5e8;">${formatInteger(row.rp100_low)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #f3e5f5;">${formatInteger(row.rp100_medium)}</td>
                                                <td style="padding: 8px; text-align: center; background-color: #fce4ec;">${formatInteger(row.rp100_high)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div style="margin-top: 15px; font-size: 12px; color: #6c757d;">
                                <strong>Note:</strong> Mean values are calculated from all Monte Carlo simulation results for each method. 
                                Return Period = 1/Frequency. Non-zero value counts show the number of simulation points with frequency > 0 
                                for each combination of return period (30, 100 years) and hazard level (Low, Medium, High).
                            </div>
                        </div>
                    `;
                    return;
                }
                
                console.log('✅ CAT models summary table created with', summaryData.length, 'methods');
                console.log('📊 Summary data:', summaryData);
                
            } catch (error) {
                console.error('❌ Error creating CAT models summary AG Grid table:', error);
                container.innerHTML = '<div class="text-center p-4 text-danger"><h5>Error creating summary table</h5></div>';
            }
        }, 1200);
    }

    // ============================
    // BUILDING HIGHLIGHTING
    // ============================
    // Moved to analysis-visualization.js module
    // Function: highlightAnalyzedBuildings()
    
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
        
        // Manual canton selection - only the 3 cantons you specified
        const cantons = ['Graubünden','Ticino','Valais', 'Vaud', 'Genève'].sort(); // Sort alphabetically 
    
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
// Moved to building-management.js module
// Function: removeOverlayByName()

// Function to add hazard GeoJSON to the map with appropriate styling and popups
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
                            color = '#4575b4'; fillOpacity = 0.6; break;
                        case 'faible':
                            color = '#fcf11bff'; fillOpacity = 0.4; break;
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
                            else if (v >= 0.33) { color = '#4575b4'; fillOpacity = 0.6; }
                            else { color = '#fcf11bff'; fillOpacity = 0.4; }
                        } else {
                            // string mapping
                            const s = String(v).trim().toLowerCase();
                            if (s.match(/forte|high|élevé|eleve|elev/)) { color = '#d73027'; fillOpacity = 0.8; }
                            else if (s.match(/moyenne|mean|moyen|moderate/)) { color = '#4575b4'; fillOpacity = 0.6; }
                            else if (s.match(/faible|low|faibl/)) { color = '#fcf11bff'; fillOpacity = 0.4; }
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
            .flatMap(j => j.features)
            .filter(feature => {
                // Filter out aucune_atteinte features from hazard maps
                const intensity = feature.properties?.classe_d_intensites || feature.properties?.intensity_ || feature.properties?.intensity || '';
                const intensityLower = String(intensity).toLowerCase().trim();
                return intensityLower !== 'aucune_atteinte' && intensityLower !== 'aucune atteinte';
            });
        console.log('  Total combined features:', allFeatures.length, '(after filtering out aucune_atteinte)');
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
            
            // Remove existing drawn polygon if any
            if (window.drawnPolygon && window.map.hasLayer(window.drawnPolygon)) {
                window.map.removeLayer(window.drawnPolygon);
                window.fgp.removeLayer(window.drawnPolygon);
                console.log('🗑️ Removed previous drawn polygon');
            }
            
            // Remove existing analysis layers
            if (typeof removeExistingAnalysisLayers === 'function') {
                removeExistingAnalysisLayers();
            }
            
            // Store new polygon
            window.drawnPolygon = layer;

            // Enable analysis button
            const runAnalysisBtn = document.getElementById('run-analysis-btn');
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

// ==================== MAIN INITIALIZATION - MODULAR ARCHITECTURE ====================
/**
 * Main application initialization sequence - Step 6 Enhanced
 */
function initializeEverything() {
    console.log('🚀 Initializing WebGIS Risk Assessment Application (Modular Architecture)...');
    
    try {
        // Core Application Components
        console.log('⚙️ Initializing core components...');
        initializeResetButton();
        initializeWorkflow();
        initializeLayerControls();
        
        // Map Initialization
        console.log('🗺️ Initializing map system...');
        if (typeof initializeMap === 'function') {
            initializeMap();
            
            // Draw functionality (requires map to be ready)
            setTimeout(() => {
                console.log('🎨 Initializing drawing functionality...');
                initializeDrawFunctionality();
            }, 1500);
        } else {
            console.warn('⚠️ initializeMap not found, will retry...');
            setTimeout(() => {
                if (typeof initializeMap === 'function') {
                    initializeMap();
                    
                    // Initialize draw functionality after map is ready
                    setTimeout(() => {
                        console.log('🎨 Retry: Initializing drawing functionality...');
                        initializeDrawFunctionality();
                    }, 1500);
                } else {
                    console.error('❌ initializeMap still not available after retry');
                }
            }, 1000);
        }
        
        // Module Validation (after slight delay to allow modules to load)
        setTimeout(() => {
            console.log('🔍 Validating modular components...');
            validateModularComponents();
            console.log('✅ Application initialization completed');
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error during application initialization:', error);
    }
}

/**
 * Validate that all required modular components are loaded
 */
function validateModularComponents() {
    const requiredModules = [
        { name: 'building-management.js', functions: ['loadBuildingsFromSupabase', 'initializeBuildingButton'] },
        { name: 'analysis-visualization.js', functions: ['initializeAnalysisControls', 'showAnalysisResultsModal'] },
        { name: 'spatial-analysis.js', functions: ['extractDataInsidePolygon', 'spatialHazardProbValdorisk'] },
        { name: 'vulnerability.js', functions: ['rockVulnerabilityDefaults', 'showVulnerabilityModal'] }
    ];
    
    let allModulesLoaded = true;
    
    requiredModules.forEach(module => {
        const loadedFunctions = module.functions.filter(func => {
            return typeof window[func] === 'function' || typeof window[func] === 'object';
        });
        
        if (loadedFunctions.length === module.functions.length) {
            console.log(`✅ ${module.name} - All functions loaded (${loadedFunctions.length}/${module.functions.length})`);
        } else {
            console.warn(`⚠️ ${module.name} - Partial loading (${loadedFunctions.length}/${module.functions.length})`);
            module.functions.forEach(func => {
                if (typeof window[func] === 'undefined') {
                    console.warn(`  - Missing: ${func}`);
                }
            });
            allModulesLoaded = false;
        }
    });
    
    if (allModulesLoaded) {
        console.log('🎉 All modular components validated successfully');
    } else {
        console.warn('⚠️ Some modular components may not be fully loaded - check module imports');
    }
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

// ==================== CAT MODEL CSV EXPORT FUNCTIONALITY ====================

/**
 * Export CAT Model results (Methods 3, 4, 5, 6) to CSV format
 */
function exportCATResultsToCSV() {
    console.log('📊 Starting CAT Model results CSV export...');
    
    try {
        // Check if any CAT model results exist
        const hasMethod3 = window.method3Results && window.method3Results.length > 0;
        const hasMethod4 = window.method4Results && window.method4Results.length > 0;
        const hasMethod5 = window.method5Results && window.method5Results.length > 0;
        const hasMethod6 = window.method6Results && window.method6Results.length > 0;
        
        if (!hasMethod3 && !hasMethod4 && !hasMethod5 && !hasMethod6) {
            alert('❌ No CAT Model results found. Please run the analysis first.');
            return;
        }
        
        console.log(`📈 Found results - Method 3: ${hasMethod3 ? window.method3Results.length : 0}, Method 4: ${hasMethod4 ? window.method4Results.length : 0}, Method 5: ${hasMethod5 ? window.method5Results.length : 0}, Method 6: ${hasMethod6 ? window.method6Results.length : 0}`);
        
        // CSV headers
        const headers = [
            'Method',
            'simulation_number', 
            'building_id',
            'return_period',
            'intensity_level',
            'intensity_calculated',
            'vulnerability',
            'weight_frequency',
            'weight_intensity',
            'building_cost',
            'damage'
        ];
        
        // Start CSV content with explanation
        let csvContent = '# CAT Model Results Export\n';
        csvContent += '# Individual simulation data below\n';
        csvContent += '# For comparison graph values see building summaries at the end\n';
        csvContent += '#\n';
        csvContent += headers.join(',') + '\n';
        
        // Process Method 3 results
        if (hasMethod3) {
            console.log('📋 Processing Method 3 results...');
            window.method3Results.forEach((result, index) => {
                const row = [
                    'Method_3',
                    result.simulation || (index + 1),
                    `"${result.buildingId || 'unknown'}"`, // Use stored building ID
                    '', // No return period for Method 3
                    '', // No intensity level for Method 3 
                    result.intensity || 0,
                    result.vulnerability || 0,
                    '', // Method 3 doesn't use weighted frequency in current implementation
                    '', // Method 3 doesn't use weighted intensity in current implementation
                    result.buildingCost || 0,
                    result.damage || 0
                ];
                csvContent += row.join(',') + '\n';
            });
        }
        
        // Process Method 4 results
        if (hasMethod4) {
            console.log('📋 Processing Method 4 results...');
            window.method4Results.forEach((result, index) => {
                const row = [
                    'Method_4',
                    result.simulation || (index + 1),
                    `"${result.buildingId || 'unknown'}"`, // Use stored building ID
                    result.returnPeriod || '',
                    `"${result.hazardIntensity || ''}"`, // Wrap in quotes for intensity level text
                    result.intensity || 0,
                    result.vulnerability || 0,
                    result.frequenceEconoMe4 || '', // Using stored EconoMe frequency
                    result.weightedIntensity || '', // Using stored weighted intensity
                    result.buildingCost || 0,
                    result.damage || 0
                ];
                csvContent += row.join(',') + '\n';
            });
        }
        
        // Process Method 5 results
        if (hasMethod5) {
            console.log('📋 Processing Method 5 results...');
            window.method5Results.forEach((result, index) => {
                const row = [
                    'Method_5',
                    result.simulation || (index + 1),
                    `"${result.buildingId || 'unknown'}"`, // Use stored building ID
                    result.returnPeriod || '',
                    '', // No intensity level for Method 5
                    result.intensity || 0,
                    result.vulnerability || 0,
                    result.frequenceEconoMe5 || '', // Using stored EconoMe frequency
                    result.weightedIntensity || '', // Using stored weighted intensity
                    result.buildingCost || 0,
                    result.damage || 0
                ];
                csvContent += row.join(',') + '\n';
            });
        }
        
        // Process Method 6 results
        if (hasMethod6) {
            console.log('📋 Processing Method 6 results...');
            window.method6Results.forEach((result, index) => {
                const row = [
                    'Method_6',
                    result.simulation || (index + 1),
                    `"${result.buildingId || 'unknown'}"`, // Use stored building ID
                    result.returnPeriod || '',
                    `"${result.hazardLevel || ''}"`, // Wrap in quotes for hazard level text
                    result.intensity || 0,
                    result.vulnerability || 0,
                    result.frequenceEconoMe6 || '', // Using stored EconoMe frequency
                    result.weightedIntensity || '', // Using stored weighted intensity
                    result.buildingCost || 0,
                    result.damage || 0
                ];
                csvContent += row.join(',') + '\n';
            });
        }
        
        // Add building summaries section to CSV
        csvContent += '\n\n# BUILDING SUMMARIES (Per-building mean damages)\n';
        csvContent += 'building_id,method_3_mean_damage,method_4_mean_damage,method_5_mean_damage,method_6_mean_damage,building_cost,hazard_intensity,return_period\n';
        
        if (window.latestExtractionResults?.buildingsAnalyzed) {
            window.latestExtractionResults.buildingsAnalyzed.forEach((building, index) => {
                const egid = building.EGID || building.properties?.EGID || `building_${index + 1}`;
                const row = [
                    `"${egid}"`,
                    building.METHOD3_MEAN_DAMAGE || 0,
                    building.METHOD4_MEAN_DAMAGE || 0,
                    building.METHOD5_MEAN_DAMAGE || 0,
                    building.METHOD6_MEAN_DAMAGE || 0,
                    building.TOTAL_COST || building.properties?.TOTAL_COST || 0,
                    `"${building.intensity || ''}"`,
                    `"${building.recurrence || ''}"`
                ];
                csvContent += row.join(',') + '\n';
            });
        }
        
        // Add comparison totals section to CSV (explains graph values)
        csvContent += '\n\n# COMPARISON GRAPH VALUES (Total damage sums)\n';
        csvContent += 'method,buildings_count,total_damage_CHF,calculation,note\n';
        
        if (window.latestExtractionResults?.buildingsAnalyzed) {
            const buildings = window.latestExtractionResults.buildingsAnalyzed;
            
            // Method 3 total
            const method3Buildings = buildings.filter(b => b.METHOD3_MEAN_DAMAGE > 0);
            if (method3Buildings.length > 0) {
                const total3 = method3Buildings.reduce((sum, b) => sum + b.METHOD3_MEAN_DAMAGE, 0);
                csvContent += `Method_3,${method3Buildings.length},${total3},"Sum of each building mean damage","This matches the comparison graph value"\n`;
            }
            
            // Method 4 total
            const method4Buildings = buildings.filter(b => b.METHOD4_MEAN_DAMAGE > 0);
            if (method4Buildings.length > 0) {
                const total4 = method4Buildings.reduce((sum, b) => sum + b.METHOD4_MEAN_DAMAGE, 0);
                csvContent += `Method_4,${method4Buildings.length},${total4},"Sum of each building mean damage","This matches the comparison graph value"\n`;
            }
            
            // Method 5 total
            const method5Buildings = buildings.filter(b => b.METHOD5_MEAN_DAMAGE > 0);
            if (method5Buildings.length > 0) {
                const total5 = method5Buildings.reduce((sum, b) => sum + b.METHOD5_MEAN_DAMAGE, 0);
                csvContent += `Method_5,${method5Buildings.length},${total5},"Sum of each building mean damage","This matches the comparison graph value"\n`;
            }
            
            // Method 6 total
            const method6Buildings = buildings.filter(b => b.METHOD6_MEAN_DAMAGE > 0);
            if (method6Buildings.length > 0) {
                const total6 = method6Buildings.reduce((sum, b) => sum + b.METHOD6_MEAN_DAMAGE, 0);
                csvContent += `Method_6,${method6Buildings.length},${total6},"Sum of each building mean damage","This matches the comparison graph value"\n`;
            }
        }
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            
            // Generate filename with timestamp
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `CAT_Model_Results_${timestamp}.csv`;
            
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`✅ CSV export completed: ${filename}`);
            alert(`✅ CAT Model results exported successfully!\nFile: ${filename}`);
        } else {
            throw new Error('CSV download not supported in this browser');
        }
        
    } catch (error) {
        console.error('❌ CSV export failed:', error);
        alert('❌ Failed to export CSV. Please check the console for details.');
    }
}

/**
 * Export CAT Model results to Excel format with multiple sheets
 */
function exportCATResultsToExcel() {
    console.log('📊 Starting CAT Model results Excel export...');
    
    try {
        // Check if SheetJS is available
        if (typeof XLSX === 'undefined') {
            alert('❌ Excel export library not available. Please refresh the page and try again.');
            return;
        }
        
        // Check if any CAT model results exist
        const hasMethod3 = window.method3Results && window.method3Results.length > 0;
        const hasMethod4 = window.method4Results && window.method4Results.length > 0;
        const hasMethod5 = window.method5Results && window.method5Results.length > 0;
        const hasMethod6 = window.method6Results && window.method6Results.length > 0;
        
        if (!hasMethod3 && !hasMethod4 && !hasMethod5 && !hasMethod6) {
            alert('❌ No CAT Model results found. Please run the analysis first.');
            return;
        }
        
        console.log(`📈 Found results - Method 3: ${hasMethod3 ? window.method3Results.length : 0}, Method 4: ${hasMethod4 ? window.method4Results.length : 0}, Method 5: ${hasMethod5 ? window.method5Results.length : 0}, Method 6: ${hasMethod6 ? window.method6Results.length : 0}`);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Create simulation results data for all methods
        const allSimulations = [];
        
        // Add Method 3 results
        if (hasMethod3) {
            window.method3Results.forEach((result, index) => {
                allSimulations.push({
                    Method: 'Method_3',
                    simulation_number: result.simulation || (index + 1),
                    building_id: result.buildingId || 'unknown',
                    return_period: '',
                    intensity_level: '',
                    intensity_calculated: result.intensity || 0,
                    vulnerability: result.vulnerability || 0,
                    weight_frequency: '',
                    weight_intensity: '',
                    building_cost: result.buildingCost || 0,
                    damage: result.damage || 0
                });
            });
        }
        
        // Add Method 4 results
        if (hasMethod4) {
            window.method4Results.forEach((result, index) => {
                allSimulations.push({
                    Method: 'Method_4',
                    simulation_number: result.simulation || (index + 1),
                    building_id: result.buildingId || 'unknown',
                    return_period: result.returnPeriod || '',
                    intensity_level: result.hazardIntensity || '',
                    intensity_calculated: result.intensity || 0,
                    vulnerability: result.vulnerability || 0,
                    weight_frequency: result.frequenceEconoMe4 || '',
                    weight_intensity: result.weightedIntensity || '',
                    building_cost: result.buildingCost || 0,
                    damage: result.damage || 0
                });
            });
        }
        
        // Add Method 5 results
        if (hasMethod5) {
            window.method5Results.forEach((result, index) => {
                allSimulations.push({
                    Method: 'Method_5',
                    simulation_number: result.simulation || (index + 1),
                    building_id: result.buildingId || 'unknown',
                    return_period: result.returnPeriod || '',
                    intensity_level: '',
                    intensity_calculated: result.intensity || 0,
                    vulnerability: result.vulnerability || 0,
                    weight_frequency: result.frequenceEconoMe5 || '',
                    weight_intensity: result.weightedIntensity || '',
                    building_cost: result.buildingCost || 0,
                    damage: result.damage || 0
                });
            });
        }
        
        // Add Method 6 results
        if (hasMethod6) {
            window.method6Results.forEach((result, index) => {
                allSimulations.push({
                    Method: 'Method_6',
                    simulation_number: result.simulation || (index + 1),
                    building_id: result.buildingId || 'unknown',
                    return_period: result.returnPeriod || '',
                    intensity_level: result.hazardLevel || '',
                    intensity_calculated: result.intensity || 0,
                    vulnerability: result.vulnerability || 0,
                    weight_frequency: result.frequenceEconoMe6 || '',
                    weight_intensity: result.weightedIntensity || '',
                    building_cost: result.buildingCost || 0,
                    damage: result.damage || 0
                });
            });
        }
        
        // Create simulation results worksheet
        const wsSimulations = XLSX.utils.json_to_sheet(allSimulations);
        XLSX.utils.book_append_sheet(wb, wsSimulations, 'All_Simulations');
        
        // Create building summaries sheet (matches comparison graph logic)
        const buildingSummaries = [];
        if (window.latestExtractionResults?.buildingsAnalyzed) {
            const buildings = window.latestExtractionResults.buildingsAnalyzed;
            
            buildings.forEach((building, index) => {
                const egid = building.EGID || building.properties?.EGID || `building_${index + 1}`;
                
                buildingSummaries.push({
                    building_id: egid,
                    method_3_mean_damage: building.METHOD3_MEAN_DAMAGE || 0,
                    method_4_mean_damage: building.METHOD4_MEAN_DAMAGE || 0,
                    method_5_mean_damage: building.METHOD5_MEAN_DAMAGE || 0,
                    method_6_mean_damage: building.METHOD6_MEAN_DAMAGE || 0,
                    building_cost: building.TOTAL_COST || building.properties?.TOTAL_COST || 0,
                    hazard_intensity: building.intensity || '',
                    return_period: building.recurrence || ''
                });
            });
        }
        
        if (buildingSummaries.length > 0) {
            const wsBuildingSummaries = XLSX.utils.json_to_sheet(buildingSummaries);
            XLSX.utils.book_append_sheet(wb, wsBuildingSummaries, 'Building_Summaries');
        }
        
        // Create comparison totals sheet (explains graph values)
        const comparisonTotals = [];
        if (window.latestExtractionResults?.buildingsAnalyzed) {
            const buildings = window.latestExtractionResults.buildingsAnalyzed;
            
            // Calculate totals as shown in comparison graph
            const method3Buildings = buildings.filter(b => b.METHOD3_MEAN_DAMAGE > 0);
            const method4Buildings = buildings.filter(b => b.METHOD4_MEAN_DAMAGE > 0);
            const method5Buildings = buildings.filter(b => b.METHOD5_MEAN_DAMAGE > 0);
            const method6Buildings = buildings.filter(b => b.METHOD6_MEAN_DAMAGE > 0);
            
            if (method3Buildings.length > 0) {
                const total = method3Buildings.reduce((sum, b) => sum + b.METHOD3_MEAN_DAMAGE, 0);
                comparisonTotals.push({
                    method: 'Method_3',
                    buildings_count: method3Buildings.length,
                    total_damage_CHF: total,
                    calculation: 'Sum of each building mean damage',
                    note: 'This matches the comparison graph value'
                });
            }
            
            if (method4Buildings.length > 0) {
                const total = method4Buildings.reduce((sum, b) => sum + b.METHOD4_MEAN_DAMAGE, 0);
                comparisonTotals.push({
                    method: 'Method_4',
                    buildings_count: method4Buildings.length,
                    total_damage_CHF: total,
                    calculation: 'Sum of each building mean damage',
                    note: 'This matches the comparison graph value'
                });
            }
            
            if (method5Buildings.length > 0) {
                const total = method5Buildings.reduce((sum, b) => sum + b.METHOD5_MEAN_DAMAGE, 0);
                comparisonTotals.push({
                    method: 'Method_5',
                    buildings_count: method5Buildings.length,
                    total_damage_CHF: total,
                    calculation: 'Sum of each building mean damage',
                    note: 'This matches the comparison graph value'
                });
            }
            
            if (method6Buildings.length > 0) {
                const total = method6Buildings.reduce((sum, b) => sum + b.METHOD6_MEAN_DAMAGE, 0);
                comparisonTotals.push({
                    method: 'Method_6',
                    buildings_count: method6Buildings.length,
                    total_damage_CHF: total,
                    calculation: 'Sum of each building mean damage',
                    note: 'This matches the comparison graph value'
                });
            }
        }
        
        if (comparisonTotals.length > 0) {
            const wsComparisonTotals = XLSX.utils.json_to_sheet(comparisonTotals);
            XLSX.utils.book_append_sheet(wb, wsComparisonTotals, 'Comparison_Graph_Values');
        }
        
        // Create validation sheet to explain calculation differences
        const validationData = [];
        
        // Add explanatory header information
        validationData.push({
            calculation_type: 'EXPLANATION',
            description: 'Why Excel mean ≠ Building mean damages',
            method_3: 'Per-building calculation',
            method_4: 'Per-building calculation', 
            method_5: 'Per-building calculation',
            method_6: 'Per-building calculation',
            note: 'Each building processed individually'
        });
        
        validationData.push({
            calculation_type: 'All_Simulations_Sheet',
            description: 'Mean of all simulations combined',
            method_3: hasMethod3 ? (window.method3Results.reduce((sum, r) => sum + r.damage, 0) / window.method3Results.length).toFixed(2) : 'N/A',
            method_4: hasMethod4 ? (window.method4Results.reduce((sum, r) => sum + r.damage, 0) / window.method4Results.length).toFixed(2) : 'N/A',
            method_5: hasMethod5 ? (window.method5Results.reduce((sum, r) => sum + r.damage, 0) / window.method5Results.length).toFixed(2) : 'N/A',
            method_6: hasMethod6 ? (window.method6Results.reduce((sum, r) => sum + r.damage, 0) / window.method6Results.length).toFixed(2) : 'N/A',
            note: 'This is what you get when you average All_Simulations sheet'
        });
        
        // Calculate per-building means
        if (window.latestExtractionResults?.buildingsAnalyzed) {
            const buildings = window.latestExtractionResults.buildingsAnalyzed;
            
            // Average of building means (comparison graph uses sum, not average)
            const validBuildings3 = buildings.filter(b => b.METHOD3_MEAN_DAMAGE > 0);
            const validBuildings4 = buildings.filter(b => b.METHOD4_MEAN_DAMAGE > 0);
            const validBuildings5 = buildings.filter(b => b.METHOD5_MEAN_DAMAGE > 0);
            const validBuildings6 = buildings.filter(b => b.METHOD6_MEAN_DAMAGE > 0);
            
            validationData.push({
                calculation_type: 'Building_Summaries_Average',
                description: 'Average of building mean damages',
                method_3: validBuildings3.length > 0 ? (validBuildings3.reduce((sum, b) => sum + b.METHOD3_MEAN_DAMAGE, 0) / validBuildings3.length).toFixed(2) : 'N/A',
                method_4: validBuildings4.length > 0 ? (validBuildings4.reduce((sum, b) => sum + b.METHOD4_MEAN_DAMAGE, 0) / validBuildings4.length).toFixed(2) : 'N/A',
                method_5: validBuildings5.length > 0 ? (validBuildings5.reduce((sum, b) => sum + b.METHOD5_MEAN_DAMAGE, 0) / validBuildings5.length).toFixed(2) : 'N/A',
                method_6: validBuildings6.length > 0 ? (validBuildings6.reduce((sum, b) => sum + b.METHOD6_MEAN_DAMAGE, 0) / validBuildings6.length).toFixed(2) : 'N/A',
                note: 'Average of values in Building_Summaries sheet'
            });
            
            validationData.push({
                calculation_type: 'Building_Summaries_Sum',
                description: 'Sum of building mean damages',
                method_3: validBuildings3.length > 0 ? validBuildings3.reduce((sum, b) => sum + b.METHOD3_MEAN_DAMAGE, 0).toFixed(2) : 'N/A',
                method_4: validBuildings4.length > 0 ? validBuildings4.reduce((sum, b) => sum + b.METHOD4_MEAN_DAMAGE, 0).toFixed(2) : 'N/A',
                method_5: validBuildings5.length > 0 ? validBuildings5.reduce((sum, b) => sum + b.METHOD5_MEAN_DAMAGE, 0).toFixed(2) : 'N/A',
                method_6: validBuildings6.length > 0 ? validBuildings6.reduce((sum, b) => sum + b.METHOD6_MEAN_DAMAGE, 0).toFixed(2) : 'N/A',
                note: 'Sum of values in Building_Summaries sheet (= Comparison_Graph_Values)'
            });
        }
        
        const wsValidation = XLSX.utils.json_to_sheet(validationData);
        XLSX.utils.book_append_sheet(wb, wsValidation, 'Calculation_Validation');
        
        // Generate filename with timestamp
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const filename = `CAT_Model_Results_${timestamp}.xlsx`;
        
        // Write and download Excel file
        XLSX.writeFile(wb, filename);
        
        console.log(`✅ Excel export completed: ${filename}`);
        alert(`✅ CAT Model results exported to Excel successfully!\nFile: ${filename}\n\nSheets included:\n• All_Simulations: Individual simulation data\n• Building_Summaries: Per-building mean damages\n• Comparison_Graph_Values: Totals shown in comparison graph\n• Calculation_Validation: Explains why different calculations give different means\n\n⚠️ Note: The mean of All_Simulations ≠ Building mean damages because each building is processed individually with different parameters.`);
        
    } catch (error) {
        console.error('❌ Excel export failed:', error);
        alert('❌ Failed to export Excel. Please check the console for details.');
    }
}

// Make the export functions globally available
window.exportCATResultsToCSV = exportCATResultsToCSV;
window.exportCATResultsToExcel = exportCATResultsToExcel;

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEverything);
} else {
    initializeEverything();
}

// console.log('📄 Simple app.js loaded');
