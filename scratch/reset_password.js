const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const userEmail = "rahul.telang@hotmail.com";
  const tempPassword = "rahul123";
  const newHash = hashPassword(tempPassword);

  const updatedUser = await prisma.user.update({
    where: { email: userEmail },
    data: {
      passwordHash: newHash
    }
  });

  console.log("SUCCESS: Password updated successfully for user:", updatedUser.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
