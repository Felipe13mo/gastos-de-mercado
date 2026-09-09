function atualizarSelectProdutosPreco() {
  const select = qs("filtroProdutoPreco");

  if (!select) return;

  const valorAtual = select.value;

  select.innerHTML =
    '<option value="">Todos</option>' +
    produtosBase
      .slice()
      .sort((a, b) =>
        String(a.nome || "").localeCompare(
          String(b.nome || ""),
          "pt-BR"
        )
      )
      .map(p => `
        <option value="${p.id}">
          ${escapeHTML(p.nome)}
        </option>
      `)
      .join("");

  /*
   * Mantém a seleção anterior caso
   * o Produto ainda exista.
   */
  if (
    produtosBase.some(
      p => String(p.id) === String(valorAtual)
    )
  ) {
    select.value = valorAtual;
  }
}

function prepararPrecos() {
  atualizarSelectProdutosPreco();

  produtoPrecoSelecionadoId = null;

  qs("pesquisaProduto").value = "";

  qs("filtroProdutoPreco").value = "";

  mostrarContainerPesquisaPrecos();

  qs("listaProdutosPrecos").innerHTML = "";

  qs("historicoPrecos").innerHTML = "";
}

function pesquisarPrecos() {
  produtoPrecoSelecionadoId = null;

  const q = qs("pesquisaProduto")
    .value
    .trim()
    .toLocaleLowerCase("pt-BR");

  const produtoBaseSelecionado =
    qs("filtroProdutoPreco").value;

  const produtoBaseId =
    produtoBaseSelecionado
      ? Number(produtoBaseSelecionado)
      : null;

  const encontrados = produtos
    .filter(p => {

      /*
       * Localiza o Produto base relacionado
       * ao cadastro específico.
       */
      const produtoBase = produtosBase.find(
        base =>
          Number(base.id) ===
          Number(p.produtoBaseId)
      );

      if (!produtoBase) {
        return false;
      }

      /*
       * Filtro pelo Produto base
       */
      const correspondeProduto =
        produtoBaseId === null ||
        Number(produtoBase.id) === produtoBaseId;

      if (!correspondeProduto) {
        return false;
      }

      /*
       * Sem texto:
       * todos os cadastros que passaram
       * pelo filtro de Produto.
       */
      if (!q) {
        return true;
      }

      /*
       * Pesquisa por:
       * Produto
       * Marca
       * Complemento
       * EAN
       */
      const campos = [
        produtoBase.nome,
        p.marca,
        p.complemento,
        p.ean
      ];

      return campos.some(valor =>
        String(valor || "")
          .toLocaleLowerCase("pt-BR")
          .includes(q)
      );
    })
    .sort((a, b) => {

      const produtoA = produtosBase.find(
        base =>
          Number(base.id) ===
          Number(a.produtoBaseId)
      );

      const produtoB = produtosBase.find(
        base =>
          Number(base.id) ===
          Number(b.produtoBaseId)
      );

      return String(
        produtoA?.nome || ""
      ).localeCompare(
        String(produtoB?.nome || ""),
        "pt-BR"
      );
    });

  mostrarContainerPesquisaPrecos();

  if (!encontrados.length) {
    qs("listaProdutosPrecos").innerHTML =
      '<div class="vazio">Nenhum produto encontrado.</div>';

    qs("historicoPrecos").innerHTML = "";
    return;
  }

  qs("listaProdutosPrecos").innerHTML =
    '<div class="subtitulo-lista">Produtos encontrados</div>' +
    encontrados.map(p => {

      const produtoBase = produtosBase.find(
        base =>
          Number(base.id) ===
          Number(p.produtoBaseId)
      );

      const identificacao = [
        p.marca,
        p.complemento
      ]
        .filter(Boolean)
        .join(" • ");

      const detalhes = [
        identificacao,
        produtoBase?.categoria,
        p.unidadePreco
      ]
        .filter(Boolean)
        .join(" • ");

      return `
        <button
          type="button"
          class="produto-pesquisa"
          data-acao="selecionar-preco"
          data-id="${p.id}"
        >
          <span>
            <strong>
              ${escapeHTML(
                produtoBase?.nome ||
                "Produto sem nome"
              )}
            </strong>

            <small>
              ${escapeHTML(
                detalhes ||
                "Sem informações adicionais"
              )}
            </small>
          </span>

          <span class="seta">›</span>
        </button>
      `;
    }).join("");

  qs("historicoPrecos").innerHTML = "";
}

