import React from "react";
import Link from "next/link";
import { supportWhatsAppUrl } from "@/lib/public-config";
import { Logo } from "@/components/ui";

interface FooterProps {
  onOpenSignup: () => void;
  onOpenTeamLogin: () => void;
  onOpenBookingDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenSignup,
  onOpenTeamLogin,
  onOpenBookingDemo,
}) => {
  const supportUrl = supportWhatsAppUrl("Olá! Preciso de ajuda com o AgendamentoON.");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="AgendamentoON — página inicial" className="inline-flex">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
              Agenda online, página pública com a sua marca e gestão de equipe para
              negócios que atendem com hora marcada.
            </p>
          </div>

          <nav aria-label="Produto">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
              Produto
            </h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li>
                <a href="#recursos" className="transition-colors hover:text-ink">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="transition-colors hover:text-ink">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="#cenarios" className="transition-colors hover:text-ink">
                  Cenários de uso
                </a>
              </li>
              <li>
                <a href="#planos" className="transition-colors hover:text-ink">
                  Planos
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenBookingDemo}
                  className="text-left transition-colors hover:text-ink"
                >
                  Agendas online
                </button>
              </li>
            </ul>
          </nav>

          <nav aria-label="Acesso">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
              Acesso
            </h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li>
                <button
                  type="button"
                  onClick={onOpenTeamLogin}
                  className="text-left transition-colors hover:text-ink"
                >
                  Entrar na conta
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSignup}
                  className="text-left transition-colors hover:text-ink"
                >
                  Criar conta
                </button>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-ink">
                  Perguntas frequentes
                </a>
              </li>
              {supportUrl && (
                <li>
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    Suporte
                  </a>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
              Legal
            </h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-muted">
              <li>
                <Link href="/termos" className="transition-colors hover:text-ink">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors hover:text-ink">
                  Política de privacidade
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} AgendamentoON. Todos os direitos reservados.
          </p>
          <p>Feito para negócios que atendem com hora marcada.</p>
        </div>
      </div>
    </footer>
  );
};
