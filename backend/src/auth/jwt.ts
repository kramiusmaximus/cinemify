import jwt from "jsonwebtoken";
import type { UserRole } from "../db/users-repo.js";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid token payload");
  }

  const { sub, email, role } = decoded as Partial<AuthTokenPayload>;
  if (typeof sub !== "string" || typeof email !== "string" || (role !== "admin" && role !== "user")) {
    throw new Error("Invalid token claims");
  }

  return { sub, email, role };
}
