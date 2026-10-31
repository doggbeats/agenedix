import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public/PublicChrome";
import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Termos de uso
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Última atualização: outubro de 2026. Ao utilizar a plataforma {APP_NAME} ou uma
          página pública de agendamento, você concorda com estes termos.
        </p>

        <div className="mt-10 space-y-8 border-t border-line pt-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-ink">1. O serviço</h2>
            <p className="mt-2">
              A {APP_NAME} é uma plataforma de agenda online operada pela {COMPANY_NAME}.
              Cada estabelecimento cadastrado mantém uma página pública de agendamento e um
              painel de gestão de agenda, serviços, profissionais, clientes e equipe. A
              plataforma não realiza pagamentos de atendimentos, não processa cartões e não
              envia mensagens automáticas em nome do estabelecimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">2. Agendamentos</h2>
            <p className="mt-2">
              O horário escolhido é validado no servidor no momento da reserva. A confirmação
              pode ser automática ou depender da equipe, conforme a configuração da agenda. O
              comprovante exibido após a reserva registra a solicitação, mas não substitui a
              confirmação e as orientações do estabelecimento.
            </p>
            <p className="mt-2">
              Ao reservar, você se compromete a informar dados corretos e a comparecer no
              horário escolhido. Se precisar alterar o atendimento, siga as orientações da
              página de confirmação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">3. Cancelamentos e remarcações</h2>
            <p className="mt-2">
              Cancelamentos e remarcações seguem o prazo configurado pelo estabelecimento e
              informado na página de agendamento. Fora desse prazo, o contato deve ser feito
              diretamente pelo WhatsApp ou telefone informado na página.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">4. Preços e pagamento</h2>
            <p className="mt-2">
              Os preços e a duração dos serviços são definidos pelo estabelecimento e
              exibidos na página de agendamento. O pagamento do atendimento é realizado
              diretamente ao estabelecimento. Nenhum valor de serviço é cobrado ou processado
              pela plataforma.
            </p>
            <p className="mt-2">
              A assinatura da {APP_NAME} é contratada pelo estabelecimento e cobrada conforme
              o plano escolhido, após o período de teste. Os valores e limites de cada plano
              estão descritos na página de planos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">5. Uso do painel</h2>
            <p className="mt-2">
              O acesso ao painel é restrito à equipe de cada estabelecimento. Cada usuário
              deve manter suas credenciais em sigilo e informar imediatamente qualquer uso
              não autorizado. É proibido tentar contornar o acesso restrito, automatizar
              acessos abusivos ou utilizar o sistema para fins ilícitos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">6. WhatsApp e e-mail</h2>
            <p className="mt-2">
              Os botões de WhatsApp abrem uma conversa com uma mensagem pré-preenchida. O
              envio depende de o usuário confirmar no aplicativo. A {APP_NAME} não garante
              entrega, leitura ou resposta, e não se responsabiliza por bloqueios ou
              restrições impostos pelo WhatsApp. E-mails de confirmação e lembrete dependem
              das preferências configuradas pelo estabelecimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">7. Disponibilidade</h2>
            <p className="mt-2">
              Trabalhamos para manter a plataforma disponível, mas podem ocorrer manutenções,
              falhas de infraestrutura ou indisponibilidades de terceiros. Não há garantia de
              funcionamento ininterrupto. Em situações críticas, use o telefone ou WhatsApp
              do estabelecimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">8. Privacidade</h2>
            <p className="mt-2">
              O tratamento de dados pessoais segue a Política de Privacidade e a LGPD. Cada
              estabelecimento, na condição de controlador dos dados dos seus clientes, deve
              usar as informações apenas para finalidades legítimas relacionadas ao
              atendimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">9. Contato</h2>
            <p className="mt-2">
              Dúvidas sobre estes termos podem ser encaminhadas ao suporte da {APP_NAME}. Para
              assuntos do atendimento, fale diretamente com o estabelecimento pelos canais
              divulgados na página pública.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
