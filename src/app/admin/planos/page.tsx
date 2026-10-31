import type { Metadata } from "next";
import {
  CreditCard,
  FlaskConical,
  Layers,
  Plus,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { planFeatures } from "@/lib/subscription";
import { togglePlanActiveAction } from "@/lib/actions/admin";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { AdminPlanForm } from "@/components/platform/AdminPlanForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Planos" };

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  await requirePlatformAdmin();
  const params = await searchParams;

  const plans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { subscriptions: true } } },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }, { name: "asc" }],
  });

  const activePlans = plans.filter((plan) => plan.active && !plan.isDemo);

  return (
    <div>
      <PageHeader
        eyebrow="Plataforma"
        title="Planos"
        description="Preços, limites e recursos exibidos no cadastro. A cobrança é registrada manualmente, sem gateway simulado."
      />

      {(params.ok || params.erro) && (
        <div
          className={`mb-5 rounded-lg border px-3.5 py-3 text-sm ${
            params.erro
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-900"
          }`}
        >
          {params.erro ?? params.ok}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Layers,
            label: "Planos cadastrados",
            value: plans.length,
            hint: `${activePlans.length} disponíveis no site`,
          },
          {
            icon: CreditCard,
            label: "Assinaturas vinculadas",
            value: plans.reduce((sum, plan) => sum + plan._count.subscriptions, 0),
            hint: "Inclui teste e planos inativos",
          },
          {
            icon: Users,
            label: "Recursos",
            value: plans.reduce((sum, plan) => sum + planFeatures(plan).length, 0),
            hint: "Itens descritos nos planos",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
              <item.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {item.label}
              </p>
              <p className="text-xl font-semibold text-ink">{item.value}</p>
              <p className="text-[10px] text-slate-500">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <details className="mb-5 rounded-xl border border-line bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-ink sm:px-5">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4 text-brand" /> Novo plano
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            Abrir formulário
          </span>
        </summary>
        <div className="border-t border-line p-4 sm:p-5">
          <AdminPlanForm mode="create" />
        </div>
      </details>

      {plans.length === 0 ? (
        <EmptyState
          title="Nenhum plano cadastrado"
          description="Crie o primeiro plano para liberar o cadastro de estabelecimentos."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => {
            const features = planFeatures(plan);
            return (
              <article
                key={plan.id}
                className="rounded-xl border border-line bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-ink">{plan.name}</h2>
                      {plan.active ? (
                        <Badge tone="success">Ativo</Badge>
                      ) : (
                        <Badge tone="neutral">Inativo</Badge>
                      )}
                      {plan.isDemo && (
                        <Badge tone="warn">
                          <FlaskConical className="mr-1 h-3 w-3" /> Demonstração
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">{plan.slug}</p>
                    {plan.description && (
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xl font-semibold text-ink">
                      {formatCurrency(plan.priceMonthly)}
                      <span className="text-xs font-normal text-slate-500">/mês</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatCurrency(plan.priceYearly)}/ano
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 px-4 py-4 text-xs sm:grid-cols-2 sm:px-5">
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-700">Limites</p>
                    <p className="text-slate-500">
                      {plan.maxProfessionals} profissional(is) · {plan.maxServices} serviço(s)
                    </p>
                    <p className="text-slate-500">
                      {plan.maxAppointmentsMonth
                        ? `${plan.maxAppointmentsMonth} agendamentos/mês`
                        : "Agendamentos ilimitados"}
                    </p>
                    <p className="text-slate-500">
                      Teste de {plan.trialDays} dia(s) · {plan._count.subscriptions}{" "}
                      assinatura(s)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Recursos exibidos</p>
                    {features.length === 0 ? (
                      <p className="mt-2 text-slate-500">Nenhum recurso cadastrado.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5 text-slate-600">
                        {features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="border-t border-line px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <form action={togglePlanActiveAction}>
                      <input type="hidden" name="id" value={plan.id} />
                      <ConfirmButton
                        confirmMessage={
                          plan.active
                            ? "Desativar este plano? Ele deixa de aparecer no site, mas as assinaturas existentes continuam vinculadas."
                            : "Ativar este plano? Ele volta a aparecer no site e no cadastro."
                        }
                        className={
                          plan.active
                            ? "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                            : "inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-green-700 hover:bg-green-50"
                        }
                      >
                        {plan.active ? "Desativar" : "Ativar"}
                      </ConfirmButton>
                    </form>
                    <details className="w-full border-t border-line pt-3 sm:w-auto sm:border-0 sm:pt-0">
                      <summary className="cursor-pointer text-[11px] font-semibold text-slate-600 hover:text-brand">
                        Editar plano
                      </summary>
                      <div className="mt-3 w-full min-w-0 sm:w-[min(42rem,calc(100vw-6rem))]">
                        <AdminPlanForm
                          mode="update"
                          plan={{
                            id: plan.id,
                            name: plan.name,
                            slug: plan.slug,
                            description: plan.description ?? "",
                            priceMonthly: String(plan.priceMonthly),
                            priceYearly: String(plan.priceYearly),
                            maxProfessionals: String(plan.maxProfessionals),
                            maxServices: String(plan.maxServices),
                            maxAppointmentsMonth: plan.maxAppointmentsMonth
                              ? String(plan.maxAppointmentsMonth)
                              : "",
                            trialDays: String(plan.trialDays),
                            features: features.join("\n"),
                            active: plan.active,
                            isDemo: plan.isDemo,
                          }}
                        />
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-white p-4 text-xs leading-relaxed text-slate-500">
        <p className="font-semibold text-slate-700">Sobre a cobrança</p>
        <p className="mt-1">
          As assinaturas são processadas pelo Pagar.me via Pix ou cartão de crédito. O webhook
          do gateway atualiza o status automaticamente; o registro manual em Estabelecimentos
          serve para casos excepcionais, como cortesia ou ajuste de suporte.
          Os limites de profissionais, serviços e agendamentos por mês são aplicados pelo
          servidor.
        </p>
      </div>
    </div>
  );
}
