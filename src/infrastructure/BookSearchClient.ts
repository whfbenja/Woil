/**
 * Cliente da Google Books API.
 *
 * Único ponto de rede do app até agora, e por isso isolado na camada de
 * infraestrutura: o resto do código nunca chama `fetch` direto. A busca é
 * OPCIONAL — o formulário funciona 100% manual sem ela. Falha de rede,
 * timeout, resposta malformada ou zero resultados devolvem lista vazia com
 * um `error` legível, nunca exceção.
 *
 * Endpoint público (sem API key para buscas básicas):
 *   https://www.googleapis.com/books/v1/volumes?q=<termo>
 */

const ENDPOINT = 'https://www.googleapis.com/books/v1/volumes';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_RESULTS = 10;

export interface BookSearchResult {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  pagesTotal?: number;
  publishedDate?: string;
}

export interface BookSearchResponse {
  results: BookSearchResult[];
  /** Mensagem amigável quando a busca falhou; ausente em sucesso. */
  error?: string;
}

export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string;
    authors?: string[];
    pageCount?: number;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: { type?: string; identifier?: string }[];
  };
}

function pickIsbn(identifiers: GoogleBooksVolume['volumeInfo']): string | undefined {
  if (!identifiers?.industryIdentifiers?.length) return undefined;
  const list = identifiers.industryIdentifiers;
  const isbn13 = list.find((i) => i.type === 'ISBN_13' && i.identifier);
  const isbn10 = list.find((i) => i.type === 'ISBN_10' && i.identifier);
  return isbn13?.identifier ?? isbn10?.identifier ?? undefined;
}

/** Converte um volume cru da API no shape do domínio. */
export function mapVolume(volume: GoogleBooksVolume): BookSearchResult | null {
  const info = volume?.volumeInfo;
  const title = info?.title?.trim();
  if (!title) return null;

  const thumbnail = info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail;

  return {
    title,
    author: info?.authors?.length ? info.authors.join(', ') : undefined,
    coverUrl: thumbnail ? thumbnail.replace(/^http:/, 'https:') : undefined,
    isbn: pickIsbn(info),
    pagesTotal: typeof info?.pageCount === 'number' ? info.pageCount : undefined,
    publishedDate: info?.publishedDate,
  };
}

export class BookSearchClient {
  constructor(
    private fetchImpl: FetchLike = (globalThis as { fetch?: FetchLike }).fetch as FetchLike,
    private timeoutMs: number = DEFAULT_TIMEOUT_MS
  ) {}

  async search(query: string, maxResults = DEFAULT_MAX_RESULTS): Promise<BookSearchResponse> {
    const q = query?.trim();
    if (!q) return { results: [] };

    if (typeof this.fetchImpl !== 'function') {
      return { results: [], error: 'Busca indisponível neste dispositivo.' };
    }

    const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&maxResults=${maxResults}`;
    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
      if (controller) {
        timer = setTimeout(() => controller.abort(), this.timeoutMs);
      }

      const response = await this.fetchImpl(url, controller ? { signal: controller.signal } : {});
      if (!response.ok) {
        return { results: [], error: 'A busca de livros falhou. Preencha manualmente.' };
      }

      const payload = (await response.json()) as { items?: GoogleBooksVolume[] };
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const results = items
        .map(mapVolume)
        .filter((r): r is BookSearchResult => r !== null)
        .slice(0, maxResults);

      if (results.length === 0) {
        return { results: [], error: 'Nenhum livro encontrado.' };
      }
      return { results };
    } catch {
      return { results: [], error: 'Sem conexão. Preencha manualmente ou tente de novo.' };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}