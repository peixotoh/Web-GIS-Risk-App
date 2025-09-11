// ==================== SIMPLE WORKING SYSTEM ====================

// console.log('📄 Simple app.js loading...');

// Theme functionality
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeToggle.checked = currentTheme === 'dark';

    themeToggle.addEventListener('change', function(e) {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// Working tab functionality
function initializeTabs() {
    // console.log('📋 Setting up working tabs...');
    
    // Get tab elements
    const tabButtons = document.querySelectorAll('#tabs ul li a');
    const tabPanels = document.querySelectorAll('#tabs > div[id^="tabs-"]');
    
    // console.log('Found tabs:', tabButtons.length, 'panels:', tabPanels.length);
    
    if (tabButtons.length === 0 || tabPanels.length === 0) {
        console.error('❌ No tabs found');
        return;
    }
    
    // Hide all panels initially (with !important to override CSS)
    tabPanels.forEach(panel => {
        panel.style.setProperty('display', 'none', 'important');
        panel.style.setProperty('visibility', 'hidden', 'important');
    });
    
    // Show first panel (Visualization)
    if (tabPanels[0]) {
        tabPanels[0].style.setProperty('display', 'block', 'important');
        tabPanels[0].style.setProperty('visibility', 'visible', 'important');
        tabButtons[0].parentElement.style.backgroundColor = '#fff';
    }
    
    // Add click handlers
    tabButtons.forEach((button) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the target panel ID from href
            const targetId = button.getAttribute('href').substring(1); // Remove #
            const targetPanel = document.getElementById(targetId);
            
            // console.log('Tab clicked:', button.textContent, 'Target:', targetId);
            
            if (!targetPanel) {
                console.error('❌ Target panel not found:', targetId);
                return;
            }
            
            // Hide all panels (with !important to override CSS)
            tabPanels.forEach(panel => {
                panel.style.setProperty('display', 'none', 'important');
                panel.style.setProperty('visibility', 'hidden', 'important');
                panel.style.setProperty('opacity', '0', 'important');
            });
            
            // Remove active styling from all tabs
            tabButtons.forEach(btn => {
                btn.parentElement.style.backgroundColor = '';
                btn.parentElement.classList.remove('active');
            });
            
            // Show target panel (with !important to override CSS)
            targetPanel.style.setProperty('display', 'block', 'important');
            targetPanel.style.setProperty('visibility', 'visible', 'important');
            targetPanel.style.setProperty('opacity', '1', 'important');
            targetPanel.style.setProperty('height', 'auto', 'important');
            
            // Add active styling to clicked tab
            button.parentElement.style.backgroundColor = '#fff';
            button.parentElement.classList.add('active');
            
            // console.log('✅ Switched to tab:', targetId);
            // console.log('📋 Panel display:', targetPanel.style.display);
            // console.log('📋 Panel visibility:', targetPanel.style.visibility);
            // console.log('📋 Panel children count:', targetPanel.children.length);
        });
    });
    
    // console.log('✅ Working tabs initialized');
}

// Rockfall layer functionality
let rockfallLayer = null;

function addRockfallLayer() {
    // console.log('🪨 Adding rockfall layer...');
    
    // Check if ti_hazards is available
    if (typeof ti_hazards === 'undefined') {
        console.error('❌ ti_hazards data not available');
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
    const rockfallFeatures = ti_hazards.features.filter(feature => 
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

// ==================== HAZARDS ATTRIBUTES TABLE FUNCTIONALITY ====================

// Global variable to store current hazards data for attributes table
let currentHazardsData = null;

// Function to show the hazards attributes table
function showHazardsAttributesTable(hazardType = 'all') {
    if (typeof ti_hazards === 'undefined') {
        // alert('⚠️ Hazards data not available. Please refresh the page.');
        console.error('⚠️ Hazards data not available');
        return;
    }
    
    // Filter hazards data based on type
    let filteredData = ti_hazards.features;
    if (hazardType !== 'all') {
        filteredData = ti_hazards.features.filter(feature => 
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
    // console.log('🔧 Setting up layer controls...');
    
    // Buildings control
    const buildToggle = document.getElementById('build-hide-show');
    const buildSection = document.getElementById('fr-build-1');
    
    if (buildToggle && buildSection) {
        buildSection.style.display = 'none'; // Start hidden
        
        buildToggle.addEventListener('click', function() {
            if (buildSection.style.display === 'none') {
                buildSection.style.display = 'block';
                // console.log('🏢 Buildings section opened');
            } else {
                buildSection.style.display = 'none';
                // console.log('🏢 Buildings section closed');
            }
        });
        // console.log('✅ Buildings control ready');
    }
    
    // Rockfall control
    const rockToggle = document.getElementById('rockfall-hide-show');
    const rockSection = document.getElementById('rock-div-1');
    
    if (rockToggle && rockSection) {
        rockSection.style.display = 'none'; // Start hidden
        
        rockToggle.addEventListener('click', function() {
            if (rockSection.style.display === 'none') {
                rockSection.style.display = 'block';
                // console.log('🪨 Rockfall section opened');
            } else {
                rockSection.style.display = 'none';
                // console.log('🪨 Rockfall section closed');
            }
        });
        // console.log('✅ Rockfall control ready');
    }
    
    // DEM control
    const demToggle = document.getElementById('dem-hide-show');
    const demSection = document.getElementById('dem-1');
    
    if (demToggle && demSection) {
        demSection.style.display = 'none'; // Start hidden
        
        demToggle.addEventListener('click', function() {
            if (demSection.style.display === 'none') {
                demSection.style.display = 'block';
                // console.log('🏔️ DEM section opened');
            } else {
                demSection.style.display = 'none';
                // console.log('🏔️ DEM section closed');
            }
        });
        // console.log('✅ DEM control ready');
    }
    
    // Rockfall layer buttons
    const addRockButton = document.getElementById('add-rock-lyr');
    const removeRockButton = document.getElementById('rem-rock-lyr');
    const attributesRockButton = document.getElementById('att-rock-table');
    
    if (addRockButton) {
        addRockButton.addEventListener('click', addRockfallLayer);
        // console.log('✅ Add rockfall button ready');
    } else {
        console.warn('⚠️ Add rockfall button not found');
    }
    
    if (removeRockButton) {
        removeRockButton.addEventListener('click', removeRockfallLayer);
        // console.log('✅ Remove rockfall button ready');
    } else {
        console.warn('⚠️ Remove rockfall button not found');
    }
    
    if (attributesRockButton) {
        attributesRockButton.addEventListener('click', () => showHazardsAttributesTable('rock_fall'));
        // console.log('✅ Rockfall attributes button ready');
    } else {
        console.warn('⚠️ Rockfall attributes button not found');
    }
}

// Main initialization
function initializeEverything() {
    // console.log('🚀 Starting initialization...');
    
    // Initialize theme
    initializeTheme();
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize layer controls
    initializeLayerControls();
    
    // Initialize map
    // console.log('🗺️ Checking for map initialization...');
    if (typeof initializeMap === 'function') {
        // console.log('✅ Found initializeMap, calling it...');
        initializeMap();
    } else {
        console.warn('⚠️ initializeMap not found, will retry...');
        setTimeout(() => {
            if (typeof initializeMap === 'function') {
                // console.log('✅ Found initializeMap on retry, calling it...');
                initializeMap();
            } else {
                console.error('❌ initializeMap still not available');
            }
        }, 1000);
    }
    
    // console.log('✅ Initialization complete');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEverything);
} else {
    initializeEverything();
}

// console.log('📄 Simple app.js loaded');
