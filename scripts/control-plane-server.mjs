import http from 'node:http';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const port = Number(process.env.PORT || 4100);
const host = process.env.HOST || '127.0.0.1';
const authDisabled = process.env.VIDEO_STUDIO_AUTH_DISABLED === 'true';

let apiKeys = {};
if (process.env.VIDEO_STUDIO_API_KEYS) {
  try {
    apiKeys = JSON.parse(process.env.VIDEO_STUDIO_API_KEYS);
  } catch {
    console.error('VIDEO_STUDIO_API_KEYS must be valid JSON');
    process.exit(1);
  }
}

let service;
try {
  service = createControlPlaneService({
    authDisabled,
    apiKeys,
    stateFile:
      process.env.VIDEO_STUDIO_STATE_FILE ??
      '.video-studio/control-plane-state.json',
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const server = http.createServer(service.handler);

server.listen(port, host, () => {
  console.log(`Video Studio Control Plane: http://${host}:${port}`);
  console.log(
    `Authentication: ${authDisabled ? 'DISABLED (local development)' : 'ENABLED'}`,
  );
});
