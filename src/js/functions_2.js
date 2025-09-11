// --- mean value of an array
function meanValue(array){
    if(array.length == 0){
        return NaN;
    }
    // --- reduce method iterate each element and accumulates it in single value
    const sum = array.reduce((acc, val) => acc + val, 0);
    return sum / array.length;
}

// --- sum value of an array
function sumValue(array){
    if(array.length == 0){
        return NaN;
    }
    // --- reduce method iterate each element and accumulates it in single value
    const sum = array.reduce((acc, val) => acc + val, 0);
    return sum;
}


// --- vulnerability function dividing by a single date
function vuln(year){
    if (year <= 1950){
        return 0.7;
    }
    if (year > 1950){
        return 0.3
    }        
}

// --- function to calculate the building cost based on ty of building
function builCost(cat, vul, houses){
    if(cat == 1020){
        if(houses == null){
            return 650000
        } else{
            return 650000 * houses;
        }
    }
    if(cat == 1080){
        if(houses == null){
            return 600000
        } else{
            return 600000 * houses;
        }
    }
    if(cat == 1030){
        return vul * 765;
    }
    if(cat == 1040){
        return vul * 550;
    } 
    if(cat == 1060){
        return vul * 180;
    }
}

// ---- hazard probability in function of return period (valdorisk method)
function hazardProb(subp, rp){
    if(subp === 'rock_fall')
        if(rp === 30){
            return (1/30)-(1/100)
        }
        if(rp === 100){
            return (1/100)-(1/300);
        }
        if(rp === 300){
            return 1/300;
        }
    
    if(subp === 'debris_flow')
        if(rp === 10){
            return (1/10)-(1/30);
        }
        if(rp === 30){
            return (1/30)-(1/100);
        }
        if(rp === 100){
            return (1/100)-(1/300);
        }
        if(rp === 300){
            //return (1/300)-(1/1000);
            return 1/300;
        }
        if(rp === 1000){
            return 1/1000;
        }

    if(subp === 'flooding')
        if(rp === 5){
            return (1/5)-(1/20);
        }
        if(rp === 20){
            return (1/20)-(1/30);
        }
        if(rp === 30){
            return (1/30)-(1/100);
        }
        if(rp === 100){
            return (1/100)-(1/300);
        }
        if(rp === 300){
            return 1/300;
        }

} 


// --- vulnerability function valdorisk - add also tyoe of building
// - insert type of building
function vulnValdorisk(int, hazType, categ){ 
    if(categ == 1060){
        if(hazType == 'rock_fall'){
            if(int == 'high'){
                return 0.6;
            }
            if (int == 'mean'){
                return 0.3;
            }
            if (int == 'low'){
                return 0.01;
            }
        }
        if(hazType == 'debris_flow'){
            if(int == 'high'){
                return 1;
            }
            if (int == 'mean'){
                return 0.3;
            }
            if (int == 'low'){
                return 0.1;
            }
        }
        if(hazType == 'flooding'){
            if(int == 'high'){
                return 0.5;
            }
            if (int == 'mean'){
                return 0.3;
            }
            if (int == 'low'){
                return 0.1;
            }
        } 
    } else {
        if(hazType == 'rock_fall'){
            if(int == 'high'){
                return 0.3;
            }
            if (int == 'mean'){
                return 0.1;
            }
            if (int == 'low'){
                return 0.01;
            }
        }
        if(hazType == 'debris_flow'){
            if(int == 'high'){
                return 0.6;
            }
            if (int == 'mean'){
                return 0.3;
            }
            if (int == 'low'){
                return 0.1;
            }
        }
        if(hazType == 'flooding'){
            if(int == 'high'){
                return 0.5;
            }
            if (int == 'mean'){
                return 0.3;
            }
            if (int == 'low'){
                return 0.1;
            }
        }  
    }
    
          
}

// --- hazard probability function valdorisk
function spatialHazardProbValdorisk(rp, hazType){
    if(hazType == 'rock_fall'){
        if(rp == 30){
            return 0.01;
        }
        if(rp == 100){
            return 0.03;
        }
        if(rp==300){
            return 0.05;
        }
    }
    if(hazType == 'debris_flow'){
        if(rp == 30){
            return 0.8;
        }
        if(rp == 100){
            return 0.6;
        }
        if(rp==300){
            return 0.8;
        }
        if(rp==1000){
            return 0.8;
        }
    }
    if(hazType == 'flooding'){
        if(rp == 5){
            return 0.7;
        }
        if(rp == 20){
            return 0.7;
        }
        if(rp == 30){
            return 0.9;
        }
        if(rp == 100){
            return 0.7;
        }
        if(rp==300){
            return 0.9;
        }
        if(rp==1000){
            return 0.8;
        }
    }
    
}

