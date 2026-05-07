export const DATA = {
  id: 'root',
  text: 'Implementação GHL\nDr Keoma',
  collapsed: false,
  children: [
    { id: 'q1', text: '1. Qualificação Automática', collapsed: false, pal: 0, children: [
      { id: 'q1a', text: 'Workflow: Menu Inicial', collapsed: true, children: [
        { id: 'q1a1', text: 'Trigger: Novo contato WhatsApp', collapsed: true, children: [] },
        { id: 'q1a2', text: 'Mensagem boas-vindas + menu', collapsed: true, children: [] },
        { id: 'q1a3', text: 'Opção 1: Homologação divórcio', collapsed: true, children: [] },
        { id: 'q1a4', text: 'Opção 2: Transcrição casamento', collapsed: true, children: [] },
        { id: 'q1a5', text: 'Opção 3: Saída fiscal', collapsed: true, children: [] },
        { id: 'q1a6', text: 'Opção 4: Outros serviços', collapsed: true, children: [] }
      ] },
      { id: 'q1b', text: 'Campos Customizados', collapsed: true, children: [
        { id: 'q1b1', text: 'servico_interesse (dropdown)', collapsed: true, children: [] },
        { id: 'q1b2', text: 'status_divorcio (sim/não)', collapsed: true, children: [] },
        { id: 'q1b3', text: 'local_divorcio (texto)', collapsed: true, children: [] },
        { id: 'q1b4', text: 'nivel_urgencia (dropdown)', collapsed: true, children: [] },
        { id: 'q1b5', text: 'data_qualificacao (date)', collapsed: true, children: [] }
      ] },
      { id: 'q1c', text: 'Perguntas de Qualificação', collapsed: true, children: [
        { id: 'q1c1', text: 'P1: Já está divorciado? (Sim/Não)', collapsed: true, children: [] },
        { id: 'q1c2', text: 'P2: Onde foi o divórcio? (Cidade/Estado)', collapsed: true, children: [] },
        { id: 'q1c3', text: 'P3: Tem urgência? (Alta/Média/Baixa)', collapsed: true, children: [] },
        { id: 'q1c4', text: 'Salvar respostas nos campos custom', collapsed: true, children: [] }
      ] },
      { id: 'q1d', text: 'Sistema de Tags', collapsed: true, children: [
        { id: 'q1d1', text: 'Tag: lead_qualificado', collapsed: true, children: [] },
        { id: 'q1d2', text: 'Tag: lead_inviavel', collapsed: true, children: [] },
        { id: 'q1d3', text: 'Tag: servico_[tipo]', collapsed: true, children: [] },
        { id: 'q1d4', text: 'Tag: urgencia_[nivel]', collapsed: true, children: [] },
        { id: 'q1d5', text: 'Aplicação manual (fase 1)', collapsed: true, children: [] },
        { id: 'q1d6', text: 'Futura automação por IA', collapsed: true, children: [] }
      ] }
    ] },
    { id: 'f1', text: '3. Follow-up Automático', collapsed: false, pal: 1, children: [
      { id: 'f1a', text: 'Workflow: Follow-up 4h', collapsed: true, children: [
        { id: 'f1a1', text: 'Trigger: 4h sem resposta', collapsed: true, children: [] },
        { id: 'f1a2', text: 'Condição: status_conversa = aberta', collapsed: true, children: [] },
        { id: 'f1a3', text: 'Condição: NÃO tem tag "atendimento_finalizado"', collapsed: true, children: [] },
        { id: 'f1a4', text: 'Enviar mensagem padrão 1', collapsed: true, children: [] },
        { id: 'f1a5', text: 'Tag: followup_4h_enviado', collapsed: true, children: [] }
      ] },
      { id: 'f1b', text: 'Workflow: Follow-up 1D', collapsed: true, children: [
        { id: 'f1b1', text: 'Trigger: 1 dia (7h) sem resposta', collapsed: true, children: [] },
        { id: 'f1b2', text: 'Condição: tem tag "followup_4h_enviado"', collapsed: true, children: [] },
        { id: 'f1b3', text: 'Condição: status_conversa = aberta', collapsed: true, children: [] },
        { id: 'f1b4', text: 'Enviar mensagem padrão 2', collapsed: true, children: [] },
        { id: 'f1b5', text: 'Tag: followup_1d_enviado', collapsed: true, children: [] }
      ] },
      { id: 'f1c', text: 'Workflow: Follow-up 3D', collapsed: true, children: [
        { id: 'f1c1', text: 'Trigger: 3 dias (19h) sem resposta', collapsed: true, children: [] },
        { id: 'f1c2', text: 'Condição: tem tag "followup_1d_enviado"', collapsed: true, children: [] },
        { id: 'f1c3', text: 'Condição: status_conversa = aberta', collapsed: true, children: [] },
        { id: 'f1c4', text: 'Enviar mensagem padrão 3 (última)', collapsed: true, children: [] },
        { id: 'f1c5', text: 'Tag: followup_3d_enviado', collapsed: true, children: [] },
        { id: 'f1c6', text: 'Move para pipeline "Retrabalho/Nutrição"', collapsed: true, children: [] }
      ] },
      { id: 'f1d', text: 'Templates de Mensagens', collapsed: true, children: [
        { id: 'f1d1', text: 'Template 4h: lembrete gentil', collapsed: true, children: [] },
        { id: 'f1d2', text: 'Template 1D: reforço de valor', collapsed: true, children: [] },
        { id: 'f1d3', text: 'Template 3D: última tentativa', collapsed: true, children: [] },
        { id: 'f1d4', text: 'Todas com personalização por nome', collapsed: true, children: [] }
      ] },
      { id: 'f1e', text: 'Exceções e Filtros', collapsed: true, children: [
        { id: 'f1e1', text: 'Não enviar se: tag "atendimento_finalizado"', collapsed: true, children: [] },
        { id: 'f1e2', text: 'Não enviar se: pipeline = "Ganho"', collapsed: true, children: [] },
        { id: 'f1e3', text: 'Não enviar se: lead inviável', collapsed: true, children: [] },
        { id: 'f1e4', text: 'Respeitar horário comercial (7h-19h)', collapsed: true, children: [] }
      ] }
    ] },
    { id: 'n1', text: '5. Nutrição/Reativação', collapsed: false, pal: 2, children: [
      { id: 'n1a', text: 'Workflow: Nutrição 15D', collapsed: true, children: [
        { id: 'n1a1', text: 'Trigger: 15 dias sem decisão', collapsed: true, children: [] },
        { id: 'n1a2', text: 'Condição: NÃO está em "Ganho"', collapsed: true, children: [] },
        { id: 'n1a3', text: 'Conteúdo: explicação do serviço', collapsed: true, children: [] },
        { id: 'n1a4', text: 'Tag: nutricao_15d_enviado', collapsed: true, children: [] }
      ] },
      { id: 'n1b', text: 'Workflow: Nutrição 18D', collapsed: true, children: [
        { id: 'n1b1', text: 'Trigger: 18 dias às 7h', collapsed: true, children: [] },
        { id: 'n1b2', text: 'Conteúdo: importância de resolver', collapsed: true, children: [] },
        { id: 'n1b3', text: 'Tag: nutricao_18d_enviado', collapsed: true, children: [] }
      ] },
      { id: 'n1c', text: 'Workflow: Nutrição 21D', collapsed: true, children: [
        { id: 'n1c1', text: 'Trigger: 21 dias às 19h', collapsed: true, children: [] },
        { id: 'n1c2', text: 'Conteúdo: exemplos práticos + cases', collapsed: true, children: [] },
        { id: 'n1c3', text: 'Tag: nutricao_21d_enviado', collapsed: true, children: [] }
      ] },
      { id: 'n1d', text: 'Workflow: Nutrição 60D', collapsed: true, children: [
        { id: 'n1d1', text: 'Trigger: 60 dias (reativação final)', collapsed: true, children: [] },
        { id: 'n1d2', text: 'Conteúdo: oferta especial / novidades', collapsed: true, children: [] },
        { id: 'n1d3', text: 'Tag: nutricao_60d_enviado', collapsed: true, children: [] },
        { id: 'n1d4', text: 'Se não responder: arquivar', collapsed: true, children: [] }
      ] },
      { id: 'n1e', text: 'Biblioteca de Conteúdos', collapsed: true, children: [
        { id: 'n1e1', text: 'Explicação: como funciona cada serviço', collapsed: true, children: [] },
        { id: 'n1e2', text: 'Urgência: prazos legais e consequências', collapsed: true, children: [] },
        { id: 'n1e3', text: 'Social proof: depoimentos e cases', collapsed: true, children: [] },
        { id: 'n1e4', text: 'FAQ: dúvidas mais comuns', collapsed: true, children: [] }
      ] }
    ] },
    { id: 'p1', text: '7. Pipeline Automático', collapsed: false, pal: 3, children: [
      { id: 'p1a', text: 'Pipeline: Comercial', collapsed: true, children: [
        { id: 'p1a1', text: 'Stage: Base (entrada)', collapsed: true, children: [] },
        { id: 'p1a2', text: 'Stage: Primeiro Contato', collapsed: true, children: [] },
        { id: 'p1a3', text: 'Stage: Em Qualificação', collapsed: true, children: [] },
        { id: 'p1a4', text: 'Stage: Reunião Agendada', collapsed: true, children: [] },
        { id: 'p1a5', text: 'Stage: Proposta/Negociação (manual)', collapsed: true, children: [] },
        { id: 'p1a6', text: 'Stage: Aguardando Documentação (manual)', collapsed: true, children: [] },
        { id: 'p1a7', text: 'Stage: Aguardando Assinatura (manual)', collapsed: true, children: [] },
        { id: 'p1a8', text: 'Stage: Aguardando Pagamento (manual)', collapsed: true, children: [] },
        { id: 'p1a9', text: 'Stage: Ganho', collapsed: true, children: [] },
        { id: 'p1a10', text: 'Stage: Retrabalho/Nutrição', collapsed: true, children: [] }
      ] },
      { id: 'p1b', text: 'Automações de Movimentação', collapsed: true, children: [
        { id: 'p1b1', text: 'Base → Primeiro Contato (ao responder)', collapsed: true, children: [] },
        { id: 'p1b2', text: 'Primeiro Contato → Qualificação (ao escolher serviço)', collapsed: true, children: [] },
        { id: 'p1b3', text: 'Qualificação → Reunião Agendada (ao agendar)', collapsed: true, children: [] },
        { id: 'p1b4', text: 'Qualquer → Retrabalho (após 3 follow-ups)', collapsed: true, children: [] }
      ] },
      { id: 'p1c', text: 'Campos de Pipeline', collapsed: true, children: [
        { id: 'p1c1', text: 'valor_proposta (currency)', collapsed: true, children: [] },
        { id: 'p1c2', text: 'data_reuniao (datetime)', collapsed: true, children: [] },
        { id: 'p1c3', text: 'responsavel (user)', collapsed: true, children: [] },
        { id: 'p1c4', text: 'observacoes (textarea)', collapsed: true, children: [] }
      ] },
      { id: 'p1d', text: 'Notificações Automáticas', collapsed: true, children: [
        { id: 'p1d1', text: 'Novo lead qualificado → notifica equipe', collapsed: true, children: [] },
        { id: 'p1d2', text: 'Reunião agendada → lembra 1h antes', collapsed: true, children: [] },
        { id: 'p1d3', text: 'Documento pendente → lembra após 2 dias', collapsed: true, children: [] },
        { id: 'p1d4', text: 'Pagamento pendente → lembra diariamente', collapsed: true, children: [] }
      ] }
    ] },
    { id: 'd1', text: 'Dashboards e Relatórios', collapsed: false, pal: 3, children: [
      { id: 'd1a', text: 'Métricas de Conversão', collapsed: true, children: [
        { id: 'd1a1', text: 'Taxa conversão por etapa', collapsed: true, children: [] },
        { id: 'd1a2', text: 'Tempo médio em cada stage', collapsed: true, children: [] },
        { id: 'd1a3', text: 'Leads por origem/canal', collapsed: true, children: [] }
      ] },
      { id: 'd1b', text: 'Performance da Equipe', collapsed: true, children: [
        { id: 'd1b1', text: 'Atendimentos por atendente', collapsed: true, children: [] },
        { id: 'd1b2', text: 'Taxa de fechamento individual', collapsed: true, children: [] },
        { id: 'd1b3', text: 'Tempo médio de resposta', collapsed: true, children: [] }
      ] },
      { id: 'd1c', text: 'Análise de Perdas', collapsed: true, children: [
        { id: 'd1c1', text: 'Motivos de perda (tags)', collapsed: true, children: [] },
        { id: 'd1c2', text: 'Etapas com maior abandono', collapsed: true, children: [] },
        { id: 'd1c3', text: 'Oportunidades de melhoria', collapsed: true, children: [] }
      ] }
    ] },
    { id: 'c1', text: 'Configurações Técnicas', collapsed: false, pal: 4, children: [
      { id: 'c1a', text: 'WhatsApp Business API', collapsed: true, children: [
        { id: 'c1a1', text: 'Verificar número no Meta BM', collapsed: true, children: [] },
        { id: 'c1a2', text: 'Conectar ao GHL', collapsed: true, children: [] },
        { id: 'c1a3', text: 'Templates aprovados pelo Meta', collapsed: true, children: [] },
        { id: 'c1a4', text: 'Limite de mensagens (tier do número)', collapsed: true, children: [] }
      ] },
      { id: 'c1c', text: 'Fuso Horário', collapsed: true, children: [
        { id: 'c1c1', text: 'Account Settings → America/Sao_Paulo', collapsed: true, children: [] },
        { id: 'c1c2', text: 'Todos workflows respeitam fuso', collapsed: true, children: [] },
        { id: 'c1c3', text: 'Horário comercial: 7h-19h', collapsed: true, children: [] }
      ] },
      { id: 'c1d', text: 'Permissões e Usuários', collapsed: true, children: [
        { id: 'c1d1', text: 'Admin: acesso total', collapsed: true, children: [] },
        { id: 'c1d2', text: 'Atendentes: apenas conversas', collapsed: true, children: [] },
        { id: 'c1d3', text: 'Visualizadores: apenas relatórios', collapsed: true, children: [] }
      ] },
      { id: 'c1e', text: 'Mensagens Rápidas', collapsed: true, children: [
        { id: 'c1e1', text: 'Saudação inicial', collapsed: true, children: [] },
        { id: 'c1e2', text: 'Pedido de documentação', collapsed: true, children: [] },
        { id: 'c1e3', text: 'Informações de pagamento', collapsed: true, children: [] },
        { id: 'c1e4', text: 'Encerramento de atendimento', collapsed: true, children: [] }
      ] },
      { id: 'c1f', text: 'Integrações Externas', collapsed: true, children: [
        { id: 'c1f1', text: 'Google Calendar (agendamentos)', collapsed: true, children: [] }
      ] }
    ] }
  ]
}
