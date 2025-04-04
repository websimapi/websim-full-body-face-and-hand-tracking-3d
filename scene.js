import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class SceneManager {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x121212);
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        
        // Setup camera and controls
        this.camera.position.set(0, 1.6, 3);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.update();
        
        // Add lights
        this.addLights();
        
        // Create avatar components
        this.createAvatar();
        
        // Add grid for reference
        this.addGrid();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7.5);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
        
        // Hemisphere light
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);
    }
    
    createAvatar() {
        this.avatar = {
            // Body parts
            head: this.createMesh(new THREE.SphereGeometry(0.1, 32, 16), 0xf5c396),
            torso: this.createMesh(new THREE.CylinderGeometry(0.15, 0.1, 0.4, 12), 0x3a86ff),
            leftArm: this.createMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12), 0x3a86ff),
            rightArm: this.createMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 12), 0x3a86ff),
            leftForearm: this.createMesh(new THREE.CylinderGeometry(0.03, 0.025, 0.25, 12), 0x3a86ff),
            rightForearm: this.createMesh(new THREE.CylinderGeometry(0.03, 0.025, 0.25, 12), 0x3a86ff),
            leftLeg: this.createMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), 0x3a86ff),
            rightLeg: this.createMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), 0x3a86ff),
            leftCalf: this.createMesh(new THREE.CylinderGeometry(0.05, 0.04, 0.4, 12), 0x3a86ff),
            rightCalf: this.createMesh(new THREE.CylinderGeometry(0.05, 0.04, 0.4, 12), 0x3a86ff),
            
            // Hands
            leftHand: this.createHandMesh(0xff0000),
            rightHand: this.createHandMesh(0x0000ff),
            
            // Face features
            face: this.createFaceMesh()
        };
        
        // Position body parts in T-pose
        this.resetAvatarPose();
    }
    
    createMesh(geometry, color) {
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.7,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        return mesh;
    }
    
    createHandMesh(color) {
        const hand = new THREE.Group();
        
        // Palm
        const palm = this.createMesh(new THREE.BoxGeometry(0.08, 0.02, 0.1), color);
        hand.add(palm);
        
        // Fingers
        const fingers = [];
        for (let i = 0; i < 5; i++) {
            const finger = new THREE.Group();
            
            // Create finger segments (3 segments per finger)
            const segments = [];
            for (let j = 0; j < 3; j++) {
                const segment = this.createMesh(
                    new THREE.CylinderGeometry(0.01, 0.008, 0.03, 8),
                    color
                );
                segment.rotation.x = Math.PI / 2;
                finger.add(segment);
                segments.push(segment);
            }
            
            fingers.push({
                group: finger,
                segments: segments
            });
            
            hand.add(finger);
        }
        
        this.scene.add(hand);
        return {
            group: hand,
            palm: palm,
            fingers: fingers
        };
    }
    
    createFaceMesh() {
        const faceGroup = new THREE.Group();
        
        // Create facial features
        const faceGeometry = new THREE.SphereGeometry(0.09, 32, 16);
        faceGeometry.scale(1, 1.1, 0.9);
        const faceMesh = this.createMesh(faceGeometry, 0xf5c396);
        
        // Eyes
        const leftEye = this.createMesh(new THREE.SphereGeometry(0.015, 16, 8), 0xffffff);
        leftEye.position.set(-0.03, 0.02, 0.075);
        const leftPupil = this.createMesh(new THREE.SphereGeometry(0.007, 16, 8), 0x000000);
        leftPupil.position.set(-0.03, 0.02, 0.088);
        
        const rightEye = this.createMesh(new THREE.SphereGeometry(0.015, 16, 8), 0xffffff);
        rightEye.position.set(0.03, 0.02, 0.075);
        const rightPupil = this.createMesh(new THREE.SphereGeometry(0.007, 16, 8), 0x000000);
        rightPupil.position.set(0.03, 0.02, 0.088);
        
        // Mouth
        const mouth = this.createMesh(new THREE.BoxGeometry(0.04, 0.01, 0.01), 0xa53030);
        mouth.position.set(0, -0.035, 0.085);
        
        // Add all features to the face group
        faceGroup.add(faceMesh, leftEye, leftPupil, rightEye, rightPupil, mouth);
        this.scene.add(faceGroup);
        
        return {
            group: faceGroup,
            features: {
                face: faceMesh,
                leftEye: leftEye,
                rightEye: rightEye,
                leftPupil: leftPupil,
                rightPupil: rightPupil,
                mouth: mouth
            }
        };
    }
    
    resetAvatarPose() {
        // Position body in T-pose
        this.avatar.head.position.set(0, 1.7, 0);
        this.avatar.torso.position.set(0, 1.4, 0);
        
        // Arms
        this.avatar.leftArm.position.set(-0.2, 1.55, 0);
        this.avatar.leftArm.rotation.z = Math.PI / 2;
        this.avatar.rightArm.position.set(0.2, 1.55, 0);
        this.avatar.rightArm.rotation.z = -Math.PI / 2;
        
        this.avatar.leftForearm.position.set(-0.45, 1.55, 0);
        this.avatar.leftForearm.rotation.z = Math.PI / 2;
        this.avatar.rightForearm.position.set(0.45, 1.55, 0);
        this.avatar.rightForearm.rotation.z = -Math.PI / 2;
        
        // Legs
        this.avatar.leftLeg.position.set(-0.1, 1.0, 0);
        this.avatar.rightLeg.position.set(0.1, 1.0, 0);
        this.avatar.leftCalf.position.set(-0.1, 0.6, 0);
        this.avatar.rightCalf.position.set(0.1, 0.6, 0);
        
        // Hands
        this.avatar.leftHand.group.position.set(-0.6, 1.55, 0);
        this.avatar.rightHand.group.position.set(0.6, 1.55, 0);
        
        // Face
        this.avatar.face.group.position.copy(this.avatar.head.position);
    }
    
    addGrid() {
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);
    }
    
    updateAvatar(trackingData) {
        if (!trackingData) return;
        
        // Update body pose if tracking data is available
        if (trackingData.body) {
            this.updateBodyPose(trackingData.body);
        }
        
        // Update face if tracking data is available
        if (trackingData.face) {
            this.updateFacePose(trackingData.face);
        }
        
        // Update hands if tracking data is available
        if (trackingData.leftHand) {
            this.updateHandPose(trackingData.leftHand, this.avatar.leftHand, true);
        }
        
        if (trackingData.rightHand) {
            this.updateHandPose(trackingData.rightHand, this.avatar.rightHand, false);
        }
    }
    
    updateBodyPose(bodyLandmarks) {
        if (!bodyLandmarks || bodyLandmarks.length < 33) return;
        
        // Convert from MediaPipe coordinate system to Three.js
        // MediaPipe: (0,0) is top-left, y-down, z-toward camera
        // Three.js: (0,0,0) is center, y-up, z-toward viewer
        
        // Scale factor for better visualization
        const scale = 2;
        
        // Helper function to convert coordinates
        const convertCoords = (landmark) => {
            return new THREE.Vector3(
                (landmark.x - 0.5) * scale,
                (0.5 - landmark.y) * scale,
                -landmark.z * scale
            );
        };
        
        // Head (nose)
        const nose = convertCoords(bodyLandmarks[0]);
        this.avatar.head.position.copy(nose);
        
        // Torso (average of shoulders and hips)
        const leftShoulder = convertCoords(bodyLandmarks[11]);
        const rightShoulder = convertCoords(bodyLandmarks[12]);
        const leftHip = convertCoords(bodyLandmarks[23]);
        const rightHip = convertCoords(bodyLandmarks[24]);
        
        const torsoPos = new THREE.Vector3()
            .add(leftShoulder).add(rightShoulder)
            .add(leftHip).add(rightHip)
            .divideScalar(4);
        this.avatar.torso.position.copy(torsoPos);
        
        // Calculate torso height for proper scaling
        const torsoHeight = leftShoulder.distanceTo(leftHip);
        this.avatar.torso.scale.y = torsoHeight * 1.2;
        
        // Arms
        const leftElbow = convertCoords(bodyLandmarks[13]);
        const rightElbow = convertCoords(bodyLandmarks[14]);
        const leftWrist = convertCoords(bodyLandmarks[15]);
        const rightWrist = convertCoords(bodyLandmarks[16]);
        
        // Position upper arms
        this.positionLimb(leftShoulder, leftElbow, this.avatar.leftArm);
        this.positionLimb(rightShoulder, rightElbow, this.avatar.rightArm);
        
        // Position forearms
        this.positionLimb(leftElbow, leftWrist, this.avatar.leftForearm);
        this.positionLimb(rightElbow, rightWrist, this.avatar.rightForearm);
        
        // Legs
        const leftKnee = convertCoords(bodyLandmarks[25]);
        const rightKnee = convertCoords(bodyLandmarks[26]);
        const leftAnkle = convertCoords(bodyLandmarks[27]);
        const rightAnkle = convertCoords(bodyLandmarks[28]);
        
        // Position upper legs
        this.positionLimb(leftHip, leftKnee, this.avatar.leftLeg);
        this.positionLimb(rightHip, rightKnee, this.avatar.rightLeg);
        
        // Position lower legs
        this.positionLimb(leftKnee, leftAnkle, this.avatar.leftCalf);
        this.positionLimb(rightKnee, rightAnkle, this.avatar.rightCalf);
        
        // Update hands position (even if detailed hand tracking is not available)
        this.avatar.leftHand.group.position.copy(leftWrist);
        this.avatar.rightHand.group.position.copy(rightWrist);
        
        // Update face position
        this.avatar.face.group.position.copy(nose);
        
        // Calculate facing direction from shoulders
        const shoulderCenter = new THREE.Vector3()
            .addVectors(leftShoulder, rightShoulder)
            .divideScalar(2);
        const shoulderDir = new THREE.Vector3()
            .subVectors(rightShoulder, leftShoulder)
            .normalize();
        const forward = new THREE.Vector3(0, 0, 1);
        const faceDir = new THREE.Vector3().crossVectors(shoulderDir, forward);
        
        // Apply rotation to face and head
        const headRotation = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            faceDir
        );
        this.avatar.head.setRotationFromQuaternion(headRotation);
        this.avatar.face.group.setRotationFromQuaternion(headRotation);
    }
    
    positionLimb(jointA, jointB, limbMesh) {
        // Calculate midpoint for limb position
        const midpoint = new THREE.Vector3()
            .addVectors(jointA, jointB)
            .divideScalar(2);
        limbMesh.position.copy(midpoint);
        
        // Calculate limb length for proper scaling
        const length = jointA.distanceTo(jointB);
        limbMesh.scale.y = length;
        
        // Calculate orientation
        const limbDir = new THREE.Vector3()
            .subVectors(jointB, jointA)
            .normalize();
        const yAxis = new THREE.Vector3(0, 1, 0);
        
        // Special case for nearly vertical limbs to avoid gimbal lock
        if (Math.abs(limbDir.y) > 0.99) {
            limbMesh.quaternion.setFromUnitVectors(yAxis, limbDir);
        } else {
            // Create rotation quaternion
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                yAxis, 
                limbDir
            );
            limbMesh.setRotationFromQuaternion(quaternion);
        }
    }
    
    updateFacePose(faceLandmarks) {
        if (!faceLandmarks || faceLandmarks.length < 10) return;
        
        // Face landmarks are already updated with position from body pose
        // Here we'll focus on facial expressions
        
        // Scale for visualization
        const scale = 2;
        
        // Helper function to convert coordinates
        const convertCoords = (landmark) => {
            return new THREE.Vector3(
                (landmark.x - 0.5) * scale * 0.2,
                (0.5 - landmark.y) * scale * 0.2,
                -landmark.z * scale * 0.2
            );
        };
        
        // Update eye positions
        const leftEyeCenter = convertCoords(faceLandmarks[159]);
        const rightEyeCenter = convertCoords(faceLandmarks[386]);
        
        this.avatar.face.features.leftEye.position.copy(leftEyeCenter);
        this.avatar.face.features.leftEye.position.add(this.avatar.face.group.position);
        
        this.avatar.face.features.rightEye.position.copy(rightEyeCenter);
        this.avatar.face.features.rightEye.position.add(this.avatar.face.group.position);
        
        // Update pupils
        this.avatar.face.features.leftPupil.position.copy(leftEyeCenter);
        this.avatar.face.features.leftPupil.position.z += 0.015;
        this.avatar.face.features.leftPupil.position.add(this.avatar.face.group.position);
        
        this.avatar.face.features.rightPupil.position.copy(rightEyeCenter);
        this.avatar.face.features.rightPupil.position.z += 0.015;
        this.avatar.face.features.rightPupil.position.add(this.avatar.face.group.position);
        
        // Update mouth
        const upperLip = convertCoords(faceLandmarks[13]);
        const lowerLip = convertCoords(faceLandmarks[14]);
        const leftMouth = convertCoords(faceLandmarks[61]);
        const rightMouth = convertCoords(faceLandmarks[291]);
        
        const mouthCenter = new THREE.Vector3()
            .add(upperLip)
            .add(lowerLip)
            .divideScalar(2);
        this.avatar.face.features.mouth.position.copy(mouthCenter);
        this.avatar.face.features.mouth.position.add(this.avatar.face.group.position);
        
        // Calculate mouth width
        const mouthWidth = leftMouth.distanceTo(rightMouth);
        this.avatar.face.features.mouth.scale.set(mouthWidth * 5, 1, 1);
        
        // Calculate mouth height (for expressions)
        const mouthHeight = upperLip.distanceTo(lowerLip);
        this.avatar.face.features.mouth.scale.y = mouthHeight * 8;
    }
    
    updateHandPose(handLandmarks, handMesh, isLeft) {
        if (!handLandmarks || handLandmarks.length < 21) return;
        
        // Scale for better visualization
        const scale = 2;
        
        // Helper function to convert coordinates
        const convertCoords = (landmark) => {
            return new THREE.Vector3(
                (landmark.x - 0.5) * scale * 0.4 * (isLeft ? -1 : 1),
                (0.5 - landmark.y) * scale * 0.4,
                -landmark.z * scale * 0.4
            );
        };
        
        // Get wrist position and orientation
        const wrist = convertCoords(handLandmarks[0]);
        
        // We need to align the palm with the proper orientation
        const indexBase = convertCoords(handLandmarks[5]);
        const pinkyBase = convertCoords(handLandmarks[17]);
        
        // Establish palm coordinate system
        const palmXAxis = new THREE.Vector3()
            .subVectors(pinkyBase, indexBase)
            .normalize();
        
        const middleFingerDir = new THREE.Vector3()
            .subVectors(convertCoords(handLandmarks[9]), wrist)
            .normalize();
        
        const palmZAxis = new THREE.Vector3()
            .crossVectors(palmXAxis, middleFingerDir)
            .normalize();
        
        const palmYAxis = new THREE.Vector3()
            .crossVectors(palmZAxis, palmXAxis)
            .normalize();
        
        // Create rotation matrix from these axes
        const rotMatrix = new THREE.Matrix4().makeBasis(
            palmXAxis, palmYAxis, palmZAxis
        );
        
        // Apply rotation to hand
        handMesh.group.position.copy(wrist);
        handMesh.group.position.add(this.avatar.leftForearm.position);
        handMesh.group.quaternion.setFromRotationMatrix(rotMatrix);
        
        // Update palm
        handMesh.palm.position.set(0, 0, 0);
        
        // Update fingers
        const fingerBaseIndices = [1, 5, 9, 13, 17]; // thumb, index, middle, ring, pinky
        
        for (let i = 0; i < 5; i++) {
            const baseIndex = fingerBaseIndices[i];
            
            // Get finger joint positions relative to wrist
            const positions = [];
            for (let j = 0; j < 4; j++) {
                const idx = baseIndex + j;
                if (idx < handLandmarks.length) {
                    const pos = convertCoords(handLandmarks[idx]);
                    pos.sub(wrist); // Make position relative to wrist
                    positions.push(pos);
                }
            }
            
            // Position finger segments
            for (let j = 0; j < 3 && j < positions.length - 1; j++) {
                const start = positions[j];
                const end = positions[j + 1];
                
                // Calculate midpoint for segment position
                const midpoint = new THREE.Vector3()
                    .addVectors(start, end)
                    .divideScalar(2);
                
                handMesh.fingers[i].segments[j].position.copy(midpoint);
                
                // Calculate length and orientation
                const length = start.distanceTo(end);
                handMesh.fingers[i].segments[j].scale.y = length * 1.5;
                
                // Set orientation
                const direction = new THREE.Vector3()
                    .subVectors(end, start)
                    .normalize();
                const yAxis = new THREE.Vector3(0, 1, 0);
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    yAxis, 
                    direction
                );
                handMesh.fingers[i].segments[j].quaternion.copy(quaternion);
                
                // Rotate to align cylinder with finger direction
                handMesh.fingers[i].segments[j].rotateX(Math.PI / 2);
            }
        }
    }
    
    onWindowResize() {
        // Update camera aspect ratio and renderer size
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update controls
        this.controls.update();
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
}

