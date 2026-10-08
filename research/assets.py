"""Build the site's image set.
Sources, all genuinely Middle Room:
  research/m9/*       interiors by M9 Design Studio, photography Ekansh Goel (3840px)
  research/dl/*       Middle Room / The Courtyard own photography (thecourtyard.in)
  research/*.webp|png their own Instagram grid + stories (reference screenshots)
"""
from PIL import Image, ImageFilter, ImageStat
import os, glob

OUT = 'site/assets/img'
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(OUT + '/*'):
    os.remove(f)

def fit(src, dst, w, h, pos=(0.5, 0.5), q=82, sharpen=0.0):
    """Cover-crop to exactly w x h around a focal point, then save as WebP."""
    im = Image.open(src)
    im.draft('RGB', (w * 2, h * 2))          # fast partial JPEG decode
    im = im.convert('RGB')
    sw, sh = im.size
    s = max(w / sw, h / sh)
    nw, nh = max(w, round(sw * s)), max(h, round(sh * s))
    im = im.resize((nw, nh), Image.LANCZOS)
    x = round((nw - w) * pos[0]); y = round((nh - h) * pos[1])
    im = im.crop((x, y, x + w, y + h))
    if sharpen:
        im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=int(sharpen * 100), threshold=3))
    im.save(os.path.join(OUT, dst), 'WEBP', quality=q, method=6)
    return im.size

M9, DL, R = 'research/m9', 'research/dl', 'research'

# ---- hero + full-bleed interiors (M9 / Ekansh Goel, 3840px originals) ----
print('hero-wall     ', fit(f'{M9}/m9_1.jpg', 'hero-wall.webp',   2400, 1600, (.5, .46), 84))
print('bar-wide      ', fit(f'{M9}/m9_6.jpg', 'bar-wide.webp',    2200, 1238, (.5, .50), 83))
print('room-booth    ', fit(f'{M9}/m9_3.jpg', 'room-booth.webp',  1400, 1900, (.5, .42), 82))
print('room-lounge   ', fit(f'{M9}/m9_2.jpg', 'room-lounge.webp', 1400, 1900, (.5, .52), 82))
print('room-nook     ', fit(f'{M9}/m9_4.jpg', 'room-nook.webp',   1400, 1900, (.5, .50), 82))
print('arrival       ', fit(f'{M9}/m9_5.jpg', 'arrival.webp',     1300, 1800, (.5, .50), 82))

# ---- Middle Room / Courtyard own photography ----
print('room-red      ', fit(f'{DL}/mr_03.jpg', 'room-red.webp',    1900, 1267, (.5, .48), 83))
print('vinyl-wall    ', fit(f'{DL}/mr_02.jpg', 'vinyl-wall.webp',  1700, 1133, (.5, .56), 82))
print('team-tall     ', fit(f'{DL}/mr_05.jpg', 'team-tall.webp',   1100, 1465, (.5, .46), 82))

# ---- session artwork from their own Instagram grid, as record sleeves ----
def trim_gutters(im, maxtrim=18):
    px = im.load(); w, h = im.size; ys = list(range(4, h - 4, 3))
    dc = lambda x: sum(1 for y in ys if max(px[x, y]) < 16) / len(ys)
    L = 0
    while L < maxtrim and dc(L) > .96: L += 1
    Rt = w - 1
    while (w - 1 - Rt) < maxtrim and dc(Rt) > .96: Rt -= 1
    return im.crop((L + 1, 0, Rt, h))

def patch_badge(im, bw=28, bh=32, src=16):
    """Instagram stamps a carousel badge on the tile's top-right corner.
    Rebuild that block row by row from the pixels immediately to its left,
    so flat fills and vertical gradients both stay seamless."""
    px = im.load(); w, h = im.size
    x0 = w - bw
    for y in range(bh):
        row = sorted(px[x, y] for x in range(max(0, x0 - src), x0))
        c = row[len(row) // 2]                            # median of the strip
        for x in range(x0, w):
            px[x, y] = c
    return im

def sleeve(fn, box, dst, trim_top=0, badge=True, size=760):
    im = Image.open(os.path.join(R, fn)).convert('RGB').crop(box)
    im = trim_gutters(im)
    if trim_top: im = im.crop((0, trim_top, im.width, im.height))
    if badge: im = patch_badge(im)
    side = im.width                                   # square, anchored near the top
    top = round((im.height - side) * .10)
    im = im.crop((0, top, side, top + side)).resize((size, size), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=.9, percent=60, threshold=3))
    im.save(os.path.join(OUT, dst), 'WEBP', quality=88, method=6)
    print(f'{dst:24s}', im.size)

sleeve('4.webp', (509, 147, 844, 561),  'p-nirvana.webp')
sleeve('3.webp', (843, 149, 1178, 563), 'p-nickdrake.webp')
sleeve('2.png',  (509, 157, 844, 571),  'p-cigarettes.webp')
sleeve('2.png',  (176, 157, 510, 571),  'p-crossovers.webp')
sleeve('4.webp', (176, 147, 510, 561),  'p-bangalore.webp')
sleeve('3.webp', (509, 149, 844, 563),  'p-habibi.webp')

# ---- food, drink, kitchen stills from their own Instagram stories ----
def still(fn, dst, box=(503, 195, 849, 598), w=760, h=950):
    im = Image.open(os.path.join(R, fn)).convert('RGB').crop(box)
    sw, sh = im.size; s = max(w / sw, h / sh)
    im = im.resize((round(sw * s), round(sh * s)), Image.LANCZOS)
    x = (im.width - w) // 2; y = (im.height - h) // 2
    im = im.crop((x, y, x + w, y + h))
    im = im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=3))
    im.save(os.path.join(OUT, dst), 'WEBP', quality=86, method=6)
    print(f'{dst:24s}', im.size)

still('8.webp',  'drink-beer.webp')
still('9.webp',  'drink-pour.webp')
still('3.webp',  'food-cheeseballs.webp', box=(178, 183, 508, 561))

# ---- the real wordmark (kept as PNG for its alpha) ----
Image.open(f'{DL}/middleroom.png').save(os.path.join(OUT, 'logo.png'), optimize=True)
print('logo.png                ', Image.open(os.path.join(OUT, 'logo.png')).size)
