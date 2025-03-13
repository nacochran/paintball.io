import { World, Body, Vec3, Box } from 'cannon-es';

export default class Arena {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;

    // states
    // in_queue --> in load queue in arenas page
    // active --> currently being played
    this.state = "in_queue";

    // connectionID -> player_object
    this.players = {};

    // additional game entities
    this.blocks = [];
  }

  // get game state
  get_game_state() {
    return { players: this.players };
  }

  // sync server arena with all browser connections
  // runs emission signal at 60 times per second
  sync(io) {
    setInterval(() => {
      const gameState = this.get_game_state();

      for (const socketId in this.players) {
        const playerSocket = io.sockets.sockets.get(socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', gameState);
        }
      }
    }, 1000 / 60); // 60Hz (60 times a second)

  }
}