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

  corsOrigin: process.env.CORS_ORIGIN,

  // The public URL the keep-alive job pings. Render sets RENDER_EXTERNAL_URL on
  // every web service; KEEP_ALIVE_URL overrides it, and leaving both unset
  // turns the job off.
  keepAliveUrl: process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL,

  // Hops of reverse proxy in front of the app — 1 on Render. Unset means none,
  // which is right for local development.
  trustProxy: Number(process.env.TRUST_PROXY) || 0,
};