import { io } from "socket.io-client";
import { sceneManager } from "../Globals.js";

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.arena = null;
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
        resolve(game_state);
      });
    });
  }

  async join_arena(arena_id, user) {
    this.arena = arena_id;
    return new Promise((resolve, reject) => {
      this.socket.emit('join-arena', {
        arena: arena_id,
        user,
        id: this.socket.id
      }, (response) => {
        if (response.success) resolve(response);
        else reject(response.error || 'Failed to join arena');
      });
    });
  }

  delete_arena(arenaId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('delete-arena', { arenaId }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(response.error || 'Failed to delete arena');
        }
      });
    });
  }

  async start_arena(arena_id) {
    return new Promise((resolve, reject) => {
      this.socket.emit('start-arena', { arena: arena_id }, (response) => {
        if (response.success) resolve(response);
        else reject(response.error || 'Failed to start arena');
      });
    });
  }

  on_start(onStart) {
    this.socket.once('start-arena', () => {
      onStart();
    });
  }

  // establish WebSocket connection to a particular arena
  establish_connection() {
    const reconnectionObject = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    };

    //this.socket = io("https://paintball-io-572f29a27711.herokuapp.com/", reconnectionObject);
    this.socket = io("http://localhost:5000", reconnectionObject);

    this.socket.on('connect', () => {
      console.log('Connected to server via WebSocket. My ID:', this.socket.id);
    });

    this.socket.on('reconnect', () => {
      console.log("Reconnected. Old ID was:", sceneManager.user.socketID);
      this.socket.emit('reassociate_socket', { oldID: sceneManager.user.socketID });
    });

    this.socket.on('disconnect', (reason) => {
      console.warn("⚠️ Socket disconnected unexpectedly:", reason);
    });

  }

  checkReconnection(createPopup) {
    if (!this.socket.connected) {
      console.log("⚠️ Lost connection. Trying to reconnect...");
      this.socket.connect(); // triggers reconnection

      createPopup();
    }
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

