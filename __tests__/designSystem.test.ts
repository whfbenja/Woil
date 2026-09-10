/**
 * Guardas de regressão do design system e da camada de UI.
 * Falham cedo em erros que o tsc/jest de domínio NÃO pegam:
 *  - nome de ícone inexistente no Ionicons (build quebra só no device)
 *  - import legado do expo-file-system pelo entry errado (handlers mudos)
 *  - hexadecimal cru em componente (viola WOIL_DESIGN_SYSTEM §20)
 *  - componente de src/ui fora do barrel index.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const UI_DIR = path.join(ROOT, 'src', 'ui');
const SRC_DIR = path.join(ROOT, 'src');

const GLYPHMAP = path.join(
  ROOT,
  'node_modules',
  '@expo',
  'vector-icons',
  'build',
  'vendor',
  'react-native-vector-icons',
  'glyphmaps',
  'Ionicons.json'
);

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function listFiles(dir: string, ext: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => path.join(dir, f));
}

describe('design system guards', () => {
  const ionicons: Record<string, number> = JSON.parse(
    fs.readFileSync(GLYPHMAP, 'utf8')
  );

  it('todo ícone Ionicons usado na UI existe no glyphmap', () => {
    const files = [...listFiles(UI_DIR, '.tsx'), path.join(SRC_DIR, 'App.tsx')];
    const missing: string[] = [];

    // <Ionicons name="add" />
    const NAMED = /<Ionicons[^>]*\bname="([^"]+)"/g;
    // icon: 'x'  |  icon: (cond ? 'a' : 'b') as ...
    const ICON_PROP = /\bicon\s*:\s*([^\n,]+)/g;
    const STRING = /'([a-z0-9][a-z0-9-]*)'/g;

    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      const candidates: string[] = [];
      let m: RegExpExecArray | null;

      while ((m = NAMED.exec(src))) candidates.push(m[1]);
      while ((m = ICON_PROP.exec(src))) {
        let s: RegExpExecArray | null;
        STRING.lastIndex = 0;
        while ((s = STRING.exec(m[1]))) candidates.push(s[1]);
      }

      for (const name of candidates) {
        if (!(name in ionicons)) {
          missing.push(`${path.relative(ROOT, file)} -> ${name}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('nenhum componente espalha hexadecimal cru (usar tokens)', () => {
    const files = [...listFiles(UI_DIR, '.tsx'), path.join(SRC_DIR, 'App.tsx')];
    const offenders: string[] = [];

    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // ignora linhas comentadas
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (/#[0-9a-fA-F]{3,8}\b/.test(line)) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it('todo componente de src/ui está exportado no barrel index.ts', () => {
    const barrel = fs.readFileSync(path.join(UI_DIR, 'index.ts'), 'utf8');
    const components = listFiles(UI_DIR, '.tsx').map((f) => path.basename(f, '.tsx'));
    const notExported = components.filter((name) => !barrel.includes(`'./${name}'`));
    expect(notExported).toEqual([]);
  });

  it('imports do expo-file-system usam o entry correto para a API legada', () => {
    const LEGACY_SYMBOLS = [
      'documentDirectory',
      'readAsStringAsync',
      'writeAsStringAsync',
      'getInfoAsync',
      'deleteAsync',
      'makeDirectoryAsync',
      'readDirectoryAsync',
    ];

    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) return walk(full);
        return e.name.endsWith('.ts') || e.name.endsWith('.tsx') ? [full] : [];
      });

    const offenders: string[] = [];
    for (const file of walk(SRC_DIR)) {
      const src = fs.readFileSync(file, 'utf8');
      const usesLegacy = LEGACY_SYMBOLS.some((s) =>
        new RegExp(`\\b${s}\\b`).test(src)
      );
      if (!usesLegacy) continue;

      const importsLegacy = /from\s+['"]expo-file-system\/legacy['"]/.test(src);
      if (!importsLegacy) {
        offenders.push(path.relative(ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });
});