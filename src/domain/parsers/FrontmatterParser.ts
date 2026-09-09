import yaml from 'js-yaml';

const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/;

export function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  try {
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
    const body = content.replace(match[0], '');
    return { frontmatter: frontmatter || {}, body };
  } catch {
    // If YAML is invalid, discard the frontmatter block and treat the rest as body
    const body = content.replace(match[0], '');
    return { frontmatter: {}, body };
  }
}

export function serializeFrontmatter(frontmatter: Record<string, unknown>): string {
  if (Object.keys(frontmatter).length === 0) return '';
  return `---\n${yaml.dump(frontmatter)}---\n`;
}