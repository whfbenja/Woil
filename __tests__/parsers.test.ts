import { parseFrontmatter } from '../src/domain/parsers/FrontmatterParser';
import { parseWikilinks } from '../src/domain/parsers/WikilinkParser';
import { parseTags } from '../src/domain/parsers/TagParser';

describe('FrontmatterParser', () => {
  it('parses valid frontmatter', () => {
    const content = `---\ntitle: Test\ncreated: 2026-09-09\n---\nHello world`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter.title).toBe('Test');
    expect(result.frontmatter.created).toBe('2026-09-09');
    expect(result.body).toBe('Hello world');
  });

  it('handles missing frontmatter', () => {
    const content = 'Hello world';
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('Hello world');
  });

  it('handles invalid YAML', () => {
    const content = `---\ninvalid: yaml: here\n---\nHello`;
    const result = parseFrontmatter(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('Hello');
  });
});

describe('WikilinkParser', () => {
  it('extracts wikilinks', () => {
    const content = 'See [[Note A]] and [[Note B]]';
    const links = parseWikilinks(content);
    expect(links).toEqual(['Note A', 'Note B']);
  });

  it('handles no wikilinks', () => {
    const content = 'No links here';
    const links = parseWikilinks(content);
    expect(links).toEqual([]);
  });
});

describe('TagParser', () => {
  it('extracts tags', () => {
    const content = '#dev #woil #test-123';
    const tags = parseTags(content);
    expect(tags).toEqual(['dev', 'woil', 'test-123']);
  });

  it('handles no tags', () => {
    const content = 'No tags here';
    const tags = parseTags(content);
    expect(tags).toEqual([]);
  });
});