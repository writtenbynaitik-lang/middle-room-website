/* ============================================================
   MIDDLE ROOM — site behaviour
   Lenis for the scroll feel, GSAP/ScrollTrigger for choreography,
   WebGL for the record. Everything degrades: no WebGL, no JS,
   or reduced-motion all leave a readable, complete page.
   ============================================================ */
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createRecord } from './record.js';
import { splitLines } from './split.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE  = window.matchMedia('(pointer: coarse)').matches;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const EASE = 'expo.out';
const html = document.documentElement;

/* ============================================================
   1 · Smooth scroll
   ============================================================ */
let lenis = null;
function initScroll() {
  if (REDUCED) return;
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    smoothWheel: true,
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target, offset = 0) => {
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.25 });
  else (typeof target === 'string' ? $(target) : target)?.scrollIntoView({ behavior: 'smooth' });
};

/* ============================================================
   2 · Preloader — hold until fonts and the opening images are ready
   ============================================================ */
function criticalMedia() {
  const srcs = ['assets/img/hero-wall.webp', 'assets/img/logo.png'];
  return Promise.all(srcs.map(s => new Promise(res => {
    const i = new Image();
    i.onload = i.onerror = res;
    i.src = s;
  })));
}

function preload() {
  const bar   = $('.pre__bar i');
  const num   = $('.pre__num');
  const pre   = $('.pre');
  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    criticalMedia(),
    new Promise(r => setTimeout(r, REDUCED ? 0 : 520)),
  ]);

  const count = { v: 0 };
  if (!REDUCED) {
    gsap.to(count, {
      v: 92, duration: 1.5, ease: 'power1.inOut',
      onUpdate: () => {
        const n = Math.round(count.v);
        if (num) num.textContent = String(n).padStart(3, '0');
        if (bar) bar.style.transform = `scaleX(${n / 100})`;
      },
    });
  }

  return ready.then(() => new Promise(res => {
    const tl = gsap.timeline({ onComplete: res });
    if (REDUCED) {
      tl.set(pre, { display: 'none' });
      return;
    }
    tl.to(count, {
      v: 100, duration: 0.42, ease: 'power2.out',
      onUpdate: () => {
        const n = Math.round(count.v);
        if (num) num.textContent = String(n).padStart(3, '0');
        if (bar) bar.style.transform = `scaleX(${n / 100})`;
      },
    })
      .to('.pre__inner', { autoAlpha: 0, duration: 0.3, ease: 'power2.inOut' }, '+=0.1')
      .to(pre, { yPercent: -100, duration: 1.05, ease: 'expo.inOut' }, '-=0.05')
      .set(pre, { display: 'none' });
  }));
}

/* ============================================================
   3 · Custom cursor
   ============================================================ */
function initCursor() {
  if (COARSE || REDUCED) return;
  const dot  = $('.cur__dot');
  const ring = $('.cur__ring');
  const label = $('.cur__label');
  if (!dot || !ring) return;

  const p = { x: innerWidth / 2, y: innerHeight / 2 };
  const r = { x: p.x, y: p.y };
  let woken = false;
  addEventListener('pointermove', e => {
    p.x = e.clientX; p.y = e.clientY;
    if (!woken) { woken = true; r.x = p.x; r.y = p.y; document.body.classList.add('has-cursor'); }
  }, { passive: true });

  gsap.ticker.add(() => {
    r.x += (p.x - r.x) * 0.16;
    r.y += (p.y - r.y) * 0.16;
    dot.style.transform  = `translate3d(${p.x}px,${p.y}px,0) translate(-50%,-50%)`;
    ring.style.transform = `translate3d(${r.x}px,${r.y}px,0) translate(-50%,-50%)`;
  });

  $$('a, button, [data-cursor]').forEach(el => {
    const mode = el.dataset.cursor || 'link';
    el.addEventListener('pointerenter', () => {
      document.body.dataset.cur = mode;
      if (label) label.textContent = el.dataset.cursorLabel || '';
    });
    el.addEventListener('pointerleave', () => {
      document.body.dataset.cur = '';
      if (label) label.textContent = '';
    });
  });
}

