# Banco de dados e migrações

O projeto usa PostgreSQL com Prisma. O schema está em `prisma/schema.prisma` e as migrações em `prisma/migrations`.

## Modelo de dados

### Plataforma e acesso

| Modelo | Função |
| --- | --- |
| `Establishment` | Estabelecimento (tenant): slug público, fuso, regras de agenda, preferências de notificação e status |
| `User` | Conta de acesso; pode ser superadmin (`isPlatformAdmin`) e/ou ter vínculos com estabelecimentos |
| `Session` | Sessão autenticada, com hash do token, IP, user agent e expiração |
| `Membership` | Vínculo do usuário com o estabelecimento e papel (`OWNER`, `ADMIN` ou `PROFESSIONAL`) |
| `PasswordResetToken` | Token de redefinição de senha, uso único e validade limitada |
| `EmailVerificationToken` | Token de verificação de e-mail, uso único e validade de 24 horas |
| `AuditLog` | Trilha de auditoria de ações sensíveis, com ator, estabelecimento, entidade e metadados |
| `RateLimitBucket` | Controle de tentativas por chave e janela |

### Operação do estabelecimento

| Modelo | Função |
| --- | --- |
| `Professional` | Profissional do estabelecimento, com unidade opcional, bio, foto e especialidades |
| `Service` | Serviço, preço, duração, buffer, categoria, publicação online e exclusão lógica |
| `ProfessionalService` | Relação entre profissionais e serviços |
| `BusinessHours` | Funcionamento do estabelecimento por dia da semana, com intervalo |
| `ProfessionalAvailability` | Jornada e intervalo por profissional e dia da semana |
| `ScheduleException` | Exceção de agenda por data (fechamento ou horário especial), geral ou por profissional |
| `TimeBlock` | Bloqueio de agenda por período, geral ou por profissional |
| `Unit` | Unidade do estabelecimento; o plano `Equipe` permite até 3 |
| `Customer` | Cliente do estabelecimento, com dados pessoais e anonimização |
| `Appointment` | Agendamento, status, origem, protocolo, hash do token público e retenção (`holdExpiresAt`) |
| `AppointmentEvent` | Histórico de criação, confirmação, remarcação, cancelamento, conclusão, falta e expiração |

### Marca e assinatura

| Modelo | Função |
| --- | --- |
| `TenantBranding` | Identidade visual do tenant: cores, fonte, estilo de botão, capa, galeria, redes e seções visíveis |
| `SubscriptionPlan` | Planos comerciais com preço, limites de profissionais, serviços, unidades, usuários, agendamentos, dias de teste e IDs de plano no Pagar.me |
| `Subscription` | Assinatura do estabelecimento: plano, status, ciclo, teste, período atual, tolerância, cliente e assinatura no provedor |
| `Payment` | Pagamento manual ou do Pagar.me, com idempotência por `providerPaymentId` e `providerEventId` |
| `Notification` | Registro de e-mails transacionais e lembretes, com status, erro e chave de deduplicação |

### Papéis

| Papel | Escopo |
| --- | --- |
| `OWNER` | Acesso completo ao estabelecimento, incluindo equipe e assinatura |
| `ADMIN` | Agenda, clientes, serviços, profissionais, relatórios, configurações e personalização; sem equipe nem assinatura |
| `PROFESSIONAL` | Apenas os próprios atendimentos, agenda e jornada |

O superadmin é marcado por `User.isPlatformAdmin` e acessa a área `/admin`. Ele não participa da operação diária de um estabelecimento sem um `Membership`.

## Isolamento por estabelecimento

As entidades operacionais carregam `establishmentId`. As consultas do painel são filtradas pelo estabelecimento ativo e pelo vínculo do usuário. O profissional recebe um escopo adicional por `professionalId`, impedindo acesso à agenda de colegas. Rotas públicas resolvem o tenant pelo slug e validam o status e a assinatura antes de expor dados ou horários.

## Migrações

```bash
# Aplicar migrações no banco configurado em .env.local
npm run db:migrate

# Gerar o Prisma Client após alterações no schema
npm run db:generate

# Popular planos e dados de demonstração
npm run db:seed
```

Os scripts de banco usam `dotenv -e .env.local`. Se você rodar o Prisma diretamente, informe o arquivo:

```bash
npx dotenv -e .env.local -- prisma migrate deploy
```

### Migrações existentes

