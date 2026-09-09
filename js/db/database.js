const DB_CONFIG = {
  nome: "GastosDeMercado",
  versao: 1,

  stores: {
    produtos: "produtos",
    produtosBase: "produtosBase",
    estabelecimentos: "estabelecimentos",
    compras: "compras",
    itensCompra: "itensCompra",
    listaCompras: "listaCompras"
  }
};

let bancoDB = null;


/*
 * Abre o banco
 */
function abrirBanco() {
  return new Promise((resolve, reject) => {

    if (bancoDB) {
      resolve(bancoDB);
      return;
    }

    const request = indexedDB.open(
      DB_CONFIG.nome,
      DB_CONFIG.versao
    );

    request.onupgradeneeded = event => {

      const db = event.target.result;

      Object.values(DB_CONFIG.stores).forEach(nomeStore => {

        if (!db.objectStoreNames.contains(nomeStore)) {

          db.createObjectStore(nomeStore, {
            keyPath: "id"
          });

        }

      });

    };

    request.onsuccess = event => {

      bancoDB = event.target.result;

      bancoDB.onclose = () => {
        bancoDB = null;
      };

      resolve(bancoDB);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


/*
 * Cria um registro
 */
async function criarRegistro(storeName, dados) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readwrite"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.add(dados);

    request.onsuccess = () => {
      resolve(dados);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


/*
 * Busca um registro pelo ID
 */
async function buscarRegistro(storeName, id) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readonly"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


/*
 * Lista todos os registros
 */
async function listarRegistros(storeName) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readonly"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


/*
 * Atualiza um registro
 */
async function atualizarRegistro(storeName, dados) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readwrite"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.put(dados);

    request.onsuccess = () => {
      resolve(dados);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}


/*
 * Exclui um registro
 */
async function excluirRegistro(storeName, id) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readwrite"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}

async function limparStore(storeName) {

  const db = await abrirBanco();

  return new Promise((resolve, reject) => {

    const transaction = db.transaction(
      storeName,
      "readwrite"
    );

    const store = transaction.objectStore(
      storeName
    );

    const request = store.clear();

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error);
    };

  });
}

async function restaurarDadosAtomico(dados) {
  const nomesStores = [
    DB_CONFIG.stores.produtosBase,
    DB_CONFIG.stores.produtos,
    DB_CONFIG.stores.estabelecimentos,
    DB_CONFIG.stores.compras,
    DB_CONFIG.stores.itensCompra,
    DB_CONFIG.stores.listaCompras
  ];

  return new Promise((resolve, reject) => {
    const transacao = bancoDB.transaction(
      nomesStores,
      "readwrite"
    );

    transacao.oncomplete = () => {
      resolve();
    };

    transacao.onerror = () => {
      reject(transacao.error || new Error("Erro ao restaurar os dados."));
    };

    transacao.onabort = () => {
      reject(transacao.error || new Error("Restauração cancelada."));
    };

    nomesStores.forEach(nomeStore => {
      const store = transacao.objectStore(nomeStore);

      store.clear();
    });

    dados.produtosBase.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.produtosBase)
        .add(registro);
    });

    dados.produtos.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.produtos)
        .add(registro);
    });

    dados.estabelecimentos.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.estabelecimentos)
        .add(registro);
    });

    dados.compras.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.compras)
        .add(registro);
    });

    dados.itensCompra.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.itensCompra)
        .add(registro);
    });

    dados.listaCompras.forEach(registro => {
      transacao
        .objectStore(DB_CONFIG.stores.listaCompras)
        .add(registro);
    });
  });
}

/*
 * API pública da camada DB
 */
const db = {

  limpar: {

    produtos() {
      return limparStore(
        DB_CONFIG.stores.produtos
      );
    },

    produtosBase() {
      return limparStore(
        DB_CONFIG.stores.produtosBase
      );
    },

    estabelecimentos() {
      return limparStore(
        DB_CONFIG.stores.estabelecimentos
      );
    },

    compras() {
      return limparStore(
        DB_CONFIG.stores.compras
      );
    },

    itensCompra() {
      return limparStore(
        DB_CONFIG.stores.itensCompra
      );
    },

    listaCompras() {
      return limparStore(
        DB_CONFIG.stores.listaCompras
      );
    }

  },

  produtos: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.produtos
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.produtos,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.produtos,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.produtos,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.produtos,
        Number(id)
      );
    }

  },


  produtosBase: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.produtosBase
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.produtosBase,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.produtosBase,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.produtosBase,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.produtosBase,
        Number(id)
      );
    }

  },


  estabelecimentos: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.estabelecimentos
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.estabelecimentos,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.estabelecimentos,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.estabelecimentos,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.estabelecimentos,
        Number(id)
      );
    }

  },


  compras: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.compras
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.compras,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.compras,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.compras,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.compras,
        Number(id)
      );
    }

  },


  itensCompra: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.itensCompra
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.itensCompra,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.itensCompra,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.itensCompra,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.itensCompra,
        Number(id)
      );
    }

  },


  listaCompras: {

    listar() {
      return listarRegistros(
        DB_CONFIG.stores.listaCompras
      );
    },

    buscarPorId(id) {
      return buscarRegistro(
        DB_CONFIG.stores.listaCompras,
        Number(id)
      );
    },

    criar(dados) {
      return criarRegistro(
        DB_CONFIG.stores.listaCompras,
        dados
      );
    },

    atualizar(dados) {
      return atualizarRegistro(
        DB_CONFIG.stores.listaCompras,
        dados
      );
    },

    excluir(id) {
      return excluirRegistro(
        DB_CONFIG.stores.listaCompras,
        Number(id)
      );
    }

  }

};