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
  }

  /*loadModel() {
    return new Promise((resolve => {
      // Imports Custom Shape (your existing GLTF loading code)
      const url = (DEV_MODE == 'front-end') ? "./assets/gltf/TestLevelOne.glb" : "client/dist/public/assets/gltf/TestLevelOne.glb";
      const testImportShape = new Shape({
        type: 'gltf',
        url: url,
        scene: scene,
        size: { width: 1, height: 1, depth: 1 },
        position: new THREE.Vector3(0, -50, 0),
        onLoad: (loadedGroup) => {
          console.log("Model fully loaded. Now updating game entities.");
          if (loadedGroup.childEntities && loadedGroup.childEntities.length) {
            loadedGroup.childEntities.forEach(entity => {
              game.entities.push(entity);
            });
          }
          resolve(testImportShape);
        }
      });
    }));
  }*/

  async setup() {
    this.entities = [];

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0x87ceeb); // Sky-blue

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5).normalize();
    scene.add(directionalLight);

    // Create the camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      2000
    );

    // Wait until we receive initial game state from back-end
    socketManager.request_initial_game_state();
    const game_state = await socketManager.get_initial_game_state();

    // create players
    console.log("Number of players: ", game_state.players);
    game_state.players.forEach(player => {
      const pos = player.state.position;

      if (player.id === socketManager.get_socket_id()) {
        const new_player = new Player({
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          camera: camera,
          id: player.id
        });
        this.entities.push(new_player);
        this.entity_dict[player.id] = new_player;
        this.player = new_player;
      } else {
        const new_player = new OpponentPlayer({
          position: new THREE.Vector3(pos.x, pos.y, pos.z),
          id: player.id
        });
        console.log("Opponent Player: ", id, new_player);
        this.entities.push(new_player);
        this.entity_dict[player.id] = new_player;
      }
    });

    // create blocks
    game_state.blocks.forEach(block => {
      const pos = block.state.position;

      const new_block = new Block({
        position: new THREE.Vector3(pos.x, pos.y, pos.z),
        size: block.state.size,
        shapeType: 'cube',
        isCollidable: true,
        id: block.id
      });

      this.entities.push(new_block);
      this.entity_dict[block.id] = new_block;
    });

    // setup camera
    // position it at the player's eye level initially
    this.camera = { target: this.player };
    camera.position.copy(this.player.position).add(new THREE.Vector3(0, 1.5, 0));

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

    this.finished_loading = true;
  }

  /**
   * Updates the camera position to follow the player in first-person view.
   * The camera is placed at the player's eye level, and the player's yaw is updated from the camera.
   */
  updateCameraPosition() {
    const player = this.camera.target;
    // Use half the standing eye height when crouching:
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
    });
  }

  play() {
    const deltaTime = this.clock.getDelta();

    // Update entities (your physics, collision, etc.)
    this.entities.forEach(entity => {
      entity.update(this.entities);
    });

    // No need to update any FirstPersonControls – PointerLockControls automatically listens to mouse movement.
    // Update the camera position to follow the player.
    this.updateCameraPosition();

    // Render the scene
    renderer.render(scene, camera);

    // sync browser to server
    socketManager.receive_game_state(this.updateGameEntities.bind(this));


    // temp
    //console.log("Play Mode: ", sceneManager.user == null ? "Guest" : "Logged In");
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

    // document.addEventListener('pointerlockchange', () => {
    //   if (document.pointerLockElement === renderer.domElement) {
    //     console.log("Pointer locked!");
    //   } else {
    //     console.log("Pointer unlocked!");
    //   }
    // });

    document.addEventListener('pointerlockerror', () => {
      console.error("Error while attempting to lock pointer");
    }); ``

    // Setup Game
    game.setup();
  },
  display: function () {
    if (game.finished_loading) {
      game.play();
    } else {
      console.log("Game is loading...");
    }
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
        socketManager.disconnect();
      }
    })
  ]
};

export default playScene;