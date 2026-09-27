import fs from 'node:fs';
import path from 'node:path';
import {createFixtureMediaProvider} from './lib/media-provider.mjs';

const provider = createFixtureMediaProvider();

fs.rmSync(path.resolve('output/generated-media'), {recursive: true, force: true});
fs.rmSync(path.resolve('apps/remotion-studio/public/generated-media'), {
  recursive: true,
  force: true,
});

const freshProvider = createFixtureMediaProvider();

const image = await freshProvider.generateImage({
  prompt: 'Industrial digital workflow with connected equipment nodes and cyan engineering blueprint lines.',
  width: 1600,
  height: 900,
});

const speechText =
  'Video Studio keeps artificial intelligence providers outside the rendering core.';
const tts = await freshProvider.synthesizeSpeech({
  text: speechText,
  voice: 'fixture-neutral',
});

const transcription = await freshProvider.transcribe({
  audioFile: tts.file,
  fixtureTranscript:
    'Video Studio keeps AI providers modular. Generated media enters the normal rendering pipeline.',
});

console.log(`PASS fixture image: ${image.file}`);
console.log(`PASS fixture TTS contract: ${tts.file}`);
console.log(`PASS fixture transcription: ${transcription.file}`);
console.log('PASS VS-G08 deterministic media-provider fixtures');
