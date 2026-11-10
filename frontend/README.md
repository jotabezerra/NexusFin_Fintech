# NexusFin Frontend

Aplicação React para o NexusFin. As instruções completas para executar o
frontend e o backend estão no [README do projeto](../README.md).

## Executar

Requisitos: Node.js 18+ e npm.

```powershell
npm ci
npm start
```

O frontend abre em `http://localhost:3000` e usa
`http://localhost:8080/api` por padrão. Para apontar para outra API, defina
`REACT_APP_API_URL` antes de iniciar.

O login `demo`/`demo` é apenas visual; não protege as rotas do backend.

## Publicar no GitHub Pages

O workflow `../.github/workflows/deploy-pages.yml` compila e publica uma
demonstração pública ao enviar alterações para a branch `main`. Ative
**Settings → Pages → GitHub Actions** no repositório.

No Pages, o frontend usa uma API simulada com dados fictícios em memória; não
se conecta ao backend e não salva alterações depois que a página é recarregada.
O envio de comprovantes fica desativado.
