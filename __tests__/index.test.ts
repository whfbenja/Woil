import { NoteIndex } from '../src/domain/Index';

describe('NoteIndex', () => {
  it('indexes and searches notes', () => {
    const index = new NoteIndex();
    const note = {
      id: '123',
      title: 'Test Note',
      content: 'This is a test note',
      tags: ['test'],
      wikilinks: [],
      frontmatter: {},
      metadata: { created: '2026-09-09', updated: '2026-09-09' },
    };
    index.indexNote(note);

    const results = index.search('test');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('123');
  });

  it('removes notes', () => {
    const index = new NoteIndex();
    const note = {
      id: '123',
      title: 'Test',
      content: 'content',
      tags: [],
      wikilinks: [],
      frontmatter: {},
      metadata: { created: '2026-09-09', updated: '2026-09-09' },
    };
    index.indexNote(note);
    index.removeNote('123');
    const results = index.search('test');
    expect(results).toHaveLength(0);
  });

  it('gets all notes', () => {
    const index = new NoteIndex();
    const note = {
      id: '123',
      title: 'Test',
      content: 'content',
      tags: [],
      wikilinks: [],
      frontmatter: {},
      metadata: { created: '2026-09-09', updated: '2026-09-09' },
    };
    index.indexNote(note);
    const all = index.getAll();
    expect(all).toHaveLength(1);
  });
});