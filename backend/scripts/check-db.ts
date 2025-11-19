import { prisma } from "../src/lib/prisma";

async function checkDatabase() {
  console.log("🔍 Verificando dados no banco de dados...\n");

  try {
    // Contar utilizadores
    const userCount = await prisma.user.count();
    console.log(`👤 Total de utilizadores: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
        take: 10,
      });
      console.log("\n📋 Últimos utilizadores:");
      users.forEach((user) => {
        console.log(`  - ${user.username} (${user.email}) - Criado em: ${user.createdAt}`);
      });
    }

    // Contar anúncios
    const announcementCount = await prisma.announcement.count();
    console.log(`\n📢 Total de anúncios: ${announcementCount}`);

    if (announcementCount > 0) {
      const announcements = await prisma.announcement.findMany({
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              username: true,
            },
          },
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      });
      console.log("\n📋 Últimos anúncios:");
      announcements.forEach((ann) => {
        console.log(`  - Por ${ann.author.username}: "${ann.content.substring(0, 50)}..."`);
      });
    }

    // Contar locais
    const locationCount = await prisma.location.count();
    console.log(`\n📍 Total de locais: ${locationCount}`);

    if (locationCount > 0) {
      const locations = await prisma.location.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          createdAt: true,
          owner: {
            select: {
              username: true,
            },
          },
        },
        take: 5,
      });
      console.log("\n📋 Últimos locais:");
      locations.forEach((loc) => {
        console.log(`  - ${loc.name} (${loc.type}) - Criado por: ${loc.owner.username}`);
      });
    }

    // Contar reações
    const reactionCount = await prisma.reaction.count();
    console.log(`\n❤️ Total de reações: ${reactionCount}`);

    // Contar bookmarks
    const bookmarkCount = await prisma.bookmark.count();
    console.log(`\n🔖 Total de bookmarks: ${bookmarkCount}`);
  } catch (error) {
    console.error("❌ Erro ao consultar banco de dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();


