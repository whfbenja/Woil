# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# REGRA DE OURO: gate de varredura antes de build

Após QUALQUER alteração significativa no código (deps, config, src,
metro/app/eas.json), ANTES de rodar `eas build`:

    npm run verify    # ou: bash scripts/verify.sh

O script reproduz localmente, na ordem de falha, as checagens do
pipeline EAS (lockfile-sync, expo-doctor, expo install --check, tsc,
jest, bundle Metro real, sanidade app.json/eas.json, git limpo).
Build só é disparado com o gate 100% verde. Nunca "tentativa e erro"
no EAS — cada build custa fila e cota mensal.
