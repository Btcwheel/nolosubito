import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Only 3 valid TTF fonts - Medium falls back to Regular
const fonts = [
  { file: 'Inter-Regular.ttf', var: 'INTER_REGULAR' },
  { file: 'Inter-Bold.ttf', var: 'INTER_BOLD' },
  { file: 'Inter-ExtraBold.ttf', var: 'INTER_EXTRA_BOLD' },
];

const lines = [];

for (const { file, var: varName } of fonts) {
  const filePath = join(root, 'public', 'fonts', file);
  if (!existsSync(filePath)) {
    lines.push(`export const ${varName} = null;`);
    console.log(`⚠️  ${file} not found, exporting null`);
    continue;
  }
  const buffer = readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const dataUri = `data:font/ttf;base64,${base64}`;
  lines.push(`export const ${varName} = '${dataUri}';`);
  console.log(`✅ ${file} → ${(buffer.length / 1024).toFixed(1)} KB`);
}

// Medium falls back to Regular
lines.push('');
lines.push('// Medium weight falls back to Regular (Inter-Medium.ttf was corrupted)');
lines.push('export const INTER_MEDIUM = INTER_REGULAR;');

const output = join(root, 'src', 'lib', 'pdf-fonts.js');
writeFileSync(output, lines.join('\n') + '\n');
console.log(`\n📄 Written to ${output}`);
