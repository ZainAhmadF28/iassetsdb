const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async update({ model, operation, args, query }) {
        if (args.data) {
          const now = new Date();
          now.setHours(now.getHours() + 7);
          args.data.updatedAt = now;
        }
        console.log("update args:", args);
        return query(args);
      },
      async create({ model, operation, args, query }) {
         if (args.data) {
          const now = new Date();
          now.setHours(now.getHours() + 7);
          if (!args.data.createdAt) args.data.createdAt = now;
          if (!args.data.updatedAt) args.data.updatedAt = now;
        }
        console.log("create args:", args);
        return query(args);
      }
    }
  }
});

async function main() {
  const asset = await prisma.asset.create({
    data: {
      nomorAset: "TEST-TZ-" + Date.now(),
      namaAset: "Test Tz",
    }
  });
  console.log("Created asset createdAt:", asset.createdAt, "updatedAt:", asset.updatedAt);
  
  const updated = await prisma.asset.update({
    where: { id: asset.id },
    data: { namaAset: "Test Tz Updated" }
  });
  console.log("Updated asset createdAt:", updated.createdAt, "updatedAt:", updated.updatedAt);
}
main().catch(console.error).finally(() => prisma.$disconnect());
