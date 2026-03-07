# Dentrics - Sistema de Gestão Odontológica

## Módulos Principais
- [x] Dashboard com métricas e gráficos
- [x] Cadastro e gerenciamento de pacientes
- [x] Agenda de consultas com calendário
- [x] Prontuário eletrônico completo
- [x] Orçamentos com odontograma interativo

## Gestão Administrativa
- [x] Cadastro de procedimentos e valores
- [x] Cadastro de dentistas/profissionais
- [x] Controle financeiro (receitas/despesas)
- [x] Gestão de convênios
- [x] Controle de estoque
- [x] Gestão de próteses completa (pedidos, laboratórios, tipos)

## Áreas Especializadas
- [x] Área do Atendente com sistema de filas
- [x] Área do Orçamentista
- [x] Área do Dentista (consultas do dia, prontuários rápidos)
- [x] Área do Ortodontista (acompanhamento de tratamentos)
- [x] Área do Implantodontista (planejamento de implantes)
- [x] Área do Protesista (pedidos de próteses)

## Funcionalidades Extras
- [x] Relatórios e análises
- [x] Configurações da clínica
- [x] Gestão de usuários e permissões
- [x] Anamnese do paciente

## Novas Funcionalidades (Dentrics)
- [x] Dashboard avançado com gráficos de evolução
- [x] Gráfico de formas de pagamento
- [x] Taxa de conversão de orçamentos
- [x] Performance mensal
- [x] Filtro por período no dashboard
- [x] QR Code Check-in para pacientes
- [x] Painel TV para sala de espera
- [x] Análise de radiografias com IA

## Notificações WhatsApp
- [x] Página de configuração de notificações
- [x] Templates de mensagens
- [x] Histórico de notificações enviadas
- [x] Envio de lembretes de consultas
- [x] Notificação quando paciente é chamado na fila

## Sistema de Permissões
- [x] Definição de roles (Admin, Dentista, Atendente, Orçamentista)
- [x] Controle de acesso por módulo
- [x] Matriz de permissões (visualizar, criar, editar, excluir)
- [x] Modelos predefinidos de perfis
- [x] Interface de configuração de permissões

## Design e UX
- [x] Layout responsivo com sidebar
- [x] Tema moderno com cores profissionais
- [x] Componentes reutilizáveis
- [x] Estados vazios e loading

## Bugs Reportados
- [x] Menu lateral (sidebar) sumiu - restaurar navegação

## Fluxo de Logística de Atendimento
- [x] Configuração de consultórios (adicionar/editar/remover)
- [x] Área do Atendente: colocar paciente na fila por profissional
- [x] Área do Atendente: receber paciente de volta após atendimento
- [x] Área do Atendente: cobrar valor do orçamento
- [x] Área do Atendente: encaminhar para outra especialidade ou finalizar
- [x] Área do Atendente: agendar retorno
- [x] Área do Orçamentista: receber paciente da fila
- [x] Área do Orçamentista: fazer avaliação e definir preço
- [x] Área do Orçamentista: enviar paciente de volta ao atendente
- [x] Área do Dentista: receber paciente da fila
- [x] Área do Dentista: escolher consultório para atendimento
- [x] Área do Dentista: finalizar e enviar de volta ao atendente
- [x] Área do Ortodontista: mesmo fluxo do dentista
- [x] Área do Implantodontista: mesmo fluxo do dentista
- [x] Área do Protesista: mesmo fluxo do dentista
- [x] Painel TV: mostrar paciente sendo chamado
- [x] Painel TV: mostrar qual consultório o paciente deve ir
- [x] Painel TV: atualização em tempo real das filas


## Correções e Melhorias Solicitadas
- [x] Bug: Não consegue chamar paciente na fila (funciona, precisa selecionar consultório)
- [x] Renomear sistema de OdontoCloud para Dentrics
- [x] Aplicar logo enviada pelo usuário
- [x] Redesign com cores laranja/âmbar combinando com a logo
- [x] Sidebar com cor de fundo diferente do conteúdo principal (marrom escuro)
- [x] Configurações: opção de personalizar cor do sistema (6 temas predefinidos)
- [x] Configurações: opção de modo escuro


## Ajustes no Fluxo de Atendimento
- [x] Orçamentista: integrar odontograma e tratamento na mesma tela ao chamar paciente
- [x] Orçamentista: enviar paciente de volta ao atendente com tipo de tratamento e valor
- [x] Especialistas (Dentista, Ortodontista, Implantodontista, Protesista): remover opção de encaminhar para outras áreas
- [x] Especialistas: ao finalizar, encaminhar APENAS para o Atendente
- [x] Atendente: receber informações do tratamento e valor do orçamentista


## Correções Solicitadas (Nova Rodada)
- [x] Prontuário completo igual ao dentricsi.manus.space (todas as abas e funcionalidades)
- [x] Área do Atendente: adicionar opção "Agendar" além de "Finalizar"
- [x] Pagamento: quando confirmar, mudar status para "Pago"
- [x] Financeiro: corrigir contagem de pagamentos (integrado com fila)
- [x] Financeiro: adicionar opção de editar transação
- [x] Financeiro: adicionar opção de excluir com tachado (não apagar, marcar como cancelado)
- [x] Financeiro: campo de comentário para motivo da exclusão


## Módulo de Prontuário
- [x] Criar página de Prontuário como módulo separado no menu
- [x] Interface moderna com listagem de pacientes
- [x] Acesso rápido ao prontuário de cada paciente
- [x] Adicionar ao menu lateral


## Abas do Prontuário (Atualização)
- [x] Aba Documentos (Atestados, Receituários, Termos, Contratos)
- [x] Aba Recibos
- [x] Aba Imagens
- [x] Aba Galeria
- [x] Aba Histórico de Fotos
- [x] Aba Diagnóstico IA
- [x] Layout responsivo para mobile (abas em duas linhas)
- [x] Modal de Novo Documento com tipos (Atestado, Receituário, Termo, Contrato)


## Integrações (Nova Transferência)
- [x] Integração com Stripe para processamento de pagamentos
- [x] Webhook do Stripe configurado em /api/stripe/webhook
- [x] Checkout Session para pagamentos de tratamentos
- [x] Integração com S3 para armazenamento de arquivos (já configurado)
- [x] Sistema de notificações automáticas (já configurado)


## Correções Solicitadas (29/01/2026)
- [x] Análise de IA: adicionar opção de upload de foto do celular/computador
- [x] Prontuário: corrigir funcionalidade de Atestados e Documentos (opções não disponíveis)


## Correções Análise de IA (29/01/2026)
- [x] Análise de IA: integrar com LLM real para análise de radiografias
- [x] Análise de IA: integrar com referências de periódicos científicos (Journal of Dental Research, etc.)
- [x] Análise de IA: processamento assíncrono com polling automático de status


## Melhorias Painel TV (29/01/2026)
- [x] Painel TV: cores personalizáveis (8 opções de cores)
- [x] Painel TV: temas sazonais (Natal, Ano Novo, Dia dos Namorados, Carnaval, Páscoa, Inverno, Verão)
- [x] Painel TV: integração com YouTube
- [x] Painel TV: pausar vídeo automaticamente ao chamar paciente
- [x] Painel TV: YouTube volta a tocar automaticamente após 1 minuto sem chamadas

- [x] Painel TV: tema Fada com animação de 5 fadas voando até o nome do paciente

## Correções YouTube Painel TV (29/01/2026)
- [x] Corrigir YouTube não tocando vídeo/música
- [x] Adicionar opção de modo apenas áudio (som)

## Correções de UI (29/01/2026)
- [x] Painel TV: botão de configurações escondido atrás do número - movido para canto superior esquerdo
- [x] Sidebar: seção "Áreas Especializadas" escondida por padrão - agora expandida
- [x] Sidebar: seção "Sistema" escondida por padrão - agora expandida

## Correção YouTube API (29/01/2026)
- [x] Corrigir erro "Erro ao carregar API do YouTube" no Painel TV - reformulado para usar iframe embed direto

