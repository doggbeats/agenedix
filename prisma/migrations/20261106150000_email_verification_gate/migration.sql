-- Contas criadas antes desta regra continuam com acesso, mas recebem aviso
-- para confirmar o e-mail. Novas contas nascem sem isenção e só entram no
-- painel depois de clicar no link de confirmação.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationExempt" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerificationExempt" = true;
