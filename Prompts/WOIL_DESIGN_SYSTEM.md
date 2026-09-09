# WOIL --- DESIGN SYSTEM v1.0

> **Two elements. One place. Infinite possibilities.**

**Status:** Base visual specification\
**Version:** 1.0\
**Platform priority:** Android / Mobile-first\
**Desktop:** Workspace-oriented\
**Brand concept:** Water + Oil\
**Primary principle:** Clarity over decoration

------------------------------------------------------------------------

## 1. Propósito

O Woil é um ambiente de conhecimento pessoal inspirado em PKM, com
Markdown local-first e uma arquitetura preparada para integração nativa
com agentes de IA.

A identidade visual deve comunicar conhecimento, organização,
profundidade, tecnologia, controle do usuário, fluidez, estrutura,
sofisticação e longevidade.

O Woil **não deve parecer um dashboard genérico de SaaS nem uma
interface de IA**. Deve parecer uma ferramenta profissional que alguém
poderia usar durante horas para pensar, escrever, pesquisar e organizar
conhecimento.

## 2. Conceito --- WATER + OIL

**Water + Oil** representa duas coisas que coexistem sem perder sua
identidade.

No produto, isso simboliza: - conhecimento e estrutura; - conteúdo e
metadados; - humano e agente; - criatividade e desenvolvimento; -
elementos diferentes trabalhando no mesmo ambiente.

A metáfora deve ser sutil. Não usar gotas, óleo escorrendo, ondas
decorativas ou gradientes azul/dourado como linguagem recorrente.

Usar a ideia por meio de camadas, contraste, superfícies, separações,
hierarquia e movimento discreto.

## 3. Direção estética

### Dark Knowledge Workspace

A interface combina a sensação de: - ferramenta PKM; - editor
profissional; - ambiente técnico; - biblioteca digital; - workspace de
produtividade.

Palavras-chave:

**Dark · Technical · Calm · Structured · Deep · Fluid · Premium ·
Human**

### Regras

-   Conteúdo vem antes da decoração.
-   Não usar estética genérica de IA.
-   Neon não faz parte da linguagem principal.
-   Gradientes multicoloridos não fazem parte da identidade.
-   Evitar glassmorphism excessivo.
-   Evitar cards gigantes e excesso de elementos arredondados.
-   Animações só devem existir quando melhorarem orientação, feedback ou
    compreensão.

## 4. Paleta oficial

### Fundos

  Token                  Hex         Uso
  ---------------------- ----------- --------------------------------
  Background Primary     `#080B10`   fundo geral e workspace
  Background Secondary   `#0D141B`   navegação e áreas secundárias
  Surface                `#111A22`   cards, menus, painéis e sheets
  Border                 `#1D2A33`   bordas e divisores

### Texto

  Token            Hex         Uso
  ---------------- ----------- -----------------------------------
  Text Primary     `#E8F0F5`   títulos e conteúdo
  Text Secondary   `#8796A3`   metadata e informações auxiliares

### Identidade

  Token       Hex         Conceito
  ----------- ----------- -----------------------------------------------
  Water       `#39C6E8`   fluxo, conhecimento, links e interação
  Oil         `#C99A52`   estrutura, propriedades e informação especial
  Auxiliary   `#38A89D`   sucesso, sincronização e estados positivos

### Regra 70 / 20 / 10

-   **70%:** fundos, superfícies e neutros.
-   **20%:** Water.
-   **10% ou menos:** Oil e cores de estado.

Na prática, Oil deve aparecer menos que isso quando possível.

### Regra crítica

**Não usar Water + Oil em gradiente.**

O contraste entre as duas cores faz parte do conceito.

## 5. Water

`#39C6E8`

Representa: - fluxo; - conhecimento; - links; - descoberta; -
interação; - movimento.

Usar principalmente em: - foco; - seleção; - links; - ações primárias; -
indicadores; - progresso; - conexões relevantes.

Preferir linhas, pequenos indicadores, ícones, texto contextual e
backgrounds de baixa intensidade.

Evitar grandes superfícies totalmente azuis.

O azul deve ser elegante e aquático, não cyberpunk.

## 6. Oil

`#C99A52`

Representa: - estrutura; - propriedades; - organização; - metadata; -
transformação.

