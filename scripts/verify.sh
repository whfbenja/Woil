#!/usr/bin/env bash
# ============================================================
# WOIL — GATE DE VARREDURA PRÉ-BUILD (parity com EAS)
# Executa localmente as MESMAS checagens do pipeline EAS, na
# ordem em que elas falham na nuvem, mais guardas de regressão
# próprios do projeto. Rodar apos toda alteracao significativa,
# ANTES de qualquer `eas build`.
# Uso: bash scripts/verify.sh   (ou: npm run verify)
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."
LOG="${TMPDIR:-$HOME/tmp}/woil_verify_last.log"
mkdir -p "$(dirname "$LOG")"

PASS=0; FAIL=0; FAILED_STEPS=()
step() {
  local name="$1"; shift
  echo ""
  echo "── [$name]"
  if "$@" > "$LOG" 2>&1; then
    echo "   ✔ OK"; PASS=$((PASS+1))
  else
    echo "   ✖ FALHOU (últimas 15 linhas):"
    tail -15 "$LOG" | sed 's/^/   | /'
    FAIL=$((FAIL+1)); FAILED_STEPS+=("$name")
  fi
}

echo "════════ WOIL VERIFY GATE — $(date) ════════"

# 0. Rede de segurança: node_modules deve existir
[ -d node_modules ] || { echo "node_modules ausente — rode npm install primeiro"; exit 2; }

# 1. Lockfile sincronizado com package.json (package.json alterado sem
#    lock atualizado foi o erro que custou 1 build: o servidor npm ci
#    reconstruiu jest 30 a partir do lock antigo)
step "1 lockfile-sync" bash -c '
  a=$(node -p "JSON.stringify(require(\"./package.json\").dependencies)")
  b=$(node -p "const l=require(\"./package-lock.json\"); JSON.stringify(l.packages[\"\"]?.dependencies)")
  [ "$a" = "$b" ] || { echo "deps divergem: package.json vs lock"; exit 1; }
  c=$(node -p "JSON.stringify(require(\"./package.json\").devDependencies)")
  d=$(node -p "const l=require(\"./package-lock.json\"); JSON.stringify(l.packages[\"\"]?.devDependencies)")
  [ "$c" = "$d" ] || { echo "devDeps divergem: package.json vs lock"; exit 1; }
'

# 2. expo-doctor — EXATAMENTE o que o EAS roda na fase RUN_EXPO_DOCTOR
step "2 expo-doctor" npx -y expo-doctor

# 3. expo install --check — mesma familia de checagem de versoes SDK
step "3 expo-install-check" npx expo install --check

# 4. Typecheck completo (TS estrito)
step "4 tsc" npx tsc --noEmit

# 5. Testes unitarios (dominio + application + guardas de UI)
# --runInBand: o Termux/Android tem ~3.5GB RAM e o jest em paralelo
# (workers) estoura o heap e derruba a sessão. Serial é obrigatório aqui.
step "5 jest" env NODE_OPTIONS="--max-old-space-size=1024" npx jest --ci --runInBand --silent

# 5b. Cobertura mínima das suites críticas: garante que os testes de
#     guarda não foram silenciosamente removidos/renomeados.
step "5b jest-suites" bash -c '
  out=$(npx jest --listTests 2>/dev/null)
  for need in index parsers designSystem noteService backlinks book pageMarkers bookService bookSearch; do
    echo "$out" | grep -q "$need" || { echo "suite ausente: $need"; exit 1; }
  done
'

# 5c. Guarda de infraestrutura: a API legada do expo-file-system só pode
#     ser importada de "expo-file-system/legacy" (bug que deixou os
#     handlers de UI mudos em runtime sem quebrar tsc/jest).
step "5c fs-legacy-import" bash -c '
  bad=0
  for f in $(find src -name "*.ts" -o -name "*.tsx"); do
    if grep -qE "\b(documentDirectory|readAsStringAsync|writeAsStringAsync|getInfoAsync|deleteAsync|makeDirectoryAsync|readDirectoryAsync)\b" "$f"; then
      grep -q "expo-file-system/legacy" "$f" || { echo "import legado ausente em $f"; bad=1; }
    fi
  done
  [ "$bad" -eq 0 ]
