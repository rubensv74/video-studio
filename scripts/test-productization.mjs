import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createProjectManifest, writeProject, loadPresetCatalog, loadThemeCatalog} from './lib/scaffold.mjs';
import {resolveProjectData, resolveProjectDataAsync} from './lib/data-adapter.mjs';
import {validateProject} from './lib/manifest.mjs';

const root = path.resolve('.generated/productization');
fs.rmSync(root, {recursive: true, force: true});

const presets = loadPresetCatalog();
const themes = loadThemeCatalog();
assert.deepEqual(Object.keys(presets).sort(), ['landscape-16x9', 'portrait-9x16', 'square-1x1']);
assert.ok(themes['default-dark']);
assert.ok(themes['blueprint-cyan']);

for (const [preset, profile] of Object.entries(presets)) {
  const id = `generated-${preset}`;
  const outputFile = `output/productization/${preset}.mp4`;
  const {manifest, projectFile} = writeProject({
    id,
    title: `Generated ${preset}`,
    preset,
    theme: preset === 'portrait-9x16' ? 'blueprint-cyan' : 'default-dark',
    outputRoot: root,
    outputFile,
    force: true,
  });

  assert.deepEqual(validateProject(manifest), []);
  assert.equal(manifest.output.width, profile.width);
  assert.equal(manifest.output.height, profile.height);
  assert.ok(fs.existsSync(projectFile));
  console.log(`PASS scaffold ${preset}: ${profile.width}x${profile.height}`);
}

assert.throws(() => createProjectManifest({id: 'bad id', title: 'Bad'}), /lowercase letters/);
assert.throws(() => createProjectManifest({id: 'bad-preset', title: 'Bad', preset: 'unknown'}), /Unknown video preset/);
assert.throws(() => createProjectManifest({id: 'bad-theme', title: 'Bad', theme: 'unknown'}), /Unknown video theme/);

const fixtureFile = path.resolve('fixtures/productization/project.json');
const fixture = JSON.parse(fs.readFileSync(fixtureFile, 'utf8'));
const resolved = resolveProjectData({project: fixture, manifestFile: fixtureFile});
assert.equal(resolved.data.source, 'inline');
assert.equal(resolved.data.projectCode, 'VS-G05');
assert.equal(resolved.data.headline, 'JSON adapter verified');
assert.equal(resolved.data.metrics.profiles, 3);
assert.deepEqual(resolved.endpoints, []);
console.log('PASS JSON data adapter');

const server = http.createServer((request, response) => {
  if (request.url !== '/project-data') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, {'content-type': 'application/json'});
  response.end(JSON.stringify({
    source: 'api',
    apiVerified: true,
    projectCode: 'VS-G05-API'
  }));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const endpoint = `http://127.0.0.1:${address.port}/project-data`;
  const apiProject = {...fixture, data: {...fixture.data, endpoints: [endpoint]}};
  const apiResolved = await resolveProjectDataAsync({project: apiProject, manifestFile: fixtureFile});
  assert.equal(apiResolved.data.source, 'api');
  assert.equal(apiResolved.data.projectCode, 'VS-G05-API');
  assert.equal(apiResolved.data.apiVerified, true);
  assert.deepEqual(apiResolved.endpoints, [endpoint]);
  console.log('PASS HTTP JSON data adapter');
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

console.log('PASS VS-G05 productization source contract');
