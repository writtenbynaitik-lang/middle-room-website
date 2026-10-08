# Middle Room — website

A real, buildable site for Middle Room, the listening bar inside The Courtyard, Bengaluru.
Static output, no backend. WebGL record in the hero, GSAP/ScrollTrigger choreography, Lenis scroll.

**Deliverable** `site/` — drop it on any static host (Netlify, Vercel, Cloudflare Pages, S3, nginx).
**Facts & sources** `BRIEF.md` · **Earlier 7.6s outreach video** `out/` + `archive/v1-preview/`

## Run it

```bash
python3 -m http.server 8731 --directory site
```

Then open http://127.0.0.1:8731. `site/` is self-contained — fonts, images and JS are all local,
so it also works from a file:// path or behind any CDN.

## Build (only needed if you change `src/`)

```bash
npm install && node build.mjs
```

`build.mjs` bundles `src/*.js` with three.js, GSAP and Lenis tree-shaken into `site/app.js`
(679 kB raw, ~190 kB gzipped). `node build.mjs --dev` skips minification and adds a sourcemap.

## Check it

```bash
node qa.js         # WebGL load, section metrics, 8 breakpoints, stills -> capture/qa/
node rmcheck.js    # reduced-motion + no-JS: all content still present
python3 research/assets.py      # regenerate every image from research/ originals
python3 research/vectorize.py   # re-trace the wordmark PNG -> logo.svg
```

## Structure

```
site/           the deliverable
  index.html    one page; the wordmark is an inline SVG symbol
  styles.css    design system + all layout
  app.js        built bundle  (do not edit — edit src/)
  assets/img    WebP photography, session sleeves, logo.svg + logo.png
  assets/fonts  Archivo 400/500/700/800/900, Anton, Space Mono
src/
  main.js       scroll, preloader, cursor, nav, reveals, marquees, pinning, hovers
  record.js     the WebGL vinyl — procedural grooves, real wordmark on the label
  split.js      line-splitter for the masked heading reveals
research/       originals + the scripts that produce site/assets/img and logo.svg
archive/        the earlier outreach-video project
```

## The record

`src/record.js` builds a 12" vinyl at runtime rather than loading a model. Three canvas textures
are generated on the fly — colour (lacquer, groove bands, run-out, red label carrying the real
wordmark, spindle hole), roughness (grooves matte, the land between glossy) and a normal map
computed analytically as a radial ripple. A `MeshPhysicalMaterial` with clearcoat over that gives
the sheen that actually reads as a record under the booth lamps.

It spins at a slowed 33⅓, leans toward the pointer, and a scrubbed timeline carries it from the
hero through the manifesto and out past the top-right corner, fading before "The Room" so it never
crosses a line of type. The render loop parks itself the moment opacity hits zero.

No WebGL, or `prefers-reduced-motion`, and the canvas simply removes itself.

## Animation

Preloader with a real readiness gate (fonts + hero image) · masked line-by-line heading reveals ·
clip-path image wipes with scrubbed parallax · counters (33 / 1,200 / 2) · two scroll-velocity
marquees · pinned horizontal run of session sleeves · per-sleeve 3D tilt with a specular sweep ·
magnetic buttons · custom cursor that grows and labels itself on primary actions · a record-side
tracklist rail (A1–B3) that tracks the active section · nav that hides downward, returns upward,
and flips to dark ink over the paper panel · full-screen menu with staggered links.

## Copy

No paragraphs anywhere. Every piece of prose is a single short line set large (`--say`, up to
34px); everything else is a data row, a list item or a mono label (floor of 12px). The longest
text block on the page is two lines.

## Content

Every name, number, dish and piece of equipment traces to a source in `BRIEF.md` — 33 seats,
1,200+ records, the Danley Synergy Horn SH75 / Tapped Horn TH Mini 15 system, two-hour slots,
the five people who run it, the dishes. Press is credited as plain text only: no borrowed logos,
layouts, imagery or quotes. Nothing is invented.

**Deliberately absent**, because none of it could be verified as current: opening hours, prices,
the reservation fee, dated events, testimonials, awards, statistics.

## Photography

Six interiors come from **M9 Design Studio**'s project page at 3840px — the studio that designed
the room, photography by **Ekansh Goel**. Five more are Middle Room's own images from
`thecourtyard.in`. Session sleeves, the food and drink stills are cropped from Middle Room's own
Instagram grid and stories (Instagram UI and carousel badges removed). Both studios are credited
in the footer. Press-owned editorial imagery was used as research only and never placed on the page.

## Weight

| | |
|---|---|
| Critical path (hero) | 1.28 MB raw — HTML, CSS, JS, 8 fonts, hero image |
| `app.js` | 679 kB raw · ~190 kB gzipped (three.js is most of it) |
| Whole site | 4.6 MB, everything below the fold lazy-loaded |

Enable gzip/brotli on the host and the real first load is roughly 700 kB.

## Verified

No console or network errors. No horizontal overflow, nav collision or sub-36px tap target at
320 / 375 / 390 / 768 / 1024 / 1280 / 1440 / 1920. Smallest rendered type is 12px, and only on
mono labels. Reduced-motion and no-JS both render the complete page with nothing stuck hidden.

## Known limitations

- **Reserve** points at Middle Room's current Swiggy Scenes link and **Private Booking** at their
  WhatsApp number, both from their own Linktree. There is no booking engine, CMS, payments or
  accounts — the programme sleeves are hand-authored in `index.html`.
- **Session artwork is dated.** The sleeves are real Middle Room graphics taken from their
  Instagram grid, so some carry their original dates. The section is labelled "Selected sessions
  from the Middle Room programme" and nothing is presented as upcoming. Swapping in current
  artwork is a file drop plus six lines of HTML.
- **Sleeves and the food/drink stills are ~760px**, cropped from Instagram grid and story
  thumbnails because the originals need an authenticated session. Sharp at the sizes used; worth
  replacing with originals before launch.
- Three.js dominates the bundle. If the record is ever cut, the bundle drops to about 35 kB.
- Fonts are Archivo and Space Mono, chosen to sit close to the real wordmark. If Middle Room
  licenses the actual typeface, swapping it is one `@font-face` block.
