import type { NextFunction, Request, Response } from "express";
import type { UsersRepo } from "../db/users-repo.js";
import { verifyAuthToken } from "../auth/jwt.js";

function getBearerToken(request: Request): string | null {
  const authHeader = request.header("authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export function requireAuth(usersRepo: UsersRepo) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        res.status(401).json({ error: "Unauthorized", message: "Missing Authorization Bearer token" });
        return;
      }

      let payload;
      try {
        payload = verifyAuthToken(token);
      } catch (_error) {
        res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
        return;
      }

      const userId = Number(payload.sub);
      if (!Number.isInteger(userId) || userId <= 0) {
        res.status(401).json({ error: "Unauthorized", message: "Invalid token subject" });
        return;
      }

      const user = await usersRepo.findById(userId);
      if (!user) {
        res.status(401).json({ error: "Unauthorized", message: "User no longer exists" });
        return;
      }

      req.user = { id: user.id, email: user.email, role: user.role };
      next();
    } catch (error) {
      next(error);
    }
  };
}