/* ============================================================
   4 · Header, menu, tracklist
   ============================================================ */
function initNav() {
  const nav = $('.nav');
  const btn = $('.burger');
  const menu = $('.menu');
  let open = false, lastY = 0;

  // hide going down, show coming back up
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-solid', y > 40);
      if (!open) nav.classList.toggle('is-hidden', y > lastY + 6 && y > 420);
      lastY = y;
    },
  });

  // the paper-coloured sections need dark ink for the nav and the rail
  const rail = $('.track');
  $$('[data-theme="light"]').forEach(sec => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 72px', end: 'bottom 72px',
      onToggle: s => nav.classList.toggle('is-light', s.isActive),
    });
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: s => rail && rail.classList.toggle('is-light', s.isActive),
    });
  });

  const links = $$('.menu__link');
  const tl = gsap.timeline({ paused: true })
    .set(menu, { display: 'grid' })
    .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
    .from(links, { yPercent: 115, duration: 0.7, stagger: 0.05, ease: EASE }, '-=0.42')
    .from('.menu__meta > *', { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.06 }, '-=0.4');

  const set = v => {
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    menu.setAttribute('aria-hidden', String(!v));
    html.classList.toggle('menu-open', v);
    if (lenis) v ? lenis.stop() : lenis.start();
    v ? tl.play() : tl.reverse();
  };
  btn?.addEventListener('click', () => set(!open));
  addEventListener('keydown', e => { if (e.key === 'Escape' && open) set(false); });

  // in-page links
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || !$(id)) return;
      e.preventDefault();
      if (open) set(false);
      scrollTo(id, -10);
    });
  });

  // side tracklist — resolve the single active section on every update,
  // so there is never a gap or two lit at once
  const marks = $$('.track__i');
  const zones = marks
    .map(mk => ({ mk, el: document.getElementById(mk.dataset.for) }))
    .filter(z => z.el);
  let active = null;
  const syncTrack = () => {
    const probe = window.scrollY + innerHeight * 0.45;
    let hit = null;
    zones.forEach(z => {
      const top = z.el.getBoundingClientRect().top + window.scrollY;
      if (probe >= top) hit = z.mk;              // zones are in document order
    });
    if (hit !== active) {
      if (active) active.classList.remove('is-on');
      if (hit) hit.classList.add('is-on');
      active = hit;
    }
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncTrack, onRefresh: syncTrack });
  syncTrack();
}

/* ============================================================
   5 · Reveals — headings, lines, media, rows
   ============================================================ */
