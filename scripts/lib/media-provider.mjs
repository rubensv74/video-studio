import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const sha256 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

const ensureDir = (dir) => fs.mkdirSync(dir, {recursive: true});

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const wavBuffer = ({text, sampleRate = 48000}) => {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  const durationSeconds = Math.max(1.5, Math.min(8, words.length * 0.42));
  const samples = Math.floor(sampleRate * durationSeconds);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  const seed = [...String(text)].reduce((total, char) => total + char.charCodeAt(0), 0);
  const base = 180 + (seed % 180);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const wordIndex = Math.min(
      Math.floor((t / durationSeconds) * Math.max(1, words.length)),
      Math.max(0, words.length - 1),
    );
    const wordSeed = words[wordIndex]
      ? [...words[wordIndex]].reduce((total, char) => total + char.charCodeAt(0), 0)
      : seed;
    const frequency = base + (wordSeed % 220);
    const envelope = Math.min(1, t * 8) * Math.min(1, (durationSeconds - t) * 8);
    const value =
      Math.sin(2 * Math.PI * frequency * t) * 0.18 * envelope +
      Math.sin(2 * Math.PI * frequency * 2 * t) * 0.04 * envelope;
    buffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(value * 32767))), 44 + i * 2);
  }

  return {buffer, durationSeconds};
};

const srtTime = (seconds) => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, '0'))
    .join(':') + ',' + String(millis).padStart(3, '0');
};

const buildSrt = (text) => {
  const sentences = String(text)
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const cues = sentences.length ? sentences : [String(text).trim()];
  return cues
    .map((cue, index) => {
      const start = index * 2.2;
      const end = start + 1.9;
      return `${index + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${cue}\n`;
    })
    .join('\n');
};

const readRegistry = (registryFile) => {
  if (!fs.existsSync(registryFile)) return {version: 1, assets: []};
  return JSON.parse(fs.readFileSync(registryFile, 'utf8'));
};

const appendRegistry = (registryFile, record) => {
  ensureDir(path.dirname(registryFile));
  const registry = readRegistry(registryFile);
  registry.assets.unshift(record);
  fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');
  return record;
};

export const createFixtureMediaProvider = ({
  publicDir = 'apps/remotion-studio/public/generated-media',
  registryFile = 'output/generated-media/registry.json',
} = {}) => {
  const absolutePublic = path.resolve(publicDir);
  const absoluteRegistry = path.resolve(registryFile);
  ensureDir(absolutePublic);

  const record = ({kind, request, file, mediaType, metadata = {}}) => {
    const createdAt = new Date().toISOString();
    const item = {
      version: 1,
      id: `${kind}-${sha256(JSON.stringify(request)).slice(0, 12)}`,
      kind,
      provider: 'fixture',
      mediaType,
      file: path.relative(process.cwd(), file).replaceAll(path.sep, '/'),
      requestHash: sha256(JSON.stringify(request)),
      createdAt,
      metadata,
    };
    return appendRegistry(absoluteRegistry, item);
  };

  return {
    type: 'fixture',

    generateImage: async ({prompt, width = 1600, height = 900}) => {
      if (!String(prompt ?? '').trim()) throw new Error('image prompt is required');
      const id = sha256(`${prompt}:${width}:${height}`).slice(0, 12);
      const file = path.join(absolutePublic, `image-${id}.svg`);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#07111F"/>
      <stop offset="0.62" stop-color="#0B1D2E"/>
      <stop offset="1" stop-color="#102A3A"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#00C8FF" stop-opacity=".48"/>
      <stop offset="1" stop-color="#00C8FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${Math.round(width * 0.72)}" cy="${Math.round(height * 0.35)}" r="${Math.round(Math.min(width, height) * 0.34)}" fill="url(#glow)"/>
  <g fill="none" stroke="#00C8FF" stroke-width="3" opacity=".7">
    <path d="M120 ${height - 170} H${width - 120}"/>
    <path d="M180 ${height - 230} H${width - 310}"/>
    <circle cx="${Math.round(width * 0.68)}" cy="${Math.round(height * 0.44)}" r="120"/>
    <circle cx="${Math.round(width * 0.68)}" cy="${Math.round(height * 0.44)}" r="70"/>
  </g>
  <text x="120" y="160" fill="#F4FBFF" font-family="Arial, sans-serif" font-size="56" font-weight="700">GENERATED MEDIA FIXTURE</text>
  <text x="120" y="225" fill="#8DB4C7" font-family="Arial, sans-serif" font-size="26">Provider-neutral image-generation contract</text>
  <foreignObject x="120" y="${height - 145}" width="${width - 240}" height="100">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;color:#F4FBFF;font-size:26px;line-height:1.35">${escapeXml(prompt)}</div>
  </foreignObject>
</svg>`;
      fs.writeFileSync(file, svg, 'utf8');
      return record({
        kind: 'image',
        request: {prompt, width, height},
        file,
        mediaType: 'image/svg+xml',
        metadata: {width, height},
      });
    },

    synthesizeSpeech: async ({text, voice = 'fixture-neutral'}) => {
      if (!String(text ?? '').trim()) throw new Error('tts text is required');
      const id = sha256(`${voice}:${text}`).slice(0, 12);
      const file = path.join(absolutePublic, `tts-${id}.wav`);
      const {buffer, durationSeconds} = wavBuffer({text});
      fs.writeFileSync(file, buffer);
      return record({
        kind: 'tts',
        request: {text, voice},
        file,
        mediaType: 'audio/wav',
        metadata: {voice, durationSeconds, fixtureAudio: true},
      });
    },

    transcribe: async ({audioFile, fixtureTranscript}) => {
      if (!String(audioFile ?? '').trim()) throw new Error('transcription audioFile is required');
      if (!String(fixtureTranscript ?? '').trim()) {
        throw new Error('fixtureTranscript is required by the deterministic transcription provider');
      }
      const id = sha256(`${audioFile}:${fixtureTranscript}`).slice(0, 12);
      const file = path.join(absolutePublic, `transcript-${id}.srt`);
      fs.writeFileSync(file, buildSrt(fixtureTranscript), 'utf8');
      return record({
        kind: 'transcription',
        request: {audioFile, fixtureTranscript},
        file,
        mediaType: 'application/x-subrip',
        metadata: {sourceAudio: audioFile, fixtureTranscript: true},
      });
    },

    listAssets: () => readRegistry(absoluteRegistry).assets,
  };
};

export const createHttpMediaProvider = ({
  endpoint,
  fetchImpl = globalThis.fetch,
  timeoutMs = 60_000,
}) => {
  if (!/^https?:\/\//i.test(endpoint ?? '')) {
    throw new Error('media provider endpoint must be http/https');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('No fetch implementation is available for HTTP media provider');
  }

  const invoke = async (kind, request) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {'content-type': 'application/json', accept: 'application/json'},
        body: JSON.stringify({version: 1, kind, request}),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`media provider returned HTTP ${response.status}`);
      const body = await response.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('media provider must return a JSON object');
      }
      return body;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    type: 'http',
    generateImage: (request) => invoke('image', request),
    synthesizeSpeech: (request) => invoke('tts', request),
    transcribe: (request) => invoke('transcription', request),
  };
};
