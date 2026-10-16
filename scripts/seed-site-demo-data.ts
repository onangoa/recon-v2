import { Prisma, PrismaClient } from '../prisma/generated/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { deflateSync } from 'zlib';
import {
  computeWorkedHours,
  parseWorkingDays,
  type ShiftShape,
} from '../lib/attendance-utils';

/**
 * Demo data seeder: populates a site with workers, their attendance and a
 * full set of /reports/daily reports (Daily Site Progress & Next-Day
 * Planning Report) for a date range — including photo evidence images,
 * visitors, safety incidents and material deliveries, so every section of
 * the daily report document/PDF renders with real data.
 *
 * What it creates (all scoped to one site + its contractor):
 *   1. Supporting records when missing: designations, a shift, a biometric
 *      device for the site and demo suppliers.
 *   2. X workers with full profiles (email/phone/national ID, designation,
 *      payment details, shift assignment, generated ID-document image).
 *   3. Attendance for every worker from --from to --to: check-in/out times,
 *      computed hours/overtime/lateness (same rules as
 *      lib/attendance-utils.computeWorkedHours), biometric IN/OUT logs.
 *   3b. Biometric scan rows in the dv2_ai database (records table) for the
 *      shared "demo" device (sn = 'demo'), one IN + one OUT scan per
 *      punched attendance row. The attendance page pulls records live from
 *      the biometric API (BIOMETRIC_API_BASE_URL), so the seeded attendance
 *      only shows up there when these scan rows exist. Workers without an
 *      enrollId are assigned one (globally unique) so their scans map back.
 *   4. One daily report per day: activities (planned workforce chained from
 *      the previous day's targets, actual workforce from the day's
 *      attendance, labour cost from designation rates, verdicts, photos),
 *      next-day targets (workforce + uploads), material deliveries and
 *      materials required (with evidence photos), report attachments —
 *      plus the live-pulled sections' source rows: visitors per day,
 *      occasional safety incidents and delivered purchase orders.
 *
 * Images are procedurally generated PNGs written to public/uploads (the
 * same place the upload API stores files) so they render in the UI and
 * embed into the PDF export (which only supports PNG/JPEG from
 * public/uploads).
 *
 * Idempotent: workers this script previously seeded (tagged with the
 * @demo-reconsmi.co.ke email domain) are reused, so `--workers N` means
 * "the site has N demo workers" — a rerun only tops up the difference.
 * Existing attendance rows (workerId+date) and daily reports
 * (siteId+reportDate) are skipped; --replace deletes this script's data
 * for the site/range first. Note: PowerShell 7.3+ strips npm's `--`
 * separator — run via `npx tsx scripts/seed-site-demo-data.ts ...` there,
 * or pass flags as --site=value.
 *
 * Usage:
 *   npm run demo:seed-site -- --site <siteId> --workers 12 --from 2026-09-01 --to 2026-09-30
 *   npm run demo:seed-site -- --site <siteId> --workers 0 --from ... --to ...   # attendance/reports only (existing site workers)
 *   npm run demo:seed-site -- ... --replace                                     # delete this script's data in range, then reseed
 *   npm run demo:seed-site -- ... --dry-run
 *
 * All randomness is seeded from the site ID + calendar day, so reruns
 * generate identical data (stable demos, no duplicate image files).
 */

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function readFlag(name: string): string | null {
  const idx = args.indexOf(name);
  if (idx !== -1) {
    const next = args[idx + 1];
    if (next && !next.startsWith('--')) return next;
  }
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

const DRY_RUN = args.includes('--dry-run');
const REPLACE = args.includes('--replace');
const SITE_ARG = readFlag('--site');
const WORKERS_ARG = readFlag('--workers') || '10';
const FROM_ARG = readFlag('--from');
const TO_ARG = readFlag('--to');

const MAX_WORKERS = 200;
const MAX_DAYS = 120;

// ---------------------------------------------------------------------------
// Deterministic randomness (stable across reruns)
// ---------------------------------------------------------------------------

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — small, fast, deterministic. */
function makeRng(seed: string | number) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, list: readonly T[]): T =>
  list[Math.floor(rng() * list.length)];

/** Deterministic Fisher-Yates shuffle (returns a new array). */
const shuffled = <T,>(rng: () => number, list: readonly T[]): T[] => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const pickWeighted = <T,>(rng: () => number, entries: readonly [T, number][]): T => {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
};

const round = (value: number, decimals = 2): number =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGB, no dependencies) + procedural image painters
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  // filter byte 0 per scanline
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 3 + 1)] = 0;
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Tiny pixel canvas over a raw RGB buffer. */
class Pixmap {
  constructor(
    readonly w: number,
    readonly h: number,
    readonly data: Buffer = Buffer.alloc(w * h * 3)
  ) {}

  set(x: number, y: number, r: number, g: number, b: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    // Posterise to 32-step levels — placeholder photos compress far better
    // and the coarse banding blends into the texture pass below.
    this.data[i] = Math.max(0, Math.min(255, ((r | 0) & 0xe0) | 0x10));
    this.data[i + 1] = Math.max(0, Math.min(255, ((g | 0) & 0xe0) | 0x10));
    this.data[i + 2] = Math.max(0, Math.min(255, ((b | 0) & 0xe0) | 0x10));
  }

  fillRect(x: number, y: number, w: number, h: number, color: [number, number, number]): void {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color[0], color[1], color[2]);
  }

  fillRectShaded(
    x: number,
    y: number,
    w: number,
    h: number,
    color: [number, number, number],
    shade: number
  ): void {
    this.fillRect(x, y, w, h, [
      color[0] * (1 - shade),
      color[1] * (1 - shade),
      color[2] * (1 - shade),
    ]);
  }

  /** Vertical gradient between two colors. */
  vGradient(
    y0: number,
    y1: number,
    top: [number, number, number],
    bottom: [number, number, number]
  ): void {
    const span = Math.max(1, y1 - y0);
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / span;
      this.fillRect(
        0,
        y,
        this.w,
        1,
        [
          top[0] + (bottom[0] - top[0]) * t,
          top[1] + (bottom[1] - top[1]) * t,
          top[2] + (bottom[2] - top[2]) * t,
        ]
      );
    }
  }

  disc(cx: number, cy: number, radius: number, color: [number, number, number]): void {
    for (let y = cy - radius; y <= cy + radius; y++)
      for (let x = cx - radius; x <= cx + radius; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) this.set(x, y, ...color);
  }
}

const hsl = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let rgb: [number, number, number] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = l - c / 2;
  return [(rgb[0] + m) * 255, (rgb[1] + m) * 255, (rgb[2] + m) * 255];
};

/**
 * Procedural "construction site progress photo": sky gradient, skyline,
 * two concrete structures with floor lines + window openings, a tower
 * crane, ground works and material stacks, with subtle per-pixel grain.
 * Deterministic per seed — every photo differs but reruns are identical.
 */
