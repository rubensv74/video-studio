import {spawnSync} from 'node:child_process';

const input = process.argv[2] || 'output/remotion-demo.mp4';
const result = spawnSync('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=filename,duration,size,bit_rate:stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate,channels',
  '-of', 'json',
  input,
], {stdio: 'inherit'});
process.exit(result.status ?? 1);
