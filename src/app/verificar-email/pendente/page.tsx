import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MailWarning, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert, buttonPrimary, buttonSecondary } from "@/components/ui";
import { getAuthContext } from "@/lib/auth/session";
import { isPlatformAdminUser } from "@/lib/auth/platform-admin";
import { logoutAction, resendEmailVerificationAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { isSubscriptionUsable } from "@/lib/subscription";

export const metadata: Metadata = { title: "Confirme seu e-mail" };
export const dynamic = "force-dynamic";

export default async function PendingEmailVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; novo?: string }>;
}) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login");
  if (isPlatformAdminUser(auth.user)) redirect("/admin");
  if (auth.user.emailVerifiedAt) {
    redirect(auth.activeMembership ? "/painel" : "/login?erro=sem-estabelecimento");
  }

  const query = await searchParams;
  const exempt = auth.user.emailVerificationExempt;

  const subscription = auth.establishment
    ? await prisma.subscription.findUnique({
        where: { establishmentId: auth.establishment.id },
        select: {
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          toleranceDays: true,
          plan: { select: { slug: true } },
        },
      })
    : null;

  const checkoutHref =
    subscription && !isSubscriptionUsable(subscription)
      ? `/checkout?plano=${encodeURIComponent(subscription.plan.slug)}`
      : null;

  const feedback = query.erro
    ? { tone: "error" as const, message: query.erro }
    : query.ok
      ? { tone: "success" as const, message: query.ok }
      : query.novo
        ? {
            tone: "success" as const,
            message: "Conta criada. Confirme seu e-mail para liberar o acesso ao painel.",
          }
        : null;

  return (
    <AuthShell
      eyebrow="Verificação de e-mail"
      title="Confirme seu e-mail"
      description={
        <>
          Enviamos um link de confirmação para <strong>{auth.user.email}</strong>. O acesso
          ao painel é liberado depois que você abrir esse link.
        </>
      }
      topRight={<span className="break-all">{auth.user.email}</span>}
    >
      <div className="space-y-5">
        {feedback && <Alert tone={feedback.tone}>{feedback.message}</Alert>}

        <div className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
              <MailWarning className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Não recebeu o e-mail?</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Verifique a caixa de spam ou confirme se o endereço está correto. Você pode
                pedir um novo link abaixo.
              </p>
            </div>
          </div>

          <form action={resendEmailVerificationAction} className="mt-4">
            <button type="submit" className={`${buttonPrimary} w-full`}>
              Reenviar link de confirmação
            </button>
          </form>

          {checkoutHref && (
            <Link
              href={checkoutHref}
              className={`${buttonSecondary} mt-2 w-full justify-center`}
            >
              Ir para o pagamento do plano
            </Link>
          )}

          {exempt && (
            <Link
              href="/painel"
              className={`${buttonSecondary} mt-2 w-full justify-center`}
            >
              Continuar para o painel
            </Link>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {exempt
            ? "Sua conta foi criada antes da confirmação obrigatória. Você pode continuar usando o painel, mas confirmar o e-mail mantém o acesso mais seguro."
            : "Por segurança, contas novas só entram no painel depois de confirmar o e-mail. O link expira em 24 horas."}
        </div>

        <form action={logoutAction} className="text-center">
          <button
            type="submit"
            className="text-[12px] font-semibold text-slate-500 underline underline-offset-2 hover:text-ink"
          >
            Sair e entrar com outra conta
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
