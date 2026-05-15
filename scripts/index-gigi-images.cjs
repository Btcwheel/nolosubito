const fs = require('fs');
const path = require('path');

function walk(dir, base) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = (base + '/' + e.name).replace(/\\/g, '/');
    if (e.isDirectory()) {
      files = files.concat(walk(full, rel));
    } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(e.name)) {
      files.push('/gigi/' + rel);
    }
  }
  return files;
}

const imgs = walk('public/gigi/uploads', 'uploads');
// Escludi thumbnails WordPress (es. -300x180.jpg)
const filtered = imgs.filter(p => !/-\d+x\d+\.(jpg|jpeg|png|webp|gif)$/i.test(p));
filtered.sort();
fs.writeFileSync('public/gigi-images.json', JSON.stringify(filtered));
console.log('Immagini indicizzate:', filtered.length);
