import PhysicsEntity from "./PhysicsEntity.js";
import { keys } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";
import Gun from "./Gun.js";

export default class Player extends PhysicsEntity {
  constructor(config, scene, camera) {
    super(config);

    // Define player size.
    this.size = { width: 1, height: 2, depth: 1 };

    // Define health.
    this.health = 100;

    // Save the camera reference for movement calculations.
    this.camera = camera;

    // Starting state.
    this.state = "idle";

    // Maximum speeds.
    this.walkSpeed = 10;    // Walking speed.
    this.sprintSpeed = 20;  // Sprinting speed.
    this.crouchingSpeed = 7; // Crouching speed.
    this.slidingSpeed = 20;  // Sliding speed.

    // Rotation for orientation (Euler used for compatibility, but we will also use a quaternion).
    this.rotation = new THREE.Euler(0, 0, 0);
    // Create a quaternion property to store the full rotation.
    this.quaternion = new THREE.Quaternion();

    // Set up the visual shape.
    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    // Attach the shape to this entity.
    this.shape.attach(this);
    // Add the shape's mesh to the scene.
    scene.add(this.shape.mesh);

    // Set up the bounding box.
    this.boundingBox = new BoundingBox(this, scene);

    // For infinite turning, accumulate yaw changes.
    this.totalYaw = 0;
    this.lastCameraYaw = undefined;

    // For long jump: record the time when sliding starts.
    this.slideStartTime = null;

    this.weapon = new Gun;
  }

  /**
   * Process input to set the wish direction and target speed.
   * Also handles jumping and, if sliding, triggers a long jump.
   */
  handleMovement() {
    if (!this.camera) {
      console.error("Camera reference is missing in Player!");
      return;
    }
  
    // Get the camera’s forward direction.
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
  
    // Get the camera’s right vector.
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  
    // Build the movement vector.
    const move = new THREE.Vector3();
    if (keys.pressed("W")) move.add(forward);
    if (keys.pressed("S")) move.sub(forward);
    if (keys.pressed("A")) move.sub(right);
    if (keys.pressed("D")) move.add(right);
  
    if (move.lengthSq() > 0) {
      move.normalize();
    }
    this.wishDir.copy(move);
  
    // Determine the player's state and target speed.
    // If both sprint (Shift) and crouch (C) are pressed, enter sliding mode.
    if (keys.pressed("Shift") && keys.pressed("C")) {
      // Record slide start time when entering sliding mode.
      if (this.state !== "sliding") {
        this.slideStartTime = Date.now() / 1000;
      }
      this.state = "sliding";
      this.targetSpeed = this.slidingSpeed; // Faster than normal crouch
      this.size = { width: 1, height: 1, depth: 1 };
    } else if (keys.pressed("C")) {
      this.state = "crouching";
      this.targetSpeed = this.crouchingSpeed;
      this.size = { width: 1, height: 1, depth: 1 };
      this.slideStartTime = null;
    } else if (keys.pressed("Shift")) {
      this.state = "sprinting";
      this.targetSpeed = this.sprintSpeed;
      this.slideStartTime = null;
    } else {
      this.state = "walking";
      this.targetSpeed = this.walkSpeed;
      this.size = { width: 1, height: 2, depth: 1 };
      this.slideStartTime = null;
    }
  
    // Jump if possible.
    if (keys.pressed("Space") && this.isGrounded) {
      // If sliding and jump occurs quickly after sliding starts, perform a long jump.
      if (this.state === "sliding" && this.slideStartTime && ((Date.now() / 1000) - this.slideStartTime < 0.3)) {
        // Long jump: give a higher vertical impulse and add extra forward boost.
        this.velocity.y = 25; // Higher vertical jump
        const boost = this.wishDir.clone().multiplyScalar(20); // Adjust boost factor as needed
        this.velocity.add(boost);
        this.isGrounded = false;
        // Reset slide start time so the long jump only occurs once.
        this.slideStartTime = null;
        this.state = "longJump";
      } else {
        // Normal jump.
        this.velocity.y = 15;
        this.isGrounded = false;
      }
    }
  
    // Handle shooting.
    if (keys.pressed("LeftMouseButton")) {
      console.log("I am shooting! PEW! PEW! PEW!");
    }
  }
  
  /**
   * Main update loop for the player.
   * Processes input, updates physics, handles collisions,
   * and updates rotation and transforms for both the shape and bounding box.
   */
  update(entities) {
    // Update timer and accumulate fixed time steps.
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();
  
    while (this.accumulatedTime >= this.fixedDelta) {
      // Save state for interpolation.
      this.previousPosition.copy(this.position);
  
      // Process input.
      this.handleMovement();
  
      // Fixed-step physics update.
      this.updatePhysics(this.fixedDelta);
  
      // Handle collisions.
      this.handleCollisions(entities);
  
      // Update bounding box.
      if (this.boundingBox && typeof this.boundingBox.update === "function") {
        this.boundingBox.update();
      }
  
      this.accumulatedTime -= this.fixedDelta;
    }
  
    // Update the shape's transform based on the attached entity.
    this.shape.update();
  
    // ---- Infinite Turning with the Camera using Quaternion ----
    if (this.camera) {
      // Extract the current camera yaw (using 'YXZ').
      const cameraEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
      const currentCameraYaw = cameraEuler.y;
  
      // Initialize lastCameraYaw if needed.
      if (this.lastCameraYaw === undefined) {
        this.lastCameraYaw = currentCameraYaw;
        this.totalYaw = currentCameraYaw;
      }
  
      // Compute change in yaw.
      let deltaYaw = currentCameraYaw - this.lastCameraYaw;
      // Adjust for wrap-around.
      if (deltaYaw > Math.PI) {
        deltaYaw -= 2 * Math.PI;
      } else if (deltaYaw < -Math.PI) {
        deltaYaw += 2 * Math.PI;
      }
      this.totalYaw += deltaYaw;
      this.lastCameraYaw = currentCameraYaw;
  
      // Update the quaternion from the total yaw.
      this.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.totalYaw);
  
      // Update the Euler rotation from the quaternion.
      this.rotation.setFromQuaternion(this.quaternion);
  
      // Update bounding box rotation if needed.
      if (this.boundingBox) {
        if (this.boundingBox.rotation) {
          this.boundingBox.rotation.copy(this.rotation);
        }
        this.boundingBox.update();
      }
    }
  }
}