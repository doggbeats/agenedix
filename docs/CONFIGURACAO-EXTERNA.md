# Configuração externa

O Agendix funciona localmente apenas com PostgreSQL. E-mail, webhook de pagamentos e cron de lembretes são opcionais e ficam desativados com segurança quando não configurados. A URL pública e o WhatsApp de suporte são configuráveis.

## Variáveis de ambiente

| Variável | Obrigatória | Escopo | Uso |
| --- | --- | --- | --- |
| `DATABASE_URL` | Sim | Servidor | Conexão PostgreSQL usada pelo Prisma |
| `NEXT_PUBLIC_APP_URL` | Recomendada | Público/servidor | URL canônica usada em links de confirmação, e-mails, `.ics` e compartilhamentos |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | Opcional | Público | WhatsApp de suporte da plataforma, somente dígitos com DDI; oculta os botões quando vazio |
| `RESEND_API_KEY` | Opcional | Servidor | Chave da Resend para envio de e-mail transacional |
| `EMAIL_FROM` | Opcional | Servidor | Remetente verificado, por exemplo `Agendix <nao-responda@agendix.app>` |
| `PAYMENT_WEBHOOK_SECRET` | Opcional | Servidor | Segredo HMAC do webhook de pagamentos |
| `CRON_SECRET` | Opcional | Servidor | Segredo que protege a rota de cron de lembretes |
| `SEED_ADMIN_EMAIL` | Opcional | Seed | E-mail do superadmin de demonstração |
| `SEED_ADMIN_PASSWORD` | Opcional | Seed | Senha do superadmin de demonstração |
| `SEED_OWNER_PASSWORD` | Opcional | Seed | Senha do proprietário da Barbearia Nobre |
| `SEED_PROFESSIONAL_PASSWORD` | Opcional | Seed | Senha do profissional de demonstração |
| `SEED_EXTRA_DEMO` | Opcional | Seed | `true` cria o superadmin e o Studio Aurora |

`VERCEL_URL` é usada automaticamente como fallback quando `NEXT_PUBLIC_APP_URL` não está definida.

O arquivo `.env.example` contém um modelo comentado. Nunca versione `.env.local` ou credenciais reais. Os scripts `db:*` leem `.env.local` via `dotenv-cli`.

## PostgreSQL

Opções compatíveis: Neon, Supabase, Railway, Amazon RDS, Google Cloud SQL ou PostgreSQL local.

Requisitos:

- PostgreSQL 14+.
- Permissão para criar a extensão `btree_gist` ou extensão já instalada por um administrador.
- SSL habilitado em provedores gerenciados, conforme a URL fornecida pelo serviço.

Após configurar o banco:

```bash
npm run db:migrate
npm run db:seed
```

O seed cria os planos e os dados de demonstração. Em produção, aplique apenas as migrações e crie os planos pelo painel `/admin/planos` ou por um seed controlado.

## E-mail transacional (Resend)

O adaptador está em `lib/email.ts`:

- com `RESEND_API_KEY`, o envio usa `https://api.resend.com/emails`;
- sem a chave, o e-mail é registrado no log do servidor e o fluxo continua;
- `EMAIL_FROM` precisa ser um remetente verificado no domínio da Resend.

Notificações implementadas:

- reserva criada;
- reserva confirmada;
- reserva cancelada;
- reserva remarcada;
- lembrete de agendamento conforme `reminderHours` do estabelecimento.

Cada envio é registrado em `Notification`, com destinatário, assunto, corpo, status, erro e chave de deduplicação. O estabelecimento pode desativar notificações ou tipos específicos em `/painel/configuracoes`.

Para trocar de provedor, implemente outro adaptador mantendo a interface `sendEmail` de `lib/email.ts`.

## Webhook de pagamentos

Endpoint: `POST /api/webhooks/payments`.

- Assinatura HMAC SHA-256 sobre o corpo bruto, usando `PAYMENT_WEBHOOK_SECRET`.
- Header principal: `x-agendix-signature`. Também aceita `x-webhook-signature` e `x-signature`, com ou sem o prefixo `sha256=`.
- Idempotência por `eventId` (armazenado em `Payment.providerEventId`).
- Sem `PAYMENT_WEBHOOK_SECRET`, a rota responde `503`.
- Assinatura inválida responde `401`.

Exemplo de payload:

```json
{
  "eventId": "evt_123",
  "type": "payment.paid",
  "establishmentSlug": "barbearia-nobre",
  "providerPaymentId": "pay_456",
  "amount": 79.9,
  "currency": "BRL",
  "method": "Pix",
  "paidAt": "2026-10-30T12:00:00.000Z",
  "extendDays": 30
}
```