function drawSitePhoto(seed: string): Buffer {
  const rng = makeRng(`photo:${seed}`);
  const W = 560;
  const H = 370;
  const pm = new Pixmap(W, H);
  const horizon = Math.floor(H * (0.52 + rng() * 0.08));
  const evening = rng() < 0.35;
  const hueShift = rng() * 30 - 15;

  // Sky
  pm.vGradient(
    0,
    horizon,
    evening ? hsl(20 + hueShift, 0.55, 0.62) : hsl(205 + hueShift, 0.55, 0.66),
    evening ? hsl(35 + hueShift, 0.7, 0.85) : hsl(200 + hueShift, 0.4, 0.88)
  );
  // Sun
  const sunX = Math.floor(W * (0.15 + rng() * 0.7));
  const sunY = Math.floor(horizon * (0.25 + rng() * 0.4));
  pm.disc(sunX, sunY, 18 + Math.floor(rng() * 10), evening ? [255, 200, 120] : [255, 246, 210]);

  // Distant skyline (muted silhouettes)
  let x = -20;
  while (x < W + 20) {
    const bw = 30 + Math.floor(rng() * 70);
    const bh = 20 + Math.floor(rng() * (horizon * 0.35));
    pm.fillRectShaded(x, horizon - bh, bw, bh, [150, 160, 175], 0.25 + rng() * 0.12);
    x += bw + Math.floor(rng() * 25);
  }

  // Ground
  pm.vGradient(horizon, H, [150, 128, 100], [110, 92, 72]);
  // Access road strip
  pm.fillRectShaded(0, horizon + 18, W, 14, [95, 90, 88], 0);
  for (let i = 0; i < W; i += 46) pm.fillRect(i, horizon + 24, 22, 3, [200, 195, 150]);

  // Two concrete structures under construction (slab + columns skeleton)
  const structure = (sx: number, sw: number, floors: number) => {
    const floorH = 34;
    const sh = floors * floorH;
    const sy = horizon - 8 - sh;
    for (let f = 0; f < floors; f++) {
      const fy = sy + f * floorH;
      // slab band
      pm.fillRectShaded(sx, fy, sw, 7, [190, 188, 182], 0.05);
      // columns + window openings
      for (let cx = sx + 6; cx < sx + sw - 10; cx += 26) {
        pm.fillRectShaded(cx, fy + 7, 8, floorH - 7, [168, 166, 160], 0.06);
        pm.fillRectShaded(cx + 11, fy + 10, 12, floorH - 14, [120, 130, 145], 0.15);
      }
    }
    // wrapped scaffolding edge
    pm.fillRectShaded(sx - 4, sy, 3, sh, [180, 120, 60], 0.1);
    pm.fillRectShaded(sx + sw + 1, sy, 3, sh, [180, 120, 60], 0.1);
    return sy;
  };
  const s1w = 130 + Math.floor(rng() * 60);
  const s1x = Math.floor(W * (0.08 + rng() * 0.15));
  const s1Top = structure(s1x, s1w, 3 + Math.floor(rng() * 3));
  const s2w = 110 + Math.floor(rng() * 50);
  const s2x = Math.min(W - s2w - 10, s1x + s1w + 40 + Math.floor(rng() * 60));
  const s2Top = structure(s2x, s2w, 2 + Math.floor(rng() * 3));

  // Tower crane above the taller structure
  const craneX = (s1Top < s2Top ? s1x + s1w / 2 : s2x + s2w / 2) | 0;
  const mastTop = Math.min(s1Top, s2Top) - 60 - Math.floor(rng() * 30);
  pm.fillRectShaded(craneX - 3, mastTop, 6, horizon - 10 - mastTop, [240, 130, 40], 0.05);
  const jibLen = 120 + Math.floor(rng() * 60);
  pm.fillRectShaded(craneX - 50, mastTop, jibLen + 50, 6, [240, 130, 40], 0.08);
  // pendants
  for (let i = 1; i <= 6; i++) {
    const px = craneX - 44 + ((jibLen + 40) / 6) * i;
    pm.fillRect(px | 0, mastTop + 6 + i * 2, 1, Math.max(0, i * 2 - 6), [90, 90, 95]);
  }
  // hanging cable + load
  const hookX = craneX + 30 + Math.floor(rng() * (jibLen - 60));
  pm.fillRectShaded(hookX, mastTop + 6, 2, 50 + Math.floor(rng() * 40), [70, 70, 75], 0);
  pm.fillRectShaded(hookX - 14, mastTop + 60 + Math.floor(rng() * 30), 30, 14, [160, 155, 150], 0.1);

  // Material stacks on the ground
  const stack = (mx: number, mw: number, rows: number, color: [number, number, number]) => {
    const my = horizon + 34;
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < 5; i++)
        pm.fillRectShaded(mx + i * (mw / 5), my - (r + 1) * 10, mw / 5 - 2, 8, color, 0.08 * ((i + r) % 3));
  };
  stack(Math.floor(W * 0.06), 70, 3, [175, 120, 85]); // brick pallet
  stack(Math.floor(W * 0.68), 60, 2, [150, 150, 155]); // steel bundles
  // dirt pile
  const pileX = Math.floor(W * (0.4 + rng() * 0.2));
  for (let i = 0; i < 26; i++) pm.fillRectShaded(pileX - i * 2, horizon + 46 - i * 2, i * 4 + 4, 3, [140, 115, 90], 0.12);

  // Coarse texture: 6x6 blocks nudged up/down one posterisation level so
  // flat fills read as photos while the PNG stays highly compressible —
  // per-pixel noise would bloat the file.
  const BLOCK = 6;
  const quant = (v: number): number => Math.max(0, Math.min(255, ((v | 0) & 0xe0) | 0x10));
  for (let by = 0; by < H; by += BLOCK)
    for (let bx = 0; bx < W; bx += BLOCK) {
      const n = (Math.sin(bx * 12.9898 + by * 78.233 + (hashString(seed) % 1000)) * 43758.5453) % 1;
      const shift = n < 0.33 ? -32 : n > 0.67 ? 32 : 0;
      if (shift === 0) continue;
      for (let y = by; y < Math.min(by + BLOCK, H); y++)
        for (let x = bx; x < Math.min(bx + BLOCK, W); x++) {
          const i = (y * W + x) * 3;
          pm.data[i] = quant(pm.data[i] + shift);
          pm.data[i + 1] = quant(pm.data[i + 1] + shift);
          pm.data[i + 2] = quant(pm.data[i + 2] + shift);
        }
    }

  return encodePng(W, H, pm.data);
}

/** Procedural ID-document placeholder: card layout with photo box + MRZ-style bars. */
function drawIdDocument(seed: string): Buffer {
  const rng = makeRng(`id:${seed}`);
  const W = 620;
  const H = 390;
  const pm = new Pixmap(W, H);
  pm.fillRect(0, 0, W, H, [235, 238, 242]);
  pm.fillRect(0, 0, W, 54, [28, 62, 124]); // header band
  for (let i = 0; i < 5; i++) pm.fillRect(24, 16 + i * 8, 120 + (i % 3) * 60, 4, [255, 255, 255]);
  pm.fillRect(0, H - 74, W, 74, [40, 44, 52]); // footer band

  // Photo box with a simple avatar
  pm.fillRectShaded(28, 80, 150, 180, [255, 255, 255], 0);
  pm.fillRectShaded(38, 90, 130, 160, [205, 215, 225], 0);
  pm.disc(103, 150, 34, [150, 125, 105]);
  pm.fillRectShaded(63, 190, 80, 55, [150, 125, 105], 0.08);

  // Personal-detail lines (abstract text bars)
  const lineColor: [number, number, number] = [90, 100, 115];
  const rows = 7;
  for (let i = 0; i < rows; i++) {
    const y = 92 + i * 24;
    pm.fillRect(200, y, 44, 5, [140, 148, 160]); // label
    pm.fillRect(252, y, 150 + Math.floor(rng() * 130), 5, lineColor); // value
  }

  // Flag-ish accent + issue stamp box
  pm.fillRectShaded(W - 130, 84, 100, 60, [255, 255, 255], 0);
  pm.fillRectShaded(W - 124, 90, 88, 3, [180, 60, 60], 0);
  for (let i = 0; i < 3; i++) pm.fillRect(W - 124, 100 + i * 12, 60 + (i % 2) * 20, 4, [120, 126, 138]);

  // MRZ zone: two rows of character-like glyph bars
  for (let row = 0; row < 2; row++) {
    const y = H - 56 + row * 26;
    let x = 20;
    let i = 0;
    while (x < W - 24) {
      const w = 4 + ((hashString(`${seed}:${row}:${i}`) % 5));
      pm.fillRect(x, y, w, 14, [225, 228, 232]);
      x += w + 5;
      i++;
    }
  }
  return encodePng(W, H, pm.data);
}

// ---------------------------------------------------------------------------
// Image file store (public/uploads, same location as the upload API)
// ---------------------------------------------------------------------------

const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

/** Write (once — content-addressed by key) and return the public URL. */
function storeImage(key: string, painter: (key: string) => Buffer): string {
  const filename = `demo-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}.png`;
  const filepath = join(UPLOADS_DIR, filename);
  if (!existsSync(filepath)) {
    if (!DRY_RUN) {
      if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });
      writeFileSync(filepath, painter(key));
    }
  }
  return `/uploads/${filename}`;
}

