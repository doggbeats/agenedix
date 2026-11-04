-- Horário só volta para a agenda pública depois que o atendimento termina
-- (COMPLETED/NO_SHOW) e o proprietário libera o horário explicitamente.
ALTER TABLE "Appointment" ADD COLUMN "releasedAt" TIMESTAMPTZ(3);
