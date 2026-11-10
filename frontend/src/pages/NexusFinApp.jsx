import ContasBancarias from './ContasBancarias';
import React, { useCallback, useEffect, useState } from 'react';
import Icon from '../components/Icon';
import Usuarios from './Usuarios';
import { PageTitle } from './Shared';
import api from '../services/api';
import './NexusFinApp.css';

const navigation = [
    { id: 'home', path: '/', label: 'Home', icon: 'home' },
    { id: 'registros', path: '/registros', label: 'Registros', icon: 'receipt' },
    { id: 'banco', path: '/contas', label: 'Banco', icon: 'bank' },
    { id: 'pagamentos', path: '/pagamentos', label: 'Pagamentos', icon: 'card' },
    { id: 'usuarios', path: '/usuarios', label: 'Usuários', icon: 'user' },
    { id: 'analises', path: '/analises', label: 'Análises', icon: 'chart' },
    { id: 'notas', path: '/notas', label: 'Notas fiscais', icon: 'invoice' },
    { id: 'avisos', path: '/avisos', label: 'Avisos', icon: 'alert' },
];

const avatarPalettes = [
    ['#152d45', '#35d0ba', '#a3ff33'],
    ['#422552', '#fc77b4', '#ffd166'],
    ['#183c3b', '#56cfe1', '#b8f2e6'],
    ['#552b28', '#ff8066', '#ffd670'],
    ['#26325b', '#8e9cff', '#a3ff33'],
    ['#433718', '#e9c46a', '#f4a261'],
    ['#263e32', '#80ed99', '#57cc99'],
    ['#49365a', '#c77dff', '#72efdd'],
];

const money = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(Number(value) || 0);

const dateLabel = (value) => {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
};

const localDateInputValue = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
};

const entryTypes = {
    RECEITA: ['Vendas', 'Serviços', 'Exportação', 'Devolução', 'Reembolso', 'Outros'],
    DESPESA: ['Marketing', 'Serviços', 'Importação', 'Fornecedores e insumos', 'Salários', 'Impostos', 'Aluguel', 'Frete', 'Outros'],
};

const paymentBanks = [
    { name: 'Nubank', url: 'https://nubank.com.br/', description: 'Acesse sua conta e faça pagamentos pelo Nubank.' },
    { name: 'Itaú', url: 'https://www.itau.com.br/', description: 'Acesse o internet banking oficial do Itaú.' },
    { name: 'Banco do Brasil', url: 'https://www.bb.com.br/', description: 'Acesse os serviços digitais do Banco do Brasil.' },
    { name: 'Bradesco', url: 'https://banco.bradesco/html/classic/index.shtm', description: 'Acesse sua conta pelo site oficial do Bradesco.' },
    { name: 'Santander', url: 'https://www.santander.com.br/', description: 'Acesse os serviços digitais do Santander.' },
    { name: 'Caixa', url: 'https://www.caixa.gov.br/', description: 'Acesse o site oficial da Caixa Econômica Federal.' },
    { name: 'Inter', url: 'https://inter.co/', description: 'Acesse sua conta pelo site oficial do Inter.' },
    { name: 'C6 Bank', url: 'https://www.c6bank.com.br/', description: 'Acesse os serviços digitais do C6 Bank.' },
];
const paymentBankNames = paymentBanks.map((bank) => bank.name);

const invoicePortalUrl = 'https://www.nfse.gov.br/EmissorNacional';
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const isPublicDemo = process.env.REACT_APP_DEMO_MODE === 'true';
const publicBasePath = process.env.PUBLIC_URL && process.env.PUBLIC_URL !== '.'
    ? new URL(process.env.PUBLIC_URL, window.location.origin).pathname.replace(/\/$/, '')
    : '';
const financialTips = [
    'Registre entradas e despesas perto do momento em que acontecem para manter seus relatórios atualizados.',
    'Use descrições claras nos lançamentos para localizar mais facilmente cada movimentação no histórico.',
    'Revise periodicamente os saldos das contas e compare-os com os extratos bancários.',
    'Categorize receitas e despesas de forma consistente para facilitar a comparação entre períodos.',
    'Acompanhe o status de pagamento das notas fiscais e mantenha os comprovantes anexados quando disponíveis.',
];

function routeFromLocation(pathname) {
    if (!publicBasePath) return pathname;
    if (pathname === publicBasePath || pathname === `${publicBasePath}/`) return '/';
    return pathname.startsWith(`${publicBasePath}/`) ? pathname.slice(publicBasePath.length) : pathname;
}

function urlForRoute(route) {
    return publicBasePath ? `${publicBasePath}${route === '/' ? '/' : route}` : route;
}

function apiErrorMessage(error, action) {
    if (!error.response) {
        if (isPublicDemo) {
            return `Não foi possível ${action}: ocorreu um erro na demonstração pública.`;
        }
        return `Não foi possível ${action}: o backend não respondeu. Inicie o Spring Boot na pasta nexusfin e confira se a API está disponível em http://localhost:8080.`;
    }

    const { status, data } = error.response;
    const serverMessage = typeof data === 'string' ? data : data?.detail || data?.message;

    if (status === 400 && serverMessage) {
        return `Não foi possível ${action}: ${serverMessage}`;
    }
    if (status >= 500) {
        const detail = serverMessage ? ` Detalhe: ${serverMessage}` : '';
        return `Não foi possível ${action}: o backend encontrou um erro.${detail} Verifique o terminal do backend.`;
    }
    if (status === 404) {
        return `Não foi possível ${action}: a rota não foi encontrada. Reinicie o backend atualizado.`;
    }
    return `Não foi possível ${action}: o backend respondeu com HTTP ${status}.`;
}

function Logo({ dark = false }) {
    return (
        <span className={`nexus-logo${dark ? ' nexus-logo-dark' : ''}`}>
            <span className="nexus-mark" aria-hidden="true"><i /><i /></span>
            <span>nexus<span className="logo-accent">fin</span></span>
        </span>
    );
}

function CreatorFooter() {
    return (
        <footer className="creator-footer">
            <span>Desenvolvido por João Pedro da Silva Bezerra</span>
            <span className="creator-footer-links">
                <a href="https://github.com/jotabezerra" target="_blank" rel="noopener noreferrer">GitHub</a>
                <a
                    href="https://www.linkedin.com/in/jo%C3%A3o-pedro-da-silva-bezerra-14562a376/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    LinkedIn
                </a>
            </span>
        </footer>
    );
}

