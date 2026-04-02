const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const asset = await prisma.asset.findFirst({ where: { fotoUrl: { not: null } } });
  console.log('fotoUrl:', asset?.fotoUrl);
  console.log('qrCodeUrl:', asset?.qrCodeUrl);
  process.exit(0);
}
main();
