import http from 'node:http';
import {createControlPlaneService} from './lib/control-plane-service.mjs';
import {createRuntimeBindingsFromEnv} from './lib/runtime-bootstrap.mjs';

const port = Number(process.env.PORT || 4100);
const host = process.env.HOST || '0.0.0.0';

const runtime = createRuntimeBindingsFromEnv();
const service = createControlPlaneService({
  runtimeProfile: runtime.runtimeProfile,
  workerRuntime: runtime.workerRuntime,
  operationalStore: runtime.operationalStore,
});
const server = http.createServer(service.handler);

server.listen(port, host, () => {
  console.log(`Video Studio Control Plane: http://${host}:${port}`);
  console.log(
    `Runtime profile: ${runtime.runtimeSummary.profile} · worker=${runtime.runtimeSummary.worker} · store=${runtime.runtimeSummary.store}`,
  );
});
