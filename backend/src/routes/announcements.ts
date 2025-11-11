import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * @openapi
 * /api/announcements:
 *   get:
 *     summary: Listar anúncios
 *     tags:
 *       - Anúncios
 *     parameters:
 *       - in: query
 *         name: locationId
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de anúncios
 */
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { locationId, authorId } = req.query;

  const announcements = await prisma.announcement.findMany({
    where: {
      locationId: locationId ? String(locationId) : undefined,
      authorId: authorId ? String(authorId) : undefined,
    },
    include: {
      author: { select: { id: true, username: true } },
      location: { select: { id: true, name: true } },
      reactions: true,
      bookmarks: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Se houver políticas, filtrar por perfil do utilizador autenticado
  // 1) Obter atributos (pares chave-valor) do utilizador
  const profileAttrs = await prisma.userProfile.findMany({
    where: { userId: req.userId! },
    select: { key: true, value: true },
  });
  const profileMap = new Map(profileAttrs.map(a => [a.key.toLowerCase(), a.value.toLowerCase()]));

  const now = new Date();

  const presence = await prisma.userLocationStatus.findUnique({
    where: { userId: req.userId! },
  });

  const filtered = announcements.filter(a => {
    // Verificar janela de tempo
    if (a.startsAt && now < a.startsAt) return false;
    if (a.endsAt && now > a.endsAt) return false;

    // Ignorar filtro de localização aqui (GET geral). A versão específica está em /available

    // Sem restrições => permitido
    // @ts-ignore
    const restrictions = (a as any).policyRestrictions as Array<{ key: string; value: string }> | null | undefined;
    // @ts-ignore
    const policyType = (a as any).policyType as "WHITELIST" | "BLACKLIST" | undefined;
    if (!restrictions || restrictions.length === 0 || !policyType) return true;

    const matches = restrictions.every(r => profileMap.get(r.key.toLowerCase()) === r.value.toLowerCase());

    return policyType === "WHITELIST" ? matches : !matches;
  });

  res.json({ announcements: filtered });
});

function isInsideGeo(
  userLat: number,
  userLng: number,
  locLat: number,
  locLng: number,
  radiusMeters: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(locLat - userLat);
  const dLng = toRad(locLng - userLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(userLat)) *
      Math.cos(toRad(locLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusMeters;
}

/**
 * @openapi
 * /api/announcements/available:
 *   get:
 *     summary: Listar anúncios disponíveis no local atual (aplica políticas e janela de tempo)
 *     tags:
 *       - Anúncios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de anúncios disponíveis
 */
router.get("/available", requireAuth, async (req: AuthenticatedRequest, res) => {
  const now = new Date();
  const presence = await prisma.userLocationStatus.findUnique({ where: { userId: req.userId! } });

  const announcements = await prisma.announcement.findMany({
    include: {
      author: { select: { id: true, username: true } },
      location: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const profileAttrs = await prisma.userProfile.findMany({
    where: { userId: req.userId! },
    select: { key: true, value: true },
  });
  const profileMap = new Map(profileAttrs.map(a => [a.key.toLowerCase(), a.value.toLowerCase()]));

  const available = announcements.filter(a => {
    if (a.startsAt && now < a.startsAt) return false;
    if (a.endsAt && now > a.endsAt) return false;

    if (a.location) {
      if (!presence) return false;
      if (a.location.type === "GEO") {
        if (
          presence.latitude == null ||
          presence.longitude == null ||
          a.location.latitude == null ||
          a.location.longitude == null ||
          a.location.radiusMeters == null
        ) {
          return false;
        }
        const inside = isInsideGeo(
          presence.latitude,
          presence.longitude,
          a.location.latitude,
          a.location.longitude,
          a.location.radiusMeters
        );
        if (!inside) return false;
      } else {
        const userWifiSet = new Set((presence.wifiIds ?? []).map(w => w.toLowerCase()));
        const locIds = (a.location.identifiers ?? []).map(w => w.toLowerCase());
        const intersects = locIds.some(id => userWifiSet.has(id));
        if (!intersects) return false;
      }
    }

    const restrictions = (a as any).policyRestrictions as Array<{ key: string; value: string }> | null | undefined;
    const policyType = (a as any).policyType as "WHITELIST" | "BLACKLIST" | undefined;
    if (!restrictions || restrictions.length === 0 || !policyType) return true;

    const matches = restrictions.every(r => profileMap.get(r.key.toLowerCase()) === r.value.toLowerCase());
    return policyType === "WHITELIST" ? matches : !matches;
  });

  res.json({ announcements: available });
});

/**
 * @openapi
 * /api/announcements/{id}/receive:
 *   post:
 *     summary: Marcar anúncio como recebido (persistir para o utilizador)
 *     tags:
 *       - Anúncios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Recebido
 *       404:
 *         description: Anúncio não encontrado
 */
router.post("/:id/receive", requireAuth, async (req: AuthenticatedRequest, res) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  const received = await prisma.receivedAnnouncement.upsert({
    where: { userId_announcementId: { userId: req.userId!, announcementId: req.params.id } },
    update: {},
    create: { userId: req.userId!, announcementId: req.params.id },
  });

  res.status(201).json({ received });
});

/**
 * @openapi
 * /api/announcements/{id}:
 *   get:
 *     summary: Obter anúncio por ID
 *     tags:
 *       - Anúncios
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhe do anúncio
 *       404:
 *         description: Não encontrado
 */
router.get("/:id", async (req, res) => {
  const announcement = await prisma.announcement.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, username: true } },
      location: { select: { id: true, name: true } },
      reactions: true,
      bookmarks: true,
    },
  });

  if (!announcement) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  res.json({ announcement });
});

