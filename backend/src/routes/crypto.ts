import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { generateKeyPair, encryptPrivateKey } from "../lib/crypto";
import { hashPassword } from "../utils/hash";

const router = Router();

/**
 * @openapi
 * /api/crypto/generate-keys:
 *   post:
 *     summary: Gerar par de chaves para assinatura digital
 *     tags: [Criptografia]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Senha para criptografar a chave privada (opcional)
 */
router.post("/generate-keys", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { password } = req.body;

    // Gerar par de chaves
    const { publicKey, privateKey } = generateKeyPair();

    // Se houver senha, criptografar chave privada
    let encryptedPrivateKey: string | null = null;
    if (password) {
      encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    }

    // Atualizar usuário com as chaves
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        publicKey: publicKey,
        privateKey: encryptedPrivateKey || privateKey, // Se não criptografada, salvar em texto plano (não recomendado para produção)
      },
      select: {
        id: true,
        username: true,
        publicKey: true,
      },
    });

    res.json({
      message: "Chaves geradas com sucesso",
      publicKey: user.publicKey,
      // Não retornar chave privada por segurança
    });
  } catch (error) {
    console.error("[Crypto] Erro ao gerar chaves:", error);
    res.status(500).json({ message: "Erro ao gerar chaves" });
  }
});

/**
 * @openapi
 * /api/crypto/public-key:
 *   get:
 *     summary: Obter chave pública do usuário
 *     tags: [Criptografia]
 *     security:
 *       - bearerAuth: []
 */
router.get("/public-key", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, username: true, publicKey: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.json({
      userId: user.id,
      username: user.username,
      publicKey: user.publicKey || null,
    });
  } catch (error) {
    console.error("[Crypto] Erro ao obter chave pública:", error);
    res.status(500).json({ message: "Erro ao obter chave pública" });
  }
});

export default router;

