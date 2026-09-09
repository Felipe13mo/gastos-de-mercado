async function carregarEstabelecimentos() {
  try {
    estabelecimentos = await estabelecimentosRepository.listar();

  } catch (erro) {
    console.error("Erro ao carregar Estabelecimentos:", erro);
    estabelecimentos = [];
    alert("Não foi possível carregar os estabelecimentos.");

  }
}

function renderEstabelecimentos() {
  const l = qs("listaEstabelecimentos");
  if (!estabelecimentos.length) { l.innerHTML = '<div class="vazio">Nenhum estabelecimento cadastrado.</div>'; return; }
  l.innerHTML = estabelecimentos.map(e => `
    <div class="lista-item">
      <div><strong>${escapeHTML(e.nome)}</strong><small>${escapeHTML(e.cidade || "Cidade não informada")} • ${escapeHTML(e.unidade || "Unidade não informada")}</small></div>
      <button
        type="button"
        class="botao-acao excluir"
        data-acao="excluir-estabelecimento"
        data-id="${e.id}"
        aria-label="Excluir estabelecimento"
      >
        <span class="icone-acao" aria-hidden="true">🗑️</span>
        <span class="texto-acao">Excluir</span>
      </button>
    </div>`).join("");
}

function abrirNovoEstabelecimento() {
  qs("formEstabelecimento").reset(); abrirModal("modalEstabelecimento");
}

async function salvarEstabelecimento(e) {
  e.preventDefault();

  const novoEstabelecimento = {
    id: Date.now(),
    nome: qs("estabelecimentoNome").value.trim(),
    cidade: qs("estabelecimentoCidade").value,
    unidade: qs("estabelecimentoUnidade").value.trim()
  };

  try {
    await estabelecimentosRepository.criar(novoEstabelecimento);

    estabelecimentos.push(novoEstabelecimento);

    fecharModais();
    atualizarTudo();
    e.target.reset();
  } catch (erro) {
    console.error("Erro ao salvar estabelecimento:", erro);
    alert("Não foi possível salvar o estabelecimento.");
  }
}

async function excluirEstabelecimento(id) {
  const estabelecimento = estabelecimentos.find(
    x => Number(x.id) === Number(id)
  );

  if (!estabelecimento) return;

  if (!confirm("Excluir este estabelecimento?")) return;

  try {
    await estabelecimentosRepository.excluir(id);

    estabelecimentos = estabelecimentos.filter(
      x => Number(x.id) !== Number(id)
    );

    atualizarTudo();
  } catch (erro) {
    console.error("Erro ao excluir estabelecimento:", erro);
    alert("Não foi possível excluir o estabelecimento.");
  }
}

