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
            const lst = Utils
