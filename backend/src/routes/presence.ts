import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const updateSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  wifiIds: z.array(z.string()).optional(),
});

/**
 * @openapi
 * /api/presence/location:
 *   post:
 *     summary: Atualizar localização atual do utilizador (GPS/WiFi)
 *     tags:
 *       - Presença
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               wifiIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Estado de localização atualizado
 */
router.post("/location", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parse = updateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parse.error.flatten() });
  }

  const { latitude, longitude, wifiIds } = parse.data;

  const presence = await prisma.userLocationStatus.upsert({
    where: { userId: req.userId! },
    update: { latitude, longitude, wifiIds: wifiIds ?? [] as any, updatedAt: new Date() },
    create: { userId: req.userId!, latitude, longitude, wifiIds: wifiIds ?? [] },
  });

  res.json({ presence });
});

export default router;


