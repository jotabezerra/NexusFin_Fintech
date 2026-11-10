import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import api from './services/api';

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint.startsWith('/analises')
      ? {
          totalReceitas: 0,
          totalDespesas: 0,
          saldo: 0,
          categorias: [],
          mensal: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            receitas: 0,
            despesas: 0,
          })),
        }
      : endpoint === '/contas'
        ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
        : [],
  }));
  api.post.mockReset();
  api.put.mockReset();
  api.delete.mockReset();
});

function enterDemo() {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'demo' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'demo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

test('allows demo login and renders the finance dashboard', async () => {
  render(<App />);
  expect(screen.getByText(/tecnologia que simplifica/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/jotabezerra');
  expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/jo%C3%A3o-pedro-da-silva-bezerra-14562a376/',
  );
  enterDemo();

  expect(await screen.findByRole('heading', { name: 'Visão geral' })).toBeInTheDocument();
  expect(screen.getByText('Desenvolvido por João Pedro da Silva Bezerra')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Dica de organização financeira' })).toBeInTheDocument();
  expect(screen.queryByText('Dica geral, não personalizada.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /REGISTRO Lançamento/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /BANCO Contas/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /PAGAMENTOS Acesse o site oficial do seu banco/i })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /INVESTIMENTOS/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Investimentos' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ANÁLISE Relatórios/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /NOTAS FISCAIS Consulte/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /AVISOS Acompanhe contas negativas/i })).toBeInTheDocument();
  expect(document.querySelector('.user-avatar svg')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('/lancamentos');
});

test('opens the new financial alerts module from the home dashboard', async () => {
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: /AVISOS Acompanhe contas negativas/i }));

  expect(await screen.findByRole('heading', { name: 'Avisos importantes' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Notificações' })).toBeInTheDocument();
});

test('shows important account and unpaid invoice alerts from the notifications button', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas'
      ? [{ idConta: 9, nrConta: 'Conta 009', saldo: -235.5 }]
      : endpoint === '/lancamentos'
        ? [{
            idLancamento: 19,
            incluirNotaFiscal: true,
            nrNotaFiscal: 'NF-88',
            descricao: 'Serviço mensal',
            vlLancamento: 780,
            statusPagamento: 'PROCESSADA',
          }]
        : endpoint.startsWith('/analises')
          ? {
              totalReceitas: 0,
              totalDespesas: 0,
              saldo: 0,
              categorias: [],
              mensal: Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, receitas: 0, despesas: 0 })),
            }
          : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Notificações (2)' }));

  expect(await screen.findByRole('region', { name: 'Notificações importantes' })).toBeInTheDocument();
  expect(screen.getByText('Conta Conta 009 com saldo negativo')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s*235,50/)).toBeInTheDocument();
  expect(screen.getByText('Nota fiscal NF-88')).toBeInTheDocument();
  expect(screen.getByText(/R\$\s*780,00\s*·\s*PROCESSADA/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Nota fiscal NF-88/ }));
  expect(await screen.findByRole('heading', { name: 'Notas fiscais' })).toBeInTheDocument();
});

test('chooses a different profile photo when logging in again', async () => {
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  const firstAvatar = document.querySelector('.user-avatar svg').innerHTML;

  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });

  expect(document.querySelector('.user-avatar svg').innerHTML).not.toBe(firstAvatar);
});

test('creates a financial entry from the records form', async () => {
  api.post.mockResolvedValueOnce({
    data: {
      idLancamento: 1,
      dtLancamento: '2026-11-03',
      vlLancamento: 125.5,
      categoria: 'RECEITA',
      tipoLancamento: 'Serviços',
      contaBancaria: { idConta: 7, nrConta: '12345-6', saldo: 225.5 },
      descricao: 'Serviço',
      incluirNotaFiscal: false,
    },
  });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  fireEvent.change(screen.getByLabelText('Tipo de movimentação'), { target: { value: 'RECEITA' } });
  fireEvent.change(screen.getByLabelText('Tipo de entrada'), { target: { value: 'Exportação' } });
  fireEvent.change(screen.getByLabelText('Conta bancária'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '125.50' } });
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Serviço' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lançar' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/lancamentos', expect.objectContaining({
    vlLancamento: 125.5,
    categoria: 'RECEITA',
    tipoLancamento: 'Exportação',
    contaBancaria: { idConta: 7 },
    descricao: 'Serviço',
  })));
});