// --- vulnerability function based on Borter & Bart, 1999
function vulBorterBart(hazarName, year, danger){
    if(hazarName == 'rock_fall'){
        // GK0
        if(year <= 1920){
            if(danger == 'low'){
                return 0.2;
            }
            if(danger == 'mean'){
                return 1;
            }
            if(danger == 'high'){
                return 1;
            }
        }
        // GK1
        if(year <= 1950){
            if(danger == 'low'){
                return 0.15;
            }
            if(danger == 'mean'){
                return 0.5;
            }
            if(danger == 'high'){
                return 0.9;
            }
        }
        // GK3
        if(year <= 1970){
            if(danger == 'low'){
                return 0.08;
            }
            if(danger == 'mean'){
                return 0.25;
            }
            if(danger == 'high'){
                return 0.7;
            }
        }
        // GK4
        if(year > 1970){
            if(danger == 'low'){
                return 0.05;
            }
            if(danger == 'mean'){
                return 0.2;
            }
            if(danger == 'high'){
                return 0.5;
            }
        }
    }
    if(hazarName == 'debris_flow'){
        // Masonry 1 floor
        if(year <= 1920){
            if(danger == 'low'){
                return 0.2;
            }
            if(danger == 'mean'){
                return 0.8;
            }
            if(danger == 'high'){
                return 1;
            }
        }
        // Masonry 2 floor
        if(year <= 1950){
            if(danger == 'low'){
                return 0.05;
            }
            if(danger == 'mean'){
                return 0.5;
            }
            if(danger == 'high'){
                return 0.8;
            }
        }
        // Masonry 2 floor
        if(year <= 1970){
            if(danger == 'low'){
                return 0.05;
            }
            if(danger == 'mean'){
                return 0.3;
            }
            if(danger == 'high'){
                return 0.6;
            }
        }
        // Reinforced concrete 3 floors
        if(year > 1970){
            if(danger == 'low'){
                return 0.05;
            }
            if(danger == 'mean'){
                return 0.2;
            }
            if(danger == 'high'){
                return 0.5;
            }
        }
    } else {
        // if there is not year generate random vulnerability [0-1]    
        return Math.random();
    }
    
}

// ====================TRINGULAR FUNCTIONS ==================

// ---- repartition triangle function
function repartTriangle(x, par) {
    if (x < par.a) {
      return 0;
    } else if (x >= par.a && x <= par.c) {
      return Math.pow((x - par.a), 2) / ((par.c - par.a) * (par.b - par.a));
    } else if (x > par.c && x <= par.b) {
      return 1 - Math.pow((par.b - x), 2) / ((par.b - par.c) * (par.b - par.a));
    } else if (x > par.b) {
      return 1;
    }
  }
  
  // ---- limit function
  function initLimit(param) {
    return (param.c - param.a) / (param.b - param.a);
  }
  
  // ---- triangle simulation function
  function simulTriangle(p, par) {
    if (p < par.limit) {
        return par.a + Math.sqrt(p * (par.c - par.a) * (par.b - par.a));
    } else {
        return par.b - Math.sqrt((1 - p) * (par.b - par.c) * (par.b - par.a));
    }
  }
  
  // ---- vulnerability function
  function vulnerability(x, pa, p_min, p_max) {
    let p = {
        c: repartTriangle(x, pa),
        a: repartTriangle(x, p_min),
        b: repartTriangle(x, p_max)
    };
    p.limit = initLimit(p);
    let proba = Math.random();
    return simulTriangle(proba, p);
  }
  
// ==================== DONWLOAD AND UPLOAD VULNERABILITY VALUES ==================

  // ---- download JSON data function
  function downloadJSON(data, filename) {
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ----  file upload function
function handleUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        newVulnData = JSON.parse(contents);
        // Use the uploaded data, for example:
        console.log('Uploaded newVulnData:', newVulnData);
    };
    reader.readAsText(file);
}



// ==================== MONTE CARLO SIMULATION ==================

