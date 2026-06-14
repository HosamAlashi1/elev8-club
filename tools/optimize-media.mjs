import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();

const targets = [
  { src: 'src/assets/images/anima-home/group-3.png', quality: 92 },
  { src: 'src/assets/images/anima-home/group-111.png', quality: 92 },
  { src: 'src/assets/images/anima-home/faq-question-mark.svg', quality: 95, lossless: true, pngFallback: true },
  { src: 'src/assets/images/anima-home/sademployee-1-1.png', quality: 90 },
  { src: 'src/assets/images/anima-home/why-free-studio.png', quality: 90 },
  { src: 'src/assets/images/anima-home/why-free-mobile.png', quality: 90 },
  { src: 'src/assets/images/anima-home/proof-avatar-1.svg', quality: 95, lossless: true, width: 128 },
  { src: 'src/assets/images/anima-home/proof-avatar-2.svg', quality: 95, lossless: true, width: 128 },
  { src: 'src/assets/images/anima-home/proof-avatar-3.svg', quality: 95, lossless: true, width: 128 },
  { src: 'src/assets/images/anima-home/trust-gaza.png', quality: 88 },
  { src: 'src/assets/images/anima-home/trust-profit.png', quality: 88 },
  { src: 'src/assets/images/anima-home/trust-studio.png', quality: 88 },
  { src: 'src/assets/images/anima-home/trust-instagram.png', quality: 88 },
  { src: 'src/assets/images/anima-home/trust-challenge.png', quality: 88 },
  { src: 'src/assets/images/anima-home/proof-phone-amal.png', quality: 88 },
  { src: 'src/assets/images/anima-home/proof-phone-ansar.png', quality: 88 },
  { src: 'src/assets/images/anima-home/proof-phone-fadi.png', quality: 88 },
  { src: 'src/assets/images/anima-home/proof-phone-haitham.png', quality: 88 },
  { src: 'src/assets/images/anima-home/shots-screenshot.png', quality: 88 },
  { src: 'src/assets/images/anima-home/learn-education.png', quality: 88 },
  { src: 'src/assets/images/anima-home/proof-frame-amal.jpg', quality: 86 },
  { src: 'src/assets/images/anima-home/proof-frame-louis.jpg', quality: 86 },
  { src: 'src/assets/images/anima-home/proof-frame-ansar.jpg', quality: 86 },
  { src: 'src/assets/images/anima-home/proof-frame-fadi.jpg', quality: 86 },
  { src: 'src/assets/images/anima-home/proof-frame-abubakr.jpg', quality: 86 },
  { src: 'src/assets/images/anima-home/proof-frame-haitham.jpg', quality: 86 },
  { src: 'src/assets/images/canva/trading-screenshot.png', quality: 88 },
  { src: 'src/assets/images/canva/khalil-gaza.jpg', quality: 88 },
  { src: 'src/assets/images/canva/khalil-pill.jpg', quality: 90 },
  { src: 'src/assets/images/canva/khalil-office.png', quality: 90 },
  { src: 'src/assets/images/canva/khalil-office-mobile.png', quality: 90 },
  { src: 'src/assets/images/canva/video-proof-massy.png', quality: 88 },
  { src: 'src/assets/images/canva/video-proof-salah.png', quality: 88 },
  { src: 'src/assets/images/canva/elev8-instagram.jpg', quality: 88 },
  { src: 'src/assets/images/video-questions/whatsapp-coin.svg', quality: 95, lossless: true },
  ...Array.from({ length: 14 }, (_, index) => ({
    src: `src/assets/images/screenshots/elev8-screenshot-${String(index + 1).padStart(2, '0')}.jpeg`,
    quality: 86,
  })),
];

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(bytes > 1024 * 1024 ? 0 : 1)} KB`;

const outputPathFor = (src) => {
  const parsed = path.parse(src);
  return path.join(parsed.dir, `${parsed.name}.webp`);
};

const pngOutputPathFor = (src) => {
  const parsed = path.parse(src);
  return path.join(parsed.dir, `${parsed.name}.png`);
};

let originalTotal = 0;
let optimizedTotal = 0;

for (const target of targets) {
  const srcPath = path.resolve(rootDir, target.src);
  const outPath = path.resolve(rootDir, outputPathFor(target.src));

  await mkdir(path.dirname(outPath), { recursive: true });

  let pipeline = sharp(srcPath, { animated: false }).rotate();
  if (target.width) {
    pipeline = pipeline.resize({ width: target.width, height: target.width, fit: 'contain' });
  }
  const options = target.lossless
    ? { lossless: true, effort: 6 }
    : { quality: target.quality, effort: 6, smartSubsample: true };

  await pipeline.webp(options).toFile(outPath);

  const [originalStats, optimizedStats] = await Promise.all([stat(srcPath), stat(outPath)]);
  originalTotal += originalStats.size;
  optimizedTotal += optimizedStats.size;

  const saved = originalStats.size - optimizedStats.size;
  const percent = originalStats.size ? Math.round((saved / originalStats.size) * 100) : 0;
  console.log(
    `${target.src} -> ${path.relative(rootDir, outPath)} | ${formatBytes(originalStats.size)} -> ${formatBytes(optimizedStats.size)} (${percent}% saved)`
  );

  if (target.pngFallback) {
    const pngOutPath = path.resolve(rootDir, pngOutputPathFor(target.src));
    await sharp(srcPath, { animated: false })
      .rotate()
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toFile(pngOutPath);

    const pngStats = await stat(pngOutPath);
    console.log(`  fallback -> ${path.relative(rootDir, pngOutPath)} | ${formatBytes(pngStats.size)}`);
  }
}

const totalSaved = originalTotal - optimizedTotal;
const totalPercent = originalTotal ? Math.round((totalSaved / originalTotal) * 100) : 0;
console.log(`Total selected media: ${formatBytes(originalTotal)} -> ${formatBytes(optimizedTotal)} (${totalPercent}% saved)`);
