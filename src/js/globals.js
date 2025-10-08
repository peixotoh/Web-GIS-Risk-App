/*
  src/js/globals.js
  Centralized window-scoped placeholders and quick reference for exported functions.
  Keep entries concise and idempotent so loading order is safe (won't overwrite runtime values).
*/
(function(){
  'use strict';

  // Map & base layers
  window.map = window.map || null;
  window.lyrOTM = window.lyrOTM || null;
  window.lyrOSM = window.lyrOSM || null;
  window.lyrEWM = window.lyrEWM || null;
  window.lyrCDM = window.lyrCDM || null;
  window.lyrSMD = window.lyrSMD || null;
  window.baseLayers = window.baseLayers || null;

  // Feature groups & controls
  window.fgp = window.fgp || null;
  window.fgp1 = window.fgp1 || null;
  window.drawControl = window.drawControl || null;
  window.ctlLayers = window.ctlLayers || null;

  // Hazard / building layers
  // Per-hazard custom layers deprecated; use single canonical window.hazardLayer
  // Deprecated per-hazard custom placeholders removed. Use window.hazardLayer
  window.hazardLayer = window.hazardLayer || null;
  // Single canonical buildings variable
  window.buildingsLayer = window.buildingsLayer || null;
  // Keep legacy alias for backward compatibility (points to same object)
  Object.defineProperty(window, 'customBuildingsLayer', {
    get: function() { return window.buildingsLayer; },
    set: function(v) { window.buildingsLayer = v; },
    configurable: true
  });
  window.buildingsData = window.buildingsData || null;
  window.suisseHazardLayer = window.suisseHazardLayer || null;

  // Workflow / selection state
  window.drawnPolygon = window.drawnPolygon || null;
  window.selectedLocation = window.selectedLocation || null;
  window.selectedHazard = window.selectedHazard || null;
  window.buildingsEnabled = (typeof window.buildingsEnabled !== 'undefined') ? window.buildingsEnabled : false;
  window.currentBBox = window.currentBBox || null;

  // Admin layers
  window.swissAdminLayer = window.swissAdminLayer || null;

  // Supabase / data client
  window.supabaseClient = window.supabaseClient || null;

  // Vulnerability & user state
  window.rockVulnerabilityDefaults = window.rockVulnerabilityDefaults || null;
  window.rockVulnerabilityChanged = window.rockVulnerabilityChanged || null;
  window.userBuildingParameters = window.userBuildingParameters || {};

  // Helper function placeholders (documented here so other modules can read them)
  window.updateDataSourceDisplay = window.updateDataSourceDisplay || function() {};
  window.getSelectedHazardType = window.getSelectedHazardType || function(){ return null; };
  // Hazard helper (display) and draw initialization placeholders
  window.fetchAndDisplayHazardLayer = window.fetchAndDisplayHazardLayer || function(bbox) { console.warn('fetchAndDisplayHazardLayer not initialized', bbox); };
  window.initializeDrawFunctionality = window.initializeDrawFunctionality || function() { console.warn('initializeDrawFunctionality not initialized'); };

  // Building functions (implemented in supabase-buildings.js)
  window.loadBuildingsFromSupabase = window.loadBuildingsFromSupabase || function(){ console.warn('loadBuildingsFromSupabase not initialized'); };
  window.removeBuildingsFromMap = window.removeBuildingsFromMap || function(){ console.warn('removeBuildingsFromMap not initialized'); };
  window.showAttributesTable = window.showAttributesTable || function(){};

  // Hazard attributes table functions
  window.showHazardsAttributesTable = window.showHazardsAttributesTable || function(){};
  window.closeHazardsAttributesTable = window.closeHazardsAttributesTable || function(){};

  // Coordinate helpers & 3D
  window.WGS84ToSwiss = window.WGS84ToSwiss || null;
  window.initializeCesium3D = window.initializeCesium3D || function(){};
  window.syncLayersTo3D = window.syncLayersTo3D || function(){};
  window.cleanup3DMap = window.cleanup3DMap || function(){};
  window.initialize3DButtons = window.initialize3DButtons || function(){};

  // Administrative selection helpers
  window.currentAdministrativeSelection = window.currentAdministrativeSelection || null;
  window.removeSelectionHighlight = window.removeSelectionHighlight || function(){};
  window.getCurrentAdministrativeSelection = window.getCurrentAdministrativeSelection || function(){ return null; };

  // Quick reference (comments):
  // Globals: map, buildingsLayer, buildingsData, swissAdminLayer, rockVulnerabilityDefaults,
  // userBuildingParameters, supabaseClient
  // Exported functions often attached to window by modules:
  // loadBuildingsFromSupabase, removeBuildingsFromMap, showAttributesTable,
  // updateDataSourceDisplay, getSelectedHazardType

})();
