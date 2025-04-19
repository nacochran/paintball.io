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

    this.size = { width: 1, height: 2, depth: 1 };
    this.health = 100;
    this.camera = camera;

    this.state = "idle";
    this.walkSpeed = 10;
    this.sprintSpeed = 20;
    this.crouchingSpeed = 7;
    this.slidingSpeed = 20;

    this.shape = new Shape({
      type: "cube",
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);
    scene.add(this.shape.mesh);

    this.eyeHeight = 1.5;

    this.weaponHolder = new THREE.Object3D();
    this.weaponHolder.name = "WeaponHolder";
    //this.weaponHolder.position.set(0.3, -0.3, -0.6);
    this.weaponHolder.position.set(0.3, this.eyeHeight, -0.6);
    this.shape.mesh.add(this.weaponHolder);

    const holderHelper = new THREE.AxesHelper(0.2);
    this.weaponHolder.add(holderHelper);

    this.loadWeaponModel(scene);

    this.boundingBox = new BoundingBox(this, scene);
    this.slideStartTime = null;
    this.sceneRef = scene;

    this.weapon = new Pistol();
  }

  loadWeaponModel(scene) {
    const pistolShape = new Shape({
      type: "gltf",
      url: "/assets/gltf/pistol/pistol.glb",
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(0, 0, 0),
      collidable: false,
  
      onLoad: (group) => {
        console.log("✅ Gun model loaded successfully");
  
        group.name = "GunModel";
  
        // 🔄 Center mesh geometry
        group.traverse((child) => {
          if (child.isMesh) {
            child.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            child.geometry.boundingBox.getCenter(center);
            child.geometry.translate(-center.x, -center.y, -center.z);
          }
        });
  
        // 🔧 Adjust transform for first-person view
        group.scale.set(0.15, 0.15, 0.15);
        group.rotation.set(0, -Math.PI / 2, 0); // 90 degree to the left model loads sideways for some reason
        group.position.set(0.3, this.eyeHeight - 3, -0.5); // Eye level, slightly right/front
  
        // 📌 Attach to weapon holder
        this.weaponHolder.add(group);
        this.weaponModel = group;
  
        // 🛠 Debug helpers
        group.add(new THREE.AxesHelper(0.3));
        const gunBox = new THREE.BoxHelper(group, 0xffff00);
        scene.add(gunBox);
  
        console.log("📦 Gun adjusted and attached");
        console.log("🌐 World Pos:", group.getWorldPosition(new THREE.Vector3()));
      },
  
      onError: (err) => {
        console.error("❌ Failed to load gun model", err);
      }
    });
  }

  handleMovement() {
    if (!this.camera) return;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (keys.pressed("W")) move.add(forward);
    if (keys.pressed("S")) move.sub(forward);
    if (keys.pressed("A")) move.sub(right);
    if (keys.pressed("D")) move.add(right);

    if (move.lengthSq() > 0) move.normalize();
    this.wishDir.copy(move);

    if (keys.pressed("Shift") && keys.pressed("C")) {
      if (this.state !== "sliding") this.slideStartTime = Date.now() / 1000;
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

    if (keys.pressed("Space") && this.isGrounded) {
      if (this.state === "sliding" && this.slideStartTime && Date.now() / 1000 - this.slideStartTime < 0.3) {
        this.velocity.y = 25;
        this.velocity.add(this.wishDir.clone().multiplyScalar(20));
        this.isGrounded = false;
        this.slideStartTime = null;
        this.state = "longJump";
      } else {
        this.velocity.y = 15;
        this.isGrounded = false;
      }
    }

    if (keys.pressed("N")) {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      this.weapon.fire(this.position, forward, Date.now() / 1000, this.sceneRef);
    }
  }

  updateEyeHeight() {
    const targetHeight = (this.state === "crouching" || this.state === "sliding") ? 1.0 : 1.5;
    this.eyeHeight += (targetHeight - this.eyeHeight) * 0.2;
  }

  update(entities, cameraQuat) {
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();

    while (this.accumulatedTime >= this.fixedDelta) {
      this.previousPosition.copy(this.position);
      this.handleMovement();
      this.updatePhysics(this.fixedDelta);
      this.handleCollisions(entities);
      this.updateEyeHeight();
      if (this.boundingBox?.update) this.boundingBox.update();
      this.accumulatedTime -= this.fixedDelta;
    }

    const camOffset = new THREE.Vector3(0, this.eyeHeight, 0);
    this.camera.position.copy(this.position).add(camOffset);

    const worldEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, "YXZ");
    this.rotation = new THREE.Euler(0, worldEuler.y, 0);

    this.shape.mesh.position.copy(this.position);
    this.shape.update();
  }
}
