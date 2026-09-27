import fs from 'node:fs';
import path from 'node:path';
import {createFixtureMediaProvider} from './lib/media-provider.mjs';

const outputDir = path.resolve('apps/remotion-studio/public/generated-media');
fs.rmSync(path.resolve('output/generated-media'), {recursive: true, force: true});
fs.rmSync(outputDir, {recursive: true, force: true});

const provider = createFixtureMediaProvider();

const image = await provider.generateImage({
  prompt: 'Industrial digital workflow with connected equipment nodes and cyan engineering blueprint lines.',
  width: 1600,
  height: 900,
});

const speechText =
  'Video Studio keeps artificial intelligence providers outside the rendering core.';
const tts = await provider.synthesizeSpeech({
  text: speechText,
  voice: 'fixture-neutral',
});

const transcription = await provider.transcribe({
  audioFile: tts.file,
  fixtureTranscript:
    'Video Studio keeps AI providers modular. Generated media enters the normal rendering pipeline.',
});

const aliases = [
  [image.file, path.join(outputDir, 'ai-image.svg')],
  [tts.file, path.join(outputDir, 'ai-voice.wav')],
  [transcription.file, path.join(outputDir, 'ai-captions.srt')],
];

for (const [source, target] of aliases) {
  fs.copyFileSync(source, target);
}

console.log(`PASS fixture image: ${image.file}`);
console.log(`PASS fixture TTS contract: ${tts.file}`);
console.log(`PASS fixture transcription: ${transcription.file}`);
console.log('PASS fixed render aliases: ai-image.svg / ai-voice.wav / ai-captions.srt');
console.log('PASS VS-G08 deterministic media-provider fixtures');
