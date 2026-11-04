import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui";

const highlights = [
  "Página pública com a sua marca e link próprio",
  "Agenda por profissional, com jornada, pausas e bloqueios",
  "Acesso separado para proprietário, administração e equipe",
];

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  topRight,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  topRight?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-ink lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden
          className="paper-grid pointer-events-none absolute inset-0 opacity-[0.07]"
        />

        <div className="relative">
          <Link href="/" aria-label="AgendamentoON — página inicial" className="inline-flex">
            <Logo dark />
          </Link>

          <p className="mt-16 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
            Área do estabelecimento
          </p>
          <h2 className="display-title mt-4 max-w-[15ch] text-3xl text-white xl:text-[38px]">
            A rotina do seu negócio, organizada.
          </h2>

          <ul className="mt-8 max-w-sm space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-white/65">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] leading-relaxed text-white/35">
          AgendamentoON · agenda online para negócios que atendem com hora marcada.
        </p>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-7 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="AgendamentoON — página inicial"
            className="inline-flex lg:hidden"
          >
            <Logo />
          </Link>
          <div className="ml-auto text-[13px] text-muted">{topRight}</div>
        </div>

        <div
          className={`mx-auto flex w-full flex-1 flex-col justify-center py-10 ${
            wide ? "max-w-2xl" : "max-w-[420px]"
          }`}
        >
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="display-title mt-4 text-[30px] leading-tight text-ink sm:text-[34px]">
            {title}
          </h1>
          <div className="mt-3 text-sm leading-relaxed text-muted">{description}</div>

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
