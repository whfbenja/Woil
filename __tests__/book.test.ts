/**
 * FASE 2 do prompt da Library — domínio do livro.
 * Cobre: schema do frontmatter, normalização/limites (rating, status,
 * progresso), persistência de nota tipada via NoteService, e agnosticismo
 * do índice de busca/backlinks em relação ao `type`.
 */
import { NoteService } from '../src/application/NoteService';
import { NoteIndex } from '../src/domain/Index';
import { BacklinkIndex } from '../src/domain/BacklinkIndex';
import { Note, NoteCreateInput, NoteUpdateInput } from '../src/domain/Note';
import { NoteRepository } from '../src/domain/NoteRepository';
import { parseWikilinks } from '../src/domain/parsers/WikilinkParser';
import {
  BOOK_TYPE,
  bookProgress,
  booksOnly,
  buildBookFrontmatter,
  clampRating,
  filterBooks,
  isBookNote,
  readBookMeta,
} from '../src/domain/Book';

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

function makeService() {
  const repository = new InMemoryNoteRepository();
  return new NoteService(repository, new NoteIndex(), new BacklinkIndex());
}

describe('Book — schema do frontmatter', () => {
  it('monta o frontmatter completo de um livro', () => {
    const fm = buildBookFrontmatter({
      title: 'O Nome do Vento',
      author: 'Patrick Rothfuss',
      coverUrl: 'https://example.com/c.jpg',
      isbn: '9788599296493',
      status: 'lendo',
      rating: 4.5,
      pagesTotal: 656,
      pagesCurrent: 200,
      tags: ['fantasia'],
    });

    expect(fm.type).toBe(BOOK_TYPE);
    expect(fm.status).toBe('lendo');
    expect(fm.author).toBe('Patrick Rothfuss');
    expect(fm.cover_url).toBe('https://example.com/c.jpg');
    expect(fm.isbn).toBe('9788599296493');
    expect(fm.rating).toBe(4.5);
    expect(fm.pages_total).toBe(656);
    expect(fm.pages_current).toBe(200);
    expect(fm.tags).toEqual(['fantasia']);
  });

  it('usa status padrão quando não informado e omite campos vazios', () => {
    const fm = buildBookFrontmatter({ title: 'Sem Nada' });
    expect(fm.status).toBe('quero_ler');
    expect(fm.tags).toEqual([]);
    expect('author' in fm).toBe(false);
    expect('cover_url' in fm).toBe(false);
    expect('isbn' in fm).toBe(false);
    expect('rating' in fm).toBe(false);
  });

  it('clampRating arredonda para meio ponto e limita a 0..5', () => {
    expect(clampRating(4.3)).toBe(4.5);
    expect(clampRating(4.2)).toBe(4);
    expect(clampRating(-3)).toBe(0);
    expect(clampRating(99)).toBe(5);
    expect(clampRating('3.5')).toBe(3.5);
    expect(clampRating('abc')).toBeUndefined();
    expect(clampRating(undefined)).toBeUndefined();
  });

  it('readBookMeta normaliza frontmatter cru e é tolerante a lixo', () => {
    const meta = readBookMeta({
      type: 'book',
      status: 'invalido',
      rating: 7,
      pages_total: '300',
      pages_current: 90,
      author: '  Ursula K. Le Guin  ',
    });

    expect(meta.status).toBe('quero_ler');
    expect(meta.rating).toBe(5);
    expect(meta.pagesTotal).toBe(300);
    expect(meta.pagesCurrent).toBe(90);
    expect(meta.author).toBe('Ursula K. Le Guin');
  });

  it('bookProgress devolve % ou null sem granularidade', () => {
    expect(bookProgress(readBookMeta({ pages_total: 200, pages_current: 50 }))).toBe(25);
    expect(bookProgress(readBookMeta({ pages_current: 50 }))).toBeNull();
    expect(bookProgress(readBookMeta({ pages_total: 0, pages_current: 0 }))).toBeNull();
    expect(bookProgress(readBookMeta({ pages_total: 100, pages_current: 999 }))).toBe(100);
  });
});

describe('Book — nota tipada no NoteService', () => {
  it('cria nota de livro com schema correto e recupera via isBookNote', async () => {
    const service = makeService();
    const created = await service.createNote({
      title: 'A Mão Esquerda da Escuridão',
      content: 'resenha inicial',
      frontmatter: buildBookFrontmatter({
        title: 'A Mão Esquerda da Escuridão',
        author: 'Ursula K. Le Guin',
        status: 'lido',
        rating: 5,
        pagesTotal: 304,
      }),
    });

    expect(created.frontmatter.type).toBe(BOOK_TYPE);
    expect(isBookNote(created)).toBe(true);
    expect(readBookMeta(created.frontmatter).status).toBe('lido');

    const all = await service.listNotes();
    expect(booksOnly(all)).toHaveLength(1);
  });

  it('editar o livro preserva os campos do frontmatter anterior', async () => {
    const service = makeService();
    const created = await service.createNote({
      title: 'Duna',
      content: 'v1',
      frontmatter: buildBookFrontmatter({ title: 'Duna', status: 'lendo', pagesTotal: 500 }),
    });

    const updated = await service.updateNote(created.id, {
      content: 'v2',
      frontmatter: { pages_current: 120 },
    });

    expect(updated.content).toBe('v2');
    expect(updated.frontmatter.type).toBe(BOOK_TYPE);
    expect(updated.frontmatter.pages_total).toBe(500);
    expect(updated.frontmatter.pages_current).toBe(120);
    expect(readBookMeta(updated.frontmatter).status).toBe('lendo');
  });

  it('filtra por status sem quebrar com notas comuns no vault', async () => {
    const service = makeService();
    await service.createNote({ title: 'Nota comum', content: 'nada' });
    await service.createNote({
      title: 'Lendo agora',
      content: 'x',
      frontmatter: buildBookFrontmatter({ title: 'Lendo agora', status: 'lendo' }),
    });
    await service.createNote({
      title: 'Já li',
      content: 'y',
      frontmatter: buildBookFrontmatter({ title: 'Já li', status: 'lido' }),
    });

    const all = await service.listNotes();
    const books = booksOnly(all);
    expect(books).toHaveLength(2);
    expect(filterBooks(books, 'lendo').map((n) => n.title)).toEqual(['Lendo agora']);
    expect(filterBooks(books, 'lido').map((n) => n.title)).toEqual(['Já li']);
    expect(filterBooks(books, 'todos')).toHaveLength(2);
  });

  it('busca e backlinks são agnósticos ao type (livro indexa como nota)', async () => {
    const service = makeService();
    const alvo = await service.createNote({
      title: 'Livro Alvo',
      content: 'conteudo',
      frontmatter: buildBookFrontmatter({ title: 'Livro Alvo' }),
    });
    const fonte = await service.createNote({
      title: 'Nota que cita',
      content: 'veja [[Livro Alvo]]',
    });

    const found = await service.search('conteudo');
    expect(found.map((n) => n.id)).toContain(alvo.id);

    const backlinks = await service.getBacklinks(alvo.id);
    expect(backlinks.map((n) => n.id)).toEqual([fonte.id]);
  });
});