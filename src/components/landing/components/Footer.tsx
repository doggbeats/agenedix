import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenSignup: () => void;
  onOpenTeamLogin: () => void;
  onOpenBookingDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenSignup,
  onOpenTeamLogin,
  onOpenBookingDemo
}) => {
  return (
    <footer className="bg-[#171513] text-[#a89f93] pt-16 pb-12 border-t border-[#292522]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4-column footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#292522]">
          
          {/* Brand info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-[#af7e56] text-white font-bold text-sm flex items-center justify-center tracking-wider">
                AO
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  Agendamento<span className="text-emerald-400">ON</span>
                </span>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-[#8c827a] leading-relaxed max-w-sm mb-6">
              A plataforma de agendamento online inteligente pensada para barbearias, clínicas, terapeutas e profissionais que atendem com hora marcada.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#b8afa3]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Todos os sistemas operando com 99.98% de estabilidade</span>
            </div>
          </div>

          {/* Links: Produto */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Produto
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#recursos" className="hover:text-white transition-colors">
                  Recursos do Sistema
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenBookingDemo}
                  className="hover:text-white transition-colors text-left"
                >
                  Página Pública (Demo)
                </button>
              </li>
              <li>
                <a href="#recursos" className="hover:text-white transition-colors">
                  Lembretes no WhatsApp
                </a>
              </li>
              <li>
                <a href="#recursos" className="hover:text-white transition-colors">
                  Cobrança de Sinal PIX
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-white transition-colors">
                  Tabela de Preços
                </a>
              </li>
            </ul>
          </div>

          {/* Links: Segmentos */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Segmentos
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#nichos" className="hover:text-white transition-colors">
                  Barbearias & Salões
                </a>
              </li>
              <li>
                <a href="#nichos" className="hover:text-white transition-colors">
                  Clínicas de Estética
                </a>
              </li>
              <li>
                <a href="#nichos" className="hover:text-white transition-colors">
                  Psicólogos & Terapeutas
                </a>
              </li>
              <li>
                <a href="#nichos" className="hover:text-white transition-colors">
                  Studios de Pilates & Personal
                </a>
              </li>
              <li>
                <a href="#nichos" className="hover:text-white transition-colors">
                  Consultórios Odontológicos
                </a>
              </li>
            </ul>
          </div>

          {/* Links: Acesso & Suporte */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Acesso
            </h5>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={onOpenTeamLogin}
                  className="hover:text-white transition-colors text-left flex items-center gap-1 font-semibold text-[#af7e56]"
                >
                  <span>→ Área da equipe (Login)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSignup}
                  className="hover:text-white transition-colors text-left"
                >
                  Criar conta grátis
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Central de Ajuda & FAQ
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/?text=Preciso%20de%20ajuda%20com%20o%20AgendamentoON"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Suporte via WhatsApp
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716c]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dados criptografados de ponta a ponta. 100% em conformidade com a LGPD.</span>
          </div>

          <div className="flex items-center gap-1">
            <span>Desenvolvido com excelência no Brasil</span>
            <Heart className="w-3 h-3 text-[#af7e56] fill-[#af7e56]" />
            <span>para impulsionar negócios locais.</span>
          </div>

          <div>
            © {new Date().getFullYear()} AgendamentoON Tecnologia Ltda. Todos os direitos reservados.
          </div>
        </div>

      </div>
    </footer>
  );
};
