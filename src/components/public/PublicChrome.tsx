import Link from "next/link";
import { LogIn } from "lucide-react";
import { Logo, buttonBrand } from "@/components/ui";
import { PublicMenu } from "@/components/public/PublicMenu";
import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

const navigation = [
  { href: "/#recursos", label: "Recursos" },
  { href: "/#planos", label: "Planos" },
  { href: "/agendar", label: "Agendas online" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label={`${APP_NAME} — início`}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Menu principal">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-paper hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-line" aria-hidden />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-paper hover:text-ink"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Área da equipe
          </Link>
          <Link href="/cadastro" className={`${buttonBrand} ml-1 px-3.5 py-2 text-[13px]`}>
            Criar conta
          </Link>
        </nav>
        <PublicMenu />
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper text-slate-600">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            Agenda online, página pública com a sua marca e gestão de equipe para negócios
            que atendem com hora marcada.
          </p>
          <p className="mt-4 text-xs font-medium text-slate-500">
            Feito para barbearias, salões, estúdios e consultórios.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Navegação
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/#recursos" className="hover:text-brand-hover">
                Recursos
              </Link>
            </li>
            <li>
              <Link href="/#planos" className="hover:text-brand-hover">
                Planos
              </Link>
            </li>
            <li>
              <Link href="/agendar" className="hover:text-brand-hover">
                Agendas online
              </Link>
            </li>
            <li>
              <Link href="/cadastro" className="font-semibold text-brand-hover hover:text-ink">
                Criar conta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Plataforma
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-brand-hover">
                Área da equipe
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className="hover:text-brand-hover">
                Privacidade e LGPD
              </Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-brand-hover">
                Termos de uso
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-xs leading-relaxed text-slate-500 sm:px-6">
        © {new Date().getFullYear()} {APP_NAME} · agendamento online · uma realização{" "}
        {COMPANY_NAME}.
      </div>
    </footer>
  );
}
