import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length >= 4 ? value.trim() : fallback;
}

const ROUNDS = 10;

async function main() {
  const email = env("SEED_ADMIN_EMAIL", "admin@agendix.app");
  const password = env("SEED_ADMIN_PASSWORD", "Admin@2026");
  const name = env("SEED_ADMIN_NAME", "Administrador da plataforma");

  const passwordHash = await bcrypt.hash(password, ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      passwordHash,
      isPlatformAdmin: true,
    },
    update: {
      name,
      passwordHash,
      isPlatformAdmin: true,
    },
  });

  console.log("Administrador de plataforma criado/atualizado:");
  console.log(`  E-mail: ${user.email}`);
  console.log(`  Senha:  ${password}`);
  console.log("Acesse /login e depois /admin.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
