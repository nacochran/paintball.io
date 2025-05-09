import * as CANNON from 'cannon-es';
import physics_world from './physics_world_config.js';
import PlayerController from './PlayerController.js';

// TODO: populate map from database
// Implement ShapeBuilder import functionality on back-end
// so that we can convert gltf files from Blender into map data like so
const map = {
  platforms: [
    { type: "something", position: { /*x, y, z*/ }, size: { /*x, y, z*/ } }
  ],
  player_spawn_points: [
    { /*x, y, z*/ }
  ],
  equipment_spawn_points: [
    { /*type: "[gun] / [armor] / [etc]", x, y, z*/ }
  ]
};

const maps = [
  {
    platforms: [
      { type: "something", position: { /*x, y, z*/ }, size: { /*x, y, z*/ }, isCollidabe: true }
    ],
    graphical_somethings: [

    ],
    player_spawn_points: [
      { /*x, y, z*/ }
    ],
    equipment_spawn_points: [
      { /*type: "[gun] / [armor] / [etc]", x, y, z*/ }
    ]
  }
];

// template for getting player state
// later on we will replace this with a more sophisticated
// way so that we will create player states from "player spawn points"
// this will require that each map has a certain # of spawn points
// such that the # of players cannot exceed that #
const availableSpawnPoints = [
  { x: -15, y: -2, z: 0 },
  { x: 0, y: -2, z: 15 },
  { x: 15, y: -2, z: 10 },
  { x: -15, y: -2, z: 10 },
  { x: 0, y: -2, z: 10 },
  { x: 15, y: -2, z: 15 },
  { x: -15, y: -2, z: -15 },
  { x: 0, y: -2, z: -10 },
  { x: 15, y: -2, z: -10 },
  { x: 0, y: -2, z: 5 }
];
function getPlayerSpawnPoint() {
  if (availableSpawnPoints.length < 1) return null;
  const i = Math.floor(Math.random() * availableSpawnPoints.length);
  const spawnPoint = availableSpawnPoints[i];
  availableSpawnPoints.splice(i, 1);
  return spawnPoint;
}


export default class Arena {
  constructor(config) {
    // unique ID (auto generated)
    this.id = config.id;
    // creator of the arena
    this.arena_creator = config.arena_creator;
    // arena name (created by user)
    this.name = config.name;

    // for guest users
    this.usernames = [];

    // ARENA STATE
    // in_queue --> in load queue in arenas page
    // active --> currently being played
    this.state = "in_queue";

    this.max_players = config.max_players || 10;

    // GAME ENTITIES
    // right now all entities will be represented as 
    // either players or blocks on the back-end
    // entities will have (1) a state to pass info
    // back to the front-end and (2) a physics-body 
    // for performing physics on the back-end
    this.players = {}; // connectionID -> player_object
    this.blockID = 0; // counter for creating unique block IDs
    this.blocks = {};

    // PHYSICS WORLD
    // used to implement physics movement & collisions
    // contains physics bodies generated from game entities
    this.world = null;

    // GAME STATE INFORMATION
    // this is a queue/list of any entities
    // whose states HAVE CHANGED
    // this info is sent to the front-end
    this.game_state = [];
  }

  /**
   * @method create_entities
   * Receives a map and generates entities
   * These entities will be mirrored on the front-end
   * and will be mapped using their unique IDs
  **/
  create_entities(map) {
    // TODO: utilize map using Blender created gltf files somehow

    // loop through connected players and initalize their state
    // put them in various "player spawn points"
    Object.keys(this.players).forEach(playerId => {
      this.players[playerId].state = {
        position: getPlayerSpawnPoint(),
        size: { width: 1, height: 1, depth: 1 },
        health: 100,
        XP: 0
      };
    });

    // create blocks
    // create their initial states (size/position) from MAP
    // for now we create a temporary stage for blocks
    this.blocks[++this.blockID] = {
      state: {
        position: { x: -30, y: -10, z: -20 },
        size: { width: 60, height: 1, depth: 40 }
      },
    };
    this.blocks[++this.blockID] = {
      state: {
        position: { x: -5, y: -9, z: 15 },
        size: { width: 2, height: 2, depth: 2 }
      },
    };
    this.blocks[++this.blockID] = {
      state: {
        position: { x: 5, y: -9, z: 15 },
        size: { width: 2, height: 2, depth: 2 }
      },
    };
    this.blocks[++this.blockID] = {
      state: {
        position: { x: -5, y: -9, z: -15 },
        size: { width: 2, height: 2, depth: 2 }
      },
    };
    this.blocks[++this.blockID] = {
      state: {
        position: { x: 5, y: -9, z: -15 },
        size: { width: 2, height: 2, depth: 2 }
      },
    };
  }

