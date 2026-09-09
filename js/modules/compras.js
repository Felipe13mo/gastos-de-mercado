async function carregarCompras() {
  try {
    compras = await comprasRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Compras:", erro);
    compras = [];
    alert("Não foi possível carregar as compras.");

  }
}

async function carregarItensCompra() {
  try {
    itensCompra = await itensCompraRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Itens de Compra:", erro);
    itensCompra = [];
    alert("Não foi possível carregar os itens das compras.");

  }
}

function renderCompras() {
  const l = qs("listaComprasCadastradas");

  if (!compras.length) {
    l.innerHTML = '<div class="vazio">Nenhuma compra cadastrada.</div>';
    return;
  }

  const lista = [...compras].sort((a, b) =>
    String(b.data).localeCompare(String(a.data))
  );

  l.innerHTML = lista.map(c => {
    const e = estabelecimentos.find(
      x => Number(x.id) === Number(c.estabelecimentoId)
    );

    return `
      <div
        class="lista-item card-navegavel"
        data-acao="detalhes-compra"
        data-id="${c.id}"
        role="button"
        tabindex="0"
        aria-label="Abrir detalhes da compra ${escapeHTML(c.descricao || "Compra")}"
      >
        <div class="conteudo-card-compra">
          <strong>${escapeHTML(c.descricao || "Compra")}</strong>
          <small>
            ${escapeHTML(e?.nome || "Estabelecimento removido")} • ${dataBR(c.data)}
          </small>
        </div>

        <div class="item-acoes">
          <strong>${moeda(c.valorTotal)}</strong>

          <button
            type="button"
            class="botao-acao excluir"
            data-acao="excluir-compra"
            data-id="${c.id}"
            aria-label="Excluir compra"
          >
            <span class="icone-acao" aria-hidden="true">🗑️</span>
            <span class="texto-acao">Excluir</span>
          </button>

          <span class="chevron-card" aria-hidden="true">›</span>
        </div>
      </div>
    `;
  }).join("");
}

function abrirNovaCompra() {
  const select = qs("compraEstabelecimento");
  select.innerHTML = '<option value="">Selecione...</option>' +
    estabelecimentos.map(e => `<option value="${e.id}">${escapeHTML(e.nome)}</option>`).join("");
  qs("formCompra").reset();
  qs("compraData").value = dataHoje();
  abrirModal("modalCompra");
}

async function salvarCompra(e) {
  e.preventDefault();

  const novaCompra = {
    id: Date.now(),
    estabelecimentoId: Number(qs("compraEstabelecimento").value),
    descricao: qs("compraDescricao").value.trim(),
    valorTotal: Number(qs("compraValor").value),
    data: qs("compraData").value
  };

  try {
    await comprasRepository.criar(novaCompra);
    compras.push(novaCompra);
    fecharModais();
    atualizarTudo();
    e.target.reset();

  } catch (erro) {
    console.error("Erro ao salvar compra:", erro);
    alert("Não foi possível salvar a compra.");

  }
}

function renderDetalhes() {
  const c = compras.find(x => Number(x.id) === Number(compraSelecionadaId));
  const area = qs("conteudoDetalhesCompra");
  if (!c) { area.innerHTML = '<button type="button" data-acao="voltar-compras">← Voltar</button><p>Compra não encontrada.</p>'; return; }
  const e = estabelecimentos.find(x => Number(x.id) === Number(c.estabelecimentoId));
  const itens = itensCompra.filter(i => Number(i.compraId) === Number(c.id));

  area.innerHTML = `
    <div class="detalhes-cabecalho">
      <button type="button" class="botao-voltar" data-acao="voltar-compras">← Voltar para Compras</button>
      <h2>${escapeHTML(c.descricao || "Compra")}</h2>
      <small>${escapeHTML(e?.nome || "Estabelecimento removido")} • ${dataBR(c.data)}</small>
      <div class="total-compra"><span>Total da compra</span><strong>${moeda(c.valorTotal)}</strong></div>
    </div>
    <div class="titulo">
      <h3>Itens</h3>
    </div>
    ${itens.length ? itens.map(i => {

      const p = produtos.find(
        x => Number(x.id) === Number(i.produtoId)
      );

      const produtoBase = produtosBase.find(
        x => Number(x.id) === Number(p?.produtoBaseId)
      );

      const identificacao = [
        p?.marca,
        p?.complemento
      ]
        .filter(Boolean)
        .join(" • ");

      return `
      <div class="lista-item">
        <div>
          <strong>
            ${escapeHTML(
              produtoBase?.nome || "Produto removido"
            )}
          </strong>

          <small>
            ${escapeHTML(
              identificacao
                ? identificacao
                : ""
            )}

            ${identificacao ? " • " : ""}

            ${quantidade(i.quantidade)}
            ${escapeHTML(
              p?.unidadePreco || "Unidade"
            )}
            × ${moeda(i.valorUnitario)}
          </small>
        </div>

        <div class="item-acoes">
          <strong>
            ${moeda(
              Number(i.quantidade) *
              Number(i.valorUnitario)
            )}
          </strong>

          <button
            type="button"
            class="botao-acao excluir"
            data-acao="excluir-item"
            data-id="${i.id}"
            aria-label="Excluir item da compra"
          >
            <span class="icone-acao" aria-hidden="true">🗑️</span>
            <span class="texto-acao">Excluir</span>
          </button>
        </div>
      </div>`;
    }).join("") : '<div class="vazio">Nenhum item lançado.</div>'}

    <button
      type="button"
      class="botao-novo-item-compra"
      data-acao="novo-item"
    >
      + Adicionar item
    </button>
    `;
}

