// ==================== SIMPLE SUPABASE BUILDINGS ACCESS ====================

// console.log('📄 supabase-buildings.js loaded');
// console.log('🔍 Current document state:', document.readyState);
// console.log('🔍 window.supabase available immediately:', typeof window.supabase);

// Supabase configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_CONFIG = {
    url: 'https://gmnvtulnusespebjqjrp.supabase.co',        // Replace with your Supabase project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbnZ0dWxudXNlc3BlYmpxanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTA2NTEsImV4cCI6MjA3MzA2NjY1MX0.1MEhdh0Qe8EIfXK2mdc_dznFQ7btPIHfCM_2faGb1GM' // Replace with your Supabase anon key
};

// Initialize Supabase client
let supabase;

// Try immediate setup if document is already ready
if (document.readyState === 'loading') {
    // console.log('📄 Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
    // console.log('📄 Document already loaded, initializing immediately...');
    initializeSupabase();
}

// Also try after a delay to catch any timing issues
setTimeout(() => {
    // console.log('⏰ Delayed initialization attempt...');
    if (!supabase) {
        initializeSupabase();
    }
}, 1000);

function initializeSupabase() {
    // console.log('🔧 Initializing Supabase...');
    // console.log('🔍 window.supabase available:', typeof window.supabase);
    
    try {
        // console.log('🔧 Creating Supabase client...');
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        // console.log('✅ Supabase connected');
        
        // Set up the Add button click handler
        /*
        setupBuildingsButton();
        setupRemoveButton();
        setupAttributesButton();
        */
        
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        // Try again after a delay
        setTimeout(initializeSupabase, 2000);
    }
}
/*
// Function to set up the buildings button
function setupBuildingsButton() {
    // console.log('🔧 Setting up buildings button...');
    // console.log('🔍 Document ready state:', document.readyState);
    
    const button = document.getElementById('fr-add-buil-lyr');
    // console.log('🔍 Button found:', button);
    // console.log('🔍 Button exists:', !!button);
    
    if (button) {
        // Remove any existing event listeners
        button.removeEventListener('click', handleBuildingButtonClick);
        
        // Add new event listener
        button.addEventListener('click', handleBuildingButtonClick);
        // console.log('✅ Buildings button click handler attached');
        
        // Test button visibility
        // console.log('🔍 Button visible:', button.offsetParent !== null);
        // console.log('🔍 Button style display:', window.getComputedStyle(button).display);
    } else {
        console.warn('⚠️ Buildings button not found! Retrying...');
        // console.log('🔍 Available buttons:', 
        //     Array.from(document.querySelectorAll('button')).map(b => b.id).filter(id => id)
        // );
        
        // Try again after a short delay
        setTimeout(setupBuildingsButton, 1000);
    }
}
*/

// Separate click handler function
function handleBuildingButtonClick(e) {
    e.preventDefault();
    // console.log('🏢 Buildings button clicked!');
    // console.log('🔍 Supabase client available:', !!supabase);
    
    if (!supabase) {
        console.error('❌ Supabase client not initialized!');
        return;
    }
    
    loadBuildingsFromSupabase();
}

// Function to set up the remove button
/*
function setupRemoveButton() {
    // console.log('🔧 Setting up remove button...');
    
    const button = document.getElementById('fr-rem-buil-lyr');
    // console.log('🔍 Remove button found:', !!button);
    
    if (button) {
        button.removeEventListener('click', handleRemoveButtonClick);
        button.addEventListener('click', handleRemoveButtonClick);
        // console.log('✅ Remove button click handler attached');
    } else {
        console.warn('⚠️ Remove button not found! Retrying...');
        setTimeout(setupRemoveButton, 1000);
    }
}
*/

// Remove button click handler
function handleRemoveButtonClick(e) {
    e.preventDefault();
    // console.log('🗑️ Remove buildings button clicked!');
    removeBuildingsFromMap();
}

// Function to remove buildings from map
function removeBuildingsFromMap() {
    if (buildingsLayer && window.map) {
        window.map.removeLayer(buildingsLayer);
        buildingsLayer = null;
        window.buildingsLayer = null;
        // console.log('✅ Buildings layer removed from map');
        
        // Close attributes table if open
        closeAttributesTable();
    } else {
        console.warn('⚠️ No buildings layer to remove');
    }
}

// Function to set up the attributes button
/*
function setupAttributesButton() {
    // console.log('🔧 Setting up attributes button...');
    
    const button = document.getElementById('fr-att-table');
    // console.log('🔍 Attributes button found:', !!button);
    
    if (button) {
        button.removeEventListener('click', handleAttributesButtonClick);
        button.addEventListener('click', handleAttributesButtonClick);
        // console.log('✅ Attributes button click handler attached');
    } else {
        console.warn('⚠️ Attributes button not found! Retrying...');
        setTimeout(setupAttributesButton, 1000);
    }
}
*/
// Attributes button click handler
function handleAttributesButtonClick(e) {
    e.preventDefault();
    // console.log('📊 Attributes button clicked!');
    showAttributesTable();
}

