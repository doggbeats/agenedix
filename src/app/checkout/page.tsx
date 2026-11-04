import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { isSubscriptionUsable } from "@/lib/subscription";
import { toNumber } from "@/lib/format";
import { getPagarmeConfig } from "@/lib/payments/pagarme";
import { SUPPORT_WHATSAPP } from "@/lib/public-config";
import { Logo } from "@/components/ui";
import {
  CheckoutClient,
  type CheckoutPlan,
  type PixData,
} from "@/components/checkout/CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pagamento do plano" };

function readPix(metadata: unknown): PixData | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const record = metadata as Record<string, unknown>;
  const qrCode = typeof record.qrCode === "string" ? record.qrCode : null;
  if (!qrCode) return null;
  return {
    paymentId: typeof record.paymentId === "string" ? record.paymentId : "",
    qrCode,
    qrCodeUrl: typeof record.qrCodeUrl === "string" ? record.qrCodeUrl : null,
    expiresAt: typeof record.expiresAt === "string" ? record.expiresAt : null,
    amount: typeof record.amount === "number" ? record.amount : 0,
  };
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string; troca?: string }>;
}) {
  const { plano, troca } = await searchParams;
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (!auth.establishment) redirect("/login?erro=sem-estabelecimento");

  const establishment = auth.establishment;
  const subscription = await prisma.subscription.findUnique({
    where: { establishmentId: establishment.id },
    include: { plan: true },
  });
  const usable = isSubscriptionUsable(subscription);
  // Só é possível trocar de plano direto no gateway quando a assinatura já é
  // cobrada pelo Pagar.me. Assinaturas manuais continuam sendo tratadas pelo
  // suporte para não perderem o acesso durante a migração.
  const canSelfChange =
    subscription?.provider === "PAGARME" && Boolean(subscription.providerSubscriptionId);
  const changing = troca === "1" && usable && canSelfChange;

  if (usable && !changing) {
    redirect(troca === "1" ? "/painel/plano?aviso=cobranca-manual" : "/painel");
  }

  if (auth.role !== "OWNER") {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm">
          <Logo />
          <h1 className="mt-5 text-xl font-semibold text-ink">Pagamento pendente</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            O plano de <strong>{establishment.name}</strong> precisa ser regularizado pelo
            responsável da conta. Peça para o proprietário acessar o painel e concluir o
            pagamento.
          </p>
          <form action={logoutAction} className="mt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-ink"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </form>
        </div>
      </main>
    );
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: { active: true, isDemo: false },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
  });

  const catalog: CheckoutPlan[] = plans.map((plan) => ({
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? "",
    priceMonthly: toNumber(plan.priceMonthly),
    trialDays: plan.trialDays,
    highlight: plan.highlight,
    maxProfessionals: plan.maxProfessionals,
    maxServices: plan.maxServices,
  }));

  const selectedSlug =
    plano && catalog.some((plan) => plan.slug === plano)
      ? plano
      : subscription?.plan.slug ?? catalog.find((plan) => plan.highlight)?.slug ?? catalog[0]?.slug;

  const pendingPayment = await prisma.payment.findFirst({
    where: {
      establishmentId: establishment.id,
      provider: "PAGARME",
      method: "pix",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
  const pendingPix = pendingPayment
    ? (() => {
        const data = readPix(pendingPayment.metadata);
        return data
          ? {
              ...data,
              paymentId: pendingPayment.providerPaymentId ?? pendingPayment.id,
              amount: toNumber(pendingPayment.amount),
            }
          : null;
      })()
    : null;

  const config = getPagarmeConfig();
  const devBypass =
    process.env.NODE_ENV !== "production" &&
    process.env.PAYMENTS_DEV_BYPASS === "true";

  return (
    <main className="min-h-screen bg-paper px-4 py-8 text-ink sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex rounded-md">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Ambiente seguro
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-ink"
              >
                <LogOut className="h-3.5 w-3.5" /> Sair
              </button>
            </form>
          </div>
        </div>

        <CheckoutClient
          mode={changing ? "change" : "start"}
          plans={catalog}
          initialPlanSlug={selectedSlug}
          currentPlanSlug={subscription?.plan.slug ?? null}
          establishmentName={establishment.name}
          responsibleName={auth.user.name}
          responsibleEmail={auth.user.email}
          supportWhatsApp={SUPPORT_WHATSAPP}
          configured={config.configured}
          publicKey={config.publicKey}
          devBypass={devBypass}
          pendingPix={pendingPix}
        />
      </div>
    </main>
  );
}
