import PhysicsEntity from "./PhysicsEntity.js";
import { Vec3 } from "../utils/vector.js";
import { mouse, keys, sceneManager } from "../Globals.js";
import TimeManager from "../EventObjects/TimeManager.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    // Player-specific state
    this.state = "idle"; // Describes the player's current state

    // Movement properties
    this.walkSpeed = config.walkSpeed || 5; // Speed while walking
    this.sprintSpeed = config.sprintSpeed || 10; // Speed while sprinting
  }

  /**
   * Handle shooting.
   */
  shoot() {
    console.log("Player shoots!");
  }

  /**
   * Handle jumping.
   */
  jump() {
    if (this.onGround) {
      this.velocity.y = 15; // Apply upward velocity for jump
      this.onGround = false; // Leave the ground
      this.state = "jumping";
      console.log("Player jumps!");
    }
  }

  /**
   * Handle crouching.
   */
  crouch() {
    console.log("Player is crouching");
    this.state = "crouching";
  }

  /**
   * Handle sliding.
   */
  slide() {
    console.log("Player is sliding!");
    this.state = "sliding";
  }

  /**
   * Handle sprinting.
   */
  sprint() {
    this.state = "sprinting";
    console.log("Player is sprinting");
  }

  /**
   * Handle movement inputs and update velocity.
   * @param {number} deltaTime - Time since the last frame.
   */
  handleMovement(deltaTime) {
    let inputVector = new Vec3(0, 0, 0);

    // Process movement inputs
    if (keys.pressed("W")) inputVector.z -= 1; // Move forward
    if (keys.pressed("S")) inputVector.z += 1; // Move backward
    if (keys.pressed("A")) inputVector.x -= 1; // Move left
    if (keys.pressed("D")) inputVector.x += 1; // Move right

    // Normalize the input vector to prevent faster diagonal movement
    const length = inputVector.magnitude();
    if (length > 0) {
      inputVector = inputVector.normalize();
    }

    // Determine speed (walking or sprinting)
    const speed = this.state === "sprinting" ? this.sprintSpeed : this.walkSpeed;

    // Apply velocity based on input direction and speed
    const velocityChange = inputVector.scale(speed);
    this.velocity.x = velocityChange.x;
    this.velocity.z = velocityChange.z;

    // Update state
    this.state = length > 0 ? (this.state === "sprinting" ? "sprinting" : "walking") : "idle";

    console.log(
      `Input Vector: x=${inputVector.x.toFixed(2)}, z=${inputVector.z.toFixed(2)}, Speed: ${speed}`
    );
  }

  /**
   * Main update loop for the player.
   * @param {TimeManager} timeManager - Manages delta time and intervals.
   */
  update(timeManager) {
    if (!(timeManager instanceof TimeManager)) {
      throw new Error("Expected timeManager to be an instance of TimeManager.");
    }
  
    const deltaTime = timeManager.getDeltaTime(); // Get delta time
  
    // Handle movement
    this.handleMovement(deltaTime);
  
    // Handle jumping
    if (keys.pressed("Space")) this.jump();
  
    // Handle sprinting
    if (keys.pressed("Shift")) this.sprint();
  
    // Handle crouching
    if (keys.pressed("Ctrl")) this.crouch();
  
    // Handle sliding logic
    if (this.state === "sprinting" && keys.pressed("Ctrl")) this.slide();
  
    // Apply physics updates (gravity, friction, etc.)
    this.updatePhysics(deltaTime);
  
    // Prevent player from falling below the ground
    if (this.position.y < 0) {
      this.position.y = 0; // Reset position to ground level
      this.velocity.y = 0; // Reset vertical velocity
      this.onGround = true; // Ensure player is flagged as on the ground
    }
  
    // Log player position and state for debugging
    console.log(
      `Player state: ${this.state}, Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)})`
    );
  }  
}