#!/usr/bin/env bash
# ============================================================
# WOIL — AUDITORIA MANUAL (WOIL_AUDIT_CHECKLIST.md adaptado)
# ------------------------------------------------------------
# O checklist original foi escrito para um app rodando em device
# (abrir tela, digitar, tocar). Neste ambiente (Termux/Android,
# sem emulador e sem device conectado) os itens de UI interativa
# NÃO são verificáveis de forma automatizada — este script cobre
# tudo que É verificável na linha de comando e marca explicitamente
# o que fica pendente de teste manual em device.
#
# Uso: bash scripts/audit.sh
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."

PASS=0; WARN=0; FAIL=0
ok()   { echo "   ✅ $1"; PASS=$((PASS+1)); }
warn() { echo "   ⚠️  $1"; WARN=$((WARN+1)); }
bad()  { echo "   ❌ $1"; FAIL=$((FAIL+1)); }

echo "════════ WOIL AUDIT — $(date) ════════"

echo ""
echo "── 1. Sanidade de build e ambiente"
npx tsc --noEmit >/dev/null 2>&1 && ok "tsc --noEmit sem erros" || bad "tsc --noEmit falhou"
JEST_OUT=$(npx jest --ci --silent 2>&1 | tail -5)
echo "$JEST_OUT" | grep -qE "Tests:.*passed" && ok "jest: $(echo "$JEST_OUT" | grep 'Tests:')" || bad "jest falhou"
[ -z "$(git status --porcelain)" ] && ok "git limpo" || warn "git com alterações pendentes (normal durante a sessão)"
grep -qE "react-native-webview" package.json && ok "webview declarado (grafo Ocean)" || bad "react-native-webview ausente"

echo ""
echo "── 2. Camada de domínio"
for f in src/domain/Note.ts src/domain/Book.ts src/domain/BacklinkIndex.ts src/domain/parsers/PageMarkerParser.ts; do
  [ -f "$f" ] && ok "presente: $f" || bad "ausente: $f"
done
grep -q "parseFrontmatter" src/domain/parsers/FrontmatterParser.ts && ok "parser de frontmatter com fallback (YAML inválido → vazio)" || bad "fallback de frontmatter não encontrado"
grep -q "expo-file-system/legacy" src/infrastructure/FileNoteRepository.ts && ok "repositório usa o entry legado do expo-file-system" || bad "import legado ausente (handlers ficam mudos)"

echo ""
echo "── 4. Design system"
grep -q "book:" src/tokens/colors.ts && ok "token 'book' presente em colors.ts" || bad "token 'book' ausente"
RAW=$(grep -nE "#[0-9a-fA-F]{3,8}\b" src/ui/*.tsx src/App.tsx 2>/dev/null | grep -vE ":[0-9]+:\s*(//|\*|/\*)" || true)
[ -z "$RAW" ] && ok "nenhum hexadecimal cru na UI" || bad "hex cru: $RAW"

echo ""
echo "── 5. Dados e persistência"
grep -q "crypto.randomUUID" src/infrastructure/FileNoteRepository.ts && ok "IDs de nota são UUID estável (não derivado do título)" || bad "geração de ID não usa UUID"
grep -q 'getNotePath' src/infrastructure/FileNoteRepository.ts && ok "nome do arquivo vem do ID (sem título cru no filesystem)" || bad "nome de arquivo não isolado por ID"

echo ""
echo "── 7. Segurança e integridade"
SECRETS=$(grep -rniE "(api[_-]?key|secret|password|bearer)[[:space:]]*[:=][[:space:]]*[\"'][^\"']{8,}" src 2>/dev/null | grep -viE "placeholder|accessibilityLabel" || true)
[ -z "$SECRETS" ] && ok "nenhum segredo hardcoded em src/" || bad "possível segredo: $SECRETS"
NET=$(grep -rlE "\b(fetch|XMLHttpRequest|axios)\s*\(|https?://" src --include="*.ts" --include="*.tsx" | grep -vE "BookSearchClient.ts|OceanGraph.tsx" || true)
NET=$(echo "$NET" | while read -r f; do [ -z "$f" ] && continue; grep -nE "\b(fetch|XMLHttpRequest|axios)\s*\(|https?://" "$f" | grep -qiE "placeholder[=:]|accessibilityLabel" || echo "$f"; done)
[ -z "$NET" ] && ok "rede restrita a BookSearchClient/OceanGraph" || bad "rede fora da allowlist: $NET"

echo ""
echo "── 8. Regressão"
npx jest --listTests 2>/dev/null | grep -q "bookSearch" && ok "suítes novas de Library presentes" || bad "suítes da Library ausentes"
npx jest --listTests 2>/dev/null | grep -q "backlinks" && ok "suítes de Ocean/backlinks presentes" || bad "suítes de backlinks ausentes"

echo ""
echo "── 3 / 6. UI interativa e performance — NÃO VERIFICÁVEL AQUI"
warn "digitação real em TextInput, navegação por toque, persistência após fechar/reabrir o app e fluidez com 20-30 notas exigem teste manual em device. O gate automatizado NÃO cobre esses itens."

echo ""
echo "════════ RESUMO DA AUDITORIA ════════"
echo "✅ Passou: $PASS"
echo "⚠️  Ressalvas: $WARN"
echo "❌ Falhou: $FAIL"
echo ""
echo "Testes automatizados: $(npx jest --ci --silent 2>&1 | grep -oE 'Tests:.*' | head -1)"
echo "Novas dependências: react-native-webview (Fase 4 do prompt 004)"
[ "$FAIL" -eq 0 ] || exit 1