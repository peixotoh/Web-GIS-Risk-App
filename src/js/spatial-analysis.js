// ==================== SPATIAL ANALYSIS MODULE ====================

/**
 * Simple Spatial Analysis Module using Turf.js
 * Step-by-step implementation for polygon-based analysis
 */

console.log('📊 Loading spatial analysis module with Turf.js...');

// ==================== STEP 1: EXTRACT DATA INSIDE POLYGON ====================

/**
 * Step 1: Extract buildings and hazards inside the drawn polygon using Turf.js
 * @param {L.Polygon} polygon - The drawn polygon for analysis
 * @param {L.Layer} buildingsLayer - Leaflet buildings layer
 * @param {L.Layer} hazardLayer - Leaflet hazard layer
 * @returns {Object} Object containing buildings and hazards inside polygon
 */
async function extractDataInsidePolygon(polygon, buildingsLayer, hazardLayer) {
    console.log('🎯 Step 1: Extracting data inside polygon using Turf.js...');
    
    if (!polygon) {
        throw new Error('No polygon provided');
    }
    
    if (!buildingsLayer) {
        throw new Error('No buildings layer provided');
    }
    
    if (!hazardLayer) {
        throw new Error('No hazard layer provided');
    }

    // Check if Turf.js is available
    if (typeof turf === 'undefined') {
        throw new Error('Turf.js library not available. Please ensure it is loaded.');
    }

    try {
        // Convert Leaflet polygon to GeoJSON for Turf.js
        const polygonGeoJSON = leafletPolygonToGeoJSON(polygon);
        console.log('📐 Polygon converted to GeoJSON for Turf.js analysis');

        // Extract buildings inside polygon
        const buildingsInside = extractBuildingsInsidePolygon(polygonGeoJSON, buildingsLayer, hazardLayer);
        console.log(`🏢 Found ${buildingsInside.length} buildings inside polygon`);

        // Extract hazards inside polygon
        const hazardsInside = extractHazardsInsidePolygon(polygonGeoJSON, hazardLayer);
        console.log(`🌋 Found ${hazardsInside.length} hazard features inside polygon`);

        // Create analysis layers for Leaflet control
        const analysisLayers = createAnalysisLayers(polygonGeoJSON, buildingsInside);
        
        // Add layers to map and layer control
        addAnalysisLayersToMap(analysisLayers);

        // Show alert with results
        alert(`📊 Analysis Results:\n\n` +
              `🏢 Buildings inside polygon: ${buildingsInside.length}\n` +
              `🏢 Buildings analyzed (with hazards): ${analysisLayers.buildingsAnalyzed.length}\n` +
              `🌋 Hazard features inside polygon: ${hazardsInside.length}\n\n` +
              `Check console for detailed results and map layers.`);

        // Console table with results
        console.log('📊 Extraction Results:');
        console.table([{
            'Buildings Inside': buildingsInside.length,
            'Hazards Inside': hazardsInside.length,
            'Polygon Area (approx)': `${(turf.area(polygonGeoJSON) / 1000000).toFixed(2)} km²`
        }]);

        // Console table with building-hazard details
        if (analysisLayers.buildingsAnalyzed.length > 0) {
            console.log('🏢 Buildings Analyzed (with hazard intersections):');
            const analyzedTable = analysisLayers.buildingsAnalyzed.map((building, index) => ({
                Index: index + 1,
                'EGID': building.buildingProperties?.EGID || 'N/A',
                'Building Name': building.buildingProperties?.GGDENAME || 'N/A',
                'Canton': building.buildingProperties?.GDEKT || 'N/A',
                'Class': building.buildingProperties?.GKLAS || 'N/A',
                'Category': building.buildingProperties?.GKAT || 'N/A',
                'Construction Year': building.buildingProperties?.GBAUJ || 'N/A',
                'Area (m²)': building.buildingProperties?.GAREA || 'N/A',
                'Volume (m³)': building.buildingProperties?.GVOL || 'N/A',
                'Apartments': building.buildingProperties?.GANZWHG || 'N/A',
                'Hazard Type': building.hazardType || 'N/A',
                'Hazard Recurrence': building.recurrence || 'None',
                'Hazard Intensity': building.intensity || 'None',
                'Original Building ID': building.originalBuildingId || 'N/A'
            }));
            console.table(analyzedTable);
        }

        if (buildingsInside.length > 0) {
            console.log('🏢 All Buildings Inside Polygon:');
            const buildingTable = buildingsInside.map((building, index) => ({
                Index: index + 1,
                'EGID': building.properties?.EGID || 'N/A',
                'Building Name': building.properties?.GGDENAME || 'N/A',
                'Canton': building.properties?.GDEKT || 'N/A',
                'Class': building.properties?.GKLAS || 'N/A',
                'Category': building.properties?.GKAT || 'N/A',
                'Construction Year': building.properties?.GBAUJ || 'N/A',
                'Area (m²)': building.properties?.GAREA || 'N/A',
                'Volume (m³)': building.properties?.GVOL || 'N/A',
                'Apartments': building.properties?.GANZWHG || 'N/A',
                'Has Hazard Intersection': building.hazardInfo?.overlappingHazards?.length > 0 ? 'Yes' : 'No',
                'Number of Hazards': building.hazardInfo?.overlappingHazards?.length || 0
            }));
            console.table(buildingTable);
        }

        return {
            polygon: polygonGeoJSON,
            buildingsInside: buildingsInside,
            hazardsInside: hazardsInside,
            buildingsAnalyzed: analysisLayers.buildingsAnalyzed,
            analysisLayers: analysisLayers
        };

    } catch (error) {
        console.error('❌ Error extracting data inside polygon:', error);
        throw error;
    }
}

/**
 * Convert Leaflet polygon to GeoJSON format for Turf.js
 * @param {L.Polygon} leafletPolygon - Leaflet polygon
 * @returns {Object} GeoJSON polygon
 */
function leafletPolygonToGeoJSON(leafletPolygon) {
    const latLngs = leafletPolygon.getLatLngs()[0];
    const coordinates = latLngs.map(latLng => [latLng.lng, latLng.lat]);
    
    // Close the polygon if not already closed
    if (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || 
        coordinates[0][1] !== coordinates[coordinates.length - 1][1]) {
        coordinates.push(coordinates[0]);
    }

    const polygonGeoJSON = {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
        },
        properties: {}
    };
    
    // Console log the converted polygon
    console.log('📐 Converted polygon to GeoJSON:', polygonGeoJSON);
    console.log('📐 Polygon coordinates:', coordinates);
    
    return polygonGeoJSON;
}

/**
 * Extract buildings inside polygon using Turf.js
 * @param {Object} polygonGeoJSON - GeoJSON polygon
 * @param {L.Layer} buildingsLayer - Leaflet buildings layer
 * @param {L.Layer} hazardLayer - Leaflet hazard layer for intersection analysis
 * @returns {Array} Buildings inside polygon
 */