| Migração | Conteúdo |
| --- | --- |
| `20261027091000_init` | Estrutura inicial, extensão `btree_gist` e constraint `Appointment_professional_no_overlap` |
| `20261027120000_brand_default` | Correção de registros criados com a cor antiga do protótipo |
| `20261027130000_brown_brand_palette` | Paleta marrom anterior aplicada à Barbearia Nobre |
| `20261030120000_saas_core` | Papel `ADMIN`, branding, unidades, exceções, pagamentos, notificações e tokens de autenticação |
| `20261031120000_pagarme_plans` | Cache dos IDs de plano mensal e anual criados no Pagar.me |

A migração `20261030120000_saas_core` é **aditiva**: usa `ADD VALUE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` e cria apenas tabelas/índices novos. Ela preserva os dados existentes.

A constraint `Appointment_professional_no_overlap` impede que dois agendamentos ativos do mesmo profissional se sobreponham no banco, além da validação na aplicação.

> **Atenção ao drift legado.** Em bancos que já rodaram o protótipo anterior, tabelas antigas (`appointments`, `barbers`, `clients`, `services`) podem continuar existindo. Por isso `prisma migrate dev` pode detectar drift. Use sempre `prisma migrate deploy` e **nunca** execute `prisma migrate reset` nesse banco: o reset apaga os dados. Faça backup e remova as tabelas antigas manualmente somente após confirmar que não são mais necessárias.

> O seed é idempotente e não remove estabelecimentos existentes. Uma base como a **Br code** permanece no banco, mas não aparece no diretório público se estiver suspensa ou sem assinatura válida.

## Seed de demonstração

O seed padrão cria:

- os quatro planos (`Essencial`, `Profissional`, `Equipe`, `Premium`) com os valores e limites atuais;
- a **Barbearia Nobre** com branding, unidade padrão, assinatura ativa, serviços, profissionais e agendamentos de exemplo;
- os acessos de `OWNER`, `ADMIN` e `PROFESSIONAL` da Barbearia Nobre.

Com `SEED_EXTRA_DEMO=true`, também cria o superadmin da plataforma e o estabelecimento de teste **Studio Aurora** em período de teste.

Credenciais e senhas são configuráveis por `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_OWNER_PASSWORD`, `SEED_PROFESSIONAL_PASSWORD` e `SEED_EXTRA_DEMO`. Veja o [README](../README.md#acesso-de-demonstração).

## PostgreSQL local

Exemplo com um banco chamado `agendamentoon`:

```sql
CREATE DATABASE agendamentoon;
```

Depois configure:

```env
DATABASE_URL="postgresql://postgres:senha@localhost:5432/agendamentoon?schema=public"
```

Se o usuário da aplicação não puder criar extensões, execute como administrador:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

## Produção

1. Faça backup antes de aplicar migrações.
2. Aponte `DATABASE_URL` para o banco de produção.
3. Execute `npx prisma migrate deploy` em um passo controlado de deploy.
4. Não execute `db:seed` em produção, a menos que queira criar ou atualizar contas e dados de demonstração.
5. Confirme que o usuário do banco tem permissão para usar a extensão e a constraint de exclusão.
6. Confirme que os planos comerciais existem. O cadastro público cria uma assinatura `PENDING_PAYMENT` e o painel só libera após o checkout no Pagar.me ou a ativação manual pelo superadmin.

O comando `npm run build` executa `prisma generate`, mas não aplica migrações. Isso evita alterações de schema durante o build da Vercel. Veja [DEPLOY.md](DEPLOY.md).

## Manutenção

- `RateLimitBucket` cresce com tentativas de login, reserva e cancelamento. O código remove buckets expirados ocasionalmente; em volumes maiores, agende uma limpeza periódica.
- `AuditLog` e `Notification` crescem com o uso. Defina uma política de retenção compatível com a operação e com a LGPD.
- `Payment` usa índices únicos para `providerPaymentId` e `providerEventId`, garantindo idempotência do webhook.
- `Appointment` guarda nomes de serviço e profissional no momento da reserva, preservando o histórico mesmo se o cadastro mudar depois.

## Backup e restauração

Use os recursos do provedor PostgreSQL. Para uma cópia manual:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=agendamentoon.dump
pg_restore --dbname="$DATABASE_URL" --clean --if-exists agendamentoon.dump
```

Teste a restauração em um banco separado antes de usar o procedimento em produção.
