import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const manifestFile =
  process.argv[2] ??
  '.generated/productization/generated-portrait-9x16/project.json';

if (!fs.existsSync(manifestFile)) {
  console.error(`FAIL manifest not found: ${manifestFile}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const themeCatalog = JSON.parse(fs.readFileSync('themes/catalog.json', 'utf8'));
const theme = themeCatalog[manifest.theme];

if (!theme) {
  console.error(`FAIL unknown theme: ${manifest.theme}`);
  process.exit(1);
}

const file = path.resolve(manifest.output.file);
if (!fs.existsSync(file)) {
  console.error(`FAIL media not found: ${file}`);
  process.exit(1);
}

const x = 4;
const y = manifest.output.height - 6;
const filter =
  `select=eq(n\\,30),crop=1:1:${x}:${y},format=rgb24`;

const result = spawnSync(
  'ffmpeg',
  [
    '-v',
    'error',
    '-i',
    file,
    '-vf',
    filter,
    '-frames:v',
    '1',
    '-f',
    'rawvideo',
    '-pix_fmt',
    'rgb24',
    'pipe:1',
  ],
  {encoding: null},
);

if (result.status !== 0 || !result.stdout || result.stdout.length < 3) {
  console.error('FAIL could not sample theme signature pixel');
  process.exit(result.status ?? 1);
}

const actual = [...result.stdout.subarray(0, 3)];
const hex = theme.colors.accent.replace('#', '');
const expected = [
  Number.parseInt(hex.slice(0, 2), 16),
  Number.parseInt(hex.slice(2, 4), 16),
  Number.parseInt(hex.slice(4, 6), 16),
];

const delta = actual.map((value, index) => Math.abs(value - expected[index]));
const tolerance = 18;

if (delta.some((value) => value > tolerance)) {
  console.error(
    `FAIL theme accent mismatch. expected rgb(${expected.join(',')}); found rgb(${actual.join(',')}); delta=${delta.join(',')}`,
  );
  process.exit(1);
}

console.log(`PASS runtime theme: ${manifest.theme}`);
console.log(`PASS expected accent: rgb(${expected.join(',')})`);
console.log(`PASS sampled accent: rgb(${actual.join(',')})`);
console.log('PASS VS-G05 runtime theme render contract');
