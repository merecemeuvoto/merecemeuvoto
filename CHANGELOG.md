# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versão: SemVer do site
(`package.json` e tag `v<versão>`). Datas em UTC. Antes da `v1.0.0`, tudo é pré-lançamento.

## [Não lançado]

### Adicionado

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
