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

// Make functions available globally
window.volumeBuilding = volumeBuilding;
window.constructionYear = constructionYear;
window.constructionPeriodCodeToYears = constructionPeriodCodeToYears;
