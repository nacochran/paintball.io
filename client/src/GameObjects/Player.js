import PhysicsEntity from "./PhysicsEntity.js";
import { mouse, keys, sceneManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import { Vec3 } from "../utils/vector.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    this.size = { width: 50, height: 50, depth: 50 };

    this.state = "idle";

    // Movement properties
    this.walkSpeed = 5;
    this.sprintSpeed = 10;

    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);
  }

  /**
   * Handle movement inputs and update velocity.
   */
  handleMovement() {
    // Set velocity direction
    let inputVector = new Vec3(0, 0, 0);
    if (keys.pressed("W")) inputVector.z -= 1; // Move forward
    if (keys.pressed("S")) inputVector.z += 1; // Move backward
    if (keys.pressed("A")) inputVector.x -= 1; // Move left
    if (keys.pressed("D")) inputVector.x += 1; // Move right 

    // Scale Velocity up to walking/sprinting speed
    this.state = "walking";
    const speed = this.state === "sprinting" ? this.sprintSpeed : this.walkSpeed;
    const velocityChange = inputVector.scale(speed);
    this.velocity.x = velocityChange.x;
    this.velocity.z = velocityChange.z;

    // Handle jumping
    if (keys.pressed("Space")) {
      if (this.onPlatform) {
        this.velocity.y = 8;
      }
    }
  }

  /**
   * Main update loop for the player.
   */
  update(entities) {
    // Handle movement
    this.handleMovement();

    // Apply physics updates (gravity, friction, etc.)
    this.updatePhysics(entities);

    // update shape's position, size, and orientation
    this.shape.update();
  }
}
