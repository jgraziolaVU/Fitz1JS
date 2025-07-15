// Spectrometer instrument controller - Enhanced with Jacoby Atlas

class SpectrometerController {
    constructor(telescopeController) {
        this.telescope = telescopeController;
        this.canvas = document.getElementById('spectrometer-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.spectrumCanvas = document.getElementById('spectrum-canvas');
        this.spectrumCtx = this.spectrumCanvas ? this.spectrumCanvas.getContext('2d') : null;
        
        // Spectrometer state
        this.currentObject = null;
        this.integrating = false;
        this.integrationTimer = null;
        this.elapsed = 0;
        this.wavelengths = [];
        this.counts = [];
        this.rates = [];
        this.plotMode = 'scatter'; // 'scatter' during integration, 'line' after stop
        this.spectralLibraryLoaded = false;
        
        this.init();
    }
    
    async init() {
        console.log('Initializing spectrometer controller...');
        
        if (!this.canvas || !this.spectrumCanvas) {
            console.error('Spectrometer canvases not found!');
            return;
        }
        
        // Load spectral library
        await this.loadSpectralLibrary();
        
        this.setupEventListeners();
        this.generateWavelengthGrid();
        this.updateSpectrometerView();
        this.clearSpectrum();
    }
    
    async loadSpectralLibrary() {
        try {
            console.log('Loading Jacoby Atlas for spectrometer...');
            await Utils.loadSpectralLibrary();
            this.spectralLibraryLoaded = true;
            console.log('Spectral library loaded successfully');
        } catch (error) {
            console.warn('Could not load spectral library, using fallback:', error);
            this.spectralLibraryLoaded = false;
        }
    }
    
    setupEventListeners() {
        // Start integration
        const startBtn = document.getElementById('start-spectrum');
        if (startBtn) {
            console.log('Setting up start button listener');
            startBtn.addEventListener('click', () => {
                console.log('Start button clicked');
                this.startIntegration();
            });
        } else {
            console.error('Start spectrum button not found!');
        }
        
        // Stop integration
        const stopBtn = document.getElementById('stop-spectrum');
        if (stopBtn) {
            console.log('Setting up stop button listener');
            stopBtn.addEventListener('click', () => {
                console.log('Stop button clicked');
                this.stopIntegration();
            });
        } else {
            console.error('Stop spectrum button not found!');
        }
        
        // Canvas click for spectrum analysis
        if (this.spectrumCanvas) {
            this.spectrumCanvas.addEventListener('click', (event) => {
                this.handleSpectrumClick(event);
            });
        }
    }
    
    generateWavelengthGrid() {
        this.wavelengths = [];
        for (let w = CONSTANTS.SPECTRUM_MIN_WAVE; w <= CONSTANTS.SPECTRUM_MAX_WAVE; w++) {
            this.wavelengths.push(w);
        }
        this.counts = new Array(this.wavelengths.length).fill(0);
        console.log(`Generated wavelength grid: ${this.wavelengths.length} points from ${CONSTANTS.SPECTRUM_MIN_WAVE} to ${CONSTANTS.SPECTRUM_MAX_WAVE} Å`);
    }
    
    updateSpectrometerView() {
        if (!this.telescope.currentField || !this.canvas || !this.ctx) return;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        Utils.clearCanvas(canvas);
        
        // Narrow field of view for spectrometer
        const fov = CONSTANTS.SPEC_FOV_DEG;
        const pixelsPerDegree = width / fov;
        const centerX = width / 2;
        const centerY = height / 2;
        const cosDec = Math.cos(Utils.degreesToRadians(this.telescope.centerDec));
        
        // Draw background stars
        this.telescope.catalog.backgroundStars.forEach(star => {
            const dx = (star.ra - this.telescope.centerRA) * 15 * cosDec;
            const dy = star.dec - this.telescope.centerDec;
            
            if (Math.abs(dx) <= fov/2 && Math.abs(dy) <= fov/2) {
                const x = centerX - dx * pixelsPerDegree;
                const y = centerY - dy * pixelsPerDegree;
                Utils.drawStar(ctx, x, y, star.magnitude, '#ffff88');
            }
        });
        
        // Draw catalog objects
        this.telescope.catalog.objects.forEach(obj => {
            const dx = (obj.ra - this.telescope.centerRA) * 15 * cosDec;
            const dy = obj.dec - this.telescope.centerDec;
            
            if (Math.abs(dx) <= fov/2 && Math.abs(dy) <= fov/2) {
                const x = centerX - dx * pixelsPerDegree;
                const y = centerY - dy * pixelsPerDegree;
                
                if (obj.objType === 0) {
                    // Star
                    Utils.drawStar(ctx, x, y, obj.mag, '#ffffff');
                } else {
                    // Galaxy (2x size)
                    const size = Math.max(6, 24 - obj.mag);
                    Utils.drawGalaxy(ctx, x, y, size, obj.code);
                }
            }
        });
        
        // Draw slit overlay
        const slitWidthPx = (CONSTANTS.SLIT_WIDTH_DEG / fov) * width;
        const slitHeightPx = (CONSTANTS.SLIT_HEIGHT_DEG / fov) * height;
        
        ctx.strokeStyle = '#00d4ff'; // Modern accent color
        ctx.lineWidth = 2;
        const slitLeft = centerX - slitWidthPx / 2;
        const slitRight = centerX + slitWidthPx / 2;
        const slitTop = centerY - slitHeightPx / 2;
        const slitBottom = centerY + slitHeightPx / 2;
        
        ctx.beginPath();
        ctx.moveTo(slitLeft, slitTop);
        ctx.lineTo(slitLeft, slitBottom);
        ctx.moveTo(slitRight, slitTop);
        ctx.lineTo(slitRight, slitBottom);
        ctx.stroke();
        
        // Draw border
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        // Update slit contents
        this.updateSlitContents();
    }
    
    updateSlitContents() {
        console.log('Updating slit contents...');
        
        // Use more generous slit dimensions for detection
        const slitWidthDeg = CONSTANTS.SLIT_WIDTH_DEG * 10; // Make slit 10x wider for detection
        const slitHeightDeg = CONSTANTS.SLIT_HEIGHT_DEG * 5; // Make slit 5x taller for detection
        
        const objectsInSlit = this.telescope.catalog.findObjectsInSlit(
            this.telescope.centerRA,
            this.telescope.centerDec,
            slitWidthDeg,
            slitHeightDeg
        );
        
        const slitStatus = document.getElementById('slit-status');
        
        if (slitStatus) {
            if (objectsInSlit.length === 0) {
                slitStatus.textContent = 'No object in slit';
                slitStatus.style.color = '#a1a1aa';
                this.currentObject = null;
                console.log('No objects found in slit');
            } else {
                // Find the nearest object to slit center
                let nearest = objectsInSlit[0];
                let minDist = Infinity;
                
                objectsInSlit.forEach(obj => {
                    const dist = Utils.angularSeparation(
                        this.telescope.centerRA, this.telescope.centerDec,
                        obj.ra, obj.dec
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = obj;
                    }
                });
                
                const type = nearest.objType === 0 ? 'Star' : 'Galaxy';
                slitStatus.textContent = `Object ${nearest.name} (${type}) is within the slit`;
                slitStatus.style.color = '#10b981';
                this.currentObject = nearest;
                console.log(`Found object in slit: ${nearest.name} (${type})`);
            }
        }
    }
    
    startIntegration() {
        console.log('startIntegration called');
        console.log('Current object:', this.currentObject);
        console.log('Currently integrating:', this.integrating);
        
        if (!this.currentObject) {
            console.log('Cannot start integration: No object in slit');
            // Try to update slit contents to see if we can find an object
            this.updateSlitContents();
            if (!this.currentObject) {
                alert('No object in slit. Please slew to an object first.');
                return;
            }
        }
        
        if (this.integrating) {
            console.log('Already integrating, ignoring start request');
            return;
        }
        
        console.log('Starting spectrometer integration for:', this.currentObject.name);
        
        this.integrating = true;
        this.elapsed = 0;
        this.generateSpectrum();
        this.plotMode = 'scatter';
        
        // Update status indicator
        const statusDot = document.getElementById('spectrometer-status');
        if (statusDot) {
            statusDot.classList.remove('inactive');
        }
        
        // Clear previous spectrum
        this.counts.fill(0);
        
        // Start integration timer
        this.integrationTimer = setInterval(() => {
            this.updateIntegration();
        }, 250); // Update every 250ms
        
        console.log('Integration started successfully');
    }
    
    stopIntegration() {
        if (!this.integrating) {
            console.log('Not currently integrating');
            return;
        }
        
        console.log('Stopping spectrometer integration');
        
        this.integrating = false;
        if (this.integrationTimer) {
            clearInterval(this.integrationTimer);
            this.integrationTimer = null;
        }
        
        // Update status indicator
        const statusDot = document.getElementById('spectrometer-status');
        if (statusDot) {
            statusDot.classList.add('inactive');
        }
        
        this.plotMode = 'line';
        this.plotSpectrum();
        
        console.log('Integration stopped');
    }
    
    // ENHANCED: Generate spectrum using Jacoby Atlas
    async generateSpectrum() {
        if (!this.currentObject) {
            console.error('Cannot generate spectrum: no current object');
            return;
        }
        
        console.log('Generating spectrum for:', this.currentObject.name);
        
        const obj = this.currentObject;
        const telescopeDiam = this.telescope.currentTelescope ? 
            this.telescope.currentTelescope.diameter : CONSTANTS.DEFAULT_TELESCOPE_DIAM;
        
        let relativeFlux;
        
        if (obj.objType === 1) {
            // Galaxy spectrum with redshift
            console.log('Generating galaxy spectrum with redshift:', obj.redshift);
            relativeFlux = Utils.generateGalaxySpectrum(obj.redshift, this.wavelengths);
        } else {
            // Stellar spectrum - NOW USING JACOBY ATLAS
            console.log('Generating stellar spectrum for spectral type:', obj.specType);
            console.log('Spectral library loaded:', this.spectralLibraryLoaded);
            
            relativeFlux = await Utils.generateStellarSpectrum(obj.specType, this.wavelengths);
        }
        
        // Calculate photon arrival rates
        const telescopeArea = Math.PI * (telescopeDiam / 2) ** 2;
        
        // Use galaxy magnitude scaling factor from original (0.45)
        const effectiveMag = obj.objType === 1 ? obj.mag * 0.45 : obj.mag;
        
        // Convert magnitude to flux (simplified)
        const baseFlux = Math.pow(10, -0.4 * (effectiveMag + 21.10)); // erg/s/cm²/Å
        const fluxSI = baseFlux * 1e-3; // J/s/m²/Å
        
        this.rates = relativeFlux.map((flux, i) => {
            const wavelengthM = this.wavelengths[i] * 1e-10;
            const photonEnergy = (CONSTANTS.H_PLANCK * CONSTANTS.C_LIGHT) / wavelengthM;
            const rate = flux * (fluxSI / photonEnergy) * telescopeArea;
            return Math.max(0.01, rate); // Minimum rate to ensure some signal
        });
        
        console.log(`Generated spectrum rates: min=${Math.min(...this.rates).toFixed(3)}, max=${Math.max(...this.rates).toFixed(3)}`);
        
        // Log spectral information
        if (this.spectralLibraryLoaded && obj.objType === 0) {
            console.log(`✨ Using high-quality Jacoby Atlas spectrum for ${obj.specType}`);
        }
    }
    
    updateIntegration() {
        this.elapsed++;
        
        // Add new photon counts
        for (let i = 0; i < this.counts.length; i++) {
            const newCounts = Utils.poissonRandom(this.rates[i]);
            this.counts[i] += newCounts;
        }
        
        // Update display
        this.plotSpectrum();
        this.updateStatus();
    }
    
    plotSpectrum() {
        if (!this.spectrumCanvas || !this.spectrumCtx) return;
        
        const canvas = this.spectrumCanvas;
        const ctx = this.spectrumCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, width, height);
        
        if (this.wavelengths.length === 0) return;
        
        // Set up plot area
        const margin = { left: 60, right: 20, top: 40, bottom: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;
        
        const minWave = Math.min(...this.wavelengths);
        const maxWave = Math.max(...this.wavelengths);
        const maxCounts = Math.max(...this.counts) || 1;
        
        // Draw axes
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // X-axis
        ctx.moveTo(margin.left, height - margin.bottom);
        ctx.lineTo(width - margin.right, height - margin.bottom);
        // Y-axis
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, height - margin.bottom);
        ctx.stroke();
        
        // Labels
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Wavelength (Å)', width / 2, height - 10);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Photon Counts', 0, 0);
        ctx.restore();
        
