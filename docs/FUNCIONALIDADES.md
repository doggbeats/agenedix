# Funcionalidades implementadas

O AgendamentoON é um SaaS multiestabelecimento. Cada negócio opera com isolamento total de dados e uma página pública própria. A plataforma central gerencia planos, assinaturas, pagamentos e auditoria.

## Site público

- Landing page em `/` com apresentação da plataforma, planos, papéis e chamada para cadastro.
- Diretório de agendas em `/agendar`, com busca por nome, segmento ou endereço.
- Página por estabelecimento em `/agendar/[slug]`, com marca própria.
- Branding configurável: cor principal, secundária, fundo, texto, botões, fonte, estilo de botão, capa, galeria, tagline e redes sociais.
- Seções condicionais: serviços, equipe, galeria, horários, endereço e política de cancelamento.
- Serviços agrupados por categoria, com duração, preço e profissionais habilitados.
- Seleção de profissional ou opção “qualquer profissional”.
- Datas limitadas pelos dias de funcionamento e pela antecedência máxima.
- Horários calculados no servidor; a página exibe carregamento, erro e ausência de horários.
- Nenhum horário ocupado, bloqueado, fora da jornada ou fora da antecedência mínima é exibido.
- Formulário com nome, telefone, e-mail opcional, observações e consentimento.
- Reserva revalidada no servidor dentro de transação serializável.
- Constraint de exclusão no PostgreSQL impede sobreposição do mesmo profissional.
- Confirmação com protocolo, token, status, detalhes, WhatsApp, Google Agenda, download `.ics` e cancelamento dentro do prazo.
- Página pública indisponível quando o estabelecimento está suspenso, com a página desativada ou com assinatura sem período válido.
- Rotas de disponibilidade e criação de reserva também validam a assinatura no servidor.

## Cadastro e autenticação

- Cadastro de estabelecimento em `/cadastro`, com criação de tenant, branding inicial, unidade padrão, assinatura de teste de 7 dias e usuário `OWNER`.
- Login por e-mail e senha com sessão em banco.
- Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Logout com remoção da sessão no banco.
- Recuperação de senha por e-mail com token de uso único, validade limitada e invalidação de todas as sessões.
- Verificação de e-mail com token de uso único e validade de 24 horas.
- Redirecionamento para onboarding após o cadastro.
- Usuário sem vínculo ativo não acessa o painel.

## Painel do estabelecimento

### Visão geral

- Indicadores reais do dia, próximos atendimentos e pendências.
- Agenda do dia com ações de WhatsApp e alteração de status.
- Link da página pública e atalhos para as áreas principais.
- Banner de onboarding enquanto a configuração inicial não for concluída.

### Onboarding

- Checklist em cinco etapas: conta, serviços, profissionais, horários e identidade visual.
- Progresso calculado a partir dos dados reais do estabelecimento.
- Conclusão explícita ou opção de continuar depois.

### Agenda

- Visão diária e semanal.
- Navegação por data e retorno para hoje.
- Filtro por profissional e agrupamento por horário.
- Bloqueios e exceções de agenda visíveis no contexto do dia.
- Criação manual de agendamento pelo painel.

### Agendamentos

- Busca e filtros por data, status, profissional e cliente.
- Criação manual com cálculo de disponibilidade.
- Confirmação, conclusão, cancelamento e marcação de falta.
- Remarcação com revalidação de horário.
- Motivo de cancelamento e histórico de eventos.
- Envio de mensagem pronta por WhatsApp.

### Serviços

- Criação e edição de serviços.
- Preço, duração, buffer, categoria, imagem e descrição.
- Associação de profissionais habilitados.
- Ativação, desativação e disponibilidade para agendamento online.
- Exclusão lógica e limite conforme o plano.

### Profissionais

- Cadastro com bio, foto, especialidades e serviços.
- Jornada por dia da semana, com início, fim e intervalo.
- Ativação, desativação e vínculo de acesso ao painel.
- Limite conforme o plano.

### Clientes

- Base de clientes do estabelecimento.
- Histórico de atendimentos e status.
- Busca por nome, telefone e e-mail.
- Anonimização de dados pessoais com confirmação explícita.

### Relatórios

- Receita e quantidade de atendimentos por período.
- Distribuição por status, serviço e profissional.
- Movimento diário com gráfico proporcional.
- Exportação CSV autenticada e limitada ao estabelecimento.

### Equipe

