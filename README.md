<div align="center">

<img src="./assets/nexusfin-logo.png" alt="Logo NexusFin" width="380" />

# NexusFin

### Controle financeiro simples, organizado e visual

Aplicação web demonstrativa para acompanhar contas, movimentações e indicadores
financeiros em uma interface responsiva.

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Java](https://img.shields.io/badge/Java-17%2B-ed8b00?logo=openjdk&logoColor=white)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.2-6db33f?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?logo=github&logoColor=white)](#publicação-no-github-pages)

**[Funcionalidades](#funcionalidades)** ·
**[Executar localmente](#executar-localmente)** ·
**[Publicação](#publicação-no-github-pages)** ·
**[Segurança](#segurança-e-limitações)**

<br />

**Desenvolvido por [João Pedro da Silva Bezerra](https://github.com/jotabezerra)**<br />
[GitHub](https://github.com/jotabezerra) ·
[LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-pedro-da-silva-bezerra-14562a376/)

</div>

---

## Sobre o projeto

O **NexusFin** reúne recursos básicos de organização financeira em uma aplicação
com frontend em React e API REST em Java com Spring Boot. O projeto pode ser
executado localmente com o banco H2 em memória ou publicado como demonstração
estática no GitHub Pages.

> **Importante:** o GitHub Pages publica somente o frontend. A demonstração
> pública utiliza dados fictícios no navegador; ela não se conecta à API nem
> salva alterações após recarregar a página.

## Funcionalidades

- **Visão geral:** resumo de receitas, despesas e saldo, com movimentações recentes.
- **Lançamentos:** cadastrar, editar, remover e categorizar receitas e despesas.
- **Contas bancárias:** acompanhar contas e saldos associados.
- **Análises:** consultar totais, gráficos mensais e resumo por categoria.
- **Notas fiscais:** organizar lançamentos relacionados, status de pagamento e banco.
- **Comprovantes:** enviar e consultar comprovantes ao executar a API local.
- **Usuários:** consultar e manter cadastros usados pela aplicação.
- **Avisos:** visualizar alertas de contas negativas e pagamentos pendentes.
- **Pagamentos:** acessar atalhos informativos para os canais dos bancos.
- **Acesso demonstrativo:** interface com identidade visual responsiva.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React 19, JavaScript, CSS |
| Backend | Java 17+, Spring Boot 4.1.2, Spring Data JPA, Spring Security |
| Banco local | H2 em memória |
| Testes | Jest, React Testing Library, JUnit |
| Publicação do frontend | GitHub Actions e GitHub Pages |

## Estrutura do repositório

```text
.
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # Build e publicação da demo no Pages
├── backend/                    # API Java/Spring Boot
│   ├── src/
│   ├── mvnw
│   └── pom.xml
├── frontend/                   # Aplicação React
│   ├── public/
│   ├── src/
│   └── package.json
├── .gitignore
└── README.md
```

## Executar localmente

### Pré-requisitos

- Java 17 ou superior
- Node.js 18 ou superior e npm
- PowerShell (os comandos abaixo são para Windows)

### 1. Inicie a API

Abra um terminal na raiz do projeto:

```powershell
Set-Location .\backend
$env:DEMO_USERNAME = "demo"
$env:DEMO_PASSWORD = "NexusFinLocalDemo2026!"
.\mvnw.cmd spring-boot:run
```

A API ficará disponível em `http://localhost:8080`. O backend cria as tabelas
no H2 em memória e, se o banco estiver vazio, cria um usuário fictício para
associar novas contas. O conteúdo do banco é apagado quando a API é encerrada.

### 2. Inicie o frontend

Deixe o primeiro terminal aberto e abra outro na raiz do projeto:

```powershell
Set-Location .\frontend
$env:REACT_APP_API_USERNAME = "demo"
$env:REACT_APP_API_PASSWORD = "NexusFinLocalDemo2026!"
npm ci
npm start
```

O navegador abrirá em `http://localhost:3000`. Na tela inicial, use:

| Campo | Acesso visual |
|---|---|
| Usuário | `demo` |
| Senha | `demo` |

O acesso visual é separado das credenciais HTTP Basic usadas pelo frontend ao
chamar a API. Os valores nos comandos são **somente para desenvolvimento local**.
Não os reutilize em outros serviços nem publique o backend com essas credenciais.

### Encerrar

Use `Ctrl+C` em cada terminal para parar o frontend e a API.

## Publicação no GitHub Pages

O repositório inclui um workflow que compila e publica a demonstração estática
quando há um `push` para a branch `main`.

1. Envie o projeto para um repositório GitHub.
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **GitHub Actions** como origem.
4. Acompanhe a execução do workflow na aba **Actions**.
5. Quando a publicação terminar, abra o endereço indicado em **Settings → Pages**.

O workflow está em [`deploy-pages.yml`](.github/workflows/deploy-pages.yml).
Ele compila o frontend com modo de demonstração ativado e calcula o caminho de
publicação automaticamente, inclusive para repositórios de projeto.

### Como funciona a versão pública

- Os registros são exemplos sintéticos carregados no navegador.
- As alterações ficam apenas na memória da sessão e desaparecem ao recarregar.
- O frontend não envia dados à API e não precisa de um servidor Java ativo.
- O envio de comprovantes está desativado.
- O login `demo`/`demo` é uma barreira visual, não um mecanismo de segurança.

## API local

Com o backend em execução, os principais recursos são:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET`, `POST` | `/api/usuarios` | Consultar e criar usuários |
| `GET`, `PUT`, `DELETE` | `/api/usuarios/{id}` | Consultar, atualizar e remover usuário |
| `GET`, `POST` | `/api/contas` | Consultar e criar contas |
| `GET`, `PUT`, `DELETE` | `/api/contas/{id}` | Consultar, atualizar e remover conta |
| `GET`, `POST` | `/api/lancamentos` | Consultar e criar lançamentos |
| `GET`, `PUT`, `DELETE` | `/api/lancamentos/{id}` | Consultar, atualizar e remover lançamento |
| `PUT` | `/api/lancamentos/{id}/tipo` | Alterar categoria do lançamento |
| `PUT` | `/api/lancamentos/{id}/pagamento` | Atualizar status e banco do pagamento |
| `POST`, `GET` | `/api/lancamentos/{id}/comprovante` | Enviar ou baixar comprovante |
| `GET` | `/api/analises?ano=2026` | Consultar resumo financeiro anual |

As rotas da API exigem autenticação HTTP Basic. Os comprovantes aceitos pela API
são PDF, JPG e PNG, com limite de 10 MB. Arquivos enviados são armazenados
localmente em `backend/data/comprovantes/`, diretório ignorado pelo Git.

## Testes e build

Execute os comandos a partir da pasta indicada.

**Frontend — pasta `frontend`:**

```powershell
npm test -- --watchAll=false
npm run build
```

**Backend — pasta `backend`:**

```powershell
$env:DEMO_USERNAME = "demo"
$env:DEMO_PASSWORD = "NexusFinLocalDemo2026!"
.\mvnw.cmd test
```

## Segurança e limitações

- Use exclusivamente dados fictícios para testar e apresentar o projeto.
- O banco H2 local é temporário; seus dados desaparecem ao encerrar a API.
- As credenciais de exemplo são públicas e inadequadas para qualquer ambiente
  compartilhado ou implantação online.
- Não publique arquivos `.env`, comprovantes, dumps de banco ou dados pessoais.
- O frontend local recebe as credenciais de demonstração no bundle de
  desenvolvimento. Não use esses valores com dados ou serviços reais.
- O Pages hospeda somente conteúdo estático; a API Java não é publicada junto.
- O projeto é educacional/demonstrativo, não um serviço de aconselhamento ou
  processamento financeiro real.

Confira o [`.gitignore`](.gitignore) antes de preparar novos arquivos para envio.

---

<div align="center">

Feito com cuidado por [João Pedro da Silva Bezerra](https://github.com/jotabezerra) ·
[LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-pedro-da-silva-bezerra-14562a376/)

</div>
