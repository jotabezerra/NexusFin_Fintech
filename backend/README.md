# NexusFin API

REST API em Java 17 e Spring Boot. O backend usa H2 em memória por padrão e
cria as tabelas automaticamente ao iniciar; não precisa de credenciais de banco
externo. A API exige credenciais de demonstração no ambiente.

## Executar

No PowerShell, nesta pasta, configure credenciais locais de demonstração e
inicie a API:

```powershell
$env:DEMO_USERNAME = "demo"
$env:DEMO_PASSWORD = "NexusFinLocalDemo2026!"
.\mvnw.cmd spring-boot:run
```

A API inicia na porta `8080`. Defina `SERVER_PORT` para alterá-la. Os dados do
banco são temporários e desaparecem quando o backend é encerrado. Arquivos
enviados pela API ficam localmente em `./data/comprovantes` por padrão; esse
diretório não deve ser publicado. As credenciais do exemplo são somente para
desenvolvimento local e não devem ser usadas em uma implantação pública.
Se o banco estiver vazio, a aplicação cria um usuário fictício para associar as
novas contas bancárias.

## Rotas

| Método | Caminho | Operação |
|---|---|---|
| GET, POST | `/api/usuarios` | Consultar e criar usuários |
| GET, PUT, DELETE | `/api/usuarios/{id}` | Consultar, editar e remover usuário |
| GET, POST | `/api/contas` | Consultar e criar contas bancárias |
| GET, PUT, DELETE | `/api/contas/{id}` | Consultar, editar e remover conta |
| GET, POST | `/api/lancamentos` | Consultar e criar lançamentos |
| GET, PUT, DELETE | `/api/lancamentos/{id}` | Consultar, editar e remover lançamento |
| PUT | `/api/lancamentos/{id}/tipo` | Alterar tipo do lançamento |
| PUT | `/api/lancamentos/{id}/pagamento` | Atualizar status e banco do pagamento |
| POST, GET | `/api/lancamentos/{id}/comprovante` | Enviar e baixar comprovante |
| POST | `/api/lancamentos/{id}/nota-fiscal/simular` | Retornar resultado demonstrativo |
| GET | `/api/analises?ano=2026` | Consultar totais e série mensal |

Os comprovantes aceitam PDF, JPG e PNG, até 10 MB.

## Limitações de demonstração

As rotas da API exigem autenticação HTTP Basic. Configure `DEMO_USERNAME` e
`DEMO_PASSWORD` no ambiente antes de iniciar; a senha deve ter ao menos 16
caracteres e não pode conter `:`. O login `demo`/`demo` do frontend é apenas
visual e separado das credenciais da API. Não exponha esta API a redes não
confiáveis nem a utilize para dados financeiros reais.

Execute `.\mvnw.cmd test` para rodar os testes, incluindo o teste de inicialização
do contexto Spring com o banco H2.
