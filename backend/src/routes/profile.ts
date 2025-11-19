import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/profile/attributes:
 *   get:
 *     summary: Listar atributos (pares chave-valor) do utilizador autenticado
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de atributos
 */
router.get("/attributes", requireAuth, async (req: AuthenticatedRequest, res) => {
  const attributes = await prisma.userProfile.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, value: true, createdAt: true },
  });

  res.json({ attributes });
});

const attributeSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

/**
 * @openapi
 * /api/profile/attributes:
 *   post:
 *     summary: Adicionar/atualizar um atributo do perfil (par chave-valor)
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       201:
 *         description: Atributo criado/atualizado
 *       400:
 *         description: Dados inválidos
 */
router.post("/attributes", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parseResult = attributeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const { key, value } = parseResult.data;

  const attribute = await prisma.userProfile.upsert({
    where: { userId_key: { userId: req.userId!, key } },
    update: { value },
    create: { userId: req.userId!, key, value },
    select: { id: true, key: true, value: true, createdAt: true },
  });

  res.status(201).json({ attribute });
});

/**
 * @openapi
 * /api/profile/attributes/{key}:
 *   delete:
 *     summary: Remover um atributo do perfil por chave
 *     tags:
 *       - Perfil
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Removido
 *       404:
 *         description: Atributo não encontrado
 */
router.delete("/attributes/:key", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.userProfile.delete({
      where: { userId_key: { userId: req.userId!, key: req.params.key } },
    });
  } catch {
    return res.status(404).json({ message: "Atributo não encontrado" });
  }

  res.status(204).send();
});

/**
 * @openapi
 * /api/profile/keys:
 *   get:
 *     summary: Listar todas as chaves públicas existentes no sistema (sem valores)
 *     tags:
 *       - Perfil
 *     responses:
 *       200:
 *         description: Lista de chaves públicas
 */
router.get("/keys", async (_req, res) => {
  // Distinct keys from UserProfile
  const keys = await prisma.userProfile.findMany({
    distinct: ["key"],
    select: { key: true },
    orderBy: { key: "asc" },
  });

  res.json({ keys: keys.map((k) => k.key) });
});

export default router;