## Correção YouTube Bloqueado (29/01/2026)
- [x] YouTube bloqueado pelo Google no iframe - implementado botão para abrir em nova janela

## Player Integrado no Painel (29/01/2026)
- [x] Implementar player de mídia que toque diretamente no painel usando youtube-nocookie.com

## Ajuste Posição Engrenagem (29/01/2026)
- [x] Mover ícone de engrenagem para frente da hora no Painel TV

## Melhorias Tema Fada (29/01/2026)
- [x] Reduzir para apenas 2 fadas no tema Fada
- [x] Fadas com aparência mais realista (SVG detalhado com asas, vestido, cabelo, rosto)
- [x] Movimentos mais fluidos e naturais (animação contínua de onda)

## Correções Painel TV (29/01/2026)
- [x] Adicionar botão para desativar/remover YouTube
- [x] Fadas ficarem visíveis o tempo todo no tema Fada (não apenas quando chama paciente)
- [x] Fadas ficarem mais empolgadas quando chamar paciente

## Melhorias Painel TV - Próximos Passos (29/01/2026)
- [ ] Som de notificação (sininho mágico) quando fadas chegam ao paciente (pendente - requer arquivo de áudio)
- [x] Tema Unicórnio com arco-íris para clínicas pediátricas
- [x] Controle de velocidade das fadas nas configurações (Lento, Normal, Rápido, Muito Rápido)


## Novas Funcionalidades (29/01/2026)
- [x] Pacientes: criar aba "Pacientes do Dia" mostrando apenas pacientes com consultas agendadas para hoje
- [x] Pacientes do Dia: botão para colocar paciente na fila de espera
- [x] Dentistas: adicionar opção de ativar/desativar dentista do dia
- [x] Dentistas: mostrar hora de chegada quando ativado
- [x] Painel TV: personalizar nome da clínica (substituir "Dentrics")
- [x] Painel TV: personalizar logo da clínica


## Melhorias Painel TV - Fase 2 (29/01/2026)
- [x] Tema Borboletas: borboletas coloridas voando pela tela
- [x] Mensagens personalizadas: área para exibir avisos e comunicados da clínica

## Melhorias Painel TV - Fase 3 (30/01/2026)
- [x] Painel TV: upload de logo do dispositivo (em vez de apenas URL)


## Melhorias Painel TV - Fase 4 (30/01/2026)
- [x] Som de notificação quando paciente é chamado (sininho/campainha)
- [x] Tema Halloween (abóboras, morcegos, fantasmas)
- [x] Tema Dia das Crianças (balões, brinquedos, cores vibrantes)
- [x] Tema Copa do Mundo (bandeiras, bolas de futebol, troféu)
- [x] Sistema de slides/imagens promocionais da clínica


## Correções de Cadastro (30/01/2026)
- [x] Pacientes: corrigir salvamento de paciente não funcionando (tabelas do banco criadas)
- [x] Pacientes: tornar apenas nome e CPF campos obrigatórios (já estava configurado assim)


## Funcionalidade Ativar Paciente (30/01/2026)
- [x] Pacientes: adicionar botão "Ativar" para cada paciente na lista
- [x] Pacientes: quando ativado, paciente aparece na aba "Pacientes do Dia"
- [x] Pacientes: mostrar indicador visual de paciente ativado (badge verde "Ativo")
- [x] Atendente: mostrar apenas pacientes ativados (Pacientes do Dia)
- [x] Demais áreas especializadas: mostrar apenas pacientes ativados
- [x] Pacientes: opção de desativar paciente (remover do dia)


## Sistema de Autenticação Própria e Multi-Clínicas (30/01/2026)
- [x] Criar tabela de clínicas (clinics) com dados da clínica
- [x] Modificar tabela de usuários para autenticação própria (email/senha hash)
- [x] Criar tabela de relação usuário-clínica (user_clinics)
- [x] Implementar registro de usuário com email e senha
- [x] Implementar login com email e senha (bcrypt)
- [x] Implementar logout
- [x] Criar página de login personalizada
- [x] Criar página de registro
- [x] Criar área de admin para super-admin gerenciar clínicas
- [x] Listar clínicas cadastradas no admin
- [x] Criar/editar/excluir clínicas no admin
- [x] Associar usuários a clínicas
- [x] Adaptar dados existentes para multi-tenancy (clinicId em cada tabela)
- [x] Filtrar dados por clínica do usuário logado


## Botão de Logout (30/01/2026)
- [x] Adicionar botão "Sair" no rodapé do menu lateral
- [x] Implementar funcionalidade de logout ao clicar


## Área de Perfil do Usuário (30/01/2026)
- [x] Simplificar rodapé para mostrar apenas email clicável
- [x] Criar página de perfil do usuário (/perfil)
- [x] Adicionar opção de Sair no perfil
- [x] Adicionar seção de Assinatura no perfil
- [x] Adicionar edição de dados do usuário no perfil


## Proteção de Rotas (30/01/2026)
- [x] Implementar verificação de autenticação antes de acessar páginas protegidas
- [x] Redirecionar para /login se usuário não estiver autenticado
- [x] Manter páginas públicas (login, registro, painel-tv) acessíveis sem autenticação
- [x] Desabilitar OAuth Manus e usar apenas login próprio com email/senha
- [x] Testado: registro de novo usuário e login funcionando


## Gestão de Usuários por Clínica e Novas Áreas (30/01/2026)
- [x] Atualizar schema com cargos: atendente, dentista, protesista, ortodontista, implantodontista, buco-maxilo-facial, odontopediatria
- [x] Criar área de gestão de usuários da clínica (adicionar por email, definir cargo)
- [x] Vincular usuário à clínica com cargo específico
- [x] Criar página Área Buco-Maxilo-Facial
- [x] Criar página Área Odontopediatria
- [x] Adicionar novas áreas no menu lateral
- [ ] Filtrar acesso às áreas baseado no cargo do usuário


## Simplificar Gestão de Usuários (30/01/2026)
- [x] Remover seleção de clínica da página de gestão de usuários
- [x] Adicionar formulário direto para adicionar usuário por email e cargo
- [x] Mostrar lista de usuários cadastrados com opção de editar/remover


## Permissões por Cargo (30/01/2026)
- [x] Remover página de Permissões do menu lateral
- [x] Adicionar aba de Configurar Permissões na Gestão de Usuários
- [x] Criar tabela de permissões por cargo no banco de dados
- [x] Permitir definir quais áreas cada cargo pode acessar
- [ ] Aplicar filtro de permissões no menu lateral baseado no cargo do usuário


## Correção Gestão de Usuários (30/01/2026)
- [x] Corrigir erro "Acesso negado" ao adicionar novo usuário (permitir admin além de superadmin)


## Sistema SaaS Multi-Clínicas (30/01/2026)
- [x] Criar tabela de planos (plans) com nome, preço, recursos
- [x] Adicionar campo de plano e status de pagamento na tabela de clínicas
- [x] Adicionar campo de data de vencimento e inadimplência
- [x] Criar aba de Assinaturas no painel Super Admin
- [x] Super Admin: listar clínicas com status de plano e pagamento
- [x] Super Admin: alterar plano de uma clínica
- [x] Super Admin: marcar clínica como inadimplente
- [x] Super Admin: suspender/reativar clínicas
- [x] Super Admin: registrar pagamentos manuais
- [x] Implementar isolamento de dados por clínica (multi-tenancy)
- [x] Cada clínica só vê seus próprios pacientes, agendamentos, etc.


