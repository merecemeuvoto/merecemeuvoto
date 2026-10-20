// Trava de mensagem: Conventional Commits 1.0.0, descrição em português, escopo obrigatório.
const config = {
  extends: ["@commitlint/config-conventional"],
  // Commits do Dependabot vêm no formato dele («Bump …», corpo com linhas longas) e passam pela
  // revisão do PR, não por esta trava. A assinatura é a do próprio bot.
  ignores: [
    (mensagem) => /^Signed-off-by: dependabot\[bot\] <support@github\.com>$/m.test(mensagem),
  ],
  rules: {
    "header-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 72],
    "scope-empty": [2, "never"],
    "scope-enum": [
      2,
      "always",
      ["site", "ui", "dados", "conteudo", "ds", "infra", "ci", "docs", "scripts", "deps"],
    ],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "docs",
        "chore",
        "ci",
        "revert",
        "test",
        "style",
        "perf",
        "build",
      ],
    ],
  },
};

export default config;
