import api from './api';

const originalApiUsername = process.env.REACT_APP_API_USERNAME;
const originalApiPassword = process.env.REACT_APP_API_PASSWORD;

describe('REST API client', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        process.env.REACT_APP_API_USERNAME = 'demo';
        process.env.REACT_APP_API_PASSWORD = 'NexusFinLocalDemo2026!';
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
        if (originalApiUsername === undefined) {
            delete process.env.REACT_APP_API_USERNAME;
        } else {
            process.env.REACT_APP_API_USERNAME = originalApiUsername;
        }
        if (originalApiPassword === undefined) {
            delete process.env.REACT_APP_API_PASSWORD;
        } else {
            process.env.REACT_APP_API_PASSWORD = originalApiPassword;
        }
    });

    test('sends and parses JSON requests', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            text: async () => '{"idUsuario":3}',
        });

        const response = await api.post('/usuarios', { nome: 'Ana' });

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/usuarios',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${btoa('demo:NexusFinLocalDemo2026!')}`,
                },
                body: '{"nome":"Ana"}',
            }),
        );
        expect(response).toEqual({ data: { idUsuario: 3 }, status: 201 });
    });

    test('keeps multipart bodies intact and surfaces REST error details', async () => {
        const formData = new FormData();
        formData.append('file', new File(['receipt'], 'receipt.pdf', { type: 'application/pdf' }));
        global.fetch.mockResolvedValue({
            ok: false,
            status: 409,
            text: async () => '{"detail":"Registro vinculado."}',
        });

        await expect(api.post('/contas/1/comprovante', formData)).rejects.toMatchObject({
            response: {
                status: 409,
                data: { detail: 'Registro vinculado.' },
            },
        });
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:8080/api/contas/1/comprovante',
            expect.objectContaining({
                body: formData,
                headers: {
                    Authorization: `Basic ${btoa('demo:NexusFinLocalDemo2026!')}`,
                },
            }),
        );
    });
});
