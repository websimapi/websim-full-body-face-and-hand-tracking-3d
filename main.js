import { TrackingManager } from './tracking.js';
import { SceneManager } from './scene.js';

// Main application class
class FullBodyTrackingApp {
    constructor() {
        this.trackingManager = new TrackingManager();
        this.sceneManager = new SceneManager();
        
        // Initialize application
        this.init();
    }
    
    async init() {
        // Initialize tracking
        await this.trackingManager.initialize();
        
        // Set update callback
        this.trackingManager.setUpdateCallback((trackingData) => {
            this.sceneManager.updateAvatar(trackingData);
        });
        
        // Start animation loop
        this.sceneManager.animate();
        
        console.log('Full Body Tracking Application initialized');
    }
}

// Create and initialize the application
const app = new FullBodyTrackingApp();

