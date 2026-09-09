function abrirModal(id) {
  qs(id).classList.add("aberto");
}

function fecharModais() {
  document
    .querySelectorAll(".modal")
    .forEach(m => m.classList.remove("aberto"));

  produtoEditandoId = null;

  const titulo = qs("tituloModalProduto");

  if (titulo) {
    titulo.textContent = "Cadastrar produto";
  }
}

function atualizarTudo() {
  atualizarCategoriasProdutos();
  renderProdutos();
  renderProdutosBase();
  renderEstabelecimentos();
  renderCompras();
  renderListaCompras();
  atualizarResumo();

  if (
    qs("detalhesCompra").classList.contains("ativa") &&
    compraSelecionadaId
  ) {
    renderDetalhes();
  }

}

function atualizarResumo() {
  qs("totalGasto").textContent = moeda(compras.reduce((s,c) => s + Number(c.valorTotal || 0), 0));
  qs("totalCompras").textContent = compras.length;
  qs("totalProdutos").textContent = produtos.length;
  qs("totalEstabelecimentos").textContent = estabelecimentos.length;
}

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach(el => el.classList.remove("ativa"));

  document.querySelectorAll(".menu button[data-tela]").forEach(botao => {
      botao.classList.toggle("ativa", botao.dataset.tela === id);
  });

  const tela = qs(id);
  if (tela) tela.classList.add("ativa");
  if (id !== "detalhesCompra") compraSelecionadaId = null;
  if (id === "precos") prepararPrecos();
  atualizarTudo();
  window.scrollTo(0,0);
}

function dataHoraSaoPaulo() {
  const agora = new Date();

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(agora);

  const valores = {};

  partes.forEach(parte => {
    if (parte.type !== "literal") {
      valores[parte.type] = parte.value;
    }
  });

  const local = `${valores.year}-${valores.month}-${valores.day}T${valores.hour}:${valores.minute}:${valores.second}`;

  const utc = new Date(
    Date.UTC(
      Number(valores.year),
      Number(valores.month) - 1,
      Number(valores.day),
      Number(valores.hour),
      Number(valores.minute),
      Number(valores.second)
    )
  );

  const diferencaMinutos = Math.round(
    (utc.getTime() - agora.getTime()) / 60000
  );

  const sinal = diferencaMinutos >= 0 ? "+" : "-";
  const minutosAbsolutos = Math.abs(diferencaMinutos);
  const horas = String(Math.floor(minutosAbsolutos / 60)).padStart(2, "0");
  const minutos = String(minutosAbsolutos % 60).padStart(2, "0");

  return `${local}${sinal}${horas}:${minutos}`;
}

function validarIntegridadeDados(dados) {
  const avisos = [];

  const idsProdutosBase = new Set(
    dados.produtosBase.map(p => Number(p.id))
  );

  const idsProdutos = new Set(
    dados.produtos.map(p => Number(p.id))
  );

  const idsEstabelecimentos = new Set(
    dados.estabelecimentos.map(e => Number(e.id))
  );

  const idsCompras = new Set(
    dados.compras.map(c => Number(c.id))
  );

  dados.produtos.forEach(produto => {
    if (
      produto.produtoBaseId != null &&
      !idsProdutosBase.has(Number(produto.produtoBaseId))
    ) {
      avisos.push(
        `Produto ${produto.id} referencia Produto Base inexistente.`
      );
    }
  });

  dados.compras.forEach(compra => {
    if (
      compra.estabelecimentoId != null &&
      !idsEstabelecimentos.has(Number(compra.estabelecimentoId))
    ) {
      avisos.push(
        `Compra ${compra.id} referencia Estabelecimento inexistente.`
      );
    }
  });

  dados.itensCompra.forEach(item => {
    if (
      item.compraId != null &&
      !idsCompras.has(Number(item.compraId))
    ) {
      avisos.push(
        `Item de compra ${item.id} referencia Compra inexistente.`
      );
    }

    if (
      item.produtoId != null &&
      !idsProdutos.has(Number(item.produtoId))
    ) {
      avisos.push(
        `Item de compra ${item.id} referencia Produto inexistente.`
      );
    }
  });

  return {
    valido: avisos.length === 0,
    avisos
  };
}

async function obterDadosParaExportacao() {
  const [
    produtosBaseExportacao,
    produtosExportacao,
    estabelecimentosExportacao,
    comprasExportacao,
    itensCompraExportacao,
    listaComprasExportacao
  ] = await Promise.all([
    produtosBaseRepository.listar(),
    produtosRepository.listar(),
    estabelecimentosRepository.listar(),
    comprasRepository.listar(),
    itensCompraRepository.listar(),
    listaComprasRepository.listar()
  ]);

  const dados = {
    produtosBase: produtosBaseExportacao,
    produtos: produtosExportacao,
    estabelecimentos: estabelecimentosExportacao,
    compras: comprasExportacao,
    itensCompra: itensCompraExportacao,
    listaCompras: listaComprasExportacao
  };

  const integridade = validarIntegridadeDados(dados);

  return {
    aplicativo: "Gastos de Mercado",
    versao: 1,
    dataExportacao: dataHoraSaoPaulo(),
    integridade,
    dados
  };
}

