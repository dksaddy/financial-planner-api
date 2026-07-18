import dotenv from "dotenv";

dotenv.config();

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
};