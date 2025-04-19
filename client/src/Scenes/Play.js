import * as THREE from "three";
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas, DEV_MODE } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import { Shape } from "../utils/ShapeHelper.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import UI from "../utils/UI.js";

let scene, camera, renderer;

class Game {
  constructor() {
    this.entities = [];
    this.clock = new THREE.Clock();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.pointerLockControls = null;
    this.cameraTarget = null;
    this.weaponLight = null;
  }

  setup(scene, camera, renderer) {
    this.entities = [];
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Global ambient + directional
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Slightly brighter ambient
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.background = new THREE.Color(0x87ceeb);

    // ✅ Add a point light near the gun (follows camera)
    this.weaponLight = new THREE.PointLight(0xffffff, 1.2, 3);
    this.weaponLight.position.set(0.3, -0.1, -0.5); // Slightly to the right and down
    this.camera.add(this.weaponLight); // Attach to camera so it moves with the view

    const player = new Player({ x: 0, y: -49, z: 0 }, this.scene, this.camera);
    this.entities.push(player);
    this.cameraTarget = player;

    this.pointerLockControls = new PointerLockControls(this.camera, this.renderer.domElement);

    const debugBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    debugBox.position.set(0.3, -0.3, -1.0);
    this.camera.add(debugBox);

    this.renderer.domElement.addEventListener("click", () => {
      this.pointerLockControls.lock();
    });

    document.addEventListener("pointerlockchange", () => {
      const locked = document.pointerLockElement === this.renderer.domElement;
      console.log(locked ? "Pointer locked" : "Pointer unlocked");
    });

    document.addEventListener("pointerlockerror", () => {
      console.error("Pointer lock error");
    });

    const url = (DEV_MODE === "front-end")
      ? "./assets/gltf/TestLevelOne.glb"
      : "client/dist/public/assets/gltf/TestLevelOne.glb";

    const testImportShape = new Shape({
      type: "gltf",
      url: url,
      scene: this.scene,
      renderer: this.renderer,
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(0, -50, 0),
      onLoad: (loadedGroup) => {
        console.log("Model loaded. Updating entities.");
        if (loadedGroup.childEntities?.length) {
          loadedGroup.childEntities.forEach(entity => {
            this.entities.push(entity);
          });
        }
      }
    });
    this.scene.add(testImportShape.mesh);

    this.entities.forEach(entity => {
      if (entity.shape?.mesh) {
        this.scene.add(entity.shape.mesh);
      }
    });
  }

  play() {
    const deltaTime = this.clock.getDelta();
    const cameraQuat = this.camera.quaternion.clone();

    this.entities.forEach(entity => {
      if (typeof entity.update === "function") {
        entity.update(this.entities, cameraQuat);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}

const game = new Game();

const playScene = {
  name: "Play",

  init: function () {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const container = document.getElementById("threed-canvas");
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

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
