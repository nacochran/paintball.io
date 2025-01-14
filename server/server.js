// server/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Socket.IO event for real-time communication
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Define routes
app.get('/', (req, res) => {
  res.send('<h1>Welcome to Paintball FPS Server</h1>');
});

// Start server
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
