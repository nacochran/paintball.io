import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas } from "../Globals.js";
import UI from "../utils/UI.js";

// forward declare variables
let scene, camera, renderer;

const signupScene = {
  name: "Signup",
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
  <p id='error'>none</p>
  <p id='message'>message</p>

  <!-- Only Display if Error Message is "not_verified" -->
  <form id="resend-verification" >
    <label for="email">Email:</label>
    <input name="email" required>
    <button type="submit">Get New Code</button>
  </form>

  <form id="registerForm">
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
        <br>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <br>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        <br>
        <button type="submit">Sign Up</button>
      </form>

    <form id="verificationForm">
        <label for="verificationCode">Verification Code:</label>
        <input type="text" id="verificationCode" name="verificationCode" required maxlength="6">
        <button type="submit">Verify</button>
    </form>

    <button id="login-button">Go to Login</button>
</div>
`;

    const error = document.getElementById("error");
    const message = document.getElementById("message");
    const registerForm = document.getElementById("registerForm");
    const verificationForm = document.getElementById("verificationForm");
    const loginButton = document.getElementById("login-button");
    const resendVerificationForm = document.getElementById("resend-verification");

    loginButton.addEventListener("click", function () {
      sceneManager.createTransition("login");
    });


    error.style.display = "none";
    message.style.display = "none";
    verificationForm.style.display = "none";
    resendVerificationForm.style.display = "none";
    loginButton.style.display = "none";

    registerForm.addEventListener("submit", async function (event) {
      // Prevents page reload
      event.preventDefault();

      const signupButton = registerForm.querySelector("#registerForm button[type='submit']");
      signupButton.disabled = true;
      signupButton.innerText = "Registering...";

      try {

        // Gather form data
        const formData = new FormData(this);

        const response = await fetch('/register', {
          method: 'POST',
          body: JSON.stringify(Object.fromEntries(formData)),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // Process response
        const result = await response.json();

        error.style.display = "none";
        message.style.display = "none";

        if (result.error) {
          error.innerText = result.error;
          error.style.display = "block";
        }
        if (result.message) {
          message.style.display = "block";
          message.innerText = result.message;
          registerForm.style.display = "none";
          verificationForm.style.display = "block";
        }
      } catch (err) {
        console.error("Login request failed:", err);
      } finally {
        // Re-enable the button after request completes
        signupButton.disabled = false;
        signupButton.innerText = "Sign Up";
      }
    });

    verificationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const code = document.getElementById("verificationCode").value;

      // Send AJAX request to backend
      const response = await fetch('/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verificationCode: code })
      });

      const result = await response.json();

      error.style.display = "none";
      message.style.display = "none";

      if (result.error) {
        error.innerText = result.error;
        error.style.display = "block";
        if (result.err_code && result.err_code === "invalid_code") {
          resendVerificationForm.style.display = "block";
          document.getElementById("verificationCode").value = "";
        }
      }
      if (result.message) {
        message.style.display = "block";
        message.innerText = result.message;
        verificationForm.style.display = "none";
        resendVerificationForm.style.display = "none";
        loginButton.style.display = "block";
      }
    });

    resendVerificationForm.addEventListener("submit", async function (event) {
      // Prevents page reload
      event.preventDefault();

      // Gather form data
      const formData = new FormData(this);

      const response = await fetch('/resend-verification', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Process response
      const result = await response.json();

      error.style.display = "none";
      message.style.display = "none";

      if (result.error) {
        error.innerText = result.error;
        error.style.display = "block";
      }
      if (result.message) {
        message.style.display = "block";
        message.innerText = result.message;
        resendVerificationForm.style.display = "none";
        verificationForm.style.display = "block";
      }
    });
  },
  display: function () {
    UI.fill(0, 0, 0);
    UI.textSize(50);
    UI.textAlign("center", "top");
    UI.text("Create an account", UI.width / 2, 150);
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

export default signupScene;