        // Title with spectral library indicator
        if (this.currentObject) {
            const objType = this.currentObject.objType === 0 ? 'star' : 'galaxy';
            const libraryIndicator = this.spectralLibraryLoaded && this.currentObject.objType === 0 ? ' ✨' : '';
            const title = `${this.currentObject.name} (${objType}) V = ${this.currentObject.mag.toFixed(2)}${libraryIndicator}`;
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(title, width / 2, 20);
        }
        
        // Plot data
        if (this.plotMode === 'scatter') {
            // Scatter plot during integration
            ctx.fillStyle = '#0066cc';
            for (let i = 0; i < this.wavelengths.length; i++) {
                if (this.counts[i] > 0) {
                    const x = margin.left + (this.wavelengths[i] - minWave) / (maxWave - minWave) * plotWidth;
                    const y = height - margin.bottom - (this.counts[i] / maxCounts) * plotHeight;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        } else {
            // Line plot after stopping
            ctx.strokeStyle = '#0066cc';
            ctx.lineWidth = 1;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < this.wavelengths.length; i++) {
                const x = margin.left + (this.wavelengths[i] - minWave) / (maxWave - minWave) * plotWidth;
                const y = height - margin.bottom - (this.counts[i] / maxCounts) * plotHeight;
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // Draw tick marks and labels
        this.drawAxisTicks(ctx, margin, plotWidth, plotHeight, width, height, minWave, maxWave, maxCounts);
    }
    
    drawAxisTicks(ctx, margin, plotWidth, plotHeight, width, height, minWave, maxWave, maxCounts) {
        ctx.fillStyle = '#000000';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        // X-axis ticks
        const xTicks = 5;
        for (let i = 0; i <= xTicks; i++) {
            const wave = minWave + (maxWave - minWave) * i / xTicks;
            const x = margin.left + i * plotWidth / xTicks;
            
            ctx.beginPath();
            ctx.moveTo(x, height - margin.bottom);
            ctx.lineTo(x, height - margin.bottom + 5);
            ctx.stroke();
            
            ctx.fillText(wave.toFixed(0), x, height - margin.bottom + 20);
        }
        
        // Y-axis ticks
        ctx.textAlign = 'right';
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const counts = maxCounts * i / yTicks;
            const y = height - margin.bottom - i * plotHeight / yTicks;
            
            ctx.beginPath();
            ctx.moveTo(margin.left - 5, y);
            ctx.lineTo(margin.left, y);
            ctx.stroke();
            
            ctx.fillText(counts.toFixed(0), margin.left - 10, y + 3);
        }
    }
    
    updateStatus() {
        const totalCounts = this.counts.reduce((sum, count) => sum + count, 0);
        const nonZeroCounts = this.counts.filter(count => count > 0);
        const meanSNR = nonZeroCounts.length > 0 ? 
            nonZeroCounts.reduce((sum, count) => sum + Math.sqrt(count), 0) / nonZeroCounts.length : 0;
        
        const statusEl = document.getElementById('spectrum-status');
        if (statusEl) {
            statusEl.textContent = 
                `Time: ${this.elapsed}s • Counts: ${totalCounts} • Mean SNR: ${meanSNR.toFixed(2)}`;
        }
    }
    
    clearSpectrum() {
        this.counts.fill(0);
        this.elapsed = 0;
        this.plotSpectrum();
        this.updateStatus();
    }
    
    handleSpectrumClick(event) {
        if (this.plotMode !== 'line') return;
        
        const canvas = this.spectrumCanvas;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const margin = { left: 60, right: 20, top: 40, bottom: 60 };
        const plotWidth = canvas.width - margin.left - margin.right;
        const plotHeight = canvas.height - margin.top - margin.bottom;
        
        // Convert click position to wavelength and counts
        const minWave = Math.min(...this.wavelengths);
        const maxWave = Math.max(...this.wavelengths);
        const maxCounts = Math.max(...this.counts) || 1;
        
        const wavelength = minWave + (x - margin.left) / plotWidth * (maxWave - minWave);
        const counts = maxCounts * (1 - (y - margin.top) / plotHeight);
        
        // Clear previous markers
        this.plotSpectrum();
        
        // Draw click marker
        const ctx = this.spectrumCtx;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, canvas.height - margin.bottom);
        ctx.stroke();
        
        // Plus sign
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();
        
        // Coordinates text
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillRect(10, 30, 200, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 32, 196, 16);
        ctx.fillStyle = '#000000';
        ctx.fillText(`${wavelength.toFixed(1)} Å, ${counts.toFixed(1)} counts`, 15, 44);
    }
}