test('shows a styled invoice toggle and reveals the invoice number field when enabled', async () => {
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  const invoiceToggle = screen.getByRole('checkbox', { name: /nota fiscal/i });
  expect(invoiceToggle).not.toBeChecked();
  fireEvent.click(invoiceToggle);

  expect(invoiceToggle).toBeChecked();
  expect(screen.getByLabelText('Número da nota (opcional)')).toBeInTheDocument();
});

test('allows a custom type for an expense', async () => {
  api.post.mockResolvedValueOnce({ data: { idLancamento: 2 } });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  fireEvent.change(screen.getByLabelText('Tipo de movimentação'), { target: { value: 'DESPESA' } });
  fireEvent.change(screen.getByLabelText('Tipo de despesa'), { target: { value: 'Outros' } });
  fireEvent.change(screen.getByLabelText('Conta bancária'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Descreva o tipo'), { target: { value: 'Manutenção' } });
  fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '80' } });
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Manutenção de equipamento' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lançar' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/lancamentos', expect.objectContaining({
    categoria: 'DESPESA',
    tipoLancamento: 'Manutenção',
    contaBancaria: { idConta: 7 },
  })));
});

test('allows recategorizing a previous entry so it appears in analysis by type', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas'
      ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
      : endpoint.startsWith('/analises')
        ? {
          totalReceitas: 100,
          totalDespesas: 0,
          saldo: 100,
          categorias: [{
            tipoLancamento: 'Vendas',
            entradas: 100,
            saidas: 0,
            saldo: 100,
          }],
          mensal: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            receitas: 0,
            despesas: 0,
          })),
        }
        : endpoint === '/lancamentos'
          ? [{
          idLancamento: 42,
          dtLancamento: '2026-11-04',
          vlLancamento: 100,
          categoria: 'RECEITA',
          tipoLancamento: 'Outros',
          descricao: 'Venda antiga',
          incluirNotaFiscal: false,
        }]
          : [],
  }));
  api.put.mockResolvedValueOnce({
    data: {
      idLancamento: 42,
      dtLancamento: '2026-11-04',
      vlLancamento: 100,
      categoria: 'RECEITA',
      tipoLancamento: 'Vendas',
      descricao: 'Venda antiga',
      incluirNotaFiscal: false,
    },
  });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  fireEvent.change(screen.getByLabelText('Tipo de Venda antiga'), { target: { value: 'Vendas' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/lancamentos/42/tipo', {
    tipoLancamento: 'Vendas',
  }));
  expect(await screen.findByText(/análise foi recalculada/i)).toBeInTheDocument();
});

