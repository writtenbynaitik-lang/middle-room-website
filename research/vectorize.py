"""Trace the Middle Room wordmark PNG into a crisp SVG.

The source logo is a 316x120 alpha mask, which goes soft the moment it is
shown larger than a nav bar. Marching squares at 6x, then Ramer-Douglas-
Peucker, gives clean closed paths that stay sharp at any size.
"""
from PIL import Image

SRC, DST, UP, EPS = 'research/dl/middleroom.png', 'site/assets/img/logo.svg', 6, 0.18

im = Image.open(SRC).convert('RGBA')
W0, H0 = im.size
a = im.split()[3].resize((W0 * UP, H0 * UP), Image.LANCZOS)
W, H = a.size
px = a.load()
g = [[1 if px[x, y] > 127 else 0 for x in range(W)] for y in range(H)]

def at(x, y):
    return g[y][x] if 0 <= x < W and 0 <= y < H else 0

# marching squares: bits TL=8 TR=4 BR=2 BL=1, segments oriented consistently
TABLE = {
    1:  [('B', 'L')], 2:  [('R', 'B')], 3:  [('R', 'L')], 4:  [('T', 'R')],
    5:  [('T', 'L'), ('B', 'R')],       6:  [('T', 'B')], 7:  [('T', 'L')],
    8:  [('L', 'T')], 9:  [('B', 'T')], 10: [('L', 'B'), ('R', 'T')],
    11: [('R', 'T')], 12: [('L', 'R')], 13: [('B', 'R')], 14: [('L', 'B')],
}
def pt(kind, x, y):
    return {'T': (x + .5, y), 'R': (x + 1, y + .5), 'B': (x + .5, y + 1), 'L': (x, y + .5)}[kind]

segs = {}
for y in range(-1, H):
    for x in range(-1, W):
        c = at(x, y) * 8 + at(x + 1, y) * 4 + at(x + 1, y + 1) * 2 + at(x, y + 1)
        for s, e in TABLE.get(c, []):
            segs.setdefault(pt(s, x, y), []).append(pt(e, x, y))

loops = []
while segs:
    start = next(iter(segs))
    loop, cur = [start], start
    while True:
        nxts = segs.get(cur)
        if not nxts:
            break
        nxt = nxts.pop()
        if not nxts:
            del segs[cur]
        loop.append(nxt)
        cur = nxt
        if cur == start:
            break
    if len(loop) > 8:
        loops.append(loop)

def _rdp_open(pts, eps):
    if len(pts) < 3:
        return pts
    stack, keep = [(0, len(pts) - 1)], [False] * len(pts)
    keep[0] = keep[-1] = True
    while stack:
        i, j = stack.pop()
        ax, ay = pts[i]; bx, by = pts[j]
        dx, dy = bx - ax, by - ay
        n = (dx * dx + dy * dy) ** .5 or 1e-9
        best, bi = 0.0, -1
        for k in range(i + 1, j):
            cx, cy = pts[k]
            d = abs(dy * cx - dx * cy + bx * ay - by * ax) / n
            if d > best:
                best, bi = d, k
        if bi >= 0 and best > eps:
            keep[bi] = True
            stack.append((i, bi)); stack.append((bi, j))
    return [p for p, k in zip(pts, keep) if k]


def rdp(pts, eps):
    """RDP on a *closed* loop: a straight run from start back to start is
    degenerate, so split the loop at its farthest point first."""
    if len(pts) > 2 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 4:
        return pts
    ax, ay = pts[0]
    m = max(range(1, len(pts)), key=lambda k: (pts[k][0] - ax) ** 2 + (pts[k][1] - ay) ** 2)
    return _rdp_open(pts[:m + 1], eps) + _rdp_open(pts[m:], eps)[1:]

paths, pts_total = [], 0
for loop in loops:
    s = rdp(loop, EPS * UP)
    if len(s) < 3:
        continue
    pts_total += len(s)
    d = 'M' + ' '.join(f'{x / UP:.2f},{y / UP:.2f}' for x, y in s) + 'Z'
    paths.append(d)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W0} {H0}" '
       f'fill="currentColor" fill-rule="evenodd" role="img" aria-label="Middle Room">'
       f'<path d="{" ".join(paths)}"/></svg>')
open(DST, 'w').write(svg)
print(f'{DST}: {len(loops)} contours, {pts_total} points, {len(svg)/1024:.1f} kB')
