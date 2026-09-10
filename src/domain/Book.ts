/**
 * Domínio: nota tipada de Livro (`type: book`).
 *
 * Livro NÃO é uma estrutura paralela — é uma nota `.md` normal cujo
 * frontmatter carrega campos extras. Estes helpers apenas interpretam e
 * normalizam esses campos; a persistência continua no FileNoteRepository.
 * Nada aqui toca filesystem ou rede.
 */
import { Note } from './Note';

export const BOOK_TYPE = 'book';

export const BOOK_STATUSES = ['quero_ler', 'lendo', 'lido'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];
export type BookFilter = BookStatus | 'todos';

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
};

/** Campos do frontmatter já normalizados (camelCase no domínio). */
export interface BookMeta {
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status: BookStatus;
  rating?: number;
  pagesTotal?: number;
  pagesCurrent?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface BookInput {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
  status?: BookStatus;
  rating?: number;
  pagesTotal?: number;
  pagesCurrent?: number;
  tags?: string[];
}

export function isBookStatus(value: unknown): value is BookStatus {
  return typeof value === 'string' && (BOOK_STATUSES as readonly string[]).includes(value);
}

/** Arredonda para o meio ponto mais próximo e limita a 0..5. */
export function clampRating(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.min(5, Math.max(0, n));
  return Math.round(clamped * 2) / 2;
}

export function isBookNote(note: Pick<Note, 'frontmatter'>): boolean {
  return note.frontmatter?.type === BOOK_TYPE;
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Lê o frontmatter cru e devolve um BookMeta normalizado (nunca lança). */
export function readBookMeta(frontmatter: Record<string, unknown> = {}): BookMeta {
  const status = isBookStatus(frontmatter.status) ? frontmatter.status : 'quero_ler';
  return {
    author: str(frontmatter.author),
    coverUrl: str(frontmatter.cover_url),
    isbn: str(frontmatter.isbn),
    status,
    rating: clampRating(frontmatter.rating),
    pagesTotal: num(frontmatter.pages_total),
    pagesCurrent: num(frontmatter.pages_current),
    startedAt: str(frontmatter.started_at),
    finishedAt: str(frontmatter.finished_at),
  };
}

/** Frontmatter a gravar para um livro (snake_case, conforme o spec). */
export function buildBookFrontmatter(input: BookInput): Record<string, unknown> {
  const fm: Record<string, unknown> = {
    type: BOOK_TYPE,
    status: input.status ?? 'quero_ler',
    tags: input.tags ?? [],
  };
  if (input.author) fm.author = input.author;
  if (input.coverUrl) fm.cover_url = input.coverUrl;
  if (input.isbn) fm.isbn = input.isbn;
  const rating = clampRating(input.rating);
  if (rating !== undefined) fm.rating = rating;
  if (input.pagesTotal) fm.pages_total = input.pagesTotal;
  if (input.pagesCurrent !== undefined) fm.pages_current = input.pagesCurrent;
  return fm;
}

/** Progresso em % (0..100) ou null quando não há granularidade suficiente. */
export function bookProgress(meta: BookMeta): number | null {
  if (!meta.pagesTotal || meta.pagesCurrent === undefined) return null;
  const pct = Math.round((meta.pagesCurrent / meta.pagesTotal) * 100);
  return Math.min(100, Math.max(0, pct));
}

export function booksOnly(notes: Note[]): Note[] {
  return notes.filter(isBookNote);
}

export function filterBooks(notes: Note[], filter: BookFilter): Note[] {
  if (filter === 'todos') return notes;
  return notes.filter((n) => readBookMeta(n.frontmatter).status === filter);
}