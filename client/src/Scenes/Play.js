import * as THREE from "three";
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas, DEV_MODE } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import { Shape, ShapeBuilder } from "../utils/ShapeHelper.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import UI from "../utils/UI.js";

// Forward-declare references
let scene, camera, renderer;

class Game {
  constructor() {
    this.entities = [];
    this.clock = new THREE.Clock();

    // Single scene/camera/renderer references
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Use pointer lock only for locking; we handle rotation manually.
    this.pointerLockControls = null;

    // Numeric yaw and pitch accumulators (in radians)
    this.yaw = 0;
    this.pitch = 0;
    
    // Smoothed quaternion that will be slerped toward the desired quaternion.
    this.smoothedQuat = new THREE.Quaternion();
    // Smoothing factor: closer to 1 is more "snappy", closer to 0 is smoother.
    this.smoothingFactor = 0.2;
    // Clamp pitch to avoid flipping.
    this.pitchLimit = Math.PI / 2 - 0.05;

    this.cameraTarget = null; // The player that the camera follows.
    // Bind the mouse move handler
    this.mouseMoveHandler = this.handleMouseMove.bind(this);
  }

  // Setup uses the scene, camera, renderer created in playScene.init.
  setup(scene, camera, renderer) {
    this.entities = [];
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    this.scene.background = new THREE.Color(0x87ceeb);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();
    this.scene.add(directionalLight);

    // Create the player at (0, 0, 0)
    const player = new Player({ x: 0, y: 0, z: 0 }, this.scene, this.camera);
    this.entities.push(player);
    this.cameraTarget = player;

    // Initialize our accumulator values by reading the current camera's Euler.
    const initialEuler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, "YXZ");
    this.yaw = initialEuler.y;
    this.pitch = initialEuler.x;
    // Initialize the smoothed quaternion from the initial orientation.
    this.smoothedQuat.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, "YXZ"));

    // Instantiate PointerLockControls with the same camera.
    this.pointerLockControls = new PointerLockControls(this.camera, this.renderer.domElement);
    // Reset the pointer lock camera's local position to zero.
    this.pointerLockControls.object.position.set(0, 0, 0);

    // Attach the pointer lock camera to the player's eyeHolder.
    player.eyeHolder.add(this.pointerLockControls.object);
    // Do NOT add pointerLockControls.object separately to the scene.

    // On canvas click, request pointer lock.
    this.renderer.domElement.addEventListener("click", () => {
      this.pointerLockControls.lock();
    });

    // When pointer lock status changes, add or remove the mousemove event listener.
    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === this.renderer.domElement;
      if (locked) {
        console.log("Pointer locked");
        document.addEventListener("mousemove", this.mouseMoveHandler, false);
      } else {
        console.log("Pointer unlocked");
        document.removeEventListener("mousemove", this.mouseMoveHandler, false);
      }
    });

    document.addEventListener("pointerlockerror", () => {
      console.error("Pointer lock error");
    });

    // Load a sample GLTF model
    const url = (DEV_MODE === "front-end")
      ? "./assets/gltf/TestLevelOne.glb"
      : "client/dist/public/assets/gltf/TestLevelOne.glb";

    const testImportShape = new Shape({
      type: "gltf",
      url: url,
      scene: this.scene,
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(0, -50, 0),
      onLoad: (loadedGroup) => {
        console.log("Model loaded. Updating entities.");
        if (loadedGroup.childEntities && loadedGroup.childEntities.length) {
          loadedGroup.childEntities.forEach(entity => {
            this.entities.push(entity);
          });
        }
      }
    });
    this.scene.add(testImportShape.mesh);

    // Add each entity's mesh to the scene.
    this.entities.forEach(entity => {
      if (entity.shape && entity.shape.mesh) {
        this.scene.add(entity.shape.mesh);
      }
    });
  }

  // Mouse move handler that accumulates yaw and pitch.
  handleMouseMove(event) {
    // Log raw delta values.
    console.log("Raw movementX:", event.movementX, "movementY:", event.movementY);
    const sensitivity = 0.002; // Tweak sensitivity as needed.

    // Subtract movementX so that moving right decreases yaw (typical in PointerLockControls)
    this.yaw -= event.movementX * sensitivity;
    // Subtract movementY so that moving mouse up decreases pitch (which typically causes the view to look up)
    this.pitch -= event.movementY * sensitivity;

    // Clamp pitch.
    this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
    console.log("Accumulated yaw:", this.yaw, "Accumulated pitch:", this.pitch);
  }

  // Use numeric yaw/pitch to build a desired quaternion and then slerp the current smoothed quaternion toward it.
  applySmoothing(deltaTime) {
    const desiredEuler = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ");
    const desiredQuat = new THREE.Quaternion().setFromEuler(desiredEuler);
    this.smoothedQuat.slerp(desiredQuat, this.smoothingFactor);
    // Update the pointer lock camera object's rotation.
    this.pointerLockControls.object.quaternion.copy(this.smoothedQuat);
  }

  play() {
    const deltaTime = this.clock.getDelta();

    // Update each entity (for example, the player)
    this.entities.forEach(entity => {
      entity.update(this.entities);
    });

    // Apply smoothing to update the camera rotation.
    this.applySmoothing(deltaTime);

    // Optionally, update the camera target's yaw to match the smoothed yaw.
    this.updateCameraPosition();

    // Render the scene.
    this.renderer.render(this.scene, this.camera);
  }

  updateCameraPosition() {
    if (!this.cameraTarget) return;
    const euler = new THREE.Euler().setFromQuaternion(this.smoothedQuat, "YXZ");
    this.cameraTarget.rotation.y = euler.y;
  }
}

const game = new Game();

const playScene = {
  name: "Play",

  init: function () {
    // Create one scene, one camera, and one renderer.
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    const container = document.getElementById("threed-canvas");
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Set up pointer lock event listeners
    renderer.domElement.addEventListener("click", () => {
      game.pointerLockControls?.lock();
    });

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === renderer.domElement;
      console.log(locked ? "Pointer locked" : "Pointer unlocked");
    });

    document.addEventListener("pointerlockerror", () => {
      console.error("Pointer lock error");
    });

    // Pass the created scene, camera, and renderer to game.setup.
    game.setup(scene, camera, renderer);
  },

  display: function () {
    game.play();
  },

  buttons: [
    new Button({
      x: 65,
      y: 35,
      width: 100,
      height: 50,
      display: function () {
        UI.stroke(255);
        UI.strokeWeight(5);
        if (this.isInside(mouse, this)) {
          UI.fill(175);
          mouse.setCursor("pointer");
        } else {
          UI.fill(200, 200, 200, 200);
        }
        UI.rect(this.x, this.y, this.width, this.height, 10);
        UI.textSize(20);
        UI.textStyle("Arial");
        UI.fill(0);
        UI.textAlign("center", "bottom");
        UI.text("Home", this.x + this.width / 2, this.y + this.height - 15);
      },
      onClick: function () {
        sceneManager.createTransition("menu");
      }
    })
  ]
};

export default playScene;