test('renders the analysis chart scale and cash flow grouped by type', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint.startsWith('/analises')
      ? {
          totalReceitas: 1250,
          totalDespesas: 200,
          saldo: 1050,
          mensal: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            receitas: index === 0 ? 1250 : 0,
            despesas: index === 0 ? 200 : 0,
          })),
          categorias: [{
            tipoLancamento: 'Vendas',
            entradas: 1250,
            saidas: 200,
            saldo: 1050,
          }],
        }
      : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Análises' }));

  expect(await screen.findByRole('heading', { name: 'Fluxo de caixa por tipo' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Entradas' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'Vendas' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /gráfico mensal de receitas e despesas/i })).toBeInTheDocument();
});

test('shows account balance alerts and unpaid invoices in analysis', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas'
      ? [
          { idConta: 1, nrConta: 'Conta negativa', saldo: -75 },
          { idConta: 2, nrConta: 'Conta positiva', saldo: 420 },
          { idConta: 3, nrConta: 'Conta zerada', saldo: 0 },
        ]
      : endpoint === '/lancamentos'
        ? [
            { idLancamento: 1, incluirNotaFiscal: true, nrNotaFiscal: 'NF-101', descricao: 'Serviço pendente', dtLancamento: '2026-11-02', vlLancamento: 150, statusPagamento: 'PENDENTE' },
            { idLancamento: 2, incluirNotaFiscal: true, nrNotaFiscal: 'NF-102', descricao: 'Serviço processado', dtLancamento: '2026-11-03', vlLancamento: 80, statusPagamento: 'PROCESSADA' },
            { idLancamento: 3, incluirNotaFiscal: true, nrNotaFiscal: 'NF-103', descricao: 'Serviço pago', vlLancamento: 60, statusPagamento: 'PAGA' },
          ]
        : endpoint.startsWith('/analises')
          ? {
              totalReceitas: 0,
              totalDespesas: 0,
              saldo: 0,
              categorias: [],
              mensal: Array.from({ length: 12 }, (_, index) => ({ mes: index + 1, receitas: 0, despesas: 0 })),
            }
          : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Análises' }));

  expect(await screen.findByRole('heading', { name: 'Situação das contas' })).toBeInTheDocument();
  expect(screen.getByText('Conta negativa')).toBeInTheDocument();
  expect(screen.getByText('Conta positiva')).toBeInTheDocument();
  expect(screen.getByText('Conta zerada')).toBeInTheDocument();
  expect(screen.getByText(/está com saldo negativo/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Notas pendentes de pagamento' })).toBeInTheDocument();
  expect(screen.getByText('NF-101')).toBeInTheDocument();
  expect(screen.getByText('NF-102')).toBeInTheDocument();
  expect(screen.queryByText('NF-103')).not.toBeInTheDocument();
});

test('uses the local date as the default date for an entry', async () => {
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  const now = new Date();
  const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  expect(screen.getByLabelText('Data')).toHaveValue(expectedDate);
});

test('explains when the backend is unavailable while saving', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.post.mockRejectedValueOnce(new Error('Network Error'));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Teste' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lançar' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/backend não respondeu/i);
  consoleError.mockRestore();
});

