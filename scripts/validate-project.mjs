import {getProjectDurationSeconds, loadProjectManifest, validateProject} from './lib/manifest.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/validate-project.mjs <project.json>');
  process.exit(2);
}

const {project} = loadProjectManifest(file);
const errors = validateProject(project);

if (errors.length) {
  for (const error of errors) console.error(`FAIL ${error}`);
  process.exit(1);
}

console.log(
  `PASS ${project.id}: ${project.engine} -> ${project.output.file} (${getProjectDurationSeconds(project)}s @ ${project.output.fps}fps)`,
);
