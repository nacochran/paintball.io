import PhysicsEntity from "./PhysicsEntity.js";
import { keys, mouse, socketManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";
import Pistol from "./Guns/Pistol.js";
import RPG from "./Guns/Rpg.js";

export default class Player extends PhysicsEntity {
  constructor(scene, config) {
    super(config);

    this.camera = config.camera;

    this.targetPos = this.position;

    // default player size
    this.size = { width: 1, height: 2, depth: 1 };

    // player stats
    this.health = 100;
    this.XP = 0;

    // input management
    this.inputs = {};
    this.t = 0;

    this.name = config.name;

    this.eyeHeight = 1.5;

    this.shape = new Shape({
      type: "cube",
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });

    this.shape.attach(this);

    this.weaponHolder = new THREE.Object3D();
    this.weaponHolder.raycast = () => { };
    this.weaponHolder.name = "WeaponHolder";
    //this.weaponHolder.position.set(0.3, -0.3, -0.6);
    this.weaponHolder.position.set(0.3, this.eyeHeight, -0.6);
    this.shape.mesh.add(this.weaponHolder);

    const holderHelper = new THREE.AxesHelper(0.2);
    holderHelper.raycast = () => { };
    this.weaponHolder.add(holderHelper);

    // this.loadWeaponModel(scene);
    this.slideStartTime = null;
    this.sceneRef = scene;

    this.weapon = new Pistol();
  }

  /**
   * Process input to set the wish direction and target speed.
   * Also handles jumping and, if sliding, triggers a long jump.
   */
  handleMovement() {
    if (++this.t > 5) {
      const camera = this.camera;

      // send inputs back to server
      // ALSO: pass back camera right/forward vectors for movement calculations
      socketManager.send_inputs(this.inputs, { quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w } });

      // clear inputs
      this.inputs = {};

      // reset counter
      this.t = 0;
    }

    if (keys.pressed("W")) this.inputs['move_forward'] = true;
    if (keys.pressed("S")) this.inputs['move_backward'] = true;
    if (keys.pressed("A")) this.inputs['move_left'] = true;
    if (keys.pressed("D")) this.inputs['move_right'] = true;
    if (keys.pressed("Space")) this.inputs['jump'] = true;
  }

  /*loadWeaponModel(scene) {
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
  }*/

  /**
   * Main update loop for the player.
   * Processes input, updates physics, handles collisions,
   * and updates rotation and transforms for both the shape and bounding box.
   */
  update(entities) {
    // TODO send rotation info to back-end.... or mouse movements...
    this.handleMovement();

    // TODO: use interpolation
    // for now just set entiti pos to target pos
    this.position = this.targetPos;

    this.shape.mesh.position.copy(this.position);
    this.shape.update();

    if (mouse.clicking()) {
      const origin = new THREE.Vector3();
      this.camera.getWorldPosition(origin);
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);

      // record damage info to report to server
      const damageInfo = this.weapon.fire(origin, direction, Date.now() / 1000, this.sceneRef);
      if (damageInfo) {
        this.XP += 10; // something basic for now
        this.inputs['update_XP'] = this.XP;
        this.inputs['damage_dealt'] = (this.inputs['damage_dealt']) ? this.inputs['damage_dealt'] : [];
        this.inputs['damage_dealt'].push({
          damage: damageInfo.damage,
          recipient: damageInfo.recipient
        });
      }
    }
  }
}