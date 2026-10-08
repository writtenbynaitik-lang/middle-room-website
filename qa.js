/* QA: load the real site with WebGL enabled, report errors/metrics,
   sweep every breakpoint for overflow + collisions, and write stills. */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const URL = 'http://127.0.0.1:8731/index.html';
const CHROME = '/usr/bin/google-chrome';
const OUT = 'capture/qa';

const launch = () => puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: [
    '--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars',
    '--font-render-hinting=none', '--force-color-profile=srgb',
    // software GL so WebGL actually runs headless
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--enable-webgl', '--ignore-gpu-blocklist',
  ],
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));

  await page.setViewport({ width: 1512, height: 950, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction("document.documentElement.classList.contains('is-ready')", { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1200));

  const m = await page.evaluate(() => {
    const de = document.documentElement;
    const gl = (() => {
      try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
    })();
    const rec = document.getElementById('record');
    return {
      pageHeight: de.scrollHeight,
      viewport: innerHeight,
      overflowX: de.scrollWidth > innerWidth,
      webgl2: gl,
      recordPresent: !!rec,
      recordSize: rec ? [rec.width, rec.height] : null,
      preHidden: getComputedStyle(document.querySelector('.pre')).display === 'none',
      splitCount: document.querySelectorAll('.line__i').length,
      sections: [...document.querySelectorAll('main > section, aside.press, footer.foot')].map(s => ({
        id: s.id || s.className.split(' ')[0],
        top: Math.round(s.getBoundingClientRect().top + scrollY),
        h: Math.round(s.getBoundingClientRect().height),
      })),
    };
  });

  console.log('\n=== 1512x950 ===');
  console.log('page height   :', m.pageHeight, '=', (m.pageHeight / m.viewport).toFixed(2), 'viewports');
  console.log('overflow-x    :', m.overflowX);
  console.log('webgl2        :', m.webgl2, '| record canvas:', m.recordPresent, m.recordSize);
  console.log('preloader gone:', m.preHidden);
  console.log('split lines   :', m.splitCount);
  m.sections.forEach(s => console.log(`  ${String(s.id).padEnd(10)} top=${String(s.top).padStart(6)} h=${String(s.h).padStart(5)}`));

  // scroll through and screenshot
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const y = Math.round((m.pageHeight - m.viewport) * (i / steps));
    await page.evaluate(yy => {
      const l = window.__mr && window.__mr.lenis;
      if (l) l.scrollTo(yy, { immediate: true, force: true });
      else window.scrollTo(0, yy);
      window.__mr.ScrollTrigger.update();
    }, y);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: `${OUT}/s${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 84 });
  }
  console.log('wrote', steps + 1, 'stills ->', OUT);

  // every image has now had its chance to load
  const broken = await page.evaluate(() =>
    [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src.split('/').pop()));
  console.log('broken images :', broken.length ? broken : 'none');

  // menu overlay (burger only exists at <=980px)
  const pm = await browser.newPage();
  await pm.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await pm.goto(URL, { waitUntil: 'networkidle0' });
  await pm.waitForFunction("document.documentElement.classList.contains('is-ready')", { timeout: 60000 });
  await pm.click('.burger');
  await new Promise(r => setTimeout(r, 1200));
  await pm.screenshot({ path: `${OUT}/menu.jpg`, type: 'jpeg', quality: 84 });
  const menuOk = await pm.evaluate(() => {
    const mu = document.querySelector('.menu');
    const cs = getComputedStyle(mu);
    return { display: cs.display, clip: cs.clipPath, aria: mu.getAttribute('aria-hidden') };
  });
  console.log('menu open     :', JSON.stringify(menuOk));
  await pm.close();

  console.log('\n=== responsive sweep ===');
  for (const [w, h] of [[320, 720], [375, 812], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
    const p2 = await browser.newPage();
    const errs = [];
    p2.on('pageerror', e => errs.push(e.message.slice(0, 90)));
    await p2.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await p2.goto(URL, { waitUntil: 'networkidle0', timeout: 90000 });
    await p2.waitForFunction("document.documentElement.classList.contains('is-ready')", { timeout: 60000 });
    await new Promise(r => setTimeout(r, 600));
    const r = await p2.evaluate(() => {
      const de = document.documentElement, vw = innerWidth;
      const clipped = el => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (/hidden|clip/.test(o.overflowX) || /hidden|clip/.test(o.overflow)) return true;
        }
        return false;
      };
      const wide = [...document.querySelectorAll('body *')].filter(el => {
        const b = el.getBoundingClientRect();
        return b.width > 0 && (b.right > vw + 1.5 || b.left < -1.5) && !clipped(el);
      }).slice(0, 5).map(el => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]);
      const lg = document.querySelector('.nav__logo').getBoundingClientRect();
      const rights = ['.nav__cta', '.burger', '.nav__links']
        .map(sel => document.querySelector(sel))
        .filter(el => el && el.getClientRects().length && getComputedStyle(el).display !== 'none')
        .map(el => el.getBoundingClientRect().left);
      const vis = el => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      const small = [...document.querySelectorAll('a.btn,.burger')].filter(a => vis(a) && a.getBoundingClientRect().height < 36)
        .map(a => (a.className || a.tagName) + ':' + Math.round(a.getBoundingClientRect().height));
      // smallest rendered font size anywhere with real text
      let min = 99, minSel = '';
      [...document.querySelectorAll('p,li,dd,dt,span,a,h1,h2,h3,cite,figcaption')].forEach(el => {
        if (!el.textContent.trim() || !el.getClientRects().length) return;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < min) { min = fs; minSel = el.className || el.tagName; }
      });
      return {
        sw: de.scrollWidth, vw, h: de.scrollHeight, wide,
        navOverlap: rights.length ? lg.right > Math.min(...rights) + 1 : false,
        smallTaps: small.length ? small : 0, minFont: +min.toFixed(1), minSel: String(minSel).slice(0, 26),
      };
    });
    const bad = r.sw > r.vw + 1 || r.wide.length || r.navOverlap || r.smallTaps !== 0 || errs.length;
    console.log(`  ${String(w).padStart(4)}x${String(h).padEnd(4)} h=${String(r.h).padStart(6)} minFont=${r.minFont}px (${r.minSel}) ` +
      (bad ? 'ISSUES ' + JSON.stringify({ sw: r.sw, wide: r.wide, nav: r.navOverlap, taps: r.smallTaps, errs }) : 'ok'));
    if ([390, 768, 1920].includes(w)) await p2.screenshot({ path: `${OUT}/resp-${w}.jpg`, type: 'jpeg', quality: 80 });
    await p2.close();
  }

  console.log('\nerrors:', errors.length ? errors.slice(0, 12) : 'none');
  await browser.close();
})();
