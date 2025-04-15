import PhysicsEntity from "./PhysicsEntity.js";
import { keys } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from "three";
import BoundingBox from "../utils/BoundingBox.js";
import Pistol from "./Guns/Pistol.js";
import RPG from "./Guns/Rpg.js";

export default class Player extends PhysicsEntity {
  constructor(config, scene, camera) {
    super(config);

    // Define player size
    this.size = { width: 1, height: 2, depth: 1 };
    this.health = 100;
    this.camera = camera;

    // States and speeds
    this.state = "idle";
    this.walkSpeed = 10;
    this.sprintSpeed = 20;
    this.crouchingSpeed = 7;
    this.slidingSpeed = 20;

    // Orientation
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();

    // Create visual shape
    this.shape = new Shape({
      type: "cube",
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);
    scene.add(this.shape.mesh);

    // Eye holder for the camera
    this.eyeHolder = new THREE.Object3D();
    this.eyeHolder.position.set(0, 1.5, 0);
    this.shape.mesh.add(this.eyeHolder);

    // Collision bounding box
    this.boundingBox = new BoundingBox(this, scene);

    // Slide/long jump
    this.slideStartTime = null;
    this.sceneRef = scene;
    this.wepon = new Pistol();
  }

  handleMovement() {
    if (!this.camera) {
      console.error("Camera reference is missing in Player!");
      return;
    }

    // Get camera forward direction (flattened)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Get camera right vector
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Build movement vector
    const move = new THREE.Vector3();
    if (keys.pressed("W")) move.add(forward);
    if (keys.pressed("S")) move.sub(forward);
    if (keys.pressed("A")) move.sub(right);
    if (keys.pressed("D")) move.add(right);

    if (move.lengthSq() > 0) move.normalize();
    this.wishDir.copy(move);

    // Determine state and target speed
    if (keys.pressed("Shift") && keys.pressed("C")) {
      if (this.state !== "sliding") {
        this.slideStartTime = Date.now() / 1000;
      }
      this.state = "sliding";
      this.targetSpeed = this.slidingSpeed;
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

    // Jump logic
    if (keys.pressed("Space") && this.isGrounded) {
      if (
        this.state === "sliding" &&
        this.slideStartTime &&
        Date.now() / 1000 - this.slideStartTime < 0.3
      ) {
        this.velocity.y = 25;
        const boost = this.wishDir.clone().multiplyScalar(20);
        this.velocity.add(boost);
        this.isGrounded = false;
        this.slideStartTime = null;
        this.state = "longJump";
      } else {
        this.velocity.y = 15;
        this.isGrounded = false;
      }
    }

    // Fire weapon with N
    if (keys.pressed("N")) {
      this.wepon.fire(this.position, forward, Date.now() / 1000, this.sceneRef);
    }
  }

  update(entities) {
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();

    while (this.accumulatedTime >= this.fixedDelta) {
      this.previousPosition.copy(this.position);
      this.handleMovement();
      this.updatePhysics(this.fixedDelta);
      this.handleCollisions(entities);

      if (this.boundingBox?.update) {
        this.boundingBox.update();
      }
      this.accumulatedTime -= this.fixedDelta;
    }

    // Sync the visual mesh with the player's position/orientation
    this.shape.mesh.position.copy(this.position);
    this.shape.mesh.quaternion.setFromEuler(this.rotation);
    this.shape.update();

    // console.log("Player pos:", this.position.toArray(),
    //             "Mesh pos:", this.shape.mesh.position.toArray());
  }
}