import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Icon from '../components/Icon';

const money = (value) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(Number(value) || 0);

const noop = () => {};

export default function ContasBancarias({ lancamentos = [], onAccountsChange = noop }) {
  const [contas, setContas] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [agenciaConta, setAgenciaConta] = useState('');
  const [saldo, setSaldo] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.get('/contas')
      .then((response) => {
        setContas(response.data);
        onAccountsChange(response.data);
        setSelectedAccountId((current) => (
          response.data.some((conta) => String(conta.idConta) === current)
            ? current
            : response.data.length ? String(response.data[0].idConta) : ''
        ));
      })
      .catch((error) => {
        console.error('Erro ao carregar contas:', error);
        setErrorMessage('Não foi possível carregar as contas. Verifique se o backend e o banco estão disponíveis.');
      });
  }, [onAccountsChange]);

  const handleSalvarConta = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        nrConta: agenciaConta.trim(),
        saldo: Number(saldo),
      };
      const response = editingId === null
        ? await api.post('/contas', payload)
        : await api.put(`/contas/${editingId}`, payload);
      const updatedAccounts = editingId === null
        ? [response.data, ...contas]
        : contas.map((account) => account.idConta === editingId ? response.data : account);
      setContas(updatedAccounts);
      onAccountsChange(updatedAccounts);
      setSelectedAccountId(String(response.data.idConta));
      setEditingId(null);
      setAgenciaConta('');
      setSaldo('');
      setSuccessMessage(editingId === null ? 'Conta adicionada com sucesso.' : 'Conta atualizada com sucesso.');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      if (!error.response) {
        setErrorMessage('Não foi possível adicionar a conta: o backend não respondeu. Confira se o Spring Boot está rodando.');
      } else {
        const detail = typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data?.detail || error.response.data?.message;
        setErrorMessage(detail
          ? `Não foi possível adicionar a conta: ${detail}`
          : `Não foi possível adicionar a conta (HTTP ${error.response.status}). Verifique o terminal do backend.`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditarConta = (conta) => {
    setEditingId(conta.idConta);
    setSelectedAccountId(String(conta.idConta));
    setAgenciaConta(conta.nrConta || '');
    setSaldo(String(conta.saldo ?? ''));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleExcluirConta = async (conta) => {
    if (!window.confirm(`Excluir a conta "${conta.nrConta}"?`)) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.delete(`/contas/${conta.idConta}`);
      const updatedAccounts = contas.filter((account) => account.idConta !== conta.idConta);
      setContas(updatedAccounts);
      onAccountsChange(updatedAccounts);
      if (selectedAccountId === String(conta.idConta)) setSelectedAccountId(updatedAccounts.length ? String(updatedAccounts[0].idConta) : '');
      if (editingId === conta.idConta) {
        setEditingId(null);
        setAgenciaConta('');
        setSaldo('');
      }
      setSuccessMessage('Conta excluída com sucesso.');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      const detail = error.response?.data?.detail || error.response?.data?.message;
      setErrorMessage(detail
        ? `Não foi possível excluir a conta: ${detail}`
        : 'Não foi possível excluir a conta. Verifique se há lançamentos vinculados.');
    }
  };

  const totalSaldo = contas.reduce((total, conta) => total + (Number(conta.saldo) || 0), 0);
  const selectedAccount = contas.find((conta) => String(conta.idConta) === selectedAccountId);
  const accountTransactions = lancamentos
    .filter((lancamento) => Number(lancamento.contaBancaria?.idConta) === Number(selectedAccountId))
    .sort((first, second) => {
      const byDate = (second.dtLancamento || '').localeCompare(first.dtLancamento || '');
      return byDate || Number(second.idLancamento || 0) - Number(first.idLancamento || 0);
    });

  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">GESTÃO FINANCEIRA</p>
          <h1>Contas bancárias</h1>
        </div>
      </div>
      {errorMessage && <p role="alert" className="notice error-notice">{errorMessage}</p>}
      {successMessage && <p role="status" className="notice success-notice">{successMessage}</p>}

      <section className="summary-grid bank-summary-grid" aria-label="Resumo das contas">
        <article className="summary-card">
          <span className="summary-icon"><Icon name="bank" /></span>
          <div><p>Contas cadastradas</p><strong>{contas.length}</strong></div>
        </article>
        <article className="summary-card">
          <span className="summary-icon"><Icon name="currency" /></span>
          <div><p>Saldo total</p><strong className={totalSaldo < 0 ? 'expense-value' : 'income-value'}>{money(totalSaldo)}</strong></div>
        </article>
      </section>

      <div className="bank-layout">
        <section className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CADASTRO</p>
              <h2>{editingId === null ? 'Adicionar conta' : 'Editar conta'}</h2>
            </div>
          </div>
          <form className="record-form bank-account-form" onSubmit={handleSalvarConta}>
            <label className="full-field">
              Número da conta
              <input
                type="text"
                aria-label="Conta"
                placeholder="Ex.: 765432-1"
                value={agenciaConta}
                onChange={(event) => setAgenciaConta(event.target.value)}
                required
              />
            </label>
            <label className="full-field">
              Saldo inicial (R$)
              <input
                type="number"
                aria-label="Saldo disponível (R$)"
                placeholder="0,00"
                value={saldo}
                onChange={(event) => setSaldo(event.target.value)}
                step="0.01"
                required
              />
            </label>
            <button className="lime-button full-field" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingId === null ? 'Adicionar conta' : 'Salvar alterações'}
            </button>
            {editingId !== null && <button className="outline-button full-field" type="button" onClick={() => { setEditingId(null); setAgenciaConta(''); setSaldo(''); }} disabled={saving}>Cancelar edição</button>}
          </form>
        </section>

        <section className="panel bank-accounts-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">VISÃO GERAL</p>
              <h2>Minhas contas</h2>
            </div>
            <span className="record-count">{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</span>
          </div>
          {contas.length ? (
            <div className="table-scroll">
              <table className="data-table accounts-table">
                <thead>
                  <tr><th>Conta</th><th>Saldo disponível</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {contas.map((conta) => (
                    <tr key={conta.idConta}>
                      <td>
                        <span className="bank-account-number">
                          <span className="bank-account-icon"><Icon name="bank" /></span>
                          {conta.nrConta}
                        </span>
                      </td>
                      <td className={Number(conta.saldo) < 0 ? 'expense-value' : 'income-value'}>{money(conta.saldo)}</td>
                      <td>
                        <button
                          className={`outline-button small-button bank-history-button${selectedAccountId === String(conta.idConta) ? ' selected' : ''}`}
                          type="button"
                          aria-label={`Ver histórico da conta ${conta.nrConta}`}
                          aria-pressed={selectedAccountId === String(conta.idConta)}
                          onClick={() => setSelectedAccountId(String(conta.idConta))}
                        >
                          Histórico
                        </button>
                        <button className="outline-button small-button" type="button" onClick={() => handleEditarConta(conta)}>Editar</button>
                        <button className="delete-button" type="button" onClick={() => handleExcluirConta(conta)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">Nenhuma conta cadastrada. Adicione uma conta para acompanhar seu saldo por aqui.</p>
          )}

          {selectedAccount && (
            <section className="bank-history" aria-label={`Histórico de ${selectedAccount.nrConta}`}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">MOVIMENTAÇÕES DA CONTA</p>
                  <h2>Histórico · {selectedAccount.nrConta}</h2>
                </div>
                <span className="record-count">{accountTransactions.length} {accountTransactions.length === 1 ? 'transação' : 'transações'}</span>
              </div>
              {accountTransactions.length ? (
                <div className="table-scroll">
                  <table className="data-table bank-history-table">
                    <thead>
                      <tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Nota fiscal</th><th>Movimentação</th></tr>
                    </thead>
                    <tbody>
                      {accountTransactions.map((transaction) => {
                        const isExpense = transaction.categoria === 'DESPESA';
                        return (
                          <tr key={transaction.idLancamento}>
                            <td>{transaction.dtLancamento ? new Date(`${transaction.dtLancamento}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                            <td>{transaction.descricao}</td>
                            <td>{transaction.tipoLancamento || 'Outros'}</td>
                            <td>
                              {transaction.incluirNotaFiscal ? (
                                <span className="history-invoice">
                                  <strong>{transaction.nrNotaFiscal || 'Número pendente'}</strong>
                                  <span>{transaction.statusNotaFiscal || 'PENDENTE'}</span>
                                  <span>
                                    Pagamento: {transaction.statusPagamento || 'PENDENTE'}
                                    {transaction.bancoPagamento ? ` · ${transaction.bancoPagamento}` : ''}
                                  </span>
                                </span>
                              ) : 'Sem NF'}
                            </td>
                            <td className={isExpense ? 'expense-value' : 'income-value'}>
                              {isExpense ? '− ' : '+ '}{money(transaction.vlLancamento)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">Ainda não há transações vinculadas a esta conta.</p>
              )}
            </section>
          )}
        </section>
      </div>
    </>
  );
}
