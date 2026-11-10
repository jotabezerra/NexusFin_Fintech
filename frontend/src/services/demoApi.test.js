import { createDemoApi } from './demoApi';

describe('public demo API', () => {
    test('serves synthetic records and calculates yearly summaries', async () => {
        const api = createDemoApi();
        const year = new Date().getFullYear();
        const [records, accounts, summary] = await Promise.all([
            api.get('/lancamentos'),
            api.get('/contas'),
            api.get(`/analises?ano=${year}`),
        ]);

        expect(records.data).toHaveLength(5);
        expect(accounts.data.every((account) => account.nrConta.startsWith('DEMO-'))).toBe(true);
        expect(summary.data.ano).toBe(year);
        expect(summary.data.totalReceitas).toBeGreaterThan(0);
        expect(summary.data.mensal).toHaveLength(12);
        expect(summary.data.categorias.length).toBeGreaterThan(0);
    });

    test('keeps edits in memory and resets them when a new demo session starts', async () => {
        const api = createDemoApi();
        const created = await api.post('/lancamentos', {
            dtLancamento: `${new Date().getFullYear()}-01-15`,
            vlLancamento: 100,
            categoria: 'RECEITA',
            tipoLancamento: 'Serviços',
            descricao: 'Registro de teste',
            contaBancaria: { idConta: 1 },
        });

        await api.put(`/lancamentos/${created.data.idLancamento}`, { descricao: 'Alteração temporária' });
        expect((await api.get('/lancamentos')).data[0].descricao).toBe('Alteração temporária');

        const freshSession = createDemoApi();
        expect((await freshSession.get('/lancamentos')).data).toHaveLength(5);
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
