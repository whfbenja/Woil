import { Note, NoteCreateInput, NoteUpdateInput } from '../domain/Note';
import { NoteRepository } from '../domain/NoteRepository';
import { NoteIndex } from '../domain/Index';
import { BacklinkIndex } from '../domain/BacklinkIndex';

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: Note[];
  edges: GraphEdge[];
}

export class NoteService {
  constructor(
    private repository: NoteRepository,
    private index: NoteIndex,
    private backlinks: BacklinkIndex = new BacklinkIndex()
  ) {}

  async createNote(input: NoteCreateInput): Promise<Note> {
    const note = await this.repository.create(input);
    this.index.indexNote(note);
    this.backlinks.indexNote(note);
    return note;
  }

  async getNote(id: string): Promise<Note | null> {
    return this.repository.getById(id);
  }

  async updateNote(id: string, input: NoteUpdateInput): Promise<Note> {
    const note = await this.repository.update(id, input);
    this.index.indexNote(note);
    this.backlinks.indexNote(note);
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await this.repository.delete(id);
    this.index.removeNote(id);
    this.backlinks.removeNote(id);
  }

  async listNotes(): Promise<Note[]> {
    return this.repository.list();
  }

  /** Reindexa o vault inteiro (chamar ao carregar as notas do disco). */
  indexNotes(notes: Note[]): void {
    for (const note of notes) {
      this.index.indexNote(note);
      this.backlinks.indexNote(note);
    }
  }

  async search(query: string): Promise<Note[]> {
    const entries = this.index.search(query);
    return this.resolveNotes(entries.map((entry) => entry.id));
  }

  /** Notas que referenciam a nota informada. */
  async getBacklinks(noteId: string): Promise<Note[]> {
    return this.resolveNotes(this.backlinks.getBacklinkIds(noteId));
  }

  /** Notas referenciadas pela nota informada. */
  async getOutgoingLinks(noteId: string): Promise<Note[]> {
    return this.resolveNotes(this.backlinks.getOutgoingIds(noteId));
  }

  /** Dados do grafo: todas as notas + arestas derivadas dos wikilinks. */
  async getGraph(): Promise<GraphData> {
    const nodes = await this.repository.list();
    const edges: GraphEdge[] = [];
    for (const node of nodes) {
      for (const target of this.backlinks.getOutgoingIds(node.id)) {
        edges.push({ source: node.id, target });
      }
    }
    return { nodes, edges };
  }

  private async resolveNotes(ids: string[]): Promise<Note[]> {
    const notes: Note[] = [];
    await Promise.all(
      ids.map(async (id) => {
        const note = await this.repository.getById(id);
        if (note) notes.push(note);
      })
    );
    return notes;
  }
}