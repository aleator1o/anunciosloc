import { PrismaClient, DeliveryMode, Visibility, ReactionType, LocationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Limpar dados existentes...");
  await prisma.reaction.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Criar utilizadores...");
  const passwordHash = await bcrypt.hash("123456", 10);

  const alice = await prisma.user.create({
    data: {
      username: "alice",
      email: "alice@example.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      username: "bob",
      email: "bob@example.com",
      passwordHash,
    },
  });

  console.log("📍 Criar locais...");
  const independence = await prisma.location.create({
    data: {
      name: "Largo da Independência",
      latitude: -8.8139,
      longitude: 13.2319,
      radiusMeters: 50,
      type: LocationType.GEO,
      identifiers: [],
      ownerId: alice.id,
    },
  });

  const belasShopping = await prisma.location.create({
    data: {
      name: "Belas Shopping",
      latitude: -8.9167,
      longitude: 13.1833,
      radiusMeters: 80,
      type: LocationType.GEO,
      identifiers: [],
      ownerId: alice.id,
    },
  });

  const wifiHub = await prisma.location.create({
    data: {
      name: "Hub WiFi Camama",
      type: LocationType.WIFI,
      identifiers: ["wifi-camama-1", "ble-camama-2"],
      ownerId: bob.id,
    },
  });

  console.log("📢 Criar anúncios...");
  const cleanup = await prisma.announcement.create({
    data: {
      authorId: alice.id,
      locationId: independence.id,
      content:
        "Mutirão de limpeza comunitária no Largo da Independência neste sábado às 10h. Traga luvas!",
      deliveryMode: DeliveryMode.CENTRALIZED,
      visibility: Visibility.PUBLIC,
      startsAt: new Date(),
    },
  });

  const promo = await prisma.announcement.create({
    data: {
      authorId: bob.id,
      locationId: belasShopping.id,
      content:
        "Promoção relâmpago no Belas Shopping! Descontos até 40% em eletrónicos durante o fim de semana.",
      deliveryMode: DeliveryMode.CENTRALIZED,
      visibility: Visibility.PUBLIC,
    },
  });

  const wifiTips = await prisma.announcement.create({
    data: {
      authorId: bob.id,
      locationId: wifiHub.id,
      content:
        "Atualização do ponto WiFi Camama: nova palavra-passe disponível na receção do ginásio.",
      deliveryMode: DeliveryMode.DECENTRALIZED,
      visibility: Visibility.PUBLIC,
    },
  });

  console.log("❤️ Adicionar interações...");
  await prisma.reaction.create({
    data: {
      announcementId: cleanup.id,
      userId: bob.id,
      type: ReactionType.LIKE,
    },
  });

  await prisma.bookmark.create({
    data: {
      announcementId: promo.id,
      userId: alice.id,
    },
  });

  console.log("✅ Seed concluído.");
  console.log("Credenciais de teste:");
  console.log("  Email: alice@example.com | Senha: 123456");
  console.log("  Email: bob@example.com   | Senha: 123456");
}

main()
  .catch((err) => {
    console.error("❌ Erro ao executar seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

