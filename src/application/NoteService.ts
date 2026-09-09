import { Note, NoteCreateInput, NoteUpdateInput } from '../domain/Note';
import { NoteRepository } from '../domain/NoteRepository';
import { NoteIndex } from '../domain/Index';

export class NoteService {
  constructor(
    private repository: NoteRepository,
    private index: NoteIndex
  ) {}

  async createNote(input: NoteCreateInput): Promise<Note> {
    const note = await this.repository.create(input);
    this.index.indexNote(note);
    return note;
  }

  async getNote(id: string): Promise<Note | null> {
    return this.repository.getById(id);
  }

  async updateNote(id: string, input: NoteUpdateInput): Promise<Note> {
    const note = await this.repository.update(id, input);
    this.index.indexNote(note);
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await this.repository.delete(id);
    this.index.removeNote(id);
  }

  async listNotes(): Promise<Note[]> {
    return this.repository.list();
  }

  async search(query: string): Promise<Note[]> {
    const entries = this.index.search(query);
    const notes: Note[] = [];
    await Promise.all(
      entries.map(async (entry) => {
        const note = await this.repository.getById(entry.id);
        if (note) notes.push(note);
      })
    );
    return notes;
  }
}