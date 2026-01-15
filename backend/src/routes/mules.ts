import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { isInsideGeo } from "../lib/location";

const router = Router();

/**
 * Schema para configurar espaço de mula
 */
const muleConfigSchema = z.object({
  maxSpaceBytes: z.number().int().positive().max(104857600), // Máximo 100MB
  isActive: z.boolean().optional(),
});

/**
 * @openapi
 * /api/mules/list-active:
 *   get:
 *     summary: Listar todos os usuários com mulas ativas (incluindo nomes)
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários com mulas ativas
 */
router.get("/list-active", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    // Buscar todas as mulas ativas
    const activeMules = await prisma.muleConfig.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            profile: {
              select: {
                key: true,
                value: true,
              },
            },
            presence: {
              select: {
                latitude: true,
                longitude: true,
                wifiIds: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar resposta com nomes do perfil
    const formattedMules = activeMules.map((muleConfig) => {
      const user = muleConfig.user;
      
      // Tentar encontrar nome no perfil (pode ser "nome", "Nome", "name", "Name", etc.)
      const nomeProfile = user.profile.find(
        (p) => p.key.toLowerCase() === "nome" || p.key.toLowerCase() === "name"
      );
      
      // Usar nome do perfil se existir, senão usar username
      const nome = nomeProfile ? nomeProfile.value : user.username;

      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        nome: nome,
        maxSpaceBytes: muleConfig.maxSpaceBytes,
        isActive: muleConfig.isActive,
        createdAt: muleConfig.createdAt,
        updatedAt: muleConfig.updatedAt,
        temLocalizacao: !!user.presence,
        localizacao: user.presence ? {
          latitude: user.presence.latitude,
          longitude: user.presence.longitude,
          wifiIds: user.presence.wifiIds,
          updatedAt: user.presence.updatedAt,
        } : null,
        // Incluir todos os atributos do perfil para referência
        atributosPerfil: user.profile.map((p) => ({ key: p.key, value: p.value })),
      };
    });

    res.json({
      total: formattedMules.length,
      mules: formattedMules,
    });
  } catch (error) {
    console.error("[Mules] Erro ao listar mulas ativas:", error);
    res.status(500).json({ message: "Erro ao listar mulas ativas" });
  }
});

/**
 * @openapi
 * /api/mules/config:
 *   get:
 *     summary: Obter configuração de mula do usuário
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuração de mula
 */
router.get("/config", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const config = await prisma.muleConfig.findUnique({
      where: { userId: req.userId! },
    });

    if (!config) {
      // Criar configuração padrão se não existir
      const defaultConfig = await prisma.muleConfig.create({
        data: {
          userId: req.userId!,
          maxSpaceBytes: 10485760, // 10MB
          isActive: true,
        },
      });
      return res.json({ config: defaultConfig });
    }

    res.json({ config });
  } catch (error) {
    console.error("[Mules] Erro ao obter configuração:", error);
    res.status(500).json({ message: "Erro ao obter configuração de mula" });
  }
});

/**
 * @openapi
 * /api/mules/config:
 *   post:
 *     summary: Configurar espaço de mula
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxSpaceBytes:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 */
router.post("/config", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = muleConfigSchema.parse(req.body);

    const config = await prisma.muleConfig.upsert({
      where: { userId: req.userId! },
      update: {
        maxSpaceBytes: data.maxSpaceBytes,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      },
      create: {
        userId: req.userId!,
        maxSpaceBytes: data.maxSpaceBytes,
        isActive: data.isActive ?? true,
      },
    });

    res.json({ config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    console.error("[Mules] Erro ao configurar mula:", error);
    res.status(500).json({ message: "Erro ao configurar mula" });
  }
});

/**
 * @openapi
 * /api/mules/available:
 *   get:
 *     summary: Listar mulas disponíveis para uma mensagem
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: announcementId
 *         required: true
 *         schema:
 *           type: string
 */
