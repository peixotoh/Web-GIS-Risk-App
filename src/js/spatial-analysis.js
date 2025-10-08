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
        // Add layers to map
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

// ==================== EXPORT FUNCTIONS ====================

// Make functions available globally
window.extractDataInsidePolygon = extractDataInsidePolygon;

console.log('✅ Spatial analysis module (Step 1) loaded successfully');