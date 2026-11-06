import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length >= 4 ? value.trim() : fallback;
}

function secret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < 8) {
    throw new Error(
      `Defina ${name} no .env.local com uma senha de pelo menos 8 caracteres antes de rodar o script.`,
    );
  }
  return value;
}

const ROUNDS = 10;

async function main() {
  const email = env("SEED_ADMIN_EMAIL", "admin.1973@agendix.app");
  const password = secret("SEED_ADMIN_PASSWORD");
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
  console.log("  Senha:  (definida pela variável SEED_ADMIN_PASSWORD)");
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