test('creates an account and shows success feedback', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint.startsWith('/analises')
      ? {
          totalReceitas: 0,
          totalDespesas: 0,
          saldo: 0,
          categorias: [],
          mensal: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            receitas: 0,
            despesas: 0,
          })),
        }
      : [],
  }));
  api.post.mockResolvedValueOnce({
    data: { idConta: 1, nrConta: '12345-6', saldo: 250 },
  });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Banco' }));
  await screen.findByRole('heading', { name: 'Contas bancárias' });

  fireEvent.change(screen.getByLabelText('Conta'), { target: { value: '12345-6' } });
  fireEvent.change(screen.getByLabelText('Saldo disponível (R$)'), { target: { value: '250' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar conta' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/contas', {
    nrConta: '12345-6',
    saldo: 250,
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('Conta adicionada com sucesso.');
  expect(screen.getByRole('cell', { name: '12345-6' })).toBeInTheDocument();
});

test('shows only the transactions linked to the selected bank account', async () => {
  const accounts = [
    { idConta: 7, nrConta: '12345-6', saldo: 100 },
    { idConta: 8, nrConta: '98765-4', saldo: -25 },
  ];
  const transactions = [
    {
      idLancamento: 30,
      contaBancaria: { idConta: 7, nrConta: '12345-6' },
      dtLancamento: '2026-11-03',
      categoria: 'RECEITA',
      tipoLancamento: 'Vendas',
      descricao: 'Venda online',
      vlLancamento: 150,
      incluirNotaFiscal: true,
      nrNotaFiscal: 'NF-2026-001',
      statusNotaFiscal: 'INFORMADA',
      statusPagamento: 'PAGA',
      bancoPagamento: 'Nubank',
    },
    {
      idLancamento: 31,
      contaBancaria: { idConta: 8, nrConta: '98765-4' },
      dtLancamento: '2026-11-04',
      categoria: 'DESPESA',
      tipoLancamento: 'Marketing',
      descricao: 'Anúncio',
      vlLancamento: 75,
    },
  ];
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas'
      ? accounts
      : endpoint === '/lancamentos'
        ? transactions
        : endpoint.startsWith('/analises')
          ? {
              totalReceitas: 150,
              totalDespesas: 75,
              saldo: 75,
              categorias: [],
              mensal: Array.from({ length: 12 }, (_, index) => ({
                mes: index + 1,
                receitas: 0,
                despesas: 0,
              })),
            }
          : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Banco' }));

  expect(await screen.findByRole('heading', { name: 'Histórico · 12345-6' })).toBeInTheDocument();
  expect(screen.getByText('Venda online')).toBeInTheDocument();
  expect(screen.getByText('NF-2026-001')).toBeInTheDocument();
  expect(screen.getByText('INFORMADA')).toBeInTheDocument();
  expect(screen.getByText('Pagamento: PAGA · Nubank')).toBeInTheDocument();
  expect(screen.queryByText('Anúncio')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Ver histórico da conta 98765-4' }));

  expect(await screen.findByRole('heading', { name: 'Histórico · 98765-4' })).toBeInTheDocument();
  expect(screen.getByText('Anúncio')).toBeInTheDocument();
  expect(screen.queryByText('Venda online')).not.toBeInTheDocument();
  expect(screen.getByText('− R$ 75,00')).toBeInTheDocument();
});

test('opens the selected bank official website from the payments module', async () => {
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Pagamentos' }));

  expect(await screen.findByRole('heading', { name: 'Escolha seu banco' })).toBeInTheDocument();
  const nubankLink = screen.getByRole('link', { name: /Nubank.*Abrir site oficial/i });
  expect(nubankLink).toHaveAttribute('href', 'https://nubank.com.br/');
  expect(nubankLink).toHaveAttribute('target', '_blank');
  expect(nubankLink).toHaveAttribute('rel', 'noopener noreferrer');
});

test('opens the national invoice issuer portal instead of simulating issuance', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/lancamentos'
      ? [{
          idLancamento: 80,
          dtLancamento: '2026-11-04',
          vlLancamento: 250,
          categoria: 'RECEITA',
          tipoLancamento: 'Serviços',
          descricao: 'Consultoria',
          incluirNotaFiscal: true,
          statusNotaFiscal: 'PENDENTE',
        }]
      : endpoint.startsWith('/analises')
        ? {
            totalReceitas: 0,
            totalDespesas: 0,
            saldo: 0,
            categorias: [],
            mensal: Array.from({ length: 12 }, (_, index) => ({
              mes: index + 1,
              receitas: 0,
              despesas: 0,
            })),
          }
        : endpoint === '/contas'
          ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
          : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Notas fiscais' }));

  const issuerLink = await screen.findByRole('link', { name: 'Acessar emissor' });
  expect(issuerLink).toHaveAttribute('href', 'https://www.nfse.gov.br/EmissorNacional');
  expect(issuerLink).toHaveAttribute('target', '_blank');
  expect(api.post).not.toHaveBeenCalled();
});

test('updates invoice payment status and uploads its receipt', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/lancamentos'
      ? [{
          idLancamento: 81,
          dtLancamento: '2026-11-04',
          vlLancamento: 250,
          categoria: 'RECEITA',
          tipoLancamento: 'Serviços',
          descricao: 'Consultoria paga',
          incluirNotaFiscal: true,
          statusNotaFiscal: 'INFORMADA',
          statusPagamento: 'PENDENTE',
        }]
      : endpoint.startsWith('/analises')
        ? {
            totalReceitas: 0,
            totalDespesas: 0,
            saldo: 0,
            categorias: [],
            mensal: Array.from({ length: 12 }, (_, index) => ({
              mes: index + 1,
              receitas: 0,
              despesas: 0,
            })),
          }
        : endpoint === '/contas'
          ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
          : [],
  }));
  api.put.mockResolvedValueOnce({
    data: {
      idLancamento: 81,
      descricao: 'Consultoria paga',
      incluirNotaFiscal: true,
      statusPagamento: 'PAGA',
      bancoPagamento: 'Nubank',
    },
  });
  api.post.mockResolvedValueOnce({
    data: {
      idLancamento: 81,
      descricao: 'Consultoria paga',
      incluirNotaFiscal: true,
      statusPagamento: 'PAGA',
      comprovanteDisponivel: true,
      comprovanteNome: 'comprovante.pdf',
    },
  });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Notas fiscais' }));

  fireEvent.change(await screen.findByLabelText('Banco do pagamento de Consultoria paga'), {
    target: { value: 'Nubank' },
  });
  fireEvent.change(screen.getByLabelText('Status de pagamento de Consultoria paga'), {
    target: { value: 'PAGA' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar pagamento' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith(
    '/lancamentos/81/pagamento',
    { statusPagamento: 'PAGA', bancoPagamento: 'Nubank' },
  ));
  const file = new File(['%PDF-1.7'], 'comprovante.pdf', { type: 'application/pdf' });
  fireEvent.change(await screen.findByLabelText('Anexar comprovante de Consultoria paga'), {
    target: { files: [file] },
  });

  await waitFor(() => expect(api.post).toHaveBeenCalledWith(
    '/lancamentos/81/comprovante',
    expect.any(FormData),
  ));
  expect(api.post.mock.calls[0][1].get('file')).toBe(file);
  expect(await screen.findByRole('link', { name: 'comprovante.pdf' })).toHaveAttribute(
    'href',
    'http://localhost:8080/api/lancamentos/81/comprovante',
  );
});

