-- Cache dos planos criados no Pagar.me para cada plano local.
-- Sem esses IDs, cada checkout criaria um plano duplicado no gateway.

ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "providerPlanIdMonthly" TEXT;
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS "providerPlanIdYearly" TEXT;
