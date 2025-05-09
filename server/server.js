//////////////////////////////////////////////////
// LIBRARIES & DEPENDENCIES                     //
//////////////////////////////////////////////////
import express from "express";
import { Server } from "socket.io";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import config from "./config.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; // sending mail
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

// Database
import Database from './back_end_logic/infrastructure/database.js';
// User class to act as interface between front-end and back-end data in database
import User from './back_end_logic/app_logic/user.js';
// Arena: handles back-end game logic
import Arena from './back_end_logic/game_logic/arena.js';

//////////////////////////////////////////////////
// Initalize Express App                        //
//////////////////////////////////////////////////
const app = express();
const server = http.createServer(app);

// Initalize Socket.io on the server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://paintball-io-572f29a27711.herokuapp.com/"],
    methods: ["GET", "POST"],
    credentials: true
  }
});


//////////////////////////////////////////////////
// Setup Email Management System                //
//////////////////////////////////////////////////
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: config.mail.host,
  port: config.mail.port,
  secure: true,
  auth: {
    user: config.mail.user,
    pass: config.mail.password
  },
});

async function sendVerificationEmail(email, verificationCode) {
  try {
    await transporter.sendMail({
      from: `"Paintball.io" <no-reply@paintball.io>`,
      to: email,
      subject: "Verify Your Account",
      html: `<p>Here is your verification code: ${verificationCode}</p>`
    }, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    //console.log("Verification email sent to:", email);
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}

//////////////////////////////////////////////////
// Middleware                                   //
//////////////////////////////////////////////////
// Set up EJS as the template engine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to read the manifest and return the hashed JS file
function getManifest() {
  const manifestPath = path.resolve(__dirname, '../client/dist/public/.vite/manifest.json');

  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }
  console.log("testing...");
  return {};
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use('/client/dist', express.static(path.join(__dirname, '..', 'client', 'dist')));

// Serve Vite manifest if needed
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'dist', 'public', 'assets')));

// Enable CORS
// NOTE: For deployment, possible disable it
// app.use(cors({ origin: false }));
// Or optionally reference a different domain if the front-end is hosted elsewhere
app.use(cors({
  origin: ["https://paintball-io-572f29a27711.herokuapp.com/"],
  // origin: [ "http://localhost:3000"], 
  methods: ["GET", "POST"],
  credentials: true
}));


// Enable JSON format for data transfer
app.use(express.json());

// Parse data passed through the URL
app.use(bodyParser.urlencoded({ extended: true }));

// Create session cookie
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1-day cookie
  })
);

// Middleware to inject hashed JS file into the EJS views
app.use((req, res, next) => {
  const manifest = getManifest();

  // If the manifest exists and contains the necessary entry points
  const jsFile = manifest['src/main.js']['file'] || null;

  // Pass the JS file to the template
  res.locals.jsFile = jsFile;

  next();
});

// Set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////
// Create Database Connection                   //
//////////////////////////////////////////////////
const db = new Database(config);

await db.test_connection();

//////////////////////////////////////////////////
// Routes                                       //
//////////////////////////////////////////////////

// Renders App
app.get("/", (req, res) => {
  let user = null;

  if (req.user) {
    user = new User({
      username: req.user.username,
      email: req.user.email
    });
  }

  res.render("layout", { user: user });
});

// Get personal-user data frmo authenticated user
app.get("/authenticated-user", (req, res) => {
  if (!req.isAuthenticated()) {
    res.json({
      user: null,
      error: "User not authenticated"
    });
  } else {
    const user = new User({
      username: req.user.username,
      email: req.user.email
    });

    res.json({
      user: user,
      error: null
    });
  }
});

// Get public-user data
app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const rows = await db.get_verified_users({
      queryType: "username",
      filter: username,
      fields: ['username', 'email']
    });

    if (rows.length === 0) {
      res.json({
        error: "User not found"
      });
    } else {
      res.json({
        user: req.user,
        error: null
      });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.json({
      error: 'Internal Server Error'
    });
  }
});