//--- function to random spatial probability according to type of hazard
/*
function randomSpatialProb(hazType){
    let spProb;
    if(hazType == 'rock_fall'){
        spProb = ((Math.random() * (0.05 - 0.01)) + (0.01));
    }
    if(hazType == 'debris_flow'){
        spProb = ((Math.random() * (0.6 - 0.8)) + (0.6));
    }
    if(hazType == 'flooding'){
        spProb = ((Math.random() * (0.7 - 0.9)) + (0.7));
    }
    return spProb;
}
*/
// --- function to assign average spatial probability for each hazard type
function randomSpatialProb(hazType){
    let spProb;
    if(hazType == 'rock_fall'){
        spProb = 0.03;
    }
    if(hazType == 'debris_flow'){
        spProb = 0.7;
    }
    if(hazType == 'flooding'){
        spProb = 0.8;
    }
    return spProb;
}

/* -- power law distribution to generate random frequence, calculate the intensity and
vulnerability values n times. method 1 --- */

/* method 3 & 4 - random frequency in total interval & vulnerability by power law and by danger level */
function method_3_4_RandFreqPowerLawMatrix(hazType, buildCost, spProb, dangerLevel, randV){   
    console.log('== method 3 & 4 function ==');
    /*
    console.log('hazard type : ', hazType);
    console.log('build cost : ', buildCost);
    console.log('spatial prob : ', spProb);
    */
    // --- variables for frequency and vulnerability
    let int_3, vuln_3, dam_3;
    let vuln_4, int_4, dam_4;
    let frq;

    // --- random value
    randValue = randV;
    console.log('random value for method 3 and 4: ', randValue);
       
    // --- ROCKFALL
    // -- assign intensity according to danger level for method 4
    if(hazType == 'rock_fall'){
        // --- random value of frequency according to power law (method 3)
        //frq = ((Math.random() * 0.33) + (0.000901));
        frq = ((randValue * (0.3 - 0.001)) + (0.001));
        //frq = ((randValue * 0.33) + (0.000901));

        // --- intensity for method 3
        int_3 = Math.pow((frq / 291.03), (-1/1.984)); 
        //int_3 = Math.pow((frq / 0.6567), (-1/0.772)); 

        // --- random intensity within intervals according to danger level (method 4)
        if(dangerLevel == 'low'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.966){
                //int_4 = (randValue * (100 - 30)) + 30;             
                int_4 = (Math.random() * (100 - 30)) + 30;                
            } else {
                // --- Method 4 random intensity within the interval of return period (30 to 100)
                int_4 = 0;
            } 
        }
        if(dangerLevel == 'mean'){
            // --- assign 0 or random intensity according to frequency value
            if(randValue < 0.99 && randValue >= 0.966){
                // --- Method 4 random intensity within the interval of return period (100 to 300)
                //int_4 = (randValue * (300 - 100)) + 100;
                int_4 = (Math.random() * (300 - 100)) + 100;
            } else {
                int_4 = 0;
            }
        }
        if(dangerLevel == 'high'){
            // --- assign 0 or random intensity according to frequency value
            if (randValue >= 0.99 ){
                // --- Method 4 random intensity within the interval of return period (300 to 600)
                //int_4 = (randValue * (600 - 300)) + 300;
                int_4 = (Math.random() * (600 - 300)) + 300;
            } else {
                int_4 = 0;
            }             
        }        
        
        if(newVulnData){
            vuln_3 = parseFloat(vulnerability(int_3, newVulnData.rockfall.mean, newVulnData.rockfall.max, newVulnData.rockfall.min))
            vuln_4 = parseFloat(vulnerability(int_4, newVulnData.rockfall.mean, newVulnData.rockfall.max, newVulnData.rockfall.min))
        } else {
            vuln_3 = parseFloat(vulnerability(int_3, vulnData.rockfall.mean, vulnData.rockfall.max, vulnData.rockfall.min))
            vuln_4 = parseFloat(vulnerability(int_4, vulnData.rockfall.mean, vulnData.rockfall.max, vulnData.rockfall.min))
        }   
  
        dam_3 = frq * vuln_3 * buildCost * spProb; // 0.8=exposure
        dam_4 = frq * vuln_4 * buildCost * spProb; 
        
        console.log('method 3 frequency values: ', frq);
        console.log('method 4 int_4', int_4);
        
        /*
        console.log('method 3 intensity values: ',int_3);
        console.log('method 3 vulnerability values: ',vuln_3); 
        console.log('method 3 damage values: ',dam_3);

        console.log('method 4 int_4', int_4);
        console.log('method 4 vuln_4', vuln_4);
        console.log('method 4 dam_4', dam_4);
        */
        let freqIntVulnDam = [frq, int_3, vuln_3, dam_3, dam_4, int_4, vuln_4];
        return freqIntVulnDam;        
    }
    // --- DEBRIS OR FLOODING
    if(hazType == 'debris_flow' || hazType == 'flooding'){    
        // --- random intensity within intervals according to danger level
        if(dangerLevel == 'low'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.966){
                //int_4 = randValue * 0.5;                
                int_4 = Math.random() * 0.5;                
            } else {
                int_4 = 0;
            }            
        }
        if(dangerLevel == 'mean'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.99 && randValue >= 0.966){
                //int_4 = (randValue * (2 - 0.5)) + 0.5;
                int_4 = (Math.random() * (2 - 0.5)) + 0.5;
            } else {
                int_4 = 0;
            }            
        }
        if(dangerLevel == 'high'){
            // --- assign 0 or random intensity according to frequency value
            if (randValue >= 0.99){
                // --- Method 4 random intensity within the interval of return period (300 to 600)
                //int_4 = (randValue * (5.8 - 2)) + 2;
                int_4 = (Math.random() * (5.8 - 2)) + 2;
            } else {
                int_4 = 0;
            }            
        }

        console.log('method 4 intensity: ', int_4);

        //frq = ((randValue * 0.33) + (0.000698));
        frq = ((randValue * (0.3 - 0.001)) + (0.001));
        //frq = ((randValue * 0.333) + (0.0003333));

        //frq = ((Math.random() * 0.33) + (0.000901));
        //frq = ((Math.random() * (0.3 - 0.001)) + (0.001));
        
        int_3 = Math.pow((frq / 0.0103), (-1/1.534)).toFixed(2);
        //int_3 = Math.pow((frq / 0.0124), (-1/1.431)).toFixed(2);

        if(newVulnData){
            vuln_3 = parseFloat(vulnerability(int_3, newVulnData.debrisflow.mean, newVulnData.debrisflow.min, newNulnData.debrisflow.max))
            vuln_4 = parseFloat(vulnerability(int_4, newVulnData.debrisflow.mean, newVulnData.debrisflow.min, newNulnData.debrisflow.max))
        } else {                    
            vuln_3 = parseFloat(vulnerability(int_3, vulnData.debrisflow.mean, vulnData.debrisflow.min, vulnData.debrisflow.max))
            vuln_4 = parseFloat(vulnerability(int_4, vulnData.debrisflow.mean, vulnData.debrisflow.min, vulnData.debrisflow.max))
        }
        dam_3 = frq * vuln_3 * buildCost * spProb;
        dam_4 = frq * vuln_4 * buildCost * spProb;
        /*
        console.log('method 3 frequency values: ', frq);
        console.log('method 3 intensity values: ',int_3);
        console.log('method 3 vulnerability values: ',vuln_3); 
        console.log('method 3 damage values: ',dam_3);

        console.log('method 4 int_4', int_4);
        console.log('method 4 vuln_4', vuln_4);
        console.log('method 4 dam_4', dam_4);
        */
        
        let freqIntVulnDam = [frq, int_3, vuln_3, dam_3, dam_4, int_4, vuln_4];
        return freqIntVulnDam;
    }
}

