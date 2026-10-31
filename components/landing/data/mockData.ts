import { BusinessNiche, PricingPlan, Testimonial } from '../types';

export const BUSINESS_NICHES: BusinessNiche[] = [
  {
    id: 'barbearia',
    name: 'Barbearias & Salões Masculinos',
    label: 'Barbearia',
    iconName: 'Scissors',
    tagline: 'Chega de perder tempo no WhatsApp enquanto corta cabelo',
    description: 'Seus clientes escolhem barbeiro, horário e combo pelo link na bio do Instagram.',
    sampleAppointments: [
      {
        id: 'b1',
        time: '09:00',
        duration: '40 MIN',
        service: 'Corte masculino',
        professional: 'Rafael',
        status: 'Confirmado',
        price: 'R$ 60',
        client: 'Lucas Mendes'
      },
      {
        id: 'b2',
        time: '10:30',
        duration: '40 MIN',
        service: 'Corte + barba',
        professional: 'Bruno',
        status: 'Pendente',
        price: 'R$ 95',
        client: 'Guilherme Silva'
      },
      {
        id: 'b3',
        time: '14:00',
        duration: '40 MIN',
        service: 'Barba completa',
        professional: 'Diego',
        status: 'Confirmado',
        price: 'R$ 45',
        client: 'Carlos Eduardo'
      },
      {
        id: 'b4',
        time: '16:00',
        duration: '50 MIN',
        service: 'Corte degradê navalhado',
        professional: 'Rafael',
        status: 'Em atendimento',
        price: 'R$ 70',
        client: 'Matheus Costa'
      }
    ],
    services: [
      { id: 's1', title: 'Corte Masculino Premium', duration: '40 min', price: 'R$ 60', description: 'Lavagem especial, corte na tesoura ou máquina e finalização com pomada.' },
      { id: 's2', title: 'Barba Terapia com Toalha Quente', duration: '35 min', price: 'R$ 45', description: 'Esfoliação facial, toalha quente, navalha e óleo de hidratação.' },
      { id: 's3', title: 'Combo Cabelo + Barba', duration: '60 min', price: 'R$ 95', description: 'Experiência completa com direito a cerveja cortesia da casa.' },
      { id: 's4', title: 'Platinado / Selagem', duration: '90 min', price: 'R$ 150', description: 'Tratamento capilar intensivo e tonalização profissional.' },
    ],
    professionals: [
      { id: 'p1', name: 'Rafael Santos', role: 'Barbeiro Master', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', rating: '4.9 (340)' },
      { id: 'p2', name: 'Bruno Alencar', role: 'Especialista em Barba', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', rating: '5.0 (210)' },
      { id: 'p3', name: 'Diego Nogueira', role: 'Visagista', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', rating: '4.9 (185)' }
    ]
  },
  {
    id: 'estetica',
    name: 'Clínicas de Estética & Biomédicos',
    label: 'Clínica & Estética',
    iconName: 'Sparkles',
    tagline: 'Fidelize suas pacientes com lembretes automáticos e ficha clínica',
    description: 'Evite salas de espera lotadas e cobre sinais de reserva para blindar seu horário.',
    sampleAppointments: [
      {
        id: 'e1',
        time: '09:30',
        duration: '60 MIN',
        service: 'Limpeza de pele profunda',
        professional: 'Dra. Camila',
        status: 'Confirmado',
        price: 'R$ 180',
        client: 'Mariana Duarte'
      },
      {
        id: 'e2',
        time: '11:00',
        duration: '45 MIN',
        service: 'Harmonização facial (retorno)',
        professional: 'Dr. Roberto',
        status: 'Confirmado',
        price: 'R$ 450',
        client: 'Fernanda Lima'
      },
      {
        id: 'e3',
        time: '14:30',
        duration: '50 MIN',
        service: 'Drenagem linfática',
        professional: 'Talita',
        status: 'Pendente',
        price: 'R$ 140',
        client: 'Juliana Pires'
      },
      {
        id: 'e4',
        time: '16:15',
        duration: '40 MIN',
        service: 'Protocolo Revitalize',
        professional: 'Dra. Camila',
        status: 'Confirmado',
        price: 'R$ 290',
        client: 'Beatriz Rocha'
      }
    ],
    services: [
      { id: 'se1', title: 'Limpeza de Pele Profunda', duration: '60 min', price: 'R$ 180', description: 'Com vapor de ozônio, extração indolor e máscara de LED calmante.' },
      { id: 'se2', title: 'Aplicação de Toxina Botulínica', duration: '40 min', price: 'R$ 680', description: 'Avaliação detalhada e aplicação em áreas de mímica facial.' },
      { id: 'se3', title: 'Drenagem Linfática Corporal', duration: '50 min', price: 'R$ 140', description: 'Massagem terapêutica para redução de retenção e bem-estar.' },
      { id: 'se4', title: 'Laserterapia e Rejuvenescimento', duration: '45 min', price: 'R$ 350', description: 'Estímulo de colágeno e clareamento de manchas suaves.' },
    ],
    professionals: [
      { id: 'pe1', name: 'Dra. Camila Rocha', role: 'Biomédica Esteta', avatar: 'https://images.unsplash.com/photo-1594824813524-11116b438258?auto=format&fit=crop&w=200&q=80', rating: '5.0 (420)' },
      { id: 'pe2', name: 'Dr. Roberto Meireles', role: 'Dermatologia Estética', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80', rating: '4.9 (310)' },
      { id: 'pe3', name: 'Talita Silveira', role: 'Esteticista Corporal', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80', rating: '4.9 (190)' }
    ]
  },
  {
    id: 'psicologia',
    name: 'Psicologia & Terapeutas',
    label: 'Psicologia & Terapia',
    iconName: 'Brain',
    tagline: 'Privacidade total, confirmação automática e link do Google Meet',
    description: 'Gerencie atendimentos presenciais e online com links de videochamada criados sozinhos.',
    sampleAppointments: [
      {
        id: 'p_1',
        time: '08:00',
        duration: '50 MIN',
        service: 'Sessão TCC Online (Meet)',
        professional: 'Psi. Helena',
        status: 'Confirmado',
        price: 'R$ 190',
        client: 'Ana Cecília'
      },
      {
        id: 'p_2',
        time: '10:00',
        duration: '50 MIN',
        service: 'Psicoterapia Presencial',
        professional: 'Psi. Helena',
        status: 'Confirmado',
        price: 'R$ 210',
        client: 'Ricardo Vianna'
      },
      {
        id: 'p_3',
        time: '14:00',
        duration: '50 MIN',
        service: 'Terapia de Casal',
        professional: 'Psi. Marco',
        status: 'Pendente',
        price: 'R$ 280',
        client: 'Pedro & Luísa'
      }
    ],
    services: [
      { id: 'sp1', title: 'Psicoterapia Individual (Online)', duration: '50 min', price: 'R$ 190', description: 'Atendimento seguro via Google Meet integrado automaticamente.' },
      { id: 'sp2', title: 'Consulta Presencial em Consultório', duration: '50 min', price: 'R$ 220', description: 'Espaço acolhedor com isolamento acústico e recepção privativa.' },
      { id: 'sp3', title: 'Terapia de Casal', duration: '75 min', price: 'R$ 290', description: 'Mediação e acompanhamento relacional focado em soluções.' }
    ],
    professionals: [
      { id: 'pp1', name: 'Psi. Helena Siqueira', role: 'Psicóloga Clínica CRP 06/1429', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', rating: '5.0 (180)' },
      { id: 'pp2', name: 'Psi. Marco Valente', role: 'Terapeuta Sistêmico', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', rating: '4.9 (125)' }
    ]
  },
  {
    id: 'studio',
    name: 'Studios de Pilates, Yoga & Personal',
    label: 'Studio & Personal',
    iconName: 'Activity',
    tagline: 'Vagas limitadas por turma, check-in e lista de espera inteligente',
    description: 'Quando um aluno cancela, o próximo da fila é notificado no WhatsApp na hora.',
    sampleAppointments: [
      {
        id: 'st1',
        time: '07:00',
        duration: '50 MIN',
        service: 'Pilates Aparelhos (3 vagas)',
        professional: 'Profª. Larissa',
        status: 'Confirmado',
        price: 'R$ 80',
        client: 'Turma Manhã (Cheia)'
      },
      {
        id: 'st2',
        time: '09:00',
        duration: '60 MIN',
        service: 'Personal Training VIP',
        professional: 'Prof. Thiago',
        status: 'Confirmado',
        price: 'R$ 120',
        client: 'Renato Faria'
      },
      {
        id: 'st3',
        time: '17:30',
        duration: '50 MIN',
        service: 'Vinyasa Flow Yoga',
        professional: 'Profª. Larissa',
        status: 'Confirmado',
        price: 'R$ 75',
        client: 'Turma Tarde'
      }
    ],
    services: [
      { id: 'ss1', title: 'Aula de Pilates nos Aparelhos', duration: '50 min', price: 'R$ 80', description: 'Reformer, Cadillac e Chair com foco em postura e fortalecimento.' },
      { id: 'ss2', title: 'Consultoria Personal Trainer VIP', duration: '60 min', price: 'R$ 120', description: 'Treinamento individualizado com periodização personalizada.' },
      { id: 'ss3', title: 'Hatha & Vinyasa Yoga', duration: '60 min', price: 'R$ 70', description: 'Respiração consciente, flexibilidade e alívio do estresse.' }
    ],
    professionals: [
      { id: 'ps1', name: 'Larissa Fontes', role: 'Instrutora de Pilates e Fisioterapeuta', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80', rating: '4.9 (240)' },
      { id: 'ps2', name: 'Thiago Barreto', role: 'Personal Trainer CREF 1204', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80', rating: '5.0 (175)' }
    ]
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'solo',
    name: 'Solo Autônomo',
    priceMonthly: 49,
    priceAnnual: 39,
    description: 'Para quem trabalha sozinho e quer parar de responder agendamentos fora do expediente.',
    features: [
      '1 Profissional / Agenda individual',
      'Agendamentos ilimitados por mês',
      'Página pública exclusiva (link na bio)',
      'Lembretes via WhatsApp automáticos',
      'Sincronização com Google Agenda',
      'Cobrança de sinal via PIX integrada',
      'Suporte via chat em horário comercial'
    ],
    ctaText: 'Testar Solo por 7 dias'
  },
  {
    id: 'equipe',
    name: 'Equipe & Studio',
    badge: 'Mais Escolhido',
    isPopular: true,
    priceMonthly: 99,
    priceAnnual: 79,
    description: 'Perfeito para barbearias, clínicas e salões com múltiplos profissionais e comissões.',
    features: [
      'Até 6 Profissionais com agendas próprias',
      'Cálculo automático de comissões por colaborador',
      'Painel de controle com permissões personalizadas',
      'Lembretes WhatsApp com nome do profissional',
      'Relatório completo de faturamento & DRE básico',
      'Fila de espera inteligente quando lotado',
      'Cobrança de sinal e pagamento integral no agendamento',
      'Suporte VIP via WhatsApp prioritário'
    ],
    ctaText: 'Começar teste gratuito'
  },
  {
    id: 'pro',
    name: 'Pro & Franquias',
    badge: 'Escala Total',
    priceMonthly: 179,
    priceAnnual: 149,
    description: 'Para redes, múltiplos endereços e operações que exigem máxima flexibilidade e API.',
    features: [
      'Profissionais ilimitados',
      'Multi-unidades / Múltiplos endereços',
      'API aberta & Webhooks para CRM e ERP',
      'Domínio próprio personalizado (suaempresa.com.br)',
      'Relatórios avançados de retenção e LTV',
      'Gerente de conta dedicado',
      'Treinamento ao vivo para toda a equipe',
      'SLA garantido de 99.9% de uptime'
    ],
    ctaText: 'Falar com especialista'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Guilherme Toledo',
    role: 'Fundador da Barbearia Don Corleone (3 unidades)',
    company: 'São Paulo, SP',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    content: 'Antes do Agendix, perdíamos pelo menos 3 horas por dia respondendo no WhatsApp e anotando no papel. Nosso índice de no-show caiu de 22% para menos de 3% no primeiro mês com o lembrete automático.',
    highlightMetric: '-85% de faltas de clientes',
    rating: 5
  },
  {
    id: 't2',
    name: 'Dra. Mariana Castro',
    role: 'Biomédica & Proprietária da Lumina Estética',
    company: 'Curitiba, PR',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    content: 'O design da página pública do Agendix passa um ar de sofisticação absurdo. Nossas pacientes elogiam a facilidade de agendar direto pelo Instagram e o pagamento do sinal pelo PIX eliminou o risco de cadeira vazia.',
    highlightMetric: '+42% de faturamento líquido',
    rating: 5
  },
  {
    id: 't3',
    name: 'Felipe Albuquerque',
    role: 'Head de Operações no Studio Flow Pilates',
    company: 'Belo Horizonte, MG',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    content: 'A divisão de comissão entre nossos 8 instrutores era uma dor de cabeça todo final de mês. Com o Agendix, o extrato sai com um clique, transparente para nós e para a equipe. Simplesmente indispensável.',
    highlightMetric: '15h poupadas por mês na gestão',
    rating: 5
  }
];

export const FAQ_ITEMS = [
  {
    q: 'Como funciona o teste grátis de 7 dias?',
    a: 'Você cria sua conta em menos de 1 minuto sem precisar cadastrar cartão de crédito. Durante os 7 dias, você tem acesso irrestrito a todas as ferramentas, incluindo lembretes por WhatsApp e página pública para testar com clientes reais.'
  },
  {
    q: 'Os lembretes por WhatsApp gastam meus créditos ou preciso de chip extra?',
    a: 'Não! O Agendix já conta com infraestrutura de WhatsApp integrada de alta entrega. Você não precisa comprar chip adicional nem deixar nenhum celular ligado para disparar as mensagens.'
  },
  {
    q: 'Posso cobrar sinal de confirmação pelo PIX?',
    a: 'Sim. Você pode configurar para exigir uma taxa de reserva (por exemplo 30% ou 50%) ou o valor total do serviço antes da confirmação do agendamento. O dinheiro vai direto para a sua conta bancária via PIX.'
  },
  {
    q: 'Posso sincronizar com o Google Calendar / Outlook?',
    a: 'Com certeza! A sincronização é bidirecional em tempo real: quando você marca um compromisso particular na sua agenda pessoal, o horário é bloqueado no Agendix para que nenhum cliente agende por cima.'
  },
  {
    q: 'Minha equipe consegue acessar pelo celular?',
    a: 'Sim. O Agendix funciona perfeitamente em qualquer smartphone, tablet ou computador. Cada profissional pode ter seu próprio login para visualizar apenas seus horários e comissões, sem ver dados confidenciais do negócio.'
  },
  {
    q: 'Tem fidelidade ou multa de cancelamento?',
    a: 'Zero fidelidade. Você pode cancelar sua assinatura com apenas um clique a qualquer momento no painel, sem contratos longos ou letras miúdas.'
  }
];
