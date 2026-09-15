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

  const lista = [...compras].sort((a, b) => {
    const comparacaoData =
      String(b.data || "").localeCompare(String(a.data || ""));

    if (comparacaoData !== 0) {
      return comparacaoData;
    }

    return Number(b.id) - Number(a.id);
  });

  const gruposPorData = new Map();

  lista.forEach(c => {
    const data = String(c.data || "");

    if (!gruposPorData.has(data)) {
      gruposPorData.set(data, []);
    }

    gruposPorData.get(data).push(c);
  });

  l.innerHTML = [...gruposPorData.entries()]
    .map(([data, comprasDoDia]) => `
      <div class="grupo-historico-compras">

        <div class="data-historico-compras">
          ${dataBR(data)}
        </div>

        <div class="lista-historico-compras">

          ${comprasDoDia.map(c => {

            const e = estabelecimentos.find(
              x => Number(x.id) === Number(c.estabelecimentoId)
            );

            return `
              <div
                class="lista-item card-navegavel card-compra"
                data-acao="detalhes-compra"
                data-id="${c.id}"
                role="button"
                tabindex="0"
                aria-label="Abrir compra de ${escapeHTML(
                  e?.nome || "Estabelecimento removido"
                )}"
              >

                <div class="conteudo-card-compra">

                  <!-- BLOCO 1 -->
                  <div class="info-card-compra">

                    <strong>
                      ${escapeHTML(
                        e?.nome || "Estabelecimento removido"
                      )}
                    </strong>

                    <strong class="valor-card-compra">
                      ${moeda(c.valorTotal)}
                    </strong>

                  </div>

                  <!-- BLOCO 2 -->
                  <div class="item-acoes">

                    <button
                      type="button"
                      class="botao-acao"
                      data-acao="editar-compra"
                      data-id="${c.id}"
                      aria-label="Editar compra"
                    >
                      <span class="icone-acao" aria-hidden="true">✏️</span>
                      <span class="texto-acao">Editar</span>
                    </button>

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

                  </div>

                </div>

              </div>
            `;
          }).join("")}

        </div>

      </div>
    `)
    .join("");
}

function abrirNovaCompra() {
  const selectEstabelecimento = qs("compraEstabelecimento");
  const selectCidade = qs("compraCidade");
  const selectUnidade = qs("compraUnidade");

  const estabelecimentosUnicos = [
    ...new Map(
      estabelecimentos.map(e => [
        String(e.nome || "").trim(),
        e
      ])
    ).values()
  ].sort((a, b) =>
    String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR"
    )
  );

  selectEstabelecimento.innerHTML =
    '<option value="">Selecione...</option>' +
    estabelecimentosUnicos
      .map(e => `
        <option value="${escapeHTML(e.nome)}">
          ${escapeHTML(e.nome)}
        </option>
      `)
      .join("");

  selectCidade.innerHTML =
    '<option value="">Selecione...</option>';

  selectUnidade.innerHTML =
    '<option value="">Selecione...</option>';

  qs("formCompra").reset();

  qs("compraData").value = dataHoje();

  qs("tituloModalCompra").textContent = "Nova compra";

  abrirModal("modalCompra");
}