## Planos, Bloqueio e Multi-tenancy (30/01/2026)
- [x] Criar aba de Planos no Admin para cadastrar/editar planos
- [x] Permitir definir nome, preço e recursos de cada plano
- [x] Bloquear acesso de clínicas inadimplentes ao sistema
- [x] Mostrar tela de bloqueio para inadimplentes
- [x] Implementar multi-tenancy: vincular pacientes à clínica
- [x] Implementar multi-tenancy: vincular agendamentos à clínica
- [x] Implementar multi-tenancy: filtrar dados por clínica do usuário logado
- [x] Criar clinicProcedure para injetar clinicId automaticamente
- [x] Atualizar todas as procedures de pacientes, dentistas, procedimentos, agendamentos
- [x] Atualizar todas as procedures de orçamentos, transações, seguros, estoque
- [x] Atualizar todas as procedures de fila, cadeiras, laboratórios, próteses
- [x] Atualizar todas as procedures de AI analysis, checkins, notificações

## Bugs Reportados - Sessão Atual
- [x] Usuário não consegue cadastrar uma conta para entrar no sistema (CORRIGIDO - migrações aplicadas)
- [x] Campo openId não permitia NULL - corrigido para permitir autenticação email/senha

## Melhorias Solicitadas - Sessão Atual
- [x] Adicionar 2 pacientes de teste no sistema
- [x] Adicionar 2 consultórios de teste
- [x] Adicionar 2 dentistas: Dr. Misael Pinheiro e Dra. Rôsyelma Pinheiro
- [x] Adicionar procedimentos principais (limpeza, restaurações, cirurgia, coroa, ortodontia)
- [x] Implementar odontograma com opção de arcada decídua (toggle permanente/decíduo)
- [x] Corrigir ativação automática de pacientes ao cadastrar
- [x] Criar página funcional de QR Code check-in para pacientes se cadastrarem e acompanharem fila

## Bugs Reportados - Sessão 2
- [x] Dentistas e procedimentos de teste não aparecem no sistema publicado (CORRIGIDO - dados inseridos para clínica 30001)

## Melhorias Solicitadas - Sessão 3
- [x] Adicionar seleção de dentista na área de orçamento (similar ao seletor de consultório)
- [x] Renomear consultórios para 1, 2, 3 e 4

## Dentrics IA - Nova Funcionalidade
- [x] Criar nova aba "Dentrics IA" no menu lateral (separada da análise de radiografias)
- [x] Chat conversacional para consultar dados da clínica em linguagem natural
- [x] Integração com PubMed para pesquisa de estudos odontológicos
- [x] Integração com plataformas de estudos (Journal of Dental Research, etc.)
- [x] Integração com IA do Manus para respostas mais inteligentes
- [x] Smile Design Studio - simulação de antes/depois do sorriso (preparado para implementação futura)
- [x] Automação de tarefas por linguagem natural
- [x] Histórico de conversas com a IA
- [x] Sugestões de perguntas frequentes

## Memória da Dentrics IA
- [x] Criar tabela de histórico de conversas no banco de dados
- [x] Salvar mensagens do usuário e respostas da IA
- [x] Carregar histórico ao abrir a página
- [x] IA não se apresentar toda vez (usar contexto do histórico)
- [x] Limpar histórico apenas quando usuário solicitar

## Próximos Passos - Sessão 4
### Smile Design Studio
- [x] Criar página/modal de Smile Design Studio
- [x] Upload de foto do paciente (sorriso atual)
- [x] Integração com IA para gerar simulação do sorriso após tratamento
- [x] Comparação lado a lado (antes/depois)
- [x] Salvar simulações no prontuário do paciente
- [ ] Compartilhar simulação com paciente via WhatsApp (pendente integração)

### Sistema de Alertas de Retorno
- [x] Criar tabela de alertas de retorno no banco de dados
- [x] Configurar período de retorno por tipo de tratamento
- [x] Dashboard de alertas para secretária
- [x] Notificação automática quando paciente precisa retornar
- [x] Histórico de contatos realizados
- [ ] Integração com WhatsApp para envio de lembretes (pendente integração)

### Comandos de Voz na Dentrics IA
- [x] Adicionar botão de microfone na interface da IA
- [x] Capturar áudio do usuário
- [x] Transcrever áudio para texto usando Web Speech API
- [x] Enviar texto transcrito para a IA
- [ ] Opção de ouvir resposta da IA (text-to-speech) - futuro

## Bugs Reportados - Sessão 5
- [x] Smile Design Studio não está simulando nada - as fotos geradas continuam iguais sem transformação (CORRIGIDO - integrado com generateImage API)

## Próximos Passos - Sessão 6
### Melhorias no Smile Design
- [x] Ajustar prompts de geração para resultados mais precisos e realistas
- [x] Criar galeria de exemplos antes/depois de casos
- [x] Implementar compartilhamento via WhatsApp para enviar simulação ao paciente

## Próximos Passos - Sessão 7
### Text-to-Speech na Dentrics IA
- [x] Adicionar botão de ouvir resposta da IA
- [x] Implementar Web Speech API para síntese de voz
- [x] Controle de play/pause/stop
- [x] Indicador visual de reprodução

### Relatórios de Conversão do Smile Design
- [x] Criar dashboard de métricas do Smile Design
- [x] Rastrear orçamentos gerados após simulação
- [x] Taxa de conversão (simulações vs orçamentos fechados)
- [x] Gráficos de evolução por período

### Integração WhatsApp nos Alertas de Retorno
- [x] Botão de enviar lembrete via WhatsApp
- [x] Template de mensagem personalizado
- [x] Histórico de envios
- [x] Estatísticas de mensagens enviadas
- [x] Registro de mensagens enviadas
- [x] Envio em lote para múltiplos pacientes


## Dados de Teste - Nova Solicitação (31/01/2026)
- [x] Procedimentos: Restaurações (todos os tipos), coroas, clareamentos, cirurgias, canais, etc.
- [x] Consultórios: 4 consultórios cadastrados
- [x] Dentistas: Dr. Misael Pinheiro e Dra. Rôsyelma Pinheiro
- [x] Pacientes: 2 pacientes de teste (João da Silva e Maria Santos)
- [x] Estoque: 21 produtos odontológicos cadastrados


## Novas Funcionalidades - Solicitação (31/01/2026)
- [x] Visualizador de Imagens 3D (Three.js/React Three Fiber) - Implementado
  - [x] Instalar dependências (three, @react-three/fiber, @react-three/drei)
  - [x] Criar componente Model3DViewer
  - [x] Criar página de visualização 3D
  - [x] Integrar upload de arquivos STL/OBJ/GLTF
  - [x] Adicionar controles (rotação, zoom, pan)


## Bugs Reportados (31/01/2026)
- [ ] Visualizador 3D: Usuário não consegue fazer upload de modelo próprio
- [x] Adicionar modelos 3D de arcadas dentárias de teste no Visualizador 3D
- [x] Adicionar modelo 3D de arcada dentária no Visualizador 3D (criado proceduralmente com Three.js)

- [x] Baixar modelo 3D REALISTA de arcada dentária de site externo (OpenMandible - Universidade de Kragujevac)

- [x] Baixar modelo 3D de arcada dentária COMPLETA realista (14 dentes individuais do OpenMandible)

## Modelos 3D Adicionais - Solicitação (31/01/2026)
- [x] Modelo 3D de crânio-facial completo (Visible Human Project - NIH)
- [x] Modelo 3D de ATM (Articulação Temporomandibular) - Cartilagem da ATM do OpenMandible
- [x] Modelo 3D de crânio separado - Osso cortical e esponjoso da mandíbula (OpenMandible)


## Bugs Reportados - Visualizador 3D (31/01/2026)
- [x] Botão de visualizar (olho) não funciona na biblioteca - CORRIGIDO
- [x] Adicionar confirmação "Tem certeza?" antes de apagar modelo - CORRIGIDO
- [x] Adicionar thumbnails/pré-visualização na biblioteca para identificar modelos - CORRIGIDO

- [x] Visualizador 3D: Modelos STL realistas não centralizam automaticamente ao carregar (só funciona após clicar em modelo CGI primeiro) - CORRIGIDO: Reescrito componente Model3DViewer com carregamento assíncrono e recriação do Canvas