- Convite de administrador ou profissional (somente `OWNER`).
- Senha temporária definida pelo proprietário; usuário existente mantém a senha atual.
- Edição de papel e vínculo com profissional.
- Remoção de vínculo sem apagar o usuário compartilhado.
- Limite de usuários conforme o plano.
- Auditoria de convites, alterações e remoções.

### Plano e cobrança

- Plano atual, status, período de teste e limites.
- Comparação entre planos ativos.
- Histórico de pagamentos.
- Checkout em `/checkout` com Pix ou cartão de crédito via Pagar.me.
- Tokenização do cartão no navegador; o servidor recebe apenas o token.
- Teste de 7 dias no cartão com primeira cobrança automática no 8º dia.
- Pix com pagamento imediato do primeiro período e liberação após o webhook.
- Troca de plano imediata para assinaturas ativas no cartão.
- Aviso quando a assinatura não está liberando a página pública.
- Bloqueio do painel enquanto a assinatura não está paga ou em teste válido.

### Personalização

- Edição de cores, fonte, estilo de botão, capa, galeria, tagline e redes sociais.
- Prévia em tempo real.
- Controles para exibir ou ocultar seções.
- Aplicação imediata na página pública.

### Configurações

- Dados do estabelecimento, endereço, contato, descrição, logo, cor e fuso.
- Slug público com validação de reserva e unicidade.
- Confirmação automática ou manual de reservas.
- Antecedência mínima, limite de dias, intervalo de horários e prazo de cancelamento.
- Política de cancelamento e modelo de mensagem de WhatsApp.
- Horários de funcionamento por dia da semana, com intervalo.
- Bloqueios de agenda por data, período e profissional.
- Exceções de agenda por data e profissional.
- Preferências de notificação e antecedência dos lembretes.

## Administração da plataforma

- Acesso restrito a usuários com `isPlatformAdmin`.
- Visão geral com totais reais de estabelecimentos, assinaturas, pagamentos e pendências.
- Estabelecimentos: busca, filtro, suspensão/reativação, assinatura e acesso à página pública.
- Planos: criação, edição, ativação, limites, preços e destaque.
- Pagamentos: registro manual para exceções, ativação de assinatura, extensão de período, filtros e histórico.
- Webhook do Pagar.me com HMAC, idempotência e ativação automática.
- Webhook genérico de pagamentos com HMAC, idempotência e ativação automática.
- Auditoria: filtros por ação e estabelecimento, paginação e metadados.
- Nenhum indicador é fictício: todos vêm do banco.

## Notificações

- E-mail transacional via Resend quando `RESEND_API_KEY` está configurada; sem chave, o conteúdo vai para o log.
- Notificações de reserva criada, confirmada, cancelada e remarcada.
- Lembrete de agendamento conforme `reminderHours` do estabelecimento.
- Registro de notificações com status, erro, destinatário e chave de deduplicação.
- Rota de cron protegida por `CRON_SECRET`.

## Segurança e auditoria

- Autorização no servidor em todas as server actions e rotas protegidas.
- Consultas filtradas por `establishmentId` e vínculo do usuário.
- Papéis `OWNER`, `ADMIN` e `PROFESSIONAL` com escopos distintos.
- Token de sessão aleatório; somente o hash SHA-256 é armazenado.
- Tokens de redefinição, verificação e acesso público também armazenados como hash.
- Senhas com bcrypt.
- Rate limiting em login, reserva e cancelamento.
- Validação Zod nos formulários e nas rotas.
- Constraint de exclusão no PostgreSQL para impedir sobreposição de horários.
- Registros de auditoria para ações sensíveis.
- Anonimização de cliente sem apagar o histórico estatístico.
- Webhook de pagamentos exige assinatura HMAC e é idempotente.

## Fora do escopo desta versão

- Gateway de cartão, checkout automático, nota fiscal e conciliação bancária.
- Envio automático de WhatsApp ou push.
- Upload de imagens para object storage. Logo, capa e galeria são anexadas e salvas como data URL no banco; a foto de profissional usa URL externa validada.
- Aplicativo móvel nativo.
- Multiunidade operacional completa: o modelo `Unit` existe e o plano `Equipe` permite 3 unidades, mas a interface de gestão de unidades ainda não foi exposta.

## Dependências externas

Consulte [CONFIGURACAO-EXTERNA.md](CONFIGURACAO-EXTERNA.md). As principais são PostgreSQL, URL pública, Resend (opcional), segredo de webhook e segredo de cron.
