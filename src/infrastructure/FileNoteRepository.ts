import * as crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { Note, NoteCreateInput, NoteUpdateInput } from '../domain/Note';
import { NoteRepository } from '../domain/NoteRepository';
import { parseFrontmatter, serializeFrontmatter } from '../domain/parsers/FrontmatterParser';
import { parseWikilinks } from '../domain/parsers/WikilinkParser';
import { parseTags } from '../domain/parsers/TagParser';
import { ExpoFileSystem } from './FileSystem';

// @ts-ignore - documentDirectory is available at runtime
const VAULT_DIR = FileSystem.documentDirectory + 'vault/';

export class FileNoteRepository implements NoteRepository {
  private fs = new ExpoFileSystem();

  private getNotePath(id: string): string {
    return `${VAULT_DIR}${id}.md`;
  }

  private async ensureVault(): Promise<void> {
    await this.fs.createDirectory(VAULT_DIR);
  }

  private async deriveNoteFromFile(id: string, content: string): Promise<Note> {
    const { frontmatter, body } = parseFrontmatter(content);
    const title = (frontmatter.title as string) || id;
    const tags = (frontmatter.tags as string[]) || parseTags(body);
    const wikilinks = parseWikilinks(body);
    const created = (frontmatter.created as string) || new Date().toISOString();
    const updated = (frontmatter.updated as string) || new Date().toISOString();

    return {
      id,
      title,
      content: body,
      frontmatter,
      tags,
      wikilinks,
      metadata: { created, updated },
    };
  }

  async create(input: NoteCreateInput): Promise<Note> {
    await this.ensureVault();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const frontmatter = {
      id,
      title: input.title,
      created: now,
      updated: now,
      tags: [],
      ...input.frontmatter,
    };
    const frontmatterStr = serializeFrontmatter(frontmatter);
    const fullContent = frontmatterStr + input.content;
    const path = this.getNotePath(id);
    await this.fs.writeFile(path, fullContent);
    return this.getById(id) as Promise<Note>;
  }

  async getById(id: string): Promise<Note | null> {
    const path = this.getNotePath(id);
    const exists = await this.fs.fileExists(path);
    if (!exists) return null;
    const content = await this.fs.readFile(path);
    return this.deriveNoteFromFile(id, content);
  }

  async update(id: string, input: NoteUpdateInput): Promise<Note> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Note ${id} not found`);
    const now = new Date().toISOString();
    const merged = {
      ...existing.frontmatter,
      title: input.title ?? existing.title,
      updated: now,
    };
    const body = input.content ?? existing.content;
    const frontmatterStr = serializeFrontmatter(merged);
    const fullContent = frontmatterStr + body;
    const path = this.getNotePath(id);
    await this.fs.writeFile(path, fullContent);
    return this.getById(id) as Promise<Note>;
  }

  async delete(id: string): Promise<void> {
    const path = this.getNotePath(id);
    await this.fs.deleteFile(path);
  }

  async list(): Promise<Note[]> {
    await this.ensureVault();
    const files = await this.fs.listFiles(VAULT_DIR);
    const noteFiles = files.filter(f => f.endsWith('.md'));
    const notes: Note[] = [];
    for (const file of noteFiles) {
      const id = file.replace(/\.md$/, '');
      const note = await this.getById(id);
      if (note) notes.push(note);
    }
    return notes;
  }
}