function initReveals() {
  // headings split into line masks
  $$('[data-split]').forEach(el => {
    const lines = splitLines(el);
    if (REDUCED) { gsap.set(lines, { yPercent: 0 }); return; }
    if (el.dataset.split === 'hero') { gsap.set(lines, { yPercent: 115 }); return; }
    gsap.fromTo(lines,
      { yPercent: 112 },
      {
        yPercent: 0, duration: 1.15, stagger: 0.075, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
  });

  if (REDUCED) {
    gsap.set('[data-fade], [data-media] img, [data-rows] > *', { autoAlpha: 1, y: 0, scale: 1, clipPath: 'none' });
    return;
  }

  // simple fades
  $$('[data-fade]').forEach(el => {
    gsap.from(el, {
      autoAlpha: 0, y: parseFloat(el.dataset.fade) || 26,
      duration: 1, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // staggered rows (spec sheets, menus, credits)
  $$('[data-rows]').forEach(el => {
    gsap.from(el.children, {
      autoAlpha: 0, y: 24, duration: 0.85, stagger: 0.07, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // image wipes + a slow drift while in view
  $$('[data-media]').forEach(fig => {
    const img = $('img', fig);
    if (!img) return;
    gsap.fromTo(fig,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'expo.inOut',
        scrollTrigger: { trigger: fig, start: 'top 92%', once: true },
      });
    gsap.fromTo(img, { scale: 1.22 }, {
      scale: 1, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: fig, start: 'top 92%', once: true },
    });
    if (fig.dataset.media !== 'still') {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });

  // counters
  $$('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.count);
    const dp = (el.dataset.countDecimals | 0);
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => {
        el.textContent = dp ? o.v.toFixed(dp) : Math.round(o.v).toLocaleString('en-IN');
      },
    });
  });
}

/* ============================================================
   6 · Marquees — continuous, nudged by scroll velocity
   ============================================================ */
function initMarquees() {
  $$('[data-marquee]').forEach(track => {
    const inner = $('.mq__row', track);
    if (!inner) return;
    const dir = track.dataset.marquee === 'rtl' ? -1 : 1;
    // duplicate until it comfortably covers two screens
    const base = inner.innerHTML;
    let guard = 0;
    while (inner.scrollWidth < track.offsetWidth * 2 && guard++ < 8) inner.innerHTML += base;

    if (REDUCED) return;
    const half = inner.scrollWidth / 2;
    const tw = gsap.fromTo(inner,
      { x: dir < 0 ? 0 : -half },
      { x: dir < 0 ? -half : 0, duration: Math.max(18, half / 55), ease: 'none', repeat: -1 });

    if (lenis) {
      lenis.on('scroll', ({ velocity }) => {
        const v = gsap.utils.clamp(-3.2, 3.2, 1 + Math.abs(velocity) * 0.075);
        gsap.to(tw, { timeScale: v, duration: 0.35, overwrite: true });
      });
    }
  });
}

/* ============================================================
   7 · The record — scroll choreography
   ============================================================ */
async function initRecord() {
  const canvas = $('#record');
  if (!canvas) return;
  const rec = await createRecord({
    canvas, logoSrc: 'assets/img/logo.png', reduced: REDUCED,
  });
  if (!rec) { canvas.remove(); return; }
  if (window.__mr) window.__mr.record = rec;

  const s = rec.state;
  const mm = gsap.matchMedia();

  const build = (big) => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        endTrigger: '#listening',
        end: 'bottom 90%',
        scrub: 0.6,
      },
    });
    // hero -> manifesto: the record turns away and goes edge-on
    tl.fromTo(s,
      { tilt: 0.32, roll: -0.08, x: big ? 1.14 : 0, y: big ? 0.30 : 0.70, scale: big ? 0.62 : 0.46, opacity: 1 },
      { tilt: 0.66, roll: 0.26, x: big ? 1.02 : 0, y: big ? 0.04 : 0.34, scale: big ? 0.70 : 0.50, duration: 1 })
      // turned away and foreshortened, riding the right margin
      .to(s, { tilt: 1.08, roll: 0.84, x: big ? 0.86 : 0, y: big ? -0.44 : -0.36, scale: big ? 0.88 : 0.62, duration: 1 })
      // and out past the top-right corner, fading as it goes, so it is
      // fully gone before The Room's heading arrives
      .to(s, { tilt: 0.84, roll: 1.42, x: big ? 2.05 : 1.1, y: big ? 0.34 : 0.3,
               scale: big ? 0.60 : 0.44, opacity: 0, duration: 1, ease: 'power1.in' });

    // spin up a little as you scroll (quickTo: never overwrites the timeline)
    if (lenis) {
      const toSpeed = gsap.quickTo(s, 'speed', { duration: 0.5, ease: 'power2.out' });
      lenis.on('scroll', ({ velocity }) => toSpeed(gsap.utils.clamp(0.6, 5, 1 + Math.abs(velocity) * 0.1)));
    }
    return () => tl.scrollTrigger?.kill();
  };

  mm.add('(min-width: 900px)', () => build(true));
  mm.add('(max-width: 899px)', () => build(false));
}

/* ============================================================
   8 · Programme — pinned horizontal run of sleeves
   ============================================================ */
function initProgramme() {
  const rail = $('.prog__rail');
  const track = $('.prog__track');
  if (!rail || !track) return;

  gsap.matchMedia().add('(min-width: 981px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);
    const tw = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: rail, start: 'top top', end: () => '+=' + (dist() + window.innerHeight * 0.45),
        pin: true, scrub: 0.55, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); gsap.set(track, { x: 0 }); };
  });
}

