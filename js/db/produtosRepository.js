const produtosRepository = {

  async listar() {
    return db.produtos.listar();
  },

  async buscarPorId(id) {
    return db.produtos.buscarPorId(id);
  },

  async criar(produto) {
    return db.produtos.criar(produto);
  },

  async atualizar(produto) {
    return db.produtos.atualizar(produto);
  },

  async excluir(id) {
    return db.produtos.excluir(id);
  }

};