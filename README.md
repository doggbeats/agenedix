# AgendamentoON — agendamento online para negócios de beleza e bem-estar

O **AgendamentoON** é um SaaS multiestabelecimento de agenda online. Cada negócio tem a própria página pública de agendamento, identidade visual, equipe, serviços e regras de funcionamento. A plataforma central cuida de planos, assinaturas, cobrança via Pagar.me, auditoria e suporte.

O projeto foi construído sobre Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma 6 e PostgreSQL.

## Experiências

- **Site público:** landing page da plataforma em `/`, diretório de agendas em `/agendar` e página de cada estabelecimento em `/agendar/[slug]`.
- **Painel do estabelecimento:** visão geral, agenda, agendamentos, clientes, serviços, profissionais, relatórios, equipe, plano e personalização.
- **Administração da plataforma:** visão geral, estabelecimentos, planos, pagamentos e auditoria em `/admin`.

## Papéis e permissões

| Papel | Acesso |
| --- | --- |
| **Superadmin** (`isPlatformAdmin`) | Plataforma inteira: estabelecimentos, planos, pagamentos, auditoria e suporte. Não participa da operação diária de um estabelecimento sem vínculo. |
| **Proprietário** (`OWNER`) | Acesso completo ao estabelecimento, incluindo equipe, plano, personalização e configurações. |
| **Administrador / recepção** (`ADMIN`) | Agenda, agendamentos, clientes, serviços, profissionais, relatórios, configurações e personalização. Não gerencia equipe nem assinatura. |
| **Profissional** (`PROFESSIONAL`) | Apenas os próprios atendimentos, a própria agenda e a própria jornada. |

O isolamento é feito no servidor por `establishmentId` e vínculo (`Membership`). Nenhuma consulta operacional cruza estabelecimentos.

## Planos

| Plano | Valor mensal | Valor anual | Profissionais | Serviços | Unidades | Usuários | Teste |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Essencial** | R$ 79,90 | R$ 799,00 | 1 | 15 | 1 | 2 | 7 dias |
| **Profissional** | R$ 109,90 | R$ 1.099,00 | 5 | 60 | 1 | 5 | 7 dias |
| **Equipe** | R$ 139,90 | R$ 1.399,00 | 15 | 200 | 3 | 15 | 7 dias |
| **Premium** | R$ 189,90 | R$ 1.899,00 | 20 | 200 | 5 | 20 | 7 dias |

Os valores, limites e textos dos planos podem ser editados pelo superadmin em `/admin/planos`. O plano Essencial tem limite de 300 agendamentos por mês; os demais não têm limite mensal. A cobrança é processada pelo Pagar.me: no cartão, o cliente testa 7 dias e a primeira cobrança automática acontece no 8º dia; no Pix, o primeiro período é pago na hora e o acesso libera após a confirmação do webhook.

## O que está implementado

### Página pública

- Landing page da plataforma e diretório de estabelecimentos com busca.
- Página por estabelecimento com branding próprio: cores, fonte, capa, galeria, redes sociais, tagline e seções condicionais.
- Serviços, equipe, horários, endereço, política de cancelamento e contato por WhatsApp.
- Reserva em etapas com serviços, profissional (ou “qualquer profissional”), data e horário.
- Disponibilidade calculada no servidor, considerando funcionamento, jornada, pausas, bloqueios, exceções de agenda, antecedência e duração.
- Nenhum horário indisponível é exibido; a reserva é revalidada no servidor e protegida por constraint de exclusão no PostgreSQL.
- Confirmação com protocolo, token de acesso, status, contato, Google Agenda, download `.ics` e cancelamento dentro do prazo.
- Página pública bloqueada quando o estabelecimento está suspenso, com a página desativada ou com assinatura sem período válido.

### Painel do estabelecimento

- Visão geral com indicadores reais do dia e próximos atendimentos.
- Agenda diária/semanal, criação manual, confirmação, conclusão, cancelamento, falta e remarcação.
- Clientes com histórico, busca e anonimização.
- Serviços com preço, duração, buffer, categoria, imagem, profissionais habilitados e publicação online.
- Profissionais com bio, foto, especialidades, jornada, pausas e vínculo de acesso.
- Relatórios com receita, volume, distribuição e exportação CSV autenticada.
- Configurações do estabelecimento, horários, bloqueios, exceções, política de cancelamento e notificações.
- Personalização visual com prévia e aplicação imediata na página pública.
- Onboarding guiado em cinco etapas.
- Equipe com convite, papéis e remoção de vínculo (somente `OWNER`).
- Plano atual, período de teste, limites, comparação e histórico de pagamentos.
- Checkout com Pix ou cartão de crédito via Pagar.me, tokenização no navegador e liberação automática por webhook.

