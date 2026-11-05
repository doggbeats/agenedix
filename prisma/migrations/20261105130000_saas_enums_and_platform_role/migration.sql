-- Enums e coluna usados pelo schema atual, mas que nunca foram migrados.
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT');

CREATE TYPE "SubscriptionEventType" AS ENUM (
  'CREATED',
  'PLAN_CHANGED',
  'STATUS_CHANGED',
  'RENEWED',
  'CANCELED',
  'REACTIVATED',
  'COURTESY_GRANTED',
  'SUSPENDED',
  'PAYMENT_RECEIVED'
);

ALTER TYPE "PaymentStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELED';

ALTER TABLE "User" ADD COLUMN "platformRole" "PlatformRole";

CREATE INDEX "User_platformRole_idx" ON "User"("platformRole");