Usar com extrema moderação.

O âmbar deve continuar especial. Não deve ser usado como cor decorativa
em todos os componentes.

## 7. Tipografia

### Interface

Preferência: **Inter** ou **Geist**.

### Técnica

**JetBrains Mono** para: - código; - caminhos; - identificadores; -
comandos; - informações técnicas.

Não usar monospace apenas para criar aparência tecnológica.

## 8. Formas, bordas e elevação

Usar cantos arredondados de forma controlada.

Preferir: - pequenos arredondamentos; - campos discretamente
arredondados; - cards com raio moderado; - sheets mais arredondados
quando fizer sentido.

Evitar transformar tudo em pílulas.

Bordas devem ser discretas, normalmente `#1D2A33`.

Elevação deve indicar hierarquia, não criar um efeito 3D.

## 9. Ícones

Preferir ícones: - lineares; - simples; - consistentes; - pequenos; -
reconhecíveis.

Evitar ícones 3D, excesso de detalhes e emojis como ícones principais.

## 10. Mobile

**Mobile = conteúdo.**

A interface deve ser nativa para toque e leitura, não um desktop
reduzido.

A navegação pode utilizar a linguagem:

-   Surface;
-   Drops;
-   Dive;
-   criação;
-   More.

Quando necessário, usar nome conceitual + função:

**Dive --- Search**\
**Ocean --- Graph**\
**Catalysts --- Agents**

O contexto estrutural deve aparecer sob demanda, por exemplo em bottom
sheets.

## 11. Desktop

**Desktop = workspace.**

Estrutura-base:

``` text
┌──────────┬──────────────────────────────┬──────────────┐
│   NAV    │          WORKSPACE           │   CONTEXT    │
│          │                              │              │
│          │       conteúdo/editor        │ properties   │
│          │                              │ links        │
│          │                              │ metadata     │
└──────────┴──────────────────────────────┴──────────────┘
```

### Navigation

Navegação, vault, favoritos e descoberta.

### Workspace

Conteúdo principal.

### Context

Properties, links, backlinks e metadata.

O painel Context deve poder ser recolhido.

## 12. Water Layer / Oil Layer

### Water Layer

-   conteúdo;
-   notas;
-   links;
-   pesquisa;
-   ideias;
-   conexões;
-   descoberta.

### Oil Layer

-   properties;
-   metadata;
-   tags;
-   estrutura;
-   classificação;
-   organização.

A separação deve aparecer através de painéis, divisores, hierarquia e
contraste --- nunca por ilustrações literais.

## 13. Nomenclatura visual

A identidade de nomes acompanha Water + Oil, mas **clareza sempre vence
metáfora**.

### Water

-   **Surface** --- entrada/início
-   **Drops** --- notas
-   **Flow** --- Daily Notes
-   **Dive** --- busca
-   **Streams** --- links
-   **Currents** --- backlinks
-   **Ocean** --- Graph
-   **Echoes** --- áudio
-   **Catch** --- captura web

### Oil

-   **Layers** --- propriedades
-   **Marks** --- tags
-   **Molds** --- templates
-   **Essence** --- metadata
-   **Library** --- livros
-   **Volumes** --- livros individuais
-   **Works** --- projetos
-   **Trace** --- timeline
-   **Reservoirs** --- bases/coleções estruturadas

### Catalysts

-   **Catalysts** --- agentes
-   **Bridges** --- conexões com agentes externos
-   **Reactions** --- ações/resultados de agentes

Sempre que um nome conceitual puder prejudicar a compreensão, usar nome
conceitual + descrição funcional.

## 14. Ocean / Graph

O Graph deve ser tratado como uma área de alta densidade informacional.

**Não tentar mostrar tudo ao mesmo tempo.**

Priorizar: - contexto; - legibilidade; - relações relevantes; -
hierarquia.

Evitar: - centenas de linhas simultâneas; - partículas; - animação
constante; - brilho; - nós excessivamente coloridos; - neon.

Possíveis modos futuros: - contexto da nota; - vizinhança; - links
diretos; - mapa global.

O objetivo é entender relações, não impressionar.

## 15. Animações

Animações devem ser: - rápidas; - suaves; - previsíveis; - funcionais.

