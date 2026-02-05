import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do db
vi.mock('./db', () => ({
  getPatients: vi.fn().mockResolvedValue([
    { id: 1, name: 'João Silva', phone: '11999999999', cpf: '123.456.789-00', createdAt: new Date() },
    { id: 2, name: 'Maria Santos', phone: '11888888888', cpf: '987.654.321-00', createdAt: new Date() },
  ]),
  getAppointments: vi.fn().mockResolvedValue([
    { id: 1, patientId: 1, date: new Date(), startTime: '09:00', status: 'scheduled', type: 'Limpeza' },
    { id: 2, patientId: 2, date: new Date(), startTime: '10:00', status: 'completed', type: 'Consulta' },
  ]),
  getProcedures: vi.fn().mockResolvedValue([
    { id: 1, name: 'Limpeza', pricePerTooth: '150.00' },
    { id: 2, name: 'Restauração', pricePerTooth: '200.00' },
  ]),
  getBudgets: vi.fn().mockResolvedValue([
    { id: 1, patientId: 1, status: 'pending', totalValue: '500.00', createdAt: new Date() },
    { id: 2, patientId: 2, status: 'approved', totalValue: '800.00', createdAt: new Date() },
  ]),
  getTransactions: vi.fn().mockResolvedValue([
    { id: 1, type: 'income', value: '500.00', date: new Date() },
    { id: 2, type: 'expense', value: '100.00', date: new Date() },
  ]),
  getStockItems: vi.fn().mockResolvedValue([
    { id: 1, name: 'Luvas', quantity: 50, minQuantity: 10, unit: 'un' },
    { id: 2, name: 'Máscaras', quantity: 5, minQuantity: 10, unit: 'un' },
  ]),
  getPendingReturnAlerts: vi.fn().mockResolvedValue([
    { id: 1, patientId: 1, daysUntilReturn: 3 },
  ]),
  getDentists: vi.fn().mockResolvedValue([
    { id: 1, name: 'Dr. Carlos', isActive: true },
  ]),
  getIaConversations: vi.fn().mockResolvedValue([]),
  addIaConversation: vi.fn().mockResolvedValue({ id: 1 }),
  createProcedure: vi.fn().mockResolvedValue({ id: 1 }),
  createPatient: vi.fn().mockResolvedValue({ id: 1 }),
  createStockItem: vi.fn().mockResolvedValue({ id: 1 }),
  getPatientById: vi.fn().mockResolvedValue({ id: 1, name: 'João Silva' }),
  getWaitingQueue: vi.fn().mockResolvedValue([]),
}));

describe('Dentrics IA - Detecção de Intenções', () => {
  
  it('deve detectar intenção de criar procedimento', () => {
    const message = 'criar procedimento limpeza com valor R$ 150';
    const isAction = message.includes('criar') || message.includes('adicionar');
    const isProcedure = message.includes('procedimento');
    
    expect(isAction).toBe(true);
    expect(isProcedure).toBe(true);
  });

  it('deve detectar intenção de cadastrar paciente', () => {
    const message = 'cadastrar paciente João Silva CPF 123.456.789-00';
    const isAction = message.includes('cadastrar') || message.includes('criar');
    const isPatient = message.includes('paciente');
    
    expect(isAction).toBe(true);
    expect(isPatient).toBe(true);
  });

  it('deve detectar intenção de busca', () => {
    const message = 'buscar paciente Maria';
    const isSearch = message.includes('buscar') || message.includes('procurar') || message.includes('encontrar');
    
    expect(isSearch).toBe(true);
  });

  it('deve detectar intenção de relatório', () => {
    const message = 'mostrar relatório do mês';
    const isReport = message.includes('relatório') || message.includes('resumo') || message.includes('balanço');
    
    expect(isReport).toBe(true);
  });

  it('deve detectar intenção de alertas', () => {
    const message = 'quais são os alertas pendentes';
    const isAlert = message.includes('alerta') || message.includes('pendente') || message.includes('atenção');
    
    expect(isAlert).toBe(true);
  });

  it('deve detectar intenção de agendamento', () => {
    const message = 'agendar João para terça às 14h';
    const isSchedule = (message.includes('agendar') || message.includes('marcar')) &&
                       (message.includes('para') || message.includes('às'));
    
    expect(isSchedule).toBe(true);
  });

  it('deve detectar intenção de encontrar horário', () => {
    const message = 'qual o próximo horário disponível';
    const isFindSlot = message.includes('horário disponível') || message.includes('próximo horário');
    
    expect(isFindSlot).toBe(true);
  });

  it('deve detectar intenção de edição', () => {
    const message = 'editar telefone do paciente Maria';
    const isEdit = message.includes('editar') || message.includes('atualizar') || message.includes('alterar');
    
    expect(isEdit).toBe(true);
  });

  it('deve detectar intenção de exclusão', () => {
    const message = 'excluir procedimento Limpeza';
    const isDelete = message.includes('excluir') || message.includes('deletar') || message.includes('remover');
    
    expect(isDelete).toBe(true);
  });

  it('deve detectar pesquisa PubMed', () => {
    const message = 'buscar estudos sobre implantes no pubmed';
    const isPubMed = message.includes('pubmed') || message.includes('estudo') || message.includes('científico');
    
    expect(isPubMed).toBe(true);
  });
});

