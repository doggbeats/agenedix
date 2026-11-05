# Deploy em produção

O caminho recomendado é Vercel para a aplicação e PostgreSQL gerenciado (Neon, Supabase, Railway ou equivalente) para o banco.

## 1. Preparar o banco

1. Crie o banco PostgreSQL.
2. Copie a URL de conexão. Em provedores com pool, use a URL de pool para a aplicação e a URL direta para migrações quando o provedor exigir.
3. Aplique as migrações a partir da sua máquina ou de um passo de CI, com a `DATABASE_URL` de produção:

   ```bash
   npx prisma migrate deploy
   ```

4. Confirme que a extensão `btree_gist` e a constraint `Appointment_professional_no_overlap` existem.
5. Crie os planos comerciais. Em banco novo, você pode rodar o seed de forma controlada ou cadastrá-los em `/admin/planos` após o primeiro acesso de superadmin.

> **Nunca execute `prisma migrate reset` em um banco com dados.** O projeto convive com tabelas legadas do protótipo (`appointments`, `barbers`, `clients`, `services`) e usa `migrate deploy` para evitar drift.

Não é necessário executar o seed em produção. Se quiser criar a Barbearia Nobre e os acessos de demonstração, execute `npm run db:seed` de forma controlada e troque as senhas antes de liberar o ambiente.

## 2. Configurar a Vercel

1. Importe o repositório na Vercel.
2. Framework: Next.js.
3. Node.js: 20 ou superior.
4. Build command: `npm run build` (inclui `prisma generate`).
5. Configure as variáveis de ambiente:

   ```env
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_APP_URL=https://seu-dominio.com
   NEXT_PUBLIC_SUPPORT_WHATSAPP=5561999999999
   RESEND_API_KEY=re_...
   EMAIL_FROM=AgendamentoON <nao-responda@seu-dominio.com>
   PAYMENT_WEBHOOK_SECRET=...
   PAGARME_SECRET_KEY=...
   NEXT_PUBLIC_PAGARME_PUBLIC_KEY=...
   PAGARME_WEBHOOK_SECRET=...
   INFINITEPAY_HANDLE=...
   INFINITEPAY_API_KEY=...
   CRON_SECRET=...
   ```

   As variáveis de e-mail, webhook e cron são opcionais, mas necessárias para esses recursos. Veja [CONFIGURACAO-EXTERNA.md](CONFIGURACAO-EXTERNA.md).

6. Faça o deploy.

A migração é intencionalmente separada do build. Isso evita que um build de preview altere o banco de produção. Execute `prisma migrate deploy` no ambiente correto antes de publicar uma versão que dependa de mudanças de schema.

## 3. Cron de lembretes

Crie `vercel.json` na raiz:

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }]
}
```

Configure `CRON_SECRET` na Vercel. A Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente. Sem o segredo, a rota responde `503` e nenhum lembrete é enviado.

## 4. Pagar.me e webhooks

Configure na Vercel:

- `PAGARME_SECRET_KEY`
- `NEXT_PUBLIC_PAGARME_PUBLIC_KEY`
- `PAGARME_WEBHOOK_SECRET`

Cadastre no painel do Pagar.me o webhook:

```text
POST https://seu-dominio.com/api/webhooks/pagarme
```

- Assinatura HMAC com `PAGARME_WEBHOOK_SECRET` (`x-hub-signature`, `x-pagarme-signature` ou `x-signature`).
- Idempotência por `eventId` e `providerPaymentId`.
- Eventos de pagamento pago ativam a assinatura; falha/reembolso marcam `PAST_DUE`.

Sem essas chaves, o checkout responde com erro de configuração e nenhuma assinatura é criada. O webhook genérico `POST /api/webhooks/payments` continua disponível para integrações manuais, com `PAYMENT_WEBHOOK_SECRET`.

### InfinitePay

Antes de configurar a Vercel, ative o **Checkout Integrado** em `app.infinitepay.io/external-checkout`. Sem isso a API responde `external_checkout_not_enabled` ao criar o link.

Configure na Vercel:

- `INFINITEPAY_HANDLE` (InfiniteTag sem o `$`)
- `INFINITEPAY_API_KEY` (opcional, `inchk_...`)

O webhook é configurado na criação de cada link (não há cadastro prévio na InfinitePay) e aponta para:

```text
POST https://seu-dominio.com/api/webhooks/infinitepay
```

- A InfinitePay não assina o webhook; cada evento `paid` é revalidado em `POST /payment_check`.
- O retorno do cliente acontece em `https://seu-dominio.com/checkout/retorno`.
- Não existe sandbox: valide com uma compra real de baixo valor e estorne depois, se necessário.

