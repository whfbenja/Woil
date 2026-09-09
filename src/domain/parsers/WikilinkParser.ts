const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

export function parseWikilinks(content: string): string[] {
  const matches = content.matchAll(WIKILINK_REGEX);
  const links: string[] = [];
  for (const match of matches) {
    links.push(match[1].trim());
  }
  return links;
}