## Ajustes Visualizador 3D (31/01/2026)
- [x] Remover modelos CGI (arcadas dentárias criadas proceduralmente) da biblioteca
- [x] Adicionar opção de tela cheia no Visualizador 3D


## Visualizador 3D - Integração com Prontuário (31/01/2026)
- [x] Vincular modelo 3D ao paciente ao fazer upload
- [x] Salvar modelo no prontuário do paciente
- [x] Perguntar se deseja adicionar à biblioteca geral após salvar
- [x] Adicionar botão para limpar área de modelos recentes

## Bugs Visualizador 3D (31/01/2026)
- [x] Fundo escuro do visualizador 3D não aparece quando modelo é selecionado - CORRIGIDO: darkMode agora inicia como true

## Visualizador 3D - Novas Funcionalidades (31/01/2026)
- [x] Adicionar opção de upload direto para biblioteca (sem vincular a paciente)
- [x] Adicionar botão de download do modelo 3D atual
- [x] Adicionar opção de compartilhar modelo via link


## Transferência de Projeto (31/01/2026)
- [x] Criar novo projeto odonto-saas
- [x] Extrair arquivo ZIP com código fonte completo
- [x] Substituir arquivos do projeto
- [x] Executar pnpm install
- [x] Configurar banco de dados (criar tabelas faltantes)
- [x] Criar tabela users com schema correto
- [x] Criar clínica de demonstração (ID 30001)
- [x] Criar usuário admin de teste (admin@dentrics.com / admin123)
- [x] Vincular usuário à clínica
- [x] Testar login com credenciais
- [x] Verificar navegação do sistema
- [x] Verificar módulos principais funcionando


## Personalização QR Check-in (31/01/2026)
- [x] Buscar dados da clínica (logo e nome) na página de check-in
- [x] Exibir logo personalizada da clínica no check-in
- [x] Exibir nome personalizado da clínica no check-in
- [x] Testar funcionalidade com diferentes clínicas


## Upload de Logo nas Configurações (31/01/2026)
- [ ] Adicionar campo de upload de logo na página de Configurações
- [ ] Corrigir salvamento das configurações (não está funcionando)
- [ ] Integrar logo das configurações com check-in e todo o sistema
- [ ] Testar upload e exibição da logo em todas as áreas


## Upload de Logo nas Configurações (31/01/2026)
- [x] Adicionar campo de upload de logo na página de Configurações
- [x] Corrigir o salvamento das configurações
- [x] Integrar logo das configurações com a página de check-in
- [x] Testar funcionalidade de upload e salvamento


## Configuração de Dados de Teste (31/01/2026)
- [x] Inserir 2 pacientes de teste
- [x] Inserir 2 consultórios
- [x] Inserir dentistas: Dra. Rôsyelma Pinheiro e Dr. Misael Pinheiro
- [x] Inserir procedimentos de restauração (todos os tipos)
- [x] Inserir procedimentos de clareamento
- [x] Inserir procedimentos de limpeza e raspagem
- [x] Inserir procedimentos de cirurgia (vários tipos)
- [x] Inserir procedimentos de próteses (coroa, prótese total, etc)
- [x] Inserir procedimentos de implante
- [x] Inserir procedimentos de canal
- [x] Inserir procedimentos de ortodontia (vários tipos)


## Sistema de Notificações Visuais e Sonoras (31/01/2026)
- [ ] Criar hook/componente de notificações compartilhado
- [ ] Painel TV: som de chamada quando paciente é chamado
- [ ] Painel TV: destaque visual animado na chamada
- [ ] Área do Atendente: notificação visual quando paciente retorna
- [ ] Área do Atendente: som de notificação quando paciente retorna
- [ ] Áreas dos Especialistas: notificação visual quando novo paciente na fila
- [ ] Áreas dos Especialistas: som de notificação para novo paciente
- [ ] Badge/indicador visual para ações pendentes


## Sistema de Notificações Visuais e Sonoras (31/01/2026)
- [x] Criar hook de notificações compartilhado (useNotifications.ts)
- [x] Criar componente NotificationBadge animado
- [x] Implementar notificações no Painel TV (já existia)
- [x] Implementar notificações na Área do Atendente
- [x] Implementar notificações na Área do Dentista
- [x] Implementar notificações na Área do Ortodontista
- [x] Implementar notificações na Área do Implantodontista
- [x] Implementar notificações na Área do Protesista
- [x] Som de notificação quando paciente entra na fila
- [x] Som de notificação quando paciente retorna do atendimento
- [x] Badge visual com contador de novas ações
- [x] Animação de pulso nas notificações


## Correção Upload de Logo (31/01/2026)
- [x] Investigar problema de carregamento da logo após salvamento (CloudFront retornava 403)
- [x] Corrigir código de upload e exibição da logo (usando base64 em vez de storage)
- [x] Testar funcionalidade de upload de logo (funcionando nas Configurações e Check-in)## Gestão de Senhas de Usuários (31/01/2026)
- [x] Adicionar campo de senha ao convidar usuário
- [x] Permitir edição de senha de usuários existentes (botão Alterar Senha na tabela)
- [x] Testar funcionalidades de senhacom senha
- [ ] Testar edição de senha


## Bug: Usuário não associado à clínica (31/01/2026)
- [x] Investigar por que usuário adicionado não está vinculado à clínica
- [x] Corrigir código de adição de usuário para vincular à clínica do admin
- [x] Testar login do usuário adicionado


## Bug Fix: Usuário sem clinicId (31/01/2026)
- [x] Identificar que o campo clinicId na tabela users estava null
- [x] Corrigir o código de criação de usuário para definir clinicId
- [x] Atualizar o usuário saellcostta27@gmail.com com clinicId = 30001


## Sistema de Permissões por Cargo - RBAC (31/01/2026) - CONCLUÍDO
- [x] Criar tabela de permissões por cargo no banco de dados (role_permissions)
- [x] Criar interface de configuração de permissões para admin (/gestao-permissoes)
- [x] Implementar controle de acesso nas páginas baseado no cargo (ProtectedRoute)
- [x] Restringir menu lateral baseado nas permissões do usuário (DashboardLayout)
- [x] Testar permissões com diferentes cargos (atendente, dentista, etc.)
- [x] Hook usePermissions para buscar permissões do cargo
- [x] Endpoints de API para buscar e salvar permissões
- [x] Página de Gestão de Permissões com interface por cargo e categoria
- [x] Endpoint getCurrentUserClinicRole para obter cargo do usuário na clínica
- [x] Função getUserClinicRole no db.ts
- [x] Bloqueio de acesso direto via URL para páginas sem permissão
- [x] Admin e Owner sempre têm acesso total a todas as funcionalidades
- [x] Filtro de seções do menu (se nenhum item visível, seção não aparece)


## Bug Reportado - Acesso Bloqueado
- [x] Erro "Usuário não está associado a nenhuma clínica" ao fazer login
- [x] Criar clínica padrão no banco de dados
- [x] Associar novos usuários automaticamente à clínica padrão

## Correção do Fluxo de Cadastro
- [x] Tela de cadastro principal deve cadastrar uma CLÍNICA (não apenas usuário)
- [x] Usuário que cadastra a clínica vira automaticamente admin dessa clínica
- [x] Dentro do sistema, em "Gestão de Usuários" o admin pode adicionar outros usuários

## Correção de Permissões Automáticas
- [x] Ativar automaticamente todas as áreas (Painel, Pacientes, Agenda, etc.) para admin/owner
- [x] Usuário que cria a clínica deve ter acesso total a todas as funcionalidades

## Painel Sempre Ativo
- [x] Painel deve ficar sempre ativo e não pode ser desativado
- [x] Mostrar mensagem de aviso quando tentar desativar o Painel
- [x] Indicador visual "Obrigatório" no switch do Painel
- [x] Switch do Painel desabilitado para impedir cliques

## Proteção do Painel no Backend
- [x] Adicionar proteção no backend para sempre manter canViewPainel = true
- [x] Garantir que ao salvar permissões, o Painel nunca seja desativado

