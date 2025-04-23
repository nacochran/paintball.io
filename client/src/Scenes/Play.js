import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas, DEV_MODE, socketManager } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import OpponentPlayer from "../GameObjects/OpponentPlayer.js";
import Block from "../GameObjects/Block.js";
import { Shape, ShapeBuilder } from "../utils/ShapeHelper.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import UI from "../utils/UI.js";

// Forward-declare variables
let scene, camera, renderer;

class Game {
  constructor() {

    // indicates whether the game is finished loading or not
    this.finished_loading = false;

    this.clock = new THREE.Clock();
    this.pointerLockControls = null;
    this.socketID = null;

    // list of games entities : used for iterating over
    this.entities = [];
    // dictionary of game entities : used for updating an entity from the server based on its ID
    this.entity_dict = {};

    // player who is playing on this browser connection
    this.player = null;

    this.weaponLight = null;
    this.cameraTarget = null;
  }

  // pre conditions
  // camera is already defined
  async setup() {
    this.entities = [];

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0x87ceeb); // Sky-blue

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7).normalize();
    scene.add(directionalLight);

    // Wait until we receive initial game state from back-end
    socketManager.request_initial_game_state();
    const game_state = await socketManager.get_initial_game_state();

    // create players
    game_state.players.forEach(player => {
      const pos = player.state.position,
        s = player.state.size;

      if (player.id === socketManager.get_socket_id()) {
        const new_player = new Player(scene, {
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          camera: camera,
          id: player.id,
          name: player.name
        });
        this.entities.push(new_player);
        this.entity_dict[player.id] = new_player;
        this.player = new_player;
      } else {
        const new_player = new OpponentPlayer({
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          id: player.id,
          size: { width: s.width * 2, height: s.height * 2, depth: s.depth * 2 },
          name: player.name
        });
        this.entities.push(new_player);
        this.entity_dict[player.id] = new_player;
      }
    });

    // create blocks
    game_state.blocks.forEach(block => {
      const pos = block.state.position,
        s = block.state.size;

      const new_block = new Block({
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        size: { width: s.width * 2, height: s.height * 2, depth: s.depth * 2 },
        shapeType: 'cube',
        isCollidable: true,
        id: block.id
      });

      this.entities.push(new_block);
      this.entity_dict[block.id] = new_block;
    });

    // setup camera
    // position it at the player's eye level initially
    this.cameraTarget = this.player;

    // this.weaponLight = new THREE.PointLight(0xffffff, 1.2, 3);
    // this.weaponLight.position.set(0.3, -0.1, -0.5); // Slightly to the right and down
    // camera.add(this.weaponLight); // Attach to camera so it moves with the view

    const crosshair = new THREE.Mesh(
      new THREE.RingGeometry(0.01, 0.015, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    crosshair.position.z = -1;
    camera.add(crosshair);

    // handle pointer lock controls
    this.pointerLockControls = new PointerLockControls(camera, renderer.domElement);
    scene.add(this.pointerLockControls.object);
    renderer.domElement.addEventListener('click', () => {
      renderer.domElement.requestPointerLock();
    });

    // Add entity meshes to the scene
    this.entities.forEach(entity => {
      if (entity.shape && entity.shape.mesh) {
        scene.add(entity.shape.mesh);
      }
    });

    // Initial camera setup
    this.updateCameraPosition();

    setInterval(() => {
      if (socketManager.socket) {
        socketManager.checkReconnection(() => {
          UI.fill(255, 0, 0);
          UI.textSize(20);
          UI.textAlign("center", "center");
          UI.text("Reconnecting...", UI.width / 2, 50);
        });
      }
    }, 2000);


    this.finished_loading = true;
  }

  /**
   * Updates the camera position to follow the player in first-person view.
   * The camera is placed at the player's eye level, and the player's yaw is updated from the camera.
   */
  updateCameraPosition() {
    const player = this.cameraTarget;
    const eyeOffsetY = (player.state === "crouching") ? 0.15 : 0.98;
    camera.position.copy(player.position).add(new THREE.Vector3(0, eyeOffsetY, 0));
  }


  /**
   * Updates game entities from back-end
   * @entities is a list of entities whose states have changed
   */
  updateGameEntities(entities) {
    const entity_dict = this.entity_dict;

    entities.forEach(entity => {
      const state = entity.state;

      const entityToUpdate = entity_dict[entity.id];
      entityToUpdate.targetPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      entityToUpdate.health = state.health;
      entityToUpdate.XP = state.XP;
    });
  }

  play() {
    // Update entities (your physics, collision, etc.)
    const vector = new THREE.Vector3();
    const widthHalf = UI.width / 2;
    const heightHalf = UI.height / 2;

    this.entities.forEach(entity => {
      entity.update(this.entities);

      if (entity.entityType === "opponent-player") {
        // Project entity's position to 2D screen space
        vector.copy(entity.position);
        vector.y += 1.5; // Raise the label a bit above the head
        vector.project(camera);

        const x = vector.x * widthHalf + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;

        // Only draw if it's on screen
        if (vector.z >= -1 && vector.z <= 1) {
          // Draw name
          UI.fill(0, 0, 0);
          UI.textSize(16);
          UI.textAlign("center", "bottom");
          UI.text(entity.name, x, y);

          // Draw health bar
          const barWidth = 60;
          const barHeight = 8;
          const healthPercent = Math.max(0, Math.min(1, entity.health / 100));

          // Background bar
          UI.noFill();
          UI.stroke(0, 0, 0);
          UI.strokeWeight(2);
          UI.rect(x - barWidth / 2, y + 5, barWidth, barHeight);

          // Health fill
          UI.noStroke();
          UI.fill(255 * (1 - healthPercent), 255 * healthPercent, 0); // Red to green
          UI.rect(x - barWidth / 2, y + 5, barWidth * healthPercent, barHeight);
        }
      }
    });

    // No need to update any FirstPersonControls – PointerLockControls automatically listens to mouse movement.
    // Update the camera position to follow the player.
    this.updateCameraPosition();

    // Render the scene
    renderer.render(scene, camera);

    // sync browser to server
    socketManager.receive_game_state(this.updateGameEntities.bind(this));
  }
}

