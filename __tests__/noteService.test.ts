/**
 * Testes funcionais do fluxo de nota (application layer) contra um
 * repositório em memória. Garantem que criar/editar/excluir/buscar
 * continuam funcionando conforme a UI evolui.
 */
import { NoteService } from '../src/application/NoteService';
import { NoteIndex } from '../src/domain/Index';
import { Note, NoteCreateInput, NoteUpdateInput } from '../src/domain/Note';
import { NoteRepository } from '../src/domain/NoteRepository';

class InMemoryNoteRepository implements NoteRepository {
  private store = new Map<string, Note>();
  private seq = 0;

  private parseTags(content: string): string[] {
    return Array.from(new Set(content.match(/(?:^|\s)#([\w-]+)/g) || [])).map((t) =>
      t.trim().replace(/^#/, '')
    );
  }

  async create(input: NoteCreateInput): Promise<Note> {
    this.seq += 1;
    const id = `note-${this.seq}`;
    const now = new Date().toISOString();
    const note: Note = {
      id,
      title: input.title,
      content: input.content,
      frontmatter: input.frontmatter ?? {},
      tags: this.parseTags(input.content),
      wikilinks: [],
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
    const merged: Note = {
      ...existing,
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      frontmatter: input.frontmatter ?? existing.frontmatter,
      metadata: { ...existing.metadata, updated: new Date().toISOString() },
    };
    merged.tags = this.parseTags(merged.content);
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
  return { repository, index, service: new NoteService(repository, index) };
}

describe('NoteService (fluxo funcional)', () => {
  it('cria nota e a lista', async () => {
    const { service } = makeService();
    const created = await service.createNote({
      title: 'Primeiro Drop',
      content: 'conteúdo inicial',
    });

    expect(created.id).toBeTruthy();
    expect(created.title).toBe('Primeiro Drop');
    expect(created.metadata.created).toBeTruthy();

    const all = await service.listNotes();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('atualiza título e conteúdo preservando o id', async () => {
    const { service } = makeService();
    const created = await service.createNote({ title: 'Antes', content: 'v1' });

    const updated = await service.updateNote(created.id, {
      title: 'Depois',
      content: 'v2',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Depois');
    expect(updated.content).toBe('v2');

    const reread = await service.getNote(created.id);
    expect(reread?.title).toBe('Depois');
  });

  it('remove nota e ela some da listagem e do índice', async () => {
    const { service } = makeService();
    const created = await service.createNote({ title: 'Efêmera', content: 'x' });

    await service.deleteNote(created.id);

    expect(await service.getNote(created.id)).toBeNull();
    expect(await service.listNotes()).toHaveLength(0);
    expect(await service.search('Efêmera')).toHaveLength(0);
  });

  it('busca por título e por conteúdo', async () => {
    const { service } = makeService();
    await service.createNote({ title: 'Rascunho', content: 'nada aqui' });
    await service.createNote({
      title: 'Outro',
      content: 'contém a palavra-chave especial',
    });

    const byTitle = await service.search('rascunho');
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].title).toBe('Rascunho');

    const byContent = await service.search('palavra-chave');
    expect(byContent).toHaveLength(1);
    expect(byContent[0].title).toBe('Outro');
  });

  it('busca encontra por tag (#tag no conteúdo)', async () => {
    const { service } = makeService();
    await service.createNote({ title: 'Com tag', content: 'texto #projeto' });

    const found = await service.search('projeto');
    expect(found).toHaveLength(1);
  });

  it('getNote devolve null para id inexistente', async () => {
    const { service } = makeService();
    expect(await service.getNote('nao-existe')).toBeNull();
  });
});