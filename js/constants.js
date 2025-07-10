// Physical constants
const CONSTANTS = {
    // Physics constants (SI units)
    H_PLANCK: 6.62607015e-34,     // J·s
    C_LIGHT: 2.99792458e8,        // m/s
    K_BOLTZMANN: 1.380649e-23,    // J/K
    
    // Observatory defaults
    DEFAULT_TELESCOPE_DIAM: 0.3048,  // 12" scope in meters
    DEFAULT_SITE_ALT: 152.0,         // Villanova Observatory elevation (m)
    DEFAULT_TELESCOPE_LAT: 40.0375,  // degrees north
    DEFAULT_TELESCOPE_LON: -75.3370, // degrees east
    
    // Photometry constants
    ZERO_POINT_PHOTONS: {
        'U': 1.8e10,
        'B': 4.0e10,
        'V': 3.6e10
    },
    
    EXTINCTION_COEFF: {
        'U': 0.50,
        'B': 0.25,
        'V': 0.15
    },
    
    SKY_BRIGHTNESS: {
        'U': 22.0,
        'B': 22.7,
        'V': 21.6
    },
    
    // Field of view settings
    FINDER_FOV_DEG: 2.0,           // Finder scope FOV in degrees
    SPEC_FOV_DEG: 0.25,            // Spectrometer FOV in degrees
    SLIT_WIDTH_DEG: 0.3/60.0,      // Slit width in degrees
    SLIT_HEIGHT_DEG: 1.0/60.0,     // Slit height in degrees
    
    // Slew speeds (deg/step, interval_ms, label)
    SLEW_SPEEDS: [
        { step: 0.0005, interval: 50, label: 'Slew: Ultra Slow' },
        { step: 0.001, interval: 25, label: 'Slew: Slow' },
        { step: 0.001, interval: 12.5, label: 'Slew: Medium' },
        { step: 0.002, interval: 12.5, label: 'Slew: Fast' },
        { step: 0.04, interval: 12.5, label: 'Slew: Ultra Fast' }
    ],
    
    // Photometer settings
    APERTURE_SIZES: [5, 10, 20, 40], // arcseconds
    INTEGRATION_TIMES: [0.01, 0.1, 1.0, 10.0], // seconds
    
    // Spectrum settings
    SPECTRUM_MIN_WAVE: 3900, // Angstroms
    SPECTRUM_MAX_WAVE: 4500, // Angstroms
    
    // Galaxy line definitions (rest wavelength, FWHM, optical depth)
    GALAXY_LINES: [
        { wavelength: 3933.663, fwhm: 15.0, depth: 0.5 }, // Ca II K
        { wavelength: 3968.492, fwhm: 15.0, depth: 0.6 }, // Ca II H
        { wavelength: 4300.000, fwhm: 11.0, depth: 0.3 }, // G-band
        { wavelength: 4310.000, fwhm: 11.0, depth: 0.3 }  // G-band
    ]
};

// Telescope configurations
const TELESCOPES = [
    {
        name: 'VU 12" Meade telescope',
        diameter: 0.3048,
        latitude: 40.0369,
        longitude: -75.2426,
        altitude: 152.0
    },
    {
        name: 'VU 20" Planewave telescope',
        diameter: 0.508,
        latitude: 40.0369,
        longitude: -75.2426,
        altitude: 152.0
    },
    {
        name: 'CTIO 4-m Blanco telescope',
        diameter: 4.0,
        latitude: -30.1667,
        longitude: -70.7972,
        altitude: 2202.0
    }
];

// Field definitions
const FIELDS = [
    {
        name: 'Coma Berenices galaxy cluster',
        filename: 'COMAFLD.json',
        ra: 12.98722222,
        dec: 27.68361111,
        background: false
    },
    {
        name: 'Bootes galaxy cluster',
        filename: 'BOOTFLD.json',
        ra: 14.50833333,
        dec: 31.49138888,
        background: false
    },
    {
        name: 'Corona Borealis galaxy cluster',
        filename: 'CRBORFLD.json',
        ra: 15.40944444,
        dec: 27.50166666,
        background: false
    },
    {
        name: 'Ursa Major I galaxy cluster',
        filename: 'UMA1FLD.json',
        ra: 11.80638888,
        dec: 55.60083333,
        background: false
    },
    {
        name: 'Ursa Major II galaxy cluster',
        filename: 'UMA2FLD.json',
        ra: 10.99611111,
        dec: 56.80777777,
        background: false
    },
    {
        name: 'Pleiades star cluster',
        filename: 'PLEIADES.json',
        ra: 3.731944,
        dec: 24.25,
        background: false
    },
    {
        name: 'Stellar Temperature Group',
        filename: 'STARTEMP.json',
        ra: 5.90,
        dec: 7.40,
        background: true
    },
    {
        name: 'Atmospheric Effects Group',
        filename: 'ATMOGRP.json',
        ra: 14.71,
        dec: 16.41,
        background: true
    }
];

