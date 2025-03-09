import dotenv from "dotenv";
import { URL } from "url"; // For parsing the connection string

dotenv.config();

let databaseUrl;

// heroku connection string
// VS
// local .env file
if (process.env.DATABASE_URL) {
  databaseUrl = new URL(process.env.DATABASE_URL);
} else {
  databaseUrl = {
    hostname: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 5432
  };
}

const config = {
  app: {
    port: process.env.PORT || 5000,
  },
  db: {
    host: databaseUrl.hostname,
    user: databaseUrl.username,
    password: databaseUrl.password,
    database: (process.env.DATABASE_URL) ? databaseUrl.pathname.split('/')[1] : databaseUrl.database,
    port: databaseUrl.port || 5432,
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
