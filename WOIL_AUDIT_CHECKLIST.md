# Woil — Checklist de Auditoria e Varredura de Erros

> **Como usar este documento:** antes de reportar qualquer tarefa como concluída, o agente deve rodar TODAS as seções aplicáveis abaixo e reportar o resultado de cada uma — não pular etapas, não assumir que "deve estar funcionando". Marque cada item com ✅ (passou), ⚠️ (passou com ressalva) ou ❌ (falhou), e descreva o que encontrou. Se algo falhar, corrija antes de seguir para a próxima seção.

---

## 1. Sanidade de build e ambiente

- [ ] `npx expo start` inicia sem erro no console (sem exceptions vermelhas na primeira tela)
- [ ] `npx tsc --noEmit` roda sem erros de tipo (se o projeto usa TypeScript)
- [ ] `npx jest` — todos os testes existentes passam (liste quantos passaram/falharam)
- [ ] Nenhuma dependência nova foi adicionada sem necessidade real (checar `package.json` contra o que foi de fato importado no código)
- [ ] `git status` limpo antes de começar — nenhuma alteração não commitada de sessão anterior esquecida

---

## 2. Camada de Domínio (Note, NoteService, Repository, Parsers)

- [ ] Criar uma nota nova persiste um arquivo `.md` real no filesystem (não só em memória)
- [ ] O arquivo criado tem frontmatter YAML válido (abrir o arquivo gerado e conferir sintaxe)
- [ ] Editar uma nota existente sobrescreve o conteúdo sem duplicar o arquivo nem perder o frontmatter
- [ ] Deletar uma nota remove o arquivo do disco e atualiza qualquer índice em memória (busca, backlinks)
- [ ] Parser de frontmatter malformado não derruba o app — deve cair no comportamento definido (frontmatter vazio, conforme WOIL_ARCHITECTURE.md seção 6), não lançar exceção não tratada
- [ ] Wikilinks (`[[Nota]]`) são extraídos corretamente, inclusive quando: há mais de um link na mesma nota; o link aponta para uma nota que não existe ainda (não deve quebrar); há acentos/caracteres especiais no nome do link

---

## 3. Funcionalidade de UI — checagem literal, não visual

> Esta seção existe porque já tivemos bugs onde o elemento **parece** funcional mas não é. Teste cada interação de verdade, não assuma pelo layout.

- [ ] Todo `TextInput` na tela testada aceita digitação real (digite algo e confirme que o texto aparece)
- [ ] Todo botão visível tem `onPress`/`onClick` implementado — nenhum botão "decorativo" sem ação
- [ ] Botão Salvar persiste os dados corretos (abrir o arquivo `.md` gerado e conferir se o conteúdo digitado está lá)
- [ ] Botão Cancelar/Voltar descarta alterações sem persistir nada
- [ ] Navegação entre todas as abas da bottom navigation funciona (testar cada uma, não só a que foi alterada nesta sessão)
- [ ] Campos de busca retornam resultados reais ao digitar um termo existente, e estado vazio claro quando não há resultado
- [ ] Nenhum estado de loading fica "preso" (ex: spinner infinito se a operação falhar)
- [ ] Testar o app após fechar e reabrir — dados persistidos continuam lá (não é só estado de sessão em memória)

---

## 4. Conformidade com o Design System

- [ ] Cores usadas na tela correspondem exatamente aos tokens de `src/tokens/colors.ts` — nenhuma cor "hardcoded" fora da paleta (buscar por valores hex soltos no código da tela, ex: `#fff`, `#000`, cores não catalogadas)
- [ ] Tipografia segue o especificado em `Prompts/WOIL_DESIGN_SYSTEM.md` (família e pesos corretos, não a fonte padrão do sistema por engano)
- [ ] Componentes reutilizáveis (Card, Botão primário/secundário, Input, Header, Bottom Nav) são os componentes compartilhados já criados — não duplicações inline reimplementando o mesmo visual
- [ ] Espaçamento e raio de borda consistentes com o resto do app (comparar visualmente a tela nova com uma tela já validada, ex: Drops)
- [ ] Área de toque de botões/ícones tem no mínimo ~48dp (checar padding, não só o ícone visual)
- [ ] Estados vazios (sem notas, sem resultados de busca, sem backlinks) têm tratamento visual, não tela em branco

---

## 5. Dados e persistência

- [ ] Testar com vault vazio (zero notas) — app não quebra, mostra onboarding/estado vazio
- [ ] Testar com uma nota com frontmatter incompleto ou ausente — não derruba o app
- [ ] Testar caracteres especiais e emojis no título/conteúdo da nota — não corrompe o arquivo nem quebra o parser
- [ ] Testar nome de arquivo/nota com caracteres não permitidos em filesystem (`/`, `:`, etc.) — deve haver sanitização, não erro cru
- [ ] Confirmar que IDs de nota (UUID) não colidem nem são regenerados ao reabrir o app (identidade estável)

---

## 6. Performance básica (sem otimizar prematuramente, só sem regressão óbvia)

- [ ] Abrir o app com ~20-30 notas de teste não trava nem demora de forma perceptível
- [ ] Digitar em um TextInput de nota longa não engasga (sem lag perceptível a cada tecla)
- [ ] Navegar entre abas não recarrega/pisca a tela inteira desnecessariamente

---

## 7. Segurança e integridade (relevante desde já, mesmo sem Catalysts ativo)

- [ ] Nenhuma chamada de rede é feita nesta tela/feature, a menos que seja intencional e já aprovada (ex: Google Books API só na Library)
- [ ] Nenhuma chave de API, token ou segredo está hardcoded no código-fonte
- [ ] Inputs de usuário que viram nome de arquivo passam por sanitização antes de tocar o filesystem

---

## 8. Regressão — não quebrar o que já funcionava

- [ ] Reabrir todas as telas já implementadas em sessões anteriores (não só a tela alterada agora) e confirmar que continuam funcionais
- [ ] Rodar `npx jest` novamente ao final de tudo — comparar contagem de testes passando com o início da sessão (deve ser igual ou maior, nunca menor)
- [ ] Se algum teste existente foi alterado ou removido para "fazer passar", isso deve ser reportado explicitamente e justificado — nunca silenciado

---

## 9. Relatório final obrigatório

Ao final da varredura, o agente deve reportar um resumo neste formato:

```
RESUMO DA AUDITORIA
✅ Passou: [lista de seções]
⚠️ Ressalvas: [o quê, e por quê]
❌ Falhou: [o quê, causa raiz identificada, se foi corrigido ou não]

Testes automatizados: X passando / Y total (era Z antes desta sessão)
Novas dependências adicionadas: [lista ou "nenhuma"]
Arquivos alterados nesta sessão: [lista]
```

Este relatório deve vir **sempre**, mesmo quando tudo passou — é o que permite confiar no progresso sem precisar reconferir manualmente tela por tela.
