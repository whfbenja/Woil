/**
 * Testes do índice de backlinks (FASE 2).
 * Cobrem: A linka B -> B aparece em getOutgoingLinks(A) e A aparece em
 * getBacklinks(B); nota deletada sai do índice sem quebrar; links por título
 * inexistente são ignorados; a resolução funciona em qualquer ordem de carga.
 */
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
      frontmatter: input.frontmatter ?? {},
      tags: [],
      wikilinks: parseWikilinks(input.content),
      metadata: { created: now, updated: now },
    };
    this.store.set(id, { ...note });
    return { ...note };
  }

  async getById(id: string): Promise<Note | null> {
    const found = this.store.get(id);
    return found ? { ...found } : null;
  }

  async update(id: string, input: NoteUpdateInput): Promise<Note> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Note ${id} not found`);
    const content = input.content ?? existing.content;
    const merged: Note = {
      ...existing,
      title: input.title ?? existing.title,
      content,
      frontmatter: input.frontmatter ?? existing.frontmatter,
      wikilinks: parseWikilinks(content),
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
  const index = new NoteIndex();
  const backlinks = new BacklinkIndex();
  return { repository, service: new NoteService(repository, index, backlinks) };
}

describe('BacklinkIndex / NoteService (backlinks)', () => {
  it('A linka B: B fica nos outgoing de A e A nos backlinks de B', async () => {
    const { service } = makeService();

    const b = await service.createNote({ title: 'Projeto Aurora', content: 'raiz' });
    const a = await service.createNote({
      title: 'Ideia Solta',
      content: 'referencia [[Projeto Aurora]]',
    });

    const outgoing = await service.getOutgoingLinks(a.id);
    expect(outgoing.map((n) => n.id)).toEqual([b.id]);

    const backlinks = await service.getBacklinks(b.id);
    expect(backlinks.map((n) => n.id)).toEqual([a.id]);
  });

  it('resolve o link mesmo quando a nota alvo é criada depois', async () => {
    const { service } = makeService();

    const a = await service.createNote({
      title: 'Rascunho',
      content: 'aponta para [[Destino]]',
    });
    // alvo ainda não existe -> sem aresta
    expect(await service.getOutgoingLinks(a.id)).toHaveLength(0);

    const b = await service.createNote({ title: 'Destino', content: 'cheguei' });

    expect((await service.getOutgoingLinks(a.id)).map((n) => n.id)).toEqual([b.id]);
    expect((await service.getBacklinks(b.id)).map((n) => n.id)).toEqual([a.id]);
  });

  it('nota deletada é removida do índice sem quebrar', async () => {
    const { service } = makeService();

    const b = await service.createNote({ title: 'Alvo', content: 'x' });
    const a = await service.createNote({ title: 'Fonte', content: 'veja [[Alvo]]' });

    expect(await service.getBacklinks(b.id)).toHaveLength(1);

    await service.deleteNote(a.id);

    expect(await service.getBacklinks(b.id)).toHaveLength(0);
    expect(await service.getOutgoingLinks(a.id)).toHaveLength(0);
    // deletar a nota alvo também não quebra
    await service.deleteNote(b.id);
    expect(await service.getBacklinks(b.id)).toHaveLength(0);
  });

  it('editar o conteúdo atualiza as arestas (remove link antigo)', async () => {
    const { service } = makeService();

    const b = await service.createNote({ title: 'Beta', content: 'x' });
    const c = await service.createNote({ title: 'Gama', content: 'y' });
    const a = await service.createNote({ title: 'Alfa', content: 'link [[Beta]]' });

    expect((await service.getOutgoingLinks(a.id)).map((n) => n.id)).toEqual([b.id]);

    await service.updateNote(a.id, { content: 'agora aponta [[Gama]]' });

    expect((await service.getOutgoingLinks(a.id)).map((n) => n.id)).toEqual([c.id]);
    expect(await service.getBacklinks(b.id)).toHaveLength(0);
    expect((await service.getBacklinks(c.id)).map((n) => n.id)).toEqual([a.id]);
  });

  it('link para título inexistente é ignorado', async () => {
    const { service } = makeService();
    const a = await service.createNote({ title: 'Sozinha', content: '[[Fantasma]]' });
    expect(await service.getOutgoingLinks(a.id)).toHaveLength(0);
  });

  it('getGraph devolve nós e arestas coerentes', async () => {
    const { service } = makeService();
    const b = await service.createNote({ title: 'Nó B', content: 'x' });
    const a = await service.createNote({ title: 'Nó A', content: '[[Nó B]]' });

    const graph = await service.getGraph();
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toEqual([{ source: a.id, target: b.id }]);
  });
});