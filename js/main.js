// Main application initialization and global functions

// Global telescope controller instance
let telescopeController;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Telescope Control Panel - Initializing...');
    
    // Create the main telescope controller
    telescopeController = new TelescopeController();
    
    // Add window resize handler
    window.addEventListener('resize', handleWindowResize);
    
    // Set up modal close handlers
    setupModalHandlers();
    
    console.log('Telescope Control Panel - Ready!');
});

// Window resize handler
function handleWindowResize() {
    if (telescopeController) {
        telescopeController.updateDisplay();
    }
    
    // Update instrument panels if open
    if (window.photometerController && window.photometerController.panel.style.display !== 'none') {
        window.photometerController.updateApertureView();
    }
    
    if (window.spectrometerController && window.spectrometerController.panel.style.display !== 'none') {
        window.spectrometerController.updateSpectrometerView();
    }
}

// Modal handling
function setupModalHandlers() {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.modal-close');
    
    // Close modal when clicking X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });
}

// Global utility functions
function showModal(title, content, callback) {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    
    titleEl.textContent = title;
    bodyEl.innerHTML = content;
    
    if (callback) {
        document.getElementById('modal-ok').onclick = callback;
    }
    
    modal.style.display = 'block';
}

function hideModal() {
    document.getElementById('modal').style.display = 'none';
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('Application Error:', event.error);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        max-width: 300px;
    `;
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${event.error.message}<br>
        <small>Check console for details</small>
        <button onclick="this.parentElement.remove()" style="float: right; margin-left: 10px; background: none; border: none; color: white; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
});

// Performance monitoring
let performanceStats = {
    frameCount: 0,
    lastTime: performance.now()
};

function updatePerformanceStats() {
    performanceStats.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - performanceStats.lastTime >= 1000) {
        const fps = performanceStats.frameCount;
        console.log(`Performance: ${fps} FPS`);
        
        performanceStats.frameCount = 0;
        performanceStats.lastTime = currentTime;
    }
    
    requestAnimationFrame(updatePerformanceStats);
}

// Start performance monitoring in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    updatePerformanceStats();
}

// Helper functions for debugging
window.debugTelescope = {
    getState: () => {
        if (!telescopeController) return null;
        return {
            ra: telescopeController.centerRA,
            dec: telescopeController.centerDec,
            telescope: telescopeController.currentTelescope,
            field: telescopeController.currentField,
            objects: telescopeController.catalog.objects.length,
            backgroundStars: telescopeController.catalog.backgroundStars.length
        };
    },
    
    slewTo: (ra, dec) => {
        if (!telescopeController) return;
        telescopeController.centerRA = ra;
        telescopeController.centerDec = dec;
        telescopeController.updateDisplay();
    },
    
    loadSampleField: () => {
        if (!telescopeController) return;
        const sampleField = FIELDS[0]; // Coma cluster
        telescopeController.currentField = sampleField;
        telescopeController.centerRA = sampleField.ra;
        telescopeController.centerDec = sampleField.dec;
        telescopeController.catalog.loadSampleData();
        telescopeController.updateDisplay();
    },
    
    openPhotometer: () => {
        if (telescopeController) {
            telescopeController.openPhotometer();
        }
    },
    
    openSpectrometer: () => {
        if (telescopeController) {
            telescopeController.openSpectrometer();
        }
    }
};

// Console welcome message
console.log(`
╭─────────────────────────────────────────╮
│     Telescope Control Panel v1.0       │
│                                         │
│  Debug functions available in           │
│  window.debugTelescope                  │
│                                         │
│  Try: debugTelescope.getState()         │
│       debugTelescope.loadSampleField()  │
╰─────────────────────────────────────────╯
`);

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TelescopeController,
        PhotometerController,
        SpectrometerController,
        Utils,
        Catalog,
        AstroObject
    };
}
