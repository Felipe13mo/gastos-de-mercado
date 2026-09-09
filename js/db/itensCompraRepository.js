const itensCompraRepository = {
  async listar() {
    return db.itensCompra.listar();
  },

  async buscarPorId(id) {
    return db.itensCompra.buscarPorId(id);
  },

  async criar(item) {
    return db.itensCompra.criar(item);
  },

  async atualizar(item) {
    return db.itensCompra.atualizar(item);
  },

  async excluir(id) {
    return db.itensCompra.excluir(id);
  },

  async excluirPorCompraId(compraId) {
    const itens = await this.listar();

    const itensDaCompra = itens.filter(
      item => Number(item.compraId) === Number(compraId)
    );

    await Promise.all(
      itensDaCompra.map(item => this.excluir(item.id))
    );
  }

};