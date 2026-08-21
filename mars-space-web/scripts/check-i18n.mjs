/**
 * CI guard (spec §8): every locale must expose an identical set of keys per
 * namespace. Exits non-zero and lists the offending keys when they diverge.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'locales');
const REFERENCE = 'uz';

function flatten(obj, prefix = '') {
  const out = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out.push(...flatten(value, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

function load(lang, ns) {
  const file = join(localesDir, lang, `${ns}.json`);
  if (!existsSync(file)) return null;
  return new Set(flatten(JSON.parse(readFileSync(file, 'utf8'))));
}

const languages = readdirSync(localesDir).filter((d) =>
  existsSync(join(localesDir, d)),
);
const namespaces = readdirSync(join(localesDir, REFERENCE))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''));

let failed = false;
for (const ns of namespaces) {
  const reference = load(REFERENCE, ns);
  for (const lang of languages) {
    if (lang === REFERENCE) continue;
    const keys = load(lang, ns);
    if (!keys) {
      console.error(`✗ ${lang}/${ns}.json is missing`);
      failed = true;
      continue;
    }
    const missing = [...reference].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !reference.has(k));
    if (missing.length || extra.length) {
      failed = true;
      console.error(`✗ ${lang}/${ns}.json`);
      missing.forEach((k) => console.error(`    missing: ${k}`));
      extra.forEach((k) => console.error(`    extra:   ${k}`));
    }
  }
}

if (failed) {
  console.error('\ni18n key parity check failed.');
  process.exit(1);
}
console.log('✓ i18n key parity OK');