// Global variable to store the buildings layer
let buildingsLayer = null;
let buildingsData = null; // Store the data for attributes table

// Efficient Swiss LV95 to WGS84 transformation (one-liner version)
function swissToWGS84(east, north) {
    const y = (east - 2600000) / 1000000;
    const x = (north - 1200000) / 1000000;
    const lng = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x * x - 0.0436 * y * y * y;
    const lat = 16.9023892 + 3.238272 * x - 0.270978 * y * y - 0.002528 * x * x - 0.0447 * y * y * x - 0.0140 * x * x * x;
    return { lat: lat * 100 / 36, lng: lng * 100 / 36 };
}

// Function to load buildings data from Supabase
async function loadBuildingsFromSupabase() {
    // console.log('🏢 Loading buildings from Supabase...');
    
    try {
        // First, let's see what columns are available by selecting everything from one record
        // console.log('🔍 Checking available columns...');
        const { data: sampleData, error: sampleError } = await supabase
            .from('ti_buildings')
            .select('*')
            .limit(1);
        
        if (sampleError) {
            console.error('❌ Sample query error:', sampleError);
            return;
        }
        
        if (sampleData && sampleData.length > 0) {
            // console.log('📋 Available columns:', Object.keys(sampleData[0]));
            // console.log('📄 Sample record:', sampleData[0]);
        }
        
        // Now try with corrected column names based on the hint
        // console.log('🏢 Loading buildings with corrected column names...');
        const { data, error } = await supabase
            .from('ti_buildings')
            .select('EGID, GGDENAME, GDEKT, GKAT, GKLAS, GBAUJ, GAREA, GVOL, GKODE, GKODN')
            .limit(400);
        
        if (error) {
            console.error('❌ Supabase error:', error);
            return;
        }
        
        if (data && data.length > 0) {
            // console.log('✅ Buildings loaded from Supabase:');
            // console.log('📊 Total records:', data.length);
            
            // Store data globally for attributes table
            buildingsData = data;
            
            // Add buildings to map
            // console.log('✅ Loaded', data.length, 'buildings from database');
            addBuildingsToMap(data);
        } else {
            console.warn('⚠️ No data returned - this might be a permissions/RLS issue');
            // console.log('💡 Check your Supabase Row Level Security policies');
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Error loading buildings:', error);
    }
}

// Function to add buildings to the map
function addBuildingsToMap(buildingsData) {
    // console.log('🗺️ Adding buildings to map...');
    
    // Check if map is available
    if (!window.map) {
        console.error('❌ Map not found! Make sure Leaflet map is initialized.');
        return;
    }
    
    // Remove existing buildings layer if it exists
    if (buildingsLayer) {
        window.map.removeLayer(buildingsLayer);
        // console.log('🗑️ Removed existing buildings layer');
    }
    
    // Create a new layer group for buildings
    buildingsLayer = L.layerGroup();
    
    let addedBuildings = 0;
    const coordinates = []; // Store coordinates for zoom extent
    
    // Process each building
    buildingsData.forEach((building, index) => {
        try {
            let lat, lng;
            
            // Check for Swiss coordinates and transform them
            // Updated to use GKODE (East) and GKODN (North) based on error hint
            if (building.GKODE && building.GKODN) {
                const wgs84 = swissToWGS84(building.GKODE, building.GKODN);
                lat = wgs84.lat;
                lng = wgs84.lng;
                // console.log(`🔄 Building ${building.EGID}: Swiss [${building.GKODE}, ${building.GKODN}] → WGS84 [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
            }
            
            // Create marker if we have valid WGS84 coordinates
            if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                const marker = L.circleMarker([lat, lng], {
                    radius: 8,
                    fillColor: '#e49321ff',
                    color: '#0b0b0bff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.7
                });
                
                // Create popup content with Swiss building data
                const popupContent = `
                    <div class="building-popup">
                        <h6><strong>Building ${building.EGID}</strong></h6>
                        <p><strong>Municipality:</strong> ${building.GGDENAME}</p>
                        <p><strong>Canton:</strong> ${building.GDEKT}</p>
                        <p><strong>Category:</strong> ${building.GKAT || 'Unknown'}</p>
                        <p><strong>Class:</strong> ${building.GKLAS || 'Unknown'}</p>
                        <p><strong>Construction Year:</strong> ${building.GBAUJ || 'Unknown'}</p>
                        <p><strong>Area:</strong> ${building.GAREA ? building.GAREA + ' m²' : 'Unknown'}</p>
                        <p><strong>Volume:</strong> ${building.GVOL ? building.GVOL + ' m³' : 'Unknown'}</p>
                        <p><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                buildingsLayer.addLayer(marker);
                coordinates.push([lat, lng]);
                addedBuildings++;
            }
            
        } catch (error) {
            console.warn(`⚠️ Error processing building ${building.EGID}:`, error);
        }
    });
    
    // Add the layer to the map
    if (addedBuildings > 0) {
        buildingsLayer.addTo(window.map);
        // console.log(`✅ Added ${addedBuildings} buildings to map`);
        
        // Zoom to extent of all buildings
        if (coordinates.length > 1) {
            const group = new L.featureGroup(buildingsLayer.getLayers());
            window.map.fitBounds(group.getBounds().pad(0.1));
            // console.log('🔍 Zoomed to buildings extent');
        } else if (coordinates.length === 1) {
            window.map.setView(coordinates[0], 15);
            // console.log('🔍 Centered on single building');
        }
        
        // Store reference for removal later
        window.buildingsLayer = buildingsLayer;
    } else {
        console.warn('⚠️ No buildings could be mapped. Check coordinate transformation.');
    }
}

// Make functions globally available
window.loadBuildingsFromSupabase = loadBuildingsFromSupabase;
window.removeBuildingsFromMap = removeBuildingsFromMap;
window.showAttributesTable = showAttributesTable;

// ==================== ATTRIBUTES TABLE FUNCTIONALITY ====================

// Function to show the attributes table
function showAttributesTable() {
    // console.log('📊 Showing attributes table...');
    
    if (!buildingsData || buildingsData.length === 0) {
        alert('⚠️ No buildings data available. Please load buildings first.');
        return;
    }
    
    // Remove existing table if it exists
    closeAttributesTable();
    
    // Create the table window
    createAttributesWindow();
}

// Function to close/remove the attributes table
function closeAttributesTable() {
    const existingWindow = document.getElementById('buildings-attributes-window');
    if (existingWindow) {
        existingWindow.remove();
        // console.log('🗑️ Attributes table closed');
    }
}

// Function to create the draggable attributes window
function createAttributesWindow() {
    // Create the main window container
    const windowDiv = document.createElement('div');
    windowDiv.id = 'buildings-attributes-window';
    windowDiv.className = 'attributes-window';
    
    // Window styles
    windowDiv.style.cssText = `
        position: fixed;
        top: 100px;
        left: 100px;
        width: 900px;
        height: 500px;
        background: linear-gradient(135deg, #97a1cdff 0%, #e5bb6dff 100%);
        border: 2px solid #4a90e2;
        border-radius: 15px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
        backdrop-filter: blur(10px);
        resize: both;
        min-width: 600px;
        min-height: 300px;
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
    title.textContent = `🏢 Buildings Attributes (${buildingsData.length} records)`;
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
    closeBtn.onclick = closeAttributesTable;
    
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
        background: linear-gradient(135deg, #4a90e2, #667eea);
        color: white;
    `;
    
    // Define columns to display
    const columns = [
        { key: 'EGID', label: 'Building ID' },
        { key: 'GGDENAME', label: 'Municipality' },
        { key: 'GDEKT', label: 'Canton' },
        { key: 'GKAT', label: 'Category' },
        { key: 'GKLAS', label: 'Class' },
        { key: 'GBAUJ', label: 'Year Built' },
        { key: 'GAREA', label: 'Area (m²)' },
        { key: 'GVOL', label: 'Volume (m³)' },
        { key: 'GKODE', label: 'East (LV95)' },
        { key: 'GKODN', label: 'North (LV95)' }
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
    
    buildingsData.forEach((building, index) => {
        const row = document.createElement('tr');
        row.style.cssText = `
            transition: all 0.3s ease;
            ${index % 2 === 0 ? 'background: rgba(0,0,0,0.02);' : 'background: white;'}
        `;
        row.onmouseover = () => row.style.background = 'rgba(74, 144, 226, 0.1)';
        row.onmouseout = () => row.style.background = index % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white';
        
        columns.forEach(col => {
            const td = document.createElement('td');
            const value = building[col.key];
            td.textContent = value || 'N/A';
            td.style.cssText = `
                padding: 10px 8px;
                border-right: 1px solid rgba(0,0,0,0.1);
                border-bottom: 1px solid rgba(0,0,0,0.05);
                font-size: 13px;
                color: #333;
            `;
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
    
    // Make it draggable
    makeDraggable(windowDiv, header);
    
    // console.log('✅ Attributes table created and displayed');
}

// Function to make the window draggable
function makeDraggable(element, handle) {
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

// console.log('📄 supabase-buildings.js fully loaded');
