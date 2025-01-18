import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import Block from "../GameObjects/Block.js";

// forward declare variables
let scene, camera, renderer;

class Game {
  constructor() {
    this.cube = null;

    // game objects
    this.entities = [];
  }

  setup() {
    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    scene.add(this.cube);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Set camera position
    camera.position.z = 5;

    this.entities.push(new Player({ x: 50, y: 50, z: 50 }));
  }

  play() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    renderer.render(scene, camera);

    this.entities.forEach(entity => {
      entity.update();
    });
  }
}

const game = new Game();

// play scene : runs game
const playScene = {
  name: "Play",
  init: function (config) {
    // Setup Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
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


