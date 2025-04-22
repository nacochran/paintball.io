import * as CANNON from 'cannon-es';

class PlayerController {
  constructor(config) {
    this.physicsWorld = config.world;

    // movement parameters
    this.groundAcceleration = 280;
    this.airAcceleration = 20;
    this.groundMaxSpeed = 15;
    this.airMaxSpeed = 50;
    this.jumpStrength = 8;
    this.rotationSpeed = Math.PI / 60;
    this.postLandFrictionDelay = 200;
    this.landedAt = 0;

    // Player body (this will control the player's position and rotation)
    this.body = this.physicsWorld.add_body('player', {
      size: config.size,
      position: config.position
    });

    // Prevent spin from collisions
    this.body.angularFactor.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.body.angularDamping = 1;

    this.onGround = false;
    this.jumpCooldownFrames = 0;

    // Add event listener for collisions
    this.body.addEventListener('collide', this.handleCollision.bind(this));
  }

  handleCollision(event) {
    const otherBody = event.body;

    if (otherBody.collisionFilterGroup === this.physicsWorld.groups['blocks']) {
      const contact = event.contact;

      const collisionNormal = contact.ni;

      // if (collisionNormal && collisionNormal.y < 0) {
      //   this.onGround = true;
      // }

      if (collisionNormal && collisionNormal.y < 0.5) {
        this.onGround = true;
        this.landedAt = performance.now();
        this.jumpCooldownFrames = 0;
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

  /**
   * Adds a small amount of horizontal speed if under maxAirSpeed.
   */
  airStrafe(localDirVec) {
    const airAccelerate = 0.03;
    const maxAirSpeed = this.airMaxSpeed;

    // Convert local input to world direction (horizontal only)
    const worldDir = this.body.quaternion.vmult(localDirVec.clone());
    worldDir.y = 0;
    if (worldDir.lengthSquared() === 0) return;
    worldDir.normalize();

    const vel = this.body.velocity.clone();
    const yVel = vel.y;
    vel.y = 0;

    const currentSpeed = vel.dot(worldDir);
    const addSpeed = maxAirSpeed - currentSpeed;
    if (addSpeed <= 0) return;

    let accelSpeed = airAccelerate;
    if (accelSpeed > addSpeed) {
      accelSpeed = addSpeed;
    }

    vel.x += worldDir.x * accelSpeed;
    vel.z += worldDir.z * accelSpeed;
    this.body.velocity.set(vel.x, yVel, vel.z);
  }

  /**
   * Steer velocity horizontally toward input direction WITHOUT increasing speed.
   * Manually lerp between oldDir & newDir to avoid .lerp() issues in Cannon.
   */
  steerVelocity(localDirVec, steerFactor = 0.05) {
    const worldDir = this.body.quaternion.vmult(localDirVec.clone());
    worldDir.y = 0;
    if (worldDir.lengthSquared() === 0) return;
    worldDir.normalize();

    const vel = this.body.velocity.clone();
    const yVel = vel.y;
    vel.y = 0;

    const speed = vel.length();
    if (speed < 0.01) {
      // Not moving horizontally => no steering
      return;
    }

    // oldDir = current velocity direction
    const oldDir = vel.clone();
    oldDir.normalize();

    // Manual LERP for Cannon Vec3:
    // newDir = oldDir + (worldDir - oldDir) * steerFactor
    const newDir = new CANNON.Vec3(
      oldDir.x + (worldDir.x - oldDir.x) * steerFactor,
      oldDir.y + (worldDir.y - oldDir.y) * steerFactor,
      oldDir.z + (worldDir.z - oldDir.z) * steerFactor
    );
    // Now normalize newDir to keep same speed
    newDir.normalize();

    vel.copy(newDir.scale(speed));
    this.body.velocity.set(vel.x, yVel, vel.z);
  }

  applyDirectionalAcceleration(localDirVec) {
    if (this.onGround) {
      const force = this.body.quaternion.vmult(localDirVec).scale(this.groundAcceleration);
      this.body.applyForce(force, this.body.position);
      this.limitHorizontalSpeed(this.groundMaxSpeed);
    } else {
      // In air => add some speed, then steer
      this.airStrafe(localDirVec);
      this.steerVelocity(localDirVec, 0.1);
    }
  }

  limitHorizontalSpeed(maxSpeed) {
    const vel = this.body.velocity;
    const horizontalVel = new CANNON.Vec3(vel.x, 0, vel.z);
    const speed = horizontalVel.length();
    if (speed > maxSpeed) {
      horizontalVel.scale(maxSpeed / speed, horizontalVel);
      vel.x = horizontalVel.x;
      vel.z = horizontalVel.z;
    }
  }

  moveForward() {
    this.applyDirectionalAcceleration(new CANNON.Vec3(0, 0, -1));
  }
  moveBackward() {
    this.applyDirectionalAcceleration(new CANNON.Vec3(0, 0, 1));
  }
  moveLeft() {
    this.applyDirectionalAcceleration(new CANNON.Vec3(-1, 0, 0));
  }
  moveRight() {
    this.applyDirectionalAcceleration(new CANNON.Vec3(1, 0, 0));
  }

  jump() {
    if (!this.onGround) return;
    if (this.jumpCooldownFrames > 0) return;

    this.body.velocity.y = this.jumpStrength;
    this.onGround = false;
    this.jumpCooldownFrames = 5;
  }

  update() {
    if (this.onGround) {
      const timeSinceLanding = performance.now() - this.landedAt;
      if (timeSinceLanding < this.postLandFrictionDelay) {
        const ratio = timeSinceLanding / this.postLandFrictionDelay;
        this.body.linearDamping = 0 + (0.1 - 0) * ratio;
      } else {
        this.body.linearDamping = 0.1;
      }
    } else {
      // Low damping in air
      this.body.linearDamping = 0.01;
    }

    // Decrement jump cooldown
    if (this.jumpCooldownFrames > 0) {
      this.jumpCooldownFrames--;
    }
  }
}

export default PlayerController;