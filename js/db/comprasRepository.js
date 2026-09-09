const comprasRepository = {
  async listar() {
    return db.compras.listar();
  },

  async buscarPorId(id) {
    return db.compras.buscarPorId(id);
  },

  async criar(compra) {
    return db.compras.criar(compra);
  },

  async atualizar(compra) {
    return db.compras.atualizar(compra);
  },

  async excluir(id) {
    return db.compras.excluir(id);
  }
};
