/**
 * Adaptive-bitrate HLS pipeline for the landing-page hero video.
 *
 *   node tools/video-hls.mjs encode "C:/path/to/source.MP4"   # build the ladder into .video-build/hls
 *   node tools/video-hls.mjs bundle                           # add _headers, ready to publish
 *   node tools/video-hls.mjs deploy                           # publish to Cloudflare Pages
 *   node tools/video-hls.mjs ensure                           # create the dir so `ng serve` won't fail
 *
 * Why a separate host: the app itself is deployed by Vercel straight from git, and the encoded
 * ladder (~290 MB) is deliberately NOT in git. Cloudflare Pages serves it instead — free, with
 * unlimited bandwidth and a global CDN. In dev, `ng serve` serves .video-build/hls directly
 * (see the development/local asset entries in angular.json), so dev needs neither.
 *
 * Requires ffmpeg on PATH. Deploying additionally requires `npx wrangler login` once.
 */
import { spawnSync } from 'node:child_process';
import { cp, mkdir, rm, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const buildDir = path.join(rootDir, '.video-build', 'hls');
const publishDir = path.join(rootDir, '.video-build', 'publish');
const ROUTE = 'challenge-intro';
const CF_PROJECT = 'elev8-video';
const POSTER_TIMESTAMP = '10';

/**
 * Every rendition shares the same GOP (2s) and segment length (4s), so segment boundaries
 * line up across the ladder. Without that, hls.js cannot switch quality without a visible
 * stall — which is the whole point of shipping a ladder.
 */
const RENDITIONS = [
  { name: '360p', width: 640, height: 360, crf: 23, maxrate: '800k', bufsize: '1600k', profile: 'main' },
  { name: '540p', width: 960, height: 540, crf: 22, maxrate: '1400k', bufsize: '2800k', profile: 'main' },
  { name: '720p', width: 1280, height: 720, crf: 21, maxrate: '2800k', bufsize: '5600k', profile: 'high' },
  { name: '1080p', width: 1920, height: 1080, crf: 21, maxrate: '5000k', bufsize: '10000k', profile: 'high' }
];

/**
 * Cloudflare Pages guesses text/typescript for .ts, which breaks MPEG-TS segments, so the
 * content types are pinned here. Segment URLs never change contents, hence immutable.
 */
const HEADERS_FILE = `/*
  Access-Control-Allow-Origin: *

/*.m3u8
  Content-Type: application/vnd.apple.mpegurl
  Cache-Control: public, max-age=3600

/*.ts
  Content-Type: video/mp2t
  Cache-Control: public, max-age=31536000, immutable

/*.jpg
  Cache-Control: public, max-age=604800
`;

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${cmd} exited with code ${res.status}`);
}

function buildFfmpegArgs(source) {
  const splitLabels = RENDITIONS.map((_, i) => `[s${i}]`).join('');
  const scaleChain = RENDITIONS
    .map((r, i) => `[s${i}]scale=${r.width}:${r.height}:force_original_aspect_ratio=decrease,setsar=1[v${i}]`)
    .join(';');

  const args = [
    '-hide_banner', '-loglevel', 'error', '-stats', '-y',
    '-i', source,
    '-filter_complex', `[0:v]split=${RENDITIONS.length}${splitLabels};${scaleChain}`
  ];

  RENDITIONS.forEach((r, i) => {
    args.push(
      '-map', `[v${i}]`,
      `-c:v:${i}`, 'libx264',
      '-preset', 'medium',
      '-crf', String(r.crf),
      `-maxrate:v:${i}`, r.maxrate,
      `-bufsize:v:${i}`, r.bufsize,
      `-profile:v:${i}`, r.profile
    );
  });

  // One audio track per variant, identical settings, so switching never glitches the audio.
  RENDITIONS.forEach(() => args.push('-map', '0:a'));
  args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-ar', '48000');

  args.push(
    '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_playlist_type', 'vod',
    '-hls_flags', 'independent_segments',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', path.join(buildDir, '%v', 'seg_%03d.ts'),
    '-master_pl_name', 'master.m3u8',
    '-var_stream_map', RENDITIONS.map((r, i) => `v:${i},a:${i},name:${r.name}`).join(' '),
    path.join(buildDir, '%v', 'playlist.m3u8')
  );

  return args;
}

async function encode(source) {
  if (!source) throw new Error('Usage: node tools/video-hls.mjs encode <source-video>');
  if (!existsSync(source)) throw new Error(`Source not found: ${source}`);

  await rm(buildDir, { recursive: true, force: true });
  for (const r of RENDITIONS) await mkdir(path.join(buildDir, r.name), { recursive: true });

  console.log(`Encoding ${RENDITIONS.length}-rendition ladder from ${source} ...`);
  run('ffmpeg', buildFfmpegArgs(source));

  console.log('Generating poster ...');
  run('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', POSTER_TIMESTAMP, '-i', source,
    '-frames:v', '1', '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '5',
    path.join(buildDir, 'poster.jpg')
  ]);

  await report();
}

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? await dirSize(full) : (await stat(full)).size;
  }
  return total;
}

const mb = n => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function report() {
  console.log('\nLadder:');
  for (const r of RENDITIONS) {
    console.log(`  ${r.name.padEnd(6)} ${mb(await dirSize(path.join(buildDir, r.name)))}`);
  }
  console.log(`  ${'total'.padEnd(6)} ${mb(await dirSize(buildDir))}`);
}

/** Creates the dir if absent so the development/local Angular builds don't fail on a missing asset input. */
async function ensure() {
  await mkdir(buildDir, { recursive: true });
}

async function bundle() {
  if (!existsSync(path.join(buildDir, 'master.m3u8'))) {
    throw new Error(`No ladder at ${buildDir}. Run "encode" first.`);
  }
  // Windows holds handles on freshly-copied files (indexer/AV), so a plain rm hits ENOTEMPTY.
  await rm(publishDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  await mkdir(path.join(publishDir, ROUTE), { recursive: true });
  await cp(buildDir, path.join(publishDir, ROUTE), { recursive: true });
  await writeFile(path.join(publishDir, '_headers'), HEADERS_FILE, 'utf8');
  console.log(`Bundled ${mb(await dirSize(publishDir))} into .video-build/publish (route: /${ROUTE})`);
}

/**
 * Wrangler uploads 3 buckets of up to 40 MB in parallel, and each request must complete within
 * undici's 300 s header timeout. On a ~450 KB/s uplink that is ~160 MB in flight and every
 * request dies, so the deploy fails at 0/N with an empty `Error: {}`.
 *
 * Both limits are hardcoded constants in the bundled CLI, so patch the locally cached copy down
 * to one request of 3 MB (~9 s each). Re-applied on every deploy because npx may re-fetch.
 */
function patchUploaderLimits() {
  const npxCache = path.join(
    process.env.LOCALAPPDATA || path.join(process.env.HOME || '', '.npm'),
    process.platform === 'win32' ? 'npm-cache/_npx' : '_npx'
  );
  if (!existsSync(npxCache)) return false;

  let patched = 0;
  for (const dir of readdirSync(npxCache)) {
    const cli = path.join(npxCache, dir, 'node_modules', 'wrangler', 'wrangler-dist', 'cli.js');
    if (!existsSync(cli)) continue;

    const before = readFileSync(cli, 'utf8');
    const after = before
      .replace(/BULK_UPLOAD_CONCURRENCY = 3/g, 'BULK_UPLOAD_CONCURRENCY = 1')
      .replace(/MAX_BUCKET_SIZE = 40 \* 1024 \* 1024/g, 'MAX_BUCKET_SIZE = 3 * 1024 * 1024');

    if (after !== before) {
      writeFileSync(cli, after);
      patched++;
    }
  }
  return patched > 0;
}

async function deploy() {
  await bundle();

  // Ensure the pinned wrangler is cached, then throttle its uploader before it runs.
  run('npx', ['--yes', 'wrangler@4.86.0', '--version'], { stdio: 'ignore' });
  console.log(patchUploaderLimits()
    ? 'Throttled wrangler uploader to 1x3MB requests (slow-uplink safe).'
    : 'Wrangler uploader already throttled.');

  console.log(`\nDeploying to Cloudflare Pages project "${CF_PROJECT}" ...`);
  // Pinned: wrangler >= 4.90 requires Node 22, and this project runs on Node 20.
  // Bump this together with the project's Node version, not on its own.
  //
  // cwd matters: `pages deploy` treats a ./functions dir as Pages Functions, and this repo has
  // one for Firebase Cloud Functions. Running from inside publishDir keeps wrangler away from it.
  run('npx', ['--yes', 'wrangler@4.86.0', 'pages', 'deploy', '.',
    '--project-name', CF_PROJECT, '--commit-dirty', 'true'], { cwd: publishDir });
}

const [command, ...rest] = process.argv.slice(2);

try {
  if (command === 'encode') await encode(rest[0]);
  else if (command === 'bundle') await bundle();
  else if (command === 'deploy') await deploy();
  else if (command === 'ensure') await ensure();
  else {
    console.error('Usage: node tools/video-hls.mjs <encode <source> | bundle | deploy | ensure>');
    process.exit(1);
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