const game = new Game();

// play scene : runs game
const playScene = {
  name: "Play",
  init: function () {
    // Setup Three.js
    scene = new THREE.Scene();
    // (The camera is created in game.setup, so this instantiation here is not strictly necessary.)
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById("threed-canvas").innerHTML = '';
    document.getElementById("threed-canvas").appendChild(renderer.domElement);

    // Add pointer lock event listeners here:
    renderer.domElement.addEventListener('click', () => {
      game.pointerLockControls.lock();
    });

    document.addEventListener('pointerlockerror', () => {
      // console.error("Error while attempting to lock pointer");
    });

    // Setup Game
    game.setup();
  },
  display: function () {
    if (game.finished_loading) {
      game.play();

      UI.fill(0, 0, 0);
      UI.textSize(20);
      UI.textAlign("left", "top");
      UI.text(game.player.name, 25, 30);

      UI.noStroke();
      UI.fill(255, 0, 0);
      UI.rect(125, 25, 100 * (game.player.health / 100), 25);

      UI.noFill();
      UI.stroke(0, 0, 0);
      UI.strokeWeight(3);
      UI.rect(125, 25, 100, 25);

      // (Date.now()/1000 - game.player.weapon.lastFireTime)/game.player.weapon.fireRate;
      UI.noStroke();
      UI.fill(169, 189, 21);
      UI.rect(
        250,
        25,
        Math.min(100, 100 * ((Date.now() / 1000 - game.player.weapon.lastFireTime) / game.player.weapon.fireRate)),
        25
      );


      UI.noFill();
      UI.stroke(0, 0, 0);
      UI.strokeWeight(3);
      UI.rect(250, 25, 100, 25);

      UI.fill(0, 0, 0);
      UI.textSize(20);
      UI.textAlign("left", "top");
      UI.text(`${game.player.XP} XP`, 375, 30);
    }
  },
  buttons: [
    new Button({
      x: UI.width - 165,
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
        socketManager.disconnect();
      }
    })
  ]
};

export default playScene;