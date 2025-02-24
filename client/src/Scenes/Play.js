import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import Block from "../GameObjects/Block.js";
import { Shape, ShapeBuilder } from "../utils/ShapeHelper.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Forward-declare variables
let scene, camera, renderer;

class Game {
  constructor() {
    // Game objects
    this.entities = [];
    this.clock = new THREE.Clock();
    this.pointerLockControls = null;
  }

  setup() {
    this.entities = [];

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0x87ceeb); // Sky-blue

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();
    scene.add(directionalLight);

   // Create the camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      2000
    );

    // Then create the player and pass in the camera
    const player = new Player({ x: 0, y: -30, z: 0 }, scene, camera);
    this.entities.push(player);
    this.camera = { target: player };

    // Instantiate PointerLockControls (remove FirstPersonControls entirely)
    this.pointerLockControls = new PointerLockControls(camera, renderer.domElement);
    scene.add(this.pointerLockControls.getObject());

    // Request pointer lock on click
    renderer.domElement.addEventListener('click', () => {
      renderer.domElement.requestPointerLock();
    });

    // Position the camera initially at the player's eye level.
    camera.position.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));

    // Imports Custom Shape (your existing GLTF loading code)
    const testImportShape = new Shape({
      type: 'gltf',
      url: './assets/gltf/TestLevelOne.glb',
      scene: scene,
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(0, -50, 0),
      onLoad: (loadedGroup) => {
        console.log("Model fully loaded. Now updating game entities.");
        if (loadedGroup.childEntities && loadedGroup.childEntities.length) {
          loadedGroup.childEntities.forEach(entity => {
            game.entities.push(entity);
          });
        }
      }
    });
    scene.add(testImportShape.mesh);

    // Add entity meshes to the scene
    this.entities.forEach(entity => {
      if (entity.shape && entity.shape.mesh) {
        scene.add(entity.shape.mesh);
      } else {
        console.warn("Entity does not have a valid shape or mesh:", entity);
      }
    });

    // Initial camera setup
    this.updateCameraPosition();
  }

  /**
   * Updates the camera position to follow the player in first-person view.
   * The camera is placed at the player's eye level, and the player's yaw is updated from the camera.
   */
  updateCameraPosition() {
    const player = this.camera.target;
    // Set the camera at the player's eye level:
    camera.position.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));
    // Copy the camera’s yaw (horizontal rotation) to the player so that movement aligns with view.
    player.rotation.y = camera.rotation.y;
  }

  play() {
    const deltaTime = this.clock.getDelta();

    // Update entities (your physics, collision, etc.)
    this.entities.forEach(entity => {
      entity.update(this.entities);
    });

    // No need to update any FirstPersonControls – PointerLockControls automatically listens to mouse movement.
    // Update the camera position to follow the player.
    this.updateCameraPosition();

    // Render the scene
    renderer.render(scene, camera);
  }
}

const game = new Game();

// play scene : runs game
const playScene = {
  name: "Play",
  init: function () {
    // Setup Three.js
    scene = new THREE.Scene();
    // (The camera is created in game.setup, so this instantiation here is not strictly necessary.)
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById("3d-canvas").innerHTML = '';
    document.getElementById("3d-canvas").appendChild(renderer.domElement);

    // Add pointer lock event listeners here:
    renderer.domElement.addEventListener('click', () => {
      game.pointerLockControls.lock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === renderer.domElement) {
        console.log("Pointer locked!");
      } else {
        console.log("Pointer unlocked!");
      }
    });

    document.addEventListener('pointerlockerror', () => {
      console.error("Error while attempting to lock pointer");
    });``

    // Setup Game
    game.setup();
  },
  display: function () {
    game.play();
  },
  buttons: [
    new Button({
      x: window.innerWidth - 125,
      y: 25,
      width: 100,
      height: 50,
      display: function () {
        const ctx = UICanvas.getContext('2d');

        ctx.strokeStyle = 'rgb(255, 255, 255)';
        ctx.lineWidth = 5;

        if (this.isInside(mouse, this)) {
          ctx.fillStyle = 'rgb(175, 175, 175)';
          mouse.setCursor('pointer');
        } else {
          ctx.fillStyle = 'rgb(200, 200, 200, 200)';
        }

        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillText('Home', this.x + 23, this.y + 31);
      },
      onClick: function () {
        sceneManager.createTransition('menu');
      }
    })
  ]
};

export default playScene;