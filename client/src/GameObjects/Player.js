import PhysicsEntity from "./PhysicsEntity.js";
import { keys, mouse, socketManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";
import Pistol from "./Guns/Pistol.js";
import RPG from "./Guns/Rpg.js";

console.log("Player.js module loaded");

export default class Player extends PhysicsEntity {
  constructor(scene, config) {
    super(config);
    try {
      console.log("Player constructor started");

      this.camera = config.camera;
      this.targetPos = this.position;

      this.size = { width: 1, height: 2, depth: 1 };
      this.health = 100;
      this.XP = 0;
      this.inputs = {};
      this.t = 0;
      this.name = config.name;
      this.eyeHeight = .75;

      this.shape = new Shape({
        type: "cube",
        size: this.size,
        position: this.position,
        color: 0x00ff00
      });

      this.shape.attach(this);

      this.weaponHolder = new THREE.Object3D();
      this.weaponHolder.raycast = () => {};
      this.weaponHolder.name = "WeaponHolder";
      this.weaponHolder.position.set(0.3, this.eyeHeight, -0.6);

      setTimeout(() => {
        if (this.camera) {
          this.camera.add(this.weaponHolder);
          console.log("Weapon holder attached to camera");
        } else {
          console.warn("Camera not available when attaching weapon holder");
        }
      });

      const holderHelper = new THREE.AxesHelper(0.2);
      holderHelper.raycast = () => {};
      this.weaponHolder.add(holderHelper);

      this.slideStartTime = null;
      this.sceneRef = scene;

      console.log("About to call loadWeaponModel");
      this.loadWeaponModel(scene);

      this.weapon = new Pistol();

      console.log("Player constructor completed");
    } catch (err) {
      console.error("Error in Player constructor:", err);
    }
  }

  handleMovement() {
    if (++this.t > 5) {
      const camera = this.camera;
      socketManager.send_inputs(this.inputs, {
        quaternion: {
          x: camera.quaternion.x,
          y: camera.quaternion.y,
          z: camera.quaternion.z,
          w: camera.quaternion.w
        }
      });

      this.inputs = {};
      this.t = 0;
    }

    if (keys.pressed("W")) this.inputs['move_forward'] = true;
    if (keys.pressed("S")) this.inputs['move_backward'] = true;
    if (keys.pressed("A")) this.inputs['move_left'] = true;
    if (keys.pressed("D")) this.inputs['move_right'] = true;
    if (keys.pressed("Space")) this.inputs['jump'] = true;
  }

  loadWeaponModel(scene) {
    console.log("loadWeaponModel called");

    const pistolShape = new Shape({
      type: "gltf",
      url: "/assets/gltf/pistol/pistol.glb",
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(0, 0, 0),
      collidable: false,

      onLoad: (group) => {
        console.log("Gun model loaded successfully");

        group.name = "GunModel";

        group.traverse((child) => {
          if (child.isMesh) {
            child.geometry.computeBoundingBox();
            const center = new THREE.Vector3();
            child.geometry.boundingBox.getCenter(center);
            child.geometry.translate(-center.x, -center.y, -center.z);
          }
        });

        group.scale.set(0.15, 0.15, 0.15);
        group.rotation.set(0, -Math.PI / 2, 0);
        group.position.set(0.3, this.eyeHeight - 3, -0.5);

        this.weaponHolder.add(group);
        this.weaponModel = group;

        group.add(new THREE.AxesHelper(0.3));
        //const gunBox = new THREE.BoxHelper(group, 0xffff00);
        //scene.add(gunBox);

        console.log("Gun adjusted and attached");
        console.log("World Position:", group.getWorldPosition(new THREE.Vector3()));
      },

      onError: (err) => {
        console.error("Failed to load gun model", err);
      }
    });
  }

  update(entities) {
    this.handleMovement();

    this.position = this.targetPos;
    this.shape.mesh.position.copy(this.position);
    this.shape.update();

    if (mouse.clicking()) {
      const origin = new THREE.Vector3();
      this.camera.getWorldPosition(origin);
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);

      const damageInfo = this.weapon.fire(origin, direction, Date.now() / 1000, this.sceneRef);
      if (damageInfo) {
        this.XP += 10;
        this.inputs['update_XP'] = this.XP;
        this.inputs['damage_dealt'] = this.inputs['damage_dealt'] || [];
        this.inputs['damage_dealt'].push({
          damage: damageInfo.damage,
          recipient: damageInfo.recipient
        });
      }
    }
  }
}