type FileEntry = { url: string; name?: string };

const sitePhoto = (key: string, name: string): FileEntry => ({
  url: storeImage(`site-${key}`, drawSitePhoto),
  name,
});

// ---------------------------------------------------------------------------
// Demo content pools (titles are <= 5 words per the proposal template)
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  'James', 'John', 'Peter', 'Paul', 'Simon', 'David', 'Daniel', 'Samuel', 'Joseph', 'Michael',
  'Brian', 'Kevin', 'Dennis', 'Collins', 'Fredrick', 'Antony', 'Vincent', 'Erick', 'Patrick', 'Kennedy',
  'Mary', 'Jane', 'Sarah', 'Grace', 'Faith', 'Mercy', 'Joy', 'Susan', 'Lucy', 'Esther',
  'Caroline', 'Naomy', 'Winfred', 'Janet', 'Alice', 'Sharon', 'Beatrice', 'Diana', 'Tabitha', 'Halima',
];

const LAST_NAMES = [
  'Kamau', 'Mwangi', 'Otieno', 'Ochieng', 'Mutiso', 'Kilonzo', 'Mutua', 'Kariuki', 'Njoroge', 'Wanjiku',
  'Achieng', 'Barasa', 'Wafula', 'Wanyama', 'Kimani', 'Ndungu', 'Maina', 'Cheruiyot', 'Kiptoo', 'Rotich',
  'Sang', 'Towett', 'Mohammed', 'Hassan', 'Abdi', 'Noor', 'Juma', 'Omondi', 'Odhiambo', 'Oduor',
  'Akinyi', 'Wairimu', 'Njeri', 'Nyambura', 'Chebet', 'Jerop', 'Korir', 'Boit', 'Kipchumba', 'Mutai',
];

const ACTIVITY_TITLES = [
  'Slab formwork installation',
  'Column reinforcement fixing',
  'Concrete pouring level two',
  'Blockwork ground floor',
  'Electrical conduit rough-in',
  'Plumbing wall chasing',
  'Scaffolding erection east wing',
  'Waterproofing wet areas',
  'Steel beam welding',
  'Painting preparation works',
  'Excavation drainage trench',
  'Door frame installation',
  'Roof truss assembly',
  'Curing slab water ponding',
  'Site housekeeping and clearance',
];

const TARGET_TITLES = [
  'Complete slab formwork',
  'Pour concrete level two',
  'Start first floor blockwork',
  'Fix remaining door frames',
  'Deliver steel beams',
  'Install roof trusses',
  'Backfill drainage trench',
  'Paint ground floor walls',
  'Erect west wing scaffolding',
  'Lay electrical conduits',
  'Cast lintels ground floor',
  'Waterproof roof slab',
];

const ACTIVITY_DESCRIPTIONS = [
  'Works proceeded as scheduled across the designated area with all crews deployed.',
  'Crews worked the full day; minor interruptions from material movement only.',
  'Progress slowed by afternoon drizzle but the section target was met.',
  'Supervised by the site engineer; quality checks passed on completion.',
  'Work executed per approved method statement and drawings revision C.',
  'Additional labour deployed from the general workforce to recover programme.',
];

const REMARKS = [
  'Good progress, on programme.',
  'Slightly behind; recovering tomorrow.',
  'Materials arrived on time.',
  'Awaiting inspection before next step.',
  'Crew performance satisfactory.',
  'Minor rework required on edges.',
  'Toolbox talk held before works.',
  null,
];

const DELIVERY_ITEMS: [string, string, number, number][] = [
  // item, unit, min qty, max qty
  ['Cement 32.5N', 'bags', 100, 400],
  ['River sand', 'tonnes', 15, 40],
  ['Ballast 3/4 inch', 'tonnes', 10, 30],
  ['Steel rebar Y12', 'lengths', 200, 600],
  ['Machine cut stones', 'pieces', 800, 2500],
  ['Timber 2x4', 'pieces', 100, 350],
  ['Waterproofing membrane', 'rolls', 10, 30],
  ['Ceramic tiles 600x600', 'boxes', 60, 180],
  ['Electrical conduit 25mm', 'rolls', 20, 60],
  ['Paint primer', 'drums', 8, 25],
];

const MATERIAL_ITEMS: [string, string, number, number][] = [
  ['Cement', 'bags', 80, 300],
  ['Plaster sand', 'tonnes', 10, 25],
  ['Binding wire', 'kg', 40, 120],
  ['Rebar Y10', 'lengths', 150, 450],
  ['Door frames', 'pcs', 10, 30],
  ['Roofing sheets', 'pcs', 40, 120],
  ['Nails and screws', 'kg', 20, 60],
  ['Tile adhesive', 'bags', 30, 90],
];

const SUPPLIER_NAMES = [
  'Demo Hardware Supplies Ltd',
  'Demo Cement Distributors KE',
  'Demo Steel & Timber Yard',
];

const VISITOR_PURPOSES = [
  'Site inspection',
  'Materials delivery follow-up',
  'Consultant site visit',
  'Safety audit',
  'Client progress walkthrough',
  'Utility company assessment',
];

const INCIDENT_TITLES = [
  'Minor scaffold trip hazard',
  'Small cut treated on site',
  'Near miss: falling object',
  'PPE non-compliance observed',
];

const INCIDENT_DESCRIPTIONS = [
  'Identified during routine morning safety walk. Corrected immediately by the safety officer.',
  'First aid administered on site; no lost time recorded. Toolbox talk repeated with the crew.',
  'Area cordoned and briefing issued. No injury reported; monitoring continues.',
];

const ATTENDANCE_NOTES_PRESENT = [
  'Biometric check-in',
  'Biometric check-in',
  'Biometric check-in',
  'Biometric check-in | Morning rain delay',
  'Biometric check-in | Deployed to east wing',
];

// ---------------------------------------------------------------------------
// Date helpers (local-midnight semantics like the daily-reports API)
// ---------------------------------------------------------------------------

function parseDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

const dayKey = (date: Date): string => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
};

/** Local wall-clock "YYYY-MM-DD HH:MM:SS" — the format the biometric
 *  backend's dv2_ai.records table stores and /api/getRecords returns. */
