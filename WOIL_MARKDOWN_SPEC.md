# WOIL Markdown Specification

Version: 1.0
Status: Foundation

## 1. File Format

Notes are stored as plain text files with the `.md` extension.

Each note MUST contain:
- Optional Frontmatter (YAML) at the top, delimited by `---`
- Markdown content

## 2. Frontmatter

Frontmatter is YAML-formatted metadata at the beginning of the file.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Stable UUID (v4) |
| `title` | string | Note title |
| `created` | string | ISO 8601 date (YYYY-MM-DD) |
| `updated` | string | ISO 8601 date (YYYY-MM-DD) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `tags` | array of strings | Tags for classification |
| `type` | string | Note type (e.g., `note`, `book`, `project`) |
| Any custom property | any | User-defined metadata |

### Example

```yaml
---
id: 550e8400-e29b-41d4-a716-446655440000
title: My Note
created: 2026-09-09
updated: 2026-09-09
tags:
  - development
  - woil
type: note
---
```

## 3. Markdown Content

Standard Markdown with the following extensions:

### Wikilinks

Internal links between notes are written as `[[Note Title]]` or `[[note-id]]`.

The parser MUST extract all wikilinks from the content.

### Tags

Inline tags are written as `#tag-name` (alphanumeric, underscore, hyphen).

The parser MUST extract all tags from the content.

### Supported Markdown

- Headers (`#`, `##`, `###`)
- Lists (ordered, unordered)
- Emphasis (`*italic*`, `**bold**`)
- Links (`[text](url)`)
- Images (`![alt](url)`)
- Code blocks (```)
- Inline code (`` ` ``)
- Blockquotes (`>`)
- Horizontal rules (`---`)

## 4. File Naming

Files are named using their stable ID: `<id>.md`.

The title is stored in frontmatter, NOT derived from the filename.

## 5. Assets

Assets (images, attachments) are stored in a `_assets/` directory relative to the vault root.

References in notes: `![alt](_assets/image.png)`

## 6. Vault Structure

```
vault/
├── <id>.md
├── <id>.md
├── ...
└── _assets/
    ├── image.png
    └── ...
```

## 7. Parsing Rules

1. Frontmatter is parsed as YAML.
2. If frontmatter is invalid, treat as empty and continue.
3. Tags are extracted from both frontmatter (`tags`) and inline content.
4. Wikilinks are extracted from content.
5. Metadata (`created`, `updated`) are taken from frontmatter or generated.

## 8. Future Extensions

- Embedded audio (`![[audio.mp3]]`)
- Embedded video
- Dataview-style queries
- Custom frontmatter schemas