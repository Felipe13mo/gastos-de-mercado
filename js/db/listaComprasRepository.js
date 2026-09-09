const listaComprasRepository = {

  async listar() {
    return await db.listaCompras.listar();
  },

  async buscarPorId(id) {
    return await db.listaCompras.buscarPorId(id);
  },

  async criar(item) {
    return await db.listaCompras.criar(item);
  },

  async atualizar(item) {
    return await db.listaCompras.atualizar(item);
  },

  async excluir(id) {
    return await db.listaCompras.excluir(id);
  }

};