### Administração da plataforma

- Estabelecimentos com status, assinatura e acesso rápido à página pública.
- Planos com criação, edição, ativação e limites.
- Pagamentos manuais para exceções, com ativação e extensão de período.
- Webhook do Pagar.me com assinatura HMAC, idempotência e ativação de assinatura.
- Webhook genérico de pagamentos com assinatura HMAC, idempotência e ativação de assinatura.
- Auditoria com filtros por ação e estabelecimento, paginação e metadados.
- Lembretes por e-mail via rota de cron protegida.

### Autenticação e segurança

- Login, logout, recuperação e redefinição de senha.
- Verificação de e-mail com token de uso único e validade de 24 horas.
- Sessões em banco com cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Tokens de sessão, redefinição, verificação e acesso público armazenados apenas como hash SHA-256.
- Senhas com bcrypt.
- Rate limiting em login, reserva e cancelamento.
- Validação Zod nos formulários e rotas.
- Auditoria de ações sensíveis sem armazenar senhas ou tokens.

## Rotas principais

| Área | Rota |
| --- | --- |
| Landing page | `/` |
| Diretório de agendas | `/agendar` |
| Reserva pública | `/agendar/[slug]` |
| Confirmação do cliente | `/agendar/[slug]/confirmacao?protocolo=...&token=...` |
| Login | `/login` |
| Cadastro de estabelecimento | `/cadastro` |
| Checkout do plano | `/checkout` |
| Recuperação de senha | `/recuperar-senha`, `/redefinir-senha` |
| Verificação de e-mail | `/verificar-email` |
| Painel | `/painel` |
| Agenda | `/painel/agenda` |
| Agendamentos | `/painel/agendamentos` |
| Clientes | `/painel/clientes` |
| Serviços | `/painel/servicos` |
| Profissionais | `/painel/profissionais` |
| Relatórios | `/painel/relatorios` |
| Equipe | `/painel/equipe` |
| Personalização | `/painel/personalizar` |
| Plano e cobrança | `/painel/plano` |
| Onboarding | `/painel/onboarding` |
| Configurações | `/painel/configuracoes` |
| Administração | `/admin` |
| Estabelecimentos | `/admin/estabelecimentos` |
| Planos | `/admin/planos` |
| Pagamentos | `/admin/pagamentos` |
| Auditoria | `/admin/auditoria` |
| Legal | `/privacidade`, `/termos` |

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- PostgreSQL 14 ou superior com permissão para criar a extensão `btree_gist`
- Banco compatível com PostgreSQL (Neon, Supabase, Railway, RDS etc.)

## Instalação local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de ambiente:

   ```bash
   cp .env.example .env.local
   ```

   No PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Preencha `DATABASE_URL`, `NEXT_PUBLIC_APP_URL` e as chaves do Pagar.me (`PAGARME_SECRET_KEY`, `NEXT_PUBLIC_PAGARME_PUBLIC_KEY`, `PAGARME_WEBHOOK_SECRET`). E-mail, webhook genérico e cron são opcionais.

4. Aplique as migrações:

   ```bash
   npm run db:migrate
   ```

5. Gere o Prisma Client e carregue os dados de demonstração:

   ```bash
   npm run db:generate
   npm run db:seed
   ```

6. Inicie o servidor:

   ```bash
   npm run dev
   ```

