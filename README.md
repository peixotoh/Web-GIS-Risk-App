# WebGIS Risk Application

A web-based Geographic Information System for natural hazards risk assessment in Switzerland. Built entirely with open-source technologies and leveraging free open data from Swiss official platforms through their public APIs (GeoAdmin, Swiss Federal Statistical Office), this application demonstrates how accessible tools can be combined to create powerful risk analysis solutions.

![License](https://img.shields.io/badge/license-Academic-blue)
![Version](https://img.shields.io/badge/version-1.0-green)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen)

## 🎯 Overview

This application was developed as part of a Master's degree in Geosciences at the University of Lausanne (UNIL), where **Risk** was a core module. It represents both the original thesis work and its continued development and improvement after graduation, extending the initial research into a fully functional web-based tool for natural hazards risk assessment.

Developed with the assistance of **GitHub Copilot**, leveraging AI-assisted coding to accelerate development, improve code quality, and implement complex spatial analysis and probabilistic modeling features.

The application covers the following scope:

- **Study area**: Cantons of Ticino and Vaud (Switzerland)
- **Hazard type**: Rockfall
- **Building vulnerability modeling**: Triangular distribution curves based on Swiss building classifications
- **Deterministic assessment**: Method 1 (EconoMe) and Method 2 (Literature-based vulnerability functions)
- **Stochastic assessment**: Monte Carlo simulations generating four CAT Model variants (Methods 3–6) for probabilistic damage estimation
- **Interactive visualization**: Real-time mapping with Swiss administrative boundaries and hazard layers

## 🚀 Features

### Core Functionality
- 📍 **Interactive Map**: Leaflet-based mapping with Swiss coordinate system support (LV95)
- 🏢 **Building Data Integration**: GeoAdmin API integration for Swiss building register data
- ⚠️ **Hazard Layer Management**: Support for rockfall, debris flow, and flooding hazards
- 📊 **Risk Calculation**: Multiple methods including EconoMe, Literature-based, and CAT Models
- 📈 **Data Visualization**: Plotly.js graphs, AG Grid tables, and damage exceedance curves
- 📄 **Export Options**: CSV, Excel, and PDF report generation

### Analysis Methods
| Method | Description | Approach |
|--------|-------------|----------|
| **Method 1** | EconoMe | Swiss standard damage estimation |
| **Method 2** | Literature | Research-based vulnerability functions |
| **Method 3** | CAT Model (Basic) | Monte Carlo with spatial probability |
| **Method 4** | CAT Model (Intensity) | By hazard intensity class |
| **Method 5** | CAT Model (Return Period) | By return period |
| **Method 6** | CAT Model (Combined) | Return period + hazard level |

### Vulnerability Modeling
- Triangular distribution curves for building damage estimation
- 4 building vulnerability classes based on Swiss construction types
- Interactive curve adjustment with real-time visualization

## 🛠️ Technology Stack

### Frontend
- **Leaflet 1.9.4** - Interactive mapping
- **Turf.js 6.5** - Spatial analysis operations
- **Plotly.js** - Scientific visualization
- **AG Grid** - Data tables
- **Bootstrap 4.6** - UI components (with jQuery dependency)

### Data Sources
- **GeoAdmin API** - Swiss Federal Office of Topography
- **Swiss Building Register** - ch.bfs.gebaeude_wohnungs_register
- **Hazard Maps** - Swiss natural hazard databases

### Export Libraries
- **jsPDF** - PDF generation
- **SheetJS (xlsx)** - Excel export
- **html2canvas** - Visual content capture

## 📁 Project Structure

```
webgisrisk-github/
├── index.html              # Main application entry point
├── src/
│   ├── js/
│   │   ├── app.js                    # Main orchestrator
│   │   ├── building-management.js    # GeoAdmin API integration
│   │   ├── spatial-analysis.js       # Turf.js operations
│   │   ├── risk_calculation.js       # CAT Model implementations
│   │   ├── vulnerability.js          # Vulnerability curves
│   │   ├── analysis-visualization.js # Results display
│   │   ├── data-processing.js        # File handling
│   │   ├── map-init.js              # Leaflet initialization
│   │   └── globals.js               # Global state management
│   ├── css/
│   │   └── main-styles.css          # Application styles
│   └── plug/                        # Leaflet plugins
├── data/
│   ├── json/                        # Data files
│   └── images/                      # Assets
├── docs/                            # Documentation
└── php/                             # Server-side scripts (optional)
```

## 🚦 Getting Started

### Live Application

The application is available online and ready to use:

🌐 **[https://peixotoh.github.io/Web-GIS-Risk-App/](https://peixotoh.github.io/Web-GIS-Risk-App/)**

No installation required - just open the link in a modern web browser (Chrome, Firefox, Edge recommended).

### Quick Start Guide

1. **Select Hazard Type**: Leave rockfall selected.
2. **Choose Data Source**: Leave Swiss API Data selected and choose a canton and commune from the dropdowns. **Upload Custom Data** requires GeoJSON files with specific attribute names.
3. **Zoom to Area of Interest**: Zoom level must be higher than 15 so that buildings can be displayed.
4. **Draw a Polygon Around Buildings Inside Hazards**: Use the polygon tool at the top left of the map.
5. **Run Analysis**: Click "Run Analysis" to calculate risks.
6. **View Results**: Explore tables, graphs, and export reports.
7. **Optional Configuration**: Click "Show Buildings Info" to adjust building cost values. Click "Show Curves" to adapt vulnerability parameters for each building class.

## 📊 Usage Examples

### Basic Risk Analysis
```javascript
// The application workflow:
// 1. User selects hazard type → selectedHazard = 'rockfall'
// 2. Location selection → fetchAndDisplayHazardLayer()
// 3. Building loading → loadBuildingsFromGeoAdmin()
// 4. Polygon drawing → extractBuildingsInsidePolygon()
// 5. Analysis → runSpatialAnalysis() + CAT Models
// 6. Results → showAnalysisResultsModal()
```

### Custom Data Upload
The application supports GeoJSON files for custom hazard and building data:
- **Hazard files**: Must include `intensity` property (faible/moyenne/forte)
- **Building files**: Should include building cost and classification attributes

## 📝 License

This project is developed for academic purposes as part of a Master's thesis at the University of Lausanne (UNIL), Faculty of Geosciences and Environment.

## 🙏 Acknowledgments

- **University of Lausanne (UNIL)** - Academic supervision and Master's programme in Geosciences
- **Swiss Federal Office of Topography (swisstopo)** - GeoAdmin API and open geospatial data
- **Swiss Federal Statistical Office (BFS)** - Swiss building register data
- **GitHub Copilot** - AI-assisted development throughout the project
- **Open Source Community** - Leaflet, Turf.js, Plotly.js, and all other libraries used

## 🙋‍♂️ Contact
Developed by Hélder Peixoto - helderasp@hotmail.com Feel free to reach out with feedback or contributions!

---

**Note**: This application is designed for research and educational purposes. Results should be validated before use in professional risk assessment.
