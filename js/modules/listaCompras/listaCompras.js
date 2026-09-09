async function carregarListaCompras() {
  try {
    listaCompras = await listaComprasRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Lista de Compras:", erro);
    listaCompras = [];
    alert("Não foi possível carregar a lista de compras.");

  }
}

function renderListaCompras() {

  const area = qs("itensListaCompras");

  if (!area) return;

  if (!listaCompras.length) {
    area.innerHTML = `
      <div class="vazio">
        Nenhum produto na lista.
      </div>
    `;
    return;
  }

  area.innerHTML = listaCompras.map(item => {

    const produtoBase = produtosBase.find(
      p => Number(p.id) === Number(item.produtoBaseId)
    );

    const comprado = item.comprado === true;

    return `
      <div
        class="lista-item ${comprado ? "item-comprado" : ""}"
        data-id="${item.id}"
      >

        <div
          class="item-lista-conteudo"
          data-acao="editar-item-lista"
          data-id="${item.id}"
        >

          <div class="checkbox-lista">

            <input
              type="checkbox"
              data-acao="marcar-item-lista"
              data-id="${item.id}"
              ${comprado ? "checked" : ""}
            >

            <div
              class="item-lista-info"
              data-acao="editar-item-lista"
              data-id="${item.id}"
            >
              <strong>
                ${escapeHTML(
                  produtoBase?.nome || "Produto removido"
                )}
              </strong>

              <small>
                ${quantidade(item.quantidade)}
                ${escapeHTML(item.unidade || "Unidade")}
              </small>
            </div>

          </div>

        </div>

        <div class="item-acoes">

          <button
            type="button"
            class="botao-acao"
            data-acao="ultimas-compras-lista"
            data-id="${item.id}"
            aria-label="Ver últimas compras"
          >
            <span class="icone-acao" aria-hidden="true">🛒</span>
            <span class="texto-acao">Últimas compras</span>
          </button>

          <button
            type="button"
            class="botao-acao excluir"
            data-acao="excluir-item-lista"
            data-id="${item.id}"
            aria-label="Excluir item da lista"
          >
            <span class="icone-acao" aria-hidden="true">🗑️</span>
            <span class="texto-acao">Excluir</span>
          </button>

        </div>

      </div>
    `;
  }).join("");
}

function abrirItemListaCompras() {

  const select = qs("listaProdutoBase");

  select.innerHTML =
    '<option value="">Selecione um produto</option>' +
    produtosBase
      .slice()
      .sort((a, b) =>
        String(a.nome || "").localeCompare(
          String(b.nome || ""),
          "pt-BR"
        )
      )
      .map(p =>
        `<option value="${p.id}">
          ${escapeHTML(p.nome)}
        </option>`
      )
      .join("");

  qs("formItemListaCompras").reset();

  qs("listaQuantidade").value = "1";

  qs("listaUnidade").value = "";

  qs("tituloModalItemLista").textContent =
    "Adicionar produto à lista";

  qs("btnSalvarItemLista").textContent =
    "Adicionar à lista";

  abrirModal("modalItemListaCompras");
}

async function salvarItemListaCompras(e) {

  e.preventDefault();

  const produtoBaseId = Number(
    qs("listaProdutoBase").value
  );

  const quantidadeInformada = Number(
    qs("listaQuantidade").value
  );

  const unidade = qs("listaUnidade").value;

  if (!produtoBaseId) {
    alert("Selecione um produto.");
    return;
  }

  if (
    !Number.isFinite(quantidadeInformada) ||
    quantidadeInformada <= 0
  ) {
    alert("Informe uma quantidade válida.");
    return;
  }

  if (quantidadeInformada > 999999.999) {
    alert("A quantidade máxima é 999999,999.");
    return;
  }

  const quantidade = Math.round(quantidadeInformada * 1000) / 1000;

  if (quantidade !== quantidadeInformada) {
    alert("A quantidade pode ter no máximo 3 casas decimais.");
    return;
  }

  if (!unidade) {
    alert("Selecione uma unidade.");
    return;
  }

  try {

    if (itemListaEditandoId !== null) {

      const item = listaCompras.find(
        x => Number(x.id) === Number(itemListaEditandoId)
      );

      if (!item) return;

      const itemAtualizado = {
        ...item,
        produtoBaseId: produtoBaseId,
        quantidade: quantidade,
        unidade: unidade
      };

      await listaComprasRepository.atualizar(itemAtualizado);

      const index = listaCompras.findIndex(
        x => Number(x.id) === Number(itemListaEditandoId)
      );

      if (index !== -1) {
        listaCompras[index] = itemAtualizado;
      }

    } else {

      const novoItem = {
        id: Date.now(),
        produtoBaseId: produtoBaseId,
        quantidade: quantidade,
        unidade: unidade,
        comprado: false
      };

      await listaComprasRepository.criar(novoItem);
      listaCompras.push(novoItem);
    }

    fecharModais();
    renderListaCompras();
    itemListaEditandoId = null;

  } catch (erro) {
    console.error("Erro ao salvar item da lista de compras:", erro);
    alert("Não foi possível salvar o item da lista de compras.");

  }
}

