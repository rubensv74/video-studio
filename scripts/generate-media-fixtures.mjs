import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const outputDir = path.resolve('apps/remotion-studio/public/fixtures');
fs.mkdirSync(outputDir, {recursive: true});

const runFfmpeg = (label, args) => {
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`FAIL fixture: ${label}`);
    process.exit(result.status ?? 1);
  }
  console.log(`PASS fixture: ${label}`);
};

runFfmpeg('music.m4a', [
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=220:sample_rate=48000:duration=10',
  '-af',
  'volume=0.10',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  path.join(outputDir, 'music.m4a'),
]);

runFfmpeg('voiceover-fixture.m4a', [
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=660:sample_rate=48000:duration=8',
  '-af',
  'volume=0.22',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  path.join(outputDir, 'voiceover-fixture.m4a'),
]);

runFfmpeg('clip.mp4', [
  '-f',
  'lavfi',
  '-i',
  'testsrc2=size=640x360:rate=30:duration=2',
  '-c:v',
  'libx264',
  '-preset',
  'veryfast',
  '-crf',
  '20',
  '-pix_fmt',
  'yuv420p',
  '-an',
  path.join(outputDir, 'clip.mp4'),
]);

const srt = `1
00:00:00,400 --> 00:00:02,700
One manifest controls the full media timeline.

2
00:00:03,200 --> 00:00:06,400
Video, music and voice-over tracks render together.

3
00:00:07,000 --> 00:00:09,600
Captions and derivatives are verified in CI.
`;

fs.writeFileSync(path.join(outputDir, 'demo.srt'), srt, 'utf8');
console.log('PASS fixture: demo.srt');
console.log(`PASS VS-G03 media fixtures -> ${outputDir}`);