/* method 5 & 6 - random frequency by return period and vulnerability by power law and danger level */
function method_5_6_RandFreqRpPowerLawMatrix(returnP, hazType, builCost, spatialProb, dangerLevel){
    /*console.log('== method 5 & 6 function ==');
    console.log('spatial prob function:', spatialProb);
    console.log('danger level :', dangerLevel);*/

    // --- random value
    //randValue = randV_5_6;
    randValue = Math.random();

    // --- variables for frequency and vulnerability
    let vuln_5, vuln_6 ;
    let dam_5, dam_6;
    let frq;
    let int_5, int_6;  
    
    // === Calculate frequency and intensity according to type of hazard for method 6
    // ---  DEBRIS FLOW OR FLOODING 
    if(hazType == 'debris_flow' || hazType == 'flooding'){
        // --- random intensity within intervals according to danger level
        if(dangerLevel == 'low'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.966){
            // --- Method 6 random intensity within the interval of return period (0 to 0.5)
            int_6 = Math.random() * 0.5;                
            } else {
                int_6 = 0;
            }            
        }
        if(dangerLevel == 'mean'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.99 && randValue >= 0.966){
            // --- Method 6 random intensity within the interval of return period (0.5 to 2.0)
            int_6 = (Math.random() * (2 - 0.5)) + 0.5;
            } else {
                int_6 = 0;
            }
        }
        if(dangerLevel == 'high'){
            // --- assign 0 or random intensity according to frequency value
            if (randValue >= 0.99){
                // --- Method 6 random intensity within the interval of return period (2.0 to 5.8)
                int_6 = (Math.random() * (5.8 - 2)) + 2;
            } else {
                int_6 = 0;
            }
        }

        // --- check return period
        if (returnP == 30){
            frq = (Math.random() * (0.3-0.033)) + 0.033;
            // --- calculate intensity based on power law distribution
            int_5 = Math.pow((frq / 0.0103), (-1/1.534)).toFixed(2);
        }
        if (returnP == 100){
            frq = (Math.random() * (0.033 - 0.0033)) + 0.0033;
            int_5 = Math.pow((frq / 0.0103), (-1/1.534)).toFixed(2);            
        }
        if (returnP == 300){
            //frq = (Math.random() * (0.0033 - 0.00125)) + 0.00125;
            frq = (Math.random() * (0.0033 - 0.00086)) + 0.00086;
            int_5 = Math.pow((frq / 0.0103), (-1/1.534)).toFixed(2); 
        } 
        if (returnP == 1000){
            frq = (Math.random() * (0.00125 - 0.00086)) + 0.00086;
            //frq = 0.001;
            int_5 = Math.pow((frq / 0.0103), (-1/1.534)).toFixed(2);                  
        } 
        // --- check if new vulnerability values were uploaded
        if(newVulnData){
            vuln_5 = vulnerability(int_5, newVulnData.debrisflow.mean, newVulnData.debrisflow.min, newVulnData.debrisflow.max).toFixed(3);
            vuln_6  = vulnerability(int_6, newVulnData.debrisflow.mean, newVulnData.debrisflow.min, newVulnData.debrisflow.max).toFixed(3);
        } else {
            vuln_5 = vulnerability(int_5, vulnData.debrisflow.mean, vulnData.debrisflow.min, vulnData.debrisflow.max).toFixed(3);
            vuln_6  = vulnerability(int_6, vulnData.debrisflow.mean, vulnData.debrisflow.min, vulnData.debrisflow.max).toFixed(3);
        }    
        dam_5 = frq * vuln_5 * builCost * spatialProb;
        dam_6 = frq * vuln_6  * builCost * spatialProb;
        /*
        console.log('RP method 5 & 6 frequency values: ', frq);

        console.log('RP method 5 int_5: ', int_5);
        console.log('RP method 5 vuln_5: ', vuln_5);
        console.log('RP method 5 dam_5: ', dam_5);

        console.log('RP method 6  int_6: ', int_6);
        console.log('RP method 6 vuln_6 : ', vuln_6 );
        console.log('RP method 6 dam_6: ', dam_6, ' => ' ,dangerLevel);
        console.log('== RANDOM FREQ INT AND VULN END ==');
        */
        let freqIntVulnDam = [frq, int_5, vuln_5, dam_5, dam_6, int_6, vuln_6 ];
        return freqIntVulnDam;        
    }

    // --- ROCKFALL
    if(hazType == 'rock_fall'){
        // --- random intensity within intervals according to danger level
        if(dangerLevel == 'low'){
            // --- check interval of frequency to assign random intensity or 0 to intensity value
            if (randValue < 0.966){
                // --- Method 6 random intensity within the interval of return period (30 to 100)
                int_6 = (Math.random() * (100 - 30)) + 30;                
            } else {
                int_6 = 0;
            }
        }
        if(dangerLevel == 'mean'){
            // --- assign 0 or random intensity according to frequency value
            if(randValue < 0.99 && randValue >= 0.966){
                // --- Method 6 random intensity within the interval of return period (100 to 300)
                int_6 = (Math.random() * (300 - 100)) + 100;
            } else {
                int_6 = 0;
            }
        }
        if(dangerLevel == 'high'){
            // --- assign 0 or random intensity according to frequency value
            if (randValue >= 0.99 ){
                // --- Method 6 random intensity within the interval of return period (300 to 600)
                int_6 = (Math.random() * (600 - 300)) + 300;
            } else {
                int_6 = 0;
            }            
        }

        // --- check return period
        if (returnP == 30){
            frq = (Math.random() * (0.3-0.033)) + 0.033;
            //frq = ((Math.random() * 0.333) + (0.0003333));
            int_5 = Math.pow((frq / 291.03), (-1/1.984)).toFixed(0);
            //int = Math.pow((frq / 30.875), (-1/1.999));
        }
        if (returnP == 100){
            frq = (Math.random() * (0.033-0.0033)) + 0.0033;
            //frq = ((Math.random() * 0.333) + (0.0003333));
            int_5 = Math.pow((frq / 291.03), (-1/1.984)).toFixed(0);
            //int = Math.pow((frq / 30.875), (-1/1.999));
        }
        if (returnP == 300){
            frq = (Math.random() * (0.0035-0.000901)) + 0.000901;
            //frq = ((Math.random() * 0.333) + (0.0003333));
            int_5 = Math.pow((frq / 291.03), (-1/1.984)).toFixed(0); 
            //int = Math.pow((frq / 30.875), (-1/1.999));
        }
        /*
        console.log('hazard type: ', hazType);
        console.log('frq: ', frq);
        console.log('int_5: ', int_5);
        */

        // --- check if new vulnerability values were uploaded
        if(newVulnData){
            vuln_5 = vulnerability(int_5, newVulnData.rockfall.mean, newVulnData.rockfall.max, newVulnData.rockfall.min).toFixed(2);
            vuln_6  = vulnerability(int_6, newVulnData.rockfall.mean, newVulnData.rockfall.max, newVulnData.rockfall.min).toFixed(2);
        } else {
            vuln_5 = vulnerability(int_5, vulnData.rockfall.mean, vulnData.rockfall.max, vulnData.rockfall.min).toFixed(2);
            vuln_6  = vulnerability(int_6, vulnData.rockfall.mean, vulnData.rockfall.max, vulnData.rockfall.min).toFixed(2);
        }    
        dam_5 = frq * vuln_5 * builCost * spatialProb;
        dam_6 = frq * vuln_6  * builCost * spatialProb;
        
        /*
        console.log('RP method 5 & 6  frequency values: ', frq);

        console.log('RP method 5 int_5: ',int_5);
        console.log('RP method 5 vuln_5: ',vuln_5);
        console.log('RP method 5 dam_5: ',dam_5);

        console.log('RP method 6  int_6: ', int_6);
        console.log('RP method 6 vuln_6 : ', vuln_6 );
        console.log('RP method 6 dam_6: ', dam_6, ' => ' ,dangerLevel);

        console.log('== RANDOM FREQ INT AND VULN END ==');
        */

        let freqIntVulnDam = [frq, int_5, vuln_5, dam_5, dam_6, int_6, vuln_6 ];
        return freqIntVulnDam; 
    }     
}



