// Utility functions for astronomical calculations and conversions

const Utils = {
    // Store the loaded spectral library
    spectralLibrary: null,
    
    // Load the Jacoby Atlas spectral library
    loadSpectralLibrary: async function() {
        if (this.spectralLibrary) return this.spectralLibrary;
        
        try {
            console.log('Loading Jacoby Atlas spectral library...');
            const response = await fetch('data/jacoby_atlas.json');
            if (!response.ok) {
                throw new Error(`Failed to load spectral library: ${response.status}`);
            }
            this.spectralLibrary = await response.json();
            console.log(`Loaded ${this.spectralLibrary.spectra.length} stellar spectra`);
            return this.spectralLibrary;
        } catch (error) {
            console.error('Error loading spectral library:', error);
            return null;
        }
    },
    
    // Find spectral data by spectral type
    findSpectralData: function(spectralType) {
        if (!this.spectralLibrary) return null;
        
        const index = this.spectralLibrary.spec_types.findIndex(type => 
            type.toLowerCase() === spectralType.toLowerCase()
        );
        
        if (index === -1) {
            // Try to find a close match
            const baseType = spectralType.charAt(0); // O, B, A, F, G, K, M
            const closestIndex = this.spectralLibrary.spec_types.findIndex(type => 
                type.charAt(0) === baseType
            );
            return closestIndex !== -1 ? {
                wavelength: this.spectralLibrary.wavelength,
                spectrum: this.spectralLibrary.spectra[closestIndex],
                actualType: this.spectralLibrary.spec_types[closestIndex]
            } : null;
        }
        
        return {
            wavelength: this.spectralLibrary.wavelength,
            spectrum: this.spectralLibrary.spectra[index],
            actualType: this.spectralLibrary.spec_types[index]
        };
    },
    
    // Find spectral data by spectral code
    findSpectralDataByCode: function(spectralCode) {
        if (!this.spectralLibrary) return null;
        
        const index = this.spectralLibrary.spec_codes.findIndex(code => code === spectralCode);
        if (index === -1) return null;
        
        return {
            wavelength: this.spectralLibrary.wavelength,
            spectrum: this.spectralLibrary.spectra[index],
            actualType: this.spectralLibrary.spec_types[index]
        };
    },
    
    // Angular conversions
    degreesToRadians: (degrees) => degrees * Math.PI / 180,
    radiansToDegrees: (radians) => radians * 180 / Math.PI,
    hoursToRadians: (hours) => hours * Math.PI / 12,
    radiansToHours: (radians) => radians * 12 / Math.PI,
    hoursToDegrees: (hours) => hours * 15,
    degreesToHours: (degrees) => degrees / 15,
    
    // Format coordinates
    formatRA: (raHours) => {
        const h = Math.floor(raHours);
        const m = Math.floor((raHours - h) * 60);
        const s = ((raHours - h) * 60 - m) * 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toFixed(1)}s`;
    },
    
    formatDec: (decDegrees) => {
        const sign = decDegrees >= 0 ? '+' : '-';
        const absDec = Math.abs(decDegrees);
        const d = Math.floor(absDec);
        const m = Math.floor((absDec - d) * 60);
        const s = ((absDec - d) * 60 - m) * 60;
        return `${sign}${d.toString().padStart(2, '0')}° ${m.toString().padStart(2, '0')}′ ${s.toFixed(1)}″`;
    },
    
    // Time utilities
    formatTime: (date) => {
        return date.toLocaleTimeString('en-US', { hour12: false });
    },
    
    formatDate: (date) => {
        return date.toISOString().split('T')[0];
    },
    
    // Calculate Local Sidereal Time
    calculateLST: (date, longitude) => {
        // Simplified LST calculation
        const jd = Utils.dateToJulianDay(date);
        const T = (jd - 2451545.0) / 36525.0;
        
        // Greenwich Mean Sidereal Time at 0h UT
        let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 
                   0.000387933 * T * T - T * T * T / 38710000.0;
        
        // Add hours since midnight
        const hours = date.getUTCHours() + date.getUTCMinutes()/60.0 + date.getUTCSeconds()/3600.0;
        gmst += 15.0 * hours;
        
        // Convert to Local Sidereal Time
        let lst = gmst + longitude;
        
        // Normalize to 0-360 degrees
        lst = Utils.normalizeAngle(lst);
        
        // Convert to hours
        return lst / 15.0;
    },
    
    dateToJulianDay: (date) => {
        return (date.getTime() / 86400000.0) + 2440587.5;
    },
    
    // Angle normalization
    normalizeAngle: (angle) => {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    },
    
    normalizeHours: (hours) => {
        while (hours < 0) hours += 24;
        while (hours >= 24) hours -= 24;
        return hours;
    },
    
    // Calculate altitude and azimuth
    calculateAltAz: (ra, dec, lst, latitude) => {
        const ha = Utils.normalizeHours(lst - ra) * 15; // Hour angle in degrees
        const haRad = Utils.degreesToRadians(ha);
        const decRad = Utils.degreesToRadians(dec);
        const latRad = Utils.degreesToRadians(latitude);
        
        // Altitude calculation
        const sinAlt = Math.sin(decRad) * Math.sin(latRad) + 
                      Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
        const alt = Utils.radiansToDegrees(Math.asin(sinAlt));
        
        // Azimuth calculation
        const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / 
                     (Math.cos(latRad) * Math.cos(Utils.degreesToRadians(alt)));
        let az = Utils.radiansToDegrees(Math.acos(Math.max(-1, Math.min(1, cosAz))));
        
        if (Math.sin(haRad) > 0) {
            az = 360 - az;
        }
        
        return { altitude: alt, azimuth: az };
    },
    
    // Calculate airmass
    calculateAirmass: (altitude) => {
        if (altitude <= 0) return 0;
        return 1.0 / Math.sin(Utils.degreesToRadians(altitude));
    },
    
    // Angular separation between two points
    angularSeparation: (ra1, dec1, ra2, dec2) => {
        const dra = (ra2 - ra1) * 15 * Math.cos(Utils.degreesToRadians(dec1)); // Convert RA to degrees and apply cos(dec)
        const ddec = dec2 - dec1;
        return Math.sqrt(dra * dra + ddec * ddec);
    },
    
    // Photometry utilities
    magToFlux: (mag, band) => {
        const zeroPoint = CONSTANTS.ZERO_POINT_PHOTONS[band] || CONSTANTS.ZERO_POINT_PHOTONS['V'];
        return zeroPoint * Math.pow(10, -0.4 * mag);
    },
    
    applyExtinction: (flux, band, airmass) => {
        const k = CONSTANTS.EXTINCTION_COEFF[band] || CONSTANTS.EXTINCTION_COEFF['V'];
        return flux * Math.pow(10, -0.4 * k * airmass);
    },
    
    poissonRandom: (lambda) => {
        // Generate Poisson random number using Knuth's algorithm
        if (lambda < 30) {
            const L = Math.exp(-lambda);
            let k = 0;
            let p = 1;
            do {
                k++;
                p *= Math.random();
            } while (p > L);
            return k - 1;
        } else {
            // Use normal approximation for large lambda
            return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * Utils.normalRandom()));
        }
    },
    
    normalRandom: () => {
        // Box-Muller transformation
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },
    
    // Blackbody spectrum
    blackbody: (wavelengthAngstroms, temperature) => {
        const wavelengthMeters = wavelengthAngstroms * 1e-10;
        const h = CONSTANTS.H_PLANCK;
        const c = CONSTANTS.C_LIGHT;
        const k = CONSTANTS.K_BOLTZMANN;
        
        const exponential = Math.exp((h * c) / (wavelengthMeters * k * temperature));
        return (2 * h * c * c) / (Math.pow(wavelengthMeters, 5) * (exponential - 1));
    },
    
    // Generate stellar spectrum - ENHANCED with Jacoby Atlas
    generateStellarSpectrum: async function(spectralType, wavelengths) {
        // Try to load spectral library if not already loaded
        if (!this.spectralLibrary) {
            await this.loadSpectralLibrary();
        }
        
        // If we have the spectral library, use it
        if (this.spectralLibrary) {
            const spectralData = this.findSpectralData(spectralType);
            if (spectralData) {
                console.log(`Using Jacoby Atlas spectrum for ${spectralType} (actual: ${spectralData.actualType})`);
                
                // Interpolate the atlas spectrum to match requested wavelengths
                const interpolatedSpectrum = this.interpolateSpectrum(
                    spectralData.wavelength, 
                    spectralData.spectrum, 
                    wavelengths
                );
                
                // Normalize
                const maxFlux = Math.max(...interpolatedSpectrum);
                return interpolatedSpectrum.map(f => f / maxFlux);
            }
        }
        
        // Fallback to blackbody if spectral library not available
        console.log(`Falling back to blackbody spectrum for ${spectralType}`);
        const baseTemp = this.getTemperatureFromSpectralType(spectralType);
        const spectrum = wavelengths.map(w => this.blackbody(w, baseTemp));
        
        // Normalize
        const maxFlux = Math.max(...spectrum);
        return spectrum.map(f => f / maxFlux);
    },
    
    // Interpolate spectrum to different wavelength grid
    interpolateSpectrum: function(sourceWavelengths, sourceSpectrum, targetWavelengths) {
        const interpolated = [];
        
        for (let targetWave of targetWavelengths) {
            // Find surrounding points
            let i = 0;
            while (i < sourceWavelengths.length - 1 && sourceWavelengths[i] < targetWave) {
                i++;
            }
            
            if (i === 0) {
                // Before first point
                interpolated.push(sourceSpectrum[0]);
            } else if (i >= sourceWavelengths.length) {
                // After last point
                interpolated.push(sourceSpectrum[sourceSpectrum.length - 1]);
            } else {
                // Linear interpolation
                const w1 = sourceWavelengths[i - 1];
                const w2 = sourceWavelengths[i];
                const f1 = sourceSpectrum[i - 1];
                const f2 = sourceSpectrum[i];
                
                const fraction = (targetWave - w1) / (w2 - w1);
                const interpolatedFlux = f1 + fraction * (f2 - f1);
                interpolated.push(interpolatedFlux);
            }
        }
        
        return interpolated;
    },
    
    getTemperatureFromSpectralType: (spectralType) => {
        // Simplified temperature mapping
        if (!spectralType || spectralType === '') return 5800; // Default to solar temperature
        
        const type = spectralType.charAt(0);
        const subtype = parseInt(spectralType.charAt(1)) || 0;
        
        const tempMap = {
            'O': 45000 - subtype * 2000,
            'B': 25000 - subtype * 2000,
            'A': 9500 - subtype * 500,
            'F': 7200 - subtype * 300,
            'G': 6000 - subtype * 200,
            'K': 5000 - subtype * 300,
            'M': 3500 - subtype * 200
        };
        
        return tempMap[type] || 5800; // Default to solar temperature
    },
    
    // Generate galaxy spectrum with redshift
    generateGalaxySpectrum: (redshift, wavelengths) => {
        const restWavelengths = wavelengths.map(w => w / (1 + redshift));
        
        // Base continuum (blackbody at 4000K)
        const continuum = restWavelengths.map(w => Utils.blackbody(w, 4000));
        const maxContinuum = Math.max(...continuum);
        const normalizedContinuum = continuum.map(c => c / maxContinuum);
        
        // Add absorption lines
        const spectrum = normalizedContinuum.map((flux, i) => {
            const restWave = restWavelengths[i];
            let absorption = 1.0;
            
            CONSTANTS.GALAXY_LINES.forEach(line => {
                const sigma = line.fwhm / (2 * Math.sqrt(2 * Math.log(2)));
                const tau = line.depth * Math.exp(-0.5 * Math.pow((restWave - line.wavelength) / sigma, 2));
                absorption *= Math.exp(-tau);
            });
            
            return flux * absorption;
        });
        
        return spectrum;
    },
    
    // Canvas drawing utilities
    clearCanvas: (canvas) => {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    
    drawStar: (ctx, x, y, magnitude, color = '#ffffff') => {
        const radius = Math.max(1, 8 - magnitude);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    },
    
    drawGalaxy: (ctx, x, y, size, type) => {
        // Simple galaxy representation
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.7, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.stroke();
    },
    
    drawCrosshair: (ctx, x, y, size = 15) => {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x + size, y);
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y + size);
        ctx.stroke();
    },
    
    drawText: (ctx, text, x, y, color = '#ffff00', font = '12px Arial') => {
        ctx.fillStyle = color;
        ctx.font = font;
        ctx.fillText(text, x, y);
    },
    
    // Generate background stars for a field
    generateBackgroundStars: (centerRA, centerDec, fovDegrees, count = 1000) => {
        const stars = [];
        const halfFov = fovDegrees / 2;
        
        for (let i = 0; i < count; i++) {
            // Random position within the field
            const ra = centerRA + (Math.random() - 0.5) * fovDegrees / 15; // Convert to hours
            const dec = centerDec + (Math.random() - 0.5) * fovDegrees;
            
            // Generate magnitude using luminosity function
            const u = Math.random();
            const xMin = Math.pow(10, 0.6 * BACKGROUND_STARS.MAG_MIN);
            const xMax = Math.pow(10, 0.6 * BACKGROUND_STARS.MAG_MAX);
            const x = u * (xMax - xMin) + xMin;
            const magnitude = Math.log10(x) / 0.6;
            
            stars.push({ ra, dec, magnitude });
        }
        
        return stars;
    }
};

// Make sure Utils is globally available
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}
