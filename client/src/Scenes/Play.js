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
    this.camera = {
      offset: new THREE.Vector3(0, 400, 600),
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

    // Create some blocks
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const b0 = new Block({ x: -500 + i * 50, y: -200, z: -500 + j * 50 });
        this.entities.push(b0);
      }
    }

    for (let i = 0; i < 8; i++) {
      const b1 = new Block({ x: -100 + i * 50, y: -150, z: -100 });
      this.entities.push(b1);
    }

    for (let i = 0; i < 8; i++) {
      const b1 = new Block({ x: -300 + i * 50, y: -50, z: -200 });
      this.entities.push(b1);
    }

    // Imports Custom Shape
    const testImportShape = new Shape({
      type: 'gltf',
      url: './assets/gltf/low_poly_building/scene.gltf', // Absolute path to your glTF file
      size: { width: 50, height: 50, depth: 50 }, // Optional scaling
      position: new THREE.Vector3(5, 5, 5), // Initial position
    });
    //this.entities.push(testImportShape); breaks and does not load but error handling allows game to run anywasy
    scene.add(testImportShape.mesh);

    ///////////////////////////////////////////////
    // Loop over entities and add each of their  //
    // shapes' meshes to the scene               //
    ///////////////////////////////////////////////

    // I added functionality to see if adding something to the scene didn't have a shape or mesh
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
   * Updates the camera position to follow the player.
   */
  updateCameraPosition() {
    const player = this.camera.target;

    const targetPosition = new THREE.Vector3(
      player.position.x + this.camera.offset.x,
      player.position.y + this.camera.offset.y,
      player.position.z + this.camera.offset.z
    );

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition, 0.1);

    // Ensure the camera is always looking at the player
    camera.lookAt(player.shape.mesh.position);
  }

  play() {
    // Update entities
    this.entities.forEach(entity => {
      entity.update(this.entities);
    });

    // Update the camera position to follow the player
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
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