const formatSqlDateTime = (date: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
    `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
  );
};

function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const stop = new Date(to);
  stop.setHours(0, 0, 0, 0);
  while (cursor <= stop) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Date at a local time-of-day (minutes since midnight, may exceed 59) on the same day. */
const atTime = (day: Date, minutesFromMidnight: number): Date => {
  const d = new Date(day);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutesFromMidnight);
  return d;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!SITE_ARG) fail('Missing --site <siteId>. Run with --help-style flags: --site <id> --workers <n> --from <YYYY-MM-DD> --to <YYYY-MM-DD> [--replace] [--dry-run]');
  if (!FROM_ARG || !TO_ARG) fail('Missing --from <YYYY-MM-DD> and/or --to <YYYY-MM-DD>.');
  const fromDay = parseDay(FROM_ARG);
  const toDay = parseDay(TO_ARG);
  if (!fromDay || !toDay) fail('--from/--to must be valid YYYY-MM-DD dates.');
  if (fromDay > toDay) fail('--from must be on or before --to.');
  const workerCount = Math.max(0, Math.min(MAX_WORKERS, parseInt(WORKERS_ARG, 10) || 0));
  const days = eachDay(fromDay, toDay);
  if (days.length > MAX_DAYS) fail(`Range too long (${days.length} days); max is ${MAX_DAYS}.`);

  const site = await prisma.site.findUnique({
    where: { id: SITE_ARG },
    select: { id: true, name: true, contractorId: true },
  });
  if (!site) fail(`Site "${SITE_ARG}" not found.`);
  const contractorId = site.contractorId;
  const contractor = await prisma.contractor.findUnique({
    where: { id: contractorId },
    select: { userId: true, companyName: true },
  });

  process.stdout.write(
    `Seeding demo data for site "${site.name}" (${site.id})\n` +
      `  contractor: ${contractor?.companyName || contractorId}\n` +
      `  workers:   ${workerCount || '(existing site workers only)'}\n` +
      `  range:     ${dayKey(fromDay)} .. ${dayKey(toDay)} (${days.length} day(s))\n` +
      `  mode:      ${DRY_RUN ? 'DRY RUN' : 'WRITE'}${REPLACE ? ' + replace' : ''}\n\n`
  );

  // -----------------------------------------------------------------------
  // 0. --replace: clear this script's data for the site/range
  // -----------------------------------------------------------------------
  if (REPLACE) {
    // count() returns a number while deleteMany() returns { count } —
    // normalise so the summary prints real numbers in both modes.
    // Reports/attendance are keyed at local midnight so [from, to] works,
    // but visitors/incidents/POs carry mid-day timestamps — bound those at
    // the END of the last day.
    const rangeEnd = new Date(toDay);
    rangeEnd.setHours(23, 59, 59, 999);
    const removedReports = DRY_RUN
      ? { count: await prisma.dailyReport.count({ where: { siteId: site.id, reportDate: { gte: fromDay, lte: toDay } } }) }
      : await prisma.dailyReport.deleteMany({ where: { siteId: site.id, reportDate: { gte: fromDay, lte: toDay } } });
    const removedAttendance = DRY_RUN
      ? { count: await prisma.attendance.count({ where: { worker: { siteId: site.id }, date: { gte: fromDay, lte: toDay } } }) }
      : await prisma.attendance.deleteMany({ where: { worker: { siteId: site.id }, date: { gte: fromDay, lte: toDay } } });
    // Demo-tagged extras (matched by this script's naming conventions only).
    const removedVisitors = DRY_RUN
      ? { count: await prisma.visitor.count({ where: { siteId: site.id, checkInTime: { gte: fromDay, lte: rangeEnd }, company: { startsWith: 'Demo ' } } }) }
      : await prisma.visitor.deleteMany({ where: { siteId: site.id, checkInTime: { gte: fromDay, lte: rangeEnd }, company: { startsWith: 'Demo ' } } });
    const removedIncidents = DRY_RUN
      ? { count: await prisma.safetyIncident.count({ where: { siteId: site.id, incidentDate: { gte: fromDay, lte: rangeEnd }, reportedBy: { startsWith: 'Demo ' } } }) }
      : await prisma.safetyIncident.deleteMany({ where: { siteId: site.id, incidentDate: { gte: fromDay, lte: rangeEnd }, reportedBy: { startsWith: 'Demo ' } } });
    const removedPOs = DRY_RUN
      ? { count: await prisma.purchaseOrder.count({ where: { siteId: site.id, orderNumber: { startsWith: 'PO-DEMO-' }, OR: [{ receivedInFullDate: { gte: fromDay, lte: rangeEnd } }, { partiallyReceivedDate: { gte: fromDay, lte: rangeEnd } }] } }) }
      : await prisma.purchaseOrder.deleteMany({ where: { siteId: site.id, orderNumber: { startsWith: 'PO-DEMO-' }, OR: [{ receivedInFullDate: { gte: fromDay, lte: rangeEnd } }, { partiallyReceivedDate: { gte: fromDay, lte: rangeEnd } }] } });
    process.stdout.write(
      `replace: removed ${removedReports.count} report(s), ${removedAttendance.count} attendance row(s), ` +
        `${removedVisitors.count} visitor(s), ${removedIncidents.count} incident(s), ${removedPOs.count} demo PO(s)\n\n`
    );
  }

  // -----------------------------------------------------------------------
  // 1. Supporting records: designations, shift, biometric device, suppliers
  // -----------------------------------------------------------------------
  let designations = await prisma.designation.findMany({
    where: { contractorId, isActive: true },
    orderBy: { salary: 'desc' },
    select: { id: true, title: true, salary: true },
  });
  if (designations.length === 0) {
    const data = [
      { title: 'Site Manager', description: 'Oversees entire site operations', salary: 200000, paymentFrequency: 'monthly' },
      { title: 'Project Engineer', description: 'Handles engineering aspects', salary: 150000, paymentFrequency: 'monthly' },
      { title: 'Foreman', description: 'Leads worker teams', salary: 75000, paymentFrequency: 'monthly' },
      { title: 'Mason', description: 'Stone and brick work', salary: 55000, paymentFrequency: 'monthly' },
      { title: 'Electrician', description: 'Electrical installations', salary: 60000, paymentFrequency: 'monthly' },
      { title: 'Laborer', description: 'General site work', salary: 30000, paymentFrequency: 'daily' },
    ];
    if (!DRY_RUN) {
      await prisma.designation.createMany({ data: data.map((d) => ({ contractorId, ...d })) });
      designations = await prisma.designation.findMany({
        where: { contractorId, isActive: true },
        orderBy: { salary: 'desc' },
        select: { id: true, title: true, salary: true },
      });
      process.stdout.write(`created ${designations.length} designation(s)\n`);
    } else {
      designations = data.map((d, i) => ({ id: `dry-${i}`, title: d.title, salary: d.salary }));
      process.stdout.write(`would create ${designations.length} designation(s)\n`);
    }
  }

  let shift = await prisma.shift.findFirst({
    where: { contractorId },
    orderBy: { createdAt: 'asc' },
  });
  if (!shift) {
    const sn = '08:00-17:00, Mon-Sat';
    if (!DRY_RUN) {
      shift = await prisma.shift.create({
        data: {
          contractorId,
          name: 'General Site Shift',
          startTime: '08:00',
          endTime: '17:00',
          breakDuration: 60,
          workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
          allowOvertime: true,
          overtimeThresholdMinutes: 15,
          overtimeRateType: 'hourly',
          overtimeRateAmount: 1.5,
        },
      });
    }
    process.stdout.write(`${DRY_RUN ? 'would create' : 'created'} shift "General Site Shift" (${sn})\n`);
  }

  // Demo biometric device: the scan rows this script writes live in the
  // biometric backend's dv2_ai.records table under device_serial_num
  // 'demo', so the app needs an ACTIVE device with that serial for the
  // live attendance pull to query it. Shared per contractor (unique per
  // contractor + sn), linked to the first site it was created for.
  const DEMO_SN = 'demo';
  let device = await prisma.biometricDevice.findUnique({
    where: { contractorId_sn: { contractorId, sn: DEMO_SN } },
  });
  if (!device) {
    if (!DRY_RUN) {
      device = await prisma.biometricDevice.create({
        data: {
          contractorId,
          siteId: site.id,
          name: 'Demo Terminal',
          sn: DEMO_SN,
          location: 'Main gate',
          isActive: true,
        },
      });
    }
    process.stdout.write(`${DRY_RUN ? 'would create' : 'created'} biometric device (sn "${DEMO_SN}") for the contractor\n`);
  } else if (!device.isActive && !DRY_RUN) {
    await prisma.biometricDevice.update({ where: { id: device.id }, data: { isActive: true } });
    process.stdout.write(`reactivated existing demo device (sn "${DEMO_SN}")\n`);
  }
  const deviceSn = DEMO_SN;

  let suppliers = await prisma.supplier.findMany({
    where: { contractorId },
    select: { id: true, name: true },
  });
  if (suppliers.length === 0) {
    if (!DRY_RUN) {
      await prisma.supplier.createMany({
        data: SUPPLIER_NAMES.map((name, i) => ({
          contractorId,
          name,
          contactPerson: `${pick(makeRng(`supplier:${site.id}:${i}`), FIRST_NAMES)} ${pick(makeRng(`supplier:${site.id}:${i}:l`), LAST_NAMES)}`,
          phone: `+2547110002${String(i).padStart(2, '0')}`,
          email: `sales${i + 1}@demo-suppliers.co.ke`,
        })),
      });
      suppliers = await prisma.supplier.findMany({
        where: { contractorId },
        select: { id: true, name: true },
      });
      process.stdout.write(`created ${suppliers.length} demo supplier(s)\n`);
    } else {
      // Dry run: placeholder names so report/PO generation is exercised.
      suppliers = SUPPLIER_NAMES.map((name) => ({ id: `dry-${name}`, name }));
      process.stdout.write(`would create ${suppliers.length} demo supplier(s)\n`);
    }
  }

  const rateByCategory = new Map<string, number>(
    designations.map((d) => [d.title.trim().toLowerCase(), d.salary || 0])
  );
  const computeLabourCost = (workforce: { category: string; count: number }[]): number =>
    workforce.reduce(
      (sum, e) => sum + e.count * (rateByCategory.get(e.category.trim().toLowerCase()) || 0),
      0
    );

  // -----------------------------------------------------------------------
  // 2. Workers
  // -----------------------------------------------------------------------
  const existingNationalIds = new Set(
    (
      await prisma.worker.findMany({
        where: { contractorId, nationalId: { not: null } },
        select: { nationalId: true },
      })
    ).map((w) => w.nationalId as string)
  );

  let workers = await prisma.worker.findMany({
    where: { siteId: site.id, status: 'Active' },
    select: { id: true, name: true, designationId: true, shiftId: true, email: true, idDocumentUrl: true, enrollId: true },
    orderBy: { createdAt: 'asc' },
  });

  const createdWorkers: { id: string; name: string; designationId: string | null; enrollId: string | null }[] = [];
  if (workerCount > 0) {
    // Idempotency: workers this script previously seeded are tagged by the
    // @demo-reconsmi.co.ke email domain — reuse them first so reruns top
    // the site up to --workers instead of duplicating people.
    const demoWorkers = workers.filter((w) => (w.email || '').endsWith('@demo-reconsmi.co.ke'));
    const demoEmailCount = demoWorkers.length;
    const toCreate = Math.max(0, workerCount - demoEmailCount);
    if (demoEmailCount > 0) {
      process.stdout.write(
        `reusing ${Math.min(demoEmailCount, workerCount)} existing demo worker(s) on the site\n`
      );
      // Re-materialise ID-document images for reused workers when the file
      // is gone (e.g. public/uploads was cleaned) so the profile stays full.
      if (!DRY_RUN) {
        for (const w of demoWorkers) {
          const filename = (w.idDocumentUrl || '').split('/').pop();
          if (!filename || !filename.endsWith('.png')) continue;
          const filepath = join(UPLOADS_DIR, filename);
          if (!existsSync(filepath)) writeFileSync(filepath, drawIdDocument(filename));
        }
      }
    }
    if (toCreate === 0) {
      process.stdout.write('worker target already met - no new workers needed\n');
    }
    // Weighted designation pick: junior (cheaper) categories get more people.
    const weightedDesignations = designations.flatMap((d, idx) =>
      Array<{ id: string; title: string }>(Math.min(designations.length - idx, 4)).fill(d)
    );
    const rng = makeRng(`${site.id}:workers:v1`);
    const usedNames = new Set<string>(workers.map((w) => w.name));
    const existingEnrollIds = new Set(
      (await prisma.worker.findMany({ where: { contractorId, enrollId: { not: null } }, select: { enrollId: true } }))
        .map((w) => Number(w.enrollId))
        .filter((n) => !isNaN(n))
    );
    let enrollSeq = 1000;
    while (existingEnrollIds.has(enrollSeq)) enrollSeq++;
    let idSeq = 30000000 + Math.floor(rng() * 2000000);

    for (let i = 0; i < toCreate; i++) {
      // Unique name
      let first = pick(rng, FIRST_NAMES);
      let last = pick(rng, LAST_NAMES);
      let guard = 0;
      while (usedNames.has(`${first} ${last}`) && guard++ < 200) {
        first = pick(rng, FIRST_NAMES);
        last = pick(rng, LAST_NAMES);
      }
      const name = `${first} ${last}`;
      usedNames.add(name);

      while (existingNationalIds.has(String(idSeq))) idSeq++;
      const nationalId = String(idSeq++);
      existingNationalIds.add(nationalId);

      const designation = weightedDesignations.length
        ? weightedDesignations[Math.floor(rng() * weightedDesignations.length)]
        : null;
      const enrollId = String(enrollSeq++);
      const paymentMode = pickWeighted(rng, [
        ['mpesa', 6],
        ['bank', 2],
        ['manual', 2],
      ] as [string, number][]);

      const idDocUrl = storeImage(`national-id-${site.id}-${nationalId}`, drawIdDocument);
      const slug = `${first}.${last}`.toLowerCase();

      if (!DRY_RUN) {
        const worker = await prisma.worker.create({
          data: {
            contractorId,
            siteId: site.id,
            name,
            email: `${slug}.${nationalId}@demo-reconsmi.co.ke`,
            phone: `+2547${String(10000000 + Math.floor(rng() * 89999999)).slice(0, 8)}`,
            nationalId,
            designationId: designation?.id ?? null,
            shiftId: shift?.id ?? null,
            paymentMode,
            paymentPhone: paymentMode === 'mpesa' ? `+2547${String(20000000 + Math.floor(rng() * 9999999))}` : null,
            paymentAccount: paymentMode === 'bank' ? `01${String(Math.floor(rng() * 1e8)).padStart(8, '0')}` : null,
            status: 'Active',
            joinedAt: new Date(fromDay.getTime() - (30 + Math.floor(rng() * 60)) * 86400000),
            enrollId,
            idDocumentUrl: idDocUrl,
          },
        });
        if (shift) {
          await prisma.workerShift.create({ data: { workerId: worker.id, shiftId: shift.id } }).catch(() => {});
        }
        createdWorkers.push({ id: worker.id, name, designationId: designation?.id ?? null, enrollId });
      } else {
        createdWorkers.push({ id: `dry-${i}`, name, designationId: designation?.id ?? null, enrollId });
      }
    }
    process.stdout.write(
      `${DRY_RUN ? 'would create' : 'created'} ${createdWorkers.length} worker(s)` +
        (createdWorkers.length > 0 ? ' (profiles + shift assignment + ID document image)' : '') +
        `\n`
    );
    if (!DRY_RUN) {
      workers = await prisma.worker.findMany({
        where: { siteId: site.id, status: 'Active' },
        select: { id: true, name: true, designationId: true, shiftId: true, email: true, idDocumentUrl: true, enrollId: true },
        orderBy: { createdAt: 'asc' },
      });
    }
  }

  if (workers.length === 0 && createdWorkers.length === 0) {
    fail('No active workers on this site (and --workers is 0). Nothing to generate attendance for.');
  }
  // Real runs re-queried `workers` after creating; dry runs stitch the
  // existing workers + the would-be-created placeholders together.
  const targetWorkers = DRY_RUN ? [...workers, ...createdWorkers] : workers;

  // -----------------------------------------------------------------------
  // 3. Attendance (+ biometric logs)
  // -----------------------------------------------------------------------
  const shiftShape: ShiftShape | null = shift
    ? {
        id: shift.id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakDuration: shift.breakDuration,
        allowOvertime: shift.allowOvertime,
        workingDays: shift.workingDays,
        overtimeThresholdMinutes: shift.overtimeThresholdMinutes,
        overtimeRateType: shift.overtimeRateType,
        overtimeRateAmount: shift.overtimeRateAmount,
      }
    : DRY_RUN
      ? {
          // Dry-run preview shape when the contractor has no shift yet.
          name: 'General Site Shift',
          startTime: '08:00',
          endTime: '17:00',
          breakDuration: 60,
          allowOvertime: true,
          workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
          overtimeThresholdMinutes: 15,
          overtimeRateType: 'hourly',
          overtimeRateAmount: 1.5,
        }
      : null;
  const workingMask = parseWorkingDays(shift?.workingDays ?? null);
  const isRestDay = (day: Date): boolean =>
    workingMask ? !workingMask.has(day.getDay()) : day.getDay() === 0;

  const parseHHMM = (value: string | null | undefined): number => {
    if (!value) return 0;
    const [h, m] = value.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const shiftStartMin = parseHHMM(shiftShape?.startTime);
  const shiftEndMin = parseHHMM(shiftShape?.endTime);

  type PlannedAttendance = {
    workerId: string;
    shiftId: string | null;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    totalHours: number;
    overtimeHours: number;
    lateHours: number;
    lateDays: number;
    status: string;
    notes: string | null;
  };

  // Skip days that already have rows (unless --replace already cleared them).
  const existingAttendance = new Set(
    (
      await prisma.attendance.findMany({
        where: { workerId: { in: targetWorkers.map((w) => w.id) }, date: { gte: fromDay, lte: toDay } },
        select: { workerId: true, date: true },
      })
    ).map((r) => `${r.workerId}:${dayKey(new Date(r.date))}`)
  );

  const planned: PlannedAttendance[] = [];
  const skippedAttendance = new Set<string>();
  for (const day of days) {
    const dayRng = makeRng(`${site.id}:${dayKey(day)}:attendance`);
    for (const worker of targetWorkers) {
      const key = `${worker.id}:${dayKey(day)}`;
      if (existingAttendance.has(key)) {
        skippedAttendance.add(key);
        continue;
      }
      const rest = isRestDay(day);
      const roll = dayRng();
      let status: string;
      if (rest) status = roll < 0.78 ? 'Absent' : 'Present';
      else if (roll < 0.84) status = 'Present';
      else if (roll < 0.92) status = 'Late';
      else status = 'Absent';

      if (status === 'Absent' || !shiftShape) {
        planned.push({
          workerId: worker.id,
          shiftId: shift?.id ?? null,
          date: day,
          checkIn: null,
          checkOut: null,
          totalHours: 0,
          overtimeHours: 0,
          lateHours: 0,
          lateDays: 0,
          status: 'Absent',
          notes: rest ? 'Rest day' : 'No biometric scan recorded',
        });
        continue;
      }

      const lateMinutes = status === 'Late' ? 15 + Math.floor(dayRng() * 55) : -8 + Math.floor(dayRng() * 14);
      const checkIn = atTime(day, shiftStartMin + lateMinutes);
      // overtime mix: 55% on time, 35% short OT, 10% long OT
      const otRoll = dayRng();
      const stayExtra =
        otRoll < 0.55 ? Math.floor(dayRng() * 12) - 4 : otRoll < 0.9 ? 20 + Math.floor(dayRng() * 55) : 90 + Math.floor(dayRng() * 60);
      const checkOut = atTime(day, shiftEndMin + Math.max(0, stayExtra));
      const worked = computeWorkedHours(checkIn, checkOut, shiftShape);

      planned.push({
        workerId: worker.id,
        shiftId: shift?.id ?? null,
        date: day,
        checkIn,
        checkOut,
        totalHours: round(worked.totalHours),
        overtimeHours: round(worked.overtimeHours),
        lateHours: round(worked.lateHours),
        lateDays: worked.lateDays,
        status,
        notes:
          status === 'Late'
            ? `Late arrival (${worked.lateMinutes} min)${deviceSn ? ` - terminal ${deviceSn}` : ''}`
            : pick(dayRng, ATTENDANCE_NOTES_PRESENT),
      });
    }
  }

  // Present-worker counts per designation title per day (drives the
  // reports' actual workforce — the daily-report meta counts status
  // 'Present' only). Seeded from rows that already existed for skipped
  // days (queried BEFORE the createMany below so new rows aren't counted
  // twice), then topped up with the rows planned above (disjoint key
  // sets).
  const presentByDay = new Map<string, Map<string, number>>();
  const designationTitleById = new Map(designations.map((d) => [d.id, d.title]));
  const designationByWorkerId = new Map(
    targetWorkers.map((w) => [w.id, (w.designationId && designationTitleById.get(w.designationId)) || 'Uncategorised'])
  );
  const bumpPresent = (day: Date, title: string) => {
    const key = dayKey(day);
    const perDay = presentByDay.get(key) || new Map<string, number>();
    perDay.set(title, (perDay.get(title) || 0) + 1);
    presentByDay.set(key, perDay);
  };
  if (!DRY_RUN) {
    const preExisting = await prisma.attendance.findMany({
      where: {
        contractorId,
        worker: { siteId: site.id },
        date: { gte: fromDay, lte: toDay },
        status: 'Present',
      },
      select: { date: true, worker: { select: { designationId: true } } },
    });
    for (const row of preExisting) {
      const title =
        (row.worker.designationId && designationTitleById.get(row.worker.designationId)) || 'Uncategorised';
      bumpPresent(new Date(row.date), title);
    }
  }
  for (const p of planned) {
    if (p.status !== 'Present') continue;
    bumpPresent(p.date, designationByWorkerId.get(p.workerId) || 'Uncategorised');
  }

  let attendanceCreated = 0;
  if (planned.length > 0 && !DRY_RUN) {
    await prisma.attendance.createMany({
      data: planned.map((p) => ({
        contractorId,
        workerId: p.workerId,
        shiftId: p.shiftId,
        date: p.date,
        checkIn: p.checkIn,
        checkOut: p.checkOut,
        totalHours: p.totalHours,
        overtimeHours: p.overtimeHours,
        lateHours: p.lateHours,
        lateDays: p.lateDays,
        status: p.status,
        notes: p.notes,
      })),
    });
    attendanceCreated = planned.length;
  }
  if (!DRY_RUN && planned.length > 0) {
    // Biometric IN/OUT logs — only for rows created by THIS run (a rerun
    // over an overlapping range must not duplicate logs on existing rows).
    const plannedKeys = new Set(planned.map((p) => `${p.workerId}:${dayKey(p.date)}`));
    const savedRows = await prisma.attendance.findMany({
      where: { workerId: { in: targetWorkers.map((w) => w.id) }, date: { gte: fromDay, lte: toDay } },
      select: { id: true, workerId: true, date: true, checkIn: true, checkOut: true },
    });
    const logs = savedRows
      .filter((row) => plannedKeys.has(`${row.workerId}:${dayKey(new Date(row.date))}`))
      .flatMap((row) => {
        const out: { attendanceId: string; type: string; timestamp: Date; deviceName: string | null }[] = [];
        if (row.checkIn) out.push({ attendanceId: row.id, type: 'IN', timestamp: new Date(row.checkIn), deviceName: deviceSn });
        if (row.checkOut) out.push({ attendanceId: row.id, type: 'OUT', timestamp: new Date(row.checkOut), deviceName: deviceSn });
        return out;
      });
    if (logs.length > 0) await prisma.attendanceLog.createMany({ data: logs });
  }
  process.stdout.write(
    `${DRY_RUN ? 'would create' : 'created'} ${DRY_RUN ? planned.length : attendanceCreated} attendance row(s)` +
      (skippedAttendance.size > 0 ? ` (skipped ${skippedAttendance.size} existing)` : '') +
      ` + biometric IN/OUT logs\n`
  );

  // -----------------------------------------------------------------------
  // 3b. Biometric scan rows in the dv2_ai backend (records table).
  // The attendance page pulls scan records live from the biometric API
  // (BIOMETRIC_API_BASE_URL -> /api/getRecords per active device), so the
  // seeded attendance only appears there when matching rows exist in the
  // biometric backend's database. One IN + one OUT scan per punched
  // attendance row, filed under the shared "demo" device serial.
  // -----------------------------------------------------------------------
  let scansInserted = 0;
  let enrollIdsAssigned = 0;
  if (!DRY_RUN) {
    // workerId -> numeric enrollId (assigning fresh globally-unique ids to
    // site workers that don't have one, so their scans map back).
    const enrollByWorkerId = new Map<string, number>();
    for (const w of targetWorkers) {
      const n = Number(w.enrollId);
      if (w.enrollId != null && w.enrollId !== '' && !isNaN(n)) enrollByWorkerId.set(w.id, n);
    }
    const missing = targetWorkers.filter((w) => !enrollByWorkerId.has(w.id));
    if (missing.length > 0) {
      // Start above every enrollId in use across ALL workers so the demo
      // device namespace never collides with another contractor's.
      const maxRow: any = await prisma.$queryRawUnsafe(
        'SELECT CAST(MAX(CAST(enrollId AS UNSIGNED)) AS CHAR) as m FROM Worker'
      );
      let next = Math.max(1000, Number(maxRow[0]?.m || 0) + 1);
      for (const w of missing) {
        await prisma.worker.update({ where: { id: w.id }, data: { enrollId: String(next) } });
        enrollByWorkerId.set(w.id, next);
        next++;
      }
      enrollIdsAssigned = missing.length;
      process.stdout.write(`assigned enrollIds to ${missing.length} worker(s) without one\n`);
    }

    // Every punched attendance row on the site in range (new + pre-existing
    // without scans) becomes a scan pair.
    const punched = await prisma.attendance.findMany({
      where: {
        worker: { siteId: site.id },
        date: { gte: fromDay, lte: toDay },
        checkIn: { not: null },
        checkOut: { not: null },
      },
      select: { workerId: true, checkIn: true, checkOut: true },
    });
    const scans: { enrollId: number; time: Date }[] = [];
    for (const row of punched) {
      const eid = enrollByWorkerId.get(row.workerId);
      if (!eid) continue;
      scans.push({ enrollId: eid, time: new Date(row.checkIn!) });
      scans.push({ enrollId: eid, time: new Date(row.checkOut!) });
    }

    if (scans.length > 0) {
      const enrollIds = Array.from(new Set(scans.map((s) => s.enrollId)));
      const rangeStartSql = formatSqlDateTime(fromDay);
      const rangeEndDay = new Date(toDay);
      rangeEndDay.setHours(23, 59, 59, 999);
      try {
        if (REPLACE) {
          const removed = await prisma.$executeRaw`
            DELETE FROM dv2_ai.records
            WHERE device_serial_num = ${DEMO_SN}
              AND records_time >= ${rangeStartSql}
              AND records_time <= ${formatSqlDateTime(rangeEndDay)}
              AND enroll_id IN (${Prisma.join(enrollIds)})
          `;
          if (removed > 0) process.stdout.write(`replace: removed ${removed} demo scan row(s) from dv2_ai.records\n`);
        }
        // Skip scans that already exist (idempotent reruns).
        const existing: any = await prisma.$queryRaw`
          SELECT CAST(enroll_id AS CHAR) as eid, CAST(records_time AS CHAR) as rt
          FROM dv2_ai.records
          WHERE device_serial_num = ${DEMO_SN}
            AND records_time >= ${rangeStartSql}
            AND records_time <= ${formatSqlDateTime(rangeEndDay)}
            AND enroll_id IN (${Prisma.join(enrollIds)})
        `;
        const have = new Set<string>(existing.map((r: any) => `${r.eid}|${r.rt}`));
        const toInsert = scans.filter((s) => !have.has(`${s.enrollId}|${formatSqlDateTime(s.time)}`));
        const BATCH = 500;
        for (let i = 0; i < toInsert.length; i += BATCH) {
          const values = toInsert
            .slice(i, i + BATCH)
            .map((s) =>
              Prisma.sql`(${s.enrollId}, ${formatSqlDateTime(s.time)}, 8, 0, 0, ${DEMO_SN}, 0, NULL)`
            );
          scansInserted += await prisma.$executeRaw`
            INSERT INTO dv2_ai.records (enroll_id, records_time, mode, intOut, event, device_serial_num, temperature, image)
            VALUES ${Prisma.join(values)}
          `;
        }
        process.stdout.write(
          `inserted ${scansInserted} scan row(s) into dv2_ai.records for device "${DEMO_SN}"` +
            (toInsert.length < scans.length ? ` (skipped ${scans.length - toInsert.length} existing)` : '') +
            `\n`
        );
      } catch (err: any) {
        process.stdout.write(
          `WARNING: could not write scan rows to the dv2_ai database (${String(err.message).slice(0, 120)}). ` +
            `DB attendance is seeded, but the live attendance page (biometric API source) will not show it.\n`
        );
      }
    }
  } else if (DRY_RUN) {
    const withoutEnroll = targetWorkers.filter((w) => !w.enrollId).length;
    if (withoutEnroll > 0)
      process.stdout.write(`would assign enrollIds to ${withoutEnroll} worker(s) without one\n`);
    process.stdout.write('would insert matching scan rows into dv2_ai.records (device "demo")\n');
  }

  // -----------------------------------------------------------------------
  // 4. Daily reports (+ visitors, incidents, purchase orders)
  // -----------------------------------------------------------------------
  const existingReports = new Set(
    (
      await prisma.dailyReport.findMany({
        where: { siteId: site.id, reportDate: { gte: fromDay, lte: toDay } },
        select: { reportDate: true },
      })
    ).map((r) => dayKey(new Date(r.reportDate)))
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type PrevTarget = { title: string; workforce: { category: string; count: number }[] };
  let prevTargets: PrevTarget[] = [];

  const splitWorkforce = (workforce: { category: string; count: number }[], parts: number) => {
    // Distribute whole workers across `parts` activities without losing heads.
    const result: { category: string; count: number }[][] = Array.from({ length: parts }, () => []);
    workforce.forEach((entry, idx) => {
      const per = Math.floor(entry.count / parts);
      let remainder = entry.count % parts;
      for (let p = 0; p < parts; p++) {
        const count = per + (remainder-- > 0 ? 1 : 0);
        if (count <= 0) continue;
        // rotate category order so activities don't all look identical
        const slot = (idx + p) % parts;
        result[slot].push({ category: entry.category, count });
      }
    });
    return result;
  };

  let reportsCreated = 0;
  let visitorsCreated = 0;
  let incidentsCreated = 0;
  let posCreated = 0;
  const siteTag = site.id.slice(-6);
  let poSeq = Math.floor(makeRng(`${site.id}:po`)() * 900) + 100;

  for (const day of days) {
    const key = dayKey(day);
    if (existingReports.has(key)) continue;
    const rng = makeRng(`${site.id}:${key}:report`);
    const present = Array.from(presentByDay.get(key)?.entries() || []).map(([category, count]) => ({
      category,
      count,
    }));

    // ---- Section A: today's performance (activities) ----
    const activityCount = 3 + Math.floor(rng() * 2); // 3-4
    const actualSplit = splitWorkforce(present, activityCount);
    const fallbackTitles = shuffled(rng, ACTIVITY_TITLES);
    const usedTitles = new Set<string>();
    const activities = Array.from({ length: activityCount }, (_, i) => {
      // Chain from yesterday's targets when possible (as the form does);
      // fall back to the title pool when there are more activities today.
      // Titles stay unique within a report.
      let title = prevTargets[i]?.title ?? '';
      if (!title || usedTitles.has(title)) {
        title = fallbackTitles.find((t) => !usedTitles.has(t)) ?? title;
      }
      usedTitles.add(title);
      const prev = prevTargets.find((t) => t.title === title) ?? null;
      const actual = actualSplit[i] || [];
      return {
        position: i + 1,
        title: title.slice(0, 60),
        description: pick(rng, ACTIVITY_DESCRIPTIONS),
        plannedWorkforce: prev ? prev.workforce : null,
        actualWorkforce: actual,
        labourCost: computeLabourCost(actual),
        verdict: pickWeighted(rng, [
          ['achieved', 13],
          ['partially_achieved', 5],
          ['not_achieved', 2],
        ] as [string, number][]),
        remarks: pick(rng, REMARKS),
        photos: [sitePhoto(`${site.id}:${key}-act${i + 1}`, `${title.split(' ')[0].toLowerCase()}-progress-${key}.png`)],
      };
    });

    // ---- Section B: next day's targets ----
    const targetCount = 3 + Math.floor(rng() * 2); // 3-4
    const targetTitles = shuffled(rng, TARGET_TITLES);
    const nextTargets = Array.from({ length: targetCount }, (_, i) => {
      const base = present.length > 0 ? present : designations.slice(0, 3).map((d) => ({ category: d.title, count: 2 }));
      const workforce = base.map((entry) => ({
        category: entry.category,
        count: Math.max(1, entry.count + (Math.floor(rng() * 5) - 1)),
      }));
      return {
        position: i + 1,
        title: targetTitles[i % targetTitles.length].slice(0, 60),
        description: pick(rng, ACTIVITY_DESCRIPTIONS),
        workforce,
        remarks: pick(rng, REMARKS),
        uploads: [sitePhoto(`${site.id}:${key}-tgt${i + 1}`, `target-${i + 1}-${key}.png`)],
      };
    });

    // ---- Materials: deliveries received + materials required ----
    const deliveryCount = 2 + Math.floor(rng() * 2); // 2-3
    const deliveries = Array.from({ length: deliveryCount }, (_, i) => {
      const [item, unit, minQty, maxQty] = DELIVERY_ITEMS[(hashString(`${site.id}:${key}:d${i}`)) % DELIVERY_ITEMS.length];
      return {
        position: i + 1,
        item,
        quantity: minQty + Math.floor(rng() * (maxQty - minQty)),
        unit,
        supplier: pick(rng, suppliers).name,
        notes: pick(rng, ['Delivered with delivery note', 'Offloaded at main gate', 'Quality checked on arrival', null]),
        photos: [sitePhoto(`${site.id}:${key}-dlv${i + 1}`, `delivery-note-${item.split(' ')[0].toLowerCase()}-${key}.png`)],
      };
    });
    const materialCount = 2 + Math.floor(rng() * 2); // 2-3
    const materials = Array.from({ length: materialCount }, (_, i) => {
      const [item, unit, minQty, maxQty] = MATERIAL_ITEMS[hashString(`${site.id}:${key}:m${i}`) % MATERIAL_ITEMS.length];
      return {
        position: i + 1,
        item,
        quantity: minQty + Math.floor(rng() * (maxQty - minQty)),
        unit,
        notes: pick(rng, ['Required for tomorrow works', 'For next phase', 'Confirm stock before ordering', null]),
        photos: [sitePhoto(`${site.id}:${key}-mat${i + 1}`, `material-${item.split(' ')[0].toLowerCase()}-${key}.png`)],
      };
    });

    // ---- Report-level attachments ----
    const uploads = Array.from({ length: 2 + Math.floor(rng() * 3) }, (_, i) =>
      sitePhoto(`${site.id}:${key}-att${i + 1}`, `site-overview-${i + 1}-${key}.png`)
    );

    const reportDate = day;

    if (!DRY_RUN) {
      await prisma.dailyReport.create({
        data: {
          siteId: site.id,
          reportDate,
          status: day < today ? 'Submitted' : 'Draft',
          uploads: uploads as any,
          createdBy: contractor?.userId ?? null,
          activities: { create: activities as any },
          targets: { create: nextTargets as any },
          deliveries: { create: deliveries as any },
          materials: { create: materials as any },
        },
      });
      reportsCreated++;

      // ---- Live-pulled sections: visitors, incidents, PO deliveries ----
      const visitorRows = Array.from({ length: 1 + Math.floor(rng() * 3) }, (_, i) => {
        const vrng = makeRng(`${site.id}:${key}:visitor${i}`);
        const name = `${pick(vrng, FIRST_NAMES)} ${pick(vrng, LAST_NAMES)}`;
        const inMin = 8 * 60 + 30 + Math.floor(vrng() * 6 * 60);
        return {
          siteId: site.id,
          name,
          company: `Demo ${pick(vrng, ['Consultants', 'Inspection Agency', 'Logistics', 'Supplier Reps'])}`,
          purpose: pick(vrng, VISITOR_PURPOSES),
          checkInTime: atTime(day, inMin),
          checkOutTime: atTime(day, inMin + 45 + Math.floor(vrng() * 150)),
        };
      });
      await prisma.visitor.createMany({ data: visitorRows });
      visitorsCreated += visitorRows.length;

      if (rng() < 0.18) {
        await prisma.safetyIncident.create({
          data: {
            siteId: site.id,
            title: pick(rng, INCIDENT_TITLES),
            description: pick(rng, INCIDENT_DESCRIPTIONS),
            type: pick(rng, ['Safety', 'First Aid', 'Near Miss']),
            severity: pickWeighted(rng, [
              ['low', 5],
              ['medium', 2],
              ['high', 1],
            ] as [string, number][]),
            status: pick(rng, ['Resolved', 'Reported', 'Monitoring']),
            incidentDate: atTime(day, 9 * 60 + Math.floor(rng() * 6 * 60)),
            reportedBy: 'Demo Safety Officer',
            attachments: storeImage(`${site.id}:${key}-incident`, drawSitePhoto),
          },
        });
        incidentsCreated++;
      }

      if (rng() < 0.34) {
        const supplier = pick(rng, suppliers);
        const itemCount = 2 + Math.floor(rng() * 2);
        const items = Array.from({ length: itemCount }, (_, i) => {
          const [item, unit, minQty, maxQty] =
            DELIVERY_ITEMS[hashString(`${site.id}:${key}:po${i}`) % DELIVERY_ITEMS.length];
          const quantity = minQty + Math.floor(rng() * (maxQty - minQty));
          const unitPrice = 300 + Math.floor(rng() * 2200);
          return {
            description: item,
            quantity,
            receivedQuantity: quantity,
            unitPrice,
            totalPrice: round(quantity * unitPrice, 2),
          };
        });
        const subtotal = items.reduce((sum, it) => sum + it.totalPrice, 0);
        const tax = round(subtotal * 0.16, 2);
        const orderNumber = `PO-DEMO-${siteTag}-${dayKey(day).replace(/-/g, '')}-${poSeq++}`;
        await prisma.purchaseOrder.create({
          data: {
            siteId: site.id,
            supplierId: supplier.id,
            orderNumber,
            status: 'delivered',
            subtotal,
            tax,
            total: round(subtotal + tax, 2),
            orderDate: atTime(day, 7 * 60 + Math.floor(rng() * 120)),
            expectedDeliveryDate: atTime(day, 10 * 60),
            receivedInFullDate: atTime(day, 10 * 60 + Math.floor(rng() * 240)),
            notes: 'Demo seeded delivery',
            items: { create: items },
          },
        });
        posCreated++;
      }
    } else {
      reportsCreated++;
    }

    prevTargets = nextTargets.map((t) => ({ title: t.title, workforce: t.workforce }));
  }

  process.stdout.write(
    `${DRY_RUN ? 'would create' : 'created'} ${reportsCreated} daily report(s)` +
      (existingReports.size > 0 ? ` (skipped ${existingReports.size} existing)` : '') +
      `${DRY_RUN ? ' with activities/targets/deliveries/materials + photo evidence' : ''}\n`
  );
  if (!DRY_RUN) {
    process.stdout.write(
      `          + ${visitorsCreated} visitor log(s), ${incidentsCreated} safety incident(s), ${posCreated} delivered purchase order(s)\n`
    );
  }

  // -----------------------------------------------------------------------
  // 5. Activity log entries (dashboard "recent activity")
  // -----------------------------------------------------------------------
  if (!DRY_RUN && contractor && (createdWorkers.length > 0 || reportsCreated > 0)) {
    const logs: {
      userId: string;
      contractorId: string;
      action: string;
      module: string;
      description: string;
      targetId?: string;
      details?: string;
    }[] = [];
    if (createdWorkers.length > 0) {
      logs.push({
        userId: contractor.userId,
        contractorId,
        action: 'CREATE',
        module: 'WORKERS',
        description: `Demo seed: registered ${createdWorkers.length} worker(s) on site "${site.name}"`,
        details: JSON.stringify({ siteId: site.id, workers: createdWorkers.length }),
      });
    }
    if (reportsCreated > 0) {
      logs.push({
        userId: contractor.userId,
        contractorId,
        action: 'CREATE',
        module: 'REPORTS',
        description: `Demo seed: generated ${reportsCreated} daily site report(s) for ${site.name}`,
        details: JSON.stringify({ siteId: site.id, from: dayKey(fromDay), to: dayKey(toDay) }),
      });
    }
    await prisma.activityLog.createMany({ data: logs });
  }

  process.stdout.write(
    `\nDone.\n` +
      `  workers created:        ${DRY_RUN ? workerCount : createdWorkers.length}` +
      (enrollIdsAssigned > 0 ? ` (+${enrollIdsAssigned} enrollIds assigned)` : '') + `\n` +
      `  attendance rows:        ${DRY_RUN ? planned.length : attendanceCreated}\n` +
      `  dv2_ai scan rows:       ${DRY_RUN ? 'planned (dry run)' : scansInserted} (device "demo")\n` +
      `  daily reports:          ${reportsCreated}\n` +
      `  visitors / incidents / POs: ${DRY_RUN ? '-' : `${visitorsCreated} / ${incidentsCreated} / ${posCreated}`}\n` +
      `  images written to:      public/uploads (demo-*.png)\n`
  );
}

function fail(message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
