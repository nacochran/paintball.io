import dotenv from "dotenv";

dotenv.config();

const config = {
  app: {
    port: 5000,
  },
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASS,
  },
  security: {
    hashRounds: 10
  }
};

export default config;
