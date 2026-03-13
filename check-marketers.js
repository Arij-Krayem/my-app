const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:12122004@localhost:5432/ads_monitoring?schema=public" } }
});
p.user.findMany({
  where: { role: 'MARKETER' },
  include: { brandMembers: { include: { brand: true } } }
})
.then(r => console.log(JSON.stringify(r, null, 2)))
.finally(() => p.$disconnect());s