import * as THREE from 'three';
import Player from "./GameObjects/Player.js";
import Block from "./GameObjects/Block.js";

export default class GameManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cube = null;
    // game objects
    this.entities = [];
  }

  // put things in here that you want to be called once
  setup() {
    // Create a scene
    this.scene = new THREE.Scene();

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Set up renderer (canvas for Three.js)
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("game").appendChild(this.renderer.domElement);

    // Create a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Set camera position
    this.camera.position.z = 5;

    this.entities.push(new Player({ x: 50, y: 50, z: 50 }));
  }

  // put things in here tha tyou want to be called in the game loop
  run() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);

    this.entities.forEach(entity => {
      entity.update();
    });

  }
}