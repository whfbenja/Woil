/**
 * FASE 4 (camada de aplicação) — fachada de livros sobre o NoteService.
 * Garante que livro continua sendo nota: listar/filtrar, criar, editar
 * preservando frontmatter, marcar páginas no corpo e excluir.
 */
import { BookService } from '../src/application/BookService';
import { NoteService } from '../src/application/NoteService';
import { NoteIndex } from '../src/domain/Index';
import { BacklinkIndex } from '../src/domain/BacklinkIndex';
import { Note, NoteCreateInput, NoteUpdateInput } from '../src/domain/Note';
import { NoteRepository } from '../src/domain/NoteRepository';
import { parseWikilinks } from '../src/domain/parsers/WikilinkParser';

class InMemoryNoteRepository implements NoteRepository {
  private store = new Map<string, Note>();
  private seq = 0;

  async create(input: NoteCreateInput): Promise<Note> {
    this.seq += 1;
    const id = `note-${this.seq}`;
    const now = new Date().toISOString();
    const note: Note = {
      id,
      title: input.title,
      content: input.content,
      frontmatter: { id, title: input.title, created: now, updated: now, ...(input.frontmatter ?? {}) },
      tags: (input.frontmatter?.tags as string[]) ?? [],
      wikilinks: parseWikilinks(input.content),
      metadata: { created: now, updated: now },
    };
    this.store.set(id, note);
    return { ...note };
  }

  async getById(id: string): Promise<Note | null> {
    const found = this.store.get(id);
    return found ? { ...found } : null;
  }

  async update(id: string, input: NoteUpdateInput): Promise<Note> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Note ${id} not found`);
    const merged: Note = {
      ...existing,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      frontmatter: { ...existing.frontmatter, ...(input.frontmatter ?? {}) },
      metadata: { ...existing.metadata, updated: new Date().toISOString() },
    };
    this.store.set(id, merged);
    return { ...merged };
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async list(): Promise<Note[]> {
    return Array.from(this.store.values()).map((n) => ({ ...n }));
  }
}

function makeBooks() {
  const notes = new NoteService(new InMemoryNoteRepository(), new NoteIndex(), new BacklinkIndex());
  return new BookService(notes);
}

describe('BookService', () => {
  it('cria livro, ignora notas comuns e filtra por status', async () => {
    const books = makeBooks();
    const notes = (books as unknown as { notes: NoteService }).notes;

    await notes.createNote({ title: 'Nota comum', content: 'nada' });
    const a = await books.createBook({ title: 'Lendo', status: 'lendo' });
    await books.createBook({ title: 'Quero', status: 'quero_ler' });

    const all = await books.listBooks('todos');
    expect(all).toHaveLength(2);
    expect((await books.listBooks('lendo')).map((b) => b.note.title)).toEqual(['Lendo']);
    expect((await books.getBook(a.note.id))?.meta.status).toBe('lendo');
  });

  it('editar preserva autor/páginas e atualiza progresso', async () => {
    const books = makeBooks();
    const created = await books.createBook({
      title: 'Duna',
      author: 'Frank Herbert',
      pagesTotal: 500,
      status: 'lendo',
    });

    const updated = await books.updateBook(created.note.id, { pagesCurrent: 250 });
    expect(updated.meta.author).toBe('Frank Herbert');
    expect(updated.meta.pagesTotal).toBe(500);
    expect(updated.progress).toBe(50);
  });

  it('adiciona marcação de página ao corpo e relê', async () => {
    const books = makeBooks();
    const created = await books.createBook({ title: 'Neuromancer' });

    const withMarker = await books.addPageMarker(created.note.id, {
      start: 42,
      end: 44,
      text: 'cena icônica',
    });

    expect(withMarker.markers).toHaveLength(1);
    expect(withMarker.markers[0].start).toBe(42);
    expect(withMarker.note.content).toContain('p.42-44');

    const reread = await books.getBook(created.note.id);
    expect(reread?.markers).toHaveLength(1);
    expect(reread?.markers[0].text).toBe('cena icônica');
  });

  it('getBook devolve null para nota comum ou id inexistente', async () => {
    const books = makeBooks();
    const notes = (books as unknown as { notes: NoteService }).notes;
    const common = await notes.createNote({ title: 'Só nota', content: 'x' });

    expect(await books.getBook(common.id)).toBeNull();
    expect(await books.getBook('nao-existe')).toBeNull();
  });

  it('delete remove o livro da listagem', async () => {
    const books = makeBooks();
    const created = await books.createBook({ title: 'Efêmero' });
    await books.deleteBook(created.note.id);
    expect(await books.listBooks('todos')).toHaveLength(0);
  });
});