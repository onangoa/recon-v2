import bcrypt from 'bcryptjs';
import { PrismaClient } from '../prisma/generated/client';

const prisma = new PrismaClient();

async function hashExistingPasswords() {
  console.log('Checking for plaintext passwords...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    const isAlreadyHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    if (!isAlreadyHashed) {
      console.log(`Hashing password for user: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else {
      console.log(`Password already hashed for: ${user.email}`);
    }
  }

  console.log('Done hashing passwords.');
  await prisma.$disconnect();
}

hashExistingPasswords().catch((e) => {
  console.error(e);
  process.exit(1);
});