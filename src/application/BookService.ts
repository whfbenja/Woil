/**
 * Serviço de aplicação da Library.
 *
 * Livro é uma nota tipada (`type: book`), então este serviço é uma fachada
 * fina sobre o NoteService: nada de repositório paralelo, nada de tabela
 * separada. Ele só traduz entre o modelo de UI (BookInput) e o frontmatter
 * snake_case do spec, e encapsula a manipulação de marcações de página no
 * corpo Markdown.
 */
import { Note } from '../domain/Note';
import { NoteService } from './NoteService';
import {
  BookFilter,
  BookInput,
  BookMeta,
  booksOnly,
  bookProgress,
  buildBookFrontmatter,
  filterBooks,
  isBookNote,
  readBookMeta,
} from '../domain/Book';
import {
  PageMarker,
  appendPageMarker,
  parsePageMarkers,
  sortPageMarkers,
} from '../domain/parsers/PageMarkerParser';

export interface BookView {
  note: Note;
  meta: BookMeta;
  progress: number | null;
  markers: PageMarker[];
}

export class BookService {
  constructor(private notes: NoteService) {}

  /** Lista apenas notas de livro, já filtradas e ordenadas. */
  async listBooks(filter: BookFilter = 'todos'): Promise<BookView[]> {
    const all = await this.notes.listNotes();
    return filterBooks(booksOnly(all), filter)
      .map((note) => this.toView(note))
      .sort((a, b) => (a.note.metadata.updated < b.note.metadata.updated ? 1 : -1));
  }

  async getBook(id: string): Promise<BookView | null> {
    const note = await this.notes.getNote(id);
    return note && isBookNote(note) ? this.toView(note) : null;
  }

  async createBook(input: BookInput): Promise<BookView> {
    const note = await this.notes.createNote({
      title: input.title,
      content: '',
      frontmatter: buildBookFrontmatter(input),
    });
    return this.toView(note);
  }

  /** Atualiza metadados e/ou corpo, preservando o resto do frontmatter. */
  async updateBook(
    id: string,
    input: Partial<BookInput> & { content?: string }
  ): Promise<BookView> {
    const existing = await this.notes.getNote(id);
    if (!existing) throw new Error(`Book ${id} not found`);

    const currentMeta = readBookMeta(existing.frontmatter);
    const frontmatter: Record<string, unknown> = { ...buildBookFrontmatter({
      title: input.title ?? existing.title,
      author: input.author ?? currentMeta.author,
      coverUrl: input.coverUrl ?? currentMeta.coverUrl,
      isbn: input.isbn ?? currentMeta.isbn,
      status: input.status ?? currentMeta.status,
      rating: input.rating ?? currentMeta.rating,
      pagesTotal: input.pagesTotal ?? currentMeta.pagesTotal,
      pagesCurrent: input.pagesCurrent ?? currentMeta.pagesCurrent,
      tags: input.tags ?? existing.tags,
    }) };
    if (currentMeta.startedAt) frontmatter.started_at = currentMeta.startedAt;
    if (currentMeta.finishedAt) frontmatter.finished_at = currentMeta.finishedAt;

    const note = await this.notes.updateNote(id, {
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      frontmatter,
    });
    return this.toView(note);
  }

  async deleteBook(id: string): Promise<void> {
    await this.notes.deleteNote(id);
  }

  /** Anexa uma marcação de página ao corpo da nota do livro. */
  async addPageMarker(
    id: string,
    marker: { start: number; end?: number; text: string }
  ): Promise<BookView> {
    const note = await this.notes.getNote(id);
    if (!note) throw new Error(`Book ${id} not found`);
    const content = appendPageMarker(note.content, marker);
    const updated = await this.notes.updateNote(id, { content });
    return this.toView(updated);
  }

  private toView(note: Note): BookView {
    const meta = readBookMeta(note.frontmatter);
    return {
      note,
      meta,
      progress: bookProgress(meta),
      markers: sortPageMarkers(parsePageMarkers(note.content)),
    };
  }
}