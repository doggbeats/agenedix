# Testes

A suíte usa Vitest e cobre as regras puras mais críticas do produto. Os testes não dependem de banco de dados, rede ou navegador.

```bash
npm test          # execução única
npm run test:watch
npm run typecheck
npm run lint
```

## Cobertura atual

**5 arquivos, 38 testes.**

### `tests/availability.test.ts` — 13 testes

- geração de horários dentro do funcionamento;
- intervalo comercial;
- bloqueio por agendamento existente;
- ignorar agendamentos cancelados;
- bloqueio geral e bloqueio por profissional;
- antecedência mínima;
- dia fechado;
- profissionais que atendem a janela completa;
- buffer do serviço;
- escolha do profissional com menos atendimentos e desempate;
- janela de cancelamento.

### `tests/timezone.test.ts` — 6 testes

- conversão de minutos locais para UTC;
- conversão de horário local para UTC;
- dia atual no fuso do estabelecimento;
- soma de dias atravessando mês, ano e ano bissexto;
- dia da semana;
- validação de data e horário.

### `tests/validation.test.ts` — 8 testes

- login;
- consentimento e campos da reserva pública;
- telefone e data inválidos;
- validação do schema de serviço com coerção numérica;
- bloqueio de agenda com fim anterior ao início;
- horário comercial e plano;
- cadastro com confirmação de senha.

### `tests/format.test.ts` — 6 testes

- moeda brasileira;
- normalização e formatação de telefone;
- duração e horários;
- iniciais e truncamento;
- tempo relativo.

### `tests/whatsapp.test.ts` — 5 testes

- geração de link `wa.me`;
- mensagem padrão de agendamento;
- template personalizado com substituição de variáveis;
- placeholders desconhecidos;
- mensagem de contato.

## O que ainda não é testado automaticamente

- integração com PostgreSQL real;
- constraint de exclusão em concorrência;
- server actions e rotas HTTP;
- fluxo de autenticação com cookies e tokens;
- webhook do Pagar.me e idempotência;
- webhook genérico de pagamentos e idempotência;
- cron de lembretes e envio de e-mail;
- gating de assinatura nas rotas públicas e no painel;
- tokenização de cartão no navegador;
- interface visual e acessibilidade em navegador.

Esses fluxos devem ser validados manualmente antes de cada publicação. Para uma verificação completa:

1. Execute `npm run db:migrate` e `npm run db:seed` com `.env.local`.
2. Abra `/` e confira a landing page; abra `/agendar` e o diretório.
3. Abra `/agendar/barbearia-nobre` e escolha serviço, profissional, data e horário.
4. Confirme os dados e conclua a reserva.
5. Abra o link de confirmação com protocolo e token.
6. Baixe o `.ics`, abra o Google Agenda e cancele dentro do prazo.
7. Entre no painel com `dono@barbearianobre.com.br` / `Demo@2026`.
8. Verifique o agendamento em `/painel/agendamentos` e exporte o CSV em `/painel/relatorios`.
9. Crie um serviço, um profissional e um bloqueio em `/painel/configuracoes`.
10. Ajuste cores em `/painel/personalizar` e confira a página pública.
11. Convide um membro em `/painel/equipe` e teste o acesso com o papel `ADMIN`.
12. Abra `/painel/plano` e confira limites e histórico de pagamentos.
13. Crie uma conta nova em `/cadastro` e confirme que o painel redireciona para `/checkout`.
14. Teste o checkout com Pix e com cartão; confirme a liberação do painel após o pagamento ou o início do teste.
15. Envie um evento duplicado ao webhook do Pagar.me e confirme que o pagamento não é registrado duas vezes.
16. Entre como superadmin em `/admin`, registre um pagamento manual em `/admin/pagamentos` e confira a assinatura.
17. Verifique a trilha em `/admin/auditoria`.
18. Teste recuperação de senha em `/recuperar-senha` e verificação em `/verificar-email`.

Os agendamentos criados pelo seed usam tokens de demonstração fixos. Para testar o link público de confirmação, crie uma reserva nova pelo fluxo público.

## Qualidade antes de publicar

```bash
npm run db:generate
npm run typecheck
npm run lint
npm test
npm run build
```

O build inclui `prisma generate` e a compilação de produção do Next.js. Nenhum desses comandos aplica migrações; use `npm run db:migrate` separadamente.

## CI sugerido

```yaml
- run: npm ci
- run: npm run typecheck
- run: npm run lint
- run: npm test
- run: npm run build
```

Mantenha as migrações e o seed fora do CI de pull request. Aplique `prisma migrate deploy` em um passo controlado de deploy.
