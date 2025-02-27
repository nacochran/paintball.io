import mysql from "mysql2/promise";
import crypto from "crypto"; // senerating token for email verification link
import bcrypt from "bcryptjs";

// TODO: Update to use transactions/commits

export default class Database {
  constructor(config) {
    this.db = mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    });
  }

  async test_connection() {
    try {
      const connection = await this.db.getConnection();
      console.log("Connected to the MySQL database!");
      connection.release();
    } catch (error) {
      console.error("Error connecting to the database:", error.message);
    }
  }

  async get_verified_users(config) {
    if (!['username', 'email'].includes(config.queryType)) {
      console.log('Query type for get_verified_users must be username or email');
      return null;
    }

    const infoFields = config.fields.join(',');
    const query = `SELECT ${infoFields} FROM users WHERE ${config.queryType} = ?`;


    const [rows] = await this.db.query(query, [config.filter]);

    return rows;
  }

  async get_unverified_users(config) {
    if (!['username', 'email'].includes(config.queryType)) {
      console.log('Query type for get_unverified_users must be username or email');
      return null;
    }


    const infoFields = config.fields.join(',');

    const query = `SELECT ${infoFields} FROM unverified_users WHERE ${config.queryType} = ?`;

    const [rows] = await this.db.query(query, [config.filter]);

    return rows;
  }

  async is_username_registered(username) {
    const rows1 = await this.get_verified_users({ queryType: 'username', filter: username, fields: ['username'] });
    const rows2 = await this.get_unverified_users({ queryType: 'username', filter: username, fields: ['username'] });

    return rows1.length > 0 || rows2.length > 0;
  }

  async is_email_registered(email) {
    const rows1 = await this.get_verified_users({ queryType: 'email', filter: email, fields: ['email'] });
    const rows2 = await this.get_unverified_users({ queryType: 'email', filter: email, fields: ['email'] });

    return rows1.length > 0 || rows2.length > 0;
  }

  async register_user(config, cb) {
    const connection = await this.db.getConnection(); // Get a single connection
    await connection.beginTransaction(); // Start transaction

    try {
      const hashedPassword = await bcrypt.hash(config.password, config.hashRounds);
      //const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);

      // Insert the new user into `unverified_users`
      await connection.query(
        "INSERT INTO unverified_users (username, email, password, verification_code, token_expires_at) VALUES (?, ?, ?, ?, ?)",
        [config.username, config.email, hashedPassword, verificationCode, expirationTime]
      );

      await connection.commit(); // Commit transaction if all queries succeed
      cb(verificationCode);
    } catch (error) {
      await connection.rollback(); // Rollback transaction on error
      console.error("Error registering user:", error);
      cb(null);
    } finally {
      connection.release(); // Release connection back to pool
    }
  }


  async verify_user(config, cb) {
    const [rows] = await this.db.query(
      "SELECT * FROM unverified_users WHERE verification_code = ? AND token_expires_at > NOW()",
      [config.code]
    );

    let success = false;

    if (rows.length > 0) {
      const user = rows[0];
      await this.db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
        user.username,
        user.email,
        user.password
      ]);

      await this.db.query("DELETE FROM unverified_users WHERE id = ?", [user.id]);

      success = true;
    }

    cb(success);
  }

  async resend_verification_email(config, cb) {
    const [rows] = await this.db.query("SELECT * FROM unverified_users WHERE email = ?", [config.email]);


    let success = false;

    if (rows.length > 0) {


      //const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);


      await this.db.query(
        "UPDATE unverified_users SET verification_code = ?, token_expires_at = ? WHERE email = ?",
        [verificationCode, expirationTime, config.email]
      );

      success = true;

      cb(success, verificationCode);
    } else {
      cb(success, null);
    }


  }

  refresh_unverified_users() {
    setInterval(async () => {
      try {
        const [result] = await this.db.query(
          "DELETE FROM unverified_users WHERE created_at < NOW() - INTERVAL 7 DAY"
        );
        console.log(`Deleted ${result.affectedRows} expired unverified users.`);
      } catch (error) {
        console.error("Error cleaning up unverified users:", error.message);
      }
    }, 24 * 60 * 60 * 1000);
  }
}
