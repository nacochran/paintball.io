//////////////////////////////////////////////////
// LIBRARIES & DEPENDENCIES                     //
//////////////////////////////////////////////////
import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import path from "path";
import { fileURLToPath } from "url";

// TODO:
// (1) Email Verification
// (2) 

//////////////////////////////////////////////////
// General Config Variables                     //
//////////////////////////////////////////////////
const app = express();
const port = 5000;
const saltRounds = 10;

//////////////////////////////////////////////////
// Environment Variables                        //
//////////////////////////////////////////////////
dotenv.config();

//////////////////////////////////////////////////
// Middleware                                   //
//////////////////////////////////////////////////
// Set up EJS as the template engine
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Enable CORS
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Enable JSON format for data transfer
app.use(express.json());

// Parse data passed through the URL
app.use(bodyParser.urlencoded({ extended: true }));

// Create session cookie
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1-day cookie
  })
);

// Set up passport for authentication
app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////
// Create Database Connection                   //
//////////////////////////////////////////////////
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
    console.log("Connected to the MySQL database!");
    connection.release();
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
})();

//////////////////////////////////////////////////
// Routes                                       //
//////////////////////////////////////////////////

// Welcome Page
app.get("/", (req, res) => {
  res.render("pages/welcome", {
    user: req.user,
    error: null
  });
});

// Login Page
app.get("/login", (req, res) => {
  res.render("pages/login", {
    user: req.user,
    error: null
  });
});

// Private Profile Page
app.get("/profile", (req, res) => {
  console.log(req.session);

  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("pages/profile", {
    user: req.user,
    error: null
  });
});

// Public Profile Page
app.get("/user/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT username, email FROM users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).render("public-profile", { error: "User not found" });
    }

    res.render("pages/public-profile", {
      user: req.user,
      profile: rows[0],
      error: null
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).render("public-profile", { error: "Internal server error" });
  }
});

// Signup Page
app.get("/register", (req, res) => {
  res.render("pages/register", {
    user: req.user,
    error: null
  });
});

// Signup Success Page
app.get("/signup-successful", (req, res) => {
  res.render("pages/signup-successful", {
    user: req.user,
    error: null
  });
});

// Handle Signup
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).render("register", { error: "All fields are required" });
  }

  try {
    const [existingEmail] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    const [existingUsername] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );

    if (existingEmail.length > 0 || existingUsername.length > 0) {
      return res.status(400).render("register", {
        error: "Email or username already taken",
      });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) return console.error("Error hashing password:", err);

      await db.query(
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
        [username, email, hash]
      );

      res.redirect("/signup-successful");
    });
  } catch (error) {
    console.error("Error signing up user:", error.message);
    res.status(500).render("register", { error: "Internal server error" });
  }
});

// Handle Login
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (!user) {
      return res.status(400).render("login", { error: "Invalid login attempt" });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).render("login", { error: "Error logging in" });
      }
      res.redirect("/profile");
    });
  })(req, res, next);
});

// Handle Logout
app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });

    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

// Set up Passport authentication
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );

      if (rows.length === 0) {
        return cb(null, false);
      }

      bcrypt.compare(password, rows[0].password, (err, valid) => {
        if (valid) return cb(null, rows[0]);
        return cb(null, false);
      });
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

//////////////////////////////////////////////////
// Run Server                                   //
//////////////////////////////////////////////////
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
