/* Split an element's text into word spans, then group them into line
   masks by measuring where the browser actually broke the lines.

   Inline formatting (<em>, <b>, …) is rebuilt *inside* each word, so
   every word span is a flat, movable child of the root. Nesting words
   inside the original inline element would leak its styling across the
   whole line once the words are regrouped. */

const INLINE_SKIP = new Set(['BR']);

function wrapWords(el) {
  if (el.dataset.splitSrc == null) el.dataset.splitSrc = el.innerHTML;
  const tmp = document.createElement('div');
  tmp.innerHTML = el.dataset.splitSrc;

  const out = document.createDocumentFragment();

  const walk = (node, chain) => {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { out.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          // rebuild the inline ancestry inside the word
          let host = w;
          chain.forEach(tag => {
            const c = tag.cloneNode(false);
            host.appendChild(c);
            host = c;
          });
          host.textContent = part;
          out.appendChild(w);
        });
      } else if (n.nodeType === 1) {
        if (INLINE_SKIP.has(n.tagName)) { out.appendChild(n.cloneNode()); return; }
        walk(n, chain.concat(n));
      }
    });
  };
  walk(tmp, []);

  el.innerHTML = '';
  el.appendChild(out);
  return [...el.children].filter(c => c.classList.contains('w'));
}

export function splitLines(el) {
  const words = wrapWords(el);
  if (!words.length) return [];

  // group words by the vertical position the browser gave them
  const rows = [];
  let top = null, cur = null;
  words.forEach(w => {
    const t = Math.round(w.offsetTop);
    if (top === null || Math.abs(t - top) > 4) { cur = []; rows.push(cur); top = t; }
    cur.push(w);
  });

  const lines = [];
  rows.forEach(row => {
    const line = document.createElement('span');
    line.className = 'line';
    const inner = document.createElement('span');
    inner.className = 'line__i';
    line.appendChild(inner);
    el.insertBefore(line, row[0]);          // always at the root
    row.forEach((w, i) => {
      if (i) inner.appendChild(document.createTextNode(' '));
      inner.appendChild(w);
    });
    lines.push(inner);
  });

  // drop the loose whitespace left between the new lines
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 3 && !n.textContent.trim()) n.remove();
    if (n.nodeType === 1 && n.tagName === 'BR') n.remove();
  });

  el.classList.add('is-split');
  return lines;
}
