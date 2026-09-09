import { Note } from './Note';

export interface IndexEntry {
  id: string;
  title: string;
  content: string; // normalized text for search
  tags: string[];
  wikilinks: string[];
}

export class NoteIndex {
  private notes: Map<string, IndexEntry> = new Map();

  indexNote(note: Note): void {
    const entry: IndexEntry = {
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      wikilinks: note.wikilinks,
    };
    this.notes.set(note.id, entry);
  }

  removeNote(id: string): void {
    this.notes.delete(id);
  }

  search(query: string): IndexEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: IndexEntry[] = [];
    for (const entry of this.notes.values()) {
      const match =
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some(t => t.toLowerCase().includes(q));
      if (match) {
        results.push(entry);
      }
    }
    return results;
  }

  getAll(): IndexEntry[] {
    return Array.from(this.notes.values());
  }

  getById(id: string): IndexEntry | undefined {
    return this.notes.get(id);
  }
}