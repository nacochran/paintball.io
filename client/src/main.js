import './style.css'
import * as THREE from 'three';

// Get references to the menu and game div
const menu = document.getElementById('menu');
const game = document.getElementById('game');
const startButton = document.getElementById('startButton');

// Event listener for "Start Game" button
startButton.addEventListener('click', () => {
  // Hide the menu and show the game
  menu.style.display = 'none';
  game.style.display = 'block';

  // Initialize Three.js game scene
  initGame();
});

// Function to initialize the Three.js scene
function initGame() {
  // Create a scene
  const scene = new THREE.Scene();

  // Set up camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Set up renderer (canvas for Three.js)
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  game.appendChild(renderer.domElement); // Append renderer to the game div

  // Create a cube
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  // Set camera position
  camera.position.z = 5;

  // Animation loop to rotate the cube and render the scene
  function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}

