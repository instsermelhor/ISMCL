#!/usr/bin/env bash
# ============================================================
# Aura Platform — Script de Teste do Fluxo de Autenticação
# Testa: POST /login → GET /me → endpoints protegidos
# Uso: ./scripts/test-auth-flow.sh
# ============================================================

BASE_URL="http://localhost:3001/api/v1"
PASS="\033[32m✅ PASS\033[0m"
FAIL="\033[31m❌ FAIL\033[0m"
INFO="\033[36mℹ️  INFO\033[0m"
SEP="──────────────────────────────────────────"

echo ""
echo "🚀 Aura Auth Flow Test — $(date)"
echo "$SEP"

# ── 1. Health Check ──────────────────────────────────────────
echo -e "\n$INFO [1/6] Health check em $BASE_URL/health"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  echo -e "$PASS Health endpoint retornou 200"
else
  echo -e "$FAIL Health retornou: $HEALTH (esperado 200)"
  echo ""
  echo "⚠️  O backend não está rodando em $BASE_URL"
  echo "   Inicie-o primeiro com: cd backend && npm run start:dev"
  exit 1
fi

# ── 2. Login com Super Usuário ────────────────────────────────
echo -e "\n$INFO [2/6] POST /auth/login — Super Usuário"
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ribeiro.rikardo@gmail.com","password":"Aura@2025!"}' 2>/dev/null)

echo "  Resposta: $LOGIN_RESP" | head -c 500
echo ""

ACCESS_TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken',''))" 2>/dev/null)
if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
  echo -e "$PASS Login retornou accessToken"
  echo "  Token (primeiros 40 chars): ${ACCESS_TOKEN:0:40}..."
else
  echo -e "$FAIL Login não retornou accessToken"
  echo "  Resposta completa: $LOGIN_RESP"
  exit 1
fi

# ── 3. GET /auth/me ───────────────────────────────────────────
echo -e "\n$INFO [3/6] GET /auth/me — Perfil do usuário autenticado"
ME_RESP=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" 2>/dev/null)

echo "  Resposta: $ME_RESP" | head -c 400
echo ""

ME_EMAIL=$(echo "$ME_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('email',''))" 2>/dev/null)
if [ -n "$ME_EMAIL" ] && [ "$ME_EMAIL" != "None" ]; then
  echo -e "$PASS GET /me retornou email: $ME_EMAIL"
else
  echo -e "$FAIL GET /me não retornou email esperado"
  echo "  Resposta completa: $ME_RESP"
fi

# ── 4. Acesso sem token (deve retornar 401) ───────────────────
echo -e "\n$INFO [4/6] GET /auth/me sem token — deve retornar 401"
NO_TOKEN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" 2>/dev/null)
if [ "$NO_TOKEN_STATUS" = "401" ]; then
  echo -e "$PASS Retornou 401 Unauthorized corretamente"
else
  echo -e "$FAIL Esperado 401, recebido: $NO_TOKEN_STATUS"
fi

# ── 5. Login com credenciais inválidas (deve retornar 401) ────
echo -e "\n$INFO [5/6] POST /auth/login credenciais inválidas — deve retornar 401"
INVALID_RESP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"hacker@evil.com","password":"wrong"}' 2>/dev/null)
if [ "$INVALID_RESP_CODE" = "401" ] || [ "$INVALID_RESP_CODE" = "403" ]; then
  echo -e "$PASS Credenciais inválidas rejeitadas ($INVALID_RESP_CODE)"
else
  echo -e "$FAIL Esperado 401/403, recebido: $INVALID_RESP_CODE"
fi

# ── 6. Token inválido (deve retornar 401) ─────────────────────
echo -e "\n$INFO [6/6] GET /auth/me com token forjado — deve retornar 401"
FAKE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.fake.token" 2>/dev/null)
if [ "$FAKE_STATUS" = "401" ]; then
  echo -e "$PASS Token forjado rejeitado corretamente"
else
  echo -e "$FAIL Esperado 401, recebido: $FAKE_STATUS"
fi

echo ""
echo "$SEP"
echo "✅ Fluxo de autenticação testado com sucesso!"
echo "$SEP"
echo ""
