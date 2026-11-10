const demoStorageKey = 'nexusfin-public-demo-v1';

function createEmptyState() {
    return { users: [], contas: [], lancamentos: [] };
}

function readState(storage) {
    const savedState = storage?.getItem(demoStorageKey);
    if (savedState === null || savedState === undefined) return createEmptyState();

    const state = JSON.parse(savedState);
    if (
        !state
        || !Array.isArray(state.users)
        || !Array.isArray(state.contas)
        || !Array.isArray(state.lancamentos)
    ) {
        throw new Error('Os dados locais da demonstração estão inválidos. Limpe os dados do site e recarregue a página.');
    }
    const accountsById = new Map(state.contas.map((account) => [Number(account.idConta), account]));
    state.lancamentos = state.lancamentos.map((record) => ({
        ...record,
        contaBancaria: record.contaBancaria?.idConta == null
            ? null
            : accountsById.get(Number(record.contaBancaria.idConta)) || null,
    }));
    return state;
}

function saveState(storage, state) {
    storage?.setItem(demoStorageKey, JSON.stringify(state));
}

function movement(record) {
    const amount = Number(record.vlLancamento) || 0;
    return record.categoria === 'RECEITA' ? amount : -amount;
}

function applyMovement(account, amount) {
    if (!account) return;
    account.saldo = (Number(account.saldo) || 0) + amount;
}

function response(data, status = 200) {
    return { data, status };
}

function missingRecord(kind, id) {
    const error = new Error(`${kind} não encontrado.`);
    error.response = { status: 404, data: { detail: `${kind} não encontrado.` } };
    return error;
}

function conflict(message) {
    const error = new Error(message);
    error.response = { status: 409, data: { detail: message } };
    return error;
}

function parsePath(path) {
    const url = new URL(path, 'https://demo.invalid');
    return { pathname: url.pathname.replace(/\/+$/, '') || '/', searchParams: url.searchParams };
}

function summarize(records, year) {
    const yearRecords = records.filter((record) => record.dtLancamento?.startsWith(`${year}-`));
    const mensal = Array.from({ length: 12 }, (_, index) => ({
        mes: index + 1,
        receitas: 0,
        despesas: 0,
    }));
    const categories = new Map();
    let totalReceitas = 0;
    let totalDespesas = 0;

    yearRecords.forEach((record) => {
        const month = Number(record.dtLancamento.slice(5, 7)) - 1;
        const value = Number(record.vlLancamento) || 0;
        const isIncome = record.categoria === 'RECEITA';
        if (isIncome) {
            totalReceitas += value;
            mensal[month].receitas += value;
        } else {
            totalDespesas += value;
            mensal[month].despesas += value;
        }

        const category = categories.get(record.tipoLancamento) || {
            tipoLancamento: record.tipoLancamento,
            entradas: 0,
            saidas: 0,
        };
        category[isIncome ? 'entradas' : 'saidas'] += value;
        categories.set(record.tipoLancamento, category);
    });

    const categorias = Array.from(categories.values()).map((category) => ({
        ...category,
        saldo: category.entradas - category.saidas,
    }));

    return {
        ano: Number(year),
        totalReceitas,
        totalDespesas,
        saldo: totalReceitas - totalDespesas,
        notasFiscais: yearRecords.filter((record) => record.incluirNotaFiscal).length,
        mensal,
        categorias,
    };
}