// Handle Signup
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.json({ error: "All fields are required", user: req.user });
  }

  try {
    const user = new User({ username: username, email: email, password: password });

    if (await user.is_username_unique(db)) {
      return res.json({ error: "Username already taken", user: req.user });
    } else if (await user.is_email_unique(db)) {
      return res.json({ error: "Email already taken", user: req.user });
    }

    await user.register(db, config.security.hashRounds, async function (verificationCode) {
      await sendVerificationEmail(email, verificationCode);

      return res.json({ message: "Signup successful! Please check your email for a verification code.", user: req.user });
    });

  } catch (error) {
    console.error("Error signing up user:", error.message);
    res.json({ error: "Internal server error", user: req.user });
  }
});

// Handle Login
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {

    if (!user) {
      if (err == "not_verified") {
        return res.json({ err_code: err, error: "User not verified. Request new verification email.", user: req.user, message: null });
      } else if (err == "user_not_found") {
        return res.json({ error: "No user found with that username.", user: req.user, message: null });
      } else if (err = "invalid_password") {
        return res.json({ error: "Incorrect password.", user: req.user, message: null });
      } else {
        // general case
        return res.json({ error: err, user: req.user, message: null });
      }
    }

    req.login(user, (err) => {
      if (err) {
        return res.json({ error: "Error logging in", user: req.user, message: null });
      } else {
        return res.json({ error: null, user: req.user, message: "Successful Login" });
      }
    });
  })(req, res, next);
});

// Handle Logout
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.json({ error: "Logout failed" });

    req.session.destroy(() => {
      return res.json({ message: "Logout successful." });
    });
  });
});

// verifies a registered user (unverified_users table --> users table)
app.post("/verify", async (req, res) => {
  const code = req.body.verificationCode;

  if (!code) {
    return res.render({ error: "Invalid verification code." });
  }

  try {
    await db.verify_user({ code: code }, (success) => {
      if (success) {
        res.json({ user: req.user, error: null, message: "Account verified! You can now login!" });
      } else {
        return res.json({ user: req.user, err_code: "invalid_code", error: "Invalid code.", message: null });
      }
    });

  } catch (error) {
    console.error("Error verifying user:", error.message);
    res.json({ error: "Internal server error." });
  }
});

// resend verification
app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {

    await db.resend_verification_email({ email: email }, async (success, verificationCode) => {
      if (success) {
        res.json({
          message: "A new verification email has been sent.",
          error: null,
          user: req.user
        });

        await sendVerificationEmail(email, verificationCode);
      } else {
        res.json({
          error: "No unverified account found with this email.",
          message: null,
          user: req.user
        });
      }
    });
  } catch (error) {
    console.error("Error resending verification email:", error.message);
    res.json({
      error: "Internal server error.",
      message: null,
      user: req.user
    });
  }
});


//////////////////////////////////////////////////
// Handle Back-end physics                      //
//////////////////////////////////////////////////

// arenas in load queue
const arenas_in_queue = {};
const active_arenas = {};
// maps socketID --> arenaID in either 
// arenas_in_queue or active_arenas
const connections = {};
// for reconnecting
const reconnectTimeouts = {};

// mostly for testing
// in case server restarts
(async () => {

  // reload arenas in queue if
  const db_arenas = await db.get_arenas_in_load_queue();
  for (let arena of db_arenas) {
    arenas_in_queue[arena.unique_id] = new Arena({
      id: arena.unique_id,
      name: arena.name
    });
  }
})();

// get arenas in load queue
app.get('/arenas', async (req, res) => {
  try {
    const arenas = await db.get_arenas_in_load_queue();

    let arena_objects = [];

    arenas.forEach((arena) => {

      const arena_object = arenas_in_queue[arena.unique_id];

      arena_objects.push({
        num_players: arena_object.usernames.length,
        max_players: arena_object.max_players,
        arena_creator: arena.arena_creator,
        unique_id: arena.unique_id,
        name: arena.name,
        users: arena_object.usernames
      });
    });

    res.json({ arenas: arena_objects });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch arenas' });
  }
});

