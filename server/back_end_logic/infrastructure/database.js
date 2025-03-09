import pkg from 'pg';
const { Pool } = pkg;
import crypto from "crypto"; // For generating tokens
import bcrypt from "bcryptjs";

export default class Database {
  constructor(config) {
    this.db = new Pool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      port: config.db.port,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async test_connection() {
    try {
      const client = await this.db.connect();
      console.log("Connected to the PostgreSQL database!");
      client.release();
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
    const query = `SELECT ${infoFields} FROM users WHERE ${config.queryType} = $1`;

    const { rows } = await this.db.query(query, [config.filter]);

    return rows;
  }

  async get_unverified_users(config) {
    if (!['username', 'email'].includes(config.queryType)) {
      console.log('Query type for get_unverified_users must be username or email');
      return null;
    }

    const infoFields = config.fields.join(',');
    const query = `SELECT ${infoFields} FROM unverified_users WHERE ${config.queryType} = $1`;

    const { rows } = await this.db.query(query, [config.filter]);

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
    const client = await this.db.connect(); // Get a single client
    try {
      await client.query('BEGIN'); // Start transaction

      const hashedPassword = await bcrypt.hash(config.password, config.hashRounds);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);

      // Insert the new user into `unverified_users`
      await client.query(
        "INSERT INTO unverified_users (username, email, password, verification_code, token_expires_at) VALUES ($1, $2, $3, $4, $5)",
        [config.username, config.email, hashedPassword, verificationCode, expirationTime]
      );

      await client.query('COMMIT'); // Commit transaction if all queries succeed
      cb(verificationCode);
    } catch (error) {
      await client.query('ROLLBACK'); // Rollback transaction on error
      console.error("Error registering user:", error);
      cb(null);
    } finally {
      client.release(); // Release connection back to pool
    }
  }

  async verify_user(config, cb) {
    const query = "SELECT * FROM unverified_users WHERE verification_code = $1 AND token_expires_at > NOW()";
    const { rows } = await this.db.query(query, [config.code]);

    let success = false;

    if (rows.length > 0) {
      const user = rows[0];
      await this.db.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
        [user.username, user.email, user.password]
      );

      await this.db.query("DELETE FROM unverified_users WHERE id = $1", [user.id]);

      success = true;
    }

    cb(success);
  }

  async resend_verification_email(config, cb) {
    const query = "SELECT * FROM unverified_users WHERE email = $1";
    const { rows } = await this.db.query(query, [config.email]);

    let success = false;

    if (rows.length > 0) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expirationTime = new Date(Date.now() + 5 * 60 * 1000);

      await this.db.query(
        "UPDATE unverified_users SET verification_code = $1, token_expires_at = $2 WHERE email = $3",
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
        const query = "DELETE FROM unverified_users WHERE created_at < NOW() - INTERVAL '7 days'";
        const { rowCount } = await this.db.query(query);
        console.log(`Deleted ${rowCount} expired unverified users.`);
      } catch (error) {
        console.error("Error cleaning up unverified users:", error.message);
      }
    }, 24 * 60 * 60 * 1000); // Cleanup every 24 hours
  }
}
