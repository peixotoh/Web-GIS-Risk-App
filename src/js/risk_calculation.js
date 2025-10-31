// calculate the volume of a building
function volumeBuilding(area, numberOfFloors){
    if(area == null || numberOfFloors == null){
        area = 50;
        numberOfFloors = 2;
    } 
    const height = numberOfFloors * 2.7; // Assuming 2.7m per floor
    const volume = area * height;
    return volume;
}

// calculate construction year
function constructionYear(yearConstruction, periodConstructionCode){
    if(yearConstruction == null && periodConstructionCode == null){
        return Math.floor(Math.random() * (2000 - 1919 + 1)) + 1919; // generate a random year between 1919 and 2000
    } else if(yearConstruction == null && periodConstructionCode != null){
        switch(periodConstructionCode){
            case 8011:
                return 1900;
            case 8012:
                return 1932;
            case 8013:    
                return 1953;
            case 8014:
                return 1966;
            case 8015:    
                return 1976;
            case 8016:    
                return 1983;
            case 8017:    
                return 1988;
            case 8018:    
                return 1993;    
            case 8019:    
                return 1998;    
            case 8020:    
                return 2003;    
            case 8021:    
                return 2008;    
            case 8022:    
                return 2013;    
            case 8023:
                return 2015;    
            default:
                return Math.floor(Math.random() * (2000 - 1919 + 1)) + 1919; // generate a random year between 1919 and 2000
        }
    } else {
        return yearConstruction;
    }
}

// convert construction period code into years
function constructionPeriodCodeToYears(periodConstructionCode){
    console.log(`🔍 constructionPeriodCodeToYears called with: ${periodConstructionCode} (type: ${typeof periodConstructionCode})`);
    
    // Check if we received a valid number
    if (isNaN(periodConstructionCode)) {
        console.log(`❌ Invalid period code (not a number): ${periodConstructionCode}`);
        return 1950;
    }
    
    switch(periodConstructionCode){
        case 8011:
            console.log(`✅ Matched case 8011 → 1900`);
            return 1900;
        case 8012:
            console.log(`✅ Matched case 8012 → 1932`);
            return 1932;
        case 8013:    
            console.log(`✅ Matched case 8013 → 1953`);
            return 1953;
        case 8014:
            console.log(`✅ Matched case 8014 → 1966`);
            return 1966;
        case 8015:    
            console.log(`✅ Matched case 8015 → 1976`);
            return 1976;
        case 8016:    
            console.log(`✅ Matched case 8016 → 1983`);
            return 1983;
        case 8017:    
            console.log(`✅ Matched case 8017 → 1988`);
            return 1988;
        case 8018:    
            console.log(`✅ Matched case 8018 → 1993`);
            return 1993;    
        case 8019:    
            console.log(`✅ Matched case 8019 → 1998`);
            return 1998;    
        case 8020:    
            console.log(`✅ Matched case 8020 → 2003`);
            return 2003;    
        case 8021:    
            console.log(`✅ Matched case 8021 → 2008`);
            return 2008;    
        case 8022:    
            console.log(`✅ Matched case 8022 → 2013`);
            return 2013;    
        case 8023:
            console.log(`✅ Matched case 8023 → 2015`);
            return 2015;    
        default:
            console.log(`❌ No match found for period code ${periodConstructionCode}, using default 1950`);
            console.log(`📋 Available codes: 8011-8023, received: ${periodConstructionCode}`);
            return 1950;
    }
}

