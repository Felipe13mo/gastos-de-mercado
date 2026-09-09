// ==============================
// DADOS DA APLICAÇÃO
// ==============================

let produtos = [];
let produtosBase = [];
let estabelecimentos = [];
let compras = [];
let itensCompra = [];
let listaCompras = [];


// ==============================
// ESTADO DE EDIÇÃO E SELEÇÃO
// ==============================

let produtoEditandoId = null;
let produtoBaseEditandoId = null;
let produtoBaseAbertoAPartirDoProduto = false;
let compraSelecionadaId = null;
let produtoPrecoSelecionadoId = null;
let itemListaEditandoId = null;
let produtoBaseHistoricoComprasId = null;

// ==============================
// FILTROS E PAGINAÇÃO
// ==============================

let produtosFiltrados = [];
let produtosBaseFiltrados = [];
let quantidadeProdutosExibidos = 30;
let quantidadeHistoricoComprasExibidos = 30;


// ==============================
// CONFIGURAÇÕES
// ==============================

const LIMITE_PRODUTOS = 30;
const LIMITE_HISTORICO_COMPRAS = 30;
