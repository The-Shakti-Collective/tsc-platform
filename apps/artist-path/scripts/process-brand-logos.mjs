import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const brandDir = path.join(process.cwd(), 'public', 'brand');
const appDir = path.join(process.cwd(), 'src', 'app');

function isTerracotta(r, g, b) {
  return r > 70 && g < 130 && b < 110 && r > g + 12 && r > b + 12;
}

function isBackground(r, g, b) {
  if (r <= 55 && g <= 55 && b <= 55) return true;
  if (r >= 220 && g >= 220 && b >= 205) return true;
  return false;
}

function distToTerracotta(data, w, h, x, y, maxDist = 3) {
  for (let d = 0; d <= maxDist; d++) {
    for (let dy = -d; dy <= d; dy++) {
      for (let dx = -d; dx <= d; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== d) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const o = (ny * w + nx) * 4;
        if (data[o + 3] < 10) continue;
        if (isTerracotta(data[o], data[o + 1], data[o + 2])) return d;
      }
    }
  }
  return Infinity;
}

async function cleanLogo(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const out = Buffer.from(data);

  const bg = new Uint8Array(w * h);
  const q = [];
  const pushBg = (x, y) => {
    const i = y * w + x;
    if (bg[i]) return;
    const o = i * 4;
    if (!isBackground(out[o], out[o + 1], out[o + 2])) return;
    bg[i] = 1;
    q.push(i);
  };

  for (let x = 0; x < w; x++) {
    pushBg(x, 0);
    pushBg(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushBg(0, y);
    pushBg(w - 1, y);
  }

  while (q.length) {
    const i = q.pop();
    const x = i % w;
    const y = (i / w) | 0;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      pushBg(nx, ny);
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (bg[i]) {
      out[i * 4 + 3] = 0;
      continue;
    }

    const o = i * 4;
    const r = out[o];
    const g = out[o + 1];
    const b = out[o + 2];

    if (r <= 55 && g <= 55 && b <= 55 && distToTerracotta(out, w, h, i % w, (i / w) | 0) > 2) {
      out[o + 3] = 0;
    }
  }

  const trimmed = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await sharp(trimmed).toFile(output);
  const meta = await sharp(output).metadata();
  console.log(`wrote ${path.basename(output)} ${meta.width}x${meta.height}`);
  return output;
}

/** Square icon for browser tabs — mark centered, aspect preserved */
async function writeSquareIcon(input, output, size) {
  await sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`wrote ${path.basename(output)} ${size}x${size}`);
}

const userMark =
  'C:/Users/ragha/.cursor/projects/c-Projects-TSC-Platform/assets/c__Users_ragha_AppData_Roaming_Cursor_User_workspaceStorage_153ff333c59737a0c2588bf267e3702a_images_image-acd84ea6-cf31-456c-869d-38a9c09ee080.png';

const markSource = fs.existsSync(userMark) ? userMark : path.join(brandDir, 'artist-path-mark.png');
const markPath = path.join(brandDir, 'artist-path-mark.png');

await cleanLogo(markSource, markPath);

const lockupTmp = path.join(brandDir, 'artist-path-lockup.tmp.png');
await cleanLogo(path.join(brandDir, 'artist-path-lockup.png'), lockupTmp);
fs.renameSync(lockupTmp, path.join(brandDir, 'artist-path-lockup.png'));

await writeSquareIcon(markPath, path.join(brandDir, 'favicon.png'), 32);
await writeSquareIcon(markPath, path.join(brandDir, 'apple-touch-icon.png'), 180);
await writeSquareIcon(markPath, path.join(appDir, 'icon.png'), 512);
await writeSquareIcon(markPath, path.join(appDir, 'apple-icon.png'), 180);