// CAT MODEL - Method 3 Monte Carlo Simulations
function method3CatModel(hazType, buildCost, spatialProb, numSimulations, gklas, intensity = null) {
    console.log(`🎲 ==================== CAT MODEL METHOD 3 CALLED ====================`);
    console.log(`🎯 Processing building with GKLAS: ${gklas} (${typeof gklas}) - Intensity: ${intensity}`);
    console.log(`🎯 Hazard type: ${hazType}`);
    console.log(`🎯 Build cost: ${buildCost}`);
    console.log(`🎯 Spatial probability (original): ${spatialProb}`);
    console.log(`🎯 Number of simulations: ${numSimulations}`);
    
    // CRITICAL: Check if this is a multi-building vs single-building scenario
    const currentMethod3ResultsLength = window.method3Results ? window.method3Results.length : 0;
    console.log(`🔍 Current Method 3 results length: ${currentMethod3ResultsLength} (indicates number of buildings processed so far)`);
    
    // Fix spatial probability if undefined
    if (spatialProb === undefined || spatialProb === null || isNaN(spatialProb)) {
        spatialProb = 0.5; // Default fallback value
        console.warn('⚠️ Spatial probability was undefined, using fallback value:', spatialProb);
    }
    
    console.log('Spatial probability (final):', spatialProb);
    console.log('Number of simulations:', numSimulations);
    console.log('Building class (GKLAS):', gklas);
    
    // Initialize global results array if not exists (accumulates all building results)
    if (!window.method3Results) {
        window.method3Results = [];
    }
    
    // Get vulnerability class from building data based on GKLAS
    let vulnerabilityClass = null; // No default - force proper detection
    console.log(`🔍 Method 3 - Building class lookup - GKLAS received: ${gklas} ${typeof gklas}`);
    
    if (typeof window.buildings === 'undefined') {
        console.error('❌ Method 3 - window.buildings is undefined!');
        return null;
    }
    
    // DEBUG: Log buildings array info on first call
    if (!window._method3BuildingsDebugLogged) {
        console.log(`🔍 Method 3 - Buildings array contains ${window.buildings.length} entries`);
        const vulnerabilityClasses = {};
        window.buildings.forEach(building => {
            const vClass = building.vulnerability_class;
            if (!vulnerabilityClasses[vClass]) vulnerabilityClasses[vClass] = [];
            vulnerabilityClasses[vClass].push({
                id: building.id,
                description: building.description,
                classes: building.classes
            });
        });
        console.log(`  - Vulnerability classes found:`, Object.keys(vulnerabilityClasses).sort());
        Object.keys(vulnerabilityClasses).forEach(vClass => {
            console.log(`    Class ${vClass}: ${vulnerabilityClasses[vClass].length} buildings`);
        });
        window._method3BuildingsDebugLogged = true;
    }
    
    if (!gklas) {
        console.error('❌ Method 3 - GKLAS is null/undefined!');
        return null;
    }
    
    console.log(`🔍 Method 3 - Searching for GKLAS: ${gklas} (${typeof gklas}) in buildings array...`);
    
    // DEBUG: Enhanced logging for class detection
    if (gklas == 1252 || gklas === '1252') {
        console.log(`🔍 DEBUG - GKLAS 1252 detected (Class 3 - Hangar/remise)`);
        const building1252 = window.buildings.find(b => b.classes && b.classes.includes(gklas.toString()));
        if (building1252) {
            console.log(`  ✅ Found: ${building1252.description} → Class ${building1252.vulnerability_class}`);
        } else {
            console.log(`  ❌ Not found in buildings array`);
        }
    }
    
    const buildingInfo = window.buildings.find(b => b.classes && b.classes.includes(gklas.toString()));
    console.log(`🔍 Method 3 - Found building info:`, buildingInfo ? `${buildingInfo.description} (classes: [${buildingInfo.classes.join(', ')}])` : 'null');
    
    if (buildingInfo && buildingInfo.vulnerability_class) {
        vulnerabilityClass = buildingInfo.vulnerability_class;
        console.log(`✅ Method 3 - GKLAS ${gklas} → ${buildingInfo.description} → Class ${vulnerabilityClass}`);
    } else {
        console.error(`❌ Method 3 - No building match found for GKLAS: ${gklas}`);
        return null;
    }
    
    console.log(`📊 Method 3 - Processing vulnerability class: ${vulnerabilityClass} (GKLAS: ${gklas})`);
    console.log(`📊 Current method3Results array size before processing: ${window.method3Results.length} points`);
    
    // Get vulnerability parameters from rockVulnerabilityDefaults
    const classKey = `class${vulnerabilityClass}`;
    let vulnParams = null;
    
    // Access vulnerability parameters from rockVulnerabilityChanged (user-modified values)
    if (typeof rockVulnerabilityChanged !== 'undefined' && rockVulnerabilityChanged[classKey]) {
        vulnParams = rockVulnerabilityChanged[classKey];
        console.log(`✅ Method 3 - Using ${classKey} parameters`);
    } else if (typeof rockVulnerabilityDefaults !== 'undefined' && rockVulnerabilityDefaults[classKey]) {
        vulnParams = rockVulnerabilityDefaults[classKey];
        console.log(`✅ Method 3 - Using ${classKey} defaults`);
    } else {
        console.warn(`⚠️ Method 3 - No vulnerability parameters found for ${classKey}, using hardcoded defaults`);
        vulnParams = {
            mean: { a: 30, b: 1030, c: 600 },
            max: { a: 100, b: 1000, c: 1000 },
            min: { a: 10, b: 860, c: 400 }
        };
    }
    
    // --- ROCKFALL Monte Carlo Simulations
    if (hazType === 'rock_fall' || hazType === 'rockfall') {
        console.log('🎲 Starting method 3  Monte Carlo simulations...');
        
        for (let i = 0; i < numSimulations; i++) {
            const logDetail = false; // i < 5; // Only log details for first 5 simulations - COMMENTED OUT FOR CLEANER OUTPUT
            
            // if (logDetail) console.log(`\n--- Simulation ${i + 1} ---`);
            
            // Generate random value for this simulation
            const randValue = Math.random();
            // if (logDetail) console.log(`Random value: ${randValue}`);
            
            // Random frequency according to power law (method 3)
            const frq = (randValue * (0.12 - 0.005)) + 0.005;
            // const frq = (randValue * (0.3 - 0.001)) + 0.001;
            // if (logDetail) console.log(`Frequency: ${frq}`);
            
            // Intensity for method 3
            const int_3 = Math.pow((frq / 0.8304), (-1/0.8));
            // if (logDetail) console.log(`Intensity: ${int_3}`);
            
            // Vulnerability calculation using triangular distribution
            let vuln_3;
            if (typeof vulnerability === 'function' && vulnParams.mean && vulnParams.min && vulnParams.max) {
                // if (logDetail) console.log(`Calling vulnerability(${int_3}, mean, min, max)`);
                // Use correct parameter order: intensity, mean, min, max (based on working pattern)
                vuln_3 = parseFloat(vulnerability(int_3, vulnParams.mean, vulnParams.max, vulnParams.min));
                // if (logDetail) console.log(`Vulnerability result: ${vuln_3}`);
            } else {
                console.warn('⚠️ Vulnerability function or parameters not available, using default');
                vuln_3 = 0.1; // fallback
            }
            
            // Ensure vulnerability is valid
            if (isNaN(vuln_3) || vuln_3 < 0) {
                // if (logDetail) console.warn(`Invalid vulnerability ${vuln_3}, setting to 0`);
                vuln_3 = 0;
            }
            
            // Calculate damage
            const dam_3 = frq * vuln_3 * buildCost * spatialProb;
            // if (logDetail) {
            //     console.log(`Damage calculation: ${frq} * ${vuln_3} * ${buildCost} * ${spatialProb} = ${dam_3}`);
            //     console.log(`Is damage valid? ${!isNaN(dam_3)}`);
            // }
            
            // Store simulation result
            window.method3Results.push({
                simulation: i + 1,
                frequency: frq,
                intensity: int_3,
                vulnerability: vuln_3,
                damage: dam_3
            });
            
            // if (logDetail) console.log(`Stored result for simulation ${i + 1}`);
        }
        
        // Sort results by damage
        window.method3Results.sort((a, b) => a.damage - b.damage);
        
        // Calculate statistics for THIS BUILDING ONLY (not all accumulated results)
        // Get only the results for this building (last numSimulations results)
        const thisBuildingResults = window.method3Results.slice(-numSimulations);
        const damages = thisBuildingResults.map(r => r.damage);
        const totalDamage = damages.reduce((sum, d) => sum + d, 0);
        const meanDamage = damages.length > 0 ? totalDamage / damages.length : 0;
        // Use reduce to avoid stack overflow with large arrays
        const minDamage = damages.length > 0 ? damages.reduce((min, val) => Math.min(min, val), Infinity) : 0;
        const maxDamage = damages.length > 0 ? damages.reduce((max, val) => Math.max(max, val), -Infinity) : 0;
        
        // Calculate standard deviation for this building only
        const variance = damages.length > 0 ? damages.reduce((sum, d) => sum + Math.pow(d - meanDamage, 2), 0) / damages.length : 0;
        const stdDev = Math.sqrt(variance);
        
        console.log('✅ Method 3 Results Summary (THIS BUILDING):');
        console.log(`  - Building processed: 1 (current building)`);
        console.log(`  - Simulations this building: ${numSimulations}`);
        console.log(`  - Points generated this building: ${numSimulations}`);
        console.log(`  - Total accumulated points in global array: ${window.method3Results.length}`);
        console.log(`  - Statistics calculated from THIS BUILDING: ${damages.length} points`);
        console.log(`  - Mean damage: ${meanDamage.toFixed(2)} CHF`);
        console.log(`  - Min damage: ${minDamage.toFixed(2)} CHF`);
        console.log(`  - Max damage: ${maxDamage.toFixed(2)} CHF`);
        console.log(`  - Std deviation: ${stdDev.toFixed(2)} CHF`);
        
        // Additional detailed analysis for Method 3
        const nonZeroDamages = damages.filter(d => d > 0);
        const zeroDamages = damages.filter(d => d === 0);
        console.log(`  - Non-zero damages: ${nonZeroDamages.length} points`);
        console.log(`  - Zero damages: ${zeroDamages.length} points`);
        console.log(`  - Verification: ${nonZeroDamages.length + zeroDamages.length} should equal ${numSimulations}`);
        
        return {
            numSimulations: numSimulations,
            meanDamage: meanDamage,
            minDamage: minDamage,
            maxDamage: maxDamage,
            stdDev: stdDev,
            results: thisBuildingResults // Return only this building's results, not all accumulated results
        };
    }
    
    console.warn('⚠️ Hazard type not supported for Method 3:', hazType);
    return null;
}