7. Abra [http://localhost:3000](http://localhost:3000).

### Banco novo

Em um banco novo, `npm run db:migrate` executa `prisma migrate deploy` usando `.env.local`. As migrações criam tabelas, enums, índices, a extensão `btree_gist` e a constraint de exclusão de horários.

Se o usuário da aplicação não puder criar extensões, execute uma vez com um usuário administrador:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

> Em bancos que já rodaram o protótipo anterior, tabelas antigas (`appointments`, `barbers`, `clients`, `services`) podem causar drift no `prisma migrate dev`. Use `prisma migrate deploy` e não execute `prisma migrate reset`.

## Acesso de demonstração

O seed padrão cria os planos e a **Barbearia Nobre**:

| Perfil | E-mail |
| --- | --- |
| Proprietário — Barbearia Nobre | `dono@barbearianobre.com.br` |
| Administrador — Barbearia Nobre | `admin@barbearianobre.com.br` |
| Profissional — Barbearia Nobre | `bruno@barbearianobre.com.br` |

Página pública: `/agendar/barbearia-nobre`.

Com `SEED_EXTRA_DEMO=true`, o seed também cria:

| Perfil | E-mail |
| --- | --- |
| Superadmin da plataforma | `admin@agendix.app` |
| Proprietária — Studio Aurora (teste) | `dono@studioaurora.com.br` |

As senhas não são mais versionadas. Defina `SEED_ADMIN_PASSWORD`, `SEED_OWNER_PASSWORD` e `SEED_PROFESSIONAL_PASSWORD` no `.env.local` (mínimo 8 caracteres) antes de rodar o seed.

## E-mail, webhook e cron

### E-mail

Sem `RESEND_API_KEY`, os e-mails são registrados no log do servidor (útil em desenvolvimento). Com a chave, o envio usa a API da Resend. Configure `EMAIL_FROM` com um remetente verificado.

### Webhook do Pagar.me

`POST /api/webhooks/pagarme` recebe os eventos do Pagar.me. A assinatura HMAC é verificada com `PAGARME_WEBHOOK_SECRET` nos headers `x-hub-signature`, `x-pagarme-signature` ou `x-signature` (sha1 ou sha256). O evento é idempotente por `eventId` e por `providerPaymentId`.

Eventos de cobrança paga ativam a assinatura, eventos de falha ou reembolso marcam `PAST_DUE` e eventos de cancelamento encerram o acesso. Sem `PAGARME_WEBHOOK_SECRET`, a rota responde `503`.

Configure no painel do Pagar.me a URL:

```text
https://seu-dominio.com/api/webhooks/pagarme
```

### Webhook genérico de pagamentos

`POST /api/webhooks/payments` recebe eventos financeiros assinados com HMAC SHA-256 no header `x-agendix-signature` (aceita também `x-webhook-signature` e `x-signature`, com ou sem o prefixo `sha256=`). A assinatura é calculada sobre o corpo bruto usando `PAYMENT_WEBHOOK_SECRET`.

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

Tipos aceitos: `payment.paid`, `payment.pending`, `payment.failed`, `payment.refunded`. O evento é idempotente por `eventId`; `payment.paid` ativa a assinatura e estende o período. Sem `PAYMENT_WEBHOOK_SECRET`, a rota responde `503`.

### Cron de lembretes

`GET` ou `POST /api/cron/reminders` envia lembretes de agendamentos conforme `reminderHours` de cada estabelecimento. Proteja com `CRON_SECRET` no header `Authorization: Bearer <segredo>` ou `x-cron-secret`. Sem `CRON_SECRET`, a rota responde `503`.

Exemplo de `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
}
```

Na Vercel, o cron envia automaticamente o header `Authorization: Bearer $CRON_SECRET` quando a variável está configurada.

## Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o Prisma Client e compila a aplicação |
| `npm run start` | Inicia o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run typecheck` | Verifica os tipos TypeScript |
| `npm test` | Executa a suíte Vitest |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate` | Aplica migrações com `.env.local` |
| `npm run db:seed` | Popula planos e dados de demonstração |
| `npm run db:studio` | Abre o Prisma Studio |

## Documentação

- [Funcionalidades implementadas](docs/FUNCIONALIDADES.md)
- [Banco de dados e migrações](docs/BANCO-DE-DADOS.md)
- [Configuração externa e variáveis de ambiente](docs/CONFIGURACAO-EXTERNA.md)
- [Deploy em Vercel + PostgreSQL](docs/DEPLOY.md)
- [Testes](docs/TESTES.md)

## Limites conhecidos

- O WhatsApp é integrado por links `wa.me`; o envio depende do usuário confirmar a conversa no aplicativo.
- O checkout usa o Pagar.me Core API v5. Sem as chaves configuradas, o painel permanece bloqueado para novas contas. Emissão de nota fiscal e conciliação bancária não estão implementadas.
- Logo, capa e galeria são enviadas por anexo, otimizadas no navegador e salvas no banco, sem depender de storage externo. Foto de profissional ainda usa URL externa validada.
- O cron de lembretes precisa ser agendado no provedor de hospedagem.
- Os agendamentos criados pelo seed usam tokens de demonstração e não servem para testar o link público de confirmação. Crie um agendamento novo pela página pública para validar esse fluxo.
