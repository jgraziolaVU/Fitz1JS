// Main telescope control class

class TelescopeController {
    constructor() {
        this.centerRA = 0.0;           // hours
        this.centerDec = 0.0;          // degrees
        this.currentTelescope = null;
        this.currentField = null;
        this.catalog = new Catalog();
        this.currentDateTime = new Date();
        
        // Slewing parameters
        this.slewSpeedIndex = 2;       // Start with medium speed
        this.slewActive = false;
        this.slewDirection = { dx: 0, dy: 0 };
        this.slewTimer = null;
        
        // Auto-slew parameters
        this.autoSlewTarget = null;
        this.autoSlewActive = false;
        
        // Canvas references
        this.finderCanvas = null;
        this.finderCtx = null;
        
        // Update timer
        this.updateTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.startUpdateTimer();
        this.updateDisplay();
    }
    
    setupCanvas() {
        this.finderCanvas = document.getElementById('finder-canvas');
        this.finderCtx = this.finderCanvas.getContext('2d');
        
        // Make canvas responsive
        this.finderCanvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });
    }
    
    setupEventListeners() {
        // Selection buttons
        document.getElementById('select-telescope').addEventListener('click', () => {
            this.showTelescopeSelection();
        });
        
        document.getElementById('select-field').addEventListener('click', () => {
            this.showFieldSelection();
        });
        
        document.getElementById('select-datetime').addEventListener('click', () => {
            this.showDateTimeSelection();
        });
        
        // Speed control
        document.getElementById('speed-btn').addEventListener('click', () => {
            this.cycleSpeed();
        });
        
        // Direction controls
        const directions = ['north', 'south', 'east', 'west'];
        directions.forEach(dir => {
            const btn = document.getElementById(`${dir}-btn`);
            btn.addEventListener('mousedown', () => this.startSlewing(dir));
            btn.addEventListener('mouseup', () => this.stopSlewing());
            btn.addEventListener('mouseleave', () => this.stopSlewing());
        });
        
        // Abort button
        document.getElementById('abort-btn').addEventListener('click', () => {
            this.abortSlewing();
        });
        
        // Instrument controls
        document.getElementById('open-photometer').addEventListener('click', () => {
            this.openPhotometer();
        });
        
        document.getElementById('open-spectrometer').addEventListener('click', () => {
            this.openSpectrometer();
        });
    }
    
    startUpdateTimer() {
        this.updateTimer = setInterval(() => {
            this.currentDateTime = new Date(this.currentDateTime.getTime() + 1000);
            this.updateDisplay();
        }, 1000);
    }
    
    updateDisplay() {
        this.updateTimeDisplay();
        this.updateCoordinateDisplay();
        this.drawFinderView();
        this.updateCatalogTable();
    }
    
    updateTimeDisplay() {
        const date = this.currentDateTime;
        
        document.getElementById('local-date').textContent = `Date: ${Utils.formatDate(date)}`;
        document.getElementById('local-time').textContent = `Local Time: ${Utils.formatTime(date)}`;
        
        if (this.currentTelescope) {
            const lst = Utils.calculateLST(date, this.currentTelescope.longitude);
            const lstFormatted = Utils.formatRA(lst);
            document.getElementById('sidereal-time').textContent = `Sidereal Time: ${lstFormatted}`;
        }
    }
    
    updateCoordinateDisplay() {
        document.getElementById('center-ra').textContent = `RA: ${Utils.formatRA(this.centerRA)}`;
        document.getElementById('center-dec').textContent = `Dec: ${Utils.formatDec(this.centerDec)}`;
        
        if (this.currentTelescope) {
            const lst = Utils.calculateLST(this.currentDateTime, this.currentTelescope.longitude);
            const altAz = Utils.calculateAltAz(this.centerRA, this.centerDec, lst, this.currentTelescope.latitude);
            
            document.getElementById('altitude').textContent = `Altitude: ${altAz.altitude.toFixed(1)}°`;
            document.getElementById('azimuth').textContent = `Azimuth: ${altAz.azimuth.toFixed(1)}°`;
        }
    }
    
    drawFinderView() {
        if (!this.finderCtx) return;
        
        const canvas = this.finderCanvas;
        const ctx = this.finderCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        Utils.clearCanvas(canvas);
        
        const fov = CONSTANTS.FINDER_FOV_DEG;
        const pixelsPerDegree = width / fov;
        const centerX = width / 2;
        const centerY = height / 2;
        const cosDec = Math.cos(Utils.degreesToRadians(this.centerDec));
        
        // Draw background stars
        this.catalog.backgroundStars.forEach(star => {
            const dx = (star.ra - this.centerRA) * 15 * cosDec; // Convert RA to degrees
            const dy = star.dec - this.centerDec;
            
            if (Math.abs(dx) <= fov/2 && Math.abs(dy) <= fov/2) {
                const x = centerX - dx * pixelsPerDegree;
                const y = centerY - dy * pixelsPerDegree;
                Utils.drawStar(ctx, x, y, star.magnitude, '#ffff88');
            }
        });
        
        // Draw catalog objects
        this.catalog.objects.forEach(obj => {
            const dx = (obj.ra - this.centerRA) * 15 * cosDec;
            const dy = obj.dec - this.centerDec;
            
            if (Math.abs(dx) <= fov/2 && Math.abs(dy) <= fov/2) {
                const x = centerX - dx * pixelsPerDegree;
                const y = centerY - dy * pixelsPerDegree;
                
                if (obj.objType === 0) {
                    // Star
                    Utils.drawStar(ctx, x, y, obj.mag, '#ffffff');
                } else {
                    // Galaxy
                    const size = Math.max(3, 15 - obj.mag);
                    Utils.drawGalaxy(ctx, x, y, size, obj.code);
                }
            }
        });
        
        // Draw border and crosshair
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, width, height);
        Utils.drawCrosshair(ctx, centerX, centerY, 15);
        
        // Draw labels
        Utils.drawText(ctx, 'Finder View', width/2 - 40, 20, '#ffff00', '14px Arial');
        Utils.drawText(ctx, `FOV ${fov.toFixed(1)}° × ${fov.toFixed(1)}°`, 10, height - 10, '#ffff00', '10px Arial');
    }
    
    updateCatalogTable() {
        const tbody = document.getElementById('catalog-tbody');
        tbody.innerHTML = '';
        
        this.catalog.objects.forEach((obj, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${obj.name}</td>
                <td>${obj.ra.toFixed(5)}</td>
                <td>${obj.dec.toFixed(5)}</td>
                <td>${obj.mag.toFixed(2)}</td>
                <td>${obj.specType}</td>
            `;
            row.addEventListener('click', () => this.selectObject(obj));
            tbody.appendChild(row);
        });
    }
    
    // Telescope selection
    showTelescopeSelection() {
        const modal = new Modal('Select Telescope', TELESCOPES, (telescope) => {
            this.currentTelescope = telescope;
            document.getElementById('telescope-info').textContent = 
                `Telescope: ${telescope.name} (${telescope.diameter}m aperture)`;
        });
        modal.show();
    }
    
    // Field selection
    showFieldSelection() {
        const modal = new Modal('Select Field', FIELDS, async (field) => {
            this.currentField = field;
            this.centerRA = field.ra;
            this.centerDec = field.dec;
            
            document.getElementById('field-info').textContent = `Field: ${field.name}`;
            
            // Load catalog
            await this.catalog.loadFromFile(field.filename);
            
            // Generate background stars if needed
            this.catalog.generateBackgroundStars(
                this.centerRA, 
                this.centerDec, 
                CONSTANTS.FINDER_FOV_DEG, 
                field.background
            );
            
            this.updateDisplay();
        });
        modal.show();
    }
    
    // Date/Time selection
    showDateTimeSelection() {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        title.textContent = 'Select Date and Time';
        
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 16);
        
        body.innerHTML = `
            <label for="datetime-input">Date and Time:</label><br>
            <input type="datetime-local" id="datetime-input" value="${dateStr}" style="width: 100%; margin: 10px 0; padding: 5px;">
            <br>
            <button id="use-now-btn" style="margin: 10px 0; padding: 5px 10px;">Use Current Time</button>
        `;
        
        document.getElementById('use-now-btn').addEventListener('click', () => {
            this.currentDateTime = new Date();
            this.updateDisplay();
            modal.style.display = 'none';
        });
        
        document.getElementById('modal-ok').onclick = () => {
            const input = document.getElementById('datetime-input');
            if (input.value) {
                this.currentDateTime = new Date(input.value);
                this.updateDisplay();
            }
            modal.style.display = 'none';
        };
        
        document.getElementById('modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.style.display = 'block';
    }
    
    // Speed cycling
    cycleSpeed() {
        this.slewSpeedIndex = (this.slewSpeedIndex + 1) % CONSTANTS.SLEW_SPEEDS.length;
        const speed = CONSTANTS.SLEW_SPEEDS[this.slewSpeedIndex];
        document.getElementById('speed-btn').textContent = speed.label;
    }
    
    // Slewing controls
    startSlewing(direction) {
        if (this.slewActive) return;
        
        this.slewActive = true;
        this.autoSlewActive = false;
        
        const directionMap = {
            'north': { dx: 0, dy: 1 },
            'south': { dx: 0, dy: -1 },
            'east': { dx: 1, dy: 0 },
            'west': { dx: -1, dy: 0 }
        };
        
        this.slewDirection = directionMap[direction];
        
        const speed = CONSTANTS.SLEW_SPEEDS[this.slewSpeedIndex];
        this.slewTimer = setInterval(() => {
            this.performSlewStep();
        }, speed.interval);
    }
    
    stopSlewing() {
        this.slewActive = false;
        if (this.slewTimer) {
            clearInterval(this.slewTimer);
            this.slewTimer = null;
        }
    }
    
    abortSlewing() {
        this.stopSlewing();
        this.autoSlewActive = false;
        this.autoSlewTarget = null;
    }
    
    performSlewStep() {
        const speed = CONSTANTS.SLEW_SPEEDS[this.slewSpeedIndex];
        const stepDeg = speed.step;
        const stepRA = stepDeg / 15.0; // Convert to hours
        
        if (this.autoSlewActive && this.autoSlewTarget) {
            // Auto-slew to target
            const dRA = this.autoSlewTarget.ra - this.centerRA;
            const dDec = this.autoSlewTarget.dec - this.centerDec;
            
            // Normalize RA difference
            let wrappedDRA = dRA;
            if (wrappedDRA > 12) wrappedDRA -= 24;
            if (wrappedDRA < -12) wrappedDRA += 24;
            
            if (Math.abs(wrappedDRA) > stepRA) {
                this.centerRA += Math.sign(wrappedDRA) * stepRA;
            } else {
                this.centerRA = this.autoSlewTarget.ra;
            }
            
            if (Math.abs(dDec) > stepDeg) {
                this.centerDec += Math.sign(dDec) * stepDeg;
            } else {
                this.centerDec = this.autoSlewTarget.dec;
            }
            
            // Check if we've reached the target
            if (Math.abs(wrappedDRA) <= stepRA && Math.abs(dDec) <= stepDeg) {
                this.abortSlewing();
            }
        } else {
            // Manual slewing
            this.centerRA += this.slewDirection.dx * stepRA;
            this.centerDec += this.slewDirection.dy * stepDeg;
        }
        
        // Normalize coordinates
        this.centerRA = Utils.normalizeHours(this.centerRA);
        this.centerDec = Math.max(-90, Math.min(90, this.centerDec));
        
        this.updateDisplay();
    }
    
    // Object selection
    selectObject(obj) {
        const confirmSlew = confirm(`Slew telescope to ${obj.name}?`);
        if (confirmSlew) {
            this.slewToObject(obj);
        }
    }
    
    slewToObject(obj) {
        this.autoSlewTarget = obj;
        this.autoSlewActive = true;
        this.slewActive = true;
        
        const speed = CONSTANTS.SLEW_SPEEDS[this.slewSpeedIndex];
        this.slewTimer = setInterval(() => {
            this.performSlewStep();
        }, speed.interval);
    }
    
    // Canvas click handling
    handleCanvasClick(event) {
        const rect = this.finderCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const fov = CONSTANTS.FINDER_FOV_DEG;
        const pixelsPerDegree = this.finderCanvas.width / fov;
        const centerX = this.finderCanvas.width / 2;
        const centerY = this.finderCanvas.height / 2;
        const cosDec = Math.cos(Utils.degreesToRadians(this.centerDec));
        
        // Convert click position to RA/Dec
        const dx = (x - centerX) / pixelsPerDegree;
        const dy = (y - centerY) / pixelsPerDegree;
        
        const clickRA = this.centerRA - dx / (15 * cosDec);
        const clickDec = this.centerDec - dy;
        
        // Find nearest object
        const nearest = this.catalog.getNearestObject(clickRA, clickDec);
        if (nearest.object && nearest.distance < 0.1) { // Within 0.1 degrees
            this.selectObject(nearest.object);
        }
    }
    
    // Instrument controls
    openPhotometer() {
        if (window.photometerController) {
            window.photometerController.show();
        } else {
            window.photometerController = new PhotometerController(this);
        }
    }
    
    openSpectrometer() {
        if (window.spectrometerController) {
            window.spectrometerController.show();
        } else {
            window.spectrometerController = new SpectrometerController(this);
        }
    }
    
    // Get current telescope pointing information
    getCurrentPointing() {
        return {
            ra: this.centerRA,
            dec: this.centerDec,
            telescope: this.currentTelescope,
            datetime: this.currentDateTime,
            lst: this.currentTelescope ? Utils.calculateLST(this.currentDateTime, this.currentTelescope.longitude) : 0,
            altaz: this.currentTelescope ? Utils.calculateAltAz(this.centerRA, this.centerDec, 
                Utils.calculateLST(this.currentDateTime, this.currentTelescope.longitude), 
                this.currentTelescope.latitude) : { altitude: 0, azimuth: 0 }
        };
    }
}

// Modal dialog class
class Modal {
    constructor(title, options, callback) {
        this.title = title;
        this.options = options;
        this.callback = callback;
        this.selectedOption = null;
    }
    
    show() {
        const modal = document.getElementById('modal');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        
        titleEl.textContent = this.title;
        bodyEl.innerHTML = '';
        
        this.options.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'modal-option';
            div.textContent = option.name || option.label || `Option ${index + 1}`;
            div.addEventListener('click', () => {
                document.querySelectorAll('.modal-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                this.selectedOption = option;
            });
            bodyEl.appendChild(div);
        });
        
        document.getElementById('modal-ok').onclick = () => {
            if (this.selectedOption && this.callback) {
                this.callback(this.selectedOption);
            }
            modal.style.display = 'none';
        };
        
        document.getElementById('modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
        
        document.querySelector('.modal-close').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.style.display = 'block';
    }
}
