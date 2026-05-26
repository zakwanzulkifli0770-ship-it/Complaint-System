import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET ?? "eaduan_secret_key";

export interface JwtPayload {
  id: number;
  email: string;
  username: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
