import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, sceneManager, UICanvas, socketManager } from "../Globals.js";
import UI from "../utils/UI.js";

// forward declare variables
let scene, camera, renderer;

const arenaScene = {
  name: "Arena",
  init: function () {
    // Setup Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("threed-canvas").innerHTML = '';
    document.getElementById("threed-canvas").appendChild(renderer.domElement);

    // Setup UI canvas dimensions 
    UI.width = window.innerWidth;
    UI.height = window.innerHeight;

    // Clear and create the arena list container
    const htmlContent = document.querySelector('.html-content');
    htmlContent.innerHTML = `
    <div style="margin:300px 200px 0px 200px">
      <h1>Available Arenas</h1>
      <div id="arena-list"></div>
      <button id="create-arena-btn" style="margin-top: 20px;">Create Arena</button>

      <div id="create-arena" style='display:none'>
      <h3>Create Arena</h3>
      <form id="arena-create-form">
        <label for="arena-name">Arena Name:</label><br>
        <input type="text" id="arena-name" name="arena-name" required><br><br>
        <button type="submit">Create</button>
        <button type="button" id="cancel-create-arena">Cancel</button>
      </form>
      </div>
    </div>
    `;

    let arenaInterval;

    let loadArenas = async () => {
      const response = await fetch('/arenas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      const arenaList = document.getElementById('arena-list');
      arenaList.innerHTML = '';

      result.arenas.forEach(arena => {
        const arenaDiv = document.createElement('div');
        arenaDiv.classList.add('arena');
        arenaDiv.style.border = '1px solid black';
        arenaDiv.style.padding = '10px';
        arenaDiv.style.marginBottom = '10px';

        arenaDiv.innerHTML = `
            <h3>${arena.name}</h3>
            <button class="join-arena-btn" data-id="${arena.unique_id}">Join Arena</button>
            <button class="start-arena-btn" data-id="${arena.unique_id}">Start Game</button>
          `;

        arenaList.appendChild(arenaDiv);
      });

      // Add click listeners to join buttons
      document.querySelectorAll('.join-arena-btn').forEach(button => {
        button.addEventListener('click', function () {
          const arenaId = this.getAttribute('data-id');
          console.log('Joining arena:', arenaId);

          socketManager.establish_connection(arenaId);
        });
      });

      document.querySelectorAll('.start-arena-btn').forEach(button => {
        button.addEventListener('click', function () {
          const arenaId = this.getAttribute('data-id');
          console.log("Starting Arena: ", arenaId);
          socketManager.start_arena(arenaId);
          clearInterval(arenaInterval);
          sceneManager.createTransition('play');
        });
      });

    };

    loadArenas();
    // reload arenas every 5 seconds
    arenaInterval = setInterval(loadArenas, 5000);




    // Handle Create Arena Button
    document.getElementById('create-arena-btn').addEventListener('click', function () {
      showCreateArenaForm();
    });

    // Create Arena Form Submission
    document.getElementById('arena-create-form').addEventListener('submit', async function (event) {
      event.preventDefault();

      const arenaName = document.getElementById('arena-name').value;
      try {
        const response = await fetch('/create-arena', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: arenaName })
        });

        const result = await response.json();
        if (result.error) {
          alert('Error: ' + result.error);
        } else {
          alert('Arena created!');
          loadArenas();
        }
      } catch (err) {
        console.error('Failed to create arena:', err);
      }
    });

    // Cancel Button
    document.getElementById('cancel-create-arena').addEventListener('click', function () {
      document.getElementById('create-arena').style.display = 'none';
    });

    // Helper to show form
    function showCreateArenaForm() {
      document.getElementById('create-arena').style.display = 'block';
    }
  },

  display: function () {
    UI.fill(0, 0, 0);
    UI.textSize(50);
    UI.textAlign("center", "top");
    UI.text("Arena", UI.width / 2, 150);
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

        if (this.isInside(mouse, this)) {
          UI.fill(175, 175, 175);
          mouse.setCursor('pointer');
        } else {
          UI.fill(200, 200, 200, 200);
        }

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

export default arenaScene;
