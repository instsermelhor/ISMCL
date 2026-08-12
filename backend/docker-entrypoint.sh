#!/bin/bash
set -e

echo "[Aura Backend] 🚀 Iniciando container NestJS..."

if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "[Aura Backend] 🔄 Executando migrations do banco (npx prisma migrate deploy)..."
  npx prisma migrate deploy || {
    echo "[Aura Backend] ⚠️ Falha ao aplicar migrations! Verifique a conexão com o PostgreSQL."
    exit 1
  }
  echo "[Aura Backend] ✅ Migrations aplicadas com sucesso!"
else
  echo "[Aura Backend] ⏩ SKIP_MIGRATIONS=true — Ignorando execução de migrations."
fi

exec "$@"
