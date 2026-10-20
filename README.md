# ¿Merece Meu Voto? — site

> A pausa antes do voto. Fatos dos dois finalistas lado a lado, com a fonte em cada card. Sem
> dizer em quem votar.

Código-fonte do site `merecemeuvoto.com.br` (Next.js) e dos dados de fatos (`dados/`) que ele
publica. Autoria: Gabriel Albrecht Fitarelli; o Claude, da Anthropic, é coautor.

## Fases

| Fase | Quando                        | O que                                                                                                     |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0    | no ar desde 18/out/2026       | página «em construção», estática                                                                          |
| 1    | até o 2º turno de 25/out/2026 | comparador de fatos com fonte em cada card; formulário «sugira um fato» com moderação; painel de cadastro |
| 2    | 2028 em diante                | muitos candidatos, feed de desmentidas, dados públicos com UX melhor, métodos de decisão                  |

## Rodar

```bash
npm ci
bash scripts/instalar_hooks.sh   # commitlint no commit-msg; validador de dados no pre-commit
npm run dev                      # http://localhost:3000
```

Checagens que a CI roda e que valem antes de pedir aprovação:

```bash
npm run lint && npm run typecheck && npm run build
npm run validar                  # python3 scripts/validar_dados.py — fonte, neutralidade, esquema
npm run testes                   # testes do validador, com fixtures descartáveis
```

## Estrutura

```
app/          páginas (App Router), fonte Bitter servida do próprio site
components/   Anel (marca de xícara) e Marca (assinatura textual provisória)
dados/        fatos.json, candidatos.json, temas.json, schema/ — a fonte dos cards
lib/          fatos.ts (dados em tempo de build), site.ts (URL pública), responsavel.ts (/quem-faz)
scripts/      validar_dados.py, hooks do Git, testes
.github/      modelos de issue e PR, CODEOWNERS, workflows
```

## Três regras que não se negociam

1. **Fato sem fonte não existe.** Toda afirmação tem ao menos uma fonte verificável, com link
   `https://` e data de acesso.
2. **O site não diz em quem votar.** Sem pedido de voto, sem adjetivo de valor, candidatos em
   ordem alfabética; `/quem-faz` identifica o responsável; conteúdo feito por IA leva aviso.
3. **Toda mudança passa por branch, PR e validador.** `main` é produção no Vercel.

## Infraestrutura

Vercel (projeto `merecemeuvoto`, plano Hobby) · Registro.br (`merecemeuvoto.com.br`) ·
Supabase e PostHog em organizações próprias do projeto, a partir da fase 1.
Segredos só em variáveis de ambiente; `.env.example` lista os nomes.

## Licença

- **Código**: [GNU AGPL-3.0 ou posterior](LICENSE).
- **Dados** (`dados/`): [Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)](dados/LICENSE).
- **Fonte Bitter** (`app/fonts/`): [SIL Open Font License 1.1](app/fonts/OFL.txt).