function abrirItemCompra() {
  const selectProduto = qs("itemProdutoBase");
  const selectItem = qs("itemProduto");

  /*
   * Produto = Produto base
   */
  selectProduto.innerHTML =
    '<option value="">Selecione...</option>' +
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

  /*
   * Item começa vazio até que um Produto
   * seja selecionado.
   */
  selectItem.innerHTML =
    '<option value="">Selecione...</option>';

  qs("formItemCompra").reset();

  /*
   * O reset pode alterar os selects,
   * então garantimos novamente os estados iniciais.
   */
  selectProduto.value = "";
  selectItem.value = "";

  qs("itemQuantidade").value = "1";
  qs("itemUnidadePreco").textContent = "Unidade";

  abrirModal("modalItemCompra");
}

function atualizarItensCompra() {
  const selectProduto = qs("itemProdutoBase");
  const selectItem = qs("itemProduto");

  if (!selectProduto || !selectItem) return;

  const produtoBaseId = selectProduto.value;

  /*
   * Nenhum Produto selecionado:
   * mantém o dropdown Item vazio.
   */
  if (!produtoBaseId) {
    selectItem.innerHTML =
      '<option value="">Selecione...</option>';

    return;
  }

  /*
   * Localiza somente os cadastros específicos
   * pertencentes ao Produto base selecionado.
   */
  const itens = produtos.filter(
    produto =>
      Number(produto.produtoBaseId) ===
      Number(produtoBaseId)
  );

  /*
   * Nenhum item cadastrado para o Produto.
   */
  if (!itens.length) {
    selectItem.innerHTML =
      '<option value="">Nenhum item disponível</option>';

    return;
  }

  /*
   * Monta a identificação visual do Item.
   */
  selectItem.innerHTML =
    '<option value="">Selecione...</option>' +
    itens.map(item => {

      const partes = [
        item.marca
          ? item.marca
          : "Sem marca",

        item.complemento
      ]
        .filter(Boolean);

      return `
        <option value="${item.id}">
          ${escapeHTML(partes.join(" • "))}
        </option>
      `;
    }).join("");
}

function atualizarUnidadeItemCompra() {
  const selectItem = qs("itemProduto");
  const campoUnidade = qs("itemUnidadePreco");

  if (!selectItem || !campoUnidade) return;

  const itemId = selectItem.value;

  if (!itemId) {
    campoUnidade.textContent = "Unidade";
    return;
  }

  const item = produtos.find(
    produto =>
      Number(produto.id) === Number(itemId)
  );

  if (!item) {
    campoUnidade.textContent = "Unidade";
    return;
  }

  campoUnidade.textContent =
    item.unidadePreco || "Unidade";
}

async function salvarItemCompra(e) {

  e.preventDefault();

  const produtoId = Number(
    qs("itemProduto").value
  );

  const quantidade = Number(
    qs("itemQuantidade").value
  );

  const valorUnitario = Number(
    qs("itemValorUnitario").value
  );

  if (!produtoId) {
    alert("Selecione um produto.");
    return;
  }

  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  if (quantidade > 999999.999) {
    alert("A quantidade máxima é 999999,999.");
    return;
  }

  if (
    Math.round(quantidade * 1000) / 1000 !==
    quantidade
  ) {
    alert(
      "A quantidade pode ter no máximo 3 casas decimais."
    );
    return;
  }

  if (
    !Number.isFinite(valorUnitario) ||
    valorUnitario < 0
  ) {
    alert("Informe um valor unitário válido.");
    return;
  }

  const novoItem = {

    id: Date.now(),

    compraId: compraSelecionadaId,

    produtoId: produtoId,

    quantidade:
      Math.round(quantidade * 1000) / 1000,

    valorUnitario: valorUnitario

  };

  try {

    await itensCompraRepository.criar(novoItem);

    itensCompra.push(novoItem);

    fecharModais();

    renderDetalhes();

    e.target.reset();

  } catch (erro) {

    console.error(
      "Erro ao salvar item da compra:",
      erro
    );

    alert(
      "Não foi possível salvar o item da compra."
    );
  }
}

async function excluirItemCompra(id) {

  const index = itensCompra.findIndex(
    item => Number(item.id) === Number(id)
  );

  if (index === -1) {
    alert("Item da compra não encontrado.");
    return;
  }

  if (!confirm("Deseja excluir este item da compra?")) {
    return;
  }

  try {
    await itensCompraRepository.excluir(id);
    itensCompra.splice(index, 1);
    renderDetalhes();

  } catch (erro) {
    console.error("Erro ao excluir item da compra:", erro);
    alert("Não foi possível excluir o item da compra.");

  }
}

async function excluirCompra(id) {
  const compra = compras.find(
    c => Number(c.id) === Number(id)
  );

  if (!compra) return;

  if (!confirm("Excluir esta compra e seus itens?")) return;

  try {
    // Primeiro exclui os itens vinculados no IndexedDB
    await itensCompraRepository.excluirPorCompraId(id);

    // Depois exclui a compra no IndexedDB
    await comprasRepository.excluir(id);

    // Atualiza os arrays em memória
    compras = compras.filter(
      c => Number(c.id) !== Number(id)
    );

    itensCompra = itensCompra.filter(
      i => Number(i.compraId) !== Number(id)
    );

    atualizarTudo();

  } catch (erro) {
    console.error("Erro ao excluir compra:", erro);
    alert("Não foi possível excluir a compra.");
  }
}

