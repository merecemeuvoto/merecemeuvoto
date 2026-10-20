#!/usr/bin/env bash
# Aponta os hooks do Git para a pasta versionada scripts/hooks. Rode uma vez por clone.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
chmod +x scripts/hooks/* scripts/*.py scripts/*.sh
git config core.hooksPath scripts/hooks
echo "hooks instalados: core.hooksPath=scripts/hooks"
