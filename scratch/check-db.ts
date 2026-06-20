import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting to database...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      take: 10,
    });
    console.log('Registered Users in DB:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