test('shows why account creation failed', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  api.post.mockRejectedValueOnce({
    response: { status: 400, data: { message: 'Cadastre um usuário antes de adicionar uma conta.' } },
  });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Banco' }));
  await screen.findByRole('heading', { name: 'Contas bancárias' });

  fireEvent.change(screen.getByLabelText('Conta'), { target: { value: '12345-6' } });
  fireEvent.change(screen.getByLabelText('Saldo disponível (R$)'), { target: { value: '250' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar conta' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Cadastre um usuário antes de adicionar uma conta.');
  consoleError.mockRestore();
});

test('requires a bank account before creating financial entries', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas' ? [] : endpoint.startsWith('/analises')
      ? {
          totalReceitas: 0,
          totalDespesas: 0,
          saldo: 0,
          categorias: [],
          mensal: Array.from({ length: 12 }, (_, index) => ({
            mes: index + 1,
            receitas: 0,
            despesas: 0,
          })),
        }
      : [],
  }));
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByRole('heading', { name: 'Registros' });

  expect(await screen.findByText('Cadastre uma conta bancária antes de criar um lançamento.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Lançar' })).toBeDisabled();
});

test('rejects credentials that do not match the documented demo login', async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: 'outra-pessoa' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'demo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha incorretos');
});

test('shows a custom not found page for unknown routes', async () => {
  window.history.pushState({}, '', '/caminho-inexistente');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Este caminho não existe' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Voltar ao início' }));
  expect(await screen.findByText(/tecnologia que simplifica/i)).toBeInTheDocument();
});

test('creates and edits users through the user management module', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/usuarios'
      ? [{ idUsuario: 4, nome: 'Ana', email: 'ana@example.com', dtCriacao: '2026-01-01' }]
      : endpoint.startsWith('/analises')
        ? { totalReceitas: 0, totalDespesas: 0, saldo: 0, categorias: [], mensal: [] }
        : endpoint === '/contas' ? [] : [],
  }));
  api.post.mockResolvedValueOnce({ data: { idUsuario: 5 } });
  api.put.mockResolvedValueOnce({ data: { idUsuario: 4 } });
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Usuários' }));
  await screen.findByRole('heading', { name: 'Usuários cadastrados' });

  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Bia' } });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'bia@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar usuário' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/usuarios', expect.objectContaining({
    nome: 'Bia',
    email: 'bia@example.com',
  })));

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Maria' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/usuarios/4', expect.objectContaining({
    nome: 'Ana Maria',
    email: 'ana@example.com',
  })));
});

