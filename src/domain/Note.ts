export interface Note {
  id: string; // stable UUID
  title: string;
  content: string; // raw Markdown
  frontmatter: Record<string, unknown>;
  tags: string[];
  wikilinks: string[];
  metadata: {
    created: string; // ISO date
    updated: string;
  };
}

export interface NoteCreateInput {
  title: string;
  content: string;
  frontmatter?: Record<string, unknown>;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  frontmatter?: Record<string, unknown>;
}