
export default class User {
  constructor(config) {
    this.username = config.username;
    this.email = config.email;
    this.password = config.password;
  }

  async is_email_unique(db) {
    return await db.is_email_registered(this.email);
  }

  async is_username_unique(db) {
    return await db.is_username_registered(this.username);
  }

  async register(db, hashRounds, cb) {
    await db.register_user({
      username: this.username,
      email: this.email,
      password: this.password,
      hashRounds: hashRounds,
    }, cb);
  }

  async match_unverified_users(db) {
    return await db.get_unverified_users({ queryType: 'username', filter: this.username, fields: ['username'] });
  }

  async match_verified_users(db) {
    return await db.get_verified_users({ queryType: 'username', filter: this.username, fields: ['username', 'password', 'email'] });
  }
}