test('explains that a user cannot be deleted while related accounts exist', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/usuarios'
      ? [{ idUsuario: 4, nome: 'Ana', email: 'ana@example.com', dtCriacao: '2026-01-01' }]
      : endpoint.startsWith('/analises')
        ? { totalReceitas: 0, totalDespesas: 0, saldo: 0, categorias: [], mensal: [] }
        : [],
  }));
  api.delete.mockRejectedValueOnce({
    response: {
      status: 409,
      data: { status: 409, error: 'Conflict' },
    },
  });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Usuários' }));
  await screen.findByText('ana@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'primeiro remova ou transfira as contas bancárias associadas',
  );
  expect(screen.getByText('ana@example.com')).toBeInTheDocument();
  confirm.mockRestore();
  consoleError.mockRestore();
});

test('shows a useful hint when user deletion returns an internal server error', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/usuarios'
      ? [{ idUsuario: 4, nome: 'Ana', email: 'ana@example.com', dtCriacao: '2026-01-01' }]
      : endpoint.startsWith('/analises')
        ? { totalReceitas: 0, totalDespesas: 0, saldo: 0, categorias: [], mensal: [] }
        : [],
  }));
  api.delete.mockRejectedValueOnce({
    response: {
      status: 500,
      data: { title: 'Internal Server Error' },
    },
  });
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Usuários' }));
  await screen.findByText('ana@example.com');
  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Reinicie o backend atualizado e confira o erro detalhado no terminal',
  );
  confirm.mockRestore();
  consoleError.mockRestore();
});

test('updates and deletes a bank account through its module', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/contas'
      ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
      : endpoint.startsWith('/analises')
        ? { totalReceitas: 0, totalDespesas: 0, saldo: 0, categorias: [], mensal: [] }
        : [],
  }));
  api.put.mockResolvedValueOnce({ data: { idConta: 7, nrConta: '12345-6', saldo: 250 } });
  api.delete.mockResolvedValueOnce({});
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Banco' }));
  await screen.findByRole('heading', { name: 'Contas bancárias' });

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByLabelText('Saldo disponível (R$)'), { target: { value: '250' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/contas/7', { nrConta: '12345-6', saldo: 250 }));

  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/contas/7'));
  confirm.mockRestore();
});

test('edits and deletes a financial entry through its module', async () => {
  api.get.mockImplementation((endpoint) => Promise.resolve({
    data: endpoint === '/lancamentos'
      ? [{
          idLancamento: 19,
          dtLancamento: '2026-03-10',
          vlLancamento: 120,
          categoria: 'RECEITA',
          tipoLancamento: 'Serviços',
          descricao: 'Serviço original',
          incluirNotaFiscal: false,
          contaBancaria: { idConta: 7, nrConta: '12345-6' },
        }]
      : endpoint === '/contas'
        ? [{ idConta: 7, nrConta: '12345-6', saldo: 100 }]
        : endpoint.startsWith('/analises')
          ? { totalReceitas: 0, totalDespesas: 0, saldo: 0, categorias: [], mensal: [] }
          : [],
  }));
  api.put.mockResolvedValueOnce({ data: { idLancamento: 19, descricao: 'Serviço atualizado' } });
  api.delete.mockResolvedValueOnce({});
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  enterDemo();
  await screen.findByRole('heading', { name: 'Visão geral' });
  fireEvent.click(screen.getByRole('button', { name: 'Registros' }));
  await screen.findByText('Serviço original');

  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Serviço atualizado' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/lancamentos/19', expect.objectContaining({
    descricao: 'Serviço atualizado',
    contaBancaria: { idConta: 7 },
    vlLancamento: 120,
  })));

  fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/lancamentos/19'));
  confirm.mockRestore();
});
