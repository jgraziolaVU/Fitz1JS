// Astronomical catalog and object management

class AstroObject {
    constructor(data) {
        this.name = data.name;
        this.ra = data.ra;           // hours
        this.dec = data.dec;         // degrees
        this.mag = data.mag;         // V magnitude
        this.bv = data.bv || 0;      // B-V color
        this.ub = data.ub || 0;      // U-B color
        this.redshift = data.redshift || 0;
        this.objType = data.objType; // 0=star, 1=galaxy
        this.code = data.code || 0;
        this.specType = data.specType || '';
    }
    
    // Get magnitude in specific filter
    getMagnitude(filter) {
        switch(filter) {
            case 'U':
                return this.mag + this.bv + this.ub;
            case 'B':
                return this.mag + this.bv;
            case 'V':
            default:
                return this.mag;
        }
    }
    
    // Check if object is within angular distance of a point
    isWithinRadius(centerRA, centerDec, radiusArcsec) {
        const separation = Utils.angularSeparation(centerRA, centerDec, this.ra, this.dec);
        return separation <= (radiusArcsec / 3600.0); // Convert arcsec to degrees
    }
}

class Catalog {
    constructor() {
        this.objects = [];
        this.backgroundStars = [];
        this.loadPromise = null;
    }
    
    // Load catalog from JSON file
    async loadFromFile(filename) {
        try {
            console.log(`Loading catalog: ${filename}`);
            const response = await fetch(`data/${filename}`);
            
            if (!response.ok) {
                throw new Error(`Failed to load catalog: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            this.objects = data.map(objData => new AstroObject(objData));
            
            console.log(`Loaded ${this.objects.length} objects from ${filename}`);
            return this.objects;
        } catch (error) {
            console.error('Error loading catalog:', error);
            // Load sample data as fallback
            this.loadSampleData();
            throw error;
        }
    }
    
    // Load sample data for testing
    loadSampleData() {
        console.log('Loading sample catalog data');
        
        const sampleData = [
            {
                name: "Sample Star 1",
                ra: 13.0,
                dec: 27.8,
                mag: 10.5,
                bv: 0.6,
                ub: 0.1,
                redshift: 0.0,
                objType: 0,
                code: 50505000,
                specType: "G5 V"
            },
            {
                name: "Sample Galaxy 1",
                ra: 13.02,
                dec: 27.75,
                mag: 12.3,
                bv: 1.0,
                ub: 0.6,
                redshift: 0.024,
                objType: 1,
                code: 10,
                specType: ""
            },
            {
                name: "Sample Star 2",
                ra: 12.98,
                dec: 27.85,
                mag: 11.2,
                bv: 0.3,
                ub: 0.05,
                redshift: 0.0,
                objType: 0,
                code: 40505000,
                specType: "F5 V"
            }
        ];
        
        this.objects = sampleData.map(objData => new AstroObject(objData));
        console.log(`Loaded ${this.objects.length} sample objects`);
    }
    
    // Generate background stars for a field
    generateBackgroundStars(centerRA, centerDec, fovDegrees, useDenseField = false) {
        console.log('Generating background stars...');
        
        const starCount = useDenseField ? BACKGROUND_STARS.TOTAL_COUNT : 1000;
        const halfFov = fovDegrees / 2;
        this.backgroundStars = [];
        
        for (let i = 0; i < starCount; i++) {
            // Random position within the field
            const ra = centerRA + (Math.random() - 0.5) * fovDegrees / 15; // Convert to hours
            const dec = centerDec + (Math.random() - 0.5) * fovDegrees;
            
            // Generate magnitude using luminosity function
            const u = Math.random();
            const xMin = Math.pow(10, 0.6 * BACKGROUND_STARS.MAG_MIN);
            const xMax = Math.pow(10, 0.6 * BACKGROUND_STARS.MAG_MAX);
            const x = u * (xMax - xMin) + xMin;
            const magnitude = Math.log10(x) / 0.6;
            
            this.backgroundStars.push({ ra, dec, magnitude });
        }
        
        console.log(`Generated ${this.backgroundStars.length} background stars`);
    }
    
    // Find objects within aperture
    findObjectsInAperture(centerRA, centerDec, apertureArcsec) {
        return this.objects.filter(obj => 
            obj.isWithinRadius(centerRA, centerDec, apertureArcsec)
        );
    }
    
    // Find objects within spectrometer slit
    findObjectsInSlit(centerRA, centerDec, slitWidthDeg, slitHeightDeg) {
        return this.objects.filter(obj => {
            const dRA = Math.abs((obj.ra - centerRA) * 15 * Math.cos(Utils.degreesToRadians(centerDec)));
            const dDec = Math.abs(obj.dec - centerDec);
            return dRA <= slitWidthDeg/2 && dDec <= slitHeightDeg/2;
        });
    }
    
    // Get nearest object to coordinates
    getNearestObject(ra, dec) {
        if (this.objects.length === 0) {
            return { object: null, distance: Infinity };
        }
        
        let nearest = null;
        let minDistance = Infinity;
        
        this.objects.forEach(obj => {
            const distance = Utils.angularSeparation(ra, dec, obj.ra, obj.dec);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = obj;
            }
        });
        
        return { object: nearest, distance: minDistance };
    }
    
    // Get objects sorted by magnitude
    getObjectsByMagnitude(ascending = true) {
        const sorted = [...this.objects].sort((a, b) => a.mag - b.mag);
        return ascending ? sorted : sorted.reverse();
    }
    
    // Get objects by type
    getObjectsByType(objType) {
        return this.objects.filter(obj => obj.objType === objType);
    }
    
    // Get stars
    getStars() {
        return this.getObjectsByType(0);
    }
    
    // Get galaxies
    getGalaxies() {
        return this.getObjectsByType(1);
    }
    
    // Search objects by name
    searchByName(query) {
        const lowerQuery = query.toLowerCase();
        return this.objects.filter(obj => 
            obj.name.toLowerCase().includes(lowerQuery)
        );
    }
    
    // Get object statistics
    getStatistics() {
        const stars = this.getStars();
        const galaxies = this.getGalaxies();
        
        return {
            totalObjects: this.objects.length,
            stars: stars.length,
            galaxies: galaxies.length,
            backgroundStars: this.backgroundStars.length,
            brightestMag: Math.min(...this.objects.map(obj => obj.mag)),
            faintestMag: Math.max(...this.objects.map(obj => obj.mag)),
            avgMag: this.objects.reduce((sum, obj) => sum + obj.mag, 0) / this.objects.length
        };
    }
    
    // Clear all data
    clear() {
        this.objects = [];
        this.backgroundStars = [];
    }
}
