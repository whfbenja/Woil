/**
 * Parser das marcações de página de um livro.
 *
 * Convenção: a marcação vive no CORPO Markdown da própria nota, como
 * blockquote — nunca no frontmatter:
 *
 *   > **p.45-52** — Aqui o personagem revela o segredo.
 *
 * Mesma filosofia dos wikilinks e das tags: dado derivado do conteúdo,
 * não um campo novo de metadados.
 */

export interface PageMarker {
  /** Página inicial (menor número do intervalo). */
  start: number;
  /** Página final; igual a `start` quando a marcação é de uma página só. */
  end: number;
  text: string;
  /** Linhas originais do bloco, para edição crua. */
  raw: string;
}

const HEADER = /^>\s*\*\*\s*p\.\s*(\d+)\s*(?:[-\u2013\u2014]\s*(\d+))?\s*\*\*\s*(?:[\u2014\u2013:-]\s*)?(.*)$/i;
const QUOTE = /^>\s?(.*)$/;

/** Extrai todas as marcações de página do corpo de uma nota. */
export function parsePageMarkers(body: string): PageMarker[] {
  const lines = (body ?? '').split('\n');
  const markers: PageMarker[] = [];
  let current: PageMarker | null = null;

  const flush = () => {
    if (current) {
      markers.push(current);
      current = null;
    }
  };

  for (const line of lines) {
    const header = line.match(HEADER);
    if (header) {
      flush();
      const a = parseInt(header[1], 10);
      const b = header[2] ? parseInt(header[2], 10) : a;
      current = {
        start: Math.min(a, b),
        end: Math.max(a, b),
        text: (header[3] ?? '').trim(),
        raw: line,
      };
      continue;
    }

    const quote = line.match(QUOTE);
    if (quote && current) {
      const extra = quote[1].trim();
      if (extra) current.text = current.text ? `${current.text}\n${extra}` : extra;
      current.raw += `\n${line}`;
      continue;
    }

    if (current) flush();
  }

  flush();
  return markers;
}

/** Serializa uma marcação no formato canônico do corpo. */
export function formatPageMarker(marker: { start: number; end?: number; text: string }): string {
  const start = Math.max(1, Math.floor(marker.start));
  const end = marker.end && marker.end !== start ? Math.max(start, Math.floor(marker.end)) : start;
  const range = end !== start ? `p.${start}-${end}` : `p.${start}`;
  return `> **${range}** \u2014 ${marker.text.trim()}`;
}

/** Anexa uma marcação ao final do corpo, preservando o resto. */
export function appendPageMarker(
  body: string,
  marker: { start: number; end?: number; text: string }
): string {
  const block = formatPageMarker(marker);
  const trimmed = (body ?? '').replace(/\s+$/, '');
  return trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;
}

/** Marcações ordenadas por página inicial (para exibição). */
export function sortPageMarkers(markers: PageMarker[]): PageMarker[] {
  return [...markers].sort((a, b) => a.start - b.start || a.end - b.end);
}