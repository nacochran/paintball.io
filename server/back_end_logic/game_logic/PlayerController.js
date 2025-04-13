import * as CANNON from 'cannon-es';

class PlayerController {
  constructor(config) {
    this.physicsWorld = config.world;

    // Configurable values
    this.groundAcceleration = 30;
    this.airAcceleration = 20;
    this.groundMaxSpeed = 15;
    this.airMaxSpeed = 50;
    this.jumpStrength = 8;
    this.rotationSpeed = Math.PI / 60;
    this.postLandFrictionDelay = 200;

    this.body = this.physicsWorld.add_body('player', {
      size: config.size,
      position: config.position,
    });

    this.body.angularFactor.set(0, 0, 0);
    this.body.angularDamping = 1;
    this.body.linearDamping = 0.1;

    this.onGround = false;
    this.landedAt = 0;
    this.jumpCooldownFrames = 0;

    this.body.addEventListener('collide', this.handleCollision.bind(this));
  }

  handleCollision(event) {
    const contact = event.contact;
    if (!contact) return;

    const normal = contact.bi === this.body ? contact.ni.clone() : contact.ni.clone().negate();

    if (normal.y > 0.5) {
      this.onGround = true;
      this.landedAt = performance.now();
      this.jumpCooldownFrames = 0;
    }
  }

  applyDirectionalAcceleration(localDirVec) {
    const worldDir = this.body.quaternion.vmult(localDirVec.clone());
    worldDir.y = 0;

    if (worldDir.lengthSquared() === 0) return;
    worldDir.normalize();

    if (this.onGround) {
      const force = worldDir.scale(this.groundAcceleration);
      this.body.applyForce(force, this.body.position);
      this.limitHorizontalSpeed(this.groundMaxSpeed);
    } else {
      this.airStrafe(worldDir);
      this.steerVelocity(worldDir, 0.2);
    }
  }

  airStrafe(worldDir) {
    const vel = this.body.velocity.clone();
    const yVel = vel.y;
    vel.y = 0;

    const currentSpeed = vel.dot(worldDir);
    const addSpeed = this.airMaxSpeed - currentSpeed;

    if (addSpeed <= 0) return;

    let accelSpeed = this.airAcceleration * 0.1;
    if (accelSpeed > addSpeed) accelSpeed = addSpeed;

    vel.x += worldDir.x * accelSpeed;
    vel.z += worldDir.z * accelSpeed;

    this.body.velocity.set(vel.x, yVel, vel.z);
  }

  steerVelocity(worldDir, factor) {
    const vel = this.body.velocity.clone();
    const yVel = vel.y;
    vel.y = 0;

    const speed = vel.length();
    if (speed < 0.01) return;

    const oldDir = vel.clone().normalize();

    const newDir = new CANNON.Vec3(
      oldDir.x + (worldDir.x - oldDir.x) * factor,
      oldDir.y + (worldDir.y - oldDir.y) * factor,
      oldDir.z + (worldDir.z - oldDir.z) * factor
    );
    newDir.normalize();

    const final = newDir.scale(speed);
    this.body.velocity.set(final.x, yVel, final.z);
  }

  limitHorizontalSpeed(maxSpeed) {
    const vel = this.body.velocity;
    const horizontal = new CANNON.Vec3(vel.x, 0, vel.z);
    const speed = horizontal.length();
    if (speed > maxSpeed) {
      horizontal.scale(maxSpeed / speed, horizontal);
      vel.x = horizontal.x;
      vel.z = horizontal.z;
    }
  }

  update(inputState = {}) {
    const isJumpHeld = inputState.jump || false;
    const now = performance.now();

    if (this.onGround) {
      const timeSinceLanding = now - this.landedAt;
      const baseFriction = isJumpHeld ? 0.01 : 0.1;
      this.body.linearDamping = timeSinceLanding < this.postLandFrictionDelay
        ? baseFriction * (timeSinceLanding / this.postLandFrictionDelay)
        : baseFriction;
    } else {
      this.body.linearDamping = 0.01;
    }

    if (this.jumpCooldownFrames > 0) {
      this.jumpCooldownFrames--;
    }
  }

  jump() {
    if (!this.onGround || this.jumpCooldownFrames > 0) return;

    this.body.velocity.y = this.jumpStrength;
    this.onGround = false;
    this.jumpCooldownFrames = 5;
  }

  updateOrientation(quat) {
    this.body.quaternion.set(quat.x, quat.y, quat.z, quat.w);
  }

  moveForward() {
    this.applyDirectionalAcceleration(new CANNON.Vec3(0, 0, -1));
    console.log("testing to see if move forward");
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
}

export default PlayerController;