function selecionarProdutoPreco(id) {

  const produto = produtos.find(
    p => Number(p.id) === Number(id)
  );

  if (!produto) return;

  const produtoBase = produtosBase.find(
    base =>
      Number(base.id) ===
      Number(produto.produtoBaseId)
  );

  if (!produtoBase) return;

  produtoPrecoSelecionadoId =
    Number(produto.id);

  qs("containerPesquisaPrecos").style.display =
    "none";

  qs("listaProdutosPrecos").innerHTML = "";

  qs("historicoPrecos").innerHTML = "";

  renderHistoricoPrecos();
}

function mostrarContainerPesquisaPrecos() {
  qs("containerPesquisaPrecos").style.display = "block";
}

function voltarParaPesquisaPrecos() {
  produtoPrecoSelecionadoId = null;

  qs("historicoPrecos").innerHTML = "";

  mostrarContainerPesquisaPrecos();

  // Ao voltar, não mostra resultados automaticamente.
  // O usuário precisa clicar novamente em Pesquisar.
  qs("listaProdutosPrecos").innerHTML = "";
}

function renderHistoricoPrecos() {

  const h = qs("historicoPrecos");

  const p = produtos.find(
    produto =>
      Number(produto.id) ===
      Number(produtoPrecoSelecionadoId)
  );

  if (!p) {
    h.innerHTML = `
      <div class="vazio">
        Produto não encontrado.
      </div>
    `;
    return;
  }

  const produtoBase = produtosBase.find(
    base =>
      Number(base.id) ===
      Number(p.produtoBaseId)
  );

  if (!produtoBase) {
    h.innerHTML = `
      <div class="vazio">
        Produto base não encontrado.
      </div>
    `;
    return;
  };

  const registros = itensCompra
    .map(i => {
      const c = compras.find(
        x => Number(x.id) === Number(i.compraId)
      );

      if (
        !c ||
        Number(i.produtoId) !== Number(p.id)
      ) {
        return null;
      }

      return {
        i,
        c,
        e: estabelecimentos.find(
          x => Number(x.id) === Number(c.estabelecimentoId)
        )
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(b.c.data).localeCompare(String(a.c.data))
    );

  h.innerHTML = `
    <div class="historico-cabecalho">

      <button
        type="button"
        class="botao-voltar"
        data-acao="voltar-precos"
      >
        ← Voltar para pesquisa
      </button>

      <h2>
        ${escapeHTML(produtoBase.nome)}
      </h2>

      <small>
        ${
          [
            p.marca,
            p.complemento,
            produtoBase.categoria,
            p.unidadePreco
          ]
            .filter(Boolean)
            .map(escapeHTML)
            .join(" • ")
        }
      </small>

      <small>
         • EAN: ${escapeHTML(p.ean || "Não informado")}
      </small>

    </div>

    <h3>Histórico de preços</h3>

    ${
      registros.length
        ? registros.map(r => `
          <div class="card-historico-preco">

            <strong>
              ${dataBR(r.c.data)}
            </strong>

            <span class="local-historico">
              ${escapeHTML(
                r.e?.nome || "Estabelecimento removido"
              )}
              ${
                r.e?.cidade
                  ? " • " + escapeHTML(r.e.cidade)
                  : ""
              }
            </span>

            <strong class="preco-unitario">
              ${moeda(r.i.valorUnitario)}
              / ${escapeHTML(p.unidadePreco || "Unidade")}
            </strong>

            <span class="resumo-lancamento">
              ${quantidade(r.i.quantidade)}
              ${escapeHTML(p.unidadePreco || "Unidade")}
              • Total
              ${moeda(
                Number(r.i.quantidade) *
                Number(r.i.valorUnitario)
              )}
            </span>

          </div>
        `).join("")
        : `
          <div class="vazio">
            Nenhum preço registrado para este produto.
          </div>
        `
    }
  `;
}

function renderHistoricoComprasLista() {

  const area = qs("conteudoHistoricoComprasLista");
  const container = qs("carregarMaisHistoricoComprasContainer");

  if (!area || !container) return;

  const registros = obterHistoricoComprasProdutoBase(
    produtoBaseHistoricoComprasId
  );

  if (!registros.length) {

    area.innerHTML = `
      <div class="vazio">
        Nenhuma compra registrada para este produto.
      </div>
    `;

    container.innerHTML = "";

    return;
  }

  const registrosExibidos = registros.slice(
    0,
    quantidadeHistoricoComprasExibidos
  );

  area.innerHTML = `
    <h3 class="titulo-historico-compras">
      Histórico de compras
    </h3>

    ${registrosExibidos.map(r => {

      const descricaoProduto = [
        r.produto?.marca,
        r.produto?.complemento
      ]
        .filter(Boolean)
        .join(" • ");

      return `
        <div class="card-historico-compra">

          <strong class="data-historico-compra">
            ${dataBR(r.compra.data)}
          </strong>

          <span class="local-historico">
            ${escapeHTML(
              r.estabelecimento?.nome ||
              "Estabelecimento removido"
            )}
            ${
              r.estabelecimento?.cidade
                ? " • " +
                  escapeHTML(r.estabelecimento.cidade)
                : ""
            }
          </span>

          ${
            descricaoProduto
              ? `
                <span class="descricao-historico-compra">
                  ${escapeHTML(descricaoProduto)}
                </span>
              `
              : ""
          }

          <strong class="preco-historico-compra">
            ${moeda(r.item.valorUnitario)}
            / ${escapeHTML(
              r.produto?.unidadePreco || "Unidade"
            )}
          </strong>

          <span class="resumo-historico-compra">
            ${quantidade(r.item.quantidade)}
            ${escapeHTML(
              r.produto?.unidadePreco || "Unidade"
            )}
            • Total
            ${moeda(
              Number(r.item.quantidade) *
              Number(r.item.valorUnitario)
            )}
          </span>

        </div>
      `;

    }).join("")}
  `;

  if (
    quantidadeHistoricoComprasExibidos <
    registros.length
  ) {

    container.innerHTML = `
      <button
        type="button"
        id="btnCarregarMaisHistoricoCompras"
        data-acao="carregar-mais-historico-compras"
      >
        Carregar mais
      </button>
    `;

  } else {

    container.innerHTML = "";
  }
}

function carregarMaisHistoricoCompras() {

  quantidadeHistoricoComprasExibidos +=
    LIMITE_HISTORICO_COMPRAS;

  renderHistoricoComprasLista();
}

function obterHistoricoComprasProdutoBase(produtoBaseId) {

  const idsProdutos = produtos
    .filter(p =>
      Number(p.produtoBaseId) === Number(produtoBaseId)
    )
    .map(p => Number(p.id));

  return itensCompra
    .map(item => {

      if (!idsProdutos.includes(Number(item.produtoId))) {
        return null;
      }

      const compra = compras.find(
        c => Number(c.id) === Number(item.compraId)
      );

      if (!compra) {
        return null;
      }

      const produto = produtos.find(
        p => Number(p.id) === Number(item.produtoId)
      );

      const estabelecimento = estabelecimentos.find(
        e =>
          Number(e.id) ===
          Number(compra.estabelecimentoId)
      );

      return {
        item,
        compra,
        produto,
        estabelecimento
      };

    })
    .filter(Boolean)
    .sort((a, b) => {

      const dataA = String(a.compra.data || "");
      const dataB = String(b.compra.data || "");

      const comparacaoData =
        dataB.localeCompare(dataA);

      if (comparacaoData !== 0) {
        return comparacaoData;
      }

      return (
        Number(b.item.id) -
        Number(a.item.id)
      );

    });
}