/* ============================================================
   9 · 3D sleeve tilt + magnetic buttons
   ============================================================ */
function init3DHovers() {
  if (COARSE || REDUCED) return;

  $$('[data-tilt]').forEach(card => {
    const inner = $('.sleeve__3d', card) || card.firstElementChild;
    if (!inner) return;
    const max = parseFloat(card.dataset.tilt) || 11;
    const qx = gsap.quickTo(inner, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    const qy = gsap.quickTo(inner, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const qz = gsap.quickTo(inner, 'z', { duration: 0.5, ease: 'power3.out' });
    const shine = $('.sleeve__shine', card);

    card.addEventListener('pointermove', e => {
      const b = card.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - 0.5;
      const py = (e.clientY - b.top) / b.height - 0.5;
      qx(px * max * 2); qy(-py * max * 2); qz(42);
      if (shine) shine.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => { qx(0); qy(0); qz(0); });
  });

  $$('[data-magnet]').forEach(el => {
    const qx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      qx((e.clientX - (b.left + b.width / 2)) * 0.26);
      qy((e.clientY - (b.top + b.height / 2)) * 0.34);
    });
    el.addEventListener('pointerleave', () => { qx(0); qy(0); });
  });
}

/* ============================================================
   10 · Hero intro + page background shifts
   ============================================================ */
function initHero() {
  const tl = gsap.timeline({ delay: 0.05 });
  if (REDUCED) {
    gsap.set('.hero__eyebrow, .hero__sub, .hero__acts, .hero__cue, .nav__in > *, .hero__media', { autoAlpha: 1, y: 0 });
    gsap.set('.hero h1 .line__i', { yPercent: 0 });
    return;
  }
  tl.fromTo('.hero__media', { scale: 1.14, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 1.8, ease: 'expo.out' })
    .from('.nav__in > *', { autoAlpha: 0, y: -14, duration: 0.8, stagger: 0.08, ease: EASE }, 0.2)
    .from('.hero__eyebrow', { autoAlpha: 0, y: 18, duration: 0.8, ease: EASE }, 0.3)
    .fromTo('.hero h1 .line__i', { yPercent: 115 }, { yPercent: 0, duration: 1.25, stagger: 0.085, ease: EASE }, 0.38)
    .from('.hero__sub', { autoAlpha: 0, y: 22, duration: 0.9, ease: EASE }, 0.85)
    .from('.hero__acts > *', { autoAlpha: 0, y: 22, duration: 0.85, stagger: 0.08, ease: EASE }, 0.95)
    .from('.hero__cue', { autoAlpha: 0, duration: 0.8 }, 1.15)
    .from('.hero__strip .mq', { autoAlpha: 0, duration: 0.8 }, 1.1);

  // slow push on the hero photo as you leave it
  gsap.to('.hero__media img', {
    yPercent: 12, scale: 1.06, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ============================================================
   boot
   ============================================================ */
(async function boot() {
  html.classList.add('js');
  initScroll();

  // keep layout measurements honest once fonts land
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());

  await preload();

  initCursor();
  initNav();
  initReveals();
  initHero();
  initMarquees();
  initProgramme();
  init3DHovers();
  initRecord();

  // re-split headings and re-measure after a resize settles
  let t;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 220);
  });

  window.__mr = { gsap, ScrollTrigger, get lenis() { return lenis; } };

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    html.classList.add('is-ready');
  });
})();
