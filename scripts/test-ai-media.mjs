import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {
  createFixtureMediaProvider,
  createHttpMediaProvider,
} from './lib/media-provider.mjs';

const root = path.resolve('.generated/ai-media-test');
fs.rmSync(root, {recursive: true, force: true});

const provider = createFixtureMediaProvider({
  publicDir: path.join(root, 'public'),
  registryFile: path.join(root, 'registry.json'),
});

const image = await provider.generateImage({
  prompt: 'Test industrial blueprint',
  width: 640,
  height: 360,
});
assert.equal(image.kind, 'image');
assert.ok(fs.readFileSync(image.file, 'utf8').includes('Test industrial blueprint'));

const tts = await provider.synthesizeSpeech({
  text: 'Deterministic speech contract fixture',
});
const wav = fs.readFileSync(tts.file);
assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF');
assert.equal(wav.subarray(8, 12).toString('ascii'), 'WAVE');

const transcript = await provider.transcribe({
  audioFile: tts.file,
  fixtureTranscript: 'First sentence. Second sentence.',
});
const srt = fs.readFileSync(transcript.file, 'utf8');
assert.match(srt, /00:00:00,000 --> 00:00:01,900/);
assert.match(srt, /First sentence\./);

const assets = provider.listAssets();
assert.equal(assets.length, 3);
assert.deepEqual(
  new Set(assets.map((asset) => asset.kind)),
  new Set(['image', 'tts', 'transcription']),
);
console.log('PASS deterministic image/TTS/transcription provider contracts');
console.log('PASS generated asset registry');

const server = http.createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  response.writeHead(200, {'content-type': 'application/json'});
  response.end(
    JSON.stringify({
      status: 'success',
      provider: 'http-test',
      kind: payload.kind,
      request: payload.request,
      asset: {file: `external://${payload.kind}`},
    }),
  );
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const remote = createHttpMediaProvider({
    endpoint: `http://127.0.0.1:${address.port}/generate`,
  });

  for (const [kind, call] of [
    ['image', () => remote.generateImage({prompt: 'remote image'})],
    ['tts', () => remote.synthesizeSpeech({text: 'remote speech'})],
    ['transcription', () => remote.transcribe({audioFile: 'remote.wav'})],
  ]) {
    const result = await call();
    assert.equal(result.provider, 'http-test');
    assert.equal(result.kind, kind);
  }
  console.log('PASS provider-neutral HTTP media boundary');
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

console.log('PASS VS-G08 AI media adapter source contract');