function editarItemListaCompras(id) {

  const item = listaCompras.find(
    x => Number(x.id) === Number(id)
  );

  if (!item) return;

  const select = qs("listaProdutoBase");

  select.innerHTML =
    '<option value="">Selecione um produto</option>' +
    produtosBase
      .slice()
      .sort((a, b) =>
        String(a.nome || "").localeCompare(
          String(b.nome || ""),
          "pt-BR"
        )
      )
      .map(p =>
        `<option value="${p.id}">
          ${escapeHTML(p.nome)}
        </option>`
      )
      .join("");

  itemListaEditandoId = Number(item.id);

  qs("listaProdutoBase").value =
    String(item.produtoBaseId);

  qs("listaQuantidade").value =
    item.quantidade;

  qs("listaUnidade").value =
    item.unidade;

  qs("tituloModalItemLista").textContent =
    "Editar produto da lista";

  qs("btnSalvarItemLista").textContent =
    "Salvar alterações";

  abrirModal("modalItemListaCompras");
}

async function excluirItemListaCompras(id) {

  const item = listaCompras.find(
    x => Number(x.id) === Number(id)
  );

  if (!item) return;

  const produtoBase = produtosBase.find(
    p => Number(p.id) === Number(item.produtoBaseId)
  );

  const nome = produtoBase?.nome || "este produto";

  if (!confirm(`Excluir "${nome}" da lista?`)) {
    return;
  }

  try {

    await listaComprasRepository.excluir(id);

    listaCompras = listaCompras.filter(
      x => Number(x.id) !== Number(id)
    );

    renderListaCompras();

  } catch (erro) {
    console.error("Erro ao excluir item da lista de compras:", erro);
    alert("Não foi possível excluir o item da lista de compras.");

  }
}

async function alternarCompradoItemLista(id) {

  const item = listaCompras.find(
    x => Number(x.id) === Number(id)
  );

  if (!item) return;

  const itemAtualizado = {
    ...item,
    comprado: item.comprado !== true
  };

  try {

    await listaComprasRepository.atualizar(itemAtualizado);

    const index = listaCompras.findIndex(
      x => Number(x.id) === Number(id)
    );

    if (index !== -1) {
      listaCompras[index] = itemAtualizado;
    }

    renderListaCompras();

  } catch (erro) {
    console.error("Erro ao atualizar item da lista de compras:", erro);
    alert("Não foi possível atualizar o item da lista de compras.");

  }
}

function abrirUltimasComprasLista(id) {

  const itemLista = listaCompras.find(
    x => Number(x.id) === Number(id)
  );

  if (!itemLista) return;

  produtoBaseHistoricoComprasId =
    Number(itemLista.produtoBaseId);

  const produtoBase = produtosBase.find(
    p => Number(p.id) === produtoBaseHistoricoComprasId
  );

  if (!produtoBase) return;

  qs("produtoBaseHistoricoComprasNome").textContent =
    produtoBase.nome || "Produto";

  quantidadeHistoricoComprasExibidos =
    LIMITE_HISTORICO_COMPRAS;

  mostrarTela("historicoComprasLista");

  renderHistoricoComprasLista();
}

async function limparListaCompras() {

  if (!listaCompras.length) {
    alert("A lista de compras já está vazia.");
    return;
  }

  if (!confirm("Limpar todos os produtos da lista de compras?")) {
    return;
  }

  try {

    await Promise.all(
      listaCompras.map(
        item => listaComprasRepository.excluir(item.id)
      )
    );

    listaCompras = [];
    renderListaCompras();

  } catch (erro) {
    console.error("Erro ao limpar lista de compras:", erro);
    alert("Não foi possível limpar a lista de compras.");

  }
}

