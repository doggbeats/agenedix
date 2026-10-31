import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { planFeatures } from "@/lib/subscription";
import { toNumber } from "@/lib/format";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import LandingPage from "@/components/landing/LandingPage";
import type { PricingPlan } from "@/components/landing/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Agenda online, página pública com a sua marca e gestão de equipe para barbearias, salões e estúdios. Teste por 7 dias.",
};

export default async function HomePage() {
  let plans: PricingPlan[] | undefined;

  try {
    const rows = await prisma.subscriptionPlan.findMany({
      where: { active: true, isDemo: false },
      orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
    });

    plans = rows.map((plan, index) => {
      const priceMonthly = toNumber(plan.priceMonthly);
      const priceYearly = toNumber(plan.priceYearly);
      const priceAnnual = priceYearly > 0 ? priceYearly / 12 : priceMonthly;

      return {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        badge: index === 1 ? "Mais escolhido" : undefined,
        isPopular: index === 1,
        priceMonthly,
        priceAnnual,
        description: plan.description ?? "",
        features: planFeatures(plan),
        ctaText: `Começar teste de ${plan.trialDays} dias`,
        trialDays: plan.trialDays,
      };
    });
  } catch (error) {
    // A landing page continua no ar mesmo se o banco estiver indisponível.
    console.error("Não foi possível carregar os planos da página inicial.", error);
  }

  return <LandingPage plans={plans} />;
}
