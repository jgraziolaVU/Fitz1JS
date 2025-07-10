// Photometer instrument controller - Updated for new layout

class PhotometerController {
    constructor(telescopeController) {
        this.telescope = telescopeController;
        this.canvas = document.getElementById('photometer-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Photometer settings
        this.currentFilter = 'V';
        this.apertureIndex = 2; // Start with 20"
        this.integrationIndex = 2; // Start with 1.0s
        this.atmosphereEnabled = true;
        
        // Integration state
        this.integrating = false;
        this.integrationTimer = null;
        this.integrationProgress = 0;
        this.observationCount = 0;
        
        this.init();
    }
    
    init() {
        console.log('Initializing photometer controller...');
        this.setupEventListeners();
        this.updateControls();
        this.updateApertureView();
    }
    
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle filter selection (multiple filters can be active)
                btn.classList.toggle('active');
                
                // Set current filter to first active filter
                const activeFilters = document.querySelectorAll('.filter-btn.active');
                if (activeFilters.length > 0) {
                    this.currentFilter = activeFilters[0].dataset.filter;
                }
                this.updateApertureView();
            });
        });
        
        // Aperture control
        const apertureBtn = document.getElementById('aperture-btn');
        if (apertureBtn) {
            apertureBtn.addEventListener('click', () => {
                this.cycleAperture();
            });
        }
        
        // Integration time control
        const integrationBtn = document.getElementById('integration-btn');
        if (integrationBtn) {
            integrationBtn.addEventListener('click', () => {
                this.cycleIntegrationTime();
            });
        }
        
        // Atmosphere toggle
        const atmosphereBtn = document.getElementById('atmosphere-btn');
        if (atmosphereBtn) {
            atmosphereBtn.addEventListener('click', () => {
                this.toggleAtmosphere();
            });
        }
        
        // Start integration
        const startBtn = document.getElementById('start-integration');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startIntegration();
            });
        }
    }
    
    updateControls() {
        const aperture = CONSTANTS.APERTURE_SIZES[this.apertureIndex];
        const integrationTime = CONSTANTS.INTEGRATION_TIMES[this.integrationIndex];
        
        const apertureBtn = document.getElementById('aperture-btn');
        const integrationBtn = document.getElementById('integration-btn');
        const atmosphereBtn = document.getElementById('atmosphere-btn');
        
        if (apertureBtn) {
            apertureBtn.textContent = `📏 ${aperture}"`;
        }
        if (integrationBtn) {
            integrationBtn.textContent = `⏱️ ${integrationTime}s`;
        }
        if (atmosphereBtn) {
            atmosphereBtn.textContent = `Atmosphere: ${this.atmosphereEnabled ? 'On' : 'Off'}`;
            atmosphereBtn.classList.toggle('active', this.atmosphereEnabled);
        }
    }
    
    cycleAperture() {
        this.apertureIndex = (this.apertureIndex + 1) % CONSTANTS.APERTURE_SIZES.length;
        this.updateControls();
        this.updateApertureView();
    }
    
    cycleIntegrationTime() {
        this.integrationIndex = (this.integrationIndex + 1) % CONSTANTS.INTEGRATION_TIMES.length;
        this.updateControls();
    }
    
    toggleAtmosphere() {
        this.atmosphereEnabled = !this.atmosphereEnabled;
        this.updateControls();
    }
    
    updateApertureView() {
        if (!this.telescope.currentField || !this.canvas) return;
        
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        Utils.clearCanvas(canvas);
        
        // 5 arcminute field of view for photometer
        const fov = 5.0 / 60.0; // degrees
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
                const size = Math.max(1, 8 - star.magnitude);
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
                    const size = Math.max(2, 12 - obj.mag);
                    Utils.drawStar(ctx, x, y, obj.mag, '#ffffff');
                } else {
                    // Galaxy (scaled up 2x like in original)
                    const size = Math.max(4, 20 - obj.mag);
                    Utils.drawGalaxy(ctx, x, y, size, obj.code);
                }
            }
        });
        
        // Draw aperture circle
        const aperture = CONSTANTS.APERTURE_SIZES[this.apertureIndex];
        const apertureRadius = (aperture / 3600.0) * pixelsPerDegree; // Convert arcsec to pixels
        
        ctx.strokeStyle = '#00d4ff'; // Use modern accent color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, apertureRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw border
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        // Update aperture contents
        this.updateApertureContents();
    }
    
    updateApertureContents() {
        const aperture = CONSTANTS.APERTURE_SIZES[this.apertureIndex];
        const objectsInAperture = this.telescope.catalog.findObjectsInAperture(
            this.telescope.centerRA,
            this.telescope.centerDec,
            aperture
        );
        
        const apertureInfo = document.getElementById('aperture-objects');
        
        if (apertureInfo) {
            if (objectsInAperture.length === 0) {
                apertureInfo.textContent = 'Object SKY is within the aperture';
            } else {
                const objectList = objectsInAperture.map(obj => {
                    const type = obj.objType === 0 ? 'Star' : 'Galaxy';
                    return `Object ${obj.name} (${type}) is within the aperture`;
                }).join(', ');
                apertureInfo.textContent = objectList;
            }
        }
    }
    
    startIntegration() {
        if (this.integrating) return;
        
        console.log('Starting photometer integration...');
        this.integrating = true;
        this.integrationProgress = 0;
        
        // Update status indicator
        const statusDot = document.getElementById('photometer-status');
        if (statusDot) {
            statusDot.classList.remove('inactive');
        }
        
        // Disable controls during integration
        document.querySelectorAll('.filter-btn, #aperture-btn, #integration-btn, #atmosphere-btn, #start-integration')
            .forEach(el => el.disabled = true);
        
        const integrationTime = CONSTANTS.INTEGRATION_TIMES[this.integrationIndex];
        const updateInterval = 100; // Update every 100ms
        const totalSteps = (integrationTime * 1000) / updateInterval;
        let currentStep = 0;
        
        this.integrationTimer = setInterval(() => {
            currentStep++;
            this.integrationProgress = (currentStep / totalSteps) * 100;
            
            // Update progress bar
            const progressFill = document.querySelector('#photometer-progress, .progress-fill');
            if (progressFill) {
                progressFill.style.width = `${this.integrationProgress}%`;
            }
            
            if (currentStep >= totalSteps) {
                this.completeIntegration();
            }
        }, updateInterval);
    }
    
    completeIntegration() {
        this.integrating = false;
        clearInterval(this.integrationTimer);
        this.integrationTimer = null;
        
        console.log('Photometer integration complete');
        
        // Update status indicator
        const statusDot = document.getElementById('photometer-status');
        if (statusDot) {
            statusDot.classList.add('inactive');
        }
        
        // Re-enable controls
        document.querySelectorAll('.filter-btn, #aperture-btn, #integration-btn, #atmosphere-btn, #start-integration')
            .forEach(el => el.disabled = false);
        
        // Reset progress bar
        const progressFill = document.querySelector('#photometer-progress, .progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        // Perform photometry
        this.performPhotometry();
    }
    
    performPhotometry() {
        const aperture = CONSTANTS.APERTURE_SIZES[this.apertureIndex];
        const integrationTime = CONSTANTS.INTEGRATION_TIMES[this.integrationIndex];
        const pointing = this.telescope.getCurrentPointing();
        
        // Calculate airmass if atmosphere is enabled
        let airmass = 1.0;
        if (this.atmosphereEnabled && pointing.telescope) {
            airmass = Utils.calculateAirmass(pointing.altaz.altitude);
        }
        
        // Find objects in aperture
        const objectsInAperture = this.telescope.catalog.findObjectsInAperture(
            pointing.ra,
            pointing.dec,
            aperture
        );
        
        // Perform photometry simulation
        const results = this.simulatePhotometry(
            objectsInAperture,
            aperture,
            integrationTime,
            airmass,
            pointing.telescope
        );
        
        // Display results
        this.displayResults(results, airmass);
    }
    
    simulatePhotometry(objects, apertureArcsec, integrationTime, airmass, telescope) {
        const results = {};
        const telescopeDiameter = telescope ? telescope.diameter : CONSTANTS.DEFAULT_TELESCOPE_DIAM;
        const telescopeArea = Math.PI * (telescopeDiameter / 2) ** 2; // m²
        const apertureArea = Math.PI * (apertureArcsec / 3600 * Math.PI / 180) ** 2; // steradians (approximation)
        
        // Sky background
        if (this.atmosphereEnabled) {
            const skyMag = CONSTANTS.SKY_BRIGHTNESS[this.currentFilter];
            const skyFlux = Utils.magToFlux(skyMag, this.currentFilter);
            const skyFluxExtinct = Utils.applyExtinction(skyFlux, this.currentFilter, airmass);
            const skyPhotons = skyFluxExtinct * telescopeArea * integrationTime * apertureArea * 1e10; // scaling factor
            const skyCounts = Utils.poissonRandom(skyPhotons);
            
            if (objects.length === 0) {
                results['SKY'] = skyCounts;
            }
        }
        
        // Object photometry
        objects.forEach(obj => {
            const objMag = obj.getMagnitude(this.currentFilter);
            const objFlux = Utils.magToFlux(objMag, this.currentFilter);
            const objFluxExtinct = this.atmosphereEnabled ? 
                Utils.applyExtinction(objFlux, this.currentFilter, airmass) : objFlux;
            
            // Calculate photon counts
            const objPhotons = objFluxExtinct * telescopeArea * integrationTime;
            const objCounts = Utils.poissonRandom(objPhotons);
            
            // Add sky background per object
            let totalCounts = objCounts;
            if (this.atmosphereEnabled) {
                const skyMag = CONSTANTS.SKY_BRIGHTNESS[this.currentFilter];
                const skyFlux = Utils.magToFlux(skyMag, this.currentFilter);
                const skyFluxExtinct = Utils.applyExtinction(skyFlux, this.currentFilter, airmass);
                const skyPhotons = skyFluxExtinct * telescopeArea * integrationTime * apertureArea * 1e10;
                const skyCounts = Utils.poissonRandom(skyPhotons);
                totalCounts += skyCounts;
            }
            
            // Add scintillation noise if atmosphere enabled
            if (this.atmosphereEnabled && telescope) {
                const sigma = 0.09 * Math.pow(telescopeDiameter, -2/3) * Math.pow(airmass, 7/4) * 
                             Math.exp(-telescope.altitude / 8000) * Math.pow(integrationTime, -0.5);
                const scintNoise = Utils.normalRandom() * sigma * objCounts;
                totalCounts += scintNoise;
            }
            
            results[obj.name] = Math.max(0, Math.round(totalCounts));
        });
        
        return results;
    }
    
    displayResults(results, airmass) {
        this.observationCount++;
        const aperture = CONSTANTS.APERTURE_SIZES[this.apertureIndex];
        const integrationTime = CONSTANTS.INTEGRATION_TIMES[this.integrationIndex];
        
        const output = document.getElementById('photometry-output');
        if (!output) return;
        
        Object.entries(results).forEach(([objName, counts]) => {
            const line = `${this.observationCount}. ${objName}: filter=${this.currentFilter}, aperture=${aperture}", t=${integrationTime}s, airmass=${airmass.toFixed(2)}, counts=${counts.toLocaleString()}`;
            
            const div = document.createElement('div');
            div.textContent = line;
            div.style.fontSize = '12px';
            div.style.marginBottom = '2px';
            output.appendChild(div);
        });
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
        
        // Update results summary
        const resultsEl = document.getElementById('photometer-results');
        if (resultsEl) {
            const totalCounts = Object.values(results).reduce((sum, counts) => sum + counts, 0);
            resultsEl.textContent = `Latest: ${totalCounts} counts (${this.currentFilter} filter)`;
        }
    }
}
