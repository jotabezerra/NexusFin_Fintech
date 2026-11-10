# NexusFin

Aplicação demonstrativa de controle financeiro com frontend React e API REST em
Java 17/Spring Boot. O backend usa H2 em memória por padrão: não depende de
serviços nem credenciais externos e inicia com o banco vazio. Os registros
criados são apagados ao reiniciar o backend.

**Autor:** [João Pedro da Silva Bezerra](https://github.com/jotabezerra) ·
[LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-pedro-da-silva-bezerra-14562a376/)

## Requisitos

- Java 17+
- Node.js 18+ e npm

## Executar o backend

No primeiro terminal PowerShell, a partir da raiz do projeto, configure
credenciais locais de demonstração e inicie a API:

```powershell
Set-Location .\backend
$env:DEMO_USERNAME = "demo"
$env:DEMO_PASSWORD = "NexusFinLocalDemo2026!"
.\mvnw.cmd spring-boot:run
```

A API inicia em `http://localhost:8080`. O schema é criado automaticamente no
banco H2 em memória. Essas credenciais são somente para rodar localmente; não
as reutilize em outros serviços nem publique a API.
Quando o banco está vazio, o backend cria automaticamente um usuário de
demonstração fictício, necessário para associar novas contas bancárias.

## Executar o frontend

Em outro terminal, a partir da raiz do projeto:

```powershell
Set-Location .\frontend
$env:REACT_APP_API_USERNAME = "demo"
$env:REACT_APP_API_PASSWORD = "NexusFinLocalDemo2026!"
npm ci
npm start
```

O frontend abre em `http://localhost:3000` e consome
`http://localhost:8080/api` no desenvolvimento local. Para alterar a URL da
API, defina `REACT_APP_API_URL` antes de iniciar o frontend. As credenciais
acima são inseridas no frontend local para autenticar as chamadas à API; use
apenas credenciais fictícias de desenvolvimento. O login visual continua sendo
`demo`/`demo`.

## Demonstração pública no GitHub Pages

O workflow do GitHub Actions publica automaticamente uma demonstração estática
quando há um push para `main`. No repositório, abra **Settings → Pages** e
selecione **GitHub Actions** como origem da publicação. Depois que o workflow
terminar, o endereço estará disponível na página de configurações do Pages.

O GitHub Pages não executa o backend Java. Por isso, a publicação usa uma API
simulada no navegador e registros inteiramente fictícios. É possível explorar
e alterar os dados durante a sessão, mas eles não são enviados a um servidor e
voltam aos exemplos iniciais ao recarregar a página. O envio de comprovantes
fica desativado nessa demonstração.

## Demonstração e segurança

O login `demo`/`demo` é apenas uma barreira visual. A demonstração pública usa
dados locais fictícios e não faz chamadas ao backend; a API Java também não
deve ser exposta a redes não confiáveis nem usada com dados financeiros reais.
As credenciais `DEMO_*` e `REACT_APP_API_*` são para desenvolvimento local.

Não publique arquivos `.env`, comprovantes ou dados locais. O `.gitignore` da
raiz exclui arquivos de ambiente, dependências, artefatos de build e a pasta
local de comprovantes.

## Testes

- Frontend: `npm test -- --watchAll=false` e `npm run build`, na pasta
  `frontend`.
- Backend: `.\mvnw.cmd test`, na pasta `backend`.
