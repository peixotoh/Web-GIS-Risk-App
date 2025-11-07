/**
 * ANALYSIS & VISUALIZATION MODULE
 * Handles analysis results display, data visualization, and reporting functionality
 * Part of the modular refactoring of app.js
 * 
 * This module contains:
 * - Analysis results modal and display
 * - AG Grid data tables for building analysis
 * - Plotly-based damage analysis graphs and charts
 * - PDF export functionality
 * - Building highlighting on map
 * - Analysis summary and statistics
 * - Interactive visualization controls
 */

(function() {
    'use strict';

    // ============================
    // ANALYSIS CONTROLS
    // ============================

    /**
     * Initialize analysis control buttons
     */
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
                        alert('⚠️ Hazard layer not available. Please ensure hazard data is loaded.');
                        return;
                    }
                    
                    // Disable the button during analysis
                    runAnalysisBtn.disabled = true;
                    runAnalysisBtn.textContent = 'Analyzing...';
                    
                    console.log('✅ All prerequisites met, starting analysis...');
                    
                    // Run the spatial analysis (function should be in spatial-analysis.js)
                    if (typeof window.runSpatialAnalysis === 'function') {
                        const results = await window.runSpatialAnalysis();
                        
                        if (results && results.buildingsAnalyzed && results.buildingsAnalyzed.length > 0) {
                            // Enable show results button
                            if (showResultsBtn) {
                                showResultsBtn.disabled = false;
                            }
                            
                            // Store latest results globally
                            window.latestExtractionResults = results;
                            
                            // Auto-show results modal
                            showAnalysisResultsModal(results);
                            
                            // Check workflow progress
                            if (typeof window.checkWorkflowProgress === 'function') {
                                window.checkWorkflowProgress();
                            }
                        } else {
                            console.warn('⚠️ No analysis results returned');
                            alert('Analysis completed but no buildings were found in the hazard zones.');
                        }
                        
                    } else {
                        console.error('❌ runSpatialAnalysis function not available');
                        alert('Spatial analysis function not available. Please check the application setup.');
                    }
                    
                } catch (error) {
                    console.error('❌ Error during analysis:', error);
                    alert('Error during analysis: ' + error.message);
                } finally {
                    // Re-enable the button
                    runAnalysisBtn.disabled = false;
                    runAnalysisBtn.textContent = 'Run Analysis';
                }
            });
        }
        
        // Show results button handler
        if (showResultsBtn) {
            showResultsBtn.addEventListener('click', function() {
                if (window.latestExtractionResults) {
                    showAnalysisResultsModal(window.latestExtractionResults);
                } else {
                    alert('No analysis results available. Please run the analysis first.');
                }
            });
        }
        
        console.log('✅ Analysis controls initialized');
    }

    // ============================
    // ANALYSIS RESULTS MODAL
    // ============================

    /**
     * Show the analysis results modal with comprehensive data display
     */
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
        
        // Set up export PDF button handler
        const exportBtn = document.getElementById('export-pdf-btn');
        if (exportBtn) {
            exportBtn.onclick = function() {
                exportResultsToPDF(extractionResults);
            };
        }
        
        // Close modal when clicking outside of it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        console.log('✅ Analysis results modal displayed');
    }

    /**
     * Populate analysis summary statistics
     */
    function populateAnalysisSummary(extractionResults) {
        console.log('📊 Populating analysis summary');
        
        try {
            const buildingsAnalyzed = extractionResults?.buildingsAnalyzed || [];
            const buildingsInside = extractionResults?.buildingsInside || [];
            
            // Update summary stats
            document.getElementById('total-buildings-analyzed').textContent = buildingsAnalyzed.length;
            document.getElementById('buildings-inside-polygon').textContent = buildingsInside.length;
            
            // Calculate buildings with hazard exposure
            const buildingsWithHazard = buildingsAnalyzed.filter(b => 
                b.intensity && b.intensity !== 'aucune_atteinte' && b.intensity !== 'No hazard'
            );
            document.getElementById('buildings-with-hazard').textContent = buildingsWithHazard.length;
            
            // Calculate average damage if available
            const buildingsWithDamage = buildingsAnalyzed.filter(b => b.damage !== undefined && b.damage !== null);
            if (buildingsWithDamage.length > 0) {
                const avgDamage = buildingsWithDamage.reduce((sum, b) => sum + (parseFloat(b.damage) || 0), 0) / buildingsWithDamage.length;
                document.getElementById('average-damage').textContent = avgDamage.toFixed(2) + '%';
            } else {
                document.getElementById('average-damage').textContent = 'N/A';
            }
            
            // Hazard type and selected area info
            document.getElementById('hazard-type-summary').textContent = window.selectedHazard || 'Unknown';
            document.getElementById('analysis-area').textContent = 'Custom polygon';
            
            console.log('✅ Analysis summary populated');
            
        } catch (error) {
            console.error('❌ Error populating analysis summary:', error);
        }
    }

    // ============================
    // DATA TABLES (AG GRID)
    // ============================

    /**
     * Create AG Grid table with buildings analyzed data
     */
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
        
        // Show ALL buildings analyzed (including "aucune_atteinte" for investigation)
        const buildingsToShow = buildingsAnalyzed;
        
        console.log(`📊 Showing all ${buildingsToShow.length} buildings analyzed (including "aucune_atteinte" for investigation)`);
        
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
                const returnPeriod = parseInt(String(building.recurrence).match(/\\d+/)?.[0]);
                if (returnPeriod) {
                    temporalHazardProbValue = window.temporaHazardProbability(window.selectedHazard, returnPeriod) || 'N/A';
                }
            }

            // Extract spatial hazard probability with robust access
            let spatialHazardProbValue = 'N/A';
            
            if (building.SPATIAL_HAZARD_PROB !== undefined && building.SPATIAL_HAZARD_PROB !== null) {
                spatialHazardProbValue = building.SPATIAL_HAZARD_PROB;
            } else if (building?.intensity && window.spatialHazardProbability) {
                spatialHazardProbValue = window.spatialHazardProbability(building.intensity) || 'N/A';
            }

            return {
                id: index + 1,
                egid: building.buildingProperties?.EGID || building.EGID || `Building_${index + 1}`,
                hazardType: building.hazardType || window.selectedHazard || 'Unknown',
                intensity: building.intensity || building.hazardIntensity || 'Unknown',
                recurrence: building.recurrence || building.hazardRecurrence || 'Unknown',
                temporalHazardProb: temporalHazardProbValue,
                spatialHazardProb: spatialHazardProbValue,
                vulnerability: building.vulnerability !== undefined ? Number(building.vulnerability).toFixed(3) : 'N/A',
                damage: building.damage !== undefined ? Number(building.damage).toFixed(2) + '%' : 'N/A',
                method: building.method || 'Unknown',
                municipality: building.buildingProperties?.GGDENAME || building.GGDENAME || 'Unknown',
                buildingClass: building.buildingProperties?.GKAT || building.GKAT || 'Unknown'
            };
        });
        
        console.log('📊 Prepared row data sample:', rowData[0]);
        
        // Define column definitions for AG Grid
        const columnDefs = [
            { headerName: 'ID', field: 'id', width: 60, pinned: 'left' },
            { headerName: 'Building EGID', field: 'egid', width: 120, pinned: 'left' },
            { headerName: 'Hazard Type', field: 'hazardType', width: 120 },
            { headerName: 'Intensity', field: 'intensity', width: 100 },
            { headerName: 'Recurrence', field: 'recurrence', width: 100 },
            { headerName: 'Temporal Hazard Prob.', field: 'temporalHazardProb', width: 140 },
            { headerName: 'Spatial Hazard Prob.', field: 'spatialHazardProb', width: 140 },
            { headerName: 'Vulnerability', field: 'vulnerability', width: 120 },
            { headerName: 'Damage', field: 'damage', width: 100 },
            { headerName: 'Method', field: 'method', width: 100 },
            { headerName: 'Municipality', field: 'municipality', width: 140 },
            { headerName: 'Building Class', field: 'buildingClass', width: 120 }
        ];
        
        // Grid options with updated API (no deprecated properties)
        const gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            defaultColDef: {
                resizable: true,
                sortable: true,
                filter: true
            },
            pagination: true,
            paginationPageSize: 20,
            domLayout: 'normal',
            enableCellTextSelection: true,
            suppressMenuHide: true,
            animateRows: true
        };
        
        // Check if AG Grid is available
        if (typeof agGrid === 'undefined') {
            console.error('❌ AG Grid not available');
            gridContainer.innerHTML = '<div class="text-center p-4"><h5>AG Grid library not loaded</h5><p>Please refresh the page and try again.</p></div>';
            return;
        }
        
        // Create and initialize the grid
        try {
            agGrid.createGrid(gridContainer, gridOptions);
            console.log('✅ AG Grid table created successfully');
        } catch (error) {
            console.error('❌ Error creating AG Grid:', error);
            gridContainer.innerHTML = '<div class="text-center p-4"><h5>Error creating data table</h5><p>See console for details.</p></div>';
        }
    }

    // ============================
    // DETAILED RESULTS DISPLAY
    // ============================

    /**
     * Display detailed analysis results (alternative to modal)
     */
    function displayAnalysisResults(results) {
        console.log('📊 Displaying detailed analysis results');
        
        if (!results) {
            console.warn('⚠️ No results to display');
            return;
        }
        
        const resultsContainer = document.getElementById('analysis-results-container');
        if (!resultsContainer) {
            console.error('❌ Analysis results container not found');
            return;
        }
        
        // Clear existing content
        resultsContainer.innerHTML = '';
        
        // Create results summary
        const summaryHtml = `
            <div class="results-summary">
                <h3>Analysis Results Summary</h3>
                <div class="row">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>${results.buildingsAnalyzed?.length || 0}</h4>
                            <p>Buildings Analyzed</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>${results.buildingsInside?.length || 0}</h4>
                            <p>Buildings in Polygon</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>${window.selectedHazard || 'Unknown'}</h4>
                            <p>Hazard Type</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>${new Date().toLocaleDateString()}</h4>
                            <p>Analysis Date</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = summaryHtml;
        
        // Add data table container
        const tableContainer = document.createElement('div');
        tableContainer.id = 'results-ag-grid';
        tableContainer.className = 'ag-theme-alpine';
        tableContainer.style.height = '400px';
        tableContainer.style.width = '100%';
        resultsContainer.appendChild(tableContainer);
        
        // Create AG Grid in the new container
        createAnalysisAGGridTable(results.buildingsAnalyzed || []);
        
        console.log('✅ Detailed analysis results displayed');
    }

    // ============================
    // DAMAGE ANALYSIS GRAPHS
    // ============================

    /**
     * Create damage analysis graphs using Plotly
     */
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
                    const returnPeriod = building.recurrence || building.hazardRecurrence || building.returnPeriod || building.return_period;
                    
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
                
                if (typeof Plotly !== 'undefined') {
                    Plotly.newPlot('econome-damage-graph', economeGraphData, economeGraphLayout, graphConfig);
                    Plotly.newPlot('literature-damage-graph', literatureGraphData, literatureGraphLayout, graphConfig);
                    
                    console.log('✅ Damage analysis graphs created successfully');
                    console.log(`📊 EconoMe totals: T30=${economeDamageTotals.period30.toLocaleString()}, T100=${economeDamageTotals.period100.toLocaleString()}, T300=${economeDamageTotals.period300.toLocaleString()}, Total=${economeTotal.toLocaleString()}`);
                    console.log(`📚 Literature totals: T30=${literatureDamageTotals.period30.toLocaleString()}, T100=${literatureDamageTotals.period100.toLocaleString()}, T300=${literatureDamageTotals.period300.toLocaleString()}, Total=${literatureTotal.toLocaleString()}`);
                } else {
                    console.error('❌ Plotly library not available');
                    economeContainer.innerHTML = '<div class="text-center p-4 text-warning"><h5>Plotly library not loaded</h5><p>Cannot create interactive graphs</p></div>';
                    literatureContainer.innerHTML = '<div class="text-center p-4 text-warning"><h5>Plotly library not loaded</h5><p>Cannot create interactive graphs</p></div>';
                }
                
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
        
        // Create additional Method 3 graphs if functions are available
        if (typeof window.createCATModelVulnerabilityGraph === 'function') {
            window.createCATModelVulnerabilityGraph();
        }
        if (typeof window.createMethod3ExceedanceGraph === 'function') {
            window.createMethod3ExceedanceGraph();
        }
        if (typeof window.createIntensityCumulativeGraph === 'function') {
            window.createIntensityCumulativeGraph();
        }
        if (typeof window.createFrequencyCumulativeGraph === 'function') {
            window.createFrequencyCumulativeGraph();
        }
        if (typeof window.createCATModelsSummaryTable === 'function') {
            window.createCATModelsSummaryTable();
        }
    }

    // ============================
    // BUILDING HIGHLIGHTING
    // ============================

    /**
     * Highlight analyzed buildings on the map
     */
    function highlightAnalyzedBuildings(analyzedBuildings) {
        console.log('🎯 Highlighting analyzed buildings on map:', analyzedBuildings?.length || 0);
        
        if (!analyzedBuildings || analyzedBuildings.length === 0) {
            console.warn('⚠️ No analyzed buildings to highlight');
            return;
        }

        if (!window.map) {
            console.error('❌ Map not available for highlighting');
            return;
        }

        try {
            // Remove any existing highlight layer
            if (window.highlightLayer) {
                try { 
                    window.map.removeLayer(window.highlightLayer);
                } catch (e) { /* ignore */ }
                window.highlightLayer = null;
            }

            // Create highlight markers
            const highlightMarkers = [];
            
            analyzedBuildings.forEach((building, index) => {
                try {
                    // Get building coordinates
                    let lat, lng;
                    
                    if (building.buildingProperties?.coordinates) {
                        [lng, lat] = building.buildingProperties.coordinates;
                    } else if (building.coordinates) {
                        [lng, lat] = building.coordinates;
                    } else if (building.buildingProperties?.GKODE && building.buildingProperties?.GKODN) {
                        // Convert Swiss coordinates if available
                        if (typeof window.swissToWGS84 === 'function') {
                            const converted = window.swissToWGS84(building.buildingProperties.GKODE, building.buildingProperties.GKODN);
                            lat = converted.lat;
                            lng = converted.lng;
                        }
                    }

                    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                        return; // Skip invalid coordinates
                    }

                    // Create highlight marker with damage-based styling
                    const damage = parseFloat(building.damage) || 0;
                    let color = '#ffff00'; // Default yellow
                    
                    if (damage > 80) {
                        color = '#ff0000'; // Red for high damage
                    } else if (damage > 50) {
                        color = '#ff8000'; // Orange for medium damage
                    } else if (damage > 20) {
                        color = '#ffff00'; // Yellow for low damage
                    } else {
                        color = '#80ff80'; // Light green for minimal damage
                    }

                    const marker = L.circleMarker([lat, lng], {
                        radius: 8,
                        fillColor: color,
                        color: '#000000',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8,
                        interactive: true
                    });

                    // Add popup with analysis results
                    const egid = building.buildingProperties?.EGID || building.EGID || `Building_${index + 1}`;
                    const intensity = building.intensity || 'Unknown';
                    const method = building.method || 'Unknown';
                    
                    const popupContent = `
                        <div class="highlight-popup">
                            <h6><strong>🎯 Analyzed Building</strong></h6>
                            <p><strong>EGID:</strong> ${egid}</p>
                            <p><strong>Hazard Intensity:</strong> ${intensity}</p>
                            <p><strong>Damage:</strong> ${damage.toFixed(2)}%</p>
                            <p><strong>Method:</strong> ${method}</p>
                            <p><strong>Hazard Type:</strong> ${building.hazardType || window.selectedHazard || 'Unknown'}</p>
                        </div>
                    `;

                    marker.bindPopup(popupContent);
                    highlightMarkers.push(marker);

                } catch (error) {
                    console.warn(`⚠️ Error creating highlight marker for building ${index}:`, error);
                }
            });

            if (highlightMarkers.length > 0) {
                // Create layer group and add to map
                window.highlightLayer = L.layerGroup(highlightMarkers);
                window.highlightLayer.addTo(window.map);
                
                // Add to layer control
                try {
                    if (window.ctlLayers) {
                        window.ctlLayers.addOverlay(window.highlightLayer, '🎯 Analyzed Buildings');
                    }
                } catch (e) { /* ignore */ }
                
                console.log(`✅ Highlighted ${highlightMarkers.length} analyzed buildings on map`);
                
                // Optionally zoom to highlighted buildings
                try {
                    const group = new L.featureGroup(highlightMarkers);
                    window.map.fitBounds(group.getBounds().pad(0.1));
                } catch (e) { /* ignore */ }
                
            } else {
                console.warn('⚠️ No valid highlight markers created');
            }

        } catch (error) {
            console.error('❌ Error highlighting analyzed buildings:', error);
        }
    }

    // ============================
    // PDF EXPORT FUNCTIONALITY
    // ============================

    /**
     * Export analysis results to PDF with visual content
     */
    function exportResultsToPDF(extractionResults) {
        console.log('📄 Starting enhanced PDF export of analysis results...');
        
        // Show loading indicator
        const pdfBtn = document.getElementById('export-pdf-btn') || document.getElementById('export-results-pdf');
        const originalText = pdfBtn ? pdfBtn.textContent : '';
        if (pdfBtn) {
            pdfBtn.textContent = '⏳ Generating PDF...';
            pdfBtn.disabled = true;
        }

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
                // Fallback to simple text PDF
                createSimpleTextPDF(jsPDFConstructor, extractionResults);
                return;
            }

            // Get the modal content to capture
            const modalContent = document.querySelector('#analysis-results-modal .modal-body');
            if (!modalContent) {
                console.warn('⚠️ Modal content not found. Creating simple text PDF...');
                createSimpleTextPDF(jsPDFConstructor, extractionResults);
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
            
            // Try fallback if possible
            try {
                if (typeof window.jsPDF !== 'undefined' || typeof jsPDF !== 'undefined') {
                    createSimpleTextPDF(window.jsPDF || jsPDF, extractionResults);
                }
            } catch (fallbackError) {
                console.error('❌ Fallback PDF export also failed:', fallbackError);
            }
        } finally {
            // Restore button
            if (pdfBtn) {
                pdfBtn.textContent = originalText;
                pdfBtn.disabled = false;
            }
        }
    }

    /**
     * Fallback function for simple text-based PDF
     */
    function createSimpleTextPDF(jsPDFConstructor, extractionResults) {
        console.log('📄 Creating fallback text-based PDF...');
        
        try {
            const pdf = new jsPDFConstructor('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            let yPosition = 30;

            // Title
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Spatial Analysis Results Report', margin, yPosition);
            
            yPosition += 15;
            
            // Date
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            const now = new Date();
            pdf.text(`Generated on: ${now.toLocaleString()}`, margin, yPosition);
            
            yPosition += 20;
            
            // Summary statistics
            if (extractionResults) {
                pdf.setFont('helvetica', 'bold');
                pdf.text('Analysis Summary:', margin, yPosition);
                yPosition += 10;
                
                pdf.setFont('helvetica', 'normal');
                pdf.text(`• Buildings Analyzed: ${extractionResults.buildingsAnalyzed?.length || 0}`, margin + 5, yPosition);
                yPosition += 7;
                pdf.text(`• Buildings Inside Polygon: ${extractionResults.buildingsInside?.length || 0}`, margin + 5, yPosition);
                yPosition += 7;
                pdf.text(`• Hazard Type: ${window.selectedHazard || 'Not specified'}`, margin + 5, yPosition);
                yPosition += 15;
                
                // Buildings with hazard exposure
                const buildingsWithHazard = extractionResults.buildingsAnalyzed?.filter(b => 
                    b.intensity && b.intensity !== 'aucune_atteinte' && b.intensity !== 'No hazard'
                ) || [];
                
                pdf.text(`• Buildings with Hazard Exposure: ${buildingsWithHazard.length}`, margin + 5, yPosition);
                yPosition += 15;
                
                // Building details table header
                if (extractionResults.buildingsAnalyzed && extractionResults.buildingsAnalyzed.length > 0) {
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Building Analysis Details:', margin, yPosition);
                    yPosition += 10;
                    
                    // Table header
                    pdf.setFontSize(10);
                    pdf.text('EGID', margin + 5, yPosition);
                    pdf.text('Intensity', margin + 35, yPosition);
                    pdf.text('Damage', margin + 65, yPosition);
                    pdf.text('Method', margin + 85, yPosition);
                    yPosition += 7;
                    
                    // Table rows (limit to first 20 buildings)
                    pdf.setFont('helvetica', 'normal');
                    const buildingsToShow = extractionResults.buildingsAnalyzed.slice(0, 20);
                    
                    buildingsToShow.forEach(building => {
                        if (yPosition > 270) { // New page if needed
                            pdf.addPage();
                            yPosition = 30;
                        }
                        
                        const egid = building.buildingProperties?.EGID || building.EGID || 'N/A';
                        const intensity = building.intensity || 'N/A';
                        const damage = building.damage ? `${parseFloat(building.damage).toFixed(1)}%` : 'N/A';
                        const method = building.method || 'N/A';
                        
                        pdf.text(egid.toString().substr(0, 10), margin + 5, yPosition);
                        pdf.text(intensity.toString().substr(0, 12), margin + 35, yPosition);
                        pdf.text(damage, margin + 65, yPosition);
                        pdf.text(method.toString().substr(0, 10), margin + 85, yPosition);
                        yPosition += 6;
                    });
                    
                    if (extractionResults.buildingsAnalyzed.length > 20) {
                        yPosition += 5;
                        pdf.setFont('helvetica', 'italic');
                        pdf.text(`... and ${extractionResults.buildingsAnalyzed.length - 20} more buildings`, margin + 5, yPosition);
                    }
                }
            }
            
            // Save the PDF
            const filename = `spatial_analysis_results_simple_${now.toISOString().split('T')[0]}.pdf`;
            pdf.save(filename);
            
            console.log('✅ Simple text PDF export completed successfully');
            alert('Simple PDF exported successfully!');
            
        } catch (error) {
            console.error('❌ Simple PDF export failed:', error);
            alert('PDF export failed completely. Please check the console for details.');
        }
    }

    // ============================
    // MODULE EXPORTS
    // ============================

    // Export functions to global scope for use by other modules
    window.initializeAnalysisControls = initializeAnalysisControls;
    window.showAnalysisResultsModal = showAnalysisResultsModal;
    window.populateAnalysisSummary = populateAnalysisSummary;
    window.createAnalysisAGGridTable = createAnalysisAGGridTable;
    window.displayAnalysisResults = displayAnalysisResults;
    window.createDamageAnalysisGraphs = createDamageAnalysisGraphs;
    window.highlightAnalyzedBuildings = highlightAnalyzedBuildings;
    window.exportResultsToPDF = exportResultsToPDF;
    window.createSimpleTextPDF = createSimpleTextPDF;

    console.log('✅ Analysis & Visualization module loaded');

})();