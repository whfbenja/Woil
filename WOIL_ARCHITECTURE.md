# WOIL Architecture

Version: 1.0
Status: Foundation

## 1. Overview

Woil is a local-first PKM application built with React Native + Expo.

### Core Principles

- Local-first: user owns their data
- Markdown as source of truth
- Mobile-first (Android)
- Extensible (agents, MCP, sync)

### Technology Stack

- React Native (Expo)
- TypeScript
- expo-file-system (file operations)
- expo-crypto (UUID generation)
- js-yaml (frontmatter parsing)

## 2. Layer Architecture

```
┌─────────────────────────────────────────────────┐
│                  UI Layer                        │
│              (React Components)                  │
├─────────────────────────────────────────────────┤
│               Application Layer                  │
│              (NoteService, etc.)                 │
├─────────────────────────────────────────────────┤
│               Domain Layer                       │
│           (Note, Index, Repositories)            │
├─────────────────────────────────────────────────┤
│            Infrastructure Layer                  │
│         (FileSystem, FileNoteRepository)         │
├─────────────────────────────────────────────────┤
│                 Filesystem                       │
│             (Markdown files)                     │
└─────────────────────────────────────────────────┘
```

## 3. Core Components

### FileSystem

- `ExpoFileSystem` implements file operations
- Abstraction for read/write/list/delete
- Uses expo-file-system under the hood

### NoteRepository

- `FileNoteRepository` implements NoteRepository interface
- Stores notes as `.md` files in vault directory
- Handles serialization/deserialization
- Manages frontmatter, content, and metadata

### Note

Domain entity representing a note:
- `id`: stable UUID
- `title`: string
- `content`: raw Markdown
- `frontmatter`: Record<string, unknown>
- `tags`: string[]
- `wikilinks`: string[]
- `metadata`: { created, updated }

### Parsers

- `FrontmatterParser`: YAML frontmatter extraction
- `WikilinkParser`: extraction of `[[links]]`
- `TagParser`: extraction of `#tags`

### Index

- `NoteIndex`: in-memory search index
- Supports search by title, content, tags
- No embeddings, purely text-based

### NoteService

- Orchestrates repository and index
- Provides CRUD operations
- Handles search

## 4. Data Flow

### Create Note

1. UI calls `NoteService.createNote()`
2. Service generates ID and timestamp
3. Service builds frontmatter and content
4. Repository writes `.md` file to vault
5. Index updates

### Search

1. UI calls `NoteService.search(query)`
2. Service queries Index for matches
3. Service fetches full notes from Repository
4. Returns Notes

## 5. Future Extensibility

### Agents

Agents will interact through a `ToolContract`:
- `read_note(id)`
- `write_note(id, content)`
- `search(query)`
- `list_backlinks(id)`
- `graph_neighbors(id)`

### Sync

Synchronization will operate on the filesystem layer or repository layer.

### Desktop

Desktop version will use the same core but with a different UI (workspace layout).

## 6. Error Handling

- File operations: fail gracefully with error messages
- Parser errors: treat as empty frontmatter, continue
- Missing files: return null, not throw

## 7. Testing Strategy

- Unit tests for: FileSystem, Parsers, Index, NoteRepository
- Integration tests for: NoteService
- Manual testing on Android device

## 8. Performance Considerations

- Index is built in memory on load
- Search is O(n) over all notes (fine for small vaults)
- Large vaults may need optimization (e.g., SQLite FTS5)

## 9. Security

- No network requests for core functionality
- Filesystem permissions handled by Expo
- User data stays on device