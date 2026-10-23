# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versão: SemVer do site
(`package.json` e tag `v<versão>`). Datas em UTC. Antes da `v1.0.0`, tudo é pré-lançamento.

## [0.1.0-beta.1] — 2026-10-23

### Adicionado

- Comparador por cadernos na página inicial, em versão beta: um caderno por vez, em dois grupos
  (plano de governo · histórico pessoal), com as candidaturas às cegas (A e B, posição sorteada a
  cada visita, «Ver quem é quem» para revelar), pares de trechos e a pergunta «¿Qual pesa mais
  para você?» — A, igual, B ou nenhuma — na régua de cada par; placar só no fim ou a pedido, e só
  neste navegador. Vem do estudo `docs/simulacoes/comparador-por-cadernos.html` (alpha.8):
  `components/comparador/fragmento.html`, `public/comparador/logica.js` e `app/comparador.css`.
- 33 trechos no ar em `dados/fatos.json`: Economia, Saúde, Educação, Segurança, Meio ambiente e
  clima e Relações exteriores (quatro por caderno, dos planos de governo registrados no TSE, com a
  página do PDF em cada fonte) e Histórico na Justiça (nove marcos, com fonte primária ou dois
  veículos independentes). Trabalho e projetos, Falas públicas e Relações nascem vazios, com o
  critério editorial na nota.
- Status `beta` no esquema e no validador: trecho buscado e revisado por IA, com `revisado_por`
  «ia» e `buscado_em`, só no ar com fonte primária ou dois veículos independentes, e sem
  conferência humana (conferido, vira `publicado`). Campos `ordem`, `etiqueta`, `tags` e
  `anonimo` na fonte; `afirmacao` até 800 caracteres; o validador reprova nome de candidato ou de
  partido no texto no ar (leitura às cegas).
- Carimbo BETA no alto da página, que explica ao toque e ao passar o mouse que os trechos foram
  buscados e revisados por IA e ainda não conferidos por uma pessoa, e quando a conferência vem;
  o ponto laranja em cada trecho diz o mesmo. A `/quem-faz` passa a dizer isso enquanto o beta
  durar.
- Fotos oficiais das candidaturas (TSE) em `public/fotos/`, mostradas só depois de «Ver quem é
  quem».
- O livro que abre e fecha (estudo alpha.9): o caderno começa fechado, na metade direita, com a
  frase de abertura na esquerda e o botão «Abrir o caderno»; «Próximo caderno» fecha o lado
  direito para a esquerda mostrando a contracapa «Em progresso», revela a capa do seguinte e a
  abre; «anterior» faz o espelho; no celular as viradas são no lugar. O menu «⋯» vira um sininho
  de balcão dourado que abre o cardápio, uma folha que desliza da lateral direita.
- Tokens `--mmv-papel-nota`, `--mmv-papel-caderno`, `--mmv-aviso`, `--mmv-raio` e
  `--mmv-raio-grande` em `app/globals.css`.
- Conferência humana no esquema: `conferido_por` e `conferido_em`, obrigatórios em fato
  publicado; o validador reprova a falta deles e a conferência anterior à última edição.
- Tokens públicos com prefixo `--mmv-` em `app/globals.css`: cor, movimento e a luz da janela
  (picos e vai-vem), espelhados em `docs/identidade.md`.
- Simulação de referência da luz da janela em `docs/simulacoes/luz-da-janela.html`.

- Licenças: código sob AGPL-3.0-or-later (`LICENSE`), dados sob CC BY 4.0 (`dados/LICENSE`) e a
  fonte Bitter sob a SIL Open Font License 1.1 (`app/fonts/OFL.txt`).
- Action `espelhar publico`: a cada push na `main` e a cada tag `v*`, espelha a árvore dos
  bastidores, sem `docs/`, `.claude/`, `CLAUDE.md` e as Actions internas, no repositório
  público, e `.vercelignore` com os mesmos caminhos internos.

### Mudado

- Paleta para a saída A3.3: papel `#F3E9D8`, creme `#EBDFCA`, café `#834A16`, café-escuro
  `#753F09`, leite `#D6B59E` no lugar do caramelo, pedra `#5A5348`, linha `#DBCDB7`.
- Anel de foco em café, no lugar do caramelo (2,0:1 sobre papel).
- Aviso de IA da `/quem-faz` inclui a redação.
- Rótulos de `dados/temas.json` encurtados para a estante (Economia, Segurança) e os temas ganham
  `grupo` e `nota`; «Trabalho e renda» vira «Trabalho e projetos», do grupo histórico.
- Rodapé com o lema «Ninguém chega aqui errado; chega com mais a descobrir».
- Convenções 0.1.0-alpha.8: o sorteio da posição A/B na tela é a exceção sancionada à ordem
  alfabética, que segue nos dados e no código.
- Descrição do site nos metadados: planos e histórico às cegas, com a fonte em cada trecho.

### Removido

- Os cards em React do comparador da fase 1 (`components/Comparador.tsx`) e o CSS deles: o
  comparador por cadernos os substitui.

## [0.1.0-alpha.3] — 2026-10-19

### Adicionado

- Página `/quem-faz` no ar, com o responsável, a posição de quem assina, o aviso de IA e o
  contato do projeto.

## [0.1.0-alpha.2] — 2026-10-19

### Adicionado

- `app/robots.ts`, no lugar do `public/robots.txt`, com o sitemap no domínio certo.

### Mudado

- A URL pública de metadados, Open Graph, sitemap e robots vem de `lib/site.ts`: o domínio de
  produção que o Vercel informa no build, até haver domínio próprio, sem mudança de código.
- Node 24.x fixado no `engines`, no `.nvmrc` e, por ele, na CI; `@types/node` na 24.
- Actions na v7 (checkout, setup-node, setup-python).
- `typecheck` roda `next typegen` antes do `tsc`; `next-env.d.ts` sai do Git; o `next dev` não
  cria mais `AGENTS.md`.

### Corrigido

- `/quem-faz` responde 404 e some do início e do sitemap enquanto não houver responsável
  definido.

## [0.1.0-alpha.1] — 2026-10-18

### Adicionado

- Esqueleto do repositório: Next.js 16 (App Router), TypeScript, ESLint, Prettier, commitlint.
- Página «em construção» (fase 0), `/quem-faz`, `not-found`, sitemap, cabeçalhos de segurança,
  fonte Bitter servida do próprio site.
- Camada de dados: `dados/fatos.json`, `candidatos.json`, `temas.json`, esquema JSON e
  `lib/fatos.ts`.
- Trava de conteúdo: `scripts/validar_dados.py` (fonte obrigatória, neutralidade, esquema,
  datas) com 15 testes; hooks locais; workflows de commitlint, validação e testes.
- Política de segurança (`SECURITY.md`).
- Modelos de issue (fato errado, fonte melhor, bug), modelo de PR e CODEOWNERS.
