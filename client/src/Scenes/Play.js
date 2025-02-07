import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import Block from "../GameObjects/Block.js";
import { Shape, ShapeBuilder } from "../utils/ShapeHelper.js";

// forward declare variables
let scene, camera, renderer;

class Game {
  constructor() {
    // Game objects
    this.entities = [];
    // For a third-person camera, define the offset in local space relative to the player.
    // For example: 10 units up and 20 units behind.
    this.camera = {
      // This offset is in the player's local coordinate space.
      offset: new THREE.Vector3(0, 10, -20),
      target: null
    };
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

    // Create the player
    const player = new Player({ x: 0, y: 0, z: 0 });
    this.entities.push(player);
    this.camera.target = player;

    /*
    // Create some blocks
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const b0 = new Block({ x: -5 + i, y: -20, z: -5 + j});
        this.entities.push(b0);
      }
    }

    for (let i = 0; i < 8; i++) {
      const b1 = new Block({ x: -1 + i, y: -15, z: -1});
      this.entities.push(b1);
    }

    for (let i = 0; i < 8; i++) {
      const b1 = new Block({ x: -3 + i, y: -5, z: -2});
      this.entities.push(b1);
    }
    */

    // Imports Custom Shape
    // IMPORTANT: When the model loads, its childEntities array will be populated.
    const testImportShape = new Shape({
      type: 'gltf',
      url: './assets/gltf/TestLevelOne.glb',
      size: { width: 1, height: 1, depth: 1 },
      position: new THREE.Vector3(5, -50, 5),
      onLoad: (loadedGroup) => {
        console.log("Model fully loaded. Now updating game entities.");
        if (loadedGroup.childEntities && loadedGroup.childEntities.length) {
          loadedGroup.childEntities.forEach(entity => {
            game.entities.push(entity);
          });
        }
      }
    });

    // Add the loaded group to the scene
    scene.add(testImportShape.mesh);

    // Loop over existing entities and add their meshes to the scene
    this.entities.forEach(entity => {
      if (entity.shape && entity.shape.mesh) {
        scene.add(entity.shape.mesh);
      } else {
        console.warn("Entity does not have a valid shape or mesh:", entity);
      }
    });

    // (Optional duplicate loop removed for clarity.)

    // Initial camera setup
    this.updateCameraPosition();
  }

  /**
   * Updates the camera position to follow the player in a third-person perspective.
   * The camera offset is defined in the player's local space. We rotate the offset
   * by the player's current rotation and add it to the player's world position.
   */
  updateCameraPosition() {
    const player = this.camera.target;
    
    // Clone the offset (local space vector) so we don't modify the original.
    const localOffset = this.camera.offset.clone();
    
    // Flip the camera by adding PI (180°) to the player's Y rotation.
    const rotationY = new THREE.Euler(0, player.rotation.y + Math.PI, 0);
    localOffset.applyEuler(rotationY);
    
    // Set the camera's position to the player's position plus the transformed offset.
    camera.position.copy(player.position).add(localOffset);
    
    // Make the camera look at the player's position (optionally add an upward offset so it looks at the head).
    const lookAtPos = player.position.clone();
    lookAtPos.y += 5; // Adjust as needed.
    camera.lookAt(lookAtPos);
  }

  play() {
    // Update entities
    this.entities.forEach(entity => {
      entity.update(this.entities);
    });

    // Update the camera position to follow the player from third-person perspective
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