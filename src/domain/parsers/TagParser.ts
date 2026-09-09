const TAG_REGEX = /#([a-zA-Z0-9_\-]+)/g;

export function parseTags(content: string): string[] {
  const matches = content.matchAll(TAG_REGEX);
  const tags: string[] = [];
  for (const match of matches) {
    tags.push(match[1]);
  }
  return tags;
}