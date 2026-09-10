/**
 * FASE 2 do prompt da Library — marcações de página.
 * As marcações são derivadas do CORPO Markdown (blockquote), nunca do
 * frontmatter. Cobrimos: extração, intervalo de uma página, múltiplas
 * marcações, texto multilinha, ausência de marcações e round-trip.
 */
import {
  appendPageMarker,
  formatPageMarker,
  parsePageMarkers,
  sortPageMarkers,
} from '../src/domain/parsers/PageMarkerParser';

describe('PageMarkerParser', () => {
  it('extrai uma marcação de intervalo', () => {
    const body = '> **p.45-52** \u2014 Aqui o personagem revela o segredo.';
    const markers = parsePageMarkers(body);

    expect(markers).toHaveLength(1);
    expect(markers[0].start).toBe(45);
    expect(markers[0].end).toBe(52);
    expect(markers[0].text).toBe('Aqui o personagem revela o segredo.');
  });

  it('extrai marcação de página única (end === start)', () => {
    const markers = parsePageMarkers('> **p.12** \u2014 Frase marcante.');
    expect(markers).toHaveLength(1);
    expect(markers[0].start).toBe(12);
    expect(markers[0].end).toBe(12);
  });

  it('normaliza intervalo invertido (52-45 vira 45-52)', () => {
    const markers = parsePageMarkers('> **p.52-45** \u2014 trecho');
    expect(markers[0].start).toBe(45);
    expect(markers[0].end).toBe(52);
  });

  it('extrai múltiplas marcações no mesmo corpo', () => {
    const body = [
      'Resenha do livro.',
      '',
      '> **p.10-12** \u2014 Abertura forte.',
      '',
      'Texto solto no meio.',
      '',
      '> **p.200** \u2014 O final me pegou.',
      '',
    ].join('\n');

    const markers = parsePageMarkers(body);
    expect(markers).toHaveLength(2);
    expect(markers.map((m) => m.start)).toEqual([10, 200]);
    expect(markers[1].text).toBe('O final me pegou.');
  });

  it('junta continuação em blockquote na mesma marcação', () => {
    const body = [
      '> **p.30-31** \u2014 Primeira linha da anotação.',
      '> Segunda linha, continuação.',
      '> Terceira linha.',
    ].join('\n');

    const markers = parsePageMarkers(body);
    expect(markers).toHaveLength(1);
    expect(markers[0].text).toContain('Primeira linha');
    expect(markers[0].text).toContain('Terceira linha');
  });

  it('não quebra quando a nota não tem marcações', () => {
    expect(parsePageMarkers('')).toEqual([]);
    expect(parsePageMarkers('Só texto normal, sem blockquote.')).toEqual([]);
    expect(parsePageMarkers('> citação qualquer sem o padrão p.N')).toEqual([]);
    expect(parsePageMarkers('> **p.** \u2014 sem número')).toEqual([]);
  });

  it('ignora blockquote comum no meio das marcações', () => {
    const body = [
      '> **p.5-6** \u2014 anotação real',
      '> citação do livro (não é marcação)',
      '',
      '> **p.80** \u2014 outra anotação',
    ].join('\n');

    const markers = parsePageMarkers(body);
    expect(markers).toHaveLength(2);
    expect(markers[0].start).toBe(5);
    expect(markers[1].start).toBe(80);
  });

  it('formatPageMarker produz o formato canônico', () => {
    expect(formatPageMarker({ start: 45, end: 52, text: 'oi' })).toBe('> **p.45-52** \u2014 oi');
    expect(formatPageMarker({ start: 12, end: 12, text: 'oi' })).toBe('> **p.12** \u2014 oi');
    expect(formatPageMarker({ start: 12, text: 'oi' })).toBe('> **p.12** \u2014 oi');
  });

  it('appendPageMarker preserva o corpo e faz round-trip', () => {
    const original = 'Minha resenha.\n';
    const next = appendPageMarker(original, { start: 7, end: 9, text: 'trecho bom' });

    expect(next.startsWith('Minha resenha.')).toBe(true);
    const markers = parsePageMarkers(next);
    expect(markers).toHaveLength(1);
    expect(markers[0].start).toBe(7);
    expect(markers[0].end).toBe(9);
    expect(markers[0].text).toBe('trecho bom');
  });

  it('appendPageMarker funciona em corpo vazio', () => {
    const next = appendPageMarker('', { start: 1, text: 'começo' });
    expect(parsePageMarkers(next)).toHaveLength(1);
  });

  it('sortPageMarkers ordena por página', () => {
    const markers = parsePageMarkers(
      ['> **p.90** \u2014 b', '> **p.10** \u2014 a', '> **p.40** \u2014 c'].join('\n')
    );
    expect(sortPageMarkers(markers).map((m) => m.start)).toEqual([10, 40, 90]);
  });
});