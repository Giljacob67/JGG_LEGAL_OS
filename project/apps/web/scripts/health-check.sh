#!/bin/bash
# Health check rápido do JGG Legal OS
# Uso: bash scripts/health-check.sh

set -e

echo "=== JGG Legal OS Health Check ==="
echo ""

echo "1. Verificando Node.js..."
node --version || exit 1

echo "2. Verificando variáveis de ambiente essenciais..."
missing=0
for var in DATABASE_URL NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY CLERK_WEBHOOK_SECRET INTEGRATION_ENCRYPTION_KEY; do
  if [ -z "${!var}" ]; then
    echo "   ⚠️  $var não configurada"
    missing=$((missing + 1))
  else
    echo "   ✅ $var configurada"
  fi
done
if [ $missing -gt 0 ]; then
  echo "   Atenção: $missing variáveis faltando. Copie .env.example para .env e preencha."
fi

echo ""
echo "3. Verificando Prisma..."
npx prisma --version || exit 1

echo ""
echo "4. Verificando schema do banco..."
npx prisma validate || exit 1

echo ""
echo "5. Rodando linter..."
npm run lint || exit 1

echo ""
echo "6. Type check..."
npx tsc --noEmit || exit 1

echo ""
echo "7. Testes unitários..."
npm run test:ci || exit 1

echo ""
echo "8. Build de produção..."
npm run build || exit 1

echo ""
echo "=== ✅ Tudo OK ==="