/* ---- random vulnerability function for one intensity value based on frequency 
and for n random vulnerability values--- */
function randomVuln(freq, returnP){    
    // --- number of simulations
    let nb_sim = 10;
    let rp;
    let int;
    // --- power law distribution to calculate return period based of frequency value
    rp = Math.pow((freq/1), -1); // --power law formula
    // --- intensity conversion based on the return period
    if (returnP == 5){
        int = 5;
    }
    if (returnP == 20){
        int = 20;
    }
    if (returnP == 30){
        int = (((rp - 30) / 70) * 270) + 30;
    }
    if (returnP == 100){
        int = (((rp - 100) / 200) * 300) + 300;
    }
    if (returnP == 300){
        int = (((rp - 300) / 1000) * 600) + 600;
        //int = 400;
    }
    if (returnP == 1000){
        int = 600;
    }
    //int = (((rp - 30) / 70) * 270) + 30;
    //console.log('intensity: ', int);
    // --- arrays to hold values of intensity and vulnerability
    let intValues = [];
    let vuln = [];
    // --- check if new vuln data was uploaded
    if(newVulnData){
        for(let i = 0; i < nb_sim; i++){
            intValues[i] = int.toFixed(0);
            vuln[i] = vulnerability(intValues[i], newVulnData.rockfall.mean, newVulnData.rockfall.max, newVulnData.rockfall.min).toFixed(2);
        }
    } else {
        for(let i = 0; i < nb_sim; i++){
            intValues[i] = int.toFixed(0);
            vuln[i] = vulnerability(intValues[i], vulnData.rockfall.mean, vulnData.rockfall.max, vulnData.rockfall.min).toFixed(2);
        }
    }
    let valGraph = [intValues, vuln];
    console.log('rp from randomVul function', rp);
    return valGraph;
}