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
            onUpdate: null,
            onCalibrationComplete: null
        };

        this.bodyStatusElement = document.getElementById('body-status');
        this.faceStatusElement = document.getElementById('face-status');
        this.handStatusElement = document.getElementById('hand-status');
        
        // Calibration parameters
        this.isCalibrating = false;
        this.calibrationFrames = [];
        this.calibrationMaxFrames = 30;
        this.calibrationData = null;
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
        this.camera = new window.Camera(this.videoElement, {
            onFrame: async () => {
                await this.holistic.send({ image: this.videoElement });
            },
            width: 1280,
            height: 720
        });

        await this.camera.start();
        console.log("Tracking initialized");
        
        // Start calibration after initialization
        this.startCalibration();
    }
    
    startCalibration() {
        this.isCalibrating = true;
        this.calibrationFrames = [];
        
        this.bodyStatusElement.textContent = "Body Tracking: Calibrating...";
        this.faceStatusElement.textContent = "Face Tracking: Calibrating...";
        this.handStatusElement.textContent = "Hand Tracking: Calibrating...";
        
        console.log("Calibration started. Please stand in T-pose facing the camera.");
    }
    
    processCalibrationFrame(results) {
        if (!results.poseLandmarks || !results.faceLandmarks) {
            return false; // Skip frames where body or face isn't visible
        }
        
        this.calibrationFrames.push({
            body: results.poseLandmarks,
            face: results.faceLandmarks,
            leftHand: results.leftHandLandmarks,
            rightHand: results.rightHandLandmarks
        });
        
        // Update UI with calibration progress
        const progress = Math.round((this.calibrationFrames.length / this.calibrationMaxFrames) * 100);
        this.bodyStatusElement.textContent = `Calibrating: ${progress}%`;
        
        return this.calibrationFrames.length >= this.calibrationMaxFrames;
    }
    
    calculateCalibrationData() {
        // Calculate average positions and scaling factors from calibration frames
        const calibration = {
            bodyScale: 0,
            faceScale: 0,
            handScale: 0,
            offsetY: 0,
            offsetX: 0,
            offsetZ: 0
        };
        
        // Process all frames to find averages
        let validFrames = 0;
        
        for (const frame of this.calibrationFrames) {
            if (frame.body && frame.face) {
                validFrames++;
                
                // Calculate body height (distance from hips to shoulders)
                const leftShoulder = frame.body[11];
                const rightShoulder = frame.body[12];
                const leftHip = frame.body[23];
                const rightHip = frame.body[24];
                
                if (leftShoulder && rightShoulder && leftHip && rightHip) {
                    // Get average shoulder and hip positions
                    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                    const hipY = (leftHip.y + rightHip.y) / 2;
                    const torsoHeight = Math.abs(shoulderY - hipY);
                    
                    // Calculate body scale based on torso height
                    calibration.bodyScale += torsoHeight;
                    
                    // Calculate general Y offset based on hip position
                    calibration.offsetY += hipY;
                    
                    // Calculate X offset (center alignment)
                    const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
                    calibration.offsetX += shoulderX - 0.5; // 0.5 is the center in MediaPipe coords
                    
                    // Calculate Z offset from average shoulder Z
                    calibration.offsetZ += (leftShoulder.z + rightShoulder.z) / 2;
                }
                
                // Calculate face scale
                if (frame.face.length > 10) {
                    // Use distance between eyes for face scale
                    const leftEye = frame.face[159];
                    const rightEye = frame.face[386];
                    if (leftEye && rightEye) {
                        const eyeDistance = Math.sqrt(
                            Math.pow(leftEye.x - rightEye.x, 2) +
                            Math.pow(leftEye.y - rightEye.y, 2)
                        );
                        calibration.faceScale += eyeDistance;
                    }
                }
                
                // Calculate hand scale if available
                if (frame.leftHand && frame.leftHand.length > 0) {
                    const wrist = frame.leftHand[0];
                    const middleFinger = frame.leftHand[9];
                    if (wrist && middleFinger) {
                        const handLength = Math.sqrt(
                            Math.pow(wrist.x - middleFinger.x, 2) +
                            Math.pow(wrist.y - middleFinger.y, 2)
                        );
                        calibration.handScale += handLength;
                    }
                } else if (frame.rightHand && frame.rightHand.length > 0) {
                    const wrist = frame.rightHand[0];
                    const middleFinger = frame.rightHand[9];
                    if (wrist && middleFinger) {
                        const handLength = Math.sqrt(
                            Math.pow(wrist.x - middleFinger.x, 2) +
                            Math.pow(wrist.y - middleFinger.y, 2)
                        );
                        calibration.handScale += handLength;
                    }
                }
            }
        }
        
        // Calculate averages
        if (validFrames > 0) {
            calibration.bodyScale /= validFrames;
            calibration.faceScale /= validFrames;
            calibration.handScale /= validFrames;
            calibration.offsetY /= validFrames;
            calibration.offsetX /= validFrames;
            calibration.offsetZ /= validFrames;
            
            // Normalize scales for better visualization
            const idealBodyScale = 0.3; // Desired torso height in normalized space
            calibration.scaleFactor = idealBodyScale / calibration.bodyScale;
            
            console.log("Calibration complete:", calibration);
            return calibration;
        }
        
        console.warn("Calibration failed - not enough valid frames");
        return null;
    }
    
    finalizeCalibration() {
        this.calibrationData = this.calculateCalibrationData();
        this.isCalibrating = false;
        
        if (this.calibrationData) {
            this.bodyStatusElement.textContent = "Body Tracking: Calibrated";
            this.bodyStatusElement.className = "status active";
            this.faceStatusElement.textContent = "Face Tracking: Calibrated";
            this.faceStatusElement.className = "status active";
            this.handStatusElement.textContent = "Hand Tracking: Calibrated";
            this.handStatusElement.className = "status active";
            
            // Notify that calibration is complete
            if (this.callbacks.onCalibrationComplete) {
                this.callbacks.onCalibrationComplete(this.calibrationData);
            }
        } else {
            // Calibration failed, try again
            setTimeout(() => this.startCalibration(), 1000);
        }
    }

    onResults(results) {
        // Handle calibration if in calibration mode
        if (this.isCalibrating) {
            if (this.processCalibrationFrame(results)) {
                this.finalizeCalibration();
            }
            return;
        }
        
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
                rightHand: this.rightHandLandmarks,
                calibration: this.calibrationData
            });
        }
    }

    setUpdateCallback(callback) {
        this.callbacks.onUpdate = callback;
    }
    
    setCalibrationCompleteCallback(callback) {
        this.callbacks.onCalibrationComplete = callback;
    }
}