## Filtro de Usuários por Clínica
- [x] Gestão de Usuários deve mostrar apenas usuários da clínica específica
- [x] Lista completa de usuários só deve aparecer para superadmin


## Melhorias no Sistema de Orçamentos (01/02/2026)

### Melhorias Visuais
- [x] Orçamento com design profissional e moderno
- [x] Template personalizado com logo da clínica
- [x] Cores personalizáveis para combinar com identidade visual
- [ ] Geração de PDF profissional para impressão/envio
- [x] Preview do orçamento antes de enviar

### Orçamento Parcial/Faseado
- [x] Permitir aprovação parcial de tratamentos
- [x] Dividir orçamento em fases (urgente, importante, estético)
- [x] Priorização por gravidade clínica
- [x] Histórico de itens não aprovados para follow-up

### Envio por WhatsApp
- [x] Botão "Enviar por WhatsApp" no orçamento
- [x] Mensagem pré-formatada com resumo e valor
- [ ] Link para visualizar orçamento completo online
- [ ] Templates de mensagens personalizáveis

### Dashboard de Metas de Vendas
- [x] Meta diária/semanal/mensal de orçamentos
- [x] Taxa de conversão (aprovados vs apresentados)
- [ ] Ranking de profissionais por conversão
- [ ] Alertas quando meta está abaixo do esperado
- [ ] Gráficos de evolução de vendas

### Link de Pagamento
- [x] Geração de link de pagamento único por orçamento
- [x] Envio via SMS, WhatsApp ou e-mail
- [ ] Pagamento online com cartão/Pix
- [ ] Notificação automática quando pagamento é realizado


## Bug - Cadastro de Paciente
- [x] Erro "usuário não está associado a nenhuma clínica" ao cadastrar paciente
- [x] Verificar e corrigir associação de usuário à clínica
- [x] Atualizar usuários sem clinicId para associar à clínica padrão

## Bug - Painel Multi-tenancy
- [x] Painel mostrando dados de outras clínicas
- [x] Corrigir filtro para mostrar apenas dados da clínica do usuário logado
- [x] Dashboard stats filtrado por clinicId
- [x] Advanced stats filtrado por clinicId
- [x] Queue stats filtrado por clinicId

## Área de Tratamento no Orçamentista
- [ ] Criar odontograma com dentes clicáveis (Arcada Superior e Inferior)
- [ ] Adicionar seleção de condições (Saudável, Cárie, Restauração, Extração, Implante, Coroa, Ponte, Canal, Fratura, Ausente)
- [ ] Permitir marcar faces dos dentes (V=Vest, L=Ling, M=Mes, D=Dist, O=Ocl)
- [ ] Exibir resumo do tratamento com dentes e condições selecionadas
- [ ] Adicionar toggle Permanente/Decíduo
- [ ] Botão "Ir para Orçamento" que transfere todos os dados do tratamento
- [ ] Campo de observações do tratamento


## Área de Tratamento no Orçamentista (01/02/2026)
- [x] Seleção de condições dentárias (Cárie, Restauração, Extração, Implante, Coroa, Ponte, Canal, Fratura, Ausente)
- [x] Marcação de faces dos dentes (V=Vestibular, L=Lingual, M=Mesial, D=Distal, O=Oclusal)
- [x] Resumo do tratamento com lista de dentes e condições
- [x] Botão "Ir para Orçamento" para transferir dados
- [x] Tabs separadas: Tratamento e Orçamento
- [x] Cores por condição no odontograma
- [x] Odontograma interativo com toggle permanente/decíduo

## Cadastro de Procedimentos com Valores
- [ ] Cadastrar procedimentos padrão (restaurações, coroa, implante, próteses, canal, limpeza, clareamento, cirurgias)
- [ ] Criar área de gestão de procedimentos com valores
- [ ] Transferência automática: ao ir para orçamento, buscar procedimento e valor cadastrado
- [ ] Edição manual de valores no orçamento
- [ ] Adicionar mais procedimentos manualmente no orçamento


## Cadastro de Procedimentos com Valores (01/02/2026)
- [x] Cadastrar procedimentos padrão (restaurações, coroa, implante, próteses, canal, limpeza, clareamento)
- [x] Transferência automática de tratamento para orçamento com valores
- [x] Edição manual de valores no orçamento
- [x] Adicionar mais procedimentos manualmente
- [x] Mapeamento de condições para procedimentos sugeridos


## Fluxo de Pagamento e Encaminhamento para Especialistas (01/02/2026)
- [x] Criar tabela de procedimentos do tratamento (treatment_procedures) com status de conclusão
- [x] Orçamentista: ao finalizar orçamento, criar procedimentos do tratamento automaticamente
- [x] Atendente: botão "Receber" marca como pago e mostra opções de encaminhamento
- [x] Atendente: botão "Especialista" para encaminhar com lista de procedimentos (sem valores)
- [x] Especialistas (Dentista): ver lista de procedimentos a realizar (sem valores)
- [x] Especialistas (Dentista): marcar procedimentos como concluídos ao finalizar
- [x] Procedimentos concluídos ficam marcados, pendentes ficam desmarcados para próximas áreas


## Correção de Procedimentos para Especialistas (01/02/2026)
- [ ] Procedimentos não aparecem para o Dentista durante atendimento
- [ ] Mostrar lista de procedimentos a realizar na tela do especialista
- [ ] Permitir marcar procedimentos como concluídos durante atendimento
- [ ] Procedimentos pendentes ficam visíveis para próximas áreas


## Correção de Procedimentos para Especialistas (01/02/2026)
- [x] Corrigir query de procedimentos para buscar pelo paciente/queueEntry correto
- [x] Mostrar procedimentos na tela do especialista durante atendimento (Dentista, Ortodontista, Implantodontista, Protesista, BucoMaxilo, Odontopediatria)
- [x] Procedimentos aparecem sem valores (especialistas não veem preços)
- [x] Atualização automática a cada 5 segundos


## Procedimentos Pendentes para Atendente (01/02/2026)
- [x] Mostrar lista de procedimentos pendentes quando paciente volta do especialista
- [x] Atendente pode ver quais procedimentos ainda faltam para encaminhar corretamente
- [x] Procedimentos concluídos aparecem em verde com risco
- [x] Procedimentos pendentes aparecem em amarelo/âmbar


## Bug: Procedimentos não aparecem no modal de encaminhamento (01/02/2026)
- [x] Procedimentos existem (3 pendentes) mas não carregam no modal "Encaminhar para Especialista"
- [x] Investigar query de procedimentos no modal
- [x] Corrigir para buscar corretamente pelo patientId (alterado para usar getForSpecialist que busca por queueEntryId OU patientId)


## Modal de Finalização com Procedimentos em Todas as Áreas (01/02/2026)
- [ ] Área do Dentista já funciona corretamente
- [ ] Replicar modal de finalização com procedimentos na Área Ortodontista
- [ ] Replicar modal de finalização com procedimentos na Área Implantodontista
- [ ] Replicar modal de finalização com procedimentos na Área Protesista
- [ ] Replicar modal de finalização com procedimentos na Área Buco-Maxilo
- [ ] Replicar modal de finalização com procedimentos na Área Odontopediatria

## Ajustes Solicitados (02/02/2026)

- [x] Inverter ordem das abas na página Pacientes (Todos os Pacientes primeiro, Pacientes do Dia segundo)
- [x] Ativar automaticamente novos pacientes como Paciente do Dia ao cadastrar


## Correções Solicitadas (02/02/2026 - Sessão 2)

- [x] Corrigir criação de documentos/atestados não funcionando
- [x] Adicionar opção de foto no perfil do paciente
- [x] Adicionar texto "Visualizar" ao botão do olho no prontuário


## Correções Solicitadas (02/02/2026 - Sessão 3)

- [x] Adicionar notificação visual destacada quando paciente retornar de uma área (dentista, especialista, etc.)