// CAT MODEL - Method 4 Monte Carlo Simulations
function method4CatModel(hazType, buildCost, spatialProb, numSimulations, gklas, returnPeriod, hazardIntensity) {
    console.log('🎲 Starting Method 4 - Monte Carlo Simulations ...');
    // console.log('Hazard type:', hazType);
    // console.log('Build cost:', buildCost);
    // console.log('Spatial probability (original):', spatialProb);
    // console.log('Return period:', returnPeriod);
    console.log('Hazard intensity:', hazardIntensity);
    console.log('Number of simulations:', numSimulations);
    
    // Fix spatial probability if undefined
    if (spatialProb === undefined || spatialProb === null || isNaN(spatialProb)) {
        spatialProb = 0.5; // Default fallback value
        console.warn('⚠️ Spatial probability was undefined, using fallback value:', spatialProb);
    }
    
    console.log('Spatial probability (final):', spatialProb);
    console.log('Number of simulations:', numSimulations);
    console.log('Building class (GKLAS):', gklas);
    
    // Initialize global results array if not exists (accumulates all building results)
    if (!window.method4Results) {
        window.method4Results = [];
    }
    
    // Get vulnerability class from building data based on GKLAS
    let vulnerabilityClass = 1; // default
    console.log('🔍 Method 4 - Building class lookup - GKLAS received:', gklas, typeof gklas);
    
    if (typeof window.buildings !== 'undefined' && gklas) {
        const buildingInfo = window.buildings.find(b => b.classes && b.classes.includes(gklas.toString()));
        console.log('🔍 Method 4 - Found building info:', buildingInfo ? `${buildingInfo.description} (classes: [${buildingInfo.classes.join(', ')}])` : 'null');
        
        if (buildingInfo && buildingInfo.vulnerability_class) {
            vulnerabilityClass = buildingInfo.vulnerability_class;
            console.log(`✅ Method 4 - Matched GKLAS ${gklas} → Building: "${buildingInfo.description}" → Vulnerability class: ${vulnerabilityClass}`);
        } else {
            console.warn(`⚠️ Method 4 - No building match found for GKLAS: ${gklas} (using default class 1)`);
        }
    } else {
        console.warn('⚠️ Method 4 - window.buildings not available or GKLAS is null');
    }
    
    console.log('Method 4 - Vulnerability class:', vulnerabilityClass);
    
    // Get vulnerability parameters from rockVulnerabilityChanged (user-modified values)
    const classKey = `class${vulnerabilityClass}`;
    let vulnParams = null;
    
    if (typeof rockVulnerabilityChanged !== 'undefined' && rockVulnerabilityChanged[classKey]) {
        vulnParams = rockVulnerabilityChanged[classKey];
        console.log(`✅ Method 4 - Using rockVulnerabilityChanged for ${classKey}`);
        console.log(`📊 Method 4 - ${classKey} Mean params:`, vulnParams.mean);
        console.log(`📊 Method 4 - ${classKey} Min params:`, vulnParams.min);
        console.log(`📊 Method 4 - ${classKey} Max params:`, vulnParams.max);
    } else if (typeof rockVulnerabilityDefaults !== 'undefined' && rockVulnerabilityDefaults[classKey]) {
        vulnParams = rockVulnerabilityDefaults[classKey];
        console.log(`✅ Method 4 - Using rockVulnerabilityDefaults for ${classKey} (changed values not available)`);
        console.log(`📊 Method 4 - ${classKey} Mean params:`, vulnParams.mean);
        console.log(`📊 Method 4 - ${classKey} Min params:`, vulnParams.min);
        console.log(`📊 Method 4 - ${classKey} Max params:`, vulnParams.max);
    } else {
        console.warn(`⚠️ Method 4 - No vulnerability parameters found for ${classKey}, using hardcoded defaults for class1`);
        vulnParams = {
            mean: { a: 30, b: 1030, c: 600 },
            max: { a: 100, b: 1000, c: 1000 },
            min: { a: 10, b: 860, c: 400 }
        };
    }
    
    // --- ROCKFALL Monte Carlo Simulations
    if (hazType === 'rock_fall' || hazType === 'rockfall') {
        console.log('🎲 Starting Method 4 Monte Carlo simulations...');
        
        // Check if we should skip simulation based on hazard intensity
        if (hazardIntensity === 'aucune_atteinte' || hazardIntensity === 'aucune atteinte' || hazardIntensity === 'no_hazard' || hazardIntensity === null || hazardIntensity === undefined) {
            console.log(`⚠️ Method 4 - Skipping simulations due to no hazard exposure (${hazardIntensity})`);
            
            // Return empty results structure
            return {
                numSimulations: 0,
                meanDamage: 0,
                minDamage: 0,
                maxDamage: 0,
                stdDev: 0,
                results: []
            };
        }
        
        console.log(`✅ Method 4 - Proceeding with simulations for hazard intensity: ${hazardIntensity}`);
        
        for (let i = 0; i < numSimulations; i++) {
            const logDetail = false; // i < 5; // Only log details for first 5 simulations - COMMENTED OUT FOR CLEANER OUTPUT
            
            // if (logDetail) console.log(`\n--- Method 4 Simulation ${i + 1} ---`);
            
            // Generate random value for this simulation (same range as Method 3)
            const randValue = Math.random();
            // if (logDetail) console.log(`Random value: ${randValue}`);
            
            // Random frequency according to power law (same as Method 3)
            const frq = (randValue * (0.1 - 0.005)) + 0.005;
            // if (logDetail) console.log(`Frequency: ${frq}`);
            
            // Method 4: Assign intensity according to hazard level (using correct probability logic)
            let int_4 = 0;
            
            // Map hazard intensity to Method 4 logic - follows functions_2.js probability rules
            if (hazardIntensity === 'faible' || hazardIntensity === 'low') {
                // Low danger level: 96.6% probability of getting intensity 30-100, otherwise 0
                if (randValue < 0.966) {
                    int_4 = (Math.random() * (30 - 10)) + 10;
                } else {
                    int_4 = 0;
                }
            } else if (hazardIntensity === 'moyenne' || hazardIntensity === 'mean') {
                // Mean danger level: only 2.4% probability (0.966 to 0.99) of getting intensity 100-300
                if (randValue < 0.99 && randValue >= 0.966) {
                    int_4 = (Math.random() * (300 - 30)) + 30;
                } else {
                    int_4 = 0;
                }
            } else if (hazardIntensity === 'forte' || hazardIntensity === 'high') {
                // High danger level: only 1% probability (>=0.99) of getting intensity 300-600
                if (randValue >= 0.99) {
                    int_4 = (Math.random() * (650 - 300)) + 300;
                } else {
                    int_4 = 0;
                }
            } else {
                // Default case - set to 0 for any other hazard intensity values
                int_4 = 0;
            }
            
            // if (logDetail) console.log(`Method 4 Intensity (hazard level ${hazardIntensity}): ${int_4}`);
            
            // Vulnerability calculation using triangular distribution (same as Method 3)
            let vuln_4;
            if (typeof vulnerability === 'function' && vulnParams.mean && vulnParams.min && vulnParams.max) {
                // if (logDetail) console.log(`Calling vulnerability(${int_4}, mean, max, min)`);
                // Use correct parameter order: intensity, mean, max, min
                vuln_4 = parseFloat(vulnerability(int_4, vulnParams.mean, vulnParams.max, vulnParams.min));
                // if (logDetail) console.log(`Vulnerability result: ${vuln_4}`);
            } else {
                console.warn('⚠️ Vulnerability function or parameters not available, using default');
                vuln_4 = 0.1; // fallback
            }
            
            // Ensure vulnerability is valid
            if (isNaN(vuln_4) || vuln_4 < 0) {
                // if (logDetail) console.warn(`Invalid vulnerability ${vuln_4}, setting to 0`);
                vuln_4 = 0;
            }
            
            // Calculate damage
            // const dam_4 = frq * vuln_4 * buildCost * spatialProb;
            const dam_4 = vuln_4 * buildCost * spatialProb;
            // if (logDetail) {
            //     console.log(`Damage calculation: ${frq} * ${vuln_4} * ${buildCost} * ${spatialProb} = ${dam_4}`);
            //     console.log(`Is damage valid? ${!isNaN(dam_4)}`);
            // }
            
            // Check for unusually high damage values (keep this active for debugging high damage issue)
            if (dam_4 > buildCost * 0.5) { // If damage > 50% of building cost, log it
                console.warn(`⚠️ High damage detected in Method 4 simulation ${i + 1}:`);
                console.warn(`  - Damage: ${dam_4.toFixed(2)} CHF (${((dam_4/buildCost)*100).toFixed(1)}% of building cost)`);
                console.warn(`  - Frequency: ${frq.toFixed(6)}`);
                console.warn(`  - Vulnerability: ${vuln_4.toFixed(3)}`);
                console.warn(`  - Build cost: ${buildCost.toFixed(2)} CHF`);
                console.warn(`  - Spatial prob: ${spatialProb.toFixed(6)}`);
                console.warn(`  - Intensity: ${int_4.toFixed(1)} kJ`);
                console.warn(`  - Hazard level: ${hazardIntensity}`);
            }
            
            // Store simulation result
            window.method4Results.push({
                simulation: i + 1,
                frequency: frq,
                intensity: int_4,
                vulnerability: vuln_4,
                damage: dam_4,
                hazardIntensity: hazardIntensity,
                returnPeriod: returnPeriod
            });
            
            // if (logDetail) console.log(`Stored Method 4 result for simulation ${i + 1}`);
        }
        
        // Sort results by damage (ALL buildings - this is correct!)
        window.method4Results.sort((a, b) => a.damage - b.damage);
        
        // Calculate statistics from ALL accumulated Method 4 results
        const damages = window.method4Results.map(r => r.damage);
        const totalDamage = damages.reduce((sum, d) => sum + d, 0);
        const meanDamage = damages.length > 0 ? totalDamage / damages.length : 0; // Use actual array length, not just current building simulations
        // Use reduce to avoid stack overflow with large arrays
        const minDamage = damages.length > 0 ? damages.reduce((min, val) => Math.min(min, val), Infinity) : 0;
        const maxDamage = damages.length > 0 ? damages.reduce((max, val) => Math.max(max, val), -Infinity) : 0;
        
        // Calculate standard deviation using actual array length
        const variance = damages.length > 0 ? damages.reduce((sum, d) => sum + Math.pow(d - meanDamage, 2), 0) / damages.length : 0;
        const stdDev = Math.sqrt(variance);
        
        // Detailed Method 4 analysis by intensity (ALL buildings results)
        const intensityAnalysis = {};
        window.method4Results.forEach(result => {
            const intensity = result.intensity;
            const hazardLevel = result.hazardIntensity;
            
            if (!intensityAnalysis[hazardLevel]) {
                intensityAnalysis[hazardLevel] = {
                    totalPoints: 0,
                    nonZeroIntensity: 0,
                    zeroIntensity: 0,
                    maxIntensity: 0,
                    minIntensity: Infinity,
                    damages: []
                };
            }
            
            intensityAnalysis[hazardLevel].totalPoints++;
            intensityAnalysis[hazardLevel].damages.push(result.damage);
            
            if (intensity > 0) {
                intensityAnalysis[hazardLevel].nonZeroIntensity++;
                intensityAnalysis[hazardLevel].maxIntensity = Math.max(intensityAnalysis[hazardLevel].maxIntensity, intensity);
                intensityAnalysis[hazardLevel].minIntensity = Math.min(intensityAnalysis[hazardLevel].minIntensity, intensity);
            } else {
                intensityAnalysis[hazardLevel].zeroIntensity++;
            }
        });
        
        console.log('✅ Method 4 Results Summary (ALL Buildings Combined):');
        console.log(`  - Simulations requested for this building: ${numSimulations}`);
        console.log(`  - Total Method 4 points (all buildings): ${window.method4Results.length}`);
        console.log(`  - Current building hazard intensity: ${hazardIntensity}`);
        console.log(`  - Mean damage: ${meanDamage.toFixed(2)} CHF`);
        console.log(`  - Min damage: ${minDamage.toFixed(2)} CHF`);
        console.log(`  - Max damage: ${maxDamage.toFixed(2)} CHF`);
        console.log(`  - Std deviation: ${stdDev.toFixed(2)} CHF`);
        
        console.log('🔍 Method 4 Intensity Analysis:');
        Object.keys(intensityAnalysis).forEach(level => {
            const analysis = intensityAnalysis[level];
            const maxDamage = Math.max(...analysis.damages);
            const minDamage = Math.min(...analysis.damages);
            console.log(`  ${level}:`);
            console.log(`    - Total points: ${analysis.totalPoints}`);
            console.log(`    - Non-zero intensity: ${analysis.nonZeroIntensity} points`);
            console.log(`    - Zero intensity: ${analysis.zeroIntensity} points`);
            console.log(`    - Expected non-zero for ${level}: ${getExpectedNonZeroPoints(level, numSimulations)}`);
            if (analysis.nonZeroIntensity > 0) {
                console.log(`    - Intensity range: ${analysis.minIntensity.toFixed(1)} - ${analysis.maxIntensity.toFixed(1)} kJ`);
                console.log(`    - Expected intensity range: ${getExpectedIntensityRange(level)}`);
            }
            console.log(`    - Damage range: ${minDamage.toFixed(2)} - ${maxDamage.toFixed(2)} CHF`);
        });
        
        // Helper functions for expected values
        function getExpectedNonZeroPoints(level, totalSims) {
            switch(level) {
                case 'aucune atteinte': 
                case 'aucune_atteinte': 
                case 'no_hazard': return 0;
                case 'faible': 
                case 'low': return Math.round(totalSims * 0.966);
                case 'moyenne': 
                case 'mean': return Math.round(totalSims * 0.024);
                case 'forte': 
                case 'high': return Math.round(totalSims * 0.01);
                default: return 'unknown';
            }
        }
        
        function getExpectedIntensityRange(level) {
            switch(level) {
                case 'aucune atteinte': return '0';
                case 'faible': return '10-30 kJ';
                case 'moyenne': return '30-300 kJ';
                case 'forte': return '300-650 kJ';
                default: return 'unknown';
            }
        }
        
        return {
            numSimulations: numSimulations,
            meanDamage: meanDamage,
            minDamage: minDamage,
            maxDamage: maxDamage,
            stdDev: stdDev,
            results: window.method4Results.slice(-numSimulations) // Return just this building's results
        };
    }
    
    console.warn('⚠️ Hazard type not supported for Method 4:', hazType);
    return null;
}


