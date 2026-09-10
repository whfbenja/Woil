import { Note } from './Note';

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

/**
 * Índice de backlinks em memória.
 *
 * Os wikilinks extraídos pelo parser apontam para TÍTULOS (ex.: [[Nota]]),
 * então o índice mantém um mapa título -> id para resolver as arestas.
 * Atualização incremental: cada indexNote/removeNote recalcula as arestas a
 * partir dos links brutos + títulos conhecidos. É O(n) por operação, o que é
 * suficiente para vaults pequenos (escala é problema futuro, não do MVP).
 */
export class BacklinkIndex {
  /** título normalizado -> id da nota */
  private titles: Map<string, string> = new Map();
  /** id da nota -> títulos brutos dos wikilinks */
  private rawLinks: Map<string, string[]> = new Map();
  /** id da nota -> ids das notas que ela referencia (outgoing) */
  private outgoing: Map<string, Set<string>> = new Map();
  /** id da nota -> ids das notas que a referenciam (incoming/backlinks) */
  private incoming: Map<string, Set<string>> = new Map();

  indexNote(note: Note): void {
    this.titles.set(normalizeTitle(note.title), note.id);
    this.rawLinks.set(note.id, [...note.wikilinks]);
    this.recompute();
  }

  removeNote(id: string): void {
    this.titles.forEach((noteId, key) => {
      if (noteId === id) this.titles.delete(key);
    });
    this.rawLinks.delete(id);
    this.recompute();
  }

  /** Ids das notas referenciadas por `id`. */
  getOutgoingIds(id: string): string[] {
    return Array.from(this.outgoing.get(id) ?? []);
  }

  /** Ids das notas que referenciam `id`. */
  getBacklinkIds(id: string): string[] {
    return Array.from(this.incoming.get(id) ?? []);
  }

  private recompute(): void {
    this.outgoing = new Map();
    this.incoming = new Map();

    for (const [sourceId, links] of this.rawLinks) {
      const targets = new Set<string>();
      for (const link of links) {
        const targetId = this.titles.get(normalizeTitle(link));
        if (targetId && targetId !== sourceId) targets.add(targetId);
      }
      this.outgoing.set(sourceId, targets);
      for (const targetId of targets) {
        if (!this.incoming.has(targetId)) this.incoming.set(targetId, new Set());
        this.incoming.get(targetId)!.add(sourceId);
      }
    }
  }
}