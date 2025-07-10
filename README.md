# Telescope Control Panel

An interactive web-based telescope emulator for astronomical education. This application simulates operating a real telescope with photometry and spectroscopy capabilities.

## Features

### 🔭 Telescope Control
- **Multiple telescope configurations** (12" Meade, 20" Planewave, 4m Blanco)
- **Real-time coordinate tracking** with RA/Dec, Alt/Az displays
- **Manual slewing** with adjustable speeds
- **Auto-slewing** to catalog objects
- **Accurate time simulation** with local and sidereal time

### 📊 Photometry Simulator
- **Multi-band photometry** (U, B, V filters)
- **Variable aperture sizes** (5", 10", 20", 40")
- **Realistic noise modeling** (Poisson, atmospheric, scintillation)
- **Atmospheric extinction** effects
- **Sky background** simulation

### 🌈 Spectroscopy Simulator
- **Real-time spectrum acquisition**
- **Stellar spectral templates**
- **Galaxy spectra with redshift**
- **Interactive spectrum analysis**
- **Slit-based target selection**

### 🌌 Astronomical Data
- **Galaxy cluster fields** (Coma, Boötes, Corona Borealis, Ursa Major)
- **Star clusters** (Pleiades)
- **Background star populations**
- **Realistic object catalogs**

## Quick Start

### Online Demo
Visit the live demo: [https://telescope-emulator.vercel.app](https://telescope-emulator.vercel.app)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/telescope-emulator.git
   cd telescope-emulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## File Structure

```
telescope-emulator/
├── index.html              # Main application page
├── styles.css              # Application styles
├── js/
│   ├── main.js             # Application initialization
│   ├── constants.js        # Physical constants and configurations
│   ├── utils.js            # Utility functions and calculations
│   ├── catalog.js          # Astronomical object management
│   ├── telescope.js        # Main telescope controller
│   ├── photometer.js       # Photometry instrument
│   └── spectrometer.js     # Spectroscopy instrument
├── data/                   # Astronomical catalogs (JSON format)
├── scripts/                # Data conversion utilities
└── docs/                   # Documentation
```

## Usage Guide

### 1. Initial Setup
1. **Select Telescope**: Choose from available telescope configurations
2. **Select Field**: Pick an astronomical field to observe
3. **Set Date/Time**: Configure observation time (optional)

### 2. Telescope Operations
- **Manual Slewing**: Use N/S/E/W buttons with adjustable speed
- **Object Selection**: Click on objects in the catalog table for auto-slew
- **Field Navigation**: Click on the finder view to center on objects

### 3. Photometry
1. **Open Photometer**: Click "Open Photometer" button
2. **Configure Settings**:
   - Filter band (U, B, V)
   - Aperture size
   - Integration time
   - Atmosphere on/off
3. **Begin Integration**: Start photon collection
4. **View Results**: Realistic count statistics with noise

### 4. Spectroscopy
1. **Open Spectrometer**: Click "Open Spectrometer" button
2. **Target Selection**: Position objects within the spectroscopic slit
3. **Start Integration**: Begin spectrum acquisition
4. **Real-time Display**: Watch photon counts accumulate
5. **Stop & Analyze**: Stop integration and click on spectrum for analysis

## Educational Applications

### Astronomy Courses
- **Observational Techniques**: Learn telescope operation and pointing
- **Photometry**: Understand stellar brightness measurements
- **Spectroscopy**: Explore stellar and galactic spectra
- **Data Analysis**: Practice astronomical data reduction

### Physics Concepts
- **Coordinate Systems**: RA/Dec, Alt/Az transformations
- **Atmospheric Effects**: Extinction, airmass, scintillation
- **Detector Physics**: Photon noise, integration time
- **Stellar Evolution**: Spectral types and temperatures

## Technical Details

### Astronomical Calculations
- **Coordinate Transformations**: Accurate RA/Dec ↔ Alt/Az conversion
- **Sidereal Time**: Precise LST calculation for any location
- **Atmospheric Modeling**: Realistic extinction and scintillation
- **Photon Statistics**: Proper Poisson noise simulation

### Performance Features
- **Client-side Processing**: No server required, runs entirely in browser
- **Real-time Updates**: Smooth 60fps graphics and animations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Memory Efficient**: Optimized for extended observation sessions

## Data Formats

### Catalog Files (JSON)
```json
[
  {
    "name": "Object Name",
    "ra": 12.345,           // hours
    "dec": 34.567,          // degrees
    "mag": 8.5,             // V magnitude
    "bv": 0.6,              // B-V color
    "ub": 0.1,              // U-B color
    "redshift": 0.02,       // for galaxies
    "objType": 0,           // 0=star, 1=galaxy
    "specType": "G5 V"      // spectral type
  }
]
```

### Telescope Configurations
```javascript
{
  name: 'Telescope Name',
  diameter: 0.5,          // meters
  latitude: 40.0,         // degrees
  longitude: -75.0,       // degrees
  altitude: 150.0         // meters
}
```

## Browser Compatibility

- **Chrome/Edge**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

### Required Features
- HTML5 Canvas
- ES6 JavaScript
- CSS Grid/Flexbox
- Web Workers (for calculations)

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit a pull request

### Adding New Features
- **Instruments**: Extend the base instrument controller class
- **Catalogs**: Add new JSON catalog files in `/data/`
- **Calculations**: Enhance `/js/utils.js` with new functions
- **UI Components**: Follow the existing CSS/HTML patterns

### Code Style
- Use ES6+ features
- Comment complex astronomical calculations
- Follow JSDoc conventions for functions
- Test on multiple browsers

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Original Python Version**: Based on the PyQt5 telescope emulator
- **Astronomical Data**: Catalogs derived from professional surveys
- **Spectral Templates**: Jacoby et al. stellar atlas
- **Educational Design**: Informed by astronomy education research

## Support

### Documentation
- [User Guide](docs/user-guide.md)
- [Developer API](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Q&A and general discussion
- Wiki: Community-contributed guides and examples

### Citation
If you use this software in academic work, please cite:
```
Telescope Control Panel Emulator (2024)
GitHub repository: https://github.com/your-username/telescope-emulator
```

## Roadmap

### Version 1.1
- [ ] Additional spectral templates
- [ ] Export functionality for observations
- [ ] Multi-object spectroscopy
- [ ] Advanced atmospheric modeling

### Version 1.2
- [ ] Adaptive optics simulation
- [ ] CCD camera emulation
- [ ] Observation planning tools
- [ ] Virtual reality integration

### Long-term Goals
- [ ] Integration with real telescope APIs
- [ ] Collaborative observation sessions
- [ ] AI-powered object recognition
- [ ] Advanced data reduction pipeline

---

**Ready to explore the universe? Start your observations today!** 🌟