'

# 5d. Guarda de design system: nenhum hexadecimal cru fora de tokens.
step "5d no-raw-hex" bash -c '
  offenders=$(grep -nE "#[0-9a-fA-F]{3,8}\b" src/ui/*.tsx src/App.tsx 2>/dev/null | grep -vE "^\S+:[0-9]+:\s*(//|\*|/\*)" || true)
  if [ -n "$offenders" ]; then echo "$offenders"; exit 1; fi
'

# 5e. Guarda de rede: o app é local-first. Chamada de rede só é permitida
#     nos pontos intencionais e documentados (Google Books na Library e o
#     CDN do D3 no grafo). Qualquer outro fetch/URL em src/ é regressão.
step "5e network-allowlist" bash -c '
  allowed="src/infrastructure/BookSearchClient.ts src/ui/OceanGraph.tsx"
  offenders=""
  for f in $(find src -name "*.ts" -o -name "*.tsx"); do
    hits=$(grep -nE "\b(fetch|XMLHttpRequest|axios)\s*\(|https?://" "$f" | grep -viE "placeholder[=:]|accessibilityLabel" || true)
    if [ -n "$hits" ]; then
      case " $allowed " in
        *" $f "*) ;;
        *) offenders="$offenders $f" ;;
      esac
    fi
  done
  if [ -n "$offenders" ]; then echo "rede fora da allowlist:$offenders"; exit 1; fi
'

# 5f. Guarda de segredos: nenhuma chave/token hardcoded no código-fonte.
step "5f no-hardcoded-secrets" bash -c '
  offenders=$(grep -rniE "(api[_-]?key|secret|password|bearer)[[:space:]]*[:=][[:space:]]*[\"'"'"'][^\"'"'"']{8,}" src 2>/dev/null | grep -viE "placeholder|accessibilityLabel" || true)
  if [ -n "$offenders" ]; then echo "$offenders"; exit 1; fi
'

# 6. Bundling Metro real — reproduz a fase EAGER_BUNDLE do EAS.
#    Valida que TODOS os imports resolvem fora do Termux tambem
#    (bloqueia o erro "Unable to resolve module").
step "6 metro-bundle" bash -c '
  B="${TMPDIR:-$HOME/tmp}/woil_bundle"
  rm -rf "$B" && mkdir -p "$B"
  npx expo export --platform android --output-dir "$B" --clear --no-bytecode
  [ -n "$(ls -A "$B" 2>/dev/null)" ] || { echo "bundle vazio"; exit 1; }
'

# 7. app.json sanity: slug/name/extra.projectID coerentes com EAS
step "7 app-json" node -e '
  const j=require("./app.json").expo;
  const errs=[];
  if(!j.slug||!/^[a-z0-9-]+$/.test(j.slug)) errs.push("slug invalido");
  if(!j.name) errs.push("name ausente");
  const pid=j.extra?.eas?.projectId||j.extra?.projectID;
  if(!pid) errs.push("extra.eas.projectId ausente (rode eas init)");
  if(!j.version) errs.push("version ausente");
  if(errs.length){console.error(errs.join("; "));process.exit(1)}
  console.log("slug:",j.slug,"| projectId:",pid);
'

# 8. eas.json valido + perfis existem
step "8 eas-json" node -e '
  const e=require("./eas.json");
  if(!e.build?.preview||!e.build?.production) throw new Error("perfis preview/production faltando");
  if(e.build.preview.distribution!=="internal") throw new Error("preview deve ser internal");
'

# 9. Git limpo: nada pendente (o EAS builda o commit enviado)
step "9 git-clean" bash -c '
  [ -z "$(git status --porcelain)" ] || { git status --porcelain; exit 1; }
'

echo ""
echo "════════ RESULTADO: $PASS ok, $FAIL falhou ════════"
if [ "$FAIL" -gt 0 ]; then
  echo "ETAPAS FALHAS: ${FAILED_STEPS[*]}"
  echo ">>> NAO rode eas build até corrigir tudo."
  exit 1
fi
echo ">>> GATE LIMPO — seguro rodar: eas build --platform android --profile preview --non-interactive"