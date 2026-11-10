import { createDemoApi } from './demoApi';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

async function request(method, path, body) {
    const headers = {};
    const apiUsername = process.env.REACT_APP_API_USERNAME;
    const apiPassword = process.env.REACT_APP_API_PASSWORD;
    if (apiUsername && apiPassword) {
        headers.Authorization = `Basic ${btoa(`${apiUsername}:${apiPassword}`)}`;
    }
    let requestBody;
    if (body !== undefined) {
        if (body instanceof FormData) {
            requestBody = body;
        } else {
            headers['Content-Type'] = 'application/json';
            requestBody = JSON.stringify(body);
        }
    }

    const response = await fetch(`${baseURL}${path}`, {
        method,
        headers,
        body: requestBody,
    });
    const text = await response.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }
    if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.response = { status: response.status, data };
        throw error;
    }
    return { data, status: response.status };
}

const api = process.env.REACT_APP_DEMO_MODE === 'true'
    ? createDemoApi()
    : {
        get: (path) => request('GET', path),
        post: (path, body) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        delete: (path) => request('DELETE', path),
    };

export default api;
