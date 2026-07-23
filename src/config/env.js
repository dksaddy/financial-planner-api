import dotenv from "dotenv";

dotenv.config({
  path: process.env.ENV_FILE || ".env",
});

export const env = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
};