function AbstractAvatar({ variant }) {
    const [background, primary, secondary] = avatarPalettes[variant];
    const patterns = [
        <><circle cx="32" cy="32" r="20" fill={primary} /><path d="M32 12a20 20 0 0 1 0 40Z" fill={secondary} /><circle cx="32" cy="32" r="8" fill={background} /></>,
        <><path d="M8 24 32 10l24 14v22L32 60 8 46Z" fill={primary} /><path d="m8 24 24 14 24-14M32 38v22" fill="none" stroke={secondary} strokeWidth="5" strokeLinejoin="round" /><circle cx="32" cy="30" r="6" fill={background} /></>,
        <><rect x="14" y="14" width="36" height="36" rx="8" transform="rotate(15 32 32)" fill={primary} /><circle cx="32" cy="32" r="13" fill={secondary} /><path d="M32 19v26M19 32h26" stroke={background} strokeWidth="5" strokeLinecap="round" /></>,
        <><path d="M32 8 56 32 32 56 8 32Z" fill={primary} /><path d="m32 8 24 24H32Z" fill={secondary} /><circle cx="32" cy="32" r="7" fill={background} /></>,
        <><circle cx="24" cy="25" r="13" fill={primary} /><circle cx="40" cy="39" r="13" fill={secondary} /><path d="m27 27 10 10" stroke={background} strokeWidth="6" strokeLinecap="round" /><circle cx="32" cy="32" r="4" fill="#fff" /></>,
        <><path d="M12 43 23 14h18l11 29-20 13Z" fill={primary} /><path d="m23 14 9 42 9-42Z" fill={secondary} /><circle cx="32" cy="34" r="6" fill={background} /></>,
        <><path d="M32 9 38 25l17 1-13 11 4 17-14-9-14 9 4-17L9 26l17-1Z" fill={primary} /><circle cx="32" cy="32" r="7" fill={secondary} /></>,
        <><rect x="10" y="10" width="44" height="44" rx="22" fill={primary} /><path d="M14 32h36M32 14v36" stroke={secondary} strokeWidth="8" /><circle cx="32" cy="32" r="8" fill={background} /></>,
    ];

    return (
        <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="32" fill={background} />
            {patterns[variant]}
        </svg>
    );
}

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    function submit(event) {
        event.preventDefault();
        if (username.trim() !== 'demo' || password !== 'demo') {
            setError('Usuário ou senha incorretos. Use as credenciais de demonstração indicadas.');
            return;
        }
        onLogin('Demonstração');
    }

    return (
        <main className="login-screen">
            <section className="login-brand">
                <Logo dark />
                <p>Tecnologia que simplifica,<br />lucro que aparece.</p>
                {isPublicDemo && (
                    <p className="public-demo-notice" role="note">
                        Demonstração pública com dados fictícios. Alterações valem apenas nesta sessão.
                    </p>
                )}
            </section>
            <section className="login-side">
                <form className="login-card" onSubmit={submit}>
                    <label htmlFor="login-user">Usuário</label>
                    <input
                        id="login-user"
                        autoComplete="username"
                        placeholder="Informe o seu usuário"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                    />
                    <label htmlFor="login-password">Senha</label>
                    <input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Informe a sua senha"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <div className="login-options">
                        <label><input type="checkbox" defaultChecked /> Continuar conectado(a)</label>
                        <span>Usuário: demo · Senha: demo</span>
                    </div>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    <button className="lime-button login-submit" type="submit">Entrar</button>
                    <p className="demo-notice">Acesso demonstrativo: não há autenticação real.</p>
                </form>
            </section>
            <CreatorFooter />
        </main>
    );
}

