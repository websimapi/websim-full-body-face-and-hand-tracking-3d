import { Holistic } from 'https://cdn.skypack.dev/@mediapipe/holistic';

export class TrackingManager {
    constructor() {
        this.holistic = null;
        this.camera = null;
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        this.bodyLandmarks = null;
        this.faceLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;

        this.isBodyTracking = false;
        this.isFaceTracking = false;
        this.isLeftHandTracking = false;
        this.isRightHandTracking = false;

        this.callbacks = {
            onUpdate: null
        };

        this.bodyStatusElement = document.getElementById('body-status');
        this.faceStatusElement = document.getElementById('face-status');
        this.handStatusElement = document.getElementById('hand-status');
    }

    async initialize() {
        // Initialize MediaPipe Holistic
        this.holistic = new window.Holistic({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
            }
        });

        // Configure tracking options
        await this.holistic.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            refineFaceLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.holistic.onResults(this.onResults.bind(this));

        // Initialize camera
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.holistic.send({ image: this.videoElement });
            },
            width: 1280,
            height: 720
        });

        await this.camera.start();
        console.log("Tracking initialized");
    }

    onResults(results) {
        // Update tracking status
        this.isBodyTracking = results.poseLandmarks ? true : false;
        this.isFaceTracking = results.faceLandmarks ? true : false;
        this.isLeftHandTracking = results.leftHandLandmarks ? true : false;
        this.isRightHandTracking = results.rightHandLandmarks ? true : false;

        // Update status elements
        this.bodyStatusElement.textContent = `Body Tracking: ${this.isBodyTracking ? 'Active' : 'Inactive'}`;
        this.bodyStatusElement.className = this.isBodyTracking ? 'status active' : 'status inactive';
        
        this.faceStatusElement.textContent = `Face Tracking: ${this.isFaceTracking ? 'Active' : 'Inactive'}`;
        this.faceStatusElement.className = this.isFaceTracking ? 'status active' : 'status inactive';
        
        this.handStatusElement.textContent = `Hand Tracking: ${(this.isLeftHandTracking || this.isRightHandTracking) ? 'Active' : 'Inactive'}`;
        this.handStatusElement.className = (this.isLeftHandTracking || this.isRightHandTracking) ? 'status active' : 'status inactive';

        // Store landmarks
        this.bodyLandmarks = results.poseLandmarks;
        this.faceLandmarks = results.faceLandmarks;
        this.leftHandLandmarks = results.leftHandLandmarks;
        this.rightHandLandmarks = results.rightHandLandmarks;

        // Trigger update callback
        if (this.callbacks.onUpdate) {
            this.callbacks.onUpdate({
                body: this.bodyLandmarks,
                face: this.faceLandmarks,
                leftHand: this.leftHandLandmarks,
                rightHand: this.rightHandLandmarks
            });
        }
    }

    setUpdateCallback(callback) {
        this.callbacks.onUpdate = callback;
    }
}