function extractBuildingsInsidePolygon(polygonGeoJSON, buildingsLayer, hazardLayer) {
    console.log('🏢 Extracting buildings inside polygon...');
    
    const buildingsInside = [];

    if (!buildingsLayer || !buildingsLayer.eachLayer) {
        console.warn('⚠️ Buildings layer not valid or empty');
        return buildingsInside;
    }

    // Debug: Check buildings layer structure (simplified)
    console.log('🔍 Buildings layer constructor:', buildingsLayer.constructor.name);
    
    // Count total layers
    let layerCount = 0;
    buildingsLayer.eachLayer(function() {
        layerCount++;
    });
    console.log(`🔍 Total layers in buildings layer: ${layerCount}`);

    buildingsLayer.eachLayer(function(layer) {
        try {
            // Try multiple ways to get feature data
            let feature = null;
            
            // Method 1: Check layer.feature
            if (layer.feature && layer.feature.geometry) {
                feature = layer.feature;
            }
            // Method 2: Try toGeoJSON method (this works for most Leaflet layers)
            else if (typeof layer.toGeoJSON === 'function') {
                try {
                    feature = layer.toGeoJSON();
                } catch (e) {
                    console.warn('⚠️ toGeoJSON failed:', e);
                }
            }
            
            if (feature && feature.geometry) {
                // For point geometries, check if point is inside polygon
                if (feature.geometry.type === 'Point') {
                    // Create Turf.js point using coordinates directly - following Turf.js documentation
                    const coords = feature.geometry.coordinates;
                    const turfPoint = turf.point([coords[0], coords[1]]);
                    
                    // Use Turf.js to check if point is inside polygon
                    const isInside = turf.booleanPointInPolygon(turfPoint, polygonGeoJSON);
                    
                    if (isInside) {
                        // Find hazards that intersect with this building
                        const buildingHazardInfo = findBuildingHazardIntersection(turfPoint, hazardLayer);
                        
                        buildingsInside.push({
                            feature: feature,
                            layer: layer,
                            geometry: feature.geometry,
                            properties: feature.properties || {},
                            hazardInfo: buildingHazardInfo // Add hazard info to building
                        });
                    }
                }
                // For polygon geometries, check if polygon intersects with analysis polygon
                else if (feature.geometry.type === 'Polygon') {
                    const buildingPolygon = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: feature.properties || {}
                    };
                    
                    // Use Turf.js to check intersection
                    if (turf.booleanIntersects(buildingPolygon, polygonGeoJSON)) {
                        // For polygon buildings, create centroid point for hazard intersection
                        const centroid = turf.centroid(buildingPolygon);
                        const buildingHazardInfo = findBuildingHazardIntersection(centroid, hazardLayer);
                        
                        buildingsInside.push({
                            feature: feature,
                            layer: layer,
                            geometry: feature.geometry,
                            properties: feature.properties || {},
                            hazardInfo: buildingHazardInfo // Add hazard info to building
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing building layer:', error);
        }
    });

    console.log(`📊 Total buildings found inside polygon: ${buildingsInside.length}`);
    return buildingsInside;
}

/**
 * Find hazard information for a building point using Turf.js intersection
 * @param {Object} buildingPoint - Turf.js point representing building location
 * @param {L.Layer} hazardLayer - Leaflet hazard layer
 * @returns {Object} Hazard information (recurrence, intensity)
 */
function findBuildingHazardIntersection(buildingPoint, hazardLayer) {
    const hazardInfo = {
        recurrence: null,
        intensity: null,
        hazardType: window.selectedHazard || 'unknown',
        overlappingHazards: []
    };

    if (!hazardLayer || !hazardLayer.eachLayer) {
        return hazardInfo;
    }

    hazardLayer.eachLayer(function(layer) {
        try {
            // Get feature data using same method as buildings
            let feature = null;
            
            if (layer.feature && layer.feature.geometry) {
                feature = layer.feature;
            } else if (typeof layer.toGeoJSON === 'function') {
                try {
                    feature = layer.toGeoJSON();
                } catch (e) {
                    // Skip this layer if toGeoJSON fails
                    return;
                }
            }

            if (feature && feature.geometry) {
                let intersects = false;

                // Check intersection based on hazard geometry type
                if (feature.geometry.type === 'Polygon') {
                    const hazardPolygon = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: feature.properties || {}
                    };
                    intersects = turf.booleanPointInPolygon(buildingPoint, hazardPolygon);
                } else if (feature.geometry.type === 'MultiPolygon') {
                    const hazardMultiPolygon = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: feature.properties || {}
                    };
                    intersects = turf.booleanPointInPolygon(buildingPoint, hazardMultiPolygon);
                }

                if (intersects) {
                    const props = feature.properties || {};
                    
                    // Extract recurrence information (try multiple field names)
                    const recurrenceFields = ['recurrence', 'return_period', 'wiederkehrperiode', 'periode_retour'];
                    for (const field of recurrenceFields) {
                        if (props[field]) {
                            hazardInfo.recurrence = props[field];
                            break;
                        }
                    }
                    
                    // Extract intensity information (try multiple field names in order of preference)
                    const intensityFields = ['classe_d_intensites', 'intensity_', 'intensity', 'intensite', 'intensitat', 'intensite_debris_flow'];
                    for (const field of intensityFields) {
                        if (props[field] && props[field] !== null && props[field] !== undefined && props[field] !== '') {
                            hazardInfo.intensity = props[field];
                            break;
                        }
                    }
                    
                    // Store the overlapping hazard with all properties
                    hazardInfo.overlappingHazards.push({
                        properties: props,
                        geometry: feature.geometry
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ Error checking hazard intersection:', error);
        }
    });

    return hazardInfo;
}

/**
 * Create analysis layers for Leaflet control
 * @param {Object} polygonGeoJSON - Analysis polygon
 * @param {Array} buildingsInside - Buildings inside polygon
 * @returns {Object} Analysis layers for map control
 */
function createAnalysisLayers(polygonGeoJSON, buildingsInside) {
    console.log('🗺️ Creating analysis layers for map control...');
    
    // 1. Create polygon layer
    const polygonLayer = L.geoJSON(polygonGeoJSON, {
        style: {
            color: '#ff0000',
            weight: 3,
            opacity: 1,
            fillColor: '#ff0000',
            fillOpacity: 0.1
        }
    });
    
    // 2. Create single buildings inside layer
    const buildingsInsideGeoJSON = {
        type: 'FeatureCollection',
        features: buildingsInside.map(building => building.feature)
    };
    
    const buildingsInsideLayer = L.geoJSON(buildingsInsideGeoJSON, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#00ff00',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const buildingId = props.EGID || props.id || 'Unknown';
            
            let popupContent = `<div class="building-popup">
                <h6><strong>🏢 Building Inside Polygon</strong></h6>
                <p><strong>EGID:</strong> ${props.EGID || 'N/A'}</p>
                <p><strong>Building Name:</strong> ${props.GGDENAME || 'N/A'}</p>
                <p><strong>Canton:</strong> ${props.GDEKT || 'N/A'}</p>
                <p><strong>Class:</strong> ${props.GKLAS || 'N/A'}</p>
                <p><strong>Category:</strong> ${props.GKAT || 'N/A'}</p>
                <p><strong>Construction Year:</strong> ${props.GBAUJ || 'N/A'}</p>
                <p><strong>Area:</strong> ${props.GAREA || 'N/A'} m²</p>
                <p><strong>Volume:</strong> ${props.GVOL || 'N/A'} m³</p>
                <p><strong>Apartments:</strong> ${props.GANZWHG || 'N/A'}</p>
                <p style="margin-top: 10px; font-style: italic; color: #666;">Status: Inside analysis polygon</p>
            </div>`;
            
            layer.bindPopup(popupContent);
        }
    });
    
    // 3. Create buildings analyzed (with hazard intersections) - duplicated for each hazard
    const buildingsAnalyzed = createBuildingsAnalyzedData(buildingsInside);
    
    const buildingsAnalyzedGeoJSON = {
        type: 'FeatureCollection',
        features: buildingsAnalyzed.map(building => ({
            type: 'Feature',
            geometry: building.geometry,
            properties: {
                // Building identification
                buildingId: building.buildingProperties?.EGID || building.buildingProperties?.id || 'Unknown',
                originalBuildingId: building.originalBuildingId,
                
                // Building attributes from Supabase
                EGID: building.buildingProperties?.EGID || null,
                GGDENAME: building.buildingProperties?.GGDENAME || null,
                GDEKT: building.buildingProperties?.GDEKT || null,
                GBEZ: building.buildingProperties?.GBEZ || null,
                GKODE: building.buildingProperties?.GKODE || null,
                GKODN: building.buildingProperties?.GKODN || null,
                GSTAT: building.buildingProperties?.GSTAT || null,
                GKAT: building.buildingProperties?.GKAT || null,
                GKLAS: building.buildingProperties?.GKLAS || null,
                GBAUJ: building.buildingProperties?.GBAUJ || null,
                GBAUP: building.buildingProperties?.GBAUP || null,
                GAREA: building.buildingProperties?.GAREA || null,
                GVOLNORM: building.buildingProperties?.GVOLNORM || null,
                GVOL: building.buildingProperties?.GVOL || null,
                GVOLSCE: building.buildingProperties?.GVOLSCE || null,
                GASTW: building.buildingProperties?.GASTW || null,
                GANZWHG: building.buildingProperties?.GANZWHG || null,
                GEBF: building.buildingProperties?.GEBF || null,
                
                // Hazard information
                hazardType: building.hazardType,
                recurrence: building.recurrence,
                intensity: building.intensity,
                
                // Analysis metadata
                hazardIndex: building.hazardIndex,
                totalHazardsForBuilding: building.totalHazardsForBuilding
            }
        }))
    };
    
    const buildingsAnalyzedLayer = L.geoJSON(buildingsAnalyzedGeoJSON, {
        pointToLayer: function(feature, latlng) {
            // Color based on hazard intensity
            const intensity = feature.properties.intensity;
            let color = '#ffff00'; // Default yellow
            
            if (intensity && intensity !== 'None') {
                if (intensity.includes('forte') || intensity.includes('high')) color = '#ff0000';
                else if (intensity.includes('moyenne') || intensity.includes('medium')) color = '#ff8800';
                else if (intensity.includes('faible') || intensity.includes('low')) color = '#ffff00';
            }
            
            return L.circleMarker(latlng, {
                radius: 10,
                fillColor: color,
                color: '#000',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            });
        },
        onEachFeature: function(feature, layer) {
            const props = feature.properties;
            
            // Get the building data from buildingsAnalyzed array to access full building properties
            const analysisIndex = buildingsAnalyzed.findIndex(b => 
                (b.buildingProperties?.EGID === props.buildingId || 
                 b.buildingProperties?.id === props.buildingId) &&
                b.hazardType === props.hazardType &&
                b.intensity === props.intensity
            );
            
            let buildingProps = {};
            if (analysisIndex >= 0) {
                buildingProps = buildingsAnalyzed[analysisIndex].buildingProperties || {};
            }
            
            // Create detailed popup with building and hazard information
            let popupContent = `<div class="building-analysis-popup">
                <h6><strong>🏢 Building Analysis Result</strong></h6>
                
                <div class="building-info">
                    <h7><strong>Building Information:</strong></h7>
                    <p><strong>EGID:</strong> ${buildingProps.EGID || 'N/A'}</p>
                    <p><strong>Building Name:</strong> ${buildingProps.GGDENAME || 'N/A'}</p>
                    <p><strong>Canton:</strong> ${buildingProps.GDEKT || 'N/A'}</p>
                    <p><strong>Building Category:</strong> ${buildingProps.GKAT || 'N/A'}</p>
                    <p><strong>Building Class:</strong> ${buildingProps.GKLAS || 'N/A'}</p>
                    <p><strong>Construction Year:</strong> ${buildingProps.GBAUJ || 'N/A'}</p>
                    <p><strong>Building Area:</strong> ${buildingProps.GAREA || 'N/A'} m²</p>
                    <p><strong>Building Volume:</strong> ${buildingProps.GVOL || 'N/A'} m³</p>
                    <p><strong>Number of Apartments:</strong> ${buildingProps.GANZWHG || 'N/A'}</p>
                </div>
                
                <div class="hazard-info" style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
                    <h7><strong>Hazard Information:</strong></h7>
                    <p><strong>Hazard Type:</strong> ${props.hazardType || 'N/A'}</p>
                    <p><strong>Intensity:</strong> ${props.intensity || 'N/A'}</p>
                    <p><strong>Recurrence Period:</strong> ${props.recurrence || 'N/A'}</p>
                </div>
                
                <div class="analysis-info" style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">
                    <p><strong>Original Building ID:</strong> ${props.originalBuildingId}</p>
                    <p style="font-size: 11px; color: #666;"><em>This building intersects with hazard zones</em></p>
                </div>
            </div>`;
            
            layer.bindPopup(popupContent);
        }
    });
    
    return {
        polygonLayer: polygonLayer,
        buildingsInsideLayer: buildingsInsideLayer,
        buildingsAnalyzedLayer: buildingsAnalyzedLayer,
        buildingsAnalyzed: buildingsAnalyzed
    };
}

/**
 * Create buildings analyzed data with duplicates for multiple hazard intersections
 * @param {Array} buildingsInside - Buildings inside polygon with hazard info
 * @returns {Array} Buildings analyzed with duplicates for each hazard intersection
 */
function createBuildingsAnalyzedData(buildingsInside) {
    console.log('📊 Creating buildings analyzed data with hazard duplicates...');
    
    const buildingsAnalyzed = [];
    
    buildingsInside.forEach((building, buildingIndex) => {
        const hazardInfo = building.hazardInfo;
        
        if (hazardInfo && hazardInfo.overlappingHazards && hazardInfo.overlappingHazards.length > 0) {
            // Create entry for each overlapping hazard
            hazardInfo.overlappingHazards.forEach((hazard, hazardIndex) => {
                const hazardProps = hazard.properties || {};
                
                // Extract recurrence and intensity for this specific hazard
                let recurrence = null;
                const recurrenceFields = ['recurrence', 'return_period', 'wiederkehrperiode', 'periode_retour'];
                for (const field of recurrenceFields) {
                    if (hazardProps[field] && hazardProps[field] !== null && hazardProps[field] !== undefined && hazardProps[field] !== '') {
                        recurrence = hazardProps[field];
                        break;
                    }
                }
                
                let intensity = null;
                const intensityFields = ['classe_d_intensites', 'intensity_', 'intensity', 'intensite', 'intensitat', 'intensite_debris_flow'];
                for (const field of intensityFields) {
                    if (hazardProps[field] && hazardProps[field] !== null && hazardProps[field] !== undefined && hazardProps[field] !== '') {
                        intensity = hazardProps[field];
                        break;
                    }
                }
                
                buildingsAnalyzed.push({
                    geometry: building.geometry,
                    buildingProperties: building.properties,
                    hazardType: hazardInfo.hazardType,
                    recurrence: recurrence,
                    intensity: intensity,
                    hazardProperties: hazardProps,
                    originalBuildingId: building.properties?.id || building.properties?.EGID || `building_${buildingIndex}`,
                    hazardIndex: hazardIndex,
                    totalHazardsForBuilding: hazardInfo.overlappingHazards.length
                });
            });
        }
    });
    
    console.log(`📊 Created ${buildingsAnalyzed.length} analyzed building entries from ${buildingsInside.length} buildings`);
    return buildingsAnalyzed;
}

/**
 * Remove existing analysis layers from map and layer control
 */
function removeExistingAnalysisLayers() {
    console.log('🗑️ Removing existing analysis layers...');
    
    if (!window.map || !window.ctlLayers) {
        console.warn('⚠️ Map or layer control not available');
        return;
    }
    
    try {
        // Remove existing analysis layers if they exist
        if (window.currentAnalysisLayers) {
            // Remove from map
            if (window.currentAnalysisLayers.polygonLayer && window.map.hasLayer(window.currentAnalysisLayers.polygonLayer)) {
                window.map.removeLayer(window.currentAnalysisLayers.polygonLayer);
            }
            if (window.currentAnalysisLayers.buildingsInsideLayer && window.map.hasLayer(window.currentAnalysisLayers.buildingsInsideLayer)) {
                window.map.removeLayer(window.currentAnalysisLayers.buildingsInsideLayer);
            }
            if (window.currentAnalysisLayers.buildingsAnalyzedLayer && window.map.hasLayer(window.currentAnalysisLayers.buildingsAnalyzedLayer)) {
                window.map.removeLayer(window.currentAnalysisLayers.buildingsAnalyzedLayer);
            }
            
            // Remove from layer control
            if (window.ctlLayers._layers) {
                Object.keys(window.ctlLayers._layers).forEach(layerId => {
                    const layerObj = window.ctlLayers._layers[layerId];
                    if (layerObj && layerObj.name) {
                        // Remove analysis-related overlays
                        if (layerObj.name.includes('Analysis Polygon') || 
                            layerObj.name.includes('Buildings Inside Polygon') || 
                            layerObj.name.includes('Buildings Analyzed')) {
                            window.ctlLayers.removeLayer(layerObj.layer);
                        }
                    }
                });
            }
            
            console.log('✅ Existing analysis layers removed');
        }
        
        // Clear global reference
        window.currentAnalysisLayers = null;
        
    } catch (error) {
        console.error('❌ Error removing existing analysis layers:', error);
    }
}

/**
 * Add analysis layers to map and layer control
 * @param {Object} analysisLayers - Analysis layers object
 */
function addAnalysisLayersToMap(analysisLayers) {
    console.log('🗺️ Adding analysis layers to map and layer control...');
    
    if (!window.map || !window.ctlLayers) {
        console.warn('⚠️ Map or layer control not available');
        return;
    }
    
    try {
        // Remove existing analysis layers first
        removeExistingAnalysisLayers();
        
        // Add new layers to map
        analysisLayers.polygonLayer.addTo(window.map);
        analysisLayers.buildingsInsideLayer.addTo(window.map);
        analysisLayers.buildingsAnalyzedLayer.addTo(window.map);
        
        // Add to layer control
        window.ctlLayers.addOverlay(analysisLayers.polygonLayer, '📐 Analysis Polygon');
        window.ctlLayers.addOverlay(analysisLayers.buildingsInsideLayer, '🏢 Buildings Inside Polygon');
        window.ctlLayers.addOverlay(analysisLayers.buildingsAnalyzedLayer, '🎯 Buildings Analyzed (with Hazards)');
        
        // Store globally for later access
        window.currentAnalysisLayers = analysisLayers;
        
        console.log('✅ Analysis layers added to map and layer control');
        
    } catch (error) {
        console.error('❌ Error adding analysis layers to map:', error);
    }
}

/**
 * Extract hazards inside polygon using Turf.js
 * @param {Object} polygonGeoJSON - GeoJSON polygon
 * @param {L.Layer} hazardLayer - Leaflet hazard layer
 * @returns {Array} Hazards inside polygon
 */
function extractHazardsInsidePolygon(polygonGeoJSON, hazardLayer) {
    console.log('🌋 Extracting hazards inside polygon...');
    
    const hazardsInside = [];

    if (!hazardLayer || !hazardLayer.eachLayer) {
        console.warn('⚠️ Hazard layer not valid or empty');
        return hazardsInside;
    }

    hazardLayer.eachLayer(function(layer) {
        try {
            // Get the feature from the layer
            if (layer.feature && layer.feature.geometry) {
                const feature = layer.feature;
                
                // For point geometries, check if point is inside polygon
                if (feature.geometry.type === 'Point') {
                    const point = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: feature.properties || {}
                    };
                    
                    // Use Turf.js to check if point is inside polygon
                    if (turf.booleanPointInPolygon(point, polygonGeoJSON)) {
                        hazardsInside.push({
                            feature: feature,
                            layer: layer,
                            geometry: feature.geometry,
                            properties: feature.properties || {}
                        });
                    }
                }
                // For polygon geometries, check if polygon intersects with analysis polygon
                else if (feature.geometry.type === 'Polygon') {
                    const hazardPolygon = {
                        type: 'Feature',
                        geometry: feature.geometry,
                        properties: feature.properties || {}
                    };
                    
                    // Use Turf.js to check intersection
                    if (turf.booleanIntersects(hazardPolygon, polygonGeoJSON)) {
                        hazardsInside.push({
                            feature: feature,
                            layer: layer,
                            geometry: feature.geometry,
                            properties: feature.properties || {}
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error processing hazard layer:', error);
        }
    });

    return hazardsInside;
}

// ==================== STEP 5: ENHANCED SPATIAL ANALYSIS ====================

/**
 * Step 5: Enhanced spatial analysis capabilities for professional risk assessment
 * Advanced spatial operations using Turf.js
 */

// ==================== BUFFER ANALYSIS ====================

/**
 * Create buffer zones around buildings and analyze hazards within buffers
 * @param {Array} buildings - Array of building features
 * @param {Array} hazards - Array of hazard features
 * @param {number} bufferDistance - Buffer distance in meters
 * @returns {Object} Analysis results with buffer intersections
 */
function performBufferAnalysis(buildings, hazards, bufferDistance = 100) {
    console.log(`🔍 Performing buffer analysis with ${bufferDistance}m buffer...`);
    
    const results = [];
    
    buildings.forEach((building, index) => {
        try {
            // Create buffer around building
            const buildingPoint = building.geometry.type === 'Point' ? 
                building : turf.centroid(building);
            
            const buffer = turf.buffer(buildingPoint, bufferDistance, { units: 'meters' });
            
            // Find hazards within buffer
            const hazardsInBuffer = hazards.filter(hazard => {
                try {
                    if (hazard.geometry.type === 'Point') {
                        return turf.booleanPointInPolygon(hazard, buffer);
                    } else if (hazard.geometry.type === 'Polygon') {
                        return turf.booleanIntersects(hazard, buffer);
                    }
                    return false;
                } catch (error) {
                    console.warn('Buffer analysis error for hazard:', error);
                    return false;
                }
            });
            
            results.push({
                buildingId: building.properties?.id || index,
                building: building,
                buffer: buffer,
                hazardsInBuffer: hazardsInBuffer,
                hazardCount: hazardsInBuffer.length,
                bufferDistance: bufferDistance
            });
            
        } catch (error) {
            console.warn('Error in buffer analysis for building:', error);
        }
    });
    
    console.log(`✅ Buffer analysis complete: ${results.length} buildings analyzed`);
    return results;
}

// ==================== PROXIMITY ANALYSIS ====================

/**
 * Calculate proximity distances between buildings and hazards
 * @param {Array} buildings - Array of building features
 * @param {Array} hazards - Array of hazard features
 * @returns {Object} Proximity analysis results
 */
function calculateProximityDistances(buildings, hazards) {
    console.log('📏 Calculating proximity distances...');
    
    const proximityResults = [];
    
    buildings.forEach((building, buildingIndex) => {
        try {
            const buildingPoint = building.geometry.type === 'Point' ? 
                building : turf.centroid(building);
            
            const hazardDistances = hazards.map((hazard, hazardIndex) => {
                try {
                    const hazardPoint = hazard.geometry.type === 'Point' ? 
                        hazard : turf.centroid(hazard);
                    
                    const distance = turf.distance(buildingPoint, hazardPoint, { units: 'meters' });
                    
                    return {
                        hazardId: hazard.properties?.id || hazardIndex,
                        hazard: hazard,
                        distance: distance,
                        hazardType: hazard.properties?.hazard_type || 'unknown'
                    };
                } catch (error) {
                    console.warn('Distance calculation error:', error);
                    return null;
                }
            }).filter(result => result !== null);
            
            // Sort by distance (closest first)
            hazardDistances.sort((a, b) => a.distance - b.distance);
            
            proximityResults.push({
                buildingId: building.properties?.id || buildingIndex,
                building: building,
                nearestHazard: hazardDistances[0] || null,
                allHazardDistances: hazardDistances,
                averageDistance: hazardDistances.length > 0 ? 
                    hazardDistances.reduce((sum, h) => sum + h.distance, 0) / hazardDistances.length : null
            });
            
        } catch (error) {
            console.warn('Error in proximity analysis for building:', error);
        }
    });
    
    console.log(`✅ Proximity analysis complete: ${proximityResults.length} buildings analyzed`);
    return proximityResults;
}

// ==================== SPATIAL CLUSTERING ANALYSIS ====================

/**
 * Perform spatial clustering analysis on buildings within hazard zones
 * @param {Array} buildings - Array of building features
 * @param {Array} hazards - Array of hazard features
 * @param {number} clusterDistance - Distance threshold for clustering in meters
 * @returns {Object} Clustering analysis results
 */
function performSpatialClustering(buildings, hazards, clusterDistance = 200) {
    console.log(`🎯 Performing spatial clustering analysis with ${clusterDistance}m threshold...`);
    
    try {
        // Create building clusters using Turf.js
        const buildingPoints = buildings.map(building => {
            return building.geometry.type === 'Point' ? building : turf.centroid(building);
        });
        
        // Simple clustering based on distance threshold
        const clusters = [];
        const processed = new Set();
        
        buildingPoints.forEach((building, index) => {
            if (processed.has(index)) return;
            
            const cluster = {
                id: clusters.length,
                buildings: [{ index, building, originalBuilding: buildings[index] }],
                center: building,
                hazardExposure: []
            };
            
            // Find nearby buildings within cluster distance
            buildingPoints.forEach((otherBuilding, otherIndex) => {
                if (otherIndex === index || processed.has(otherIndex)) return;
                
                const distance = turf.distance(building, otherBuilding, { units: 'meters' });
                if (distance <= clusterDistance) {
                    cluster.buildings.push({ 
                        index: otherIndex, 
                        building: otherBuilding, 
                        originalBuilding: buildings[otherIndex] 
                    });
                    processed.add(otherIndex);
                }
            });
            
            // Calculate cluster center (centroid of all buildings in cluster)
            if (cluster.buildings.length > 1) {
                const buildingCoords = cluster.buildings.map(b => b.building.geometry.coordinates);
                cluster.center = turf.centroid({
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPoint',
                        coordinates: buildingCoords
                    }
                });
            }
            
            // Analyze hazard exposure for this cluster
            const clusterBuffer = turf.buffer(cluster.center, clusterDistance / 2, { units: 'meters' });
            cluster.hazardExposure = hazards.filter(hazard => {
                try {
                    if (hazard.geometry.type === 'Point') {
                        return turf.booleanPointInPolygon(hazard, clusterBuffer);
                    } else if (hazard.geometry.type === 'Polygon') {
                        return turf.booleanIntersects(hazard, clusterBuffer);
                    }
                    return false;
                } catch (error) {
                    return false;
                }
            });
            
            cluster.riskScore = calculateClusterRiskScore(cluster);
            clusters.push(cluster);
            processed.add(index);
        });
        
        console.log(`✅ Spatial clustering complete: ${clusters.length} clusters identified`);
        return {
            clusters: clusters,
            totalBuildings: buildings.length,
            clusteredBuildings: processed.size,
            unclusteredBuildings: buildings.length - processed.size,
            averageClusterSize: clusters.reduce((sum, c) => sum + c.buildings.length, 0) / clusters.length
        };
        
    } catch (error) {
        console.error('❌ Error in spatial clustering analysis:', error);
        return null;
    }
}

/**
 * Calculate risk score for a building cluster
 * @param {Object} cluster - Cluster object with buildings and hazard exposure
 * @returns {number} Risk score (0-100)
 */
function calculateClusterRiskScore(cluster) {
    try {
        let riskScore = 0;
        
        // Base score from number of buildings (more buildings = higher risk)
        riskScore += Math.min(cluster.buildings.length * 5, 30);
        
        // Hazard exposure score
        const hazardTypes = new Set(cluster.hazardExposure.map(h => h.properties?.hazard_type || 'unknown'));
        riskScore += hazardTypes.size * 15; // Multiple hazard types increase risk
        
        // Hazard intensity score
        cluster.hazardExposure.forEach(hazard => {
            const intensity = hazard.properties?.intensity || hazard.properties?.danger_level || 'unknown';
            switch (intensity.toLowerCase()) {
                case 'high':
                case 'forte':
                    riskScore += 25;
                    break;
                case 'medium':
                case 'moyenne':
                    riskScore += 15;
                    break;
                case 'low':
                case 'faible':
                    riskScore += 5;
                    break;
            }
        });
        
        return Math.min(riskScore, 100); // Cap at 100
    } catch (error) {
        console.warn('Error calculating cluster risk score:', error);
        return 0;
    }
}

// ==================== MULTI-HAZARD OVERLAY ANALYSIS ====================

/**
 * Perform multi-hazard overlay analysis to identify areas with multiple hazard exposures
 * @param {Array} hazardLayers - Array of hazard layer objects with type information
 * @param {Array} buildings - Array of building features
 * @returns {Object} Multi-hazard analysis results
 */
function performMultiHazardAnalysis(hazardLayers, buildings) {
    console.log('🌊 Performing multi-hazard overlay analysis...');
    
    try {
        const multiHazardResults = buildings.map((building, index) => {
            const buildingPoint = building.geometry.type === 'Point' ? building : turf.centroid(building);
            const exposedHazards = [];
            
            hazardLayers.forEach(hazardLayer => {
                if (!hazardLayer.hazards || !Array.isArray(hazardLayer.hazards)) return;
                
                const exposedInLayer = hazardLayer.hazards.filter(hazard => {
                    try {
                        if (hazard.geometry.type === 'Point') {
                            const distance = turf.distance(buildingPoint, hazard, { units: 'meters' });
                            return distance <= 100; // Within 100m
                        } else if (hazard.geometry.type === 'Polygon') {
                            return turf.booleanPointInPolygon(buildingPoint, hazard) || 
                                   turf.booleanIntersects(building, hazard);
                        }
                        return false;
                    } catch (error) {
                        return false;
                    }
                });
                
                if (exposedInLayer.length > 0) {
                    exposedHazards.push({
                        hazardType: hazardLayer.type || 'unknown',
                        hazards: exposedInLayer,
                        count: exposedInLayer.length
                    });
                }
            });
            
            return {
                buildingId: building.properties?.id || index,
                building: building,
                exposedHazards: exposedHazards,
                hazardTypeCount: exposedHazards.length,
                totalHazardExposure: exposedHazards.reduce((sum, h) => sum + h.count, 0),
                multiHazardRisk: calculateMultiHazardRisk(exposedHazards)
            };
        });
        
        // Calculate statistics
        const stats = {
            totalBuildings: buildings.length,
            buildingsWithHazardExposure: multiHazardResults.filter(r => r.hazardTypeCount > 0).length,
            buildingsWithMultipleHazards: multiHazardResults.filter(r => r.hazardTypeCount > 1).length,
            averageHazardExposure: multiHazardResults.reduce((sum, r) => sum + r.totalHazardExposure, 0) / buildings.length,
            highestRiskBuildings: multiHazardResults
                .filter(r => r.multiHazardRisk > 70)
                .sort((a, b) => b.multiHazardRisk - a.multiHazardRisk)
                .slice(0, 10)
        };
        
        console.log(`✅ Multi-hazard analysis complete: ${stats.buildingsWithMultipleHazards} buildings with multiple hazard exposure`);
        
        return {
            results: multiHazardResults,
            statistics: stats
        };
        
    } catch (error) {
        console.error('❌ Error in multi-hazard analysis:', error);
        return null;
    }
}

/**
 * Calculate multi-hazard risk score
 * @param {Array} exposedHazards - Array of hazard exposures
 * @returns {number} Risk score (0-100)
 */
function calculateMultiHazardRisk(exposedHazards) {
    if (exposedHazards.length === 0) return 0;
    
    let riskScore = 0;
    
    // Base score for each hazard type
    exposedHazards.forEach(hazardGroup => {
        switch (hazardGroup.hazardType.toLowerCase()) {
            case 'rockfall':
            case 'rock_fall':
                riskScore += 30;
                break;
            case 'flooding':
            case 'flood':
                riskScore += 25;
                break;
            case 'debris_flow':
                riskScore += 35;
                break;
            case 'landslide':
                riskScore += 20;
                break;
            default:
                riskScore += 15;
        }
        
        // Additional score for multiple hazards of same type
        if (hazardGroup.count > 1) {
            riskScore += (hazardGroup.count - 1) * 5;
        }
    });
    
    // Multiplicative factor for multiple hazard types (compound risk)
    if (exposedHazards.length > 1) {
        riskScore *= (1 + (exposedHazards.length - 1) * 0.3);
    }
    
    return Math.min(riskScore, 100);
}

// ==================== SPATIAL STATISTICS ====================

/**
 * Calculate spatial statistics for the analysis area
 * @param {Array} buildings - Array of building features
 * @param {Array} hazards - Array of hazard features
 * @param {Object} analysisPolygon - Analysis polygon boundary
 * @returns {Object} Spatial statistics
 */
function calculateSpatialStatistics(buildings, hazards, analysisPolygon) {
    console.log('📊 Calculating spatial statistics...');
    
    try {
        // Area calculations
        const polygonArea = turf.area(analysisPolygon); // Square meters
        const polygonAreaKm2 = polygonArea / 1000000; // Square kilometers
        
        // Building density
        const buildingDensity = buildings.length / polygonAreaKm2; // Buildings per km²
        
        // Hazard density
        const hazardDensity = hazards.length / polygonAreaKm2; // Hazards per km²
        
        // Building distribution (using nearest neighbor analysis)
        const buildingDistances = [];
        buildings.forEach((building, i) => {
            const point1 = building.geometry.type === 'Point' ? building : turf.centroid(building);
            
            let minDistance = Infinity;
            buildings.forEach((otherBuilding, j) => {
                if (i !== j) {
                    const point2 = otherBuilding.geometry.type === 'Point' ? otherBuilding : turf.centroid(otherBuilding);
                    const distance = turf.distance(point1, point2, { units: 'meters' });
                    minDistance = Math.min(minDistance, distance);
                }
            });
            
            if (minDistance !== Infinity) {
                buildingDistances.push(minDistance);
            }
        });
        
        // Statistical measures
        const avgNearestNeighborDistance = buildingDistances.length > 0 ? 
            buildingDistances.reduce((sum, d) => sum + d, 0) / buildingDistances.length : 0;
        
        const medianNearestNeighborDistance = buildingDistances.length > 0 ?
            buildingDistances.sort((a, b) => a - b)[Math.floor(buildingDistances.length / 2)] : 0;
        
        // Clustering coefficient (simple measure)
        const expectedDistance = 0.5 / Math.sqrt(buildingDensity / 1000000); // Expected random distance
        const clusteringIndex = expectedDistance > 0 ? avgNearestNeighborDistance / expectedDistance : 0;
        
        const statistics = {
            area: {
                totalArea: polygonArea,
                totalAreaKm2: polygonAreaKm2
            },
            density: {
                buildingDensity: buildingDensity,
                hazardDensity: hazardDensity,
                buildingsPerHazard: hazards.length > 0 ? buildings.length / hazards.length : 0
            },
            distribution: {
                totalBuildings: buildings.length,
                totalHazards: hazards.length,
                avgNearestNeighborDistance: avgNearestNeighborDistance,
                medianNearestNeighborDistance: medianNearestNeighborDistance,
                clusteringIndex: clusteringIndex,
                distributionType: clusteringIndex < 1 ? 'clustered' : clusteringIndex > 1 ? 'dispersed' : 'random'
            }
        };
        
        console.log('✅ Spatial statistics calculated successfully');
        return statistics;
        
    } catch (error) {
        console.error('❌ Error calculating spatial statistics:', error);
        return null;
    }
}

// ==================== RISK ASSESSMENT FUNCTIONS ====================

/**
 * Perform comprehensive spatial risk assessment
 * @param {Object} analysisData - Complete analysis data
 * @returns {Object} Risk assessment results
 */
function performSpatialRiskAssessment(analysisData) {
    console.log('⚠️ Performing comprehensive spatial risk assessment...');
    
    try {
        const { buildings, hazards, polygon } = analysisData;
        
        // Calculate individual analysis components
        const bufferAnalysis = performBufferAnalysis(buildings, hazards, 100);
        const proximityAnalysis = calculateProximityDistances(buildings, hazards);
        const clusteringAnalysis = performSpatialClustering(buildings, hazards, 200);
        const spatialStats = calculateSpatialStatistics(buildings, hazards, polygon);
        
        // Combine results into comprehensive risk assessment
        const riskAssessment = buildings.map((building, index) => {
            const bufferResult = bufferAnalysis.find(b => b.buildingId === (building.properties?.id || index));
            const proximityResult = proximityAnalysis.find(p => p.buildingId === (building.properties?.id || index));
            const clusterInfo = clusteringAnalysis?.clusters?.find(c => 
                c.buildings.some(b => b.index === index)
            );
            
            // Calculate composite risk score
            let riskScore = 0;
            
            // Hazards in buffer contribute to risk
            if (bufferResult?.hazardCount > 0) {
                riskScore += Math.min(bufferResult.hazardCount * 15, 60);
            }
            
            // Proximity to nearest hazard
            if (proximityResult?.nearestHazard) {
                const distance = proximityResult.nearestHazard.distance;
                if (distance < 50) riskScore += 30;
                else if (distance < 100) riskScore += 20;
                else if (distance < 200) riskScore += 10;
            }
            
            // Cluster risk
            if (clusterInfo) {
                riskScore += clusterInfo.riskScore * 0.3; // 30% weight for cluster risk
            }
            
            // Cap risk score at 100
            riskScore = Math.min(riskScore, 100);
            
            return {
                buildingId: building.properties?.id || index,
                building: building,
                riskScore: riskScore,
                riskLevel: getRiskLevel(riskScore),
                bufferAnalysis: bufferResult,
                proximityAnalysis: proximityResult,
                clusterInfo: clusterInfo
            };
        });
        
        // Sort by risk score (highest first)
        riskAssessment.sort((a, b) => b.riskScore - a.riskScore);
        
        console.log('✅ Spatial risk assessment completed');
        
        return {
            buildingRiskAssessments: riskAssessment,
            summaryStatistics: {
                totalBuildings: buildings.length,
                highRiskBuildings: riskAssessment.filter(r => r.riskLevel === 'High').length,
                mediumRiskBuildings: riskAssessment.filter(r => r.riskLevel === 'Medium').length,
                lowRiskBuildings: riskAssessment.filter(r => r.riskLevel === 'Low').length,
                averageRiskScore: riskAssessment.reduce((sum, r) => sum + r.riskScore, 0) / riskAssessment.length
            },
            spatialStatistics: spatialStats,
            analysisMetadata: {
                analysisDate: new Date().toISOString(),
                bufferDistance: 100,
                clusterDistance: 200,
                analysisArea: spatialStats?.area?.totalAreaKm2 || 0
            }
        };
        
    } catch (error) {
        console.error('❌ Error in spatial risk assessment:', error);
        return null;
    }
}

/**
 * Get risk level from numeric risk score
 * @param {number} score - Risk score (0-100)
 * @returns {string} Risk level
 */
function getRiskLevel(score) {
    if (score >= 70) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
}

// ==================== ENHANCED SPATIAL UTILITIES ====================

/**
 * Create analysis layers for enhanced spatial analysis results
 * @param {Object} analysisResults - Results from enhanced spatial analysis
 * @param {L.Map} map - Leaflet map instance
 */
function createEnhancedAnalysisLayers(analysisResults, map) {
    console.log('🗺️ Creating enhanced analysis layers...');
    
    try {
        // Remove existing enhanced layers
        removeEnhancedAnalysisLayers();
        
        // Store layers globally for later removal
        if (!window.enhancedAnalysisLayers) {
            window.enhancedAnalysisLayers = {};
        }
        
        // Create risk heatmap layer (if results contain risk assessments)
        if (analysisResults.buildingRiskAssessments) {
            createRiskHeatmapLayer(analysisResults.buildingRiskAssessments, map);
        }
        
        // Create cluster visualization layer
        if (analysisResults.clusteringAnalysis?.clusters) {
            createClusterVisualizationLayer(analysisResults.clusteringAnalysis.clusters, map);
        }
        
        // Create buffer zones layer
        if (analysisResults.bufferAnalysis) {
            createBufferVisualizationLayer(analysisResults.bufferAnalysis, map);
        }
        
        console.log('✅ Enhanced analysis layers created');
        
    } catch (error) {
        console.error('❌ Error creating enhanced analysis layers:', error);
    }
}

/**
 * Remove enhanced analysis layers from map
 */
function removeEnhancedAnalysisLayers() {
    if (window.enhancedAnalysisLayers) {
        Object.values(window.enhancedAnalysisLayers).forEach(layer => {
            if (layer && map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        window.enhancedAnalysisLayers = {};
    }
}

/**
 * Create risk heatmap visualization
 * @param {Array} buildingRiskAssessments - Risk assessment results
 * @param {L.Map} map - Leaflet map instance
 */
function createRiskHeatmapLayer(buildingRiskAssessments, map) {
    const riskLayer = L.layerGroup();
    
    buildingRiskAssessments.forEach(assessment => {
        const building = assessment.building;
        const riskScore = assessment.riskScore;
        const riskLevel = assessment.riskLevel;
        
        // Get building center point
        const center = building.geometry.type === 'Point' ? 
            [building.geometry.coordinates[1], building.geometry.coordinates[0]] :
            turf.centroid(building).geometry.coordinates.slice().reverse();
        
        // Color based on risk level
        const color = getRiskColor(riskLevel);
        const radius = Math.max(5, riskScore / 5); // Radius based on risk score
        
        const marker = L.circleMarker(center, {
            radius: radius,
            fillColor: color,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        });
        
        // Add popup with risk information
        marker.bindPopup(`
            <div class="risk-popup">
                <h6>Risk Assessment</h6>
                <p><strong>Risk Level:</strong> ${riskLevel}</p>
                <p><strong>Risk Score:</strong> ${riskScore.toFixed(1)}/100</p>
                <p><strong>Building ID:</strong> ${assessment.buildingId}</p>
                <p><strong>Hazards in Buffer:</strong> ${assessment.bufferAnalysis?.hazardCount || 0}</p>
                <p><strong>Nearest Hazard:</strong> ${assessment.proximityAnalysis?.nearestHazard?.distance?.toFixed(0) || 'N/A'}m</p>
            </div>
        `);
        
        riskLayer.addLayer(marker);
    });
    
    riskLayer.addTo(map);
    window.enhancedAnalysisLayers.riskHeatmap = riskLayer;
}

/**
 * Get color for risk level
 * @param {string} riskLevel - Risk level (High/Medium/Low)
 * @returns {string} Color code
 */
function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'High': return '#dc3545';    // Red
        case 'Medium': return '#ffc107';  // Yellow
        case 'Low': return '#28a745';     // Green
        default: return '#6c757d';        // Gray
    }
}

/**
 * Create cluster visualization layer
 * @param {Array} clusters - Clustering analysis results
 * @param {L.Map} map - Leaflet map instance
 */
function createClusterVisualizationLayer(clusters, map) {
    const clusterLayer = L.layerGroup();
    
    clusters.forEach(cluster => {
        // Create cluster boundary
        const center = [
            cluster.center.geometry.coordinates[1], 
            cluster.center.geometry.coordinates[0]
        ];
        
        const circle = L.circle(center, {
            radius: 200, // Cluster radius
            fillColor: '#007bff',
            color: '#0056b3',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.2
        });
        
        // Add popup with cluster information
        circle.bindPopup(`
            <div class="cluster-popup">
                <h6>Building Cluster ${cluster.id}</h6>
                <p><strong>Buildings:</strong> ${cluster.buildings.length}</p>
                <p><strong>Hazard Exposure:</strong> ${cluster.hazardExposure.length}</p>
                <p><strong>Risk Score:</strong> ${cluster.riskScore.toFixed(1)}/100</p>
            </div>
        `);
        
        clusterLayer.addLayer(circle);
    });
    
    clusterLayer.addTo(map);
    window.enhancedAnalysisLayers.clusters = clusterLayer;
}

/**
 * Create buffer visualization layer
 * @param {Array} bufferResults - Buffer analysis results
 * @param {L.Map} map - Leaflet map instance
 */
function createBufferVisualizationLayer(bufferResults, map) {
    const bufferLayer = L.layerGroup();
    
    bufferResults.slice(0, 50).forEach(result => { // Limit to 50 to avoid performance issues
        if (result.hazardCount > 0) { // Only show buffers with hazard exposure
            // Convert Turf buffer to Leaflet
            const bufferCoords = result.buffer.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            
            const polygon = L.polygon(bufferCoords, {
                fillColor: '#ff7f0e',
                color: '#d62728',
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.1
            });
            
            polygon.bindPopup(`
                <div class="buffer-popup">
                    <h6>Buffer Zone Analysis</h6>
                    <p><strong>Building ID:</strong> ${result.buildingId}</p>
                    <p><strong>Buffer Distance:</strong> ${result.bufferDistance}m</p>
                    <p><strong>Hazards in Buffer:</strong> ${result.hazardCount}</p>
                </div>
            `);
            
            bufferLayer.addLayer(polygon);
        }
    });
    
    bufferLayer.addTo(map);
    window.enhancedAnalysisLayers.buffers = bufferLayer;
}

// ==================== EXPORT FUNCTIONS ====================

// Make functions available globally
window.extractDataInsidePolygon = extractDataInsidePolygon;
window.removeExistingAnalysisLayers = removeExistingAnalysisLayers;

// Enhanced spatial analysis functions (Step 5)
window.performBufferAnalysis = performBufferAnalysis;
window.calculateProximityDistances = calculateProximityDistances;
window.performSpatialClustering = performSpatialClustering;
window.performMultiHazardAnalysis = performMultiHazardAnalysis;
window.calculateSpatialStatistics = calculateSpatialStatistics;
window.performSpatialRiskAssessment = performSpatialRiskAssessment;
window.createEnhancedAnalysisLayers = createEnhancedAnalysisLayers;
window.removeEnhancedAnalysisLayers = removeEnhancedAnalysisLayers;

// ==================== SPATIAL HAZARD PROBABILITY FUNCTIONS ====================

/**
 * Calculate spatial hazard probability for risk assessment (moved from functions_2.js)
 * @param {number} rp - Return period
 * @param {string} hazType - Hazard type
 * @returns {number} Spatial hazard probability
 */
function spatialHazardProbValdorisk(rp, hazType) {
    console.log(`🎯 Calculating spatial hazard probability for ${hazType} with return period ${rp}`);
    
    if (hazType == 'rock_fall' || hazType == 'rockfall' || hazType == 'rock-fall' || hazType == 'rockFall') {
        if (rp == 30) {
            return 0.01;
        }
        if (rp == 100) {
            return 0.03;
        }
        if (rp == 300) {
            return 0.05;
        }
    }
    
    if (hazType == 'debris_flow' || hazType == 'debrisflow' || hazType == 'debris-flow' || hazType == 'debrisFlow') {
        if (rp == 30) {
            return 0.8;
        }
        if (rp == 100) {
            return 0.6;
        }
        if (rp == 300) {
            return 0.8;
        }
        if (rp == 1000) {
            return 0.8;
        }
    }
    
    if (hazType == 'flooding' || hazType == 'flood') {
        if (rp == 5) {
            return 0.7;
        }
        if (rp == 20) {
            return 0.7;
        }
        if (rp == 30) {
            return 0.9;
        }
        if (rp == 100) {
            return 0.7;
        }
        if (rp == 300) {
            return 0.9;
        }
        if (rp == 1000) {
            return 0.8;
        }
    }
    
    console.warn(`⚠️ No spatial hazard probability defined for ${hazType} with return period ${rp}`);
    return 0.5; // Default fallback
}

/**
 * Generate random spatial probability according to hazard type
 * @param {string} hazType - Hazard type
 * @returns {number} Random spatial probability
 */
function randomSpatialProb(hazType) {
    console.log(`🎲 Generating spatial probability for ${hazType}`);
    
    // Use fixed values consistent with functions_2.js for proper risk assessment
    if (hazType == 'rock_fall' || hazType == 'rockfall') {
        const value = 0.03; // Fixed 3% spatial probability for rockfall
        console.log(`  🎯 Rockfall spatial probability: ${value} (3%)`);
        return value;
    }
    
    if (hazType == 'debris_flow' || hazType == 'debrisflow') {
        const value = 0.7; // Fixed 70% spatial probability for debris flow
        console.log(`  🎯 Debris flow spatial probability: ${value} (70%)`);
        return value;
    }
    
    if (hazType == 'flooding' || hazType == 'flood') {
        const value = 0.8; // Fixed 80% spatial probability for flooding
        console.log(`  🎯 Flooding spatial probability: ${value} (80%)`);
        return value;
    }
    
    // Default fallback probability
    const defaultValue = 0.1;
    console.log(`  ⚠️ Unknown hazard type ${hazType}, using default: ${defaultValue} (10%)`);
    return defaultValue;
}

/**
 * Calculate temporal hazard probability based on study period and return period
 * @param {number} studyPeriod - Study period in years
 * @param {number} returnPeriod - Return period in years
 * @returns {number} Temporal probability
 */
function temporalHazardProbability(studyPeriod, returnPeriod) {
    if (returnPeriod <= 0) {
        console.warn('⚠️ Invalid return period for temporal probability calculation');
        return 0;
    }
    
    // Probability = 1 - (1 - 1/returnPeriod)^studyPeriod
    const annualProbability = 1 / returnPeriod;
    const temporalProb = 1 - Math.pow(1 - annualProbability, studyPeriod);
    
    console.log(`📊 Temporal probability: ${temporalProb.toFixed(4)} (study period: ${studyPeriod} years, return period: ${returnPeriod} years)`);
    return temporalProb;
}

// ==================== ENHANCED SPATIAL ANALYSIS INTEGRATIONS ====================

/**
 * Integrate enhanced spatial analysis with existing risk calculations
 * @param {Array} buildings - Building features
 * @param {Array} hazards - Hazard features
 * @param {Object} options - Analysis options
 * @returns {Object} Integrated analysis results
 */
function integratedSpatialRiskAnalysis(buildings, hazards, options = {}) {
    console.log('🔬 Performing integrated spatial risk analysis...');
    
    const defaultOptions = {
        bufferDistance: 100,
        clusterDistance: 200,
        studyPeriod: 50,
        includeTemporalAnalysis: true,
        includeSpatialStatistics: true,
        generateVisualizationLayers: true
    };
    
    const config = { ...defaultOptions, ...options };
    
    try {
        const results = {
            metadata: {
                analysisDate: new Date().toISOString(),
                totalBuildings: buildings.length,
                totalHazards: hazards.length,
                configuration: config
            }
        };
        
        // Perform buffer analysis
        if (config.bufferDistance > 0) {
            console.log('📍 Performing buffer analysis...');
            results.bufferAnalysis = performBufferAnalysis(buildings, hazards, config.bufferDistance);
        }
        
        // Perform proximity analysis
        console.log('📏 Calculating proximity distances...');
        results.proximityAnalysis = calculateProximityDistances(buildings, hazards);
        
        // Perform clustering analysis
        if (config.clusterDistance > 0) {
            console.log('🎯 Performing spatial clustering...');
            results.clusteringAnalysis = performSpatialClustering(buildings, hazards, config.clusterDistance);
        }
        
        // Multi-hazard analysis
        if (hazards.length > 0) {
            console.log('🌊 Performing multi-hazard analysis...');
            const hazardLayers = [{ type: 'mixed', hazards: hazards }];
            results.multiHazardAnalysis = performMultiHazardAnalysis(hazardLayers, buildings);
        }
        
        // Spatial statistics
        if (config.includeSpatialStatistics && options.analysisPolygon) {
            console.log('📊 Calculating spatial statistics...');
            results.spatialStatistics = calculateSpatialStatistics(buildings, hazards, options.analysisPolygon);
        }
        
        // Comprehensive risk assessment
        console.log('⚠️ Generating comprehensive risk assessment...');
        results.riskAssessment = performSpatialRiskAssessment({
            buildings: buildings,
            hazards: hazards,
            polygon: options.analysisPolygon
        });
        
        // Enhanced analysis with temporal components
        if (config.includeTemporalAnalysis) {
            console.log('⏰ Adding temporal risk components...');
            results.temporalAnalysis = buildings.map((building, index) => {
                const proximityResult = results.proximityAnalysis.find(p => p.buildingId === (building.properties?.id || index));
                const nearestHazard = proximityResult?.nearestHazard;
                
                let temporalRisk = 0;
                if (nearestHazard) {
                    const hazardType = nearestHazard.hazardType || 'rockfall';
                    const returnPeriod = nearestHazard.hazard?.properties?.return_period || 100;
                    
                    // Calculate temporal probability
                    const temporalProb = temporalHazardProbability(config.studyPeriod, returnPeriod);
                    
                    // Calculate spatial probability
                    const spatialProb = spatialHazardProbValdorisk(returnPeriod, hazardType);
                    
                    // Combined temporal-spatial risk
                    temporalRisk = temporalProb * spatialProb * 100;
                }
                
                return {
                    buildingId: building.properties?.id || index,
                    temporalRisk: temporalRisk,
                    studyPeriod: config.studyPeriod
                };
            });
        }
        
        // Summary statistics
        results.summary = {
            highRiskBuildings: results.riskAssessment?.buildingRiskAssessments?.filter(b => b.riskLevel === 'High').length || 0,
            mediumRiskBuildings: results.riskAssessment?.buildingRiskAssessments?.filter(b => b.riskLevel === 'Medium').length || 0,
            lowRiskBuildings: results.riskAssessment?.buildingRiskAssessments?.filter(b => b.riskLevel === 'Low').length || 0,
            clusteredBuildings: results.clusteringAnalysis?.clusteredBuildings || 0,
            buildingsWithHazardExposure: results.bufferAnalysis?.filter(b => b.hazardCount > 0).length || 0
        };
        
        console.log('✅ Integrated spatial risk analysis completed successfully');
        console.log(`📋 Summary: ${results.summary.highRiskBuildings} high-risk, ${results.summary.mediumRiskBuildings} medium-risk, ${results.summary.lowRiskBuildings} low-risk buildings`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Error in integrated spatial risk analysis:', error);
        return null;
    }
}

// ==================== FINAL EXPORTS ====================

// Make functions available globally
window.extractDataInsidePolygon = extractDataInsidePolygon;
window.removeExistingAnalysisLayers = removeExistingAnalysisLayers;

// Enhanced spatial analysis functions (Step 5)
window.performBufferAnalysis = performBufferAnalysis;
window.calculateProximityDistances = calculateProximityDistances;
window.performSpatialClustering = performSpatialClustering;
window.performMultiHazardAnalysis = performMultiHazardAnalysis;
window.calculateSpatialStatistics = calculateSpatialStatistics;
window.performSpatialRiskAssessment = performSpatialRiskAssessment;
window.createEnhancedAnalysisLayers = createEnhancedAnalysisLayers;
window.removeEnhancedAnalysisLayers = removeEnhancedAnalysisLayers;

// Spatial probability functions (moved from functions_2.js)
window.spatialHazardProbValdorisk = spatialHazardProbValdorisk;
window.randomSpatialProb = randomSpatialProb;
window.temporalHazardProbability = temporalHazardProbability;

// Integrated analysis function
window.integratedSpatialRiskAnalysis = integratedSpatialRiskAnalysis;

console.log('✅ Enhanced Spatial Analysis module (Step 5) loaded successfully with advanced capabilities');