function AppHeader({ username, profileAvatar, contas, records, onNavigate, onLogout }) {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const negativeAccounts = contas.filter((account) => Number(account.saldo) < 0);
    const unpaidInvoices = records.filter((record) => (
        record.incluirNotaFiscal
        && !['PAGA', 'CANCELADA'].includes(String(record.statusPagamento || 'PENDENTE').toUpperCase())
    ));
    const notifications = [
        ...negativeAccounts.map((account) => ({
            id: `account-${account.idConta}`,
            title: `Conta ${account.nrConta || account.idConta} com saldo negativo`,
            detail: money(account.saldo),
            destination: 'banco',
            type: 'warning',
        })),
        ...unpaidInvoices.map((invoice) => ({
            id: `invoice-${invoice.idLancamento}`,
            title: `Nota fiscal ${invoice.nrNotaFiscal || 'sem número'}`,
            detail: `${money(invoice.vlLancamento)} · ${invoice.statusPagamento || 'PENDENTE'}`,
            destination: 'notas',
            type: 'pending',
        })),
    ];

    function openNotification(notification) {
        setNotificationsOpen(false);
        onNavigate(notification.destination);
    }

    return (
        <header className="app-header">
            <a className="header-brand" href="#home" aria-label="NexusFin - início"><Logo /></a>
            <div className="header-actions">
                <span className="user-chip">
                    <span className="user-avatar" aria-hidden="true">
                        <AbstractAvatar variant={profileAvatar} />
                    </span>
                    {username}
                </span>
                <div className="notification-container">
                    <button
                        className="header-icon notification-trigger"
                        type="button"
                        aria-label={`Notificações${notifications.length ? ` (${notifications.length})` : ''}`}
                        aria-expanded={notificationsOpen}
                        aria-controls="notification-panel"
                        onClick={() => setNotificationsOpen((open) => !open)}
                    >
                        <Icon name="bell" />
                        {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
                    </button>
                    {notificationsOpen && (
                        <section className="notification-panel" id="notification-panel" aria-label="Notificações importantes">
                            <div className="notification-panel-heading">
                                <div><p className="eyebrow">CENTRAL DE AVISOS</p><h2>Notificações</h2></div>
                                <span className="record-count">{notifications.length} {notifications.length === 1 ? 'aviso' : 'avisos'}</span>
                            </div>
                            {notifications.length ? (
                                <ul className="notification-list">
                                    {notifications.map((notification) => (
                                        <li key={notification.id}>
                                            <button
                                                className={`notification-item notification-${notification.type}`}
                                                type="button"
                                                onClick={() => openNotification(notification)}
                                            >
                                                <span className="notification-dot" aria-hidden="true" />
                                                <span className="notification-copy">
                                                    <strong>{notification.title}</strong>
                                                    <span>{notification.detail}</span>
                                                </span>
                                                <span className="notification-arrow"><Icon name="arrow" /></span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="notification-empty">Nenhum aviso importante no momento. Suas contas e notas fiscais estão em dia.</p>
                            )}
                        </section>
                    )}
                </div>
                <button className="header-icon" type="button" aria-label="Sair" onClick={onLogout}><Icon name="logout" /></button>
            </div>
        </header>
    );
}

function Sidebar({ active, onNavigate }) {
    return (
        <nav className="sidebar" aria-label="Navegação principal">
            {navigation.map((item) => (
                <button
                    className={`nav-item${active === item.id ? ' active' : ''}`}
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                >
                    <span className="nav-icon"><Icon name={item.icon} /></span>
                    {item.label}
                </button>
            ))}
        </nav>
    );
}

function SummaryCard({ icon, label, value }) {
    return (
        <article className="summary-card">
            <span className="summary-icon"><Icon name={icon} /></span>
            <div><p>{label}</p><strong>{value}</strong></div>
        </article>
    );
}

function HomePage({ onNavigate, lancamentos, contas, analise, error }) {
    const [financialTip] = useState(() => financialTips[Math.floor(Math.random() * financialTips.length)]);
    const totalReceitas = Number(analise?.totalReceitas) || lancamentos
        .filter((item) => item.categoria === 'RECEITA')
        .reduce((sum, item) => sum + Number(item.vlLancamento || 0), 0);
    const totalDespesas = Number(analise?.totalDespesas) || lancamentos
        .filter((item) => item.categoria === 'DESPESA')
        .reduce((sum, item) => sum + Number(item.vlLancamento || 0), 0);
    const saldo = Number(analise?.saldo) || totalReceitas - totalDespesas;
    const modules = [
        { id: 'registros', title: 'REGISTRO', description: 'Lançamento de lucros e despesas', icon: 'receipt' },
        { id: 'banco', title: 'BANCO', description: 'Contas e saldos', icon: 'bank' },
        { id: 'pagamentos', title: 'PAGAMENTOS', description: 'Acesse o site oficial do seu banco', icon: 'card' },
        { id: 'analises', title: 'ANÁLISE', description: 'Relatórios financeiros', icon: 'chart' },
        { id: 'notas', title: 'NOTAS FISCAIS', description: 'Consulte e simule notas fiscais', icon: 'invoice' },
        { id: 'avisos', title: 'AVISOS', description: 'Acompanhe contas negativas e notas pendentes', icon: 'alert' },
    ];

    return (
        <>
            <PageTitle eyebrow="PAINEL FINANCEIRO" title="Visão geral" />
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            <section className="summary-grid" aria-label="Resumo financeiro">
                <SummaryCard icon="wallet" label="Saldo disponível" value={money(saldo)} />
                <SummaryCard icon="income" label="Receitas" value={money(totalReceitas)} />
                <SummaryCard icon="expense" label="Despesas" value={money(totalDespesas)} />
            </section>
            <section className="panel financial-tip-panel" aria-label="Dica de organização financeira">
                <span className="financial-tip-icon"><Icon name="info" /></span>
                <div>
                    <p className="eyebrow">DICA DE ORGANIZAÇÃO</p>
                    <h2>Uma boa prática para seu controle financeiro</h2>
                    <p>{financialTip}</p>
                </div>
            </section>
            <section className="module-grid" aria-label="Módulos financeiros">
                {modules.map((module) => (
                    <button
                        className="module-card"
                        key={module.id}
                        type="button"
                        onClick={() => onNavigate(module.id)}
                    >
                        <span className="module-icon"><Icon name={module.icon} /></span>
                        <span className="module-caption">
                            <strong>{module.title}</strong>
                            <span>{module.description}</span>
                        </span>
                    </button>
                ))}
            </section>
            <section className="panel home-alert-panel">
                <div className="panel-heading">
                    <div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Alertas financeiros</h2></div>
                    <button className="text-button" type="button" onClick={() => onNavigate('avisos')}>Ver avisos</button>
                </div>
                <p className="home-alert-copy">Consulte contas com saldo negativo e notas fiscais que ainda aguardam pagamento.</p>
            </section>
            <section className="panel recent-panel">
                <div className="panel-heading">
                    <div><p className="eyebrow">MOVIMENTAÇÕES</p><h2>Registros recentes</h2></div>
                    <button className="text-button" type="button" onClick={() => onNavigate('registros')}>Ver todos</button>
                </div>
                <RecordsTable records={lancamentos.slice(0, 5)} />
            </section>
            <section className="panel quick-info">
                <span><strong>{contas.length}</strong> conta(s) bancária(s) conectada(s)</span>
                <button className="text-button" type="button" onClick={() => onNavigate('banco')}>Acessar banco</button>
            </section>
        </>
    );
}

function RecordTypeEditor({ record, onUpdateType, saving }) {
    const [type, setType] = useState(record.tipoLancamento || 'Outros');
    const availableTypes = entryTypes[record.categoria] || entryTypes.RECEITA;
    const options = availableTypes.includes(type) ? availableTypes : [type, ...availableTypes];

    return (
        <div className="record-type-editor">
            <select
                aria-label={`Tipo de ${record.descricao}`}
                value={type}
                onChange={(event) => setType(event.target.value)}
            >
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {type !== (record.tipoLancamento || 'Outros') && (
                <button
                    className="text-button"
                    type="button"
                    onClick={() => onUpdateType(record, type)}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar'}
                </button>
            )}
        </div>
    );
}

function RecordsTable({ records, onDelete, onUpdate, onEdit, onUpdateType, updatingTypeId }) {
    if (!records.length) {
        return <p className="empty-state">Nenhum lançamento encontrado. Registre sua primeira movimentação.</p>;
    }
    return (
        <div className="table-scroll">
            <table className="data-table records-table">
                <thead><tr>
                    <th>Data</th><th>Descrição</th><th>Conta</th><th>Categoria</th><th>Tipo</th><th>Nota fiscal</th><th>Valor</th>
                    {(onDelete || onUpdate || onUpdateType) && <th>Ação</th>}
                </tr></thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.idLancamento}>
                            <td>{dateLabel(record.dtLancamento)}</td>
                            <td>{record.descricao}</td>
                            <td>{record.contaBancaria?.nrConta || 'Sem conta'}</td>
                            <td><span className={`category-tag ${record.categoria?.toLowerCase()}`}>{record.categoria}</span></td>
                            <td>{onUpdateType
                                ? <RecordTypeEditor
                                    record={record}
                                    onUpdateType={onUpdateType}
                                    saving={updatingTypeId === record.idLancamento}
                                />
                                : record.tipoLancamento || 'Outros'}
                            </td>
                            <td>{record.incluirNotaFiscal ? record.nrNotaFiscal || 'Pendente' : 'Não'}</td>
                            <td className={record.categoria === 'DESPESA' ? 'expense-value' : 'income-value'}>
                                {money(record.vlLancamento)}
                            </td>
                            {(onDelete || onUpdate || onUpdateType) && (
                                <td className="user-actions">
                                    {onEdit && <button className="outline-button small-button" type="button" onClick={() => onEdit(record)}>Editar</button>}
                                    {onDelete && <button className="delete-button" type="button" onClick={() => onDelete(record)}>Excluir</button>}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RecordsPage({ records, contas, onCreate, onUpdate, onDelete, onUpdateType, saving, updatingTypeId, error, success }) {
    const [date, setDate] = useState(localDateInputValue);
    const [accountId, setAccountId] = useState('');
    const [value, setValue] = useState('');
    const [category, setCategory] = useState('RECEITA');
    const [entryType, setEntryType] = useState(entryTypes.RECEITA[0]);
    const [customEntryType, setCustomEntryType] = useState('');
    const [invoice, setInvoice] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [description, setDescription] = useState('');
    const [editingRecord, setEditingRecord] = useState(null);

    useEffect(() => {
        if (!contas.some((conta) => String(conta.idConta) === accountId)) {
            setAccountId(contas.length ? String(contas[0].idConta) : '');
        }
    }, [contas, accountId]);

    async function submit(event) {
        event.preventDefault();
        const payload = {
            dtLancamento: date,
            vlLancamento: Number(value),
            categoria: category,
            tipoLancamento: entryType === 'Outros' ? customEntryType.trim() || 'Outros' : entryType,
            contaBancaria: { idConta: Number(accountId) },
            descricao: description.trim(),
            incluirNotaFiscal: invoice,
            nrNotaFiscal: invoiceNumber.trim() || null,
        };
        const saved = editingRecord
            ? await onUpdate(editingRecord, payload)
            : await onCreate(payload);
        if (saved) {
            setEditingRecord(null);
            setDate(localDateInputValue());
            setValue('');
            setCategory('RECEITA');
            setEntryType(entryTypes.RECEITA[0]);
            setCustomEntryType('');
            setInvoice(false);
            setInvoiceNumber('');
            setDescription('');
        }
    }

    function startEditing(record) {
        setEditingRecord(record);
        setDate(record.dtLancamento || localDateInputValue());
        setAccountId(String(record.contaBancaria?.idConta || ''));
        setValue(String(record.vlLancamento || ''));
        setCategory(record.categoria || 'RECEITA');
        const supportedTypes = entryTypes[record.categoria] || entryTypes.RECEITA;
        const knownType = supportedTypes.includes(record.tipoLancamento);
        setEntryType(knownType ? record.tipoLancamento : 'Outros');
        setCustomEntryType(knownType ? '' : record.tipoLancamento || '');
        setInvoice(Boolean(record.incluirNotaFiscal));
        setInvoiceNumber(record.nrNotaFiscal || '');
        setDescription(record.descricao || '');
    }

    function cancelEditing() {
        setEditingRecord(null);
        setDate(localDateInputValue());
        setValue('');
        setCategory('RECEITA');
        setEntryType(entryTypes.RECEITA[0]);
        setCustomEntryType('');
        setInvoice(false);
        setInvoiceNumber('');
        setDescription('');
    }

    return (
        <>
            <PageTitle eyebrow="CONTROLE FINANCEIRO" title="Registros" />
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            {success && <p className="notice success-notice" role="status">{success}</p>}
            <div className="records-layout">
                <section className="panel form-panel">
                    <h2>{editingRecord ? 'Editar lançamento' : 'Novo lançamento'}</h2>
                    <form className="record-form" onSubmit={submit}>
                        <label>Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
                        <label>Valor (R$)<input type="number" min="0.01" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder="0,00" required /></label>
                        <label className="full-field">Conta bancária
                            <select
                                aria-label="Conta bancária"
                                value={accountId}
                                onChange={(event) => setAccountId(event.target.value)}
                                disabled={!contas.length}
                                required
                            >
                                <option value="" disabled>Selecione uma conta</option>
                                {contas.map((conta) => (
                                    <option key={conta.idConta} value={conta.idConta}>
                                        {conta.nrConta} · {money(conta.saldo)}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {!contas.length && (
                            <p className="form-hint full-field">Cadastre uma conta bancária antes de criar um lançamento.</p>
                        )}
                        <label>Tipo de movimentação
                            <select
                                value={category}
                                onChange={(event) => {
                                    const nextCategory = event.target.value;
                                    setCategory(nextCategory);
                                    setEntryType(entryTypes[nextCategory][0]);
                                    setCustomEntryType('');
                                }}
                            >
                                <option value="RECEITA">Receita</option>
                                <option value="DESPESA">Despesa</option>
                            </select>
                        </label>
                        <label>Tipo de {category === 'RECEITA' ? 'entrada' : 'despesa'}
                            <select value={entryType} onChange={(event) => setEntryType(event.target.value)}>
                                {entryTypes[category].map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </label>
                        {entryType === 'Outros' && (
                            <label className="full-field">Descreva o tipo
                                <input
                                    value={customEntryType}
                                    onChange={(event) => setCustomEntryType(event.target.value)}
                                    maxLength="100"
                                    placeholder="Ex.: Consultoria"
                                    required
                                />
                            </label>
                        )}
                        <label className="invoice-check full-field">
                            <input type="checkbox" checked={invoice} onChange={(event) => setInvoice(event.target.checked)} />
                            <span className="invoice-check-copy">
                                <strong>Nota fiscal</strong>
                                <span>Vincular uma nota fiscal a este lançamento</span>
                            </span>
                            <span className="invoice-toggle-indicator" aria-hidden="true" />
                        </label>
                        {invoice && <label>Número da nota (opcional)<input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Informe o número" /></label>}
                        <label className="full-field">Descrição<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength="500" rows="3" placeholder="Descreva a movimentação" required /></label>
                        <button className="lime-button full-field" type="submit" disabled={saving || !contas.length}>{saving ? 'Salvando...' : editingRecord ? 'Salvar alterações' : 'Lançar'}</button>
                        {editingRecord && <button className="outline-button full-field" type="button" onClick={cancelEditing} disabled={saving}>Cancelar edição</button>}
                    </form>
                </section>
                <section className="panel records-panel">
                    <div className="panel-heading"><h2>Registros recentes</h2><span className="record-count">{records.length} itens</span></div>
                    <RecordsTable records={records} onDelete={onDelete} onUpdate={onUpdate} onEdit={startEditing} onUpdateType={onUpdateType} updatingTypeId={updatingTypeId} />
                </section>
            </div>
        </>
    );
}

function AnalysisPage({ analise, contas = [], records = [], error, year, onYearChange }) {
    const months = analise?.mensal || [];
    const largestMonthlyValue = Math.max(0, ...months.flatMap((month) => [Number(month.receitas) || 0, Number(month.despesas) || 0]));
    const maxValue = largestMonthlyValue > 0 ? Math.ceil(largestMonthlyValue / 4) * 4 : 4;
    const axisValues = Array.from({ length: 5 }, (_, index) => maxValue * (4 - index) / 4);
    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const negativeAccounts = contas.filter((account) => Number(account.saldo) < 0);
    const positiveAccounts = contas.filter((account) => Number(account.saldo) > 0);
    const zeroBalanceAccounts = contas.filter((account) => Number(account.saldo) === 0);
    const pendingInvoices = records.filter((record) => (
        record.incluirNotaFiscal
        && !['PAGA', 'CANCELADA'].includes(String(record.statusPagamento || 'PENDENTE').toUpperCase())
    ));
    const pendingInvoiceTotal = pendingInvoices.reduce((total, record) => total + (Number(record.vlLancamento) || 0), 0);
    const categories = analise?.categorias || [
        { tipoLancamento: 'Receitas', entradas: analise?.totalReceitas, saidas: 0 },
        { tipoLancamento: 'Despesas', entradas: 0, saidas: analise?.totalDespesas },
    ];

    function axisLabel(value) {
        if (value >= 1000000) return `R$ ${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
        if (value >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
        return money(value);
    }

    return (
        <>
            <PageTitle
                eyebrow="RELATÓRIOS FINANCEIROS"
                title="Análises"
                action={<label className="year-filter">Ano<select value={year} onChange={(event) => onYearChange(Number(event.target.value))}>{[year - 1, year, year + 1].map((item) => <option key={item}>{item}</option>)}</select></label>}
            />
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            <section className="summary-grid">
                <SummaryCard icon="income" label="Receitas no ano" value={money(analise?.totalReceitas)} />
                <SummaryCard icon="expense" label="Despesas no ano" value={money(analise?.totalDespesas)} />
                <SummaryCard icon="wallet" label="Saldo no ano" value={money(analise?.saldo)} />
            </section>
            <section className="analysis-status-grid" aria-label="Alertas financeiros">
                <article className={`analysis-status-card${negativeAccounts.length ? ' status-warning' : ' status-positive'}`}>
                    <span className="analysis-status-count">{negativeAccounts.length}</span>
                    <div><strong>Contas negativas</strong><span>{negativeAccounts.length ? 'Precisam de atenção' : 'Nenhuma conta negativada'}</span></div>
                </article>
                <article className="analysis-status-card status-positive">
                    <span className="analysis-status-count">{positiveAccounts.length}</span>
                    <div><strong>Contas positivas</strong><span>{zeroBalanceAccounts.length} com saldo zerado</span></div>
                </article>
                <article className={`analysis-status-card${pendingInvoices.length ? ' status-pending' : ' status-positive'}`}>
                    <span className="analysis-status-count">{pendingInvoices.length}</span>
                    <div><strong>NFs aguardando pagamento</strong><span>{money(pendingInvoiceTotal)} em aberto</span></div>
                </article>
            </section>
            {negativeAccounts.length > 0 && (
                <p className="notice analysis-alert" role="status">
                    Atenção: {negativeAccounts.map((account) => `${account.nrConta} (${money(account.saldo)})`).join(', ')} {negativeAccounts.length === 1 ? 'está com saldo negativo.' : 'estão com saldo negativo.'}
                </p>
            )}
            {pendingInvoices.length > 0 && (
                <p className="notice analysis-pending-alert" role="status">
                    Você tem {pendingInvoices.length} {pendingInvoices.length === 1 ? 'nota fiscal aguardando' : 'notas fiscais aguardando'} pagamento, totalizando {money(pendingInvoiceTotal)}.
                </p>
            )}
            <div className="analysis-grid">
                <section className="panel chart-panel">
                    <div className="panel-heading"><h2>Receitas x despesas</h2><span className="chart-legend"><i /> Receitas <i className="legend-expense" /> Despesas</span></div>
                    <div className="chart-visual" role="img" aria-label={`Gráfico mensal de receitas e despesas de ${year}`}>
                        <div className="chart-y-axis" aria-hidden="true">
                            {axisValues.map((value) => <span key={value}>{axisLabel(value)}</span>)}
                        </div>
                        <div className="bar-chart">
                            {monthLabels.map((label, index) => {
                                const month = months.find((item) => item.mes === index + 1) || {};
                                const income = Number(month.receitas) || 0;
                                const expense = Number(month.despesas) || 0;
                                return (
                                    <div className="chart-month" key={label}>
                                        <div className="bar-pair">
                                            <span className="chart-bar income-bar" style={{ height: `${(income / maxValue) * 100}%` }} title={`Receitas: ${money(income)}`} />
                                            <span className="chart-bar expense-bar" style={{ height: `${(expense / maxValue) * 100}%` }} title={`Despesas: ${money(expense)}`} />
                                        </div>
                                        <span>{label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
                <section className="panel cashflow-panel">
                    <div className="panel-heading"><h2>Fluxo de caixa por tipo</h2></div>
                    {categories.length ? (
                        <div className="table-scroll"><table className="data-table cashflow-table">
                            <thead><tr><th>Tipo</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead>
                            <tbody>{categories.map((item) => {
                                const entries = Number(item.entradas) || 0;
                                const exits = Number(item.saidas) || 0;
                                return (
                                    <tr key={item.tipoLancamento}>
                                        <td>{item.tipoLancamento}</td>
                                        <td className="income-value">{money(entries)}</td>
                                        <td className="expense-value">{money(exits)}</td>
                                        <td className={entries - exits < 0 ? 'expense-value' : 'income-value'}>{money(item.saldo ?? entries - exits)}</td>
                                    </tr>
                                );
                            })}</tbody>
                        </table></div>
                    ) : <p className="empty-state">Ainda não há movimentações neste ano.</p>}
                </section>
            </div>
            <div className="analysis-detail-grid">
                <section className="panel">
                    <div className="panel-heading">
                        <div><p className="eyebrow">SALDO ATUAL</p><h2>Situação das contas</h2></div>
                        <span className="record-count">{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</span>
                    </div>
                    {contas.length ? (
                        <div className="table-scroll">
                            <table className="data-table analysis-detail-table accounts-analysis-table">
                                <thead><tr><th>Conta</th><th>Saldo</th><th>Situação</th></tr></thead>
                                <tbody>{contas.map((account) => {
                                    const balance = Number(account.saldo) || 0;
                                    const status = balance < 0 ? 'Negativa' : balance > 0 ? 'Positiva' : 'Zerada';
                                    return (
                                        <tr key={account.idConta}>
                                            <td>{account.nrConta}</td>
                                            <td className={balance < 0 ? 'expense-value' : balance > 0 ? 'income-value' : ''}>{money(balance)}</td>
                                            <td><span className={`analysis-status-pill ${balance < 0 ? 'pill-negative' : balance > 0 ? 'pill-positive' : 'pill-neutral'}`}>{status}</span></td>
                                        </tr>
                                    );
                                })}</tbody>
                            </table>
                        </div>
                    ) : <p className="empty-state">Nenhuma conta cadastrada.</p>}
                </section>
                <section className="panel">
                    <div className="panel-heading">
                        <div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Notas pendentes de pagamento</h2></div>
                        <span className="record-count">{pendingInvoices.length} {pendingInvoices.length === 1 ? 'nota' : 'notas'}</span>
                    </div>
                    {pendingInvoices.length ? (
                        <div className="table-scroll">
                            <table className="data-table analysis-detail-table invoices-analysis-table">
                                <thead><tr><th>Nota</th><th>Descrição</th><th>Data</th><th>Valor</th><th>Pagamento</th></tr></thead>
                                <tbody>{pendingInvoices.map((invoice) => (
                                    <tr key={invoice.idLancamento}>
                                        <td>{invoice.nrNotaFiscal || 'Número pendente'}</td>
                                        <td>{invoice.descricao || '—'}</td>
                                        <td>{dateLabel(invoice.dtLancamento)}</td>
                                        <td className="expense-value">{money(invoice.vlLancamento)}</td>
                                        <td><span className="analysis-status-pill pill-pending">{invoice.statusPagamento || 'PENDENTE'}</span></td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <p className="empty-state">Nenhuma nota fiscal aguardando pagamento.</p>}
                </section>
            </div>
        </>
    );
}

function PaymentsPage() {
    return (
        <>
            <PageTitle eyebrow="PAGAMENTOS" title="Escolha seu banco" />
            <p className="notice demo-notice-panel">
                Escolha um banco para abrir o site oficial em uma nova aba. O NexusFin não realiza pagamentos nem solicita seus dados bancários.
            </p>
            <section className="payment-bank-grid" aria-label="Bancos disponíveis">
                {paymentBanks.map((bank) => (
                    <a
                        className="panel payment-bank-card"
                        key={bank.name}
                        href={bank.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="module-icon"><Icon name="card" /></span>
                        <span className="payment-bank-copy">
                            <strong>{bank.name}</strong>
                            <span>{bank.description}</span>
                        </span>
                        <span className="payment-bank-link">Abrir site oficial ↗</span>
                    </a>
                ))}
            </section>
        </>
    );
}

function InvoicesPage({ records, onUpdatePaymentStatus, onUploadProof, savingInvoiceId, error, success }) {
    const invoices = records.filter((record) => record.incluirNotaFiscal);
    const [paymentDrafts, setPaymentDrafts] = useState({});

    function updateDraft(invoice, changes) {
        setPaymentDrafts((previous) => ({
            ...previous,
            [invoice.idLancamento]: {
                ...(previous[invoice.idLancamento] || {
                    statusPagamento: invoice.statusPagamento || 'PENDENTE',
                    bancoPagamento: invoice.bancoPagamento || '',
                }),
                ...changes,
            },
        }));
    }

    return (
        <>
            <PageTitle eyebrow="DOCUMENTOS FISCAIS" title="Notas fiscais" />
            <p className="notice demo-notice-panel">
                Para emitir uma nota, acesse o Emissor Nacional da NFS-e. O NexusFin não emite nem transmite notas fiscais.
            </p>
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            {success && <p className="notice success-notice" role="status">{success}</p>}
            <section className="panel">
                <div className="panel-heading"><h2>Notas relacionadas a lançamentos</h2><span className="record-count">{invoices.length} itens</span></div>
                {invoices.length ? (
                    <div className="table-scroll"><table className="data-table invoices-table">
                        <thead><tr><th>Data</th><th>Número</th><th>Descrição</th><th>Valor</th><th>Status</th><th>Banco do pagamento</th><th>Comprovante</th><th>Ação</th></tr></thead>
                        <tbody>{invoices.map((item) => (
                            <tr key={item.idLancamento}>
                                <td>{dateLabel(item.dtLancamento)}</td>
                                <td>{item.nrNotaFiscal || '—'}</td>
                                <td>{item.descricao}</td>
                                <td>{money(item.vlLancamento)}</td>
                                <td>
                                    <select
                                        className="invoice-payment-status"
                                        aria-label={`Status de pagamento de ${item.descricao}`}
                                        value={paymentDrafts[item.idLancamento]?.statusPagamento || item.statusPagamento || 'PENDENTE'}
                                        onChange={(event) => updateDraft(item, { statusPagamento: event.target.value })}
                                        disabled={savingInvoiceId === item.idLancamento}
                                    >
                                        <option value="PENDENTE">Pendente</option>
                                        <option value="PROCESSADA">Processada</option>
                                        <option value="PAGA">Paga</option>
                                        <option value="CANCELADA">Cancelada</option>
                                    </select>
                                    <span className="invoice-status-note">Nota: {item.statusNotaFiscal || 'PENDENTE'}</span>
                                </td>
                                <td>
                                    <select
                                        className="invoice-payment-status"
                                        aria-label={`Banco do pagamento de ${item.descricao}`}
                                        value={paymentDrafts[item.idLancamento]?.bancoPagamento ?? item.bancoPagamento ?? ''}
                                        onChange={(event) => updateDraft(item, { bancoPagamento: event.target.value })}
                                        disabled={savingInvoiceId === item.idLancamento}
                                    >
                                        <option value="">Selecione o banco</option>
                                        {paymentBankNames.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                                    </select>
                                    <button
                                        className="text-button invoice-payment-save"
                                        type="button"
                                        onClick={() => onUpdatePaymentStatus(item, paymentDrafts[item.idLancamento] || {
                                            statusPagamento: item.statusPagamento || 'PENDENTE',
                                            bancoPagamento: item.bancoPagamento || '',
                                        })}
                                        disabled={savingInvoiceId === item.idLancamento}
                                    >
                                        {savingInvoiceId === item.idLancamento ? 'Salvando...' : 'Salvar pagamento'}
                                    </button>
                                </td>
                                <td>
                                    {item.comprovanteDisponivel ? (
                                        <a
                                            className="text-button invoice-proof-download"
                                            href={`${apiBaseUrl}/lancamentos/${item.idLancamento}/comprovante`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {item.comprovanteNome || 'Baixar comprovante'}
                                        </a>
                                    ) : isPublicDemo ? (
                                        <span className="record-count">Envio desativado na demonstração</span>
                                    ) : item.statusPagamento === 'PAGA' ? (
                                        <label className="invoice-upload-label">
                                            {savingInvoiceId === item.idLancamento ? 'Enviando...' : 'Anexar arquivo'}
                                            <input
                                                type="file"
                                                aria-label={`Anexar comprovante de ${item.descricao}`}
                                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                                disabled={savingInvoiceId === item.idLancamento}
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) onUploadProof(item, file);
                                                    event.target.value = '';
                                                }}
                                            />
                                        </label>
                                    ) : <span className="record-count">Marque como paga para anexar</span>}
                                </td>
                                <td>
                                    <a className="outline-button small-button invoice-portal-link" href={invoicePortalUrl} target="_blank" rel="noopener noreferrer">
                                        Acessar emissor
                                    </a>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table></div>
                ) : <p className="empty-state">Nenhum lançamento marcado para nota fiscal.</p>}
            </section>
        </>
    );
}

function NotificationsPage({ contas, records, onNavigate }) {
    const negativeAccounts = contas.filter((account) => Number(account.saldo) < 0);
    const pendingInvoices = records.filter((record) => (
        record.incluirNotaFiscal
        && !['PAGA', 'CANCELADA'].includes(String(record.statusPagamento || 'PENDENTE').toUpperCase())
    ));
    const notices = [
        ...negativeAccounts.map((account) => ({
            id: `account-${account.idConta}`,
            type: 'warning',
            title: `Conta ${account.nrConta || account.idConta} com saldo negativo`,
            detail: money(account.saldo),
            action: 'Abrir contas',
            destination: 'banco',
        })),
        ...pendingInvoices.map((invoice) => ({
            id: `invoice-${invoice.idLancamento}`,
            type: 'pending',
            title: `Nota fiscal ${invoice.nrNotaFiscal || 'sem número'}`,
            detail: `${money(invoice.vlLancamento)} · ${invoice.statusPagamento || 'PENDENTE'}`,
            action: 'Abrir notas fiscais',
            destination: 'notas',
        })),
    ];

    return (
        <>
            <PageTitle eyebrow="CENTRAL DE AVISOS" title="Avisos importantes" />
            <section className="summary-grid notification-summary-grid" aria-label="Resumo dos avisos">
                <SummaryCard icon="alert" label="Contas negativas" value={negativeAccounts.length} />
                <SummaryCard icon="invoice" label="Notas aguardando pagamento" value={pendingInvoices.length} />
                <SummaryCard
                    icon="currency"
                    label="Valor em notas pendentes"
                    value={money(pendingInvoices.reduce((total, invoice) => total + (Number(invoice.vlLancamento) || 0), 0))}
                />
            </section>
            <section className="panel notifications-page-panel">
                <div className="panel-heading">
                    <div><p className="eyebrow">CONTAS E DOCUMENTOS</p><h2>Notificações</h2></div>
                    <span className="record-count">{notices.length} {notices.length === 1 ? 'aviso' : 'avisos'}</span>
                </div>
                {notices.length ? (
                    <ul className="notification-page-list">
                        {notices.map((notice) => (
                            <li key={notice.id} className={`notification-page-item notification-${notice.type}`}>
                                <span className="notification-dot" aria-hidden="true" />
                                <span className="notification-copy">
                                    <strong>{notice.title}</strong>
                                    <span>{notice.detail}</span>
                                </span>
                                <button
                                    className="outline-button small-button"
                                    type="button"
                                    onClick={() => onNavigate(notice.destination)}
                                >
                                    {notice.action}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="empty-state">Nenhum aviso importante no momento. Suas contas e notas fiscais estão em dia.</p>}
            </section>
        </>
    );
}

function NotFoundPage({ onHome }) {
    return (
        <div className="not-found-layout">
            <main className="not-found-screen">
                <section className="panel not-found-panel">
                    <span className="not-found-code">404</span>
                    <p className="eyebrow">PÁGINA NÃO ENCONTRADA</p>
                    <h1>Este caminho não existe</h1>
                    <p>Confira o endereço ou volte para a visão geral do NexusFin.</p>
                    <button className="lime-button" type="button" onClick={onHome}>Voltar ao início</button>
                </section>
            </main>
            <CreatorFooter />
        </div>
    );
}

export default function NexusFinApp() {
    const [username, setUsername] = useState('');
    const [profileAvatar, setProfileAvatar] = useState(0);
    const [path, setPath] = useState(() => routeFromLocation(window.location.pathname));
    const [lancamentos, setLancamentos] = useState([]);
    const [contas, setContas] = useState([]);
    const [analise, setAnalise] = useState(null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [savingInvoiceId, setSavingInvoiceId] = useState(null);
    const [updatingTypeId, setUpdatingTypeId] = useState(null);
    const [success, setSuccess] = useState('');

    const navigate = useCallback((target, { replace = false } = {}) => {
        const method = replace ? 'replaceState' : 'pushState';
        window.history[method]({}, '', urlForRoute(target));
        setPath(target);
    }, []);

    useEffect(() => {
        const handlePopState = () => setPath(routeFromLocation(window.location.pathname));
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const applicationRoutes = navigation.map((item) => item.path);
        if (username && path === '/login') {
            navigate('/', { replace: true });
        } else if (!username && applicationRoutes.includes(path)) {
            navigate('/login', { replace: true });
        }
    }, [username, path, navigate]);

    const loadData = useCallback(async () => {
        const resources = [
            ['lancamentos', '/lancamentos', setLancamentos],
            ['contas', '/contas', setContas],
            ['analise', `/analises?ano=${year}`, setAnalise],
        ];
        const results = await Promise.all(resources.map(async ([name, endpoint, setter]) => {
            try {
                const response = await api.get(endpoint);
                setter(response.data);
                return [name, ''];
            } catch (requestError) {
                console.error(`Erro ao carregar ${name}:`, requestError);
                return [name, 'Não foi possível carregar os dados. Verifique se o backend e o banco estão disponíveis.'];
            }
        }));
        setErrors(Object.fromEntries(results.filter(([, message]) => message)));
    }, [year]);

    useEffect(() => {
        if (username) loadData();
    }, [username, loadData]);

    async function createRecord(record) {
        setSaving(true);
        setSuccess('');
        setErrors((previous) => ({ ...previous, registros: '' }));
        try {
            const response = await api.post('/lancamentos', record);
            setLancamentos((previous) => [response.data, ...previous]);
            await loadData();
            setSuccess('Lançamento criado com sucesso.');
            return true;
        } catch (requestError) {
            console.error('Erro ao criar lançamento:', requestError);
            setErrors((previous) => ({
                ...previous,
                registros: apiErrorMessage(requestError, 'salvar o lançamento'),
            }));
            return false;
        } finally {
            setSaving(false);
        }
    }

    async function updateRecord(record, changes) {
        setSaving(true);
        setSuccess('');
        setErrors((previous) => ({ ...previous, registros: '' }));
        try {
            const response = await api.put(`/lancamentos/${record.idLancamento}`, changes);
            setLancamentos((previous) => previous.map((item) => (
                item.idLancamento === record.idLancamento ? response.data : item
            )));
            await loadData();
            setSuccess('Lançamento atualizado com sucesso.');
            return true;
        } catch (requestError) {
            console.error('Erro ao atualizar lançamento:', requestError);
            setErrors((previous) => ({
                ...previous,
                registros: apiErrorMessage(requestError, 'atualizar o lançamento'),
            }));
            return false;
        } finally {
            setSaving(false);
        }
    }

    async function deleteRecord(record) {
        if (!window.confirm(`Excluir o lançamento "${record.descricao}"?`)) return;
        setErrors((previous) => ({ ...previous, registros: '' }));
        try {
            await api.delete(`/lancamentos/${record.idLancamento}`);
            setLancamentos((previous) => previous.filter((item) => item.idLancamento !== record.idLancamento));
            await loadData();
            setSuccess('Lançamento excluído.');
        } catch (requestError) {
            console.error('Erro ao excluir lançamento:', requestError);
            setErrors((previous) => ({
                ...previous,
                registros: apiErrorMessage(requestError, 'excluir o lançamento'),
            }));
        }
    }

    async function updateRecordType(record, tipoLancamento) {
        setUpdatingTypeId(record.idLancamento);
        setErrors((previous) => ({ ...previous, registros: '' }));
        setSuccess('');
        try {
            const response = await api.put(`/lancamentos/${record.idLancamento}/tipo`, { tipoLancamento });
            setLancamentos((previous) => previous.map((item) => (
                item.idLancamento === record.idLancamento ? response.data : item
            )));
            await loadData();
            setSuccess('Tipo do lançamento atualizado. A análise foi recalculada.');
        } catch (requestError) {
            console.error('Erro ao atualizar o tipo do lançamento:', requestError);
            setErrors((previous) => ({
                ...previous,
                registros: apiErrorMessage(requestError, 'atualizar o tipo do lançamento'),
            }));
        } finally {
            setUpdatingTypeId(null);
        }
    }

    async function updateInvoicePaymentStatus(record, paymentDetails) {
        const { statusPagamento, bancoPagamento } = paymentDetails;
        if (statusPagamento === 'PAGA' && !bancoPagamento) {
            setErrors((previous) => ({
                ...previous,
                notas: 'Selecione o banco usado para realizar o pagamento.',
            }));
            return;
        }
        setSavingInvoiceId(record.idLancamento);
        setErrors((previous) => ({ ...previous, notas: '' }));
        setSuccess('');
        try {
            const response = await api.put(`/lancamentos/${record.idLancamento}/pagamento`, {
                statusPagamento,
                bancoPagamento: bancoPagamento || null,
            });
            setLancamentos((previous) => previous.map((item) => (
                item.idLancamento === record.idLancamento ? response.data : item
            )));
            setSuccess('Status e banco do pagamento atualizados.');
        } catch (requestError) {
            console.error('Erro ao atualizar o status de pagamento:', requestError);
            setErrors((previous) => ({
                ...previous,
                notas: apiErrorMessage(requestError, 'atualizar o status de pagamento'),
            }));
        } finally {
            setSavingInvoiceId(null);
        }
    }

    async function uploadInvoiceProof(record, file) {
        const allowedExtensions = /\.(pdf|jpe?g|png)$/i;
        if (!allowedExtensions.test(file.name)) {
            setErrors((previous) => ({ ...previous, notas: 'Selecione um arquivo PDF, JPG ou PNG.' }));
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setErrors((previous) => ({ ...previous, notas: 'O comprovante deve ter até 10 MB.' }));
            return;
        }

        setSavingInvoiceId(record.idLancamento);
        setErrors((previous) => ({ ...previous, notas: '' }));
        setSuccess('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post(`/lancamentos/${record.idLancamento}/comprovante`, formData);
            setLancamentos((previous) => previous.map((item) => (
                item.idLancamento === record.idLancamento ? response.data : item
            )));
            setSuccess('Comprovante anexado e salvo no servidor.');
        } catch (requestError) {
            console.error('Erro ao anexar comprovante:', requestError);
            setErrors((previous) => ({
                ...previous,
                notas: apiErrorMessage(requestError, 'anexar o comprovante'),
            }));
        } finally {
            setSavingInvoiceId(null);
        }
    }

    function navigateTo(target) {
        const route = navigation.find((item) => item.id === target);
        if (route) {
            setSuccess('');
            navigate(route.path);
        }
    }

    function login(name) {
        setProfileAvatar((currentAvatar) => (currentAvatar + 1) % avatarPalettes.length);
        setUsername(name);
        navigate('/', { replace: true });
    }

    function logout() {
        setUsername('');
        navigate('/login', { replace: true });
    }

    function withApplicationLayout(page) {
        if (!username) return null;
        const active = navigation.find((item) => item.path === path)?.id || '';
        return (
            <div className="nexus-app">
                {isPublicDemo && (
                    <p className="public-demo-banner" role="note">
                        Demonstração pública — dados fictícios; alterações não são salvas e reiniciam ao recarregar.
                    </p>
                )}
                <AppHeader
                    username={username}
                    profileAvatar={profileAvatar}
                    contas={contas}
                    records={lancamentos}
                    onNavigate={navigateTo}
                    onLogout={logout}
                />
                <div className="app-body">
                    <Sidebar active={active} onNavigate={navigateTo} />
                    <main className="workspace">{page}</main>
                </div>
                <CreatorFooter />
            </div>
        );
    }

    if (path === '/login') {
        return username ? null : <Login onLogin={login} />;
    }

    switch (path) {
        case '/':
            return withApplicationLayout(<HomePage onNavigate={navigateTo} lancamentos={lancamentos} contas={contas} analise={analise} error={errors.lancamentos || errors.analise} />);
        case '/registros':
            return withApplicationLayout(<RecordsPage records={lancamentos} contas={contas} onCreate={createRecord} onUpdate={updateRecord} onDelete={deleteRecord} onUpdateType={updateRecordType} saving={saving} updatingTypeId={updatingTypeId} error={errors.registros || errors.lancamentos} success={success} />);
        case '/contas':
            return withApplicationLayout(<ContasBancarias lancamentos={lancamentos} onAccountsChange={setContas} />);
        case '/pagamentos':
            return withApplicationLayout(<PaymentsPage />);
        case '/usuarios':
            return withApplicationLayout(<Usuarios />);
        case '/analises':
            return withApplicationLayout(<AnalysisPage analise={analise} contas={contas} records={lancamentos} error={errors.analise} year={year} onYearChange={setYear} />);
        case '/notas':
            return withApplicationLayout(<InvoicesPage records={lancamentos} onUpdatePaymentStatus={updateInvoicePaymentStatus} onUploadProof={uploadInvoiceProof} savingInvoiceId={savingInvoiceId} error={errors.notas} success={success} />);
        case '/avisos':
            return withApplicationLayout(<NotificationsPage contas={contas} records={lancamentos} onNavigate={navigateTo} />);
        default:
            return <NotFoundPage onHome={() => navigate(username ? '/' : '/login')} />;
    }
}
