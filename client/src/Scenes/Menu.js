
import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";

// forward declare variables
let scene, camera, renderer;

const menuScene = {
  name: "Menu",
  init: function () {
    // Setup Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("3d-canvas").innerHTML = '';
    document.getElementById("3d-canvas").appendChild(renderer.domElement);
  },
  display: function () {

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
        ctx.fillText('Play', this.x + 26, this.y + 31);
      },
      onClick: function () {
        sceneManager.createTransition('play');
      }
    })
  ]
};

export default menuScene;