// CAT MODEL - Method 5 & 6 Monte Carlo Simulations
function method5And6CatModel(hazType, buildCost, spatialProb, numSimulations, gklas, returnPeriod, hazardLevel = null) {
    console.log('🎲 Starting Method 5 & 6 - Monte Carlo Simulations (Return Period Based)...');
    console.log('Return period:', returnPeriod);
    console.log('Hazard level:', hazardLevel);
    console.log('Number of simulations:', numSimulations);
    
    // Fix spatial probability if undefined
    if (spatialProb === undefined || spatialProb === null || isNaN(spatialProb)) {
        spatialProb = 0.5; // Default fallback value
        console.warn('⚠️ Spatial probability was undefined, using fallback value:', spatialProb);
    }
    
    console.log('Spatial probability (final):', spatialProb);
    console.log('Number of simulations:', numSimulations);
    console.log('Building class (GKLAS):', gklas);
    
    // Initialize global results arrays if not exists (accumulates all building results)
    if (!window.method5Results) {
        window.method5Results = [];
    }
    if (!window.method6Results) {
        window.method6Results = [];
    }
    
    // Get vulnerability class from building data based on GKLAS
    let vulnerabilityClass = 0.5; // default
    console.log('🔍 Method 5 & 6 - Building class lookup - GKLAS received:', gklas, typeof gklas);
    
    if (typeof window.buildings !== 'undefined' && gklas) {
        const buildingInfo = window.buildings.find(b => b.classes && b.classes.includes(gklas.toString()));
        console.log('🔍 Method 5 & 6 - Found building info:', buildingInfo ? `${buildingInfo.description} (classes: [${buildingInfo.classes.join(', ')}])` : 'null');
        
        if (buildingInfo && buildingInfo.vulnerability_class) {
            vulnerabilityClass = buildingInfo.vulnerability_class;
            console.log(`✅ Method 5 & 6 - Matched GKLAS ${gklas} → Building: "${buildingInfo.description}" → Vulnerability class: ${vulnerabilityClass}`);
        } else {
            console.warn(`⚠️ Method 5 & 6 - No building match found for GKLAS: ${gklas} (using default class 1)`);
        }
    } else {
        console.warn('⚠️ Method 5 & 6 - window.buildings not available or GKLAS is null');
    }
    
    console.log('Method 5 & 6 - Vulnerability class:', vulnerabilityClass);
    
    // Get vulnerability parameters from rockVulnerabilityChanged (user-modified values)
    const classKey = `class${vulnerabilityClass}`;
    let vulnParams = null;
    
    if (typeof rockVulnerabilityChanged !== 'undefined' && rockVulnerabilityChanged[classKey]) {
        vulnParams = rockVulnerabilityChanged[classKey];
        console.log(`✅ Method 5 & 6 - Using rockVulnerabilityChanged for ${classKey}`);
        console.log(`📊 Method 5 & 6 - ${classKey} Mean params:`, vulnParams.mean);
        console.log(`📊 Method 5 & 6 - ${classKey} Min params:`, vulnParams.min);
        console.log(`📊 Method 5 & 6 - ${classKey} Max params:`, vulnParams.max);
    } else if (typeof rockVulnerabilityDefaults !== 'undefined' && rockVulnerabilityDefaults[classKey]) {
        vulnParams = rockVulnerabilityDefaults[classKey];
        console.log(`✅ Method 5 & 6 - Using rockVulnerabilityDefaults for ${classKey} (changed values not available)`);
        console.log(`📊 Method 5 & 6 - ${classKey} Mean params:`, vulnParams.mean);
        console.log(`📊 Method 5 & 6 - ${classKey} Min params:`, vulnParams.min);
        console.log(`📊 Method 5 & 6 - ${classKey} Max params:`, vulnParams.max);
    } else {
        console.warn(`⚠️ Method 5 & 6 - No vulnerability parameters found for ${classKey}, using hardcoded defaults for class1`);
        vulnParams = {
            mean: { a: 30, b: 1030, c: 600 },
            max: { a: 100, b: 1000, c: 1000 },
            min: { a: 10, b: 860, c: 400 }
        };
    }
    
    // --- ROCKFALL Monte Carlo Simulations 
    if (hazType === 'rock_fall' || hazType === 'rockfall') {
        console.log('🎲 Starting Method 5 & 6 Monte Carlo simulations for rockfall...');
        
        // Check if we should simulate based on hazard level
        // For Method 5, skip simulation if hazard level indicates no hazard exposure
        if (hazardLevel && (hazardLevel === 'aucune_atteinte' || hazardLevel === 'aucune atteinte' || hazardLevel === 'no_hazard')) {
            console.log(`⚠️ Method 5 & 6 - Skipping simulations for return period ${returnPeriod} due to no hazard exposure (${hazardLevel})`);
            
            // Return empty results structure
            return {
                method5: {
                    numSimulations: 0,
                    meanDamage: 0,
                    minDamage: 0,
                    maxDamage: 0,
                    stdDev: 0,
                    results: []
                },
                method6: null
            };
        }
        
        console.log(`✅ Method 5 & 6 - Proceeding with simulations for return period ${returnPeriod} with hazard level: ${hazardLevel || 'not specified'}`);
        
        for (let i = 0; i < numSimulations; i++) {
            const logDetail = false; // i < 5; // Only log details for first 5 simulations
            
            // Generate random value for this simulation
            const randValue = Math.random();
            
            // ===== METHOD 5: Generate frequency and intensity based on return period =====
            let frq = 0;
            let int_5 = 0;
            let int_6 = 0;
            
            // Check return period and random value to determine frequency
            if (returnPeriod == 30) {
                if (randValue < 0.966) {
                    frq = (Math.random() * (0.12 - 0.033)) + 0.033;
                    // Calculate intensity based on power law distribution (using rockfall formula)
                    int_5 = Math.pow((frq / 0.8304), (-1/0.8));
                    
                    // Method 6: Check hazard level and calculate intensity
                    if (hazardLevel) {
                        if (hazardLevel === 'low' || hazardLevel === 'faible') {
                            int_6 = (Math.random() * (30 - 10)) + 10;
                        } else if (hazardLevel === 'mean' || hazardLevel === 'moyenne') {
                            int_6 = (Math.random() * (300 - 30)) + 30;
                        } else if (hazardLevel === 'high' || hazardLevel === 'forte') {
                            int_6 = (Math.random() * (650 - 300)) + 300;
                        }
                    }
                } else {
                    frq = 0;
                    int_5 = 0;
                    int_6 = 0;
                }
            } else if (returnPeriod == 100) {
                if (randValue < 0.99 && randValue >= 0.966) {
                    frq = (Math.random() * (0.03 - 0.0033)) + 0.0033;
                    int_5 = Math.pow((frq / 0.8304), (-1/0.8));
                    // int_5 = Math.pow((frq / 291.03), (-1/1.984));
                    
                    // Method 6: Check hazard level and calculate intensity
                    if (hazardLevel) {
                        if (hazardLevel === 'low' || hazardLevel === 'faible') {
                            int_6 = (Math.random() * (30 - 10)) + 10;
                        } else if (hazardLevel === 'mean' || hazardLevel === 'moyenne') {
                            int_6 = (Math.random() * (300 - 30)) + 30;
                        } else if (hazardLevel === 'high' || hazardLevel === 'forte') {
                            int_6 = (Math.random() * (650 - 300)) + 300;
                        }
                    }
                } else {
                    frq = 0;
                    int_5 = 0;
                    int_6 = 0;
                }
            } else if (returnPeriod == 300) {
                if (randValue >= 0.99) {
                    frq = (Math.random() * (0.0033 - 0.005)) + 0.005;
                    int_5 = Math.pow((frq / 0.8304), (-1/0.8));
                    
                    // Method 6: Check hazard level and calculate intensity
                    if (hazardLevel) {
                        if (hazardLevel === 'low' || hazardLevel === 'faible') {
                            int_6 = (Math.random() * (30 - 10)) + 10;
                        } else if (hazardLevel === 'mean' || hazardLevel === 'moyenne') {
                            int_6 = (Math.random() * (300 - 30)) + 30;
                        } else if (hazardLevel === 'high' || hazardLevel === 'forte') {
                            int_6 = (Math.random() * (650 - 300)) + 300;
                        }
                    }
                } else {
                    frq = 0;
                    int_5 = 0;
                    int_6 = 0;
                }
            } 
            // else {
            //     // Default case for other return periods
            //     frq = (Math.random() * (0.12 - 0.005)) + 0.005;
            //     int_5 = Math.pow((frq / 291.03), (-1/1.984));
                
            //     // Method 6: Check hazard level and calculate intensity
            //     if (hazardLevel) {
            //         if (hazardLevel === 'low' || hazardLevel === 'faible') {
            //             int_6 = (Math.random() * (100 - 30)) + 30;
            //         } else if (hazardLevel === 'mean' || hazardLevel === 'moyenne') {
            //             int_6 = (Math.random() * (300 - 100)) + 100;
            //         } else if (hazardLevel === 'high' || hazardLevel === 'forte') {
            //             int_6 = (Math.random() * (600 - 300)) + 300;
            //         }
            //     }
            // }
            
            // Vulnerability calculation for Method 5
            let vuln_5;
            if (typeof vulnerability === 'function' && vulnParams.mean && vulnParams.min && vulnParams.max) {
                vuln_5 = parseFloat(vulnerability(int_5, vulnParams.mean, vulnParams.max, vulnParams.min));
            } else {
                console.warn('⚠️ Vulnerability function or parameters not available, using default');
                vuln_5 = 0.1; // fallback
            }
            
            // Ensure vulnerability is valid
            if (isNaN(vuln_5) || vuln_5 < 0) {
                vuln_5 = 0;
            }
            
            // Calculate damage for Method 5
            const dam_5 = vuln_5 * buildCost * spatialProb;
            
            // Store Method 5 simulation result
            window.method5Results.push({
                simulation: i + 1,
                frequency: frq,
                intensity: int_5,
                vulnerability: vuln_5,
                damage: dam_5,
                returnPeriod: returnPeriod
            });
            
            // Method 6 calculations (only if hazard level is provided)
            if (hazardLevel) {
                // Vulnerability calculation for Method 6
                let vuln_6;
                if (typeof vulnerability === 'function' && vulnParams.mean && vulnParams.min && vulnParams.max) {
                    vuln_6 = parseFloat(vulnerability(int_6, vulnParams.mean, vulnParams.max, vulnParams.min));
                } else {
                    console.warn('⚠️ Vulnerability function or parameters not available, using default');
                    vuln_6 = 0.1; // fallback
                }
                
                // Ensure vulnerability is valid
                if (isNaN(vuln_6) || vuln_6 < 0) {
                    vuln_6 = 0;
                }
                
                // Calculate damage for Method 6
                const dam_6 = vuln_6 * buildCost * spatialProb;
                
                // Store Method 6 simulation result
                window.method6Results.push({
                    simulation: i + 1,
                    frequency: frq,
                    intensity: int_6,
                    vulnerability: vuln_6,
                    damage: dam_6,
                    returnPeriod: returnPeriod,
                    hazardLevel: hazardLevel
                });
            }
        }
        
        // Sort results by damage for both methods
        window.method5Results.sort((a, b) => a.damage - b.damage);
        if (window.method6Results.length > 0) {
            window.method6Results.sort((a, b) => a.damage - b.damage);
        }
        
        // Calculate Method 5 statistics
        const damages5 = window.method5Results.map(r => r.damage);
        const totalDamage5 = damages5.reduce((sum, d) => sum + d, 0);
        const meanDamage5 = damages5.length > 0 ? totalDamage5 / damages5.length : 0;
        const minDamage5 = damages5.length > 0 ? damages5.reduce((min, val) => Math.min(min, val), Infinity) : 0;
        const maxDamage5 = damages5.length > 0 ? damages5.reduce((max, val) => Math.max(max, val), -Infinity) : 0;
        const variance5 = damages5.length > 0 ? damages5.reduce((sum, d) => sum + Math.pow(d - meanDamage5, 2), 0) / damages5.length : 0;
        const stdDev5 = Math.sqrt(variance5);
        
        console.log('✅ Method 5 Results Summary (ALL Buildings Combined):');
        console.log(`  - Simulations requested for this building: ${numSimulations}`);
        console.log(`  - Total Method 5 points (all buildings): ${window.method5Results.length}`);
        console.log(`  - Current building return period: ${returnPeriod}`);
        console.log(`  - Mean damage: ${meanDamage5.toFixed(2)} CHF`);
        console.log(`  - Min damage: ${minDamage5.toFixed(2)} CHF`);
        console.log(`  - Max damage: ${maxDamage5.toFixed(2)} CHF`);
        console.log(`  - Std deviation: ${stdDev5.toFixed(2)} CHF`);
        
        // Calculate Method 6 statistics if applicable
        let method6Stats = null;
        if (hazardLevel && window.method6Results.length > 0) {
            const damages6 = window.method6Results.map(r => r.damage);
            const totalDamage6 = damages6.reduce((sum, d) => sum + d, 0);
            const meanDamage6 = damages6.length > 0 ? totalDamage6 / damages6.length : 0;
            const minDamage6 = damages6.length > 0 ? damages6.reduce((min, val) => Math.min(min, val), Infinity) : 0;
            const maxDamage6 = damages6.length > 0 ? damages6.reduce((max, val) => Math.max(max, val), -Infinity) : 0;
            const variance6 = damages6.length > 0 ? damages6.reduce((sum, d) => sum + Math.pow(d - meanDamage6, 2), 0) / damages6.length : 0;
            const stdDev6 = Math.sqrt(variance6);
            
            method6Stats = {
                numSimulations: numSimulations,
                meanDamage: meanDamage6,
                minDamage: minDamage6,
                maxDamage: maxDamage6,
                stdDev: stdDev6,
                results: window.method6Results.slice(-numSimulations)
            };
            
            console.log('✅ Method 6 Results Summary (ALL Buildings Combined):');
            console.log(`  - Simulations requested for this building: ${numSimulations}`);
            console.log(`  - Total Method 6 points (all buildings): ${window.method6Results.length}`);
            console.log(`  - Current building return period: ${returnPeriod}`);
            console.log(`  - Current building hazard level: ${hazardLevel}`);
            console.log(`  - Mean damage: ${meanDamage6.toFixed(2)} CHF`);
            console.log(`  - Min damage: ${minDamage6.toFixed(2)} CHF`);
            console.log(`  - Max damage: ${maxDamage6.toFixed(2)} CHF`);
            console.log(`  - Std deviation: ${stdDev6.toFixed(2)} CHF`);
        }
        
        return {
            method5: {
                numSimulations: numSimulations,
                meanDamage: meanDamage5,
                minDamage: minDamage5,
                maxDamage: maxDamage5,
                stdDev: stdDev5,
                results: window.method5Results.slice(-numSimulations)
            },
            method6: method6Stats
        };
    }
    
    console.warn('⚠️ Hazard type not supported for Method 5 & 6:', hazType);
    return null;
}


// Make functions available globally
window.volumeBuilding = volumeBuilding;
window.constructionYear = constructionYear;
window.constructionPeriodCodeToYears = constructionPeriodCodeToYears;
window.method3CatModel = method3CatModel;
window.method4CatModel = method4CatModel;
window.method5And6CatModel = method5And6CatModel;
