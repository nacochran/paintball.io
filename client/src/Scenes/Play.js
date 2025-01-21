import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import Player from "../GameObjects/Player.js";

// forward declare variables
let scene, camera, renderer;

class Game {
  constructor() {
    // Game objects
    this.entities = [];
    this.player = null; // Player instance
    this.groundY = 0; // Y-coordinate of the ground plane
    this.cameraOffset = new THREE.Vector3(0, 5, 12); // Camera offset relative to the player
  }

  setup() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0x87ceeb); // Sky-blue background

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();
    scene.add(directionalLight);

    // Create the player
    this.player = new Player({ x: 0, y: 1, z: 8 }); // Player is placed closer to the camera but visible
    this.entities.push(this.player);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to lay flat
    ground.receiveShadow = true;
    scene.add(ground);

    // Add player to the scene
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.player.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
    this.player.mesh.position.set(this.player.x, this.player.y, this.player.z);
    scene.add(this.player.mesh);

    // Initial camera setup
    this.updateCameraPosition();
  }

  /**
   * Updates the camera position to follow the player.
   */
  updateCameraPosition() {
    const targetPosition = new THREE.Vector3(
      this.player.x + this.cameraOffset.x,
      this.player.y + this.cameraOffset.y,
      this.player.z + this.cameraOffset.z
    );

    // Smoothly interpolate camera position
    camera.position.lerp(targetPosition, 0.1);

    // Ensure the camera is always looking at the player
    camera.lookAt(this.player.mesh.position);
  }

  play() {
    // Update player position based on velocity
    this.player.mesh.position.set(this.player.x, this.player.y, this.player.z);

    // Update entities
    this.entities.forEach(entity => {
      entity.update({
        getDeltaTime: () => 0.016, // Pass a fixed delta time for now (60 FPS)
      });
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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