-- SaaS core: roles, branding, units, exceptions, payments, notifications, auth tokens.
-- This migration is additive and preserves existing data.

-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
ALTER TYPE "AppointmentEventType" ADD VALUE IF NOT EXISTS 'EXPIRED';

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CREATED', 'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_RESCHEDULED', 'BOOKING_REMINDER', 'PAYMENT', 'SYSTEM');
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMPTZ(3);

-- AlterTable Establishment
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMPTZ(3);
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "holdMinutes" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "notifyBookingCreated" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "notifyBookingCancelled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "notifyBookingRescheduled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Establishment" ADD COLUMN IF NOT EXISTS "reminderHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable SubscriptionPlan
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "maxUnits" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "highlight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "trialDays" SET DEFAULT 7;

-- AlterTable Subscription
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "toleranceDays" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT;

-- AlterTable Professional
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "unitId" TEXT;

-- AlterTable Appointment
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "unitId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMPTZ(3);

-- CreateTable TenantBranding
CREATE TABLE "TenantBranding" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#B08D68',
    "secondaryColor" TEXT NOT NULL DEFAULT '#C4A484',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#0B0B0B',
    "buttonColor" TEXT NOT NULL DEFAULT '#0B0B0B',
    "fontFamily" TEXT NOT NULL DEFAULT 'sans',
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "coverUrl" TEXT,
    "gallery" JSONB,
    "instagram" TEXT,
    "facebook" TEXT,
    "website" TEXT,
    "tagline" TEXT,
    "showTeam" BOOLEAN NOT NULL DEFAULT true,
    "showServices" BOOLEAN NOT NULL DEFAULT true,
    "showGallery" BOOLEAN NOT NULL DEFAULT true,
    "showHours" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "TenantBranding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TenantBranding_establishmentId_key" ON "TenantBranding"("establishmentId");
ALTER TABLE "TenantBranding" ADD CONSTRAINT "TenantBranding_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Unit
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Unit_establishmentId_active_idx" ON "Unit"("establishmentId", "active");
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ScheduleException
CREATE TABLE "ScheduleException" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "professionalId" TEXT,
    "date" DATE NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT true,
    "openMinute" INTEGER,
    "closeMinute" INTEGER,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScheduleException_establishmentId_date_idx" ON "ScheduleException"("establishmentId", "date");
CREATE INDEX "ScheduleException_professionalId_date_idx" ON "ScheduleException"("professionalId", "date");
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleException" ADD CONSTRAINT "ScheduleException_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "providerPaymentId" TEXT,
    "providerEventId" TEXT,
    "method" TEXT,
    "paidAt" TIMESTAMPTZ(3),
    "periodStart" TIMESTAMPTZ(3),
    "periodEnd" TIMESTAMPTZ(3),
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
CREATE UNIQUE INDEX "Payment_providerEventId_key" ON "Payment"("providerEventId");
CREATE INDEX "Payment_establishmentId_createdAt_idx" ON "Payment"("establishmentId", "createdAt");
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_establishmentId_createdAt_idx" ON "Notification"("establishmentId", "createdAt");
CREATE INDEX "Notification_appointmentId_type_idx" ON "Notification"("appointmentId", "type");
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable EmailVerificationToken
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey Professional.unitId
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Professional_unitId_idx" ON "Professional"("unitId");

-- AddForeignKey Appointment.unitId
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Appointment_unitId_startAt_idx" ON "Appointment"("unitId", "startAt");
CREATE INDEX "Appointment_status_holdExpiresAt_idx" ON "Appointment"("status", "holdExpiresAt");
