"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui";

interface NavbarProps {
  onOpenSignup: () => void;
  onOpenTeamLogin: () => void;
  onOpenBookingDemo: () => void;
}

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#segmentos", label: "Segmentos" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "Dúvidas" },
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSignup,
  onOpenTeamLogin,
  onOpenBookingDemo,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md transition-shadow ${
        isScrolled ? "border-line shadow-[0_1px_16px_rgba(11,18,32,0.05)]" : "border-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="AgendamentoON — página inicial" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Menu principal">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onOpenBookingDemo}
            className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
          >
            Agendas online
          </button>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={onOpenTeamLogin}
            className="rounded-[10px] px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-paper"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={onOpenSignup}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1b2638]"
          >
            Começar teste
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink transition hover:bg-paper lg:hidden"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Menu móvel">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-line/70 py-3 text-sm font-medium text-ink last:border-0"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBookingDemo();
              }}
              className="border-b border-line/70 py-3 text-left text-sm font-medium text-ink"
            >
              Agendas online
            </button>
            <div className="mt-4 grid gap-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTeamLogin();
                }}
                className="rounded-[10px] border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
              >
                Entrar na minha conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignup();
                }}
                className="rounded-[10px] bg-brand px-4 py-3 text-sm font-semibold text-white"
              >
                Começar teste de 7 dias
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
