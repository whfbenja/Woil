#!/usr/bin/env bash
# ============================================================
# WOIL — GATE DE VARREDURA PRÉ-BUILD (parity com EAS)
# Executa localmente as MESMAS checagens do pipeline EAS, na
# ordem em que elas falham na nuvem. Rodar apos toda alteracao
# significativa, ANTES de qualquer `eas build`.
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

# 5. Testes unitarios
step "5 jest" npx jest --ci --silent

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
