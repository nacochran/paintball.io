import * as THREE from "three";
import Player from "../GameObjects/Player.js";
import ShapeHelper from "../utils/ShapeHelper.js";
import TimeManager from "../EventObjects/TimeManager.js";

class Game {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.entities = [];
    this.timeManager = new TimeManager();
    this.player = null; // Player instance
    this.cameraOffset = new THREE.Vector3(0, 5, 12); // Camera offset relative to the player
  }

  setup() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);
    this.scene.background = new THREE.Color(0x87ceeb); // Sky-blue

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Create the player
    const playerEntity = ShapeHelper.ShapeBuilderPhysics(
      "box",
      {
        position: { x: 0, y: 1, z: 8 },
        size: { width: 1, height: 1, depth: 1 },
        material: { color: 0x00ff00 },
      },
      this.scene
    );
    this.player = playerEntity; // Assign to the Game's player
    this.entities.push(playerEntity); // Add player to entities list

    // Create ground using ShapeHelper
    ShapeHelper.ShapeBuilderStatic(
      "plane",
      {
        position: { x: 0, y: 0, z: 0 },
        size: { width: 50, height: 50 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        material: { color: 0xaaaaaa }, // Light gray
      },
      this.scene
    );

    // Create obstacle using ShapeHelper
    ShapeHelper.ShapeBuilderStatic(
      "box",
      {
        position: { x: 0, y: 2.5, z: 0 }, // Positioned at the center
        size: { width: 5, height: 5, depth: 5 },
        material: { color: 0xff0000 }, // Red
      },
      this.scene
    );

    // Initial camera setup
    this.updateCameraPosition();
  }

  /**
   * Updates the camera position to follow the player.
   */
  updateCameraPosition() {
    const targetPosition = this.player.position.add(this.cameraOffset);

    // Smoothly interpolate camera position
    this.camera.position.lerp(targetPosition, 0.1);

    // Ensure the camera is always looking at the player
    this.camera.lookAt(this.player.mesh.position);
  }

  play() {
    this.timeManager.updateTime(); // Update delta time
    const deltaTime = this.timeManager.getDeltaTime();

    this.entities.forEach((entity) => {
      if (typeof entity.update === "function") {
        entity.update(this.timeManager, this.entities); // Pass timeManager and entities
      }
    });

    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  }
}

const playScene = {
  name: "Play",
  init: function () {
    // Setup Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById("3d-canvas").innerHTML = "";
    document.getElementById("3d-canvas").appendChild(renderer.domElement);

    // Setup Game
    const game = new Game(scene, camera, renderer);
    game.setup();
    this.game = game; // Store game instance for later use
  },
  display: function () {
    this.game.play();
  },
};

export default playScene;