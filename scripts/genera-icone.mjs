// Genera le icone PNG dell'app (orologio bianco su sfondo verde petrolio)
// senza dipendenze: rasterizzazione con supersampling + encoder PNG minimale.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SFONDO = [15, 118, 110];
const PRIMO_PIANO = [255, 255, 255];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dati) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(dati.length);
  const td = Buffer.concat([Buffer.from(tipo), dati]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Distanza dal segmento AB. */
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** true se il punto (coordinate normalizzate 0..1) è nel disegno. `scala` < 1 lascia margine (maskable). */
function dentro(u, v, scala) {
  const x = (u - 0.5) / scala, y = (v - 0.5) / scala;
  const r = Math.hypot(x, y);
  if (r > 0.30 && r < 0.36) return true; // quadrante
  if (distSeg(x, y, 0, 0, 0, -0.21) < 0.032) return true; // lancetta minuti (12)
  if (distSeg(x, y, 0, 0, 0.14, 0.06) < 0.032) return true; // lancetta ore (~4)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    if (i % 3 === 0 && distSeg(x, y, Math.sin(a) * 0.255, -Math.cos(a) * 0.255, Math.sin(a) * 0.28, -Math.cos(a) * 0.28) < 0.018) return true;
  }
  return false;
}

function icona(size, scala) {
  const SS = 4;
  return png(size, (x, y) => {
    let n = 0;
    for (let sy = 0; sy < SS; sy++)
      for (let sx = 0; sx < SS; sx++)
        if (dentro((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, scala)) n++;
    const a = n / (SS * SS);
    return SFONDO.map((c, i) => Math.round(c + (PRIMO_PIANO[i] - c) * a));
  });
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/apple-touch-icon.png', icona(180, 1));
writeFileSync('public/icons/icon-192.png', icona(192, 1));
writeFileSync('public/icons/icon-512.png', icona(512, 1));
writeFileSync('public/icons/icon-maskable-512.png', icona(512, 0.78));
console.log('Icone generate in public/icons/');
