import PhysicsEntity from "./PhysicsEntity.js";
import { mouse, keys, sceneManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import { Timer } from 'three/addons/misc/Timer.js';
import * as THREE from 'three';

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    this.size = { width: 50, height: 50, depth: 50 };

    this.state = "idle";

    // Movement properties
    this.walkSpeed = .1;
    this.sprintSpeed = 1;

    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);

    this.timer = new Timer();
    this.timer.setTimescale(1);
  }

  /**
   * Handle movement inputs and update velocity with delta time.
   * @param {Number} deltaTime - The time delta in seconds.
   */
  handleMovement(deltaTime) {
    let inputVector = new THREE.Vector3(0, 0, 0);
  
    // Capture input for movement
    if (keys.pressed("W")) inputVector.z -= 1; // Forward
    if (keys.pressed("S")) inputVector.z += 1; // Backward
    if (keys.pressed("A")) inputVector.x -= 1; // Left
    if (keys.pressed("D")) inputVector.x += 1; // Right
  
    if (inputVector.length() > 0) {
      inputVector.normalize(); // Normalize direction
      const speed = this.state === "sprinting" ? this.sprintSpeed : this.walkSpeed;
  
      // Convert input into a force
      const movementForce = inputVector.multiplyScalar(speed * this.mass); // F = ma
      this.applyForce(movementForce);
    }
  
    // Handle jumping
    if (keys.pressed("Space") && this.onPlatform) {
      this.velocity.y = 8; // Apply upward velocity
    }
  }  

  /**
   * Main update loop for the player.
   */
  update(entities) {
    // Time Stuff
    this.timer.update();
    const deltaTime = this.timer.getDelta();
    
    // Handle movement
    this.handleMovement(deltaTime);

    // Apply physics updates (gravity, friction, etc.)
    this.updatePhysics(entities);

    // update shape's position, size, and orientation
    this.shape.update();
  }
}