router.get("/available", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { announcementId } = req.query;

    if (!announcementId || typeof announcementId !== "string") {
      return res.status(400).json({ message: "announcementId é obrigatório" });
    }

    // Buscar anúncio
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: { location: true },
    });

    if (!announcement) {
      return res.status(404).json({ message: "Anúncio não encontrado" });
    }

    // Buscar localização do usuário atual (publicador)
    const publisherLocation = await prisma.userLocationStatus.findUnique({
      where: { userId: req.userId! },
    });

    if (!publisherLocation) {
      return res.status(400).json({ message: "Localização do publicador não encontrada" });
    }

    // Buscar mulas disponíveis (usuários com muleConfig ativo)
    const activeMules = await prisma.muleConfig.findMany({
      where: {
        isActive: true,
        userId: { not: req.userId! }, // Não pode ser o próprio publicador
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            presence: true,
          },
        },
      },
    });

    // Filtrar mulas que:
    // 1. Estão no mesmo local que o publicador
    //    - Primeiro, tentamos pelo local do anúncio (geo / wifi)
    //    - Como fallback, consideramos proximidade direta entre publicador e mula (ex: 500m)
    // 2. Têm espaço disponível
    // 3. Não estão transportando a mesma mensagem já
    const availableMules = [];

    for (const muleConfig of activeMules) {
      const muleLocation = muleConfig.user.presence;
      if (!muleLocation) continue;

      // Verificar se mula está no mesmo local que o publicador
      let isAtSameLocation = false;

      // 1) Tentativa principal: usar o local do anúncio (geo / wifi)
      if (announcement.location) {
        if (announcement.location.type === "GEO") {
          if (
            muleLocation.latitude !== null &&
            muleLocation.latitude !== undefined &&
            muleLocation.longitude !== null &&
            muleLocation.longitude !== undefined &&
            publisherLocation.latitude !== null &&
            publisherLocation.latitude !== undefined &&
            publisherLocation.longitude !== null &&
            publisherLocation.longitude !== undefined &&
            announcement.location.latitude !== null &&
            announcement.location.latitude !== undefined &&
            announcement.location.longitude !== null &&
            announcement.location.longitude !== undefined &&
            announcement.location.radiusMeters
          ) {
            // Verificar se mula está no local do anúncio
            const muleAtLocation = isInsideGeo(
              muleLocation.latitude,
              muleLocation.longitude,
              announcement.location.latitude,
              announcement.location.longitude,
              announcement.location.radiusMeters
            );
            // Verificar se publicador está no local do anúncio
            const publisherAtLocation = isInsideGeo(
              publisherLocation.latitude,
              publisherLocation.longitude,
              announcement.location.latitude,
              announcement.location.longitude,
              announcement.location.radiusMeters
            );
            isAtSameLocation = muleAtLocation && publisherAtLocation;
          }
        } else {
          // WiFi/BLE: verificar se há interseção de IDs
          const muleWifiSet = new Set((muleLocation.wifiIds ?? []).map(w => w.toLowerCase()));
          const publisherWifiSet = new Set((publisherLocation.wifiIds ?? []).map(w => w.toLowerCase()));
          const locIds = (announcement.location.identifiers ?? []).map(w => w.toLowerCase());
          
          const muleAtLocation = locIds.some(id => muleWifiSet.has(id));
          const publisherAtLocation = locIds.some(id => publisherWifiSet.has(id));
          isAtSameLocation = muleAtLocation && publisherAtLocation;
        }
      }

      // 2) Fallback: se ainda não considerámos "mesmo local", ver proximidade direta
      //    entre publicador e mula (ex.: 500m). Isto ajuda em casos em que ambos estão
      //    fisicamente colados mas ligeiramente fora do círculo da localização.
      if (!isAtSameLocation) {
        if (
          muleLocation.latitude !== null &&
          muleLocation.latitude !== undefined &&
          muleLocation.longitude !== null &&
          muleLocation.longitude !== undefined &&
          publisherLocation.latitude !== null &&
          publisherLocation.latitude !== undefined &&
          publisherLocation.longitude !== null &&
          publisherLocation.longitude !== undefined
        ) {
          const areClose = isInsideGeo(
            muleLocation.latitude,
            muleLocation.longitude,
            publisherLocation.latitude,
            publisherLocation.longitude,
            500 // 500 metros de tolerância para considerar "mesmo local" (aumentado de 100m)
          );

          if (areClose) {
            isAtSameLocation = true;
          }
        }
      }

      if (!isAtSameLocation) continue;

      // Verificar espaço disponível
      const messagesInTransit = await prisma.muleMessage.count({
        where: {
          muleUserId: muleConfig.userId,
          status: { in: ["PENDING", "IN_TRANSIT"] },
        },
      });

      // Calcular tamanho aproximado de mensagens em trânsito (estimativa: 1KB por mensagem)
      const usedSpace = messagesInTransit * 1024;
      const availableSpace = muleConfig.maxSpaceBytes - usedSpace;

      if (availableSpace < 1024) continue; // Menos de 1KB disponível

      // Verificar se já está transportando esta mensagem
      const alreadyTransporting = await prisma.muleMessage.findFirst({
        where: {
          announcementId: announcementId,
          muleUserId: muleConfig.userId,
          status: { in: ["PENDING", "IN_TRANSIT"] },
        },
      });

      if (alreadyTransporting) continue;

      availableMules.push({
        userId: muleConfig.userId,
        username: muleConfig.user?.username || "Unknown",
        availableSpaceBytes: availableSpace,
        maxSpaceBytes: muleConfig.maxSpaceBytes,
      });
    }

    // Log detalhado para debug
    const totalActiveMules = activeMules.length;
    console.log(`[Mules] Total de mulas ativas: ${totalActiveMules}`);
    console.log(`[Mules] Mulas disponíveis após filtros: ${availableMules.length}`);
    
    if (availableMules.length === 0 && totalActiveMules > 0) {
      console.log(`[Mules] ⚠️ Há ${totalActiveMules} mula(s) ativa(s), mas nenhuma passou nos filtros:`);
      console.log(`[Mules] - Verifique se mula e publicador estão no mesmo local`);
      console.log(`[Mules] - Verifique se mula tem espaço disponível`);
    }

    res.json({ mules: availableMules });
  } catch (error) {
    console.error("[Mules] Erro ao listar mulas disponíveis:", error);
    res.status(500).json({ message: "Erro ao listar mulas disponíveis" });
  }
});

