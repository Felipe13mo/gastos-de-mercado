# Project Context — Gastos de Mercado

> Contexto técnico para desenvolvedores e agentes de IA.
>
> Este documento descreve a arquitetura, contratos e decisões relevantes do projeto. O código atual é a fonte de verdade caso exista divergência.

---

## 1. Projeto

**Gastos de Mercado** é uma Progressive Web App (PWA) client-side para gerenciamento de produtos, preços, estabelecimentos, compras e lista de compras.

A aplicação utiliza **JavaScript vanilla**, **IndexedDB** e **Service Worker**.

Não existe backend ou banco de dados remoto na arquitetura atual.

Os dados do usuário são armazenados localmente no navegador/dispositivo.

---

## 2. Arquitetura

```text
Interface
   ↓
Módulos da aplicação
   ↓
Repositories
   ↓
database.js
   ↓
IndexedDB
```

Responsabilidades:

- `app.js` → inicialização, navegação e integração geral.
- `modules/` → funcionalidades e regras de cada domínio.
- `repositories` → acesso às entidades persistidas.
- `database.js` → infraestrutura de IndexedDB.
- `appState.js` → estado compartilhado em memória.
- `utils.js` → funções utilitárias compartilhadas.

### Contrato principal

Os módulos **não devem acessar IndexedDB diretamente**.

O acesso deve seguir:

```text
módulo → repository → database.js → IndexedDB
```

---

## 3. Estrutura do projeto

```text
index.html
manifest.json
service-worker.js
css/
└── style.css

img/
└── ícones da aplicação

js/
├── app.js
├── db/
│   ├── database.js
│   ├── produtosBaseRepository.js
│   ├── produtosRepository.js
│   ├── estabelecimentosRepository.js
│   ├── comprasRepository.js
│   ├── itensCompraRepository.js
│   └── listaComprasRepository.js
├── modules/
│   ├── produtos/
│   │   └── produtos.js
│   ├── estabelecimentos/
│   │   └── estabelecimentos.js
│   ├── compras/
│   │   └── compras.js
│   ├── listaCompras/
│   │   └── listaCompras.js
│   └── precos/
│       └── precos.js
├── shared/
│   └── utils.js
└── state/
    └── appState.js
```

O projeto utiliza **JavaScript clássico com escopo global**.

Não utiliza atualmente:

- ES Modules (`import`/`export`);
- TypeScript;
- frameworks de front-end;
- bundlers.

A ordem dos `<script>` no `index.html` é relevante devido às dependências entre arquivos.

---

## 4. Persistência

Banco IndexedDB:

```text
GastosDeMercado
```

Versão atual:

```text
1
```

Object stores:

```text
produtosBase
produtos
estabelecimentos
compras
itensCompra
listaCompras
```

Os stores utilizam:

```text
keyPath: "id"
```

IDs são fundamentais para os relacionamentos e não devem ser alterados sem estratégia de migração.

---

## 5. Relacionamentos entre entidades

```text
produtos.produtoBaseId
    → produtosBase.id
```

```text
compras.estabelecimentoId
    → estabelecimentos.id
```

```text
itensCompra.compraId
    → compras.id
```

```text
itensCompra.produtoId
    → produtos.id
```

Esses relacionamentos devem permanecer válidos.

Alterações no modelo de dados devem considerar seus impactos sobre:

- repositories;
- estado;
- interface;
- validação de integridade;
- exportação/importação;
- dados existentes.

---

## 6. Estado da aplicação

`js/state/appState.js` mantém em memória os dados carregados do IndexedDB.

Principais coleções:

```text
produtos
produtosBase
estabelecimentos
compras
itensCompra
listaCompras
```

Também existem estados temporários para:

- edição;
- seleção;
- filtros;
- paginação;
- histórico;
- fluxos de modais.

O estado em memória deve permanecer coerente com o IndexedDB após operações de criação, edição, exclusão e restauração.

---

## 7. Módulos

### Produtos

`js/modules/produtos/produtos.js`

Gerencia produtos cadastrados, edição, exclusão, associação com produto base, unidades e pesquisa.

### Produtos base

Gerencia o catálogo genérico/base utilizado pelos produtos cadastrados.

Existe um fluxo no qual um produto base pode ser criado a partir do modal de cadastro de produto. Nesse fluxo, após salvar o produto base, o modal de produto permanece aberto e o novo produto base é selecionado.

### Estabelecimentos

