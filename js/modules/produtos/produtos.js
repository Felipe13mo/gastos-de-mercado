function renderProdutos() {
  const lista = qs("listaProdutos");
  const resumo = qs("resumoProdutos");
  const carregarMais = qs("carregarMaisProdutosContainer");

  /*
   * Nenhum cadastro específico de produto
   */
  if (!produtos.length) {
    resumo.innerHTML = "";
    lista.innerHTML =
      '<div class="vazio">Nenhum produto cadastrado.</div>';

    carregarMais.innerHTML = "";
    return;
  }

  /*
   * A tela não exibe produtos automaticamente.
   * O usuário precisa realizar uma pesquisa.
   */
  if (!produtosFiltrados.length) {
    resumo.innerHTML = "";

    lista.innerHTML = `
      <div class="mensagem-pesquisa-produtos">
        <strong>Pesquise seus produtos</strong>
        <small>
          Digite o nome ou EAN e clique em Pesquisar.
        </small>
      </div>
    `;

    carregarMais.innerHTML = "";
    return;
  }

  const exibidos = produtosFiltrados.slice(
    0,
    quantidadeProdutosExibidos
  );

  resumo.innerHTML = `
    <div class="resumo-lista-produtos">
      ${produtosFiltrados.length}
      ${
        produtosFiltrados.length === 1
          ? "resultado encontrado"
          : "resultados encontrados"
      }
    </div>
  `;

  lista.innerHTML = exibidos.map(p => {

    const produtoBase = produtosBase.find(
      base => Number(base.id) === Number(p.produtoBaseId)
    );

    const nomeProduto =
      produtoBase?.nome || "Produto não encontrado";

    const categoria =
      produtoBase?.categoria || "Sem categoria";

    const identificacao = [
      p.marca
    ]
      .filter(Boolean)
      .join(" • ");

    return `
      <div
        class="lista-item produto-item"
        data-acao="editar-produto"
        data-id="${p.id}"
      >

        <div class="produto-info">

          <strong>
            ${escapeHTML(nomeProduto)}
          </strong>

          ${
            identificacao
              ? `
                <small>
                  ${escapeHTML(identificacao)}
                </small>
              `
              : ""
          }

          ${
            p.complemento
              ? `
                <small>
                  ${escapeHTML(p.complemento)}
                </small>
              `
              : ""
          }

        </div>

        <button
          type="button"
          class="botao-acao"
          data-acao="ultimas-compras-produto"
          data-id="${p.id}"
          aria-label="Últimas compras do produto"
        >
          <span class="icone-acao" aria-hidden="true">🛒</span>
          <span class="texto-acao">Últimas compras</span>
        </button>

        <button
          type="button"
          class="botao-acao excluir"
          data-acao="excluir-produto"
          data-id="${p.id}"
          aria-label="Excluir produto"
        >
          <span class="icone-acao" aria-hidden="true">🗑️</span>
          <span class="texto-acao">Excluir</span>
        </button>

      </div>
    `;
  }).join("");

  /*
   * Mostra Carregar mais somente quando
   * ainda existem resultados não exibidos.
   */
  if (
    quantidadeProdutosExibidos <
    produtosFiltrados.length
  ) {
    carregarMais.innerHTML = `
      <button
        type="button"
        class="btn-carregar-mais"
        id="btnCarregarMaisProdutos"
      >
        Carregar mais
      </button>
    `;
  } else {
    carregarMais.innerHTML = "";
  }
}

function renderProdutosBase() {
  const lista = qs("listaProdutosBase");

  if (!lista) return;

  if (!produtosBaseFiltrados.length) {
    lista.innerHTML =
      '<div class="vazio">Nenhum produto base encontrado.</div>';
    return;
  }

  lista.innerHTML = produtosBaseFiltrados.map(produto => `
    <div
      class="lista-item produto-item"
      data-acao="editar-produto-base"
      data-id="${produto.id}"
      tabindex="0"
      role="button"
    >

      <div class="produto-info">

        <strong>
          ${escapeHTML(produto.nome || "Produto sem nome")}
        </strong>

        <small>
          ${escapeHTML(produto.categoria || "Sem categoria")}
        </small>

      </div>

      <span
        class="chevron-configuracao"
        aria-hidden="true"
      >
        ›
      </span>

    </div>
  `).join("");
}

