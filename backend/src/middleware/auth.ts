import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/token";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const [, token] = header.split(" ");

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

