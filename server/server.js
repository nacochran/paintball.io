// server/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Middleware
// enable cross-origin referencesharing (CORS)
app.use(cors());

// Serve static files from 'public' folder
app.use(express.static('public'));


// load environment variables from .env file
dotenv.config();

// Create database connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Test the connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to the MySQL database!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  }
})();

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

app.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Start server
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
