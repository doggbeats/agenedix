import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public/PublicChrome";
import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Legal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Política de privacidade e LGPD
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Última atualização: outubro de 2026. Este documento explica como a{" "}
          {APP_NAME} trata dados pessoais na plataforma de agendamento.
        </p>

        <div className="mt-10 space-y-8 border-t border-line pt-8 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-ink">1. Papéis no tratamento</h2>
            <p className="mt-2">
              Cada estabelecimento cadastrado na {APP_NAME} é o controlador dos dados dos
              seus próprios clientes. A {COMPANY_NAME} opera a infraestrutura da plataforma
              e atua como operadora, seguindo as instruções do estabelecimento e as
              finalidades descritas nesta política.
            </p>
            <p className="mt-2">
              Ao agendar por uma página pública, o estabelecimento escolhido é o responsável
              pelo atendimento, pelos preços e pelas informações sobre o serviço. A{" "}
              {APP_NAME} não interfere na relação comercial entre você e o estabelecimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">2. Dados coletados</h2>
            <p className="mt-2">
              Para viabilizar o agendamento, coletamos os dados informados por você: nome,
              telefone/WhatsApp, e-mail (opcional), observações (opcional) e o serviço,
              profissional, data e horário escolhidos. Também registramos metadados técnicos
              de segurança, como endereço IP e agente do navegador, em logs de acesso e
              auditoria.
            </p>
            <p className="mt-2">
              Não solicitamos CPF, dados de cartão, localização precisa ou dados sensíveis
              para realizar um agendamento. O pagamento do serviço é feito diretamente ao
              estabelecimento, fora da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">3. Para que usamos</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Criar, confirmar, remarcar ou cancelar o seu agendamento.</li>
              <li>Permitir que o estabelecimento entre em contato sobre o atendimento.</li>
              <li>Enviar confirmações e lembretes por e-mail quando habilitados.</li>
              <li>Prevenir fraudes, abusos e conflitos de agenda.</li>
              <li>Cumprir obrigações legais e exercer direitos em processos.</li>
              <li>Manter registros de auditoria e segurança do sistema.</li>
            </ul>
            <p className="mt-2">
              A base legal é a execução de contrato ou procedimentos preliminares (art. 7º,
              V, da LGPD), o legítimo interesse para segurança (art. 7º, IX) e o
              consentimento para o contato e para o envio de informações do agendamento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">4. Compartilhamento</h2>
            <p className="mt-2">
              Os dados do agendamento ficam disponíveis para o estabelecimento escolhido e
              para os profissionais autorizados por ele. Não vendemos dados pessoais. O
              compartilhamento com prestadores de infraestrutura ocorre apenas no necessário
              para operar o sistema, com obrigações de confidencialidade e segurança.
            </p>
            <p className="mt-2">
              Os links de WhatsApp abrem o aplicativo ou site do WhatsApp. Ao usá-los, você
              passa a estar sujeito às políticas do WhatsApp/Meta, que não são controladas
              pelo estabelecimento nem pela {APP_NAME}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">5. Retenção e exclusão</h2>
            <p className="mt-2">
              Os dados são mantidos enquanto necessários para o atendimento e para o
              cumprimento de obrigações legais. O estabelecimento pode anonimizar o cadastro
              de um cliente no painel. A anonimização remove nome, telefone, e-mail e
              observações, preservando apenas o histórico estatístico do atendimento sem
              identificar a pessoa.
            </p>
            <p className="mt-2">
              Para solicitar acesso, correção, portabilidade ou eliminação dos seus dados,
              fale com o estabelecimento pelo WhatsApp ou telefone informado na página
              pública. Se o pedido envolver a infraestrutura da plataforma, o
              estabelecimento pode acionar o suporte da {APP_NAME}.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">6. Segurança</h2>
            <p className="mt-2">
              Usamos sessões com cookies HttpOnly, senhas armazenadas com hash bcrypt, escopo
              de acesso restrito à equipe de cada estabelecimento, validação de dados no
              servidor e registros de auditoria. Nenhum sistema é totalmente imune a
              incidentes; em caso de incidente relevante, adotaremos as medidas de contenção
              e comunicação previstas na LGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">7. Cookies</h2>
            <p className="mt-2">
              Usamos apenas cookies essenciais para a sessão da equipe e para manter o
              estabelecimento ativo no painel. Não usamos cookies de publicidade nem
              rastreadores de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">8. Direitos do titular</h2>
            <p className="mt-2">
              Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso,
              correção, anonimização, bloqueio, eliminação, portabilidade e informação sobre
              compartilhamentos. Também pode revogar o consentimento quando essa for a base
              legal aplicável. Responderemos dentro dos prazos legais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">9. Contato</h2>
            <p className="mt-2">
              Para exercer direitos ou tirar dúvidas sobre esta política, fale com o
              estabelecimento pelo WhatsApp ou telefone divulgado na página pública. Para
              questões técnicas da plataforma, o contato é o suporte da {APP_NAME}.
            </p>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
