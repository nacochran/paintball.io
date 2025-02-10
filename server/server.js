//////////////////////////////////////////////////
// LIBRARIES & DEPENDENCIES                     //
//////////////////////////////////////////////////
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer"; // sending mail
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import path from "path";
import { fileURLToPath } from "url";

// How to kill existing process:
// netstat -ano | findstr :5000
// taskkill /PID <PID> /F

// TODO: Add customized page for invalid/expired token page
// clean up code

// Database
import Database from './back_end_logic/infrastructure/database.js';


//////////////////////////////////////////////////
// General Config Variables                     //
//////////////////////////////////////////////////
const app = express();
const port = 5000;
const hashRounds = 10;

//////////////////////////////////////////////////
// Environment Variables                        //
//////////////////////////////////////////////////
dotenv.config();

//////////////////////////////////////////////////
// Setup Email Management System                //
//////////////////////////////////////////////////
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
});

// Note: Check https://mailtrap.io/inboxes/3437985/messages/4697219800 for email responses
async function sendVerificationEmail(email, verificationLink) {
  try {
    await transporter.sendMail({
      from: `"Paintball.io" <no-reply@paintball.io>`,
      to: email,
      subject: "Verify Your Account",
      html: `<p>Click <a href="${verificationLink}">here</a> to verify your account.</p>`
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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//app.set('views', path.join(__dirname, '../views'));


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
const db = new Database();

await db.test_connection();

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
  //console.log(req.session);

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
    const rows = await db.get_verified_users({
      queryType: "username",
      filter: username,
      fields: ['username', 'email']
    });

    // const [rows] = await db.query(
    //   "SELECT username, email FROM users WHERE username = ?",
    //   [username]
    // );

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
    return res.status(400).render("pages/register", { error: "All fields are required", user: req.user });
  }

  try {
    // registered & verified accounts
    // const [existingEmail] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    // const [existingUsername] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    // // registered & unverified accounts
    // const [existingEmail2] = await db.query("SELECT * FROM unverified_users WHERE email = ?", [email]);
    // const [existingUsername2] = await db.query("SELECT * FROM unverified_users WHERE username = ?", [username]);



    if (await db.is_username_registered(username)) {
      return res.status(400).render("pages/register", { error: "Username already taken", user: req.user });
    } else if (await db.is_email_registered(email)) {
      return res.status(400).render("pages/register", { error: "Email already taken", user: req.user });
    }

    await db.register_user({
      username: username,
      email: email,
      password: password,
      hashRounds: hashRounds,
    }, async function (verificationToken) {
      const verificationLink = `http://localhost:5000/verify?token=${verificationToken}`;
      await sendVerificationEmail(email, verificationLink);

      res.redirect("/signup-successful");
    });

    // bcrypt.hash(password, hashRounds, async (err, hash) => {
    //   if (err) return console.error("Error hashing password:", err);

    //   // Generate verification token
    //   const verificationToken = crypto.randomBytes(32).toString("hex");

    //   // Store in `unverified_users`
    //   const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    //   await db.query(
    //     "INSERT INTO unverified_users (username, email, password, verification_token, token_expires_at) VALUES (?, ?, ?, ?, ?)",
    //     [username, email, hash, verificationToken, expirationTime]
    //   );

    //   // Send Verification Email
    //   const verificationLink = `http://localhost:5000/verify?token=${verificationToken}`;
    //   await sendVerificationEmail(email, verificationLink);

    //   res.redirect("/signup-successful");
    // });
  } catch (error) {
    console.error("Error signing up user:", error.message);
    res.status(500).render("pages/register", { error: "Internal server error", user: req.user });
  }
});

// Handle Login
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {

    if (!user) {
      if (err == "not_verified") {
        return res.status(400).render("pages/login", { error: err, user: req.user });
      } else if (err == "invalid_credentials") {
        return res.status(400).render("pages/login", { error: err, user: req.user });
      } else {
        // general case
        return res.status(400).render("pages/login", { error: err, user: req.user });
      }
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).render("pages/login", { error: "Error logging in", user: req.user });
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

// verifies a registered user (unverified_users table --> users table)
app.get("/verify", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid verification link.");
  }

  try {
    // // Find user with this token and check expiration
    // const [rows] = await db.query(
    //   "SELECT * FROM unverified_users WHERE verification_token = ? AND token_expires_at > NOW()",
    //   [token]
    // );

    // if (rows.length === 0) {
    //   return res.status(400).send("Invalid or expired verification link.");
    // }

    // const user = rows[0];

    // // Move user to `users` table
    // await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
    //   user.username,
    //   user.email,
    //   user.password
    // ]);

    // // Delete user from `unverified_users`
    // await db.query("DELETE FROM unverified_users WHERE id = ?", [user.id]);


    await db.verify_user({ token: token }, (success) => {
      if (success) {
        res.redirect("/login");
      } else {
        res.status(400).send("Invalid or expired verification link.");
      }
    });

  } catch (error) {
    console.error("Error verifying user:", error.message);
    res.status(500).send("Internal server error.");
  }
});

app.get("/resend-verification", (req, res) => {
  res.render("pages/resend-verification", { error: null, message: null, user: req.user });
});

// resend verification
app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  try {
    // // Check if user exists in `unverified_users`
    // const [rows] = await db.query("SELECT * FROM unverified_users WHERE email = ?", [email]);

    // if (rows.length === 0) {
    //   return res.render("resend-verification", {
    //     error: "No unverified account found with this email.",
    //     message: null,
    //   });
    // }

    // // Generate new verification token and expiration time
    // const verificationToken = crypto.randomBytes(32).toString("hex");
    // const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // // Update user with new token and expiration time
    // await db.query(
    //   "UPDATE unverified_users SET verification_token = ?, token_expires_at = ? WHERE email = ?",
    //   [verificationToken, expirationTime, email]
    // );

    // // Send new verification email
    // const verificationLink = `http://localhost:5000/verify?token=${verificationToken}`;
    // await sendVerificationEmail(email, verificationLink);

    // res.render("resend-verification", {
    //   message: "A new verification email has been sent.",
    //   error: null,
    // });

    await db.resend_verification_email({ email: email }, async (success, verificationToken) => {
      if (success) {
        res.render("pages/resend-verification", {
          message: "A new verification email has been sent.",
          error: null,
          user: req.user
        });

        const verificationLink = `http://localhost:5000/verify?token=${verificationToken}`;
        await sendVerificationEmail(email, verificationLink);
      } else {
        res.render("pages/resend-verification", {
          error: "No unverified account found with this email.",
          message: null,
          user: req.user
        });
      }
    });
  } catch (error) {
    console.error("Error resending verification email:", error.message);
    res.render("pages/resend-verification", {
      error: "Internal server error.",
      message: null,
      user: req.user
    });
  }
});


// Set up Passport authentication
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      // Check if user is in unverified_users
      const unverifiedUsers = await db.get_unverified_users({ queryType: 'username', filter: username, fields: ['username'] });

      if (unverifiedUsers.length > 0) {
        return cb("not_verified", false);
      }

      const users = await db.get_verified_users({ queryType: 'username', filter: username, fields: ['username', 'password', 'email'] });

      if (users.length === 0) {
        return cb("invalid_credentials", false);
      }

      bcrypt.compare(password, users[0].password, (err, valid) => {
        if (valid) return cb(null, users[0]);
        return cb(null, false);
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

//////////////////////////////////////////////////
// Run Server                                   //
//////////////////////////////////////////////////
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
