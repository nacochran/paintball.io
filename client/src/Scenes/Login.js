import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import UI from "../utils/UI.js";

// forward declare variables
let scene, camera, renderer;

const loginScene = {
  name: "Login",
  init: function () {
    // Setup Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("threed-canvas").innerHTML = '';
    document.getElementById("threed-canvas").appendChild(renderer.domElement);

    // setup UI canvas dimensions
    UI.width = window.innerWidth;
    UI.height = window.innerHeight;

    /////////////////////////
    // Create Form
    /////////////////////////
    // Create Form using innerHTML +=
    document.querySelector('.html-content').innerHTML += `

<div id="login-form-div">
  <p class='error'>none</p>
  <p class='message'>message</p>

  <form action="/login" method="POST" id="login-form">
    <label for="username">Username:</label>
    <input type="text" id="username" name="username" required>
    <br>
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required>
    <br>
    <button type="submit">Login</button>
  </form>

  <!-- Only Display if Error Message is "not_verified" -->
  <form action="/resend-verification" method="GET">
    <button id="resend-verification" type="submit">Resend Verification Email</button>
  </form>
</div>
`;
  },
  display: function () {
    UI.fill(0, 0, 0);
    UI.textSize(50);
    UI.textAlign("center", "top");
    UI.text("Login", UI.width / 2, 150);
  },
  buttons: [
    new Button({
      x: 65,
      y: 35,
      width: 100,
      height: 50,
      display: function () {
        UI.stroke(255, 255, 255);
        UI.strokeWeight(5);

        // Button color changes on hover
        if (this.isInside(mouse, this)) {
          UI.fill(175, 175, 175);
          mouse.setCursor('pointer');
        } else {
          UI.fill(200, 200, 200, 200);
        }

        // Draw the button rectangle
        UI.rect(this.x, this.y, this.width, this.height, 10);

        UI.textSize(20);
        UI.textStyle('Arial');
        UI.fill(0, 0, 0);
        UI.textAlign("center", "bottom");
        UI.text('Home', this.x + this.width / 2, this.y + this.height - 15);
      },
      onClick: function () {
        sceneManager.createTransition('menu');
      }
    })
  ]
};

export default loginScene;
