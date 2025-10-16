// ==================== SIMPLE SUPABASE BUILDINGS ACCESS ====================

// console.log('📄 supabase-buildings.js loaded');
// console.log('🔍 Current document state:', document.readyState);
// console.log('🔍 window.supabase available immediately:', typeof window.supabase);

// Supabase configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
const SUPABASE_CONFIG = {
    url: 'https://gmnvtulnusespebjqjrp.supabase.co',   // Supabase project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbnZ0dWxudXNlc3BlYmpxanJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTA2NTEsImV4cCI6MjA3MzA2NjY1MX0.1MEhdh0Qe8EIfXK2mdc_dznFQ7btPIHfCM_2faGb1GM' // Replace with your Supabase anon key
};

// Initialize Supabase client
// ------------------ Global variables (initialized at file top) ------------------
// Keep globals together for easier discovery and to avoid accidental overwrites
// globals (this module)
// window.buildingsLayer   - L.layerGroup for buildings added to map
// window.buildingsData    - Array of building records retrieved from Supabase
// window.supabaseClient   - optional client reference
//
// exported functions (quick reference)
// loadBuildingsFromSupabase(), removeBuildingsFromMap(), showAttributesTable()

if (typeof window.supabaseClient === 'undefined') window.supabaseClient = null; // alternate name if used elsewhere
let supabase; // local reference to client
// Supabase fetch configuration
// PostgREST (Supabase REST) defaults to 1000 rows when no explicit range/limit is provided.
// To avoid silently returning only 1000 rows when a bbox covers a large area, request an
// explicit range here. Beware: requesting very large numbers may harm browser performance.
const SUPABASE_MAX_RESULTS = 5000; // adjust as needed (default 5000)
// ---------------------------------------------------------------------------------

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
    if (window.buildingsLayer && window.map) {
        try { window.map.removeLayer(window.buildingsLayer); } catch (e) { /* ignore */ }
        // Also remove from layer control overlays if present
        try {
            if (window.ctlLayers) {
                try { window.ctlLayers.removeLayer(window.buildingsLayer); } catch (e) { /* ignore */ }
            }
        } catch(e) { /* ignore */ }
        window.buildingsLayer = null;
        window.buildingsData = null;
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

// Use single window-level variables so all flows manipulate the same state
if (typeof window.buildingsLayer === 'undefined') window.buildingsLayer = null;
if (typeof window.buildingsData === 'undefined') window.buildingsData = null; // optional raw data for attributes

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
    console.log('🏢 loadBuildingsFromSupabase called');
    // Check network status
    if (!navigator.onLine) {
        console.error('❌ Browser is offline. Cannot query Supabase.');
        alert('You are offline. Buildings data cannot be loaded.');
        return;
    }
    // Check Supabase client
    if (!supabase) {
        console.error('❌ Supabase client not initialized!');
        alert('Supabase client not initialized.');
        return;
    }
    // Check map object
    if (!window.map) {
        console.error('❌ Map object not found!');
        alert('Map object not found!');
        return;
    } else {
        console.log('🗺️ Map object found:', window.map);
    }
    // Check bbox cames from initializeDrawFunctionality function
    if (window.currentBBox && window.currentBBox.length === 4) {
        const [minEast, minNorth, maxEast, maxNorth] = window.currentBBox;
        console.log('🔍 Using bbox for Supabase query:', window.currentBBox);
        console.log(`🔢 Query GKODE >= ${minEast}, GKODE <= ${maxEast}, GKODN >= ${minNorth}, GKODN <= ${maxNorth}`);
        // Perform paged requests because some Supabase/PostgREST setups impose a per-request cap
        // (commonly 1000 rows). We'll request in PAGE_SIZE chunks and concatenate results until
        // there are no more rows or we've reached SUPABASE_MAX_RESULTS.
        const PAGE_SIZE = Math.min(1000, SUPABASE_MAX_RESULTS); // per-request page size
        let allData = [];
        let offset = 0;
        let shouldContinue = true;
        while (shouldContinue && allData.length < SUPABASE_MAX_RESULTS) {
            let dataPage, errorPage;
            try {
                const start = offset;
                const end = offset + PAGE_SIZE - 1;
                ({ data: dataPage, error: errorPage } = await supabase
                    .from('ti_buildings')
                    .select(`
                        EGID,
                        GDEKT,
                        GGDENR,
                        GGDENAME,
                        EGRID,
                        GEBNR,
                        GBEZ,
                        GKODE,
                        GKODN,
                        GKAT,
                        GKLAS,
                        GBAUJ,
                        GBAUM,
                        GBAUP,
                        GAREA,
                        GVOL,
                        GASTW,
                        GANZWHG,
                        GEXPDAT
                    `)
                    .gte('GKODE', minEast)
                    .lte('GKODE', maxEast)
                    .gte('GKODN', minNorth)
                    .lte('GKODN', maxNorth)
                    .range(start, end));
            } catch (err) {
                console.error('❌ Supabase paged query threw error:', err);
                alert('Supabase query failed: ' + err);
                return;
            }
            if (errorPage) {
                console.error('❌ Supabase error (paged):', errorPage);
                alert('Supabase error: ' + errorPage.message);
                return;
            }
            if (dataPage && dataPage.length > 0) {
                allData = allData.concat(dataPage);
                // If we received less than a full page, we've reached the end.
                if (dataPage.length < PAGE_SIZE) {
                    shouldContinue = false;
                } else {
                    offset += PAGE_SIZE; // fetch next page
                }
            } else {
                // No more rows
                shouldContinue = false;
            }
        }

        if (allData && allData.length > 0) {
            console.log(`✅ ${allData.length} buildings loaded from bbox (paged).`);
            if (allData.length >= SUPABASE_MAX_RESULTS) {
                console.warn('⚠️ Returned buildings count equals or exceeds SUPABASE_MAX_RESULTS — results may be truncated. Consider using a smaller bbox or server-side paging.');
            }
            window.buildingsData = allData;
            if (typeof window.addBuildingsToMap === 'function') window.addBuildingsToMap(allData);
        } else {
            console.warn('⚠️ No buildings found in bbox. Data:', allData);
            alert('No buildings found in selected area.');
        }
    return allData;
    } else {
        console.log('🔍 No bbox set, loading all buildings (limit 400)');
        let data, error;
        try {
            // Request an explicit range for the no-bbox case as well (safer than relying on .limit)
            ({ data, error } = await supabase
                .from('ti_buildings')
                .select('EGID, GGDENAME, GDEKT, GBEZ, GKODE, GKODN, GSTAT, GKAT, GKLAS, GBAUJ, GBAUP, GAREA, GVOLNORM, GVOL, GVOLSCE, GASTW, GANZWHG, GEBF')
                .range(0, Math.min(SUPABASE_MAX_RESULTS, 400) - 1));
        } catch (err) {
            console.error('❌ Supabase query threw error:', err);
            alert('Supabase query failed: ' + err);
            return;
        }
        if (error) {
            console.error('❌ Supabase error:', error);
            alert('Supabase error: ' + error.message);
            return;
        }
        if (data && data.length > 0) {
            console.log(`✅ ${data.length} buildings loaded (no bbox).`);
            window.buildingsData = data;
            if (typeof window.addBuildingsToMap === 'function') window.addBuildingsToMap(data);
        } else {
            console.warn('⚠️ No data returned - this might be a permissions/RLS issue. Data:', data);
            alert('No buildings data returned. Check Supabase permissions.');
        }
        return data;
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
    
    var bdata = window.buildingsData || null;
    if (!bdata || bdata.length === 0) {
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
    const recordCount = (window.buildingsData && window.buildingsData.length) ? window.buildingsData.length : 0;
    title.textContent = `🏢 Buildings Attributes (${recordCount} records)`;
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
    
    const rows = window.buildingsData || [];
    rows.forEach((building, index) => {
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