const restrictionSchema = z.object({ key: z.string().min(1), value: z.string().min(1) });

const createAnnouncementSchema = z.object({
  content: z.string().min(5),
  locationId: z.string().uuid().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional().default("PUBLIC"),
  deliveryMode: z.enum(["CENTRALIZED", "DECENTRALIZED"]).optional().default("CENTRALIZED"),
  policyType: z.enum(["WHITELIST", "BLACKLIST"]).optional().default("WHITELIST"),
  policyRestrictions: z.array(restrictionSchema).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

/**
 * @openapi
 * /api/announcements:
 *   post:
 *     summary: Criar anúncio
 *     tags:
 *       - Anúncios
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnnouncementCreate'
 *     responses:
 *       201:
 *         description: Anúncio criado
 *       400:
 *         description: Dados inválidos
 */
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parseResult = createAnnouncementSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const { content, locationId, visibility, deliveryMode, policyType, policyRestrictions, startsAt, endsAt } = parseResult.data;

  const announcement = await prisma.announcement.create({
    data: {
      authorId: req.userId!,
      content,
      locationId,
      visibility,
      deliveryMode,
      policyType,
      policyRestrictions: policyRestrictions ? (policyRestrictions as any) : undefined,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      endsAt: endsAt ? new Date(endsAt) : undefined,
    },
  });

  res.status(201).json({ announcement });
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

/**
 * @openapi
 * /api/announcements/{id}:
 *   put:
 *     summary: Atualizar anúncio
 *     tags:
 *       - Anúncios
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
 *             $ref: '#/components/schemas/AnnouncementCreate'
 *     responses:
 *       200:
 *         description: Anúncio atualizado
 *       404:
 *         description: Não encontrado
 */
router.put("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parseResult = updateAnnouncementSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ message: "Dados inválidos", errors: parseResult.error.flatten() });
  }

  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement || announcement.authorId !== req.userId) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  const updated = await prisma.announcement.update({
    where: { id: req.params.id },
    data: {
      ...parseResult.data,
      startsAt: parseResult.data.startsAt ? new Date(parseResult.data.startsAt) : announcement.startsAt,
      endsAt: parseResult.data.endsAt ? new Date(parseResult.data.endsAt) : announcement.endsAt,
    },
  });

  res.json({ announcement: updated });
});

/**
 * @openapi
 * /api/announcements/{id}:
 *   delete:
 *     summary: Apagar anúncio
 *     tags:
 *       - Anúncios
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
 *         description: Removido
 *       404:
 *         description: Não encontrado
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement || announcement.authorId !== req.userId) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  await prisma.announcement.delete({ where: { id: req.params.id } });

  res.status(204).send();
});

/**
 * @openapi
 * /api/announcements/{id}/like:
 *   post:
 *     summary: Adicionar like ao anúncio
 *     tags:
 *       - Anúncios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Like registado
 *       404:
 *         description: Anúncio não encontrado
 */
router.post("/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  const like = await prisma.reaction.upsert({
    where: {
      announcementId_userId_type: {
        announcementId: req.params.id,
        userId: req.userId!,
        type: "LIKE",
      },
    },
    update: {},
    create: {
      announcementId: req.params.id,
      userId: req.userId!,
      type: "LIKE",
    },
  });

  res.status(201).json({ reaction: like });
});

/**
 * @openapi
 * /api/announcements/{id}/like:
 *   delete:
 *     summary: Remover like do anúncio
 *     tags:
 *       - Anúncios
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
 *         description: Like removido
 *       404:
 *         description: Reação não encontrada
 */
router.delete("/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.reaction.delete({
      where: {
        announcementId_userId_type: {
          announcementId: req.params.id,
          userId: req.userId!,
          type: "LIKE",
        },
      },
    });
  } catch (error) {
    return res.status(404).json({ message: "Reação não encontrada" });
  }

  res.status(204).send();
});

/**
 * @openapi
 * /api/announcements/{id}/bookmark:
 *   post:
 *     summary: Guardar anúncio
 *     tags:
 *       - Anúncios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Marcador criado
 *       404:
 *         description: Anúncio não encontrado
 */
router.post("/:id/bookmark", requireAuth, async (req: AuthenticatedRequest, res) => {
  const announcement = await prisma.announcement.findUnique({ where: { id: req.params.id } });
  if (!announcement) {
    return res.status(404).json({ message: "Anúncio não encontrado" });
  }

  const bookmark = await prisma.bookmark.upsert({
    where: {
      announcementId_userId: {
        announcementId: req.params.id,
        userId: req.userId!,
      },
    },
    update: {},
    create: {
      announcementId: req.params.id,
      userId: req.userId!,
    },
  });

  res.status(201).json({ bookmark });
});

/**
 * @openapi
 * /api/announcements/{id}/bookmark:
 *   delete:
 *     summary: Remover marcador do anúncio
 *     tags:
 *       - Anúncios
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
 *         description: Marcador removido
 *       404:
 *         description: Marcador não encontrado
 */
router.delete("/:id/bookmark", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await prisma.bookmark.delete({
      where: {
        announcementId_userId: {
          announcementId: req.params.id,
          userId: req.userId!,
        },
      },
    });
  } catch (error) {
    return res.status(404).json({ message: "Marcador não encontrado" });
  }

  res.status(204).send();
});

export default router;

