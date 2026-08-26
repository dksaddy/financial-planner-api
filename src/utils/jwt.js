import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { JWT_CONFIG } from "../config/jwt.js";

export const generateToken = (payload) => {
  return jwt.sign(
    {
      ...payload,
      jti: uuidv4(),
    },
    JWT_CONFIG.secret,
    {
      expiresIn: JWT_CONFIG.expiresIn,
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.secret);
};