  /**
   * @method create_physics_world
   * Generates a physics world full of physics-bodies
   * that correspond to the 
  **/
  create_physics_world() {
    this.world = physics_world.clone();

    Object.keys(this.players).forEach(playerId => {
      // reference player
      const p = this.players[playerId],
        s = p.state;

      console.log("IMPORTANT TESTING AREA: ");
      console.log("this.players: ", playerId, this.players[playerId])

      // create new physics body for player
      const player_entity = new PlayerController({
        world: this.world,
        position: new CANNON.Vec3(s.position.x, s.position.y, s.position.z),
        size: new CANNON.Vec3(s.size.width, s.size.height, s.size.depth)
      });

      // attach physics body to player entity
      p.controller = player_entity;
    });

    Object.keys(this.blocks).forEach(blockId => {
      // reference block
      const b = this.blocks[blockId],
        s = b.state;

      // create new physics body for block
      const physics_body = this.world.add_body('static-box-1', {
        position: new CANNON.Vec3(s.position.x, s.position.y, s.position.z),
        size: new CANNON.Vec3(s.size.width, s.size.height, s.size.depth)
      });

      // attach physics body to block entity
      b.body = physics_body;
    });
  }

  /**
   * Receives this.players[socketId].body
   * which is a physics body generated on arena
   * initalization 
   **/
  update_player_body(playerID, player) {
    // player entity
    const pController = player.controller;

    // update contrller rotation based on camera orientation from front-end
    if (player.camera.quaternion !== null) {
      // GLITCHING!!!

      const q = player.camera.quaternion;
      const quaternion = new CANNON.Quaternion(q.x, q.y, q.z);

      const euler = new CANNON.Vec3();
      quaternion.toEuler(euler);

      const yawOnlyQuaternion = new CANNON.Quaternion();
      yawOnlyQuaternion.setFromEuler(0, euler.y, 0);

      pController.updateOrientation(yawOnlyQuaternion);
    }

    // Apply movement forces based on inputs
    if (player.inputs['move_left']) {
      pController.moveLeft();
    }
    if (player.inputs['move_right']) {
      pController.moveRight();
    }

    if (player.inputs['move_forward']) {
      pController.moveForward();
    }
    if (player.inputs['move_backward']) {
      pController.moveBackward();
    }

    if (player.inputs['jump']) {
      pController.jump();
    }

    if (player.inputs['update_XP']) {
      console.log("Increase XP!");
      player.state.XP = player.inputs['update_XP'];
    }

    if (player.inputs['damage_dealt']) {
      player.inputs['damage_dealt'].forEach(hit => {
        console.log("Damage dealt!", hit.recipient, hit.damage);
        if (this.players[hit.recipient]) {
          this.players[hit.recipient].state.health -= hit.damage;
        }
      });
    }

    pController.update();

    // 6. Update Player State
    const body = pController.body;
    player.state.position = { x: body.position.x, y: body.position.y, z: body.position.z };
    this.game_state.push({
      id: playerID,
      state: player.state
    });

    // 7. Clear Inputs
    player.inputs = {};
  }

  create_game_loop(io) {
    const tickRate = 60;
    setInterval(() => {

      // Process each player's inputs
      Object.keys(this.players).forEach(playerID => {
        const player = this.players[playerID];
        this.update_player_body(playerID, player);
      });

      // Step the physics world
      this.world.update();

      // send game state back to player
      for (const socketId in this.players) {
        const playerSocket = io.sockets.sockets.get(socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', this.game_state);
        }
      }

      // clear game state
      this.game_state = [];

    }, 1000 / tickRate);
  }

  start(io) {
    console.log(`Initalizing Physics-World on Back-end for arena ${this.id}`);
    this.state = "active";

    // create entities with their initial states
    this.create_entities(/* map */);

    // create physics world
    // physics bodies are generated and attached to entities
    // based on their initial states
    this.create_physics_world();

    // start arena runtime loop
    this.create_game_loop(io);
  }

  send_initial_game_state(io) {
    // tell each player/connection that the game has started
    const playerStates = Object.entries(this.players).map(([id, player]) => ({
      id: id,
      name: player.username,
      state: player.state
    }));
    const blockStates = Object.entries(this.blocks).map(([id, block]) => ({
      id: id,
      state: block.state
    }));

    // console.log("Block states: ");
    // Object.values(this.blocks).forEach((block) => {
    //   console.log("Position: ", block.state.position);
    //   console.log("Size: ", block.state.size);
    // });
    // console.log(blockStates);

    for (const socketId in this.players) {
      const playerSocket = io.sockets.sockets.get(socketId);
      if (playerSocket) {
        playerSocket.emit('initial-game-state', {
          players: playerStates,
          blocks: blockStates
        });
      }
    }
  }
}