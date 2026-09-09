const estabelecimentosRepository = {
  async listar() {
    return db.estabelecimentos.listar();
  },

  async buscarPorId(id) {
    return db.estabelecimentos.buscarPorId(id);
  },

  async criar(estabelecimento) {
    return db.estabelecimentos.criar(estabelecimento);
  },

  async atualizar(estabelecimento) {
    return db.estabelecimentos.atualizar(estabelecimento);
  },

  async excluir(id) {
    return db.estabelecimentos.excluir(id);
  }
};