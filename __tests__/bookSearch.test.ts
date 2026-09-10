/**
 * FASE 3 do prompt da Library — Google Books API.
 * A busca é opcional: TODO caminho de falha (rede, status != 200, timeout,
 * JSON malformado, zero itens) tem que devolver lista vazia + mensagem,
 * nunca lançar. O `fetch` é injetado, então nada toca a rede de verdade.
 */
import {
  BookSearchClient,
  FetchLike,
  mapVolume,
} from '../src/infrastructure/BookSearchClient';

function okResponse(body: unknown): ReturnType<FetchLike> {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
}

const VALID_PAYLOAD = {
  items: [
    {
      volumeInfo: {
        title: 'O Hobbit',
        authors: ['J. R. R. Tolkien'],
        pageCount: 310,
        publishedDate: '1937',
        imageLinks: { thumbnail: 'http://books.google.com/cover.jpg' },
        industryIdentifiers: [
          { type: 'ISBN_10', identifier: '8595084742' },
          { type: 'ISBN_13', identifier: '9788595084742' },
        ],
      },
    },
    {
      volumeInfo: {
        title: 'O Silmarillion',
        authors: ['J. R. R. Tolkien', 'Christopher Tolkien'],
        pageCount: 432,
      },
    },
  ],
};

describe('BookSearchClient', () => {
  it('mapeia título, autor, capa, ISBN e páginas', async () => {
    const client = new BookSearchClient(() => okResponse(VALID_PAYLOAD));
    const { results, error } = await client.search('tolkien');

    expect(error).toBeUndefined();
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: 'O Hobbit',
      author: 'J. R. R. Tolkien',
      coverUrl: 'https://books.google.com/cover.jpg',
      isbn: '9788595084742',
      pagesTotal: 310,
      publishedDate: '1937',
    });
    expect(results[1].author).toBe('J. R. R. Tolkien, Christopher Tolkien');
    expect(results[1].coverUrl).toBeUndefined();
  });

  it('query vazia não faz chamada de rede', async () => {
    let called = false;
    const client = new BookSearchClient(() => {
      called = true;
      return okResponse(VALID_PAYLOAD);
    });

    const { results } = await client.search('   ');
    expect(called).toBe(false);
    expect(results).toEqual([]);
  });

  it('respeita maxResults', async () => {
    const client = new BookSearchClient(() => okResponse(VALID_PAYLOAD));
    const { results } = await client.search('tolkien', 1);
    expect(results).toHaveLength(1);
  });

  it('status != 200 devolve erro amigável, sem lançar', async () => {
    const client = new BookSearchClient(() =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
    );
    const { results, error } = await client.search('qualquer');
    expect(results).toEqual([]);
    expect(error).toBeTruthy();
  });

  it('falha de rede/timeout devolve erro amigável, sem lançar', async () => {
    const client = new BookSearchClient(() => Promise.reject(new Error('network down')));
    const { results, error } = await client.search('qualquer');
    expect(results).toEqual([]);
    expect(error).toContain('conexão');
  });

  it('JSON malformado não quebra', async () => {
    const client = new BookSearchClient(() =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) })
    );
    const { results } = await client.search('qualquer');
    expect(results).toEqual([]);
  });

  it('zero resultados devolve mensagem específica', async () => {
    const client = new BookSearchClient(() => okResponse({ totalItems: 0 }));
    const { results, error } = await client.search('zzzz');
    expect(results).toEqual([]);
    expect(error).toContain('Nenhum');
  });

  it('aborta por timeout e cai no caminho gracioso', async () => {
    const client = new BookSearchClient(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
      10
    );
    const { results, error } = await client.search('lento');
    expect(results).toEqual([]);
    expect(error).toBeTruthy();
  });

  it('mapVolume ignora volume sem título', () => {
    expect(mapVolume({ volumeInfo: { authors: ['X'] } })).toBeNull();
    expect(mapVolume({})).toBeNull();
  });
});