// Stellar spectral types mapping to codes
const SPECTRAL_CODES = {
    // O stars
    'O3 V': 10305000, 'O4 V': 10405000, 'O5 V': 10505000,
    'O6 V': 10605000, 'O7 V': 10705000, 'O8 V': 10805000,
    'O3 III': 10303000, 'O4 III': 10403000, 'O7 III': 10703000, 'O8 III': 10803000,
    
    // B stars
    'B0 V': 20005000, 'B1 V': 20105000, 'B2 V': 20205000, 'B3 V': 20305000,
    'B4 V': 20405000, 'B5 V': 20505000, 'B6 V': 20605000, 'B7 V': 20705000,
    'B8 V': 20805000, 'B9 V': 20905000,
    'B0 III': 20003000, 'B1 III': 20103000, 'B2 III': 20203000, 'B3 III': 20303000,
    'B4 III': 20403000, 'B5 III': 20503000, 'B6 III': 20603000, 'B7 III': 20703000,
    'B8 III': 20803000,
    'B1 I': 20101000, 'B4 I': 20401000, 'B5 I': 20501000, 'B8 I': 20801000,
    
    // A stars
    'A0 V': 30005000, 'A1 V': 30105000, 'A2 V': 30205000, 'A3 V': 30305000,
    'A4 V': 30405000, 'A5 V': 30505000, 'A6 V': 30605000, 'A7 V': 30705000,
    'A8 V': 30805000, 'A9 V': 30905000,
    'A0 III': 30003000, 'A1 III': 30103000, 'A2 III': 30203000, 'A3 III': 30303000,
    'A4 III': 30403000, 'A5 III': 30503000, 'A6 III': 30603000, 'A7 III': 30703000,
    'A8 III': 30803000,
    'A1 I': 30101000, 'A2 I': 30201000, 'A3 I': 30301000,
    
    // F stars
    'F0 V': 40005000, 'F1 V': 40105000, 'F2 V': 40205000, 'F3 V': 40305000,
    'F4 V': 40405000, 'F5 V': 40505000, 'F6 V': 40605000, 'F7 V': 40705000,
    'F8 V': 40805000,
    'F0 III': 40003000, 'F1 III': 40103000, 'F2 III': 40203000, 'F3 III': 40303000,
    'F4 III': 40403000, 'F5 III': 40503000, 'F6 III': 40603000, 'F7 III': 40703000,
    'F8 III': 40803000,
    'F1 I': 40101000, 'F4 I': 40401000, 'F7 I': 40701000,
    
    // G stars
    'G0 V': 50005000, 'G1 V': 50105000, 'G2 V': 50205000, 'G3 V': 50305000,
    'G4 V': 50405000, 'G5 V': 50505000, 'G6 V': 50605000, 'G7 V': 50705000,
    'G8 V': 50805000,
    'G0 III': 50003000, 'G1 III': 50103000, 'G2 III': 50203000, 'G3 III': 50303000,
    'G4 III': 50403000, 'G5 III': 50503000, 'G6 III': 50603000, 'G7 III': 50703000,
    'G8 III': 50803000,
    'G0 I': 50001000, 'G1 I': 50101000, 'G2 I': 50201000, 'G3 I': 50301000,
    'G4 I': 50401000, 'G5 I': 50501000, 'G6 I': 50601000, 'G7 I': 50701000,
    
    // K stars
    'K0 V': 60005000, 'K1 V': 60105000, 'K2 V': 60205000, 'K3 V': 60305000,
    'K4 V': 60405000, 'K5 V': 60505000, 'K6 V': 60605000, 'K7 V': 60705000,
    'K8 V': 60805000,
    'K0 III': 60003000, 'K1 III': 60103000, 'K2 III': 60203000, 'K3 III': 60303000,
    'K4 III': 60403000, 'K5 III': 60503000, 'K6 III': 60603000, 'K7 III': 60703000,
    'K8 III': 60803000,
    'K0 I': 60001000, 'K1 I': 60101000, 'K2 I': 60201000, 'K3 I': 60301000,
    'K4 I': 60401000, 'K7 I': 60701000, 'K8 I': 60801000,
    
    // M stars
    'M0 V': 70005000, 'M1 V': 70105000, 'M2 V': 70205000, 'M3 V': 70305000,
    'M4 V': 70405000,
    'M0 III': 70003000, 'M1 III': 70103000, 'M2 III': 70203000, 'M3 III': 70303000,
    'M4 III': 70403000,
    'M0 I': 70001000, 'M1 I': 70101000, 'M2 I': 70201000, 'M3 I': 70301000,
    'M4 I': 70401000
};

// Background star generation parameters
const BACKGROUND_STARS = {
    TOTAL_COUNT: 50000,      // Total stars to generate
    MAG_MIN: 5.0,           // Brightest magnitude
    MAG_MAX: 15.0,          // Faintest magnitude
    MAG_EXPONENT: 0.6       // For stellar luminosity function
};
