import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { comparePassword, hashPassword } from "../utils/hash";
import { signAccessToken } from "../utils/token";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registar novo utilizador
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Utilizador criado
 *       409:
 *         description: Utilizador já registado
 */
router.post("/register", async (req, res) => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const { username, email, password } = parseResult.data;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return res.status(409).json({ message: "Utilizador já registado" });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  const token = signAccessToken({ userId: user.id });

  return res.status(201).json({ user, token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sessão
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const { email, password } = parseResult.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  const token = signAccessToken({ userId: user.id });

  return res.json({
    user: { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt },
    token,
  });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do utilizador autenticado
 *     tags:
 *       - Autenticação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do utilizador
 *       401:
 *         description: Não autenticado
 */
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ message: "Utilizador não encontrado" });
  }

  return res.json({ user });
});

export default router;

