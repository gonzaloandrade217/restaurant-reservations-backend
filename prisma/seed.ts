import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const restaurantId = '0e916673-6870-480c-ab85-9209afb74b66'; 

  const tables = [
    { number: 1, capacity: 2, restaurantId },
    { number: 2, capacity: 4, restaurantId },
    { number: 3, capacity: 4, restaurantId },
    { number: 4, capacity: 6, restaurantId },
    { number: 5, capacity: 2, restaurantId },
  ];

  for (const table of tables) {
    await prisma.table.create({ data: table });
  }

  console.log('Mesas creadas con éxito ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
