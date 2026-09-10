# Prompt — Implementação da aba Library (Livros)

## CONTEXTO
O Woil já tem: domínio de notas estável (NoteService, FileNoteRepository, parsers), Drops funcional com design system aplicado, Ocean/Backlinks implementados. Agora vamos implementar a aba Library (livros) — que é um tipo especializado de nota, não uma estrutura de dados paralela.

Trabalhe em fases, nesta ordem, sem pular etapas. Ao final de cada fase, rode a varredura completa de `Prompts/WOIL_AUDIT_CHECKLIST.md` e reporte no formato da Seção 9 antes de prosseguir para a próxima fase.

---

## FASE 1 — DIAGNÓSTICO (não altere nada ainda)

1. Confirme como o frontmatter tipado funciona hoje (existe algum `type: note` já usado? Como o parser lida com campos customizados além dos padrões?).
2. Confirme se há algum tratamento especial necessário para notas com `type` diferente de "note" na indexação/busca/backlinks já existentes, ou se tudo já é agnóstico ao tipo.
3. Reporte essas respostas antes de prosseguir para a Fase 2.

---

## FASE 2 — DOMÍNIO: SCHEMA DE LIVRO

Defina o frontmatter de uma nota do tipo livro:

```yaml
type: book
title: "Nome do livro"
author: "Autor"
cover_url: "https://..." # opcional, vem da API ou upload manual
isbn: "..."
status: "quero_ler" | "lendo" | "lido"
rating: 0-5 # permitir meio ponto, ex: 4.5
pages_total: 320
tags: [romance, clímax]
started_at: data # opcional
finished_at: data # opcional
```

- Marcações de página (ex: "da página 45 até 52, achei isso e isso") devem ser armazenadas como blocos dentro do corpo Markdown da própria nota, com uma convenção simples e parseável, por exemplo:

```
> **p.45-52** — Aqui o personagem revela o segredo. Achei o timing perfeito.
```

- Implemente um parser que reconhece esse padrão de bloco e consegue listá-los separadamente (para exibir como "marcações" na UI, sem exigir que o usuário edite frontmatter para isso).
- Adicione testes: nota tipo livro é criada com schema correto; marcações de página são extraídas corretamente do corpo; nota sem marcações não quebra o parser.

---

## FASE 3 — INTEGRAÇÃO COM GOOGLE BOOKS API

- Implemente uma função de busca que consulta a Google Books API (endpoint público, sem necessidade de API key para buscas básicas: `https://www.googleapis.com/books/v1/volumes?q=`) e retorna: título, autor, capa (thumbnail), ISBN, número de páginas.
- Essa busca deve ser opcional — o usuário também pode preencher os campos manualmente sem usar a API (ex: livro raro, sem capa disponível, ou sem internet no momento).
- Trate erro de rede/timeout de forma graciosa: se a API falhar, caia para preenchimento manual sem travar a tela.
- Não faça cache agressivo nem chamadas repetidas desnecessárias — buscar só quando o usuário digitar e confirmar (não a cada tecla).

---

## FASE 4 — UI: TELA LIBRARY (LISTAGEM)

Seguindo os componentes já estabelecidos no design system:

- Header com busca ("Buscar livros...")
- Filtros horizontais: Todos / Lendo / Lidos / Quero ler (usar o componente de chip/tab já usado em outras telas, ou criar um novo seguindo o mesmo padrão visual)
- Lista de livros como Cards: capa (thumbnail), título, autor, status, e para "lendo" mostrar progresso (ex: "72%", calculado por página atual se disponível, ou omitir se não houver essa granularidade ainda)
- Estado vazio: mensagem convidando a adicionar o primeiro livro
- Botão de adicionar livro (+) seguindo o padrão visual já usado em Drops

---

## FASE 5 — UI: TELA DE ADICIONAR/DETALHE DO LIVRO

- Campo de busca que consulta a API (Fase 3) e mostra resultados com capa+título+autor para o usuário selecionar, ou opção "adicionar manualmente" sempre visível
- Após selecionar/preencher, formulário com: status (seletor), avaliação (estrelas ou similar, 0-5 com meio ponto), tags
- Área de conteúdo livre em Markdown para resenha/anotações gerais do livro
- Seção separada para marcações de página: campo com número de página inicial/final + texto da anotação, que ao salvar é inserido no corpo da nota no formato definido na Fase 2
- Listagem das marcações já existentes, navegável/editável

---

## RESTRIÇÕES

- Não implemente conexão com outros leitores, comentários sociais ou qualquer feature de rede social — isso está fora de escopo (referência era só a UX de resenha do Skoob, não a parte social).
- Não implemente Catalysts nem qualquer chamada a LLM nesta rodada — a busca de livros usa a Google Books API diretamente via HTTP, sem passar por agente.
- Mantenha o padrão de nota (.md com frontmatter) como fonte da verdade — livro é uma nota tipada, não uma tabela separada.
- Ao final de tudo, rode a varredura completa do `WOIL_AUDIT_CHECKLIST.md` e reporte o resultado no formato da Seção 9.