// create a new arena (add to load queue)
app.post('/create-arena', async (req, res) => {
  const { name, user } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Arena name is required' });
  }

  try {
    console.log("user: ", user);
    const id = typeof user == 'object' ? user.id : user;
    const arena = await db.create_arena(name, id);

    arenas_in_queue[arena.unique_id] = new Arena({
      arena_creator: id,
      id: arena.unique_id,
      name: arena.name
    });

    // join arena
    const username = (typeof user == 'object') ? (user.username) : (generateGuestName(arenas_in_queue[arena.unique_id].usernames));
    arenas_in_queue[arena.unique_id].usernames.push(username);
    arenas_in_queue[arena.unique_id].players[id] = {
      inputs: {},
      camera: { quaternion: null },
      username: username
    };
    connections[id] = arena.unique_id;

    // add one test user
    // const username2 = generateGuestName(arenas_in_queue[arena.unique_id].usernames);
    // arenas_in_queue[arena.unique_id].usernames.push(username2);
    // arenas_in_queue[arena.unique_id].players['test-player-socket-id'] = {
    //   inputs: {},
    //   camera: { quaternion: null },
    //   username: username2
    // };
    // connections['test-player-socket-id'] = arena.unique_id;

    res.status(201).json({ message: 'Arena created successfully', arena });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create arena' });
  }
});

function generateGuestName(existingUsernames) {
  return "Guest" + existingUsernames.length;
}

// Run Socket.io connection listener
// TODO: Update this to persist connections to a temporary table in our database, in case the server restarts
// we need a way to persist IO connections for reconnecting users to the server, in case the server crashes
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-arena', (data, callback) => {
    if (socket.id in connections) {
      return callback({ success: false, error: "Already joined an arena." });
    }

    const arena = arenas_in_queue[data.arena];
    if (arena) {
      const username = data.user?.username || generateGuestName(arena.usernames);
      arena.usernames.push(username);
      arena.players[socket.id] = {
        inputs: {},
        camera: { quaternion: null },
        username
      };
      connections[socket.id] = data.arena;

      return callback({ success: true });
    } else {
      return callback({ success: false, error: "Arena not found or full." });
    }
  });

  socket.on('delete-arena', async ({ arenaId }, callback) => {
    try {
      const success = await db.delete_arena_by_id(arenaId);

      if (success) {
        callback({ success: true });
      } else {
        callback({ success: false, error: "Arena not found or already deleted." });
      }
    } catch (err) {
      console.error("Failed to delete arena:", err.message);
      callback({ success: false, error: "Server error while deleting arena." });
    }
  });

  socket.on('start-arena', async (data, callback) => {
    const arena = arenas_in_queue[data.arena];
    if (!arena) {
      return callback?.({ success: false, error: "Arena not in queue." });
    }

    active_arenas[data.arena] = arena;
    delete arenas_in_queue[data.arena];
    active_arenas[data.arena].start(io);

    try {
      await db.set_status(data.arena, 'active');
    } catch (err) {
      return callback?.({ success: false, error: "Failed to update DB." });
    }

    const playersInArena = Object.keys(active_arenas[data.arena].players);
    playersInArena.forEach(playerId => {
      if (playerId !== socket.id) {
        io.to(playerId).emit('start-arena', { arena: data.arena });
      }
    });

    return callback?.({ success: true });
  });

  // send connection ID back to user
  socket.on('request-initial-game-state', () => {
    if (active_arenas[connections[socket.id]]) {
      const arena = active_arenas[connections[socket.id]];
      console.log("Sending intial game state to front-end...");
      arena.send_initial_game_state(io);
    }
  });

  socket.on('player-inputs', (data) => {
    if (active_arenas[connections[socket.id]]) {
      const arena = active_arenas[connections[socket.id]];
      if (arena.players[socket.id]) {
        // e.g., { inputs: ['move-left', ...], timestamp: Date.now() }
        arena.players[socket.id].inputs = data.inputs;
        arena.players[socket.id].camera = data.camera;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Set a timeout to delete the player after 10 seconds
    const timeout = setTimeout(async () => {
      console.log(`Cleaning up after timeout: ${socket.id}`);
      const arenaId = connections[socket.id];

      if (arenas_in_queue[arenaId]) {
        delete arenas_in_queue[arenaId].players[socket.id];
        await db.destroy_arenas(socket.id);
      } else if (active_arenas[arenaId]) {
        delete active_arenas[arenaId].players[socket.id];
        // await db.destroy_arenas(socket.id);
      }

      delete connections[socket.id];
    }, 10000);

    // Save this timeout so we can cancel it if the client reconnects in time
    reconnectTimeouts[socket.id] = timeout;
  });

  socket.on('reconnect_attempt', () => {
    console.log(`Reconnect attempt from: ${socket.id}`);
  });

  socket.on('reconnect', () => {
    console.log(`Player reconnected: ${socket.id}`);
    if (reconnectTimeouts[socket.id]) {
      clearTimeout(reconnectTimeouts[socket.id]);
      delete reconnectTimeouts[socket.id];
    }
  });

  socket.on('reassociate_socket', ({ oldID }) => {
    if (connections[oldID]) {
      const arenaId = connections[oldID];
      connections[socket.id] = arenaId;
      if (arenas_in_queue[arenaId]) {
        arenas_in_queue[arenaId].players[socket.id] = arenas_in_queue[arenaId].players[oldID];
        delete arenas_in_queue[arenaId].players[oldID];
      } else if (active_arenas[arenaId]) {
        active_arenas[arenaId].players[socket.id] = active_arenas[arenaId].players[oldID];
        delete active_arenas[arenaId].players[oldID];
      }

      delete connections[oldID];
      console.log(`Reassociated socket: ${oldID} → ${socket.id}`);
    }
  });
});

