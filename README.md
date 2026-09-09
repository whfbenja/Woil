# Woil

> **Two elements. One place. Infinite possibilities.**

**Woil** é um PKM (Personal Knowledge Management) **local-first** para Android, construído com Expo + React Native. Suas notas vivem como arquivos Markdown no seu dispositivo — sem nuvem, sem lock-in, pronto para agentes de IA.

Conceito visual: **Water + Oil** — conhecimento e estrutura, humano e agente, coexistindo no mesmo ambiente sem perder identidade.

---

## ✨ Princípios

| Princípio | O que significa na prática |
|---|---|
| **Local-first** | Seus dados são seus. Nada sai do aparelho. |
| **Markdown como fonte da verdade** | Cada nota é um arquivo `.md` — legível por qualquer editor, portátil para sempre. |
| **Mobile-first** | Android primeiro (Termux-friendly), desktop depois. |
| **Extensível** | Arquitetura preparada para agentes (Catalysts), MCP, busca semântica e sync. |

## 🏗️ Arquitetura

Camadas limpas, dependências apontando para dentro:

```
┌─────────────────────────────────────────┐
│              UI Layer                   │  React Native (lista, edição, Dive/busca)
├─────────────────────────────────────────┤
│          Application Layer              │  NoteService (CRUD + busca)
├─────────────────────────────────────────┤
│             Domain Layer                │  Note · Index · Repository interfaces
│   Parsers: Frontmatter · Tags · Wikilinks│
├─────────────────────────────────────────┤
│         Infrastructure Layer            │  ExpoFileSystem · FileNoteRepository
├─────────────────────────────────────────┤
│              Filesystem                 │  vault/ → <id>.md + _assets/
└─────────────────────────────────────────┘
```

- **Note** — entidade central: `id` (UUID estável), `title`, `content`, `frontmatter`, `tags`, `wikilinks`, `metadata`.
- **Parsers** — extraem YAML frontmatter (`js-yaml`), tags `#hashtag` e links `[[wikilink]]`.
- **Index** — índice de busca em memória (título, conteúdo, tags). Sem embeddings, 100% offline.
- **FileNoteRepository** — persistência: cada nota é `<id>.md`, nomeado pelo ID, nunca pelo título.

Documentação completa: [WOIL_ARCHITECTURE.md](WOIL_ARCHITECTURE.md) · [WOIL_MARKDOWN_SPEC.md](WOIL_MARKDOWN_SPEC.md) · [Design System](Prompts/WOIL_DESIGN_SYSTEM.md)

## 📝 Formato da nota

```markdown
---
id: 550e8400-e29b-41d4-a716-446655440000
title: Minha Nota
created: 2026-09-09
updated: 2026-09-09
tags:
  - desenvolvimento
  - woil
type: note
---

Conteúdo em Markdown com [[wikilinks]] e #tags.
```

## 🚀 Começando

### Requisitos
- Node.js 20+ (funciona no Termux/Android sem root)
- Conta Expo (gratuita) para builds em nuvem

### Desenvolvimento

```bash
npm install
npm start            # Expo dev server
# ou
npm run android      # expo run:android (requer Android SDK local)
```

### Testes

```bash
npx jest             # 10 testes: parsers + índice
```

### Build (EAS — recomendado no Android/Termux)

```bash
export EXPO_TOKEN=***   # https://expo.dev/settings/access-tokens
eas build --platform android --profile preview    # APK interno
eas build --platform android --profile production # AAB para loja
```

O build roda na nuvem da Expo — não precisa de Java nem de gigabytes livres no aparelho.

## 🎨 Identidade visual

- **Dark Knowledge Workspace** — técnica, calma, profunda, premium.
- Paleta: fundo `#080B10`, superfície `#111A22`, borda `#1D2A33`.
- **Water** `#39C6E8` (água/estrutura) · **Oil** `#C99A52` (óleo/conteúdo) — regra 70/20/10.
- Conteúdo antes da decoração: sem neon, sem gradiente multicolorido, sem glassmorphism.

Tokens implementados em [`src/tokens/colors.ts`](src/tokens/colors.ts).

## 🧭 Roadmap

- [x] **Fundação** — notas locais: criar, editar, excluir, buscar (Dive)
- [ ] Backlinks e grafo de vizinhos
- [ ] Catalysts (agentes) via `ToolContract`: `read_note`, `write_note`, `search`, `list_backlinks`
- [ ] Busca semântica local (opcional, embeddings on-device)
- [ ] Sync criptografado entre dispositivos
- [ ] Versão desktop (workspace layout)

## ⚠️ Notas de plataforma (Termux)

- Build local com Gradle exige ~5 GB livres + JDK 17 — no Android sem root, **use EAS**.
- `metro.config.js` já vem com `watchFolders`/`blockList` ajustados para evitar `ENOSPC` no watcher de arquivos.

## 📄 Licença

[MIT](LICENSE)
