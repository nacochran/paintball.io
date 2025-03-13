import { io } from "socket.io-client";

export default class SocketManager {
  constructor() {
    this.socket = null;
    this.arena = null;
  }

  // establish WebSocket connection to a particular arena
  establish_connection(arena_id) {
    this.arena = arena_id;

    // Change to: https://ancient-beach-65819-22e4a65f5327.herokuapp.com/
    let socket = io("http://localhost:5000");
    this.socket = socket;

    this.socket.on('connect', () => {
      console.log('Connected to server via WebSocket. My ID:', socket.id);

      // Join arena after connecting
      this.socket.emit('join-arena', {
        arena: this.arena,
        id: this.socket.id
      });
    });
  }

  // start arena
  start_arena(arena_id) {
    this.socket.emit('start-arena', {
      arena: arena_id
    });
  }

}