Usar para: - navegação; - abertura de painéis; - criação; - seleção; -
feedback; - atualização; - estados do agente; - Graph.

Evitar backgrounds animados constantemente.

### Linguagem de movimento

**Water:** movimento fluido e contínuo.

**Oil:** movimento discreto e firme.

A diferença deve ser sutil.

## 16. Agentes

Agentes não devem dominar a interface.

O Woil é primeiro um ambiente de conhecimento. O agente é um
**Catalyst**.

Estados: - Idle; - Working; - Waiting; - Permission required; -
Completed; - Error.

Indicadores devem ser discretos.

Evitar chatbot gigante permanente.

## 17. Componentes-base

Todos os componentes devem compartilhar o mesmo sistema visual.

-   Button
-   IconButton
-   Input
-   Search
-   Chip
-   Tag
-   Card
-   ListItem
-   Navigation
-   BottomSheet
-   Modal
-   Tabs
-   PropertyRow
-   NoteHeader
-   Editor
-   AgentIndicator
-   Toast
-   EmptyState
-   LoadingState

Não criar estilos independentes para cada tela.

## 18. Estados

Componentes interativos devem considerar: - default; - pressed; -
focused; - selected; - disabled; - loading; - success; - warning; -
error.

Não depender exclusivamente de cor para comunicar estado.

## 19. Acessibilidade

Garantir: - contraste adequado; - áreas de toque confortáveis; - texto
legível; - feedback claro; - labels compreensíveis; - suporte a tamanhos
maiores quando possível.

## 20. Design tokens

Centralizar os valores visuais.

Exemplo:

``` ts
colors.background.primary
colors.background.secondary
colors.surface
colors.border
colors.text.primary
colors.text.secondary
colors.water
colors.oil
colors.success
```

Componentes não devem espalhar hexadecimais diretamente pelo código.

## 21. Evolução

Este documento é a base visual do Woil, não uma prisão.

Durante o desenvolvimento:

1.  implementar;
2.  testar no Android;
3.  observar problemas reais;
4.  corrigir;
5.  testar novamente;
6.  atualizar este documento quando uma decisão visual se tornar
    definitiva.

Mudanças devem preservar identidade, clareza, consistência,
acessibilidade e a filosofia Water + Oil.

## 22. Critério final

Antes de considerar uma tela pronta:

### Identidade

-   Parece Woil?
-   A paleta está sendo usada com contenção?
-   Existe excesso de neon?

### Clareza

-   A tela é compreensível rapidamente?
-   O conteúdo está acima da decoração?
-   Os nomes são compreensíveis?

### Consistência

-   Os componentes pertencem ao mesmo produto?
-   Os tokens estão sendo usados?
-   Mobile e desktop parecem partes do mesmo sistema?

### Sofisticação

-   Existem efeitos desnecessários?
-   Parece um produto profissional?
-   Parece uma interface genérica gerada por IA?

### Filosofia

-   Water + Oil aparece de forma sutil?
-   A separação entre conteúdo e estrutura é perceptível?
-   A metáfora ajuda ou apenas decora?

## 23. Regra final

> **Woil não deve tentar impressionar nos primeiros cinco segundos. Deve
> continuar parecendo bom depois de cinco horas de uso.**

A interface deve ser:

**quieta o suficiente para pensar,\
estruturada o suficiente para trabalhar,\
profunda o suficiente para explorar.**

------------------------------------------------------------------------

# Resumo de identidade

**WOIL**\
**Water + Oil**\
**Dark Knowledge Workspace**

`#080B10` --- Background\
`#0D141B` --- Secondary\
`#111A22` --- Surface\
`#1D2A33` --- Border\
`#E8F0F5` --- Text\
`#8796A3` --- Secondary text\
`#39C6E8` --- Water\
`#C99A52` --- Oil\
`#38A89D` --- Auxiliary

**Inter / Geist** --- Interface\
**JetBrains Mono** --- Technical

**Mobile-first.**\
**Desktop as workspace.**\
**No neon aesthetic.**\
**No generic AI aesthetic.**\
**Water and Oil coexist without visually blending.**

> **Construa uma interface que pareça uma ferramenta, não uma
> demonstração de efeitos.**
