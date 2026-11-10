import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PageTitle } from './Shared';

const today = () => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
};

function messageFrom(error, action) {
    const data = error.response?.data;
    const detail = typeof data === 'string'
        ? data
        : [data?.detail, data?.message, data?.error, data?.title]
            .find((value) => typeof value === 'string' && value.trim());

    if (error.response?.status === 409) {
        return `Não foi possível ${action}: há registros vinculados. Para excluir um usuário, primeiro remova ou transfira as contas bancárias associadas.`;
    }
    if (error.response?.status >= 500) {
        return `Não foi possível ${action}: o backend encontrou um erro. Reinicie o backend atualizado e confira o erro detalhado no terminal onde ele está rodando.`;
    }
    if (detail) return `Não foi possível ${action}: ${detail}`;
    if (error.response?.status) {
        return `Não foi possível ${action}: o backend respondeu com HTTP ${error.response.status}.`;
    }
    return `Não foi possível ${action}: verifique se o backend e o banco estão disponíveis.`;
}

export default function Usuarios() {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ nome: '', email: '', dtCriacao: today() });
    const [editingId, setEditingId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    async function loadUsers() {
        try {
            const response = await api.get('/usuarios');
            setUsers(response.data);
            setError('');
        } catch (requestError) {
            console.error('Erro ao carregar usuários:', requestError);
            setError(messageFrom(requestError, 'carregar os usuários'));
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    function resetForm() {
        setForm({ nome: '', email: '', dtCriacao: today() });
        setEditingId(null);
    }

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setSuccess('');
        try {
            const payload = {
                nome: form.nome.trim(),
                email: form.email.trim(),
                dtCriacao: form.dtCriacao,
            };
            if (editingId === null) {
                await api.post('/usuarios', payload);
                setSuccess('Usuário cadastrado com sucesso.');
            } else {
                await api.put(`/usuarios/${editingId}`, payload);
                setSuccess('Usuário atualizado com sucesso.');
            }
            resetForm();
            await loadUsers();
        } catch (requestError) {
            console.error('Erro ao salvar usuário:', requestError);
            setError(messageFrom(requestError, 'salvar o usuário'));
        } finally {
            setBusy(false);
        }
    }

    function edit(user) {
        setEditingId(user.idUsuario);
        setForm({
            nome: user.nome || '',
            email: user.email || '',
            dtCriacao: user.dtCriacao || today(),
        });
        setSuccess('');
        setError('');
    }

    async function remove(user) {
        if (!window.confirm(`Excluir o usuário "${user.nome}"?`)) return;
        setError('');
        setSuccess('');
        try {
            await api.delete(`/usuarios/${user.idUsuario}`);
            setUsers((current) => current.filter((item) => item.idUsuario !== user.idUsuario));
            if (editingId === user.idUsuario) resetForm();
            setSuccess('Usuário excluído.');
        } catch (requestError) {
            console.error('Erro ao excluir usuário:', requestError);
            setError(messageFrom(requestError, 'excluir o usuário'));
        }
    }

    return (
        <>
            <PageTitle eyebrow="CADASTROS" title="Usuários" />
            {error && <p className="notice error-notice" role="alert">{error}</p>}
            {success && <p className="notice success-notice" role="status">{success}</p>}
            <div className="records-layout">
                <section className="panel form-panel">
                    <div className="panel-heading">
                        <div>
                            <p className="eyebrow">{editingId === null ? 'NOVO CADASTRO' : 'EDIÇÃO'}</p>
                            <h2>{editingId === null ? 'Adicionar usuário' : 'Editar usuário'}</h2>
                        </div>
                    </div>
                    <form className="record-form" onSubmit={submit}>
                        <label className="full-field">Nome
                            <input value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} maxLength="255" required />
                        </label>
                        <label className="full-field">E-mail
                            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength="255" required />
                        </label>
                        <label className="full-field">Data de cadastro
                            <input type="date" value={form.dtCriacao} onChange={(event) => setForm({ ...form, dtCriacao: event.target.value })} required />
                        </label>
                        <button className="lime-button full-field" type="submit" disabled={busy}>
                            {busy ? 'Salvando...' : editingId === null ? 'Cadastrar usuário' : 'Salvar alterações'}
                        </button>
                        {editingId !== null && (
                            <button className="outline-button full-field" type="button" onClick={resetForm} disabled={busy}>Cancelar edição</button>
                        )}
                    </form>
                </section>
                <section className="panel records-panel">
                    <div className="panel-heading">
                        <div><p className="eyebrow">BASE DO SISTEMA</p><h2>Usuários cadastrados</h2></div>
                        <span className="record-count">{users.length} {users.length === 1 ? 'usuário' : 'usuários'}</span>
                    </div>
                    {users.length ? (
                        <div className="table-scroll">
                            <table className="data-table users-table">
                                <thead><tr><th>Nome</th><th>E-mail</th><th>Cadastro</th><th>Ações</th></tr></thead>
                                <tbody>{users.map((user) => (
                                    <tr key={user.idUsuario}>
                                        <td>{user.nome}</td><td>{user.email}</td>
                                        <td>{user.dtCriacao ? new Date(`${user.dtCriacao}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td>
                                        <td className="user-actions">
                                            <button className="outline-button small-button" type="button" onClick={() => edit(user)}>Editar</button>
                                            <button className="delete-button" type="button" onClick={() => remove(user)}>Excluir</button>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    ) : <p className="empty-state">Nenhum usuário cadastrado.</p>}
                </section>
            </div>
        </>
    );
}
