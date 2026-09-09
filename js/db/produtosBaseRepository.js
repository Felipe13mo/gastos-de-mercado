const produtosBaseRepository = {

  async listar() {
    return db.produtosBase.listar();
  },

  async buscarPorId(id) {
    return db.produtosBase.buscarPorId(id);
  },

  async criar(produtoBase) {
    return db.produtosBase.criar(produtoBase);
  },

  async atualizar(produtoBase) {
    return db.produtosBase.atualizar(produtoBase);
  },

  async excluir(id) {
    return db.produtosBase.excluir(id);
  }

};