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

    // GeoAdmin API constants
    // Documentation: https://docs.geo.admin.ch/access-data/identify-features.html
    // API Limits: Maximum 200 features per request (default: 50)
    const GEOADMIN_API_BASE = 'https://api3.geo.admin.ch/rest/services/api/MapServer';
    const BUILDINGS_LAYER = 'ch.bfs.gebaeude_wohnungs_register';
    
    // Loading state management
    let isLoadingBuildings = false;

    /**
     * Main function to load buildings data (uses GeoAdmin API with Supabase fallback)
     */
    function loadBuildingsData() {
        console.log('🏢 Loading buildings data...');
        
        // Check if map is available and zoom level is appropriate (≥16)
        if (!window.map) {
            console.error('❌ Map not available');
            alert('Map not initialized. Please refresh the page.');
            return;
        }
        
        const currentZoom = window.map.getZoom();
        if (currentZoom < 15) {
            console.log('🔍 Zoom level too low for building data. Current:', currentZoom, 'Required: ≥ 15');
            alert('Please zoom in to level 15 or higher to load building data.');
            return;
        }
        
        // Use GeoAdmin API for buildings (NEW PRIMARY METHOD)
        console.log('📡 Loading buildings from GeoAdmin API...');
        fetchBuildingsFromGeoAdmin();
        
        // COMMENTED OUT: Supabase fallback (preserve for future use)
        // if (typeof window.loadBuildingsFromSupabase === 'function') {
        //     console.log('📡 Attempting to load buildings from Supabase...');
        //     window.loadBuildingsFromSupabase();
        // }
        // // Fallback to static ti_buildings data
        // else if (typeof ti_buildings !== 'undefined') {
        //     console.log('📄 Loading buildings from static ti_buildings data...');
        //     loadStaticBuildingsData();
        // }
        // // Final fallback
        // else {
        //     console.warn('⚠️ No buildings data source available');
        //     alert('No buildings data available. Please check data sources.');
        // }
    }
    
    /**
     * Fetch buildings from GeoAdmin API using identify endpoint
     * Documentation: https://docs.geo.admin.ch/access-data/identify-features.html
     * 
     * IMPORTANT API LIMITS:
     * - Default limit: 50 features per request
     * - Maximum limit: 200 features per request (cannot be exceeded)
     * - Server-side limitation that cannot be overridden by client parameters
     * 
     * If no results or API fails, it falls back to WMS GetFeatureInfo method.
     */
    async function fetchBuildingsFromGeoAdmin() {
        if (isLoadingBuildings) {
            console.log('🔄 Buildings already loading...');
            return;
        }
        
        isLoadingBuildings = true;
        console.log('🔄 Loading buildings from GeoAdmin API...');
        
        // Ensure building class definitions are loaded for method 3 calculations
        if (typeof window.buildings === 'undefined' || !window.buildings || window.buildings.length === 0) {
            console.warn('⚠️ Building class definitions (window.buildings) not loaded. Method 3 calculations may fail.');
            console.log('💡 Ensure buildings_info.js is loaded before using spatial analysis.');
        } else {
            console.log(`✅ Building class definitions loaded: ${window.buildings.length} building types available`);
        }
        
        try {
            // Get current map bounds
            const bounds = window.map.getBounds();
            
            // Use identify endpoint which works better for spatial queries
            const url = `${GEOADMIN_API_BASE}/identify?` + new URLSearchParams({
                geometryType: 'esriGeometryEnvelope',
                geometry: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
                mapExtent: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
                imageDisplay: '1000,1000,96',
                tolerance: 0,
                layers: `all:${BUILDINGS_LAYER}`,
                returnGeometry: true,
                geometryFormat: 'geojson',
                sr: '4326' // Use WGS84 for better compatibility
            });
            
            console.log('🔍 Fetching buildings from:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            console.log('📦 Buildings API Response:', data);
            console.log('🔍 API Response structure:', {
                resultsCount: data.results?.length || 0,
                hasMoreResults: data.hasMoreResults,
                totalResults: data.totalResults,
                responseKeys: Object.keys(data)
            });
            
            if (data.results && data.results.length > 0) {
                addGeoAdminBuildingsToMap(data.results);
                console.log(`✅ Loaded ${data.results.length} buildings from GeoAdmin API`);
                
                // Check if there are more results available (API service limit reached)
                if (data.hasMoreResults || (data.totalResults && data.totalResults > data.results.length)) {
                    console.warn(`⚠️ API Service Limit: Only ${data.results.length} of ${data.totalResults || 'unknown'} buildings loaded`);
                    console.log('💡 GeoAdmin API has internal service limits that cannot be overridden');
                }
            } else {
                // Try alternative approach with WMS GetFeatureInfo
                console.log('🔄 No results from identify endpoint, trying WMS approach...');
                await fetchBuildingsFromGeoAdminWMS(bounds);
            }
            
        } catch (error) {
            console.error('❌ Error fetching buildings from GeoAdmin:', error);
            
            // Fallback to WMS approach
            try {
                console.log('🔄 Trying WMS fallback approach...');
                const bounds = window.map.getBounds();
                await fetchBuildingsFromGeoAdminWMS(bounds);
            } catch (fallbackError) {
                console.error('❌ WMS fallback also failed:', fallbackError);
                alert('Unable to load buildings data. Please try zooming to a different area or refreshing the page.');
            }
        } finally {
            isLoadingBuildings = false;
        }
    }
    
    /**
     * Alternative: Fetch buildings using WMS GetFeatureInfo (Fallback Method)
     * This method is used when the primary identify endpoint fails or returns no results.
     * WMS GetFeatureInfo also has service limits but may work in different scenarios.
     */
    async function fetchBuildingsFromGeoAdminWMS(bounds) {
        console.log('🔄 Trying WMS GetFeatureInfo approach...');
        
        try {
            const center = bounds.getCenter();
            const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
            
            const url = `https://wms.geo.admin.ch/?` + new URLSearchParams({
                SERVICE: 'WMS',
                VERSION: '1.3.0',
                REQUEST: 'GetFeatureInfo',
                LAYERS: BUILDINGS_LAYER,
                QUERY_LAYERS: BUILDINGS_LAYER,
                INFO_FORMAT: 'application/json',
                CRS: 'EPSG:4326',
                BBOX: bbox,
                WIDTH: '1000',
                HEIGHT: '1000',
                I: '500', // Center point x
                J: '500'  // Center point y
            });
            
            console.log('🔍 Trying WMS GetFeatureInfo:', url);
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('📦 WMS Response:', data);
            
            if (data.features && data.features.length > 0) {
                addGeoAdminBuildingsToMapWMS(data.features);
                console.log(`✅ Loaded ${data.features.length} buildings via WMS`);
                console.log('🔍 WMS Response info:', {
                    featuresCount: data.features.length,
                    responseKeys: Object.keys(data)
                });
            } else {
                console.log('ℹ️ No buildings found in this area');
                alert('No buildings found in the current view area. Try zooming to a different location.');
            }
            
        } catch (error) {
            console.error('❌ WMS fetch failed:', error);
            console.log('ℹ️ No buildings available for this area');
            alert('No buildings data available for this area.');
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
     * Add buildings to map from GeoAdmin API identify endpoint
     */
    function addGeoAdminBuildingsToMap(buildings) {
        // Remove existing buildings layer if present
        if (window.buildingsLayer) {
            try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
            window.buildingsLayer = null;
            window.buildingsData = null;
        }

        const buildingMarkers = [];
        let addedCount = 0;

        buildings.forEach(building => {
            try {
                let geometry = null;
                let properties = building.attributes || building.properties || {};
                
                // Handle geometry from identify API response
                if (building.geometry) {
                    if (building.geometry.type === 'Point' && building.geometry.coordinates) {
                        // Point geometry - coordinates are already in WGS84 from identify endpoint
                        geometry = L.circleMarker([building.geometry.coordinates[1], building.geometry.coordinates[0]], {
                            radius: 8,
                            fillColor: '#40e238ff',
                            color: '#40e238ff',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.7,
                            interactive: true
                        });
                    } else if (building.geometry.type === 'Polygon' && building.geometry.coordinates) {
                        // Polygon geometry - coordinates are already in WGS84
                        const coords = building.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                        geometry = L.polygon(coords, {
                            fillColor: '#3498db',
                            color: '#2980b9',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.6,
                            interactive: true
                        });
                    }
                } else if (building.bbox) {
                    // Create rectangle from bbox
                    const sw = [building.bbox[1], building.bbox[0]]; // lat, lng
                    const ne = [building.bbox[3], building.bbox[2]]; // lat, lng
                    geometry = L.rectangle([sw, ne], {
                        fillColor: '#f39c12',
                        color: '#e67e22',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.6,
                        interactive: true
                    });
                }
                
                if (geometry) {
                    // IMPORTANT: Attach building properties as feature for spatial analysis
                    geometry.feature = {
                        type: 'Feature',
                        geometry: building.geometry || {
                            type: 'Point',
                            coordinates: building.bbox ? [(building.bbox[0] + building.bbox[2])/2, (building.bbox[1] + building.bbox[3])/2] : [0, 0]
                        },
                        properties: properties
                    };
                    
                    // Create popup content
                    const popupContent = createGeoAdminBuildingPopup(properties);
                    geometry.bindPopup(popupContent, {
                        maxWidth: 450,
                        maxHeight: 400,
                        className: 'geoadmin-building-popup',
                        closeButton: true,
                        autoClose: false,
                        keepInView: true
                    });
                    geometry.on('click', function() { this.openPopup(); });
                    
                    buildingMarkers.push(geometry);
                    addedCount++;
                }
                
            } catch (error) {
                console.warn('⚠️ Error processing GeoAdmin building:', error, building);
            }
        });

        // Create layer group and add to map
        if (buildingMarkers.length > 0) {
            window.buildingsLayer = L.layerGroup(buildingMarkers);
            window.buildingsLayer.addTo(window.map);
            
            // IMPORTANT: Store buildings data for spatial analysis compatibility
            // Convert GeoAdmin buildings to Supabase-like format for analysis
            const buildingsData = buildings.map((building, index) => {
                const props = building.attributes || building.properties || {};
                
                // Enhanced GKLAS mapping - try multiple field variations
                let gklas = props.klasse || props.GKLAS || props.gklas || props.classe || 
                           props.building_class || props.buildingClass || props.category_code || 
                           props.gkat || props.GKAT || null;
                
                // If GKLAS is still null, try to infer from building type or category
                if (!gklas && (props.kategorie || props.category)) {
                    const category = (props.kategorie || props.category || '').toLowerCase();
                    if (category.includes('wohn') || category.includes('residential')) {
                        gklas = '1110'; // Residential
                    } else if (category.includes('industrie') || category.includes('industrial')) {
                        gklas = '1251'; // Industrial
                    } else if (category.includes('handel') || category.includes('commercial')) {
                        gklas = '1230'; // Commercial
                    } else {
                        gklas = '1110'; // Default to residential
                    }
                }
                
                // Ensure GKLAS is a number if it's a valid numeric string
                if (gklas && typeof gklas === 'string' && !isNaN(gklas)) {
                    gklas = parseInt(gklas);
                }
                
                // Enhanced field mapping with more variations and defaults
                // Debug: Log building properties to see what's available
                if (index < 3) {
                    console.log(`🔍 Building ${index + 1} props keys:`, Object.keys(props));
                    console.log(`🔍 Building ${index + 1} props values:`, props);
                }
                
                const egid = props.egid || props.EGID || props.id || `geoadmin_${index}`;
                const area = props.gebaeudeflaeche || props.GAREA || props.area || props.flaeche || 100;
                const volume = props.volumen || props.GVOL || props.volume || 0;
                const apartments = props.wohnungen || props.GANZWHG || props.anzahl_wohnungen || 1;
                const floors = props.stockwerke || props.GASTW || props.anzahl_stockwerke || 2;
                const year = props.baujahr || props.GBAUJ || props.construction_year || 1970;
                const period = props.bauperiode || props.GBAUP || props.construction_period || null;
                const commune = props.gemeindename || props.GGDENAME || props.municipality || 'Unknown';
                const canton = props.kantonsname || props.GDEKT || props.canton || 'Unknown';
                const category = props.kategorie || props.GKAT || props.category || 'Unknown';
                const status = props.gstat || props.GSTAT || props.status || 'Unknown';
                const coordE = props.gkode || props.GKODE || building.geometry?.coordinates?.[0] || 0;
                const coordN = props.gkodn || props.GKODN || building.geometry?.coordinates?.[1] || 0;
                const volSce = props.gvolsce || props.GVOLSCE || props.volume_sce || 0;
                
                return {
                    // GeoAdmin properties mapped to expected Supabase format
                    EGID: egid,
                    GGDENAME: commune,
                    GDEKT: canton,
                    GKAT: category,
                    GKLAS: gklas || 1110, // Default to residential if no class found
                    GBAUJ: year, // Construction year
                    GBAUP: period, // Construction period code
                    GAREA: area, // Building area in m²
                    GVOL: volume, // Building volume in m³
                    GVOLSCE: volSce, // Volume SCE
                    GANZWHG: apartments, // Number of apartments
                    GASTW: floors, // Number of floors
                    GSTAT: status, // Building status
                    // Coordinates
                    GKODE: coordE,
                    GKODN: coordN,
                    // Store original GeoAdmin data for debugging
                    _geoadmin_original: building
                };
            });
            window.buildingsData = buildingsData;
            
            // Debug: Log GKLAS mapping results
            const gklasStats = {};
            buildingsData.forEach(b => {
                const gklas = b.GKLAS;
                gklasStats[gklas] = (gklasStats[gklas] || 0) + 1;
            });
            console.log('📊 GeoAdmin GKLAS mapping results:', gklasStats);
            
            // Add to layer control for visibility toggle
            try {
                if (window.ctlLayers) {
                    removeOverlayByName('🏢 Buildings');
                    window.ctlLayers.addOverlay(window.buildingsLayer, '🏢 Buildings');
                }
            } catch (e) { console.warn('⚠️ Could not add buildings layer to layer control', e); }
            
            console.log(`✅ Added ${addedCount} GeoAdmin buildings to map`);
            console.log(`💾 Stored ${buildingsData.length} buildings data for spatial analysis`);
        } else {
            console.warn('⚠️ No valid GeoAdmin building markers created');
        }
    }

    /**
     * Add buildings to map from GeoAdmin WMS GetFeatureInfo
     */
    function addGeoAdminBuildingsToMapWMS(features) {
        // Remove existing buildings layer if present
        if (window.buildingsLayer) {
            try { window.map.removeLayer(window.buildingsLayer); } catch (e) {}
            window.buildingsLayer = null;
            window.buildingsData = null;
        }

        const buildingMarkers = [];
        let addedCount = 0;

        features.forEach(feature => {
            try {
                let geometry = null;
                let properties = feature.properties || {};
                
                // Handle GeoJSON geometry from WMS
                if (feature.geometry) {
                    if (feature.geometry.type === 'Point') {
                        geometry = L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                            radius: 8,
                            fillColor: '#27ae60',
                            color: '#229954',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.7,
                            interactive: true
                        });
                    } else if (feature.geometry.type === 'Polygon') {
                        const coords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                        geometry = L.polygon(coords, {
                            fillColor: '#8e44ad',
                            color: '#732d91',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.6,
                            interactive: true
                        });
                    }
                }
                
                if (geometry) {
                    // IMPORTANT: Attach building properties as feature for spatial analysis
                    geometry.feature = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: properties
                    };
                    
                    // Create popup content
                    const popupContent = createGeoAdminBuildingPopup(properties);
                    geometry.bindPopup(popupContent, {
                        maxWidth: 450,
                        maxHeight: 400,
                        className: 'geoadmin-building-popup',
                        closeButton: true,
                        autoClose: false,
                        keepInView: true
                    });
                    
                    // Improved event handling to prevent disappearing
                    geometry.on('click', function(e) {
                        // Prevent event propagation that might interfere with layer visibility
                        L.DomEvent.stopPropagation(e);
                        this.openPopup();
                    });
                    
                    // Add mouseover/mouseout for better UX
                    geometry.on('mouseover', function(e) {
                        if (this.setStyle) {
                            this.setStyle({ weight: 3, opacity: 1.0 });
                        }
                    });
                    
                    geometry.on('mouseout', function(e) {
                        if (this.setStyle) {
                            this.setStyle({ weight: 2, opacity: 1.0 });
                        }
                    });
                    
                    buildingMarkers.push(geometry);
                    addedCount++;
                }
                
            } catch (error) {
                console.warn('⚠️ Error processing WMS building feature:', error, feature);
            }
        });

        // Create layer group and add to map
        if (buildingMarkers.length > 0) {
            window.buildingsLayer = L.layerGroup(buildingMarkers);
            window.buildingsLayer.addTo(window.map);
            
            // IMPORTANT: Store buildings data for spatial analysis compatibility
            // Convert GeoAdmin WMS buildings to Supabase-like format for analysis
            const buildingsData = features.map((feature, index) => {
                const props = feature.properties || {};
                
                // Enhanced GKLAS mapping - try multiple field variations
                let gklas = props.klasse || props.GKLAS || props.gklas || props.classe || 
                           props.building_class || props.buildingClass || props.category_code || 
                           props.gkat || props.GKAT || null;
                
                // If GKLAS is still null, try to infer from building type or category
                if (!gklas && (props.kategorie || props.category)) {
                    const category = (props.kategorie || props.category || '').toLowerCase();
                    if (category.includes('wohn') || category.includes('residential')) {
                        gklas = '1110'; // Residential
                    } else if (category.includes('industrie') || category.includes('industrial')) {
                        gklas = '1251'; // Industrial
                    } else if (category.includes('handel') || category.includes('commercial')) {
                        gklas = '1230'; // Commercial
                    } else {
                        gklas = '1110'; // Default to residential
                    }
                }
                
                // Ensure GKLAS is a number if it's a valid numeric string
                if (gklas && typeof gklas === 'string' && !isNaN(gklas)) {
                    gklas = parseInt(gklas);
                }
                
                // Enhanced field mapping with more variations and defaults
                // Debug: Log WMS building properties to see what's available
                if (index < 3) {
                    console.log(`🔍 WMS Building ${index + 1} props keys:`, Object.keys(props));
                    console.log(`🔍 WMS Building ${index + 1} props values:`, props);
                }
                
                const egid = props.egid || props.EGID || props.id || `geoadmin_wms_${index}`;
                const area = props.gebaeudeflaeche || props.GAREA || props.area || props.flaeche || 100;
                const volume = props.volumen || props.GVOL || props.volume || 0;
                const apartments = props.wohnungen || props.GANZWHG || props.anzahl_wohnungen || 1;
                const floors = props.stockwerke || props.GASTW || props.anzahl_stockwerke || 2;
                const year = props.baujahr || props.GBAUJ || props.construction_year || 1970;
                const period = props.bauperiode || props.GBAUP || props.construction_period || null;
                const commune = props.gemeindename || props.GGDENAME || props.municipality || 'Unknown';
                const canton = props.kantonsname || props.GDEKT || props.canton || 'Unknown';
                const category = props.kategorie || props.GKAT || props.category || 'Unknown';
                const status = props.gstat || props.GSTAT || props.status || 'Unknown';
                const coordE = props.gkode || props.GKODE || feature.geometry?.coordinates?.[0] || 0;
                const coordN = props.gkodn || props.GKODN || feature.geometry?.coordinates?.[1] || 0;
                const volSce = props.gvolsce || props.GVOLSCE || props.volume_sce || 0;
                
                return {
                    // GeoAdmin properties mapped to expected Supabase format
                    EGID: egid,
                    GGDENAME: commune,
                    GDEKT: canton,
                    GKAT: category,
                    GKLAS: gklas || 1110, // Default to residential if no class found
                    GBAUJ: year, // Construction year
                    GBAUP: period, // Construction period code
                    GAREA: area, // Building area in m²
                    GVOL: volume, // Building volume in m³
                    GVOLSCE: volSce, // Volume SCE
                    GANZWHG: apartments, // Number of apartments
                    GASTW: floors, // Number of floors
                    GSTAT: status, // Building status
                    // Coordinates
                    GKODE: coordE,
                    GKODN: coordN,
                    // Store original GeoAdmin data for debugging
                    _geoadmin_original: feature
                };
            });
            window.buildingsData = buildingsData;
            
            // Debug: Log GKLAS mapping results
            const gklasStats = {};
            buildingsData.forEach(b => {
                const gklas = b.GKLAS;
                gklasStats[gklas] = (gklasStats[gklas] || 0) + 1;
            });
            console.log('📊 GeoAdmin WMS GKLAS mapping results:', gklasStats);
            
            // Add to layer control for visibility toggle
            try {
                if (window.ctlLayers) {
                    removeOverlayByName('🏢 Buildings');
                    window.ctlLayers.addOverlay(window.buildingsLayer, '🏢 Buildings');
                }
            } catch (e) { console.warn('⚠️ Could not add buildings layer to layer control', e); }
            
            console.log(`✅ Added ${addedCount} WMS buildings to map`);
            console.log(`💾 Stored ${buildingsData.length} WMS buildings data for spatial analysis`);
        } else {
            console.warn('⚠️ No valid WMS building markers created');
        }
    }

    /**
     * Create popup content for GeoAdmin buildings - expanded with all requested fields
     */
    function createGeoAdminBuildingPopup(properties) {
        // Debug: Log all available properties to see what GeoAdmin actually returns
        console.log('🔍 GeoAdmin building properties available:', Object.keys(properties));
        console.log('🔍 GeoAdmin building properties values:', properties);
        
        // All requested fields with proper labels and multiple field name variations
        const requestedFields = {
            'egid': 'EGID',
            'gbaup': 'Construction Period (GBAUP)',
            'gastw': 'Number of Floors (GASTW)', 
            'ggdename': 'Commune (GGDENAME)',
            'gemeindename': 'Commune (GGDENAME)', // Alternative field name
            'gkode': 'Coordinate E (GKODE)',
            'gkodn': 'Coordinate N (GKODN)', 
            'gkat': 'Category (GKAT)',
            'kategorie': 'Category (GKAT)', // Alternative field name
            'gvolsce': 'Volume SCE (GVOLSCE)',
            'gbauj': 'Construction Year (GBAUJ)',
            'baujahr': 'Construction Year (GBAUJ)', // Alternative field name
            'gklas': 'Building Class (GKLAS)',
            'klasse': 'Building Class (GKLAS)', // Alternative field name
            'garea': 'Building Area (GAREA)',
            'gebaeudeflaeche': 'Building Area (GAREA)', // Alternative field name
            'gstat': 'Status (GSTAT)'
        };
        
        let html = `<div class="building-popup-expanded">
            <div class="popup-header">🏢 Building Details</div>
            <div class="popup-content">`;
        
        // Add requested fields
        const processedFields = new Set();
        Object.entries(requestedFields).forEach(([key, displayName]) => {
            // Skip if we already processed this display name (for alternative field names)
            if (processedFields.has(displayName)) return;
            
            const value = properties[key] || properties[key.toUpperCase()] || properties[key.toLowerCase()];
            if (value !== undefined && value !== null && value !== '') {
                const displayValue = value === 'N/A' ? 'N/A' : value;
                html += `<div class="popup-row"><span class="label">${displayName}:</span> <span class="value">${displayValue}</span></div>`;
                processedFields.add(displayName);
            } else {
                // Only show N/A if no alternative field names have values
                const alternativeKeys = Object.keys(requestedFields).filter(k => requestedFields[k] === displayName);
                const hasAlternativeValue = alternativeKeys.some(altKey => {
                    const altValue = properties[altKey] || properties[altKey.toUpperCase()] || properties[altKey.toLowerCase()];
                    return altValue !== undefined && altValue !== null && altValue !== '';
                });
                
                if (!hasAlternativeValue) {
                    html += `<div class="popup-row"><span class="label">${displayName}:</span> <span class="value missing">N/A</span></div>`;
                    processedFields.add(displayName);
                }
            }
        });
        
        html += `</div>
            <div class="popup-footer">📍 geo.admin.ch</div>
        </div>`;
        
        return html;
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