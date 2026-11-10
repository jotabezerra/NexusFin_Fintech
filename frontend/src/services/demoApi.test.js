import { createDemoApi } from './demoApi';

describe('public demo API', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('starts empty and calculates an empty yearly summary', async () => {
        const api = createDemoApi();
        const year = new Date().getFullYear();
        const [users, records, accounts, summary] = await Promise.all([
            api.get('/usuarios'),
            api.get('/lancamentos'),
            api.get('/contas'),
            api.get(`/analises?ano=${year}`),
        ]);

        expect(users.data).toEqual([]);
        expect(records.data).toEqual([]);
        expect(accounts.data).toEqual([]);
        expect(summary.data.ano).toBe(year);
        expect(summary.data.totalReceitas).toBe(0);
        expect(summary.data.totalDespesas).toBe(0);
        expect(summary.data.mensal).toHaveLength(12);
        expect(summary.data.categorias).toEqual([]);
    });

    test('updates account balances for created, edited, and deleted entries and persists changes', async () => {
        const api = createDemoApi();
        const firstAccount = await api.post('/contas', { nrConta: '123-4', saldo: 1000 });
        const secondAccount = await api.post('/contas', { nrConta: '567-8', saldo: 500 });
        const created = await api.post('/lancamentos', {
            dtLancamento: `${new Date().getFullYear()}-01-15`,
            vlLancamento: 100,
            categoria: 'RECEITA',
            tipoLancamento: 'Serviços',
            descricao: 'Receita de teste',
            contaBancaria: { idConta: firstAccount.data.idConta },
        });

        expect((await api.get('/contas')).data.map((account) => account.saldo)).toEqual([1100, 500]);

        await api.put(`/lancamentos/${created.data.idLancamento}`, {
            vlLancamento: 40,
            categoria: 'DESPESA',
            contaBancaria: { idConta: secondAccount.data.idConta },
        });
        expect((await api.get('/contas')).data.map((account) => account.saldo)).toEqual([1000, 460]);

        const freshApi = createDemoApi();
        expect((await freshApi.get('/lancamentos')).data[0].descricao).toBe('Receita de teste');
        expect((await freshApi.get('/contas')).data.map((account) => account.saldo)).toEqual([1000, 460]);

        await freshApi.delete(`/lancamentos/${created.data.idLancamento}`);
        expect((await createDemoApi().get('/contas')).data.map((account) => account.saldo)).toEqual([1000, 500]);
    });

    test('does not accept uploads or silently serve unsupported routes', async () => {
        const api = createDemoApi();

        await expect(api.post('/lancamentos/1/comprovante', new FormData())).rejects.toMatchObject({
            response: { status: 409 },
        });
        await expect(api.get('/rota-inexistente')).rejects.toMatchObject({
            response: { status: 404 },
        });
    });
});
