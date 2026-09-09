const CACHE_NAME = "gastos-de-mercado-v1";

const ARQUIVOS_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",

  "./css/style.css",

  "./js/app.js",

  "./js/db/database.js",
  "./js/db/produtosBaseRepository.js",
  "./js/db/produtosRepository.js",
  "./js/db/estabelecimentosRepository.js",
  "./js/db/comprasRepository.js",
  "./js/db/itensCompraRepository.js",
  "./js/db/listaComprasRepository.js",

  "./js/shared/utils.js",
  "./js/state/appState.js",

  "./js/modules/produtos/produtos.js",
  "./js/modules/estabelecimentos/estabelecimentos.js",
  "./js/modules/compras/compras.js",
  "./js/modules/listaCompras/listaCompras.js",
  "./js/modules/precos/precos.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARQUIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(nomesCaches => {
        return Promise.all(
          nomesCaches
            .filter(nome => nome !== CACHE_NAME)
            .map(nome => caches.delete(nome))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(respostaCache => {
        if (respostaCache) {
          return respostaCache;
        }

        return fetch(event.request)
          .then(respostaRede => {
            if (
              !respostaRede ||
              respostaRede.status !== 200 ||
              respostaRede.type === "opaque"
            ) {
              return respostaRede;
            }

            const respostaParaCache = respostaRede.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, respostaParaCache);
              });

            return respostaRede;
          });
      })
  );
});