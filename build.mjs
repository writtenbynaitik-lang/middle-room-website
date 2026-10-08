/* Bundle src/ -> site/app.js (three, gsap and lenis tree-shaken in). */
import { build } from 'esbuild';

const dev = process.argv.includes('--dev');
const r = await build({
  entryPoints: ['src/main.js'],
  outfile: 'site/app.js',
  bundle: true,
  format: 'iife',
  target: ['es2019'],
  minify: !dev,
  sourcemap: dev,
  legalComments: 'none',
  logLevel: 'info',
  metafile: true,
});
const out = r.metafile.outputs['site/app.js'];
console.log('bundle:', (out.bytes / 1024).toFixed(0), 'kB');
