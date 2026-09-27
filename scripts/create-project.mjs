import {writeProject} from './lib/scaffold.mjs';

const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};
const has = (flag) => args.includes(flag);

const id = value('--id');
const title = value('--title');
if (!id || !title) {
  console.error('Usage: npm run create:project -- --id <id> --title <title> [--preset landscape-16x9|portrait-9x16|square-1x1] [--theme default-dark|blueprint-cyan] [--output-root path] [--force]');
  process.exit(2);
}

try {
  const result = writeProject({
    id,
    title,
    preset: value('--preset', 'landscape-16x9'),
    theme: value('--theme', 'default-dark'),
    outputRoot: value('--output-root', 'projects'),
    force: has('--force'),
    outputFile: value('--output-file'),
  });
  console.log(`PASS created ${result.projectFile}`);
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
