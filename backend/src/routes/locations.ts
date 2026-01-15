import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/locations:
 *   get:
 *     summary: Listar locais
 *     tags:
 *       - Locais
 *     parameters:
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *         required: false
 *     responses:
 *       200:
 *         description: Lista de locais
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const ownerId = req.query.ownerId as string | undefined;
  const includePublic = req.query.includePublic === "true";

  // Se não especificar ownerId e includePublic, mostrar apenas os próprios locais
  // Se includePublic=true, mostrar locais públicos + próprios locais
  const where: any = {};
  
  if (ownerId) {
    // Buscar locais de um usuário específico
    where.ownerId = ownerId;
  } else if (includePublic) {
    // Buscar locais públicos + locais do próprio usuário
    where.OR = [
      { isPublic: true },
      { ownerId: req.userId! },
    ];
  } else {
    // Apenas locais próprios
    where.ownerId = req.userId!;
  }

  const locations = await prisma.location.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { id: true, username: true },
      },
    },
  });

  res.json({ locations });
});

const locationSchema = z.object({
  name: z.string().min(2),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMeters: z.number().int().positive().optional(),
  type: z.enum(["GEO", "WIFI", "BLE"]).optional(),
  identifiers: z.array(z.string()).optional(),
  isPublic: z.boolean().optional().default(false),
  allowAnnouncements: z.boolean().optional().default(false),
  category: z.string().optional(),
});

/**
 * @openapi
 * /api/locations:
 *   post:
 *     summary: Criar local
 *     tags:
 *       - Locais
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationCreate'
 *     responses:
 *       201:
 *         description: Local criado
 *       400:
 *         description: Dados inválidos
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parseResult = locationSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const location = await prisma.location.create({
    data: {
      ...parseResult.data,
      ownerId: req.userId!,
      identifiers: parseResult.data.identifiers ?? [],
    },
  });

  res.status(201).json({ location });
});

/**
 * @openapi
 * /api/locations/{id}:
 *   put:
 *     summary: Atualizar local
 *     tags:
 *       - Locais
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationCreate'
 *     responses:
 *       200:
 *         description: Local atualizado
 *       404:
 *         description: Local não encontrado
 */
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parseResult = locationSchema.partial().safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const location = await prisma.location.findUnique({ where: { id: req.params.id } });
  if (!location || location.ownerId !== req.userId) {
    return res.status(404).json({ message: "Local não encontrado" });
  }

  const updated = await prisma.location.update({
    where: { id: req.params.id },
    data: parseResult.data,
  });

  res.json({ location: updated });
});

/**
 * @openapi
 * /api/locations/{id}:
 *   delete:
 *     summary: Remover local
 *     tags:
 *       - Locais
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Local removido
 *       404:
 *         description: Local não encontrado
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const locationId = req.params.id;
  const userId = req.userId!;

  const location = await prisma.location.findUnique({ where: { id: locationId } });
  
  if (!location) {
    return res.status(404).json({ message: "Local não encontrado" });
  }

  if (location.ownerId !== userId) {
    return res.status(403).json({ message: "Não tem permissão para remover este local" });
  }

  await prisma.location.delete({ where: { id: locationId } });

  res.status(204).send();
});

export default router;

