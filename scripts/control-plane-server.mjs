import http from 'node:http';
import {createControlPlaneService} from './lib/control-plane-service.mjs';

const port = Number(process.env.PORT || 4100);
const host = process.env.HOST || '127.0.0.1';

const service = createControlPlaneService();
const server = http.createServer(service.handler);

server.listen(port, host, () => {
  console.log(`Video Studio Control Plane: http://${host}:${port}`);
});
