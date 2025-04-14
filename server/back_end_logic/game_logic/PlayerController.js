import * as CANNON from 'cannon-es';

class PlayerController {
  constructor(config) {
    this.physicsWorld = config.world;
    this.accelerationSpeed = 500;
    this.maxSpeed = 10;
    this.jumpStrength = 8;
    this.rotationSpeed = Math.PI / 60; // speed for rotation in radians per frame

    // Player body (this will control the player's position and rotation)
    this.body = this.physicsWorld.add_body('player', {
      size: config.size,
      position: config.position
    });

    this.onGround = false;
    this.t = 0;

    // Add event listener for collisions
    this.body.addEventListener('collide', this.handleCollision.bind(this));
  }

  handleCollision(event) {
    const otherBody = event.body;

    // console.log("Colliding");
    // console.log(otherBody.collisionFilterGroup, this.physicsWorld.groups['blocks']);
    if (otherBody.collisionFilterGroup === this.physicsWorld.groups['blocks']) {
      const contact = event.contact;

      const collisionNormal = contact.ni;

      if (collisionNormal && collisionNormal.y < 0) {
        this.onGround = true;
      }
    }
  }

  // receives two normalized vectors representing the
  // right/forward vectors of the camera
  updateOrientation(quaternionData) {
    // Create a CANNON.js quaternion from received data
    const quaternion = new CANNON.Quaternion(quaternionData.x, quaternionData.y, quaternionData.z, quaternionData.w);

    // Apply the quaternion to the player's physics body
    this.body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }


  // Move the player based on its rotation (WASD keys) with forces and velocity control
  applyForce(direction) {
    let force = new CANNON.Vec3(0, 0, 0); // Zero out the force initially

    // Calculate the force based on direction
    switch (direction) {
      case 'forward':
        force = new CANNON.Vec3(0, 0, -1); // Local forward direction (along Z-axis)
        break;
      case 'backward':
        force = new CANNON.Vec3(0, 0, 1); // Local backward direction (along Z-axis)
        break;
      case 'left':
        force = new CANNON.Vec3(-1, 0, 0); // Local left direction (along X-axis)
        break;
      case 'right':
        force = new CANNON.Vec3(1, 0, 0); // Local right direction (along X-axis)
        break;
    }

    // Apply the player's rotation to the force direction
    force = this.body.quaternion.vmult(force);

    // Scale the force to the desired speed
    force = force.scale(this.accelerationSpeed);

    // Apply the force to the player's body
    this.body.applyForce(force, new CANNON.Vec3(0, 0, 0));
  }

  // Methods for movement (WASD)
  moveForward() {
    if (this.body.velocity.length() < this.maxSpeed) {
      this.applyForce('forward');
    }
  }

  moveBackward() {
    if (this.body.velocity.length() < this.maxSpeed) {
      this.applyForce('backward');
    }
  }

  moveLeft() {
    if (this.body.velocity.length() < this.maxSpeed) {
      this.applyForce('left');
    }
  }

  moveRight() {
    if (this.body.velocity.length() < this.maxSpeed) {
      this.applyForce('right');
    }
  }

  jump() {
    if (this.onGround) {
      // Directly set the y-velocity for the jump (no need to apply force)
      this.body.velocity.y = this.jumpStrength;
      this.onGround = false;
    }

    if (++this.t > 5) {
      this.onGround = false;
    }
  }
}

export default PlayerController;