## 5. Domínio

1. Adicione o domínio na Vercel.
2. Aponte o DNS conforme as instruções da Vercel.
3. Atualize `NEXT_PUBLIC_APP_URL` com o domínio final.
4. Faça um novo deploy para propagar a variável pública.

## 6. Verificações pós-deploy

### Plataforma

- [ ] `/` abre a landing page e `/agendar` lista os estabelecimentos publicados.
- [ ] `/cadastro` cria estabelecimento, branding inicial, unidade padrão e assinatura pendente.
- [ ] `/checkout` aceita Pix, cartão (Pagar.me) e InfinitePay, libera o painel após pagamento ou teste e bloqueia contas sem plano válido.
- [ ] Login em `/login` funciona e o painel abre no estabelecimento correto.
- [ ] `/admin` exige `isPlatformAdmin` e mostra dados reais.
- [ ] Planos aparecem em `/admin/planos` com preços e limites corretos.

### Estabelecimento

- [ ] `/agendar/[slug]` exibe a marca do tenant, serviços, equipe e horários.
- [ ] Reserva pública cria protocolo e link de confirmação.
- [ ] Nenhum horário indisponível é exibido e a reserva é revalidada no servidor.
- [ ] Cancelamento dentro do prazo altera o status.
- [ ] Painel permite criar, confirmar, concluir, cancelar e remarcar agendamentos.
- [ ] Serviços, profissionais, clientes, relatórios e configurações funcionam.
- [ ] Personalização reflete na página pública.
- [ ] Equipe só é gerenciada por `OWNER`.
- [ ] Onboarding aparece enquanto não concluído.
- [ ] Página pública bloqueia estabelecimento suspenso ou com assinatura inválida.

### Segurança e operação

- [ ] Cookies estão `Secure` e `HttpOnly` em HTTPS.
- [ ] Recuperação de senha envia link e invalida sessões.
- [ ] Verificação de e-mail expira em 24 horas.
- [ ] Webhook rejeita assinatura inválida.
- [ ] Cron responde `401` sem segredo válido.
- [ ] Backup do banco está ativo.
- [ ] Senhas de demonstração não existem em produção.
- [ ] `NEXT_PUBLIC_SUPPORT_WHATSAPP` está configurado ou vazio de forma consciente.

## 7. Banco e conexões

Em ambientes serverless, use a string de conexão com pool fornecida pelo provedor. Se o provedor separar conexão direta e pooled, use a direta apenas para migrações e a pooled para a aplicação.

Monitore:

- número de conexões;
- latência das consultas;
- erros de constraint de exclusão;
- crescimento de `RateLimitBucket`, `AuditLog` e `Notification`;
- falhas de envio de e-mail e de webhook.

O código remove buckets de rate limit expirados ocasionalmente. Para volumes maiores, agende uma limpeza periódica no banco.

## 8. Rollback

1. Reverta o deploy da aplicação pela Vercel.
2. Se a migração for incompatível, restaure o backup do banco.
3. Nunca edite uma migração já aplicada em produção; crie uma nova migração corretiva.

## 9. Limitações operacionais

- O checkout usa o Pagar.me Core API v5 e a InfinitePay (Checkout Integrado). A InfinitePay não oferece cobrança recorrente nem sandbox. Emissão de nota fiscal, conciliação bancária e estorno automático não estão implementados.
- Pagamentos manuais em `/admin/pagamentos` continuam disponíveis para cortesias e ajustes de suporte.
- WhatsApp é link externo, sem envio automático.
- Logo, capa e galeria são anexadas nos formulários e salvas no banco como data URL. A foto de profissional usa URL externa validada.
- O cron de lembretes precisa ser agendado no provedor de hospedagem.
- A interface de gestão de unidades ainda não foi exposta; o modelo `Unit` existe e o plano `Equipe` permite 3 unidades.

Consulte também [CONFIGURACAO-EXTERNA.md](CONFIGURACAO-EXTERNA.md).