`js/modules/estabelecimentos/estabelecimentos.js`

Gerencia estabelecimentos e suas operações.

### Compras

`js/modules/compras/compras.js`

Gerencia compras, detalhes, itens e histórico.

### Lista de compras

`js/modules/listaCompras/listaCompras.js`

Gerencia itens da lista, edição, exclusão, marcação como comprado e consulta de últimas compras.

### Preços

`js/modules/precos/precos.js`

Gerencia pesquisa e consulta de preços relacionados aos produtos e compras.

---

## 8. HTML e eventos

A aplicação utiliza IDs e atributos `data-*` como contratos entre HTML e JavaScript.

Exemplos:

```text
id
data-acao
data-id
data-tela
data-fechar
```

A navegação e várias ações utilizam delegação de eventos.

Alterações em IDs ou atributos `data-*` devem ser verificadas contra suas referências no JavaScript.

IDs HTML devem permanecer únicos.

---

## 9. Utilitários

`js/shared/utils.js` contém funções compartilhadas, incluindo:

```text
qs()
escapeHTML()
moeda()
dataBR()
dataHoje()
quantidade()
```

Antes de criar uma função utilitária nova, verificar se já existe funcionalidade equivalente.

---

## 10. Inicialização e atualização

A inicialização carrega os dados dos repositories para o estado em memória e depois exibe a tela inicial.

O fluxo geral é:

```text
IndexedDB
   ↓
Repositories
   ↓
Estado em memória
   ↓
Renderização
```

`atualizarTudo()` centraliza a atualização das principais áreas da interface.

Após alterações persistidas, o estado e a interface devem ser atualizados.

---

## 11. Backup

A aplicação possui exportação de dados em JSON.

Estrutura conceitual:

```json
{
  "aplicativo": "Gastos de Mercado",
  "versao": 1,
  "dataExportacao": "...",
  "integridade": {
    "valido": true,
    "avisos": []
  },
  "dados": {
    "produtosBase": [],
    "produtos": [],
    "estabelecimentos": [],
    "compras": [],
    "itensCompra": [],
    "listaCompras": []
  }
}
```

A data de exportação utiliza o fuso `America/Sao_Paulo`.

Formato:

```text
YYYY-MM-DDTHH:mm:ss-03:00
```

Nome do arquivo:

```text
gastos-de-mercado-backup-YYYYMMDD-HHMMSS.json
```

---

## 12. Integridade dos dados

Existe uma função:

```text
validarIntegridadeDados(dados)
```

Ela verifica referências entre entidades, incluindo:

```text
Produto → Produto Base
Compra → Estabelecimento
Item de Compra → Compra
Item de Compra → Produto
```

### Exportação

A exportação não é bloqueada por inconsistências.

Inconsistências são registradas em:

```text
integridade.avisos
```

### Importação

A importação é mais restritiva.

Um backup com relacionamentos inválidos deve ser recusado antes de substituir os dados atuais.

---

## 13. Restauração

A restauração utiliza:

```text
restaurarDadosAtomico(dados)
```

implementada na camada de banco de dados.

A operação utiliza uma única transação `readwrite` envolvendo os stores necessários.

Fluxo:

```text
Backup
   ↓
Validação
   ↓
Confirmação
   ↓
Transação IndexedDB
   ↓
Substituição dos dados
   ↓
Recarregamento do estado
   ↓
Atualização da interface
```

A restauração substitui os dados atuais pelos dados do backup.

Não existe mesclagem automática entre backup e dados atuais.

---

## 14. Limpeza de dados

A aplicação possui uma operação para limpar todos os dados.

Ela remove os registros dos stores:

```text
produtos
produtosBase
estabelecimentos
compras
itensCompra
listaCompras
```

A operação exige confirmação do usuário e também limpa o estado em memória.

---

## 15. PWA

Arquivos principais:

```text
manifest.json
service-worker.js
```

O Service Worker é responsável pelo cache dos recursos da aplicação e pelo funcionamento offline.

O IndexedDB é responsável pelos dados do usuário.

São responsabilidades distintas:

```text
Service Worker → arquivos da aplicação
IndexedDB      → dados do usuário
```

O Service Worker utiliza cache versionado.

A versão atual conhecida do cache é:

```text
gastos-de-mercado-v1
```

Ao atualizar a versão do cache, caches antigos são removidos durante a ativação do novo Service Worker.

---

## 16. Caminhos e GitHub Pages

