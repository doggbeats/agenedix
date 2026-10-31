import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { SignupForm, type SignupPlanOption } from "@/components/auth/SignupForm";
import { Logo } from "@/components/ui";
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
    <main className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex rounded-md">
            <Logo />
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 transition hover:text-ink"
          >
            Já tem conta? Entrar
          </Link>
        </div>

        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-hover">
              Comece por aqui
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Crie sua conta
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cadastre seu estabelecimento e defina o e-mail e a senha que usará para entrar no sistema.
            </p>
          </div>
          <SignupForm plans={plans} selectedSlug={selectedSlug} />
        </section>
      </div>
    </main>
  );
}