function atualizarCidadesCompra() {
  const nomeEstabelecimento =
    qs("compraEstabelecimento").value;

  const selectCidade = qs("compraCidade");
  const selectUnidade = qs("compraUnidade");

  selectCidade.innerHTML =
    '<option value="">Selecione...</option>';

  selectUnidade.innerHTML =
    '<option value="">Selecione...</option>';

  if (!nomeEstabelecimento) return;

  const cidades = [
    ...new Set(
      estabelecimentos
        .filter(e =>
          String(e.nome || "").trim() ===
          nomeEstabelecimento
        )
        .map(e => String(e.cidade || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  selectCidade.innerHTML +=
    cidades
      .map(cidade => `
        <option value="${escapeHTML(cidade)}">
          ${escapeHTML(cidade)}
        </option>
      `)
      .join("");
}


function atualizarUnidadesCompra() {
  const nomeEstabelecimento =
    qs("compraEstabelecimento").value;

  const cidade =
    qs("compraCidade").value;

  const selectUnidade = qs("compraUnidade");

  selectUnidade.innerHTML =
    '<option value="">Selecione...</option>';

  if (!nomeEstabelecimento || !cidade) return;

  const unidades = [
    ...new Set(
      estabelecimentos
        .filter(e =>
          String(e.nome || "").trim() ===
            nomeEstabelecimento &&
          String(e.cidade || "").trim() ===
            cidade
        )
        .map(e => String(e.unidade || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  selectUnidade.innerHTML +=
    unidades
      .map(unidade => `
        <option value="${escapeHTML(unidade)}">
          ${escapeHTML(unidade)}
        </option>
      `)
      .join("");
}

async function salvarCompra(e) {
  e.preventDefault();

  const nomeEstabelecimento =
    qs("compraEstabelecimento").value;

  const cidade =
    qs("compraCidade").value;

  const unidade =
    qs("compraUnidade").value;

  const estabelecimento = estabelecimentos.find(e =>
    String(e.nome || "").trim() === nomeEstabelecimento &&
    String(e.cidade || "").trim() === cidade &&
    String(e.unidade || "").trim() === unidade
  );

  if (!estabelecimento) {
    alert("Estabelecimento não encontrado.");
    return;
  }

  const dadosCompra = {
    estabelecimentoId:
      Number(estabelecimento.id),

    descricao: "",

    valorTotal:
      Number(qs("compraValor").value),

    data:
      qs("compraData").value
  };

  try {

    if (compraSelecionadaId !== null) {

      const compra = compras.find(
        c => Number(c.id) === Number(compraSelecionadaId)
      );

      if (!compra) {
        alert("Compra não encontrada.");
        return;
      }

      const compraAtualizada = {
        ...compra,
        ...dadosCompra
      };

      await comprasRepository.atualizar(
        compraAtualizada
      );

      const indice = compras.findIndex(
        c => Number(c.id) === Number(compraSelecionadaId)
      );

      if (indice !== -1) {
        compras[indice] = compraAtualizada;
      }

    } else {

      const novaCompra = {
        id: Date.now(),
        ...dadosCompra
      };

      await comprasRepository.criar(novaCompra);

      compras.push(novaCompra);
    }

    compraSelecionadaId = null;

    fecharModais();

    atualizarTudo();

    e.target.reset();

  } catch (erro) {

    console.error(
      "Erro ao salvar compra:",
      erro
    );

    alert(
      "Não foi possível salvar a compra."
    );
  }
}

function editarCompra(id) {
  const compra = compras.find(
    c => Number(c.id) === Number(id)
  );

  if (!compra) return;

  const estabelecimento = estabelecimentos.find(
    e => Number(e.id) === Number(compra.estabelecimentoId)
  );

  if (!estabelecimento) {
    alert("Estabelecimento da compra não encontrado.");
    return;
  }

  compraSelecionadaId = Number(compra.id);

  const selectEstabelecimento =
    qs("compraEstabelecimento");

  const selectCidade =
    qs("compraCidade");

  const selectUnidade =
    qs("compraUnidade");

  const estabelecimentosUnicos = [
    ...new Map(
      estabelecimentos.map(e => [
        String(e.nome || "").trim(),
        e
      ])
    ).values()
  ].sort((a, b) =>
    String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR"
    )
  );

  selectEstabelecimento.innerHTML =
    '<option value="">Selecione...</option>' +
    estabelecimentosUnicos
      .map(e => `
        <option value="${escapeHTML(e.nome)}">
          ${escapeHTML(e.nome)}
        </option>
      `)
      .join("");

  selectEstabelecimento.value =
    String(estabelecimento.nome || "").trim();

  atualizarCidadesCompra();

  selectCidade.value =
    String(estabelecimento.cidade || "").trim();

  atualizarUnidadesCompra();

  selectUnidade.value =
    String(estabelecimento.unidade || "").trim();

  qs("compraValor").value =
    compra.valorTotal;

  qs("compraData").value =
    compra.data;

  qs("tituloModalCompra").textContent =
    "Editar compra";

  abrirModal("modalCompra");
}

function renderDetalhes() {
  const c = compras.find(x => Number(x.id) === Number(compraSelecionadaId));
  const area = qs("conteudoDetalhesCompra");
  if (!c) { area.innerHTML = '<button type="button" data-acao="voltar-compras">← Voltar</button><p>Compra não encontrada.</p>'; return; }
  const e = estabelecimentos.find(x => Number(x.id) === Number(c.estabelecimentoId));
  const itens = itensCompra.filter(i => Number(i.compraId) === Number(c.id));

  const totalItensCentavos = itens.reduce(
    (total, item) =>
      total +
      Math.round(
        Number(item.quantidade) *
        Number(item.valorUnitario) *
        100
      ),
    0
  );

  const totalCompraCentavos =
    Math.round(Number(c.valorTotal) * 100);

  const diferencaCentavos =
    totalCompraCentavos -
    totalItensCentavos;

  const diferenca = diferencaCentavos / 100;

  area.innerHTML = `
    <div class="detalhes-cabecalho">
      <button type="button" class="botao-voltar" data-acao="voltar-compras">
        ← Voltar para Compras
      </button>
      
      <h2>${escapeHTML(c.descricao || "Compra")}</h2>

      <div class="linha-resumo-compra">
        <small>
          ${dataBR(c.data)} • ${escapeHTML(e?.cidade || "Cidade não registrada")}
        </small>
      </div>

      <div class="linha-resumo-compra">
        <small>
          ${escapeHTML(e?.nome || "Estabelecimento removido")}
          ${
            e?.unidade
              ? " • " +
                escapeHTML(e?.unidade)
              : ""
          }
        </small>
      </div>

      <div class="total-compra">
        <span>Total da compra</span>
        <strong>${moeda(totalCompraCentavos / 100)}</strong>
      </div>

      <div class="linha-resumo-compra">
        <small>Itens lançados</small>
        <small>
          ${moeda(totalItensCentavos / 100)}
        </small>
      </div>

      <div class="linha-resumo-compra">
        <small>Diferença</small>
        <small>
          ${moeda(diferenca)}
        </small>
      </div>

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

          ${
            identificacao
              ? `
                <small class="local-historico">
                  ${escapeHTML(identificacao)}
                </small>
              `
              : ""
          }

          <small class="local-historico">
            ${moeda(i.valorUnitario)}
            /
            ${escapeHTML(
              p?.unidadePreco || "Unidade"
            )}
          </small>

          <strong class="resumo-lancamento">
            ${quantidade(i.quantidade)}
            ${escapeHTML(
              p?.unidadePreco || "Unidade"
            )}
            • Total
            ${moeda(
              Number(i.quantidade) *
              Number(i.valorUnitario)
            )}
          </strong>

        </div>

        <div class="item-acoes">

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

      </div>
      `;
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
  const selectMarca = qs("itemMarca");
  const selectComplemento = qs("itemProduto");

  /*
   * Identifica quais Produtos Base possuem
   * pelo menos um Produto cadastrado.
   */
  const idsProdutosBaseComCadastro = new Set(
    produtos.map(produto =>
      Number(produto.produtoBaseId)
    )
  );

  /*
   * Produto = somente Produtos Base que
   * possuem pelo menos um Produto cadastrado.
   */
  selectProduto.innerHTML =
    '<option value="">Selecione...</option>' +
    produtosBase
      .filter(produtoBase =>
        idsProdutosBaseComCadastro.has(
          Number(produtoBase.id)
        )
      )
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
   * Marca começa vazia até que um Produto
   * seja selecionado.
   */
  selectMarca.innerHTML =
    '<option value="">Selecione...</option>';

  /*
   * Complemento começa vazio até que
   * Produto e Marca sejam definidos.
   */
  selectComplemento.innerHTML =
    '<option value="">Selecione...</option>';

  qs("formItemCompra").reset();

  /*
   * O reset pode alterar os selects,
   * então garantimos novamente os estados iniciais.
   */
  selectProduto.value = "";
  selectMarca.value = "";
  selectComplemento.value = "";

  qs("itemQuantidade").value = "1";
  qs("itemUnidadePreco").textContent = "Unidade";

  abrirModal("modalItemCompra");
}

function atualizarMarcasItemCompra() {
  const selectProduto = qs("itemProdutoBase");
  const selectMarca = qs("itemMarca");
  const selectComplemento = qs("itemProduto");

  if (!selectProduto || !selectMarca || !selectComplemento) {
    return;
  }

  const produtoBaseId = selectProduto.value;

  selectMarca.innerHTML =
    '<option value="">Selecione...</option>';

  selectComplemento.innerHTML =
    '<option value="">Selecione...</option>';

  if (!produtoBaseId) {
    return;
  }

  const itens = produtos.filter(
    produto =>
      Number(produto.produtoBaseId) ===
      Number(produtoBaseId)
  );

  const marcas = [];

  itens.forEach(item => {
    const marca = String(item.marca || "").trim();

    if (!marcas.includes(marca)) {
      marcas.push(marca);
    }
  });

  marcas.sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  selectMarca.innerHTML =
    '<option value="">Selecione...</option>' +
    marcas
      .map(marca => {
        const valor =
          marca === ""
            ? "__SEM_MARCA__"
            : marca;

        return `
          <option value="${escapeHTML(valor)}">
            ${escapeHTML(marca || "Sem marca")}
          </option>
        `;
      })
      .join("");
}

function atualizarComplementosItemCompra() {
  const selectProduto = qs("itemProdutoBase");
  const selectMarca = qs("itemMarca");
  const selectComplemento = qs("itemProduto");

  if (!selectProduto || !selectMarca || !selectComplemento) {
    return;
  }

  const produtoBaseId = selectProduto.value;
  const valorMarca = selectMarca.value;

  selectComplemento.innerHTML =
    '<option value="">Selecione...</option>';

  if (!produtoBaseId || !valorMarca) {
    return;
  }

  const marcaSelecionada =
    valorMarca === "__SEM_MARCA__"
      ? ""
      : valorMarca;

  const itens = produtos.filter(produto => {
    const mesmaBase =
      Number(produto.produtoBaseId) ===
      Number(produtoBaseId);

    const mesmaMarca =
      String(produto.marca || "").trim() ===
      String(marcaSelecionada).trim();

    return mesmaBase && mesmaMarca;
  });

  if (!itens.length) {
    selectComplemento.innerHTML =
      '<option value="">Nenhum complemento disponível</option>';

    return;
  }

  /*
   * Agrupa os produtos pelo complemento.
   *
   * Produtos sem complemento usam uma chave
   * especial apenas para a interface.
   */
  const complementos = new Map();

  itens.forEach(item => {
    const complemento =
      String(item.complemento || "").trim();

    const chave =
      complemento === ""
        ? "__SEM_COMPLEMENTO__"
        : complemento;

    if (!complementos.has(chave)) {
      complementos.set(chave, item);
    }
  });

  const opcoes = [...complementos.entries()]
    .sort(([chaveA], [chaveB]) => {
      const nomeA =
        chaveA === "__SEM_COMPLEMENTO__"
          ? "Sem complemento"
          : chaveA;

      const nomeB =
        chaveB === "__SEM_COMPLEMENTO__"
          ? "Sem complemento"
          : chaveB;

      return nomeA.localeCompare(nomeB, "pt-BR");
    });

  selectComplemento.innerHTML =
    '<option value="">Selecione...</option>' +
    opcoes
      .map(([chave, item]) => {
        const nome =
          chave === "__SEM_COMPLEMENTO__"
            ? "Sem complemento"
            : chave;

        return `
          <option value="${item.id}">
            ${escapeHTML(nome)}
          </option>
        `;
      })
      .join("");
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