- [x] Mostrar no card do paciente o histórico de áreas por onde já passou e destacar a última área de onde veio

- [x] Adicionar campo opcional para selecionar dentista no modal de Agendar Retorno

- [x] Mudar botão "Receber" para "Pago" (verde) após pagamento ser confirmado

- [x] Melhorar Dentrics IA para ter acesso à agenda completa (não apenas hoje)

## Melhorias Dentrics IA (02/02/2026)

- [x] Expandir acesso da IA a dados em tempo real (pacientes, prontuários, agendamentos recentes)
- [x] Adicionar capacidade de criar procedimentos e valores via IA
- [x] Permitir que a IA agende consultas e faça alterações no sistema

## Ajustes de Menu (02/02/2026)

- [x] Remover aba "Permissões" do menu do sistema (duplicada - já existe em Gestão de Usuários)

## Expansão Dentrics IA - Ações no Sistema (02/02/2026)

- [x] IA criar procedimentos diretamente no sistema
- [x] IA gerenciar estoque (adicionar itens, controlar quantidades)
- [x] IA modificar configurações do site
- [x] IA cadastrar consultórios
- [x] IA cadastrar dentistas/profissionais
- [x] IA cadastrar pacientes

## Bugs Reportados (02/02/2026)

- [x] BUG: Dentrics IA não está criando procedimentos corretamente - diz que criou mas não aparece
- [x] BUG: Dentrics IA não suporta criar múltiplos procedimentos de uma vez

## Controle de Estoque via IA (02/02/2026)

- [x] IA adicionar itens ao estoque com nome e quantidade
- [x] IA controlar quantidades (entrada/saída de estoque)
- [x] IA consultar estoque atual

## Bugs Reportados (02/02/2026 - Sessão 2)

- [x] BUG: Dentrics IA não processa listas numeradas de procedimentos corretamente
- [x] BUG: IA responde muito rápido sem criar os procedimentos da lista

## Melhorias Estoque IA (02/02/2026)

- [x] IA entender listas de estoque (ex: "Álcool 100 unidades, luvas 100 unidades")
- [x] IA verificar se realmente criou os itens antes de confirmar
- [x] IA tentar novamente se falhar na criação

## Bugs Cadastro Paciente IA (02/02/2026)

- [x] BUG: IA colocando CPF no campo de nome ao cadastrar paciente
- [x] BUG: IA não extraindo nome corretamente (ex: "Um, maria" em vez de "Maria")
- [x] Melhorar extração de dados do paciente para preencher cada campo corretamente

## Super Dentrics IA - Funcionalidades Avançadas (02/02/2026)

### Memória e Contexto
- [ ] Memória persistente de conversas por usuário
- [ ] Lembrar preferências e histórico de interações

### Busca Inteligente
- [ ] Buscar pacientes por nome, CPF, telefone
- [ ] Buscar agendamentos por data, paciente, dentista
- [ ] Buscar procedimentos realizados
- [ ] Consultas em linguagem natural ("quem veio ontem?")

### Sugestões Proativas
- [ ] Alertar sobre estoque baixo
- [ ] Lembrar pacientes que precisam retornar
- [ ] Avisar sobre aniversariantes do dia
- [ ] Sugerir horários vagos na agenda

### Relatórios Automáticos
- [ ] Relatório de faturamento diário/mensal
- [ ] Relatório de atendimentos
- [ ] Relatório de procedimentos mais realizados
- [ ] Relatório de pacientes novos

### Agendamento Inteligente
- [ ] Encontrar próximo horário disponível
- [ ] Agendar consultas por comando de voz/texto
- [ ] Remarcar consultas automaticamente
- [ ] Verificar conflitos de agenda

### Análise de Dados
- [ ] Estatísticas de atendimento
- [ ] Análise de faturamento
- [ ] Tendências e insights
- [ ] Comparativos mensais

### Comandos Avançados
- [ ] Editar pacientes existentes
- [ ] Excluir registros
- [ ] Listar dados com filtros
- [ ] Exportar dados

### Integração WhatsApp
- [ ] Enviar mensagens para pacientes
- [ ] Confirmar consultas automaticamente
- [ ] Enviar lembretes de retorno


## Dentrics IA - Funcionalidades Avançadas (02/02/2026)
- [x] Busca inteligente em linguagem natural (pacientes, consultas, procedimentos, orçamentos, estoque)
- [x] Alertas proativos automáticos (estoque baixo, retornos, aniversariantes, orçamentos pendentes)
- [x] Geração de relatórios sob demanda (diário, semanal, mensal)
- [x] Agendamento inteligente por linguagem natural ("Agendar João para terça às 14h")
- [x] Encontrar próximo horário disponível automaticamente
- [x] Análise de dados e estatísticas (taxa de conversão, ticket médio, tendências)
- [x] Edição de pacientes via IA
- [x] Exclusão de registros via IA (com confirmação)
- [x] Preparação de mensagens WhatsApp (lembretes, aniversários, follow-up)
- [x] Listar pacientes cadastrados
- [x] Listar procedimentos e valores
- [x] Consultar agenda do dia
- [x] Entrada e saída de estoque via comandos
- [x] Prompt de sistema super inteligente com todas as capacidades
- [x] Detecção expandida de intenções (busca, relatório, alerta, agendamento)
- [x] Testes unitários para detecção de intenções e extração de dados


## Bug Reportado - Extração de Estoque (02/02/2026)
- [x] IA está extraindo nome do item de estoque incorretamente - inclui valor e outras informações no campo nome (CORRIGIDO)
- [x] Corrigir regex/lógica de extração para separar nome do item dos outros campos (quantidade, valor, etc.) (CORRIGIDO)


## Nova Funcionalidade - Painel de Movimentações de Estoque (02/02/2026)
- [x] Criar painel de resumo do estoque (total itens, valor, alertas) (CONCLUÍDO)
- [x] Implementar histórico de movimentações (entradas e saídas) (CONCLUÍDO)
- [ ] Adicionar filtros por período, tipo e item (FUTURO)
- [x] Registrar automaticamente todas as operações de estoque (JÁ EXISTIA)
- [x] Criar interface visual com tabela de movimentações (CONCLUÍDO)


## Ajustes Orçamentista (02/02/2026)
- [x] Remover obrigatoriedade da face do dente (CONCLUÍDO)
- [x] Adicionar mensagem de transição ao mudar de Tratamento para Orçamento (CONCLUÍDO)


## Bug - Notificação de Transição (02/02/2026)
- [x] Notificação não está aparecendo ao mudar de Tratamento para Orçamento (CORRIGIDO - toast com estilo destacado)


## Ajuste Visual - Área de Tratamento (02/02/2026)
- [x] Mudar cor da área de Tratamento para verde (diferenciar do Orçamento que é laranja) (CONCLUÍDO)


## Bug - Mapeamento de Procedimentos (02/02/2026)
- [x] Apenas Restauração está indo automaticamente para o orçamento (CORRIGIDO)
- [x] Corrigir mapeamento para incluir todos os procedimentos (Canal, Extração, Implante, etc.) (CORRIGIDO - adicionado múltiplas estratégias de busca)


## Melhorias Orçamentista (03/02/2026)
- [x] Adicionar opção de cadastro manual de paciente direto no Orçamentista (CONCLUÍDO)
- [x] Destacar visualmente a seleção de consultório e dentista (CONCLUÍDO - com cores e animação)


## Bug - Paciente Travada no Atendimento (03/02/2026)
- [x] Paciente Maxsielly travada no atendimento - não sai mesmo finalizando outros (CORRIGIDO)
- [x] Adicionar botão para cancelar/finalizar atendimento manualmente (CONCLUÍDO - botão X vermelho)


## Transferência para Novo Projeto (03/02/2026)
- [x] Projeto odonto-saas criado com banco de dados
- [x] Arquivos extraídos do ZIP e substituídos no projeto
- [x] Dependências instaladas com pnpm install
- [x] Schema do banco de dados recriado (50 tabelas)
- [x] Conta de administrador criada (admin@dentrics.com)
- [x] Integração Stripe configurada automaticamente
- [x] Pacote stripe instalado
- [x] Arquivo stripe/products.ts criado
- [x] Testes corrigidos (109 testes passando)
- [x] Sistema testado e funcionando


## Bug Reportado (03/02/2026)
- [x] Dentrics IA: se enrola e executa ações duplicadas ao adicionar consultórios (CORRIGIDO - agora verifica se já existe)
- [x] Dentrics IA: não verifica se item já existe antes de tentar criar (CORRIGIDO)

- [x] Dentrics IA: não está adicionando procedimentos corretamente (CORRIGIDO - melhor extração de nome/valor e verificação)


## Implementação de Documentos do Prontuário (04/02/2026)
- [ ] Criar tabela de documentos no schema (patient_documents)
- [ ] Implementar rotas tRPC para CRUD de documentos
- [ ] Criar formulário de Atestado (dias/presença, CID)
- [ ] Criar formulário de Receituário (prescrição livre)
- [ ] Criar formulário de Termo de Consentimento (procedimento)
- [ ] Criar formulário de Contrato (valor, pagamento, observações)
- [ ] Implementar geração de PDF para impressão
- [ ] Puxar nome da clínica das configurações para os documentos
- [ ] Integrar na aba Documentos do Prontuário


## Implementação de Documentos do Prontuário (04/02/2026)
- [x] Criar tabela medical_documents no schema
- [x] Implementar rotas tRPC para CRUD de documentos (Atestado, Receituário, Termo, Contrato)
- [x] Atualizar formulários com seletor de profissional
- [x] Puxar nome da clínica das configurações para os documentos
- [x] Atestado: tipo (dias/presença), quantidade de dias, CID opcional
- [x] Receituário: prescrição em texto livre
- [x] Termo de Consentimento: procedimento e detalhes
- [x] Contrato: procedimentos, valor, forma de pagamento
- [ ] Implementar geração de PDF para impressão (próxima etapa)


## Bugs Reportados - Documentos (04/02/2026)
- [x] Layout desorganizado: botão "Ver" sobrepondo nome do dentista (CORRIGIDO - novo layout responsivo)
- [x] PDF não está gerando: mostra "Gerando PDF..." mas não completa (CORRIGIDO - geração funcional)
- [x] Falta compartilhamento via WhatsApp (CORRIGIDO - botão WhatsApp adicionado)
- [x] Adicionar campos de assinatura do profissional e paciente nos documentos (CORRIGIDO - assinaturas no PDF)


## Sistema de Documentos Médicos - Assinatura Digital e Validação (04/02/2026)
- [x] Tabela de documentos com colunas: Tipo, Título, Data, Assinatura Paciente, Assinatura Profissional, Ações
- [x] Modal de assinatura digital para paciente
- [x] Modal de assinatura digital para profissional
- [x] Registro de data/hora da assinatura
- [x] Geração de link de validação com opções de expiração (sem expiração, 7 dias, 30 dias, 90 dias)
- [x] Página pública de validação de documentos (/validar-documento/:token)
- [x] Exibição de status das assinaturas na página de validação
- [x] Verificação de expiração do link de validação
- [x] Botão para copiar link de validação
- [x] Ícones de ações: Imprimir, Email, WhatsApp, Link de Validação, Excluir
- [x] Testes unitários para assinatura e validação de documentos


## Bug: Erro ao criar documentos médicos (RESOLVIDO - 04/02/2026)
- [x] Erro ao inserir documentos no banco de dados (problema de case sensitivity MySQL)
- [x] Tabela medical_documents com nomes de colunas misturando camelCase e snake_case
- [x] Schema do Drizzle corrigido para usar snake_case APENAS em campos de assinatura e validação
- [x] Campos normais mantidos em camelCase (patientName, dentistName, etc.)
- [x] Sistema de documentos funcionando completamente com assinaturas digitais e links de validação
- [x] Documento de teste criado e exibido com sucesso na interface


## Sistema de Trial e Cobrança (04/02/2026)
- [x] Campo trialStartDate na tabela de clínicas/usuários
- [x] Campo subscriptionStatus (trial, active, expired, cancelled)
- [x] Campo subscriptionExpiresAt para controle de expiração
- [x] Rota de verificação de status do trial (subscription.getInfo)
- [x] Rota de criação de checkout Stripe para assinatura (subscription.createCheckout)
- [x] Página de inadimplência com redirecionamento para Stripe (/inadimplente)
- [x] Contagem regressiva quando faltam 5 dias para expirar (SubscriptionWarningBanner)
- [x] Middleware de bloqueio para contas expiradas (DashboardLayout redirect)
- [x] Webhook Stripe para atualizar status após pagamento (já configurado)


## Planos de Assinatura (04/02/2026)
- [x] Plano Básico: R$ 149/mês - Até 200 pacientes, 2 usuários, 1 dentista
- [x] Plano Profissional: R$ 299/mês - Pacientes ilimitados, 5 usuários, 3 dentistas, IA, WhatsApp
- [x] Plano Premium: R$ 499/mês - Tudo ilimitado, multi-clínicas, API, suporte 24/7
- [x] Página de inadimplência com seleção de planos (design moderno com cards)
- [x] Backend com suporte a múltiplos planos no checkout Stripe
- [x] Checkout Stripe funcionando para todos os planos


## Portal do Cliente Stripe (04/02/2026)
- [x] Atualizar chaves do Stripe (sk_test e pk_test)
- [x] Criar rota para gerar sessão do portal do cliente (subscription.createPortalSession)
- [x] Adicionar botão "Gerenciar Pagamento" na página de perfil
- [x] Permitir cancelar assinatura pelo portal Stripe
- [x] Permitir atualizar cartão de crédito pelo portal Stripe
- [x] Permitir ver faturas e histórico de pagamentos pelo portal Stripe


## Melhorias Portal Stripe (04/02/2026)
- [x] Criar modal de seleção de planos antes de ir para o checkout do Stripe
- [ ] Configurar nome da empresa "Dentrics" no portal do Stripe


## Integração Stripe para Assinaturas - Nova Implementação (05/02/2026)
- [x] Configurar chaves Stripe (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY) - JÁ CONFIGURADO AUTOMATICAMENTE
- [x] Criar tabela de planos editáveis no banco de dados (plans) - JÁ EXISTIA
- [x] Implementar CRUD de planos no painel super admin - JÁ EXISTIA
- [x] Criar tela de inadimplência com seleção de planos dinâmicos - ATUALIZADO para buscar do banco
- [x] Integrar checkout Stripe para assinaturas recorrentes - ATUALIZADO para usar planos do banco
- [x] Implementar webhooks Stripe para atualização de status - JÁ EXISTIA
- [x] Sincronizar planos com produtos no Stripe - Checkout cria produtos dinâmicos
- [x] Testar fluxo completo de assinatura - 133 testes passando
- [x] Trocar para conta Stripe alternativa - Conta antiga com restrições substituída por conta funcional

## Atualização para Chaves Stripe de Produção (05/02/2026)
- [x] Atualizar STRIPE_SECRET_KEY para sk_live_51SxJplDmY17h3OvJ...
- [x] Atualizar STRIPE_PUBLISHABLE_KEY para pk_live_51SxJplDmY17h3OvJ...
- [x] Sistema em MODO LIVE - Processando pagamentos reais

## Bug: URL de Redirecionamento Pós-Pagamento (05/02/2026)
- [x] Corrigir success_url no checkout Stripe - redirecionando para domínio incorreto (gestao.manus.space)
- [x] Criar função getOriginFromRequest() para construir URLs corretas a partir dos headers
- [x] Atualizar todas as 4 ocorrências de checkout para usar a nova função