export function createDemoApi() {
    const storage = window.localStorage;
    const state = readState(storage);
    const persist = () => saveState(storage, state);
    const currentYear = new Date().getFullYear();

    return {
        async get(path) {
            const { pathname, searchParams } = parsePath(path);
            if (pathname === '/usuarios') return response([...state.users]);
            if (pathname === '/contas') return response([...state.contas]);
            if (pathname === '/lancamentos') return response([...state.lancamentos]);
            if (pathname === '/analises') {
                return response(summarize(state.lancamentos, searchParams.get('ano') || currentYear));
            }
            throw missingRecord('Rota', pathname);
        },

        async post(path, body) {
            const { pathname } = parsePath(path);
            if (pathname === '/usuarios') {
                const user = { ...body, idUsuario: Math.max(0, ...state.users.map((item) => item.idUsuario)) + 1 };
                state.users.push(user);
                persist();
                return response(user, 201);
            }
            if (pathname === '/contas') {
                const account = {
                    ...body,
                    idConta: Math.max(0, ...state.contas.map((item) => item.idConta)) + 1,
                    usuario: state.users[0] ? { idUsuario: state.users[0].idUsuario } : null,
                };
                state.contas.push(account);
                persist();
                return response(account, 201);
            }
            if (pathname === '/lancamentos') {
                const accountId = Number(body.contaBancaria?.idConta);
                const account = state.contas.find((item) => item.idConta === accountId);
                const record = {
                    ...body,
                    idLancamento: Math.max(0, ...state.lancamentos.map((item) => item.idLancamento)) + 1,
                    contaBancaria: account || null,
                    statusPagamento: body.statusPagamento || 'PENDENTE',
                };
                state.lancamentos.unshift(record);
                applyMovement(account, movement(record));
                persist();
                return response(record, 201);
            }
            if (/^\/lancamentos\/\d+\/comprovante$/.test(pathname)) {
                throw conflict('O envio de comprovantes está desativado na demonstração pública.');
            }
            throw missingRecord('Rota', pathname);
        },

        async put(path, body) {
            const { pathname } = parsePath(path);
            const userMatch = pathname.match(/^\/usuarios\/(\d+)$/);
            if (userMatch) {
                const index = state.users.findIndex((item) => item.idUsuario === Number(userMatch[1]));
                if (index < 0) throw missingRecord('Usuário', userMatch[1]);
                state.users[index] = { ...state.users[index], ...body };
                persist();
                return response(state.users[index]);
            }

            const accountMatch = pathname.match(/^\/contas\/(\d+)$/);
            if (accountMatch) {
                const index = state.contas.findIndex((item) => item.idConta === Number(accountMatch[1]));
                if (index < 0) throw missingRecord('Conta', accountMatch[1]);
                state.contas[index] = { ...state.contas[index], ...body };
                state.lancamentos.forEach((record) => {
                    if (record.contaBancaria?.idConta === state.contas[index].idConta) {
                        record.contaBancaria = state.contas[index];
                    }
                });
                persist();
                return response(state.contas[index]);
            }

            const typeMatch = pathname.match(/^\/lancamentos\/(\d+)\/tipo$/);
            const paymentMatch = pathname.match(/^\/lancamentos\/(\d+)\/pagamento$/);
            const recordMatch = pathname.match(/^\/lancamentos\/(\d+)$/);
            const match = typeMatch || paymentMatch || recordMatch;
            if (match) {
                const index = state.lancamentos.findIndex((item) => item.idLancamento === Number(match[1]));
                if (index < 0) throw missingRecord('Lançamento', match[1]);
                const current = state.lancamentos[index];
                const updated = { ...current, ...body };
                applyMovement(current.contaBancaria, -movement(current));
                if (body.contaBancaria?.idConta !== undefined) {
                    updated.contaBancaria = state.contas.find(
                        (account) => account.idConta === Number(body.contaBancaria.idConta),
                    ) || null;
                }
                applyMovement(updated.contaBancaria, movement(updated));
                state.lancamentos[index] = updated;
                persist();
                return response(state.lancamentos[index]);
            }

            throw missingRecord('Rota', pathname);
        },

        async delete(path) {
            const { pathname } = parsePath(path);
            const userMatch = pathname.match(/^\/usuarios\/(\d+)$/);
            if (userMatch) {
                const id = Number(userMatch[1]);
                const userIndex = state.users.findIndex((item) => item.idUsuario === id);
                if (userIndex < 0) throw missingRecord('Usuário', id);
                if (state.contas.some((account) => account.usuario?.idUsuario === id)) {
                    throw conflict('Este usuário possui contas bancárias vinculadas.');
                }
                state.users.splice(userIndex, 1);
                persist();
                return response(null, 204);
            }

            const accountMatch = pathname.match(/^\/contas\/(\d+)$/);
            if (accountMatch) {
                const id = Number(accountMatch[1]);
                const accountIndex = state.contas.findIndex((item) => item.idConta === id);
                if (accountIndex < 0) throw missingRecord('Conta', id);
                if (state.lancamentos.some((record) => record.contaBancaria?.idConta === id)) {
                    throw conflict('Esta conta possui lançamentos vinculados.');
                }
                state.contas.splice(accountIndex, 1);
                persist();
                return response(null, 204);
            }

            const recordMatch = pathname.match(/^\/lancamentos\/(\d+)$/);
            if (recordMatch) {
                const index = state.lancamentos.findIndex((item) => item.idLancamento === Number(recordMatch[1]));
                if (index < 0) throw missingRecord('Lançamento', recordMatch[1]);
                applyMovement(state.lancamentos[index].contaBancaria, -movement(state.lancamentos[index]));
                state.lancamentos.splice(index, 1);
                persist();
                return response(null, 204);
            }

            throw missingRecord('Rota', pathname);
        },
    };
}
