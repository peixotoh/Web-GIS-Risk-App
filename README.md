# WebGIS Risk Application

A web-based Geographic Information System for natural hazards risk assessment in Switzerland. This application enables researchers, urban planners, and engineers to perform comprehensive risk analysis combining hazard data, building information, and vulnerability modeling.

![License](https://img.shields.io/badge/license-Academic-blue)
![Version](https://img.shields.io/badge/version-2.0-green)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-brightgreen)

## 🎯 Overview

This application was developed as part of a Master's thesis project at the University of Lausanne (UNIL). It provides a complete workflow for:

- **Multi-hazard analysis**: Rockfall, debris flow, and flooding risk assessment
- **Building vulnerability modeling**: Using triangular distribution curves based on Swiss building classifications
- **Monte Carlo simulations**: CAT Model methods (3-6) for probabilistic damage estimation
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
- **Bootstrap 4.6** - UI components
- **jQuery 3.6** - DOM manipulation

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

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge recommended)
- Web server for local development (e.g., XAMPP, Live Server)
- Internet connection for external APIs

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/webgisrisk-github.git
   cd webgisrisk-github
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Or using Node.js
   npx serve
   ```

3. **Open in browser**
   ```
   http://localhost:8000/index.html
   ```

### Quick Start Guide

1. **Select Hazard Type**: Choose rockfall, debris flow, or flooding
2. **Choose Location**: Select canton and commune from dropdowns
3. **Load Data**: Click "Add Hazards" and "Add Buildings"
4. **Draw Analysis Area**: Use polygon tool to select buildings
5. **Configure Vulnerability**: Adjust curves if needed
6. **Run Analysis**: Click "Run Analysis" to calculate risks
7. **View Results**: Explore tables, graphs, and export reports

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

## 📚 Documentation

Detailed documentation is available in the `/docs` folder:

- [JavaScript Documentation](docs/JavaScript_Documentation.html) - Complete API reference
- [CAT Model Methods](docs/CAT_Model_Methods_Documentation.html) - Statistical methodology
- [UI/UX Design](docs/UX_UI_Design_Proposal.md) - Interface guidelines

## 🤝 Contributing

This is an academic project. For questions or collaboration:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open a Pull Request

## 📝 License

This project is developed for academic purposes as part of a Master's thesis at the University of Lausanne (UNIL), Faculty of Geosciences and Environment.

## 🙏 Acknowledgments

- **University of Lausanne (UNIL)** - Academic supervision
- **Swiss Federal Office of Topography (swisstopo)** - GeoAdmin API
- **Swiss Federal Statistical Office (BFS)** - Building register data
- **Open Source Community** - Leaflet, Turf.js, Plotly.js, and other libraries

## 📧 Contact

For questions about this project, please contact through the university channels or open an issue on GitHub.

---

**Note**: This application is designed for research and educational purposes. Results should be validated before use in professional risk assessment.