// cleanup empty arenas
setInterval(async () => {
  for (const arenaId in active_arenas) {
    const arena = active_arenas[arenaId];
    const players = arena.players;

    if (Object.keys(players).length === 0) {
      console.log(`Deleting empty active arena: ${arenaId}`);

      try {
        await db.delete_arena_by_id(arenaId);
      } catch (err) {
        console.error(`Failed to delete arena ${arenaId}:`, err);
      }

      delete active_arenas[arenaId];
    }
  }

  for (const arenaId in arenas_in_queue) {
    const arena = arenas_in_queue[arenaId];
    const players = arena.players;

    if (Object.keys(players).length === 0) {
      console.log(`Deleting empty queued arena: ${arenaId}`);

      try {
        await db.delete_arena_by_id(arenaId);
      } catch (err) {
        console.error(`Failed to delete arena ${arenaId}:`, err);
      }

      delete arenas_in_queue[arenaId];
    }
  }
}, 10 * 1000); // every 10 seconds


// // run arenas
// for (const arenaID in active_arenas) {
//   const arena = active_arenas[arenaID];
//   arena.start(io);
// }



// Set up Passport authentication
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const user = new User({ username: username, password: password });

      // Check if user is in unverified_users
      const unverifiedUsers = await user.match_unverified_users(db);

      if (unverifiedUsers.length > 0) {
        return cb("not_verified", false);
      }

      const users = await user.match_verified_users(db);

      if (users.length === 0) {
        return cb("user_not_found", false);
      }

      bcrypt.compare(password, users[0].password, (err, valid) => {
        if (valid) return cb(null, users[0]);
        return cb("invalid_password", false);
      });
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// deleted users from unverified_users table after 7 days
db.refresh_unverified_users();


app.get('*', (req, res, next) => {
  // If the request has a file extension, skip to next middleware (e.g., static)
  if (path.extname(req.path)) return next();

  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

//////////////////////////////////////////////////
// Run Server                                   //
//////////////////////////////////////////////////
server.listen(config.app.port, () => {
  console.log(`Server running on port ${config.app.port}`);
});

process.on("SIGTERM", () => {
  console.log("Closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
