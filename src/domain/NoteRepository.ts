import { Note, NoteCreateInput, NoteUpdateInput } from './Note';

export interface NoteRepository {
  create(input: NoteCreateInput): Promise<Note>;
  getById(id: string): Promise<Note | null>;
  update(id: string, input: NoteUpdateInput): Promise<Note>;
  delete(id: string): Promise<void>;
  list(): Promise<Note[]>;
}