/*!
 * SimpleGeo · изолинии v1
 * Фирменный паттерн: тонкие линии чернилами 20%, каждая пятая — зелёная 90%, утолщённая.
 *
 * Использование:
 *   <div data-sg-iso='{"seed":3}'>…контент…</div>   — фон появится сам (canvas под контентом)
 *   SGIsolines.draw(canvas, {seed:3})                  — нарисовать в свой canvas
 *   SGIsolines.toSVG(1920, 1080, {seed:3})              — строка SVG для экспорта
 */
(function (root) {
  var DEFAULTS = {
    seed: 1, levels: 18, majorEvery: 5,
    minor: '#1C211D', minorAlpha: 0.20,
    major: '#17784A', majorAlpha: 0.90,
    lineWidth: null,          // по умолчанию max(1, длинная сторона / 900)
    majorScale: 2.2,
    background: null,         // null = прозрачный
    grid: null                // шаг сетки поля в px, по умолчанию авто
  };
  function assign(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; if (b) for (k in b) if (b[k] !== undefined) o[k] = b[k]; return o; }
  function rng(s) { s = Math.floor(s) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function rgba(hex, a) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); return 'rgba(' + parseInt(hex.substr(0, 2), 16) + ',' + parseInt(hex.substr(2, 2), 16) + ',' + parseInt(hex.substr(4, 2), 16) + ',' + a + ')'; }

  function segments(W, H, o) {
    var r = rng(o.seed * 9973 + 131), M = Math.max(W, H), B = [], i, j;
    for (i = 0; i < 9; i++) B.push({ x: (r() * 1.3 - 0.15) * W, y: (r() * 1.3 - 0.15) * H, s: (0.10 + r() * 0.28) * M, a: r() * 2.2 - 0.9 });
    var ph = r() * 6;
    function f(x, y) { var v = 0; for (var k = 0; k < B.length; k++) { var b = B[k], dx = x - b.x, dy = y - b.y; v += b.a * Math.exp(-(dx * dx + dy * dy) / (b.s * b.s)); } return v + 0.08 * Math.sin(x / (M * 0.07) + ph) * Math.cos(y / (M * 0.09)); }
    var g = o.grid || Math.max(3, Math.round(M / 220)), nx = Math.ceil(W / g) + 2, ny = Math.ceil(H / g) + 2, V = new Float32Array(nx * ny), mn = 1e9, mx = -1e9;
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) { var v = f(i * g, j * g); V[j * nx + i] = v; if (v < mn) mn = v; if (v > mx) mx = v; }
    var step = (mx - mn) / o.levels, minor = [], major = [];
    for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var a = V[j * nx + i], b = V[j * nx + i + 1], c = V[(j + 1) * nx + i + 1], d = V[(j + 1) * nx + i];
      var lo = Math.min(a, b, c, d), hi = Math.max(a, b, c, d), k0 = Math.ceil((lo - mn) / step), k1 = Math.floor((hi - mn) / step);
      if (k1 < k0) continue; var x = i * g, y = j * g;
      for (var k = k0; k <= k1; k++) {
        if (k <= 0 || k >= o.levels) continue;
        var L = mn + k * step, p = [];
        if ((a < L) !== (b < L)) { var t = (L - a) / (b - a); p.push(x + g * t, y); }
        if ((b < L) !== (c < L)) { t = (L - b) / (c - b); p.push(x + g, y + g * t); }
        if ((c < L) !== (d < L)) { t = (L - c) / (d - c); p.push(x + g - g * t, y + g); }
        if ((d < L) !== (a < L)) { t = (L - d) / (a - d); p.push(x, y + g - g * t); }
        var arr = (k % o.majorEvery === 0) ? major : minor;
        for (var q = 0; q + 3 < p.length; q += 4) arr.push(p[q], p[q + 1], p[q + 2], p[q + 3]);
      }
    }
    return { minor: minor, major: major, lw: o.lineWidth || Math.max(1, M / 900) };
  }

  function draw(target, opts) {
    var o = assign(DEFAULTS, opts), cv = target, host = target;
    if (target.tagName !== 'CANVAS') {
      cv = target.querySelector(':scope > canvas.sg-iso-canvas');
      if (!cv) { cv = document.createElement('canvas'); cv.className = 'sg-iso-canvas'; cv.setAttribute('aria-hidden', 'true'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0'; if (getComputedStyle(target).position === 'static') target.style.position = 'relative'; target.insertBefore(cv, target.firstChild); }
    } else host = cv.parentElement || cv;
    var rect = (cv === target ? cv : host).getBoundingClientRect();
    var W = Math.max(10, Math.round(opts && opts.width || rect.width)), H = Math.max(10, Math.round(opts && opts.height || rect.height));
    var dpr = (opts && opts.dpr) || Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, W, H); }
    var s = segments(W, H, o); ctx.lineCap = 'round';
    [[s.minor, rgba(o.minor, o.minorAlpha), s.lw], [s.major, rgba(o.major, o.majorAlpha), s.lw * o.majorScale]].forEach(function (L) {
      ctx.strokeStyle = L[1]; ctx.lineWidth = L[2]; ctx.beginPath();
      for (var i = 0; i < L[0].length; i += 4) { ctx.moveTo(L[0][i], L[0][i + 1]); ctx.lineTo(L[0][i + 2], L[0][i + 3]); }
      ctx.stroke();
    });
    return cv;
  }

  function toSVG(W, H, opts) {
    var o = assign(DEFAULTS, opts), s = segments(W, H, o);
    function d(a) { var out = []; for (var i = 0; i < a.length; i += 4) out.push('M' + a[i].toFixed(1) + ' ' + a[i + 1].toFixed(1) + 'L' + a[i + 2].toFixed(1) + ' ' + a[i + 3].toFixed(1)); return out.join(''); }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      (o.background ? '<rect width="' + W + '" height="' + H + '" fill="' + o.background + '"/>' : '') +
      '<path d="' + d(s.minor) + '" fill="none" stroke="' + o.minor + '" stroke-opacity="' + o.minorAlpha + '" stroke-width="' + s.lw.toFixed(2) + '" stroke-linecap="round"/>' +
      '<path d="' + d(s.major) + '" fill="none" stroke="' + o.major + '" stroke-opacity="' + o.majorAlpha + '" stroke-width="' + (s.lw * o.majorScale).toFixed(2) + '" stroke-linecap="round"/></svg>';
  }

  function mountAll(scope) {
    var els = (scope || document).querySelectorAll('[data-sg-iso]');
    Array.prototype.forEach.call(els, function (el) {
      var opts = {}; try { opts = JSON.parse(el.getAttribute('data-sg-iso') || '{}'); } catch (e) {}
      draw(el, opts);
      if (window.ResizeObserver && !el.__sgRO) { var t; el.__sgRO = new ResizeObserver(function () { clearTimeout(t); t = setTimeout(function () { draw(el, opts); }, 120); }); el.__sgRO.observe(el); }
    });
  }
  var api = { draw: draw, toSVG: toSVG, mountAll: mountAll, defaults: DEFAULTS };
  root.SGIsolines = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { mountAll(); });
    else mountAll();
  }
})(typeof window !== 'undefined' ? window : this);
