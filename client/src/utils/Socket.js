import { io } from "socket.io-client";

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.arena = null;

    // (async () => {
    //   // Deployed version: https://ancient-beach-65819-22e4a65f5327.herokuapp.com/
    //   // Local Version: http://localhost:5000
    //   this.socket = await io("https://ancient-beach-65819-22e4a65f5327.herokuapp.com/");
    //   // this.socket = io("http://localhost:5000");

    //   console.log("Socket ID: ", this.socket.id);
    // })();
  }

  get_socket_id() {
    return this.socket ? this.socket.id : null;
  }

  request_initial_game_state() {
    this.socket.emit('request-initial-game-state');
  }

  get_initial_game_state() {
    return new Promise((resolve) => {
      this.socket.once('initial-game-state', (game_state) => {
        console.log("Got game state: ", game_state);
        resolve(game_state);
      });
    });
  }

  join_arena(arena_id, user) {
    // Join arena after connecting
    this.arena = arena_id;
    this.socket.emit('join-arena', {
      arena: this.arena,
      user: user,
      id: this.socket.id
    });
  }

  on_start(onStart) {
    this.socket.once('start-arena', () => {
      onStart();
    });
  }

  // establish WebSocket connection to a particular arena
  establish_connection() {
    // this.socket = io("https://ancient-beach-65819-22e4a65f5327.herokuapp.com/");
    this.socket = io("http://localhost:5000");

    this.socket.once('connect', () => {
      console.log('Connected to server via WebSocket. My ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn("⚠️ Socket disconnected unexpectedly:", reason);


      // // guest users create arenas by their socke IDs
      // destroy all arenas created by 'guest users'
      // (async () => {
      //   try {
      //     await fetch('/destroy-arenas', {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json'
      //       },
      //       body: JSON.stringify({ id: this.get_socket_id() })
      //     });
      //   } catch (err) {
      //     console.error('Failed to create arena:', err);
      //   }
      // })();
    });

  }

  // start arena
  start_arena(arena_id) {
    this.socket.emit('start-arena', {
      arena: arena_id
    });
  }

  send_inputs(inputs, camera) {
    this.socket.emit('player-inputs', { inputs: inputs, camera: camera, timestamp: Date.now() });
  }

  receive_game_state(updateGameEntities) {
    this.socket.on('game-state', (data) => {
      updateGameEntities(data);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

}

