/**
 * BUILDING MANAGEMENT MODULE
 * Handles building data loading, display, and manipulation functionality
 * Part of the modular refactoring of app.js
 * 
 * This module contains:
 * - Building data loading from multiple sources (Supabase, static data)
 * - Building layer creation and management
 * - Building popup content generation
 * - Building overlay controls
 * - Building button initialization
 */

(function() {
    'use strict';

    // ============================
    // BUILDING DATA LOADING
    // ============================

    /**
     * Main function to load buildings data (tries multiple sources)
     */
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

    /**
     * Function to load static buildings data from ti_buildings.js
     */
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

    /**
     * Function to remove buildings data
     */
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

    // ============================
    // BUILDING MAP DISPLAY
    // ============================

    /**
     * Single canonical function to add buildings to the map
     * Accepts either a GeoJSON FeatureCollection or an array of Supabase records
     */
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
                            const html = buildBuildingPopupContent(p, feature.geometry, window.latestExtractionResults?.buildingsAnalyzed);
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
                                const html = buildBuildingPopupContent(props, null, window.latestExtractionResults?.buildingsAnalyzed);
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

    // ============================
    // BUILDING UTILITIES
    // ============================

    /**
     * Helper: remove overlay(s) from layer control by display name
     */
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

    /**
     * Helper to build building popup HTML from properties and optional geometry
     */
    function buildBuildingPopupContent(props = {}, geometry = null, buildingAnalysisData = null) {
        try {
            const priority = ['EGID','GGDENAME','GDEKT','GKAT','GBAUJ','GAREA','GVOL','id','name','address','adresse','egid','gkd','gkode'];
            const used = new Set();
            let html = `<div class="building-popup"><h6><strong>🏢 Building</strong></h6>`;
            
            // Add hazard information section if analysis data is available
            if (buildingAnalysisData && Array.isArray(buildingAnalysisData)) {
                // Find all hazard exposures for this building using EGID
                const buildingEGID = props.EGID;
                const hazardExposures = buildingAnalysisData.filter(building => {
                    const buildingProps = building.buildingProperties || {};
                    return buildingProps.EGID === buildingEGID;
                });
                
                if (hazardExposures.length > 0) {
                    html += `<div style="background-color:#f0f8ff;padding:8px;margin:8px 0;border-radius:4px;border-left:4px solid #007bff;">`;
                    html += `<h6><strong>🚨 Hazard Information</strong></h6>`;
                    
                    if (hazardExposures.length === 1) {
                        const exposure = hazardExposures[0];
                        html += `<p><strong>Hazard Type:</strong> ${exposure.hazardType || window.selectedHazard || 'N/A'}</p>`;
                        html += `<p><strong>Intensity:</strong> ${exposure.intensity || 'N/A'}</p>`;
                        html += `<p><strong>Recurrence Period:</strong> ${exposure.recurrence || 'N/A'}</p>`;
                    } else {
                        html += `<p><strong>Multiple Hazard Exposures (${hazardExposures.length}):</strong></p>`;
                        hazardExposures.forEach((exposure, index) => {
                            html += `<div style="margin-left:10px;padding:4px 0;border-bottom:1px solid #ddd;">`;
                            html += `<strong>Exposure ${index + 1}:</strong><br>`;
                            html += `• Type: ${exposure.hazardType || window.selectedHazard || 'N/A'}<br>`;
                            html += `• Intensity: ${exposure.intensity || 'N/A'}<br>`;
                            html += `• Recurrence: ${exposure.recurrence || 'N/A'}`;
                            html += `</div>`;
                        });
                    }
                    html += `</div>`;
                } else {
                    html += `<div style="background-color:#fff3cd;padding:8px;margin:8px 0;border-radius:4px;border-left:4px solid #ffc107;">`;
                    html += `<p><strong>ℹ️ No Hazard Exposure</strong> - Building not analyzed or outside hazard zones</p>`;
                    html += `</div>`;
                }
            }

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

    // ============================
    // BUILDING BUTTON INITIALIZATION
    // ============================

    /**
     * Initialize building button functionality
     */
    function initializeBuildingButton() {
        const addBuildingsBtn = document.getElementById('add-buildings-btn');
        
        if (addBuildingsBtn) {
            addBuildingsBtn.addEventListener('click', function() {
                console.log('🏢 Add buildings to map clicked');
                
                // Only fetch buildings if zoom is sufficient and map is available
                if (!window.map || typeof window.map.getZoom !== 'function') {
                    alert('Map not ready');
                    return;
                }
                const z = window.map.getZoom();
                if (z < 15) {
                    alert('Zoom in to level 15 or more to load buildings.');
                    return;
                }

                // Remove existing buildings first
                removeBuildingsData();

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
                    console.log('� Set window.currentBBox (from map view) for Supabase:', window.currentBBox);
                } catch (err) {
                    console.warn('⚠️ Could not compute map bbox for Supabase query', err);
                }

                // Trigger the buildings load for the current bbox
                console.log('Adding buildings layer for current map view...');
                loadBuildingsData();
                
                // Check workflow progress if the function exists
                if (typeof window.checkWorkflowProgress === 'function') {
                    window.checkWorkflowProgress();
                }
            });
            console.log('✅ Building button initialized');
        } else {
            console.warn('⚠️ Building button not found');
        }
    }

    // ============================
    // MODULE EXPORTS
    // ============================

    // Export functions to global scope for use by other modules
    window.loadBuildingsData = loadBuildingsData;
    window.loadStaticBuildingsData = loadStaticBuildingsData;
    window.removeBuildingsData = removeBuildingsData;
    window.removeOverlayByName = removeOverlayByName;
    window.buildBuildingPopupContent = buildBuildingPopupContent;
    window.initializeBuildingButton = initializeBuildingButton;

    console.log('✅ Building Management module loaded');

})();