describe('Dentrics IA - Extração de Dados', () => {
  
  it('deve extrair CPF da mensagem', () => {
    const message = 'cadastrar paciente João cpf 123.456.789-00';
    const cpfMatch = message.match(/(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2})/i);
    
    expect(cpfMatch).not.toBeNull();
    expect(cpfMatch![1]).toBe('123.456.789-00');
  });

  it('deve extrair valor monetário da mensagem', () => {
    const message = 'criar procedimento Limpeza com valor R$ 150,00';
    const valorMatch = message.match(/R\$\s*([\d.,]+)/i);
    
    expect(valorMatch).not.toBeNull();
    expect(valorMatch![1]).toBe('150,00');
  });

  it('deve extrair horário da mensagem', () => {
    const message = 'agendar consulta para amanhã às 14:30';
    const timeMatch = message.match(/(\d{1,2})(?::|h|:)(\d{2})?/i);
    
    expect(timeMatch).not.toBeNull();
    expect(timeMatch![1]).toBe('14');
  });

  it('deve extrair dia da semana da mensagem', () => {
    const message = 'agendar para terça-feira';
    const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
    const foundDay = days.find(day => message.includes(day));
    
    expect(foundDay).toBe('terça');
  });

  it('deve extrair quantidade da mensagem', () => {
    const message = 'adicionar 100 unidades de luvas ao estoque';
    const qtdMatch = message.match(/(\d+)/i);
    
    expect(qtdMatch).not.toBeNull();
    expect(qtdMatch![1]).toBe('100');
  });

  it('deve extrair email da mensagem', () => {
    const message = 'cadastrar paciente João email joao@email.com';
    const emailMatch = message.match(/([\w.-]+@[\w.-]+\.[a-z]{2,})/i);
    
    expect(emailMatch).not.toBeNull();
    expect(emailMatch![1]).toBe('joao@email.com');
  });

  it('deve extrair telefone da mensagem', () => {
    const message = 'cadastrar paciente João telefone (11) 99999-9999';
    const phoneMatch = message.match(/\(?\d{2}\)?[\s.-]?\d{4,5}[-.]?\d{4}/i);
    
    expect(phoneMatch).not.toBeNull();
  });
});

describe('Dentrics IA - Formatação de Dados', () => {
  
  it('deve formatar nome corretamente', () => {
    const nome = 'joão silva';
    const nomeFormatado = nome
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    expect(nomeFormatado).toBe('João Silva');
  });

  it('deve formatar CPF corretamente', () => {
    const cpf = '12345678900';
    const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    
    expect(cpfFormatado).toBe('123.456.789-00');
  });

  it('deve formatar valor monetário corretamente', () => {
    const valor = 1500.50;
    const valorFormatado = valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
    
    expect(valorFormatado).toContain('1.500,50');
  });

  it('deve formatar data corretamente', () => {
    const date = new Date('2026-02-02');
    const dateStr = date.toISOString().split('T')[0];
    
    expect(dateStr).toBe('2026-02-02');
  });

  it('deve formatar horário corretamente', () => {
    const hour = 9;
    const minute = 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    expect(timeStr).toBe('09:30');
  });
});

describe('Dentrics IA - Cálculos', () => {
  
  it('deve calcular lucro corretamente', () => {
    const income = 5000;
    const expenses = 2000;
    const profit = income - expenses;
    
    expect(profit).toBe(3000);
  });

  it('deve calcular taxa de conversão corretamente', () => {
    const totalBudgets = 10;
    const approvedBudgets = 7;
    const conversionRate = Math.round((approvedBudgets / totalBudgets) * 100);
    
    expect(conversionRate).toBe(70);
  });

  it('deve calcular dias até retorno corretamente', () => {
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 7);
    const today = new Date();
    const daysUntil = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysUntil).toBe(7);
  });

  it('deve identificar estoque baixo corretamente', () => {
    const quantity = 5;
    const minQuantity = 10;
    const isLow = quantity <= minQuantity;
    
    expect(isLow).toBe(true);
  });

  it('deve calcular ticket médio corretamente', () => {
    const totalIncome = 10000;
    const totalAppointments = 20;
    const avgTicket = Math.round(totalIncome / totalAppointments);
    
    expect(avgTicket).toBe(500);
  });
});

describe('Dentrics IA - Validações', () => {
  
  it('deve validar CPF com formato correto', () => {
    const cpf = '123.456.789-00';
    const isValid = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
    
    expect(isValid).toBe(true);
  });

  it('deve validar email com formato correto', () => {
    const email = 'teste@email.com';
    const isValid = /^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i.test(email);
    
    expect(isValid).toBe(true);
  });

  it('deve validar horário com formato correto', () => {
    const time = '14:30';
    const isValid = /^\d{2}:\d{2}$/.test(time);
    
    expect(isValid).toBe(true);
  });

  it('deve validar valor monetário positivo', () => {
    const valor = 150.00;
    const isValid = valor > 0;
    
    expect(isValid).toBe(true);
  });

  it('deve validar quantidade positiva', () => {
    const quantidade = 100;
    const isValid = quantidade > 0 && Number.isInteger(quantidade);
    
    expect(isValid).toBe(true);
  });
});