function pesquisarProdutosBase() {
  const pesquisa = qs("pesquisaProdutosBase")
    .value
    .trim()
    .toLowerCase();

  const categoria = qs("filtroCategoriaProdutosBase")
    .value
    .trim()
    .toLowerCase();

  produtosBaseFiltrados = produtosBase.filter(produto => {

    const nome = String(produto.nome || "")
      .toLowerCase();

    const categoriaProduto = String(produto.categoria || "")
      .toLowerCase();

    const correspondeNome =
      !pesquisa ||
      nome.includes(pesquisa);

    const correspondeCategoria =
      !categoria ||
      categoriaProduto === categoria;

    return correspondeNome && correspondeCategoria;
  });

  renderProdutosBase();
}

function atualizarCategoriasProdutosBase() {
  const select = qs("filtroCategoriaProdutosBase");

  if (!select) return;

  const categorias = [
    ...new Set(
      produtosBase
        .map(produto => String(produto.categoria || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  select.innerHTML = `
    <option value="">Todas as categorias</option>

    ${categorias.map(categoria => `
      <option value="${escapeHTML(categoria)}">
        ${escapeHTML(categoria)}
      </option>
    `).join("")}
  `;
}

function pesquisarProdutos() {
  const termo = qs("pesquisaProdutos")
    .value
    .trim()
    .toLocaleLowerCase("pt-BR");

  const categoria = qs(
    "filtroCategoriaProdutos"
  ).value;

  produtosFiltrados = produtos
    .filter(p => {

      const produtoBase = produtosBase.find(
        base =>
          Number(base.id) ===
          Number(p.produtoBaseId)
      );

      if (!produtoBase) {
        return false;
      }

      const nome = String(
        produtoBase.nome || ""
      ).toLocaleLowerCase("pt-BR");

      const ean = String(
        p.ean || ""
      ).toLocaleLowerCase("pt-BR");

      const correspondeTexto =
        !termo ||
        nome.includes(termo) ||
        ean.includes(termo);

      const correspondeCategoria =
        !categoria ||
        produtoBase.categoria === categoria;

      return (
        correspondeTexto &&
        correspondeCategoria
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

  quantidadeProdutosExibidos =
    LIMITE_PRODUTOS;

  renderProdutos();
}

function selecionarProdutoCadastrado(produto) {
  produtosFiltrados = produtos.filter(
    p => Number(p.id) === Number(produto.id)
  );

  quantidadeProdutosExibidos = LIMITE_PRODUTOS;
}

function abrirNovoProduto() {
  produtoEditandoId = null;

  qs("formProduto").reset();

  atualizarSelectProdutosBase();

  qs("tituloModalProduto").textContent =
    "Cadastrar produto";

  const botaoSalvar =
    qs("formProduto").querySelector(
      'button[type="submit"]'
    );

  if (botaoSalvar) {
    botaoSalvar.textContent = "Salvar produto";
  }

  abrirModal("modalProduto");
}

function atualizarSelectProdutosBase() {
  const select = qs("produtoBase");

  const valorAtual = select.value;

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
      .map(p => `
        <option value="${p.id}">
          ${escapeHTML(p.nome)}
        </option>
      `)
      .join("");

  if (
    produtosBase.some(
      p => Number(p.id) === Number(valorAtual)
    )
  ) {
    select.value = valorAtual;
  }
}

function abrirNovoProdutoBase() {
  produtoBaseEditandoId = null;
  qs("formProdutoBase").reset();

  produtoBaseAbertoAPartirDoProduto =
    qs("modalProduto").classList.contains("aberto");

  abrirModal("modalProdutoBase");
}

async function salvarProdutoBase(e) {

  e.preventDefault();

  const nome = qs("produtoBaseNome")
    .value
    .trim();

  const categoria = qs("produtoBaseCategoria")
    .value;

  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  if (!categoria) {
    alert("Selecione uma categoria.");
    return;
  }

  /*
   * Verifica duplicidade.
   *
   * Durante a edição, o próprio produto
   * que está sendo editado é ignorado.
   */
  const existente = produtosBase.find(
    p =>
      Number(p.id) !== Number(produtoBaseEditandoId) &&
      String(p.nome || "")
        .trim()
        .toLocaleLowerCase("pt-BR") ===
      nome.toLocaleLowerCase("pt-BR")
  );

  if (existente) {
    alert("Esse produto já está cadastrado.");
    return;
  }

  try {

    /*
     * MODO EDIÇÃO
     */
    if (produtoBaseEditandoId !== null) {

      const indice = produtosBase.findIndex(
        p =>
          Number(p.id) ===
          Number(produtoBaseEditandoId)
      );

      if (indice === -1) {
        alert("Produto base não encontrado.");
        return;
      }

      const produtoAtualizado = {
        ...produtosBase[indice],
        nome: nome,
        categoria: categoria
      };

      await produtosBaseRepository.atualizar(
        produtoAtualizado
      );

      produtosBase[indice] = produtoAtualizado;

    } else {

      /*
       * MODO NOVO CADASTRO
       */
      const novoProdutoBase = {
        id: Date.now(),
        nome: nome,
        categoria: categoria
      };

      await produtosBaseRepository.criar(
        novoProdutoBase
      );

      produtosBase.push(novoProdutoBase);
    }

    produtoBaseEditandoId = null;
    qs("formProdutoBase").reset();

    atualizarSelectProdutosBase();
    atualizarCategoriasProdutosBase();
    produtosBaseFiltrados = [...produtosBase];
    renderProdutosBase();

    qs("modalProdutoBase").classList.remove("aberto");

    if (produtoBaseAbertoAPartirDoProduto) {
      const novoProdutoBase = produtosBase[produtosBase.length - 1];

      if (novoProdutoBase) {
        qs("produtoBase").value = String(novoProdutoBase.id);
      }

      produtoBaseAbertoAPartirDoProduto = false;
    }

  } catch (erro) {

    console.error(
      "Erro ao salvar Produto Base:",
      erro
    );

    alert(
      "Não foi possível salvar o produto."
    );
  }
}

function editarProdutoBase(id) {

  const produto = produtosBase.find(
    p => Number(p.id) === Number(id)
  );

  if (!produto) return;

  produtoBaseEditandoId = Number(produto.id);

  qs("produtoBaseNome").value =
    produto.nome || "";

  qs("produtoBaseCategoria").value =
    produto.categoria || "";

  abrirModal("modalProdutoBase");
}


async function salvarProduto(e) {
  e.preventDefault();

  const produtoBaseId = Number(
    qs("produtoBase").value
  );

  const marca = qs("produtoMarca")
    .value
    .trim();

  const complemento = qs("produtoComplemento")
    .value
    .trim();

  const ean = qs("produtoEAN")
    .value
    .trim();

  const unidadePreco =
    qs("produtoUnidadePreco").value;

  const produtoBase = produtosBase.find(
    p => Number(p.id) === produtoBaseId
  );

  if (!produtoBase) {
    alert("Selecione um produto.");
    return;
  }

  if (!unidadePreco) {
    alert("Selecione a unidade de preço.");
    return;
  }

  const produtoDuplicado = produtos.some(produto => {

    const mesmaBase =
      Number(produto.produtoBaseId) ===
      Number(produtoBaseId);

    const mesmaMarca =
      String(produto.marca || "").trim() ===
      marca;

    const mesmoComplemento =
      String(produto.complemento || "").trim() ===
      complemento;

    const ehOutroProduto =
      produtoEditandoId === null ||
      Number(produto.id) !==
      Number(produtoEditandoId);

    return (
      mesmaBase &&
      mesmaMarca &&
      mesmoComplemento &&
      ehOutroProduto
    );
  });

  if (produtoDuplicado) {
    alert(
      "Já existe um Produto com este Produto Base, Marca e Complemento."
    );
    return;
  }

  /*
   * MODO EDIÇÃO
   */
  if (produtoEditandoId !== null) {

    const indice = produtos.findIndex(
      p =>
        Number(p.id) ===
        Number(produtoEditandoId)
    );

    if (indice === -1) {
      alert("Cadastro de produto não encontrado.");
      return;
    }

    const produtoAtualizado = {
      ...produtos[indice],
      produtoBaseId: produtoBaseId,
      marca: marca,
      complemento: complemento,
      ean: ean,
      unidadePreco: unidadePreco
    };

    await produtosRepository.atualizar(
      produtoAtualizado
    );

    produtos[indice] = produtoAtualizado;

    produtoEditandoId = null;

    fecharModais();

    pesquisarProdutos();

    e.target.reset();

    return;

  } else {

    /*
     * MODO NOVO CADASTRO
     */
    const novoProduto = {
      id: Date.now(),
      produtoBaseId: produtoBaseId,
      marca: marca,
      complemento: complemento,
      ean: ean,
      unidadePreco: unidadePreco
    };

    await produtosRepository.criar(novoProduto);
    produtos.push(novoProduto);
    selecionarProdutoCadastrado(novoProduto);
    
  }

  produtoEditandoId = null;

  fecharModais();

  atualizarTudo();

  e.target.reset();
}

function editarCadastroProduto(id) {
  const produto = produtos.find(
    p => Number(p.id) === Number(id)
  );

  if (!produto) return;

  produtoEditandoId = Number(produto.id);

  qs("tituloModalProduto").textContent =
    "Editar produto";

  atualizarSelectProdutosBase();

  qs("produtoBase").value =
    String(produto.produtoBaseId || "");

  qs("produtoMarca").value =
    produto.marca || "";

  qs("produtoComplemento").value =
    produto.complemento || "";

  qs("produtoEAN").value =
    produto.ean || "";

  qs("produtoUnidadePreco").value =
    produto.unidadePreco || "";

  const botaoSalvar =
    qs("formProduto").querySelector(
      'button[type="submit"]'
    );

  if (botaoSalvar) {
    botaoSalvar.textContent =
      "Salvar alterações";
  }

  abrirModal("modalProduto");
}

async function excluirCadastroProduto(id) {
  const produto = produtos.find(
    p => Number(p.id) === Number(id)
  );

  if (!produto) return;

  const produtoBase = produtosBase.find(
    p => Number(p.id) === Number(produto.produtoBaseId)
  );

  const nomeProduto =
    produtoBase?.nome || "produto";

  const identificacao = [
    produto.marca,
    produto.complemento
  ]
    .filter(Boolean)
    .join(" • ");

  const descricao = identificacao
    ? `${nomeProduto} — ${identificacao}`
    : nomeProduto;

  const confirmar = confirm(
    `Excluir o cadastro específico de "${descricao}"?`
  );

  if (!confirmar) return;

  try {
    await produtosRepository.excluir(id);

    produtos = produtos.filter(
      p => Number(p.id) !== Number(id)
    );

    produtosFiltrados = produtosFiltrados.filter(
      p => Number(p.id) !== Number(id)
    );

    atualizarTudo();
  } catch (erro) {
    console.error("Erro ao excluir Produto:", erro);
    alert("Não foi possível excluir o produto.");
  }
}

function carregarMaisProdutos() {
  quantidadeProdutosExibidos += LIMITE_PRODUTOS;

  renderProdutos();
}

function atualizarCategoriasProdutos() {
  const select = qs(
    "filtroCategoriaProdutos"
  );

  const categoriaAtual = select.value;

  const categorias = [
    ...new Set(
      produtosBase
        .map(p => p.categoria)
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  select.innerHTML = `
    <option value="">
      Todas as categorias
    </option>

    ${categorias.map(categoria => `
      <option value="${escapeHTML(categoria)}">
        ${escapeHTML(categoria)}
      </option>
    `).join("")}
  `;

  if (categorias.includes(categoriaAtual)) {
    select.value = categoriaAtual;
  }
}

async function carregarProdutosBase() {
  try {
    produtosBase = await produtosBaseRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Produtos Base:", erro);
    produtosBase = [];
    alert("Não foi possível carregar os produtos.");
  
  }
}

async function carregarProdutos() {
  try {
    produtos = await produtosRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Produtos:", erro);
    produtos = [];
    alert("Não foi possível carregar os produtos.");

  }
}

function mostrarListaProdutos() {
  qs("conteudoListaProdutos").style.display = "";
  qs("historicoComprasProduto").style.display = "none";

  qs("btnNovoProduto").style.display = "";
  qs("btnNovoProduto").closest(".titulo").style.display = "";
}

function mostrarHistoricoComprasProduto() {
  qs("conteudoListaProdutos").style.display = "none";
  qs("historicoComprasProduto").style.display = "";

  qs("btnNovoProduto").style.display = "none";
  qs("btnNovoProduto").closest(".titulo").style.display = "none";
}

function abrirUltimasComprasProduto(id) {
  const produto = produtos.find(
    p => Number(p.id) === Number(id)
  );

  if (!produto) return;

  produtoPrecoSelecionadoId = Number(produto.id);

  quantidadeHistoricoComprasExibidos =
    LIMITE_HISTORICO_COMPRAS;

  renderHistoricoComprasProduto();

  mostrarHistoricoComprasProduto();
}

function renderHistoricoComprasProduto() {

  const h = qs("historicoComprasProduto");

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
  }

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
          x =>
            Number(x.id) ===
            Number(c.estabelecimentoId)
        )
      };
    })
    .filter(Boolean)
    .sort((a, b) => {

      const dataA = String(a.c.data || "");
      const dataB = String(b.c.data || "");

      const comparacaoData =
        dataB.localeCompare(dataA);

      if (comparacaoData !== 0) {
        return comparacaoData;
      }

      return Number(b.c.id) - Number(a.c.id);
    });

  const exibidos = registros.slice(
    0,
    quantidadeHistoricoComprasExibidos
  );

  const gruposPorData = new Map();

  exibidos.forEach(registro => {

    const data = String(
      registro.c.data || ""
    );

    if (!gruposPorData.has(data)) {
      gruposPorData.set(data, []);
    }

    gruposPorData
      .get(data)
      .push(registro);
  });

  h.innerHTML = `

    <div class="historico-cabecalho">

      <button
        type="button"
        class="botao-voltar"
        data-acao="voltar-produtos"
      >
        ← Voltar para produtos
      </button>

      <h2>
        ${escapeHTML(produtoBase.nome)}
      </h2>

      ${
        [p.marca, p.complemento]
          .filter(Boolean)
          .map(escapeHTML)
          .join(" • ")
          ? `
            <small>
              ${[p.marca, p.complemento]
                .filter(Boolean)
                .map(escapeHTML)
                .join(" • ")}
            </small>
          `
          : ""
      }

      ${
        [p.unidadePreco, p.ean]
          .filter(Boolean)
          .map((valor, indice) =>
            indice === 1
              ? "EAN: " + escapeHTML(valor)
              : escapeHTML(valor)
          )
          .join(" • ")
          ? `
            <small>
              ${[p.unidadePreco, p.ean]
                .filter(Boolean)
                .map((valor, indice) =>
                  indice === 1
                    ? "EAN: " + escapeHTML(valor)
                    : escapeHTML(valor)
                )
                .join(" • ")}
            </small>
          `
          : ""
      }

      ${
        produtoBase.categoria
          ? `
            <small>
              ${escapeHTML(produtoBase.categoria)}
            </small>
          `
          : ""
      }

    </div>

    <h3>Histórico de compras</h3>

    ${
      gruposPorData.size
        ? [...gruposPorData.entries()]
            .map(([data, registrosDoDia]) => `

              <div class="grupo-historico-compras">

                <div class="data-historico-compras">
                  ${dataBR(data)}
                </div>

                <div class="lista-historico-compras">

                  ${registrosDoDia.map(r => `

                    <div class="card-historico-preco">

                      <span class="local-historico">
                        ${escapeHTML(
                          r.e?.nome ||
                          "Estabelecimento removido"
                        )}
                        ${
                          r.e?.cidade
                            ? " • " +
                              escapeHTML(r.e.cidade)
                            : ""
                        }
                      </span>

                      <strong class="preco-unitario">
                        ${moeda(r.i.valorUnitario)}
                        / ${escapeHTML(
                          p.unidadePreco || "Unidade"
                        )}
                      </strong>

                      <span class="resumo-lancamento">
                        ${quantidade(r.i.quantidade)}
                        ${escapeHTML(
                          p.unidadePreco || "Unidade"
                        )}
                        • Total
                        ${moeda(
                          Number(r.i.quantidade) *
                          Number(r.i.valorUnitario)
                        )}
                      </span>

                    </div>

                  `).join("")}

                </div>

              </div>

            `).join("")
        : `
          <div class="vazio">
            Nenhuma compra registrada para este produto.
          </div>
        `
    }

    ${
      quantidadeHistoricoComprasExibidos <
      registros.length
        ? `
          <div id="carregarMaisHistoricoComprasProdutoContainer">

            <button
              type="button"
              class="btn-carregar-mais"
              data-acao="carregar-mais-historico-compras-produto"
            >
              Carregar mais
            </button>

          </div>
        `
        : ""
    }

  `;
}
