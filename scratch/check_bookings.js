const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'metro-world-padel' } });
  if (!t) {
    console.log("Tenant not found");
    return;
  }
  console.log("Tenant ID:", t.id);
  const bookings = await prisma.booking.findMany({ where: { tenantId: t.id }, orderBy: { createdAt: 'desc' }, take: 5 });
  console.log("Recent Bookings:");
  for (const b of bookings) {
    console.log(`- ${b.customerName} on ${b.date} ${b.startHour}-${b.endHour}. Status: ${b.bookingStatus}. CreatedAt: ${b.createdAt}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