/**
 * @openapi
 * /api/mules/send:
 *   post:
 *     summary: Enviar mensagem via mula
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               announcementId:
 *                 type: string
 *               muleUserId:
 *                 type: string
 *               destinationUserId:
 *                 type: string
 */
router.post("/send", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { announcementId, muleUserId, destinationUserId } = req.body;

    if (!announcementId || !muleUserId || !destinationUserId) {
      return res.status(400).json({ message: "announcementId, muleUserId e destinationUserId são obrigatórios" });
    }

    // Verificar se anúncio existe e pertence ao usuário
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return res.status(404).json({ message: "Anúncio não encontrado" });
    }

    if (announcement.authorId !== req.userId!) {
      return res.status(403).json({ message: "Apenas o autor pode enviar mensagem via mula" });
    }

    // Verificar se mula existe e está ativa
    const muleConfig = await prisma.muleConfig.findUnique({
      where: { userId: muleUserId },
    });

    if (!muleConfig || !muleConfig.isActive) {
      return res.status(400).json({ message: "Mula não disponível" });
    }

    // Verificar espaço disponível
    const messagesInTransit = await prisma.muleMessage.count({
      where: {
        muleUserId: muleUserId,
        status: { in: ["PENDING", "IN_TRANSIT"] },
      },
    });

    const usedSpace = messagesInTransit * 1024; // Estimativa
    const availableSpace = muleConfig.maxSpaceBytes - usedSpace;

    if (availableSpace < 1024) {
      return res.status(400).json({ message: "Mula sem espaço disponível" });
    }

    // Verificar se já existe mensagem em trânsito
    const existing = await prisma.muleMessage.findFirst({
      where: {
        announcementId: announcementId,
        muleUserId: muleUserId,
        destinationUserId: destinationUserId,
        status: { in: ["PENDING", "IN_TRANSIT"] },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "Mensagem já está sendo transportada por esta mula" });
    }

    // Criar mensagem de mula
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira em 1 hora

    const muleMessage = await prisma.muleMessage.create({
      data: {
        announcementId: announcementId,
        muleUserId: muleUserId,
        destinationUserId: destinationUserId,
        status: "PENDING",
        expiresAt: expiresAt,
      },
    });

    res.json({ muleMessage });
  } catch (error) {
    console.error("[Mules] Erro ao enviar via mula:", error);
    res.status(500).json({ message: "Erro ao enviar mensagem via mula" });
  }
});

/**
 * @openapi
 * /api/mules/messages:
 *   get:
 *     summary: Listar mensagens que o usuário está transportando como mula
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 */
router.get("/messages", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const messages = await prisma.muleMessage.findMany({
      where: {
        muleUserId: req.userId!,
        status: { in: ["PENDING", "IN_TRANSIT"] },
      },
      include: {
        announcement: {
          include: {
            author: { select: { id: true, username: true } },
            location: true,
          },
        },
        destinationUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ messages });
  } catch (error) {
    console.error("[Mules] Erro ao listar mensagens de mula:", error);
    res.status(500).json({ message: "Erro ao listar mensagens de mula" });
  }
});

/**
 * @openapi
 * /api/mules/deliver:
 *   post:
 *     summary: Entregar mensagem ao destino (chamado quando mula chega ao local de destino)
 *     tags: [Mulas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               muleMessageId:
 *                 type: string
 */
router.post("/deliver", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { muleMessageId } = req.body;

    if (!muleMessageId) {
      return res.status(400).json({ message: "muleMessageId é obrigatório" });
    }

    // Buscar mensagem de mula
    const muleMessage = await prisma.muleMessage.findUnique({
      where: { id: muleMessageId },
      include: {
        announcement: { include: { location: true } },
      },
    });

    if (!muleMessage) {
      return res.status(404).json({ message: "Mensagem de mula não encontrada" });
    }

    if (muleMessage.muleUserId !== req.userId!) {
      return res.status(403).json({ message: "Apenas a mula pode entregar a mensagem" });
    }

    /**
     * CASO ESPECIAL: mula e destino são a MESMA pessoa
     * ------------------------------------------------
     * Exemplo: Marcos envia anúncio para Jael,
     *          Jael é ao mesmo tempo MULA e DESTINO.
     *
     * Neste cenário faz sentido permitir que a própria pessoa
     * "confirme a recepção" sem obrigar a duas localizações diferentes.
     * Aqui simplificamos a lógica:
     *  - Não exigimos comparação de localização entre mula e destino
     *    (porque é o mesmo utilizador)
     *  - Apenas marcamos a mensagem como entregue e registamos ReceivedAnnouncement.
     */
    if (muleMessage.muleUserId === muleMessage.destinationUserId) {
      const updated = await prisma.muleMessage.update({
        where: { id: muleMessageId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      await prisma.receivedAnnouncement.upsert({
        where: {
          userId_announcementId: {
            userId: muleMessage.destinationUserId,
            announcementId: muleMessage.announcementId,
          },
        },
        create: {
          userId: muleMessage.destinationUserId,
          announcementId: muleMessage.announcementId,
        },
        update: {},
      });

      return res.json({ muleMessage: updated });
    }

    // CASO NORMAL: mula (B) e destino (C) são utilizadores diferentes

    // Verificar se mula está no local de destino
    const muleLocation = await prisma.userLocationStatus.findUnique({
      where: { userId: req.userId! },
    });

    if (!muleLocation) {
      return res.status(400).json({ message: "Localização da mula não encontrada" });
    }

    const destinationLocation = await prisma.userLocationStatus.findUnique({
      where: { userId: muleMessage.destinationUserId },
    });

    if (!destinationLocation) {
      return res.status(400).json({ message: "Localização do destino não encontrada" });
    }

    // Verificar se mula e destino estão no mesmo local
    let isAtDestination = false;

    // 1) Tentativa principal: usar o local do anúncio (geo / wifi)
    if (muleMessage.announcement.location) {
      if (muleMessage.announcement.location.type === "GEO") {
        if (
          muleLocation.latitude &&
          muleLocation.longitude &&
          destinationLocation.latitude &&
          destinationLocation.longitude &&
          muleMessage.announcement.location.latitude &&
          muleMessage.announcement.location.longitude &&
          muleMessage.announcement.location.radiusMeters
        ) {
          const muleAtLocation = isInsideGeo(
            muleLocation.latitude,
            muleLocation.longitude,
            muleMessage.announcement.location.latitude,
            muleMessage.announcement.location.longitude,
            muleMessage.announcement.location.radiusMeters
          );
          const destAtLocation = isInsideGeo(
            destinationLocation.latitude,
            destinationLocation.longitude,
            muleMessage.announcement.location.latitude,
            muleMessage.announcement.location.longitude,
            muleMessage.announcement.location.radiusMeters
          );
          isAtDestination = muleAtLocation && destAtLocation;
        }
      } else {
        const muleWifiSet = new Set((muleLocation.wifiIds ?? []).map(w => w.toLowerCase()));
        const destWifiSet = new Set((destinationLocation.wifiIds ?? []).map(w => w.toLowerCase()));
        const locIds = (muleMessage.announcement.location.identifiers ?? []).map(w => w.toLowerCase());
        
        const muleAtLocation = locIds.some(id => muleWifiSet.has(id));
        const destAtLocation = locIds.some(id => destWifiSet.has(id));
        isAtDestination = muleAtLocation && destAtLocation;
      }
    }

    // 2) Fallback: se ainda não considerámos "mesmo local", ver proximidade direta
    //    entre mula e destino (ex.: 500m). Isto ajuda em casos em que ambos estão
    //    fisicamente colados mas ligeiramente fora do círculo da localização.
    if (!isAtDestination) {
      if (
        muleLocation.latitude !== null &&
        muleLocation.latitude !== undefined &&
        muleLocation.longitude !== null &&
        muleLocation.longitude !== undefined &&
        destinationLocation.latitude !== null &&
        destinationLocation.latitude !== undefined &&
        destinationLocation.longitude !== null &&
        destinationLocation.longitude !== undefined
      ) {
        const areClose = isInsideGeo(
          muleLocation.latitude,
          muleLocation.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude,
          500 // 500 metros de tolerância para considerar "mesmo local"
        );

        if (areClose) {
          isAtDestination = true;
        }
      }
    }

    if (!isAtDestination) {
      return res.status(400).json({ message: "Mula e destino devem estar no mesmo local" });
    }

    // Marcar como entregue
    const updated = await prisma.muleMessage.update({
      where: { id: muleMessageId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    // Criar ReceivedAnnouncement para o destino
    await prisma.receivedAnnouncement.upsert({
      where: {
        userId_announcementId: {
          userId: muleMessage.destinationUserId,
          announcementId: muleMessage.announcementId,
        },
      },
      create: {
        userId: muleMessage.destinationUserId,
        announcementId: muleMessage.announcementId,
      },
      update: {},
    });

    res.json({ muleMessage: updated });
  } catch (error) {
    console.error("[Mules] Erro ao entregar mensagem:", error);
    res.status(500).json({ message: "Erro ao entregar mensagem" });
  }
});

export default router;