A aplicação pode ser publicada em uma subpasta através do GitHub Pages.

Por isso, caminhos relativos são importantes.

Exemplos:

```text
./index.html
./manifest.json
./service-worker.js
./css/style.css
./js/app.js
```

Evitar alterar indiscriminadamente caminhos relativos para caminhos absolutos iniciados por `/`, pois isso pode quebrar a aplicação quando hospedada em uma subpasta.

A estrutura publicada deve manter os caminhos esperados pelo `index.html`, `manifest.json` e `service-worker.js`.

---

## 17. Dados privados

O repositório pode conter o código e os recursos da aplicação.

Não deve conter:

- backups com dados reais;
- dados pessoais;
- senhas;
- tokens;
- credenciais;
- chaves de API;
- informações privadas.

Backups JSON são dados do usuário e devem permanecer fora do repositório público.

---

## 18. Versionamento do banco

A versão atual do IndexedDB é:

```text
1
```

Uma alteração estrutural que exija migração deve aumentar a versão e implementar a migração em `onupgradeneeded`.

Não alterar a estrutura persistida presumindo que os dados existentes serão automaticamente convertidos.

---

## 19. Versionamento do backup

A versão atual do formato de backup é:

```text
1
```

Alterações incompatíveis no formato devem utilizar versionamento e uma estratégia explícita de migração ou rejeição.

Backups existentes devem ser considerados antes de alterar o contrato.

---

## 20. Decisões arquiteturais

As seguintes decisões fazem parte da arquitetura atual:

- Persistência local via IndexedDB.
- Nenhum backend na arquitetura atual.
- JavaScript vanilla.
- JavaScript clássico, sem ES Modules.
- Repositories como camada de acesso às entidades persistidas.
- Estado compartilhado em memória.
- Backup e restauração através de JSON.
- Validação de integridade antes da restauração.
- Restauração atômica através de transação IndexedDB.
- PWA baseada em Manifest + Service Worker.
- Cache de recursos para funcionamento offline.
- Publicação compatível com GitHub Pages.
- Caminhos relativos para compatibilidade com hospedagem em subdiretório.

Essas decisões não devem ser substituídas por outra arquitetura sem uma necessidade clara.

---

## 21. Orientação para agentes de IA

Antes de modificar o projeto:

1. Identificar a camada responsável pela alteração.
2. Inspecionar o código existente e suas dependências.
3. Preservar os contratos entre HTML, módulos, estado, repositories e banco.
4. Considerar os relacionamentos entre entidades.
5. Considerar impacto sobre dados existentes.
6. Considerar impacto sobre exportação e importação.
7. Considerar compatibilidade do backup.
8. Considerar impacto sobre o Service Worker quando recursos estáticos forem alterados.
9. Reutilizar estruturas e funções existentes quando apropriado.
10. Evitar introduzir frameworks, bibliotecas, backend ou mudanças arquiteturais sem necessidade explícita.

### Ao alterar persistência

Verificar sempre:

```text
Modelo de dados
↓
Repository
↓
database.js
↓
IndexedDB
↓
Estado
↓
Interface
↓
Backup/importação
```

### Ao alterar HTML

Verificar:

```text
IDs
data-acao
data-id
data-tela
event listeners
```

### Ao alterar arquivos estáticos

Considerar:

```text
Service Worker
Cache
Caminhos relativos
GitHub Pages
```

---

## 22. Fonte de verdade

Este arquivo é um documento de contexto e pode ficar desatualizado.

A fonte de verdade é o código atual do projeto.

Em caso de divergência:

```text
código atual > PROJECT_CONTEXT.md
```

Quando uma alteração relevante modificar a arquitetura, os contratos ou as decisões descritas aqui, este documento deve ser atualizado.

---

## 23. Resumo rápido para agentes

```text
Projeto:
  Gastos de Mercado

Stack:
  HTML + CSS + JavaScript vanilla

Persistência:
  IndexedDB

Backend:
  Não existe atualmente

Arquitetura:
  UI → módulos → repositories → database.js → IndexedDB

Stores:
  produtosBase
  produtos
  estabelecimentos
  compras
  itensCompra
  listaCompras

PWA:
  manifest.json + service-worker.js

Offline:
  Service Worker + Cache API

Dados:
  IndexedDB local

Backup:
  JSON

Importação:
  validação + restauração atômica

Publicação:
  GitHub Pages

Princípio:
  preservar a arquitetura e os contratos existentes
```