async function exportarDados() {
  try {
    const backup = await obterDadosParaExportacao();

    const conteudo = JSON.stringify(backup, null, 2);
    const arquivo = new Blob(
      [conteudo],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(arquivo);

    const agora = dataHoraSaoPaulo();
    const [data, horario] = agora.split("T");

    const horarioArquivo = horario
      .replace(/[-+].*$/, "")
      .replace(/:/g, "-");

    const link = document.createElement("a");
    link.href = url;
    link.download = `gastos-de-mercado-backup-${data.replace(/-/g, "")}-${horarioArquivo.replace(/-/g, "")}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    if (backup.integridade.valido) {
      alert("Backup dos dados exportado com sucesso.");

    } else {
      alert(
        `Backup dos dados exportado com avisos.\n\n` +
        `Foram encontradas ${backup.integridade.avisos.length} ` +
        `${backup.integridade.avisos.length === 1 ? "inconsistência" : "inconsistências"} ` +
        `nos dados.\n\n` +
        `O arquivo foi gerado normalmente e contém os dados atuais da aplicação.`
      );

    }

  } catch (erro) {
    console.error("Erro ao exportar dados:", erro);
    alert("Não foi possível exportar os dados.");

  }
}

function iniciarImportacaoDados() {
  const input = qs("inputImportarDados");

  if (!input) {
    alert("Não foi possível iniciar a importação.");
    return;
  }

  input.value = "";
  input.click();
}

async function selecionarArquivoImportacao(e) {
  const arquivo = e.target.files[0];

  if (!arquivo) {
    return;
  }

  try {
    const texto = await arquivo.text();
    const backup = JSON.parse(texto);

    if (!backup || typeof backup !== "object") {
      throw new Error("Arquivo inválido.");
    }

    if (backup.aplicativo !== "Gastos de Mercado") {
      throw new Error("Este arquivo não pertence ao aplicativo Gastos de Mercado.");
    }

    if (backup.versao !== 1) {
      throw new Error("Versão do backup não suportada.");
    }

    if (!backup.dados || typeof backup.dados !== "object") {
      throw new Error("Estrutura de dados do backup inválida.");
    }

    const nomesStores = [
      "produtosBase",
      "produtos",
      "estabelecimentos",
      "compras",
      "itensCompra",
      "listaCompras"
    ];

    for (const nome of nomesStores) {
      if (!Array.isArray(backup.dados[nome])) {
        throw new Error(
          `O backup não contém uma lista válida de ${nome}.`
        );
      }
    }

    const integridade = validarIntegridadeDados(backup.dados);

    if (!integridade.valido) {
      throw new Error(
        "O backup contém inconsistências nos relacionamentos:\n\n" +
        integridade.avisos.join("\n")
      );
    }

    const resumo =
      `Backup encontrado.\n\n` +
      `Data: ${backup.dataExportacao || "não informada"}\n\n` +
      `Produtos base: ${backup.dados.produtosBase.length}\n` +
      `Produtos: ${backup.dados.produtos.length}\n` +
      `Estabelecimentos: ${backup.dados.estabelecimentos.length}\n` +
      `Compras: ${backup.dados.compras.length}\n` +
      `Itens de compra: ${backup.dados.itensCompra.length}\n` +
      `Itens da lista: ${backup.dados.listaCompras.length}`;

    console.log("Backup validado:", backup);

    const confirmar = confirm(
      `${resumo}\n\n` +
      `ATENÇÃO!\n` +
      `A restauração substituirá todos os dados atuais da aplicação.\n\n` +
      `Deseja continuar?`
    );

    if (!confirmar) {
      console.log("Importação cancelada pelo usuário.");
      return;
    }

    console.log("Restauração autorizada:", backup);

    await restaurarDadosAtomico(backup.dados);

    await carregarProdutosBase();
    await carregarProdutos();
    await carregarEstabelecimentos();
    await carregarCompras();
    await carregarItensCompra();
    await carregarListaCompras();

    produtosBaseFiltrados = [...produtosBase];

    atualizarCategoriasProdutosBase();
    atualizarTudo();

    alert("Dados restaurados com sucesso.");

  } catch (erro) {
    console.error("Erro ao importar backup:", erro);
    alert(
      `Não foi possível importar o backup.\n\n${erro.message}`
    );

  } finally {
    e.target.value = "";

  }
}

(() => {
"use strict";

async function inicializarAplicacao() {
  await carregarProdutosBase();
  
  produtosBaseFiltrados = [...produtosBase];
  atualizarCategoriasProdutosBase();

  await carregarProdutos();
  await carregarEstabelecimentos();
  await carregarCompras();
  await carregarItensCompra();
  await carregarListaCompras();
  mostrarTela("inicio");
}

async function limpar() {
  if (!confirm("ATENÇÃO! Todos os dados do projeto serão apagados. Deseja continuar?")) return;

  try {

    await Promise.all([
      db.limpar.produtos(),
      db.limpar.produtosBase(),
      db.limpar.estabelecimentos(),
      db.limpar.compras(),
      db.limpar.itensCompra(),
      db.limpar.listaCompras()
    ]);

  } catch (erro) {

    console.error(
      "Erro ao limpar o IndexedDB:",
      erro
    );

    alert(
      "Não foi possível apagar todos os dados."
    );

    return;
  }
  produtos = [];
  produtosBase = [];
  estabelecimentos=[];
  compras=[];
  itensCompra=[];
  listaCompras = [];
  compraSelecionadaId=null;
  produtoPrecoSelecionadoId=null;
  mostrarTela("inicio");
  alert("Todos os dados foram apagados.");
}

document.addEventListener("click", e => {

  const nav = e.target.closest("[data-tela]");

  const carregar =
    e.target.closest("#btnCarregarMaisProdutos");

  if (carregar) {
    carregarMaisProdutos();
    return;
  }

  if (nav) {
    mostrarTela(nav.dataset.tela);
    return;
  }

  const fechar =
    e.target.closest("[data-fechar]");

  if (fechar) {
    fecharModais();
    return;
  }

  const acaoExcluir = e.target.closest('[data-acao="excluir-compra"]');

  if (acaoExcluir) {
    excluirCompra(Number(acaoExcluir.dataset.id));
    return;
  }

  const b = e.target.closest("[data-acao]");

  if (!b) return;

  const acao = b.dataset.acao;
  const id = Number(b.dataset.id);

  if (acao === "exportar-dados") {
    exportarDados();
  } else if (acao === "importar-dados") {
    iniciarImportacaoDados();
  } else if (acao === "editar-produto") {
    editarCadastroProduto(id);
  } else if (acao === "editar-produto-base") {
    editarProdutoBase(id);
  } else if (acao === "excluir-produto") {
    excluirCadastroProduto(id);
  } else if (acao === "pesquisar-produtos-base") {
    pesquisarProdutosBase();
  } else if (acao === "limpar-dados") {
    limpar();
  } else if (acao === "excluir-estabelecimento") {
    excluirEstabelecimento(id);
  } else if (acao === "detalhes-compra") {
    compraSelecionadaId=id;
    mostrarTela("detalhesCompra");
  } else if (acao === "novo-item") {
    abrirItemCompra();
  } else if (acao === "excluir-item") {
    excluirItemCompra(id);
  } else if (acao === "voltar-compras") {
    mostrarTela("compras");
  } else if (acao === "selecionar-preco") {
    selecionarProdutoPreco(id);
  } else if (acao === "voltar-precos") {
    voltarParaPesquisaPrecos();
  } else if (acao === "novo-item-lista") {
    abrirItemListaCompras();
  } else if (acao === "excluir-item-lista") {
    excluirItemListaCompras(id);
  } else if (acao === "editar-item-lista") {
    editarItemListaCompras(id);
  } else if (acao === "limpar-lista-compras") {
    limparListaCompras();
  } else if (acao === "marcar-item-lista") {
    alternarCompradoItemLista(id);
  } else if (acao === "ultimas-compras-lista") {
    abrirUltimasComprasLista(id);
  } else if (acao === "voltar-lista-compras") {
    mostrarTela("listaCompras");
  } else if (acao === "carregar-mais-historico-compras") {
    carregarMaisHistoricoCompras();
  }
});

document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        fecharModais();
    }
});

qs("btnNovoProduto").addEventListener("click", abrirNovoProduto);
qs("btnNovoEstabelecimento").addEventListener("click", abrirNovoEstabelecimento);
qs("btnNovaCompra").addEventListener("click", abrirNovaCompra);
qs("formProduto").addEventListener("submit", salvarProduto);
qs("btnNovoProdutoBase").addEventListener("click", abrirNovoProdutoBase);
qs("btnNovoProdutoBaseTela").addEventListener("click", abrirNovoProdutoBase);
qs("formProdutoBase").addEventListener("submit", salvarProdutoBase);
qs("produtoBase").addEventListener("change", atualizarCategoriaProduto);
qs("formEstabelecimento").addEventListener("submit", salvarEstabelecimento);
qs("formCompra").addEventListener("submit", salvarCompra);
qs("formItemCompra").addEventListener("submit", salvarItemCompra);
qs("formItemListaCompras").addEventListener("submit", salvarItemListaCompras);
qs("btnPesquisarPrecos").addEventListener("click", pesquisarPrecos);
qs("itemProdutoBase").addEventListener("change", atualizarItensCompra);
qs("itemProduto").addEventListener("change", atualizarUnidadeItemCompra);
qs("btnPesquisarProdutos").addEventListener("click", pesquisarProdutos);
qs("inputImportarDados").addEventListener("change", selecionarArquivoImportacao);

document.querySelectorAll(".modal").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) fecharModais(); });
});

inicializarAplicacao();

})();
