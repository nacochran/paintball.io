import * as THREE from 'three';
import Button from "../EventObjects/Button.js";
import { mouse, keys, sceneManager, UICanvas, DEV_MODE, socketManager } from "../Globals.js";
import Player from "../GameObjects/Player.js";
import OpponentPlayer from "../GameObjects/OpponentPlayer.js";
import Block from "../GameObjects/Block.js";
import { Shape, ShapeBuilder } from "../utils/ShapeHelper.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import UI from "../utils/UI.js";

let scene, camera, renderer;

class Game {
  constructor() {
    this.finished_loading = false;
    this.clock = new THREE.Clock();
    this.pointerLockControls = null;
    this.socketID = null;
    this.entities = [];
    this.entity_dict = {};
    this.player = null;
    this.weaponLight = null;
    this.cameraTarget = null;
  }

  async setup() {
    this.entities = [];

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    scene.background = new THREE.Color(0x87ceeb);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7).normalize();
    scene.add(directionalLight);

    socketManager.request_initial_game_state();
    const game_state = await socketManager.get_initial_game_state();

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

    this.cameraTarget = this.player;

    const crosshair = new THREE.Mesh(
      new THREE.RingGeometry(0.01, 0.015, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    crosshair.position.z = -1;
    camera.add(crosshair);

    this.pointerLockControls = new PointerLockControls(camera, renderer.domElement);
    scene.add(this.pointerLockControls.getObject());

    renderer.domElement.addEventListener('click', () => {
      this.pointerLockControls.lock();
    });

    this.entities.forEach(entity => {
      if (entity.shape && entity.shape.mesh) {
        scene.add(entity.shape.mesh);
      }
    });

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

  updateGameEntities(entities) {
    const entity_dict = this.entity_dict;

    entities.forEach(entity => {
      const state = entity.state;
      const entityToUpdate = entity_dict[entity.id];

      if (!entityToUpdate || entityToUpdate.health <= 0) {
        entityToUpdate?.destroy_mesh(scene);
        if (!entityToUpdate) return;
        if (entityToUpdate.id === game.player.id) {
          socketManager.disconnect();
          sceneManager.createTransition('menu');
        }
        const index = this.entities.indexOf(entityToUpdate);
        if (index !== -1) this.entities.splice(index, 1);
        delete entity_dict[entity.id];
      } else {
        entityToUpdate.targetPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
        entityToUpdate.health = state.health;
        entityToUpdate.XP = state.XP;
      }
    });
  }

  play() {
    const vector = new THREE.Vector3();
    const widthHalf = UI.width / 2;
    const heightHalf = UI.height / 2;

    this.entities.forEach(entity => {
      entity.update(this.entities);

      if (entity.entityType === "opponent-player") {
        vector.copy(entity.position);
        vector.y += 1.5;
        vector.project(camera);

        const x = vector.x * widthHalf + widthHalf;
        const y = -(vector.y * heightHalf) + heightHalf;

        if (vector.z >= -1 && vector.z <= 1) {
          UI.fill(0, 0, 0);
          UI.textSize(16);
          UI.textAlign("center", "bottom");
          UI.text(entity.name, x, y);

          const barWidth = 60;
          const barHeight = 8;
          const healthPercent = Math.max(0, Math.min(1, entity.health / 100));

          UI.noFill();
          UI.stroke(0, 0, 0);
          UI.strokeWeight(2);
          UI.rect(x - barWidth / 2, y + 5, barWidth, barHeight);

          UI.noStroke();
          UI.fill(255 * (1 - healthPercent), 255 * healthPercent, 0);
          UI.rect(x - barWidth / 2, y + 5, barWidth * healthPercent, barHeight);
        }
      }
    });

    renderer.render(scene, camera);
    socketManager.receive_game_state(this.updateGameEntities.bind(this));
  }
}

const game = new Game();

const playScene = {
  name: "Play",
  init: function () {
    scene = new THREE.Scene();
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

    renderer.domElement.addEventListener('click', () => {
      game.pointerLockControls.lock();
    });

    document.addEventListener('pointerlockerror', () => {});

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
        socketManager.disconnect();
      }
    })
  ]
};

export default playScene;