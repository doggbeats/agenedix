import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm, type SignupPlanOption } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Criar conta" };
export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const { plano: planSlug } = await searchParams;
  const rows = await prisma.subscriptionPlan.findMany({
    where: { active: true, isDemo: false },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
    select: {
      slug: true,
      name: true,
      description: true,
      priceMonthly: true,
      trialDays: true,
      highlight: true,
    },
  });

  const plans: SignupPlanOption[] = rows.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: toNumber(plan.priceMonthly),
    trialDays: plan.trialDays,
    highlight: plan.highlight,
  }));

  const selectedSlug = planSlug && plans.some((plan) => plan.slug === planSlug)
    ? planSlug
    : plans.find((plan) => plan.highlight)?.slug ?? plans[0]?.slug;

  return (
    <AuthShell
      eyebrow="Criar conta"
      title="Comece pelo seu estabelecimento"
      description="Escolha o plano, informe os dados do negócio e defina o acesso do responsável. O pagamento é a última etapa, depois do cadastro."
      topRight={
        <span>
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-ink underline underline-offset-2 hover:text-brand-hover"
          >
            Entrar
          </Link>
        </span>
      }
      wide
    >
      <SignupForm plans={plans} selectedSlug={selectedSlug} />
    </AuthShell>
  );
}