## Bug: Status não atualiza após pagamento (05/02/2026)
- [x] Verificar implementação do webhook Stripe - Webhook existia mas não atualizava banco
- [x] Implementar lógica de atualização de status no webhook
- [x] Configurar webhook no Stripe Dashboard para produção - URL e signing secret configurados
- [x] Webhook secret configurado: whsec_yeegso47xqfrPnOEZA1cl5ePIOkuZERN
- [x] Testar atualização automática de status com pagamento real - FUNCIONANDO!

## Bug: Redirecionamento pós-pagamento mostra 404 (05/02/2026)
- [x] Usuário é redirecionado para gestao.manus.space após pagamento (404)
- [x] Alterado success_url para redirecionar para /inadimplente que detecta status ativo
- [x] Página de inadimplente agora redireciona automaticamente para /painel se status for ativo

## Melhorias Planos Dinâmicos (05/02/2026)
- [x] Página de Perfil: buscar plano atual do banco de dados ao invés de hardcoded
- [x] Modal "Alterar Plano": buscar todos os planos do banco ao invés de hardcoded
- [x] Garantir que edições no Admin reflitam em todas as páginas do sistema
- [x] Procedure getSubscriptionInfo atualizada para incluir dados completos do plano
- [x] Página de Perfil agora formata preço dinamicamente do banco
- [x] Modal de planos agora renderiza planos do banco com ícones e cores dinâmicas

## Bug: Edição de Dados da Clínica não Funciona (05/02/2026)
- [x] Botão "Salvar Configurações" na página de Configurações não está salvando
- [x] Procedure settings alterada de publicProcedure para clinicProcedure
- [x] Funções getClinicSettings e upsertClinicSettings agora filtram por clinicId
- [x] Cada clínica agora tem suas próprias configurações separadas
- [ ] Testar edição completa dos dados e upload de logo

## Simplificação Check-in (05/02/2026)
- [x] Remover campo "Tipo de Atendimento" do formulário de check-in
- [x] Cadastrar paciente automaticamente na área de Pacientes ao fazer check-in
- [x] Colocar paciente automaticamente na fila do Orçamentista (queueType fixo em "budget")
- [x] Simplificar texto explicativo do check-in
- [x] Verificar se paciente já existe pelo telefone antes de criar duplicado
- [x] Vincular check-in ao paciente criado/existente

## Correções Sistema de Assinaturas (05/02/2026)
- [x] Atestado: remover assinatura do paciente, deixar apenas profissional
- [x] Receituário: remover assinatura do paciente, deixar apenas profissional
- [x] Contrato: manter assinaturas de paciente E profissional
- [x] Termo de Consentimento: manter assinaturas de paciente E profissional
- [x] Corrigir canvas de assinatura digital que não está funcionando
- [x] Implementado react-signature-canvas com canvas real para desenhar assinatura
- [x] Assinatura salva como imagem base64 no banco de dados
- [x] Botão "Limpar" para apagar assinatura e redesenhar
- [x] Validação para não permitir confirmar sem desenhar assinatura
- [ ] Testar assinatura digital em todos os tipos de documentos

## Bug: Check-in cadastrando paciente na clínica errada (05/02/2026)
- [x] Pacientes fazendo check-in em outras clínicas estão sendo cadastrados na clínica do super admin
- [x] Identificado: backend usava clinicId = 1 como padrão quando não informado
- [x] Tornado clinicId obrigatório na procedure checkins.create
- [x] Adicionada validação para verificar se clínica existe antes de criar check-in
- [x] Adicionada tela de erro quando URL não contém clinicId
- [x] Mensagem clara orientando paciente a usar QR Code da clínica
- [ ] Testar com múltiplas clínicas diferentes

## Correções Menu e Relatórios (05/02/2026)
- [x] Remover página "Orçamentos" do menu lateral (sem funcionalidade)
- [x] Remover rota /orcamentos do App.tsx
- [x] Página Relatórios já busca dados reais do banco (implementação correta)
- [x] Queries implementadas: trpc.dashboard.stats, trpc.appointments.list, trpc.transactions.list, trpc.patients.list
- [x] Gráfico "Receitas x Despesas" exibe transações dos últimos 6 meses
- [x] Gráfico "Consultas por Status" exibe distribuição de status das consultas
- [x] Gráfico "Novos Pacientes" exibe cadastros dos últimos 6 meses
- [x] Gráfico "Consultas por Dia da Semana" exibe distribuição semanal
- [x] Todas as métricas funcionando: Total de Pacientes, Consultas Hoje, Receita do Mês, Itens em Baixa

## Bugs Assinaturas em Documentos (05/02/2026)
- [ ] Assinatura do profissional em atestado e receituário não está centralizada (está alinhada à esquerda)
- [ ] Assinatura digital desenhada no canvas não aparece no PDF gerado
- [ ] Verificar se assinatura está sendo salva no banco de dados
- [ ] Exibir imagem da assinatura digital no PDF ao invés de apenas texto


## Correção de Assinaturas Digitais (05/02/2026)
- [x] Corrigir mismatch de nomenclatura no schema (snake_case → camelCase)
- [x] Aplicar migração do banco de dados (ALTER TABLE renomeando colunas)
- [x] Criar teste automatizado para validar assinaturas
- [x] Assinatura profissional centralizada em Atestado e Receituário
- [x] Assinaturas digitais aparecem como imagem nos PDFs gerados

## Correção Modal de Encaminhamento (05/02/2026)
- [x] Adicionar opção "Buco-Maxilo-Facial" no dropdown de encaminhamento
- [x] Adicionar opção "Odontopediatria" no dropdown de encaminhamento


## Implementar Logística de Atendimento (05/02/2026)
- [x] Área Buco-Maxilo-Facial: corrigir queueType para "maxillofacial"
- [x] Área Odontopediatria: corrigir queueType para "pediatric"
- [x] Adicionar opções no dropdown "Adicionar à Fila" do atendente


## Notificações Visuais no Menu Lateral (09/02/2026)
- [x] Criar procedure `dashboard.paymentStats` para buscar pagamentos pendentes e alertas de retorno
- [x] Criar função `getPendingPayments` no db.ts para filtrar pagamentos por clinicId
- [x] Implementar badges de notificação no menu lateral (Atendente, Orçamentista, Pagamentos, Alertas)
- [x] Corrigir Layout para usar `serviceQueue.stats` em vez de `dashboard.stats`
- [x] Testes criados e passando: dashboard.paymentStats, getPendingPayments, getReturnAlerts
- [x] Badges mostram contagem de pacientes em fila e pagamentos pendentes
- [x] Sistema de notificações funcional com isolamento por clinicId
- [x] Animações visuais para badges: pulse-scale + glow effect
- [x] Destaque no menu item quando há notificações não visualizadas
- [x] Animações CSS customizadas em index.css (pulse-scale, badge-glow, menu-item-highlight)


## Bug: Orçamentista não consegue finalizar sem iniciar atendimento (11/02/2026)
- [x] Remover validação que exige atendimento iniciado para finalizar no Orçamentista
- [x] Permitir atendimentos manuais diretos no Orçamentista sem passar pelo Atendente
- [x] Adicionado comentário na função requestPayment explicando que aceita qualquer status
- [x] Testar finalização de orçamento com sucesso


## Bug: Paciente manual no Orçamentista não finaliza (12/02/2026)
- [x] Criar entrada na fila (serviceQueue) quando paciente é cadastrado manualmente
- [ ] Adicionar logística correta para enviar paciente manual para o Atendente
- [x] Garantir que requestPayment funcione com paciente manual
- [x] Testar fluxo completo: cadastro manual → orçamento → finalização → Atendente


## Tarefa: Criar dados de teste iniciais (21/02/2026)
- [ ] Criar dentistas de teste (Dr. Misael Pinheiro teste, etc)
- [ ] Criar procedimentos pré-configurados (Restaurações, Próteses, Implantes, Canal, Cirurgias)
- [ ] Criar pacientes de teste (Rute teste, Maria teste, etc)
- [ ] Executar seed para todas as clínicas
- [ ] Validar dados no banco
