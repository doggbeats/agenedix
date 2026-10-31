import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X, LogIn } from 'lucide-react';

interface NavbarProps {
  onOpenSignup: () => void;
  onOpenTeamLogin: () => void;
  onOpenBookingDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSignup,
  onOpenTeamLogin,
  onOpenBookingDemo
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top micro banner */}
      <div className="bg-[#241f1c] text-[#f7f2eb] text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#af7e56] text-white text-[10px] font-semibold tracking-wider uppercase">
          Novidade
        </span>
        <span>Lembretes inteligentes de WhatsApp com confirmação em 1 clique já inclusos.</span>
        <button 
          onClick={onOpenBookingDemo}
          className="underline font-semibold hover:text-[#d7ad89] transition-colors ml-1 hidden sm:inline-flex items-center gap-1 cursor-pointer"
        >
          Ver demonstração interativa <ArrowRight className="w-3 h-3 inline" />
        </button>
      </div>

      {/* Main navigation */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#fbfaf8]/90 backdrop-blur-md border-b border-[#e7e1d8] shadow-xs py-3'
            : 'bg-[#fbfaf8] border-b border-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo matching the screenshot */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="AgendamentoON — página inicial">
            <div className="w-9 h-9 rounded-md bg-[#171513] text-white font-bold text-sm flex items-center justify-center tracking-wider shadow-xs group-hover:bg-[#af7e56] transition-colors">
              AO
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#171513]">
                  Agendamento<span className="text-emerald-600">ON</span>
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            <a
              href="#recursos"
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
            >
              Recursos
            </a>
            <a
              href="#nichos"
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
            >
              Segmentos
            </a>
            <a
              href="#planos"
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
            >
              Planos
            </a>
            <button
              onClick={onOpenBookingDemo}
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors flex items-center gap-1 cursor-pointer"
            >
              Agendas online
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
            <a
              href="#depoimentos"
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
            >
              Depoimentos
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-[#57534e] hover:text-[#1c1917] transition-colors"
            >
              Dúvidas
            </a>
          </nav>

          {/* Right Action buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <span className="h-5 w-[1px] bg-[#e7e1d8] mr-1"></span>
            <button
              onClick={onOpenTeamLogin}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#44403c] hover:text-[#171513] px-3 py-2 rounded-lg hover:bg-[#efece6] transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#78716c]" />
              <span>Área da equipe</span>
            </button>
            <button
              onClick={onOpenSignup}
              className="bg-[#af7e56] hover:bg-[#9d6d48] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              Criar conta
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#57534e] hover:bg-[#eeeae3] transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[#e7e1d8] bg-[#fbfaf8] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#44403c] hover:text-[#171513]"
            >
              Recursos
            </a>
            <a
              href="#nichos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#44403c] hover:text-[#171513]"
            >
              Segmentos
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#44403c] hover:text-[#171513]"
            >
              Planos & Preços
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBookingDemo();
              }}
              className="w-full text-left py-2 text-base font-medium text-[#44403c] hover:text-[#171513] flex items-center justify-between"
            >
              <span>Ver agendas online</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                Demo
              </span>
            </button>
            <a
              href="#depoimentos"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#44403c] hover:text-[#171513]"
            >
              Depoimentos
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-[#44403c] hover:text-[#171513]"
            >
              Perguntas Frequentes
            </a>

            <div className="pt-3 border-t border-[#e7e1d8] flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenTeamLogin();
                }}
                className="w-full py-2.5 text-center font-semibold text-[#44403c] bg-[#ede8e1] rounded-xl hover:bg-[#e4ded6] transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Área da equipe
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignup();
                }}
                className="w-full py-3 text-center font-bold text-white bg-[#af7e56] hover:bg-[#9d6d48] rounded-xl shadow-xs transition-colors"
              >
                Criar conta grátis
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