Tipos aceitos:

| Tipo | Efeito |
| --- | --- |
| `payment.paid` | Registra pagamento `PAID`, ativa a assinatura e estende o período |
| `payment.pending` | Registra pagamento `PENDING` |
| `payment.failed` | Registra pagamento `FAILED` |
| `payment.refunded` | Registra pagamento `REFUNDED` |

O webhook é uma integração genérica de provedor, não um gateway de cartão. Não há checkout, captura, estorno automático ou emissão de nota fiscal.

## Cron de lembretes

Endpoint: `GET` ou `POST /api/cron/reminders`.

- Protegido por `CRON_SECRET`.
- Aceita `Authorization: Bearer <segredo>` ou `x-cron-secret`.
- Sem `CRON_SECRET`, responde `503`; segredo inválido responde `401`.
- Envia lembretes de agendamentos dentro da janela configurada por estabelecimento.
- Retorna `{ ok, ranAt, ... }` com o resultado do processamento.

Exemplo de `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
}
```

Na Vercel, o cron envia automaticamente `Authorization: Bearer $CRON_SECRET` quando a variável está configurada.

## WhatsApp

O produto usa apenas links `wa.me`:

- mensagens de confirmação, contato e cancelamento são abertas com texto pré-preenchido;
- o envio depende do usuário confirmar no WhatsApp;
- não há API oficial, envio em massa, fila, webhook ou confirmação de leitura;
- o WhatsApp de suporte da plataforma vem de `NEXT_PUBLIC_SUPPORT_WHATSAPP`;
- o WhatsApp do estabelecimento é configurado no painel.

Para usar a API oficial do WhatsApp, será necessário um provedor externo, credenciais, templates aprovados e uma mudança de escopo neste documento. Nada disso está implementado.

## Domínio e URL pública

Em produção, configure:

```env
NEXT_PUBLIC_APP_URL="https://agenda.suaempresa.com.br"
```

Também configure o domínio na hospedagem. A URL é usada em:

- links de confirmação enviados ao cliente;
- links de redefinição de senha e verificação de e-mail;
- arquivos `.ics` e links de Google Agenda;
- compartilhamento da página pública;
- metadados e redirecionamentos.

## Armazenamento de imagens

Logo, capa e galeria podem ser anexadas em Configurações e em Personalizar página (PNG, JPG ou WebP, até 5 MB por imagem). O navegador redimensiona as imagens e as salva no banco como data URL, sem depender de storage externo. A foto de profissional ainda aceita apenas URL `http(s)` ou caminho iniciado por `/`. Para migrar todas as imagens para um storage dedicado, configure S3, Cloudinary, UploadThing ou equivalente, com validação de tipo/tamanho e política de retenção.

## Observabilidade

Não há APM ou serviço de erro integrado. Os logs ficam disponíveis na plataforma de hospedagem. Para produção, recomenda-se configurar um coletor de erros e monitoramento de disponibilidade, além de alertas para falhas de e-mail, webhook e cron.

## LGPD e suporte

- A política de privacidade está em `/privacidade`.
- Os termos de uso estão em `/termos`.
- Cada estabelecimento é controlador dos dados dos seus clientes; a operação do Agendix atua como operadora.
- O canal de suporte exibido ao usuário depende de `NEXT_PUBLIC_SUPPORT_WHATSAPP`.
- Pedidos de titular devem ser atendidos pelo estabelecimento e, quando envolverem a operação técnica, pelo suporte da plataforma.
- Clientes podem ser anonimizados no painel sem apagar o histórico estatístico.

## Checklist antes de publicar

- [ ] `DATABASE_URL` de produção configurada.
- [ ] Migrações aplicadas com `prisma migrate deploy`.
- [ ] Planos comerciais criados e revisados.
- [ ] `NEXT_PUBLIC_APP_URL` com o domínio final.
- [ ] `NEXT_PUBLIC_SUPPORT_WHATSAPP` com um número real ou vazio de forma consciente.
- [ ] `RESEND_API_KEY` e `EMAIL_FROM` configurados se o e-mail for usado.
- [ ] `PAYMENT_WEBHOOK_SECRET` configurado se houver provedor de pagamento.
- [ ] `CRON_SECRET` configurado e cron agendado.
- [ ] Senhas de seed alteradas ou seed não executado em produção.
- [ ] Backup do banco configurado.
- [ ] Política de privacidade e termos revisados pela operação.
- [ ] Dados de cada estabelecimento, serviços, equipe e horários conferidos no painel.
