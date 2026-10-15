/* Tiny Excalidraw-style diagram helper built on rough.js (MIT). */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function clip(n, px, py) { // point on node border toward (px,py)
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2, dx = px - cx, dy = py - cy;
    if (!dx && !dy) return [cx, cy];
    const t = Math.min(dx ? (n.w / 2 + 8) / Math.abs(dx) : 1e9, dy ? (n.h / 2 + 8) / Math.abs(dy) : 1e9);
    return [cx + dx * t, cy + dy * t];
  }
  window.sketch = function (svg, spec) {
    const rc = rough.svg(svg); let seed = spec.seed || 7;
    // Build steps: an item with `step: N` is drawn inside <g class="fragment" data-fragment-index="N">,
    // so reveal.js shows it on the Nth click. Items without `step` are always visible.
    const groups = {}; let H = svg;
    const at = step => { if (!step) { H = svg; return; } if (!groups[step]) { groups[step] = el("g", { "class": "fragment", "data-fragment-index": step }, svg); } H = groups[step]; };
    svg.setAttribute("viewBox", `0 0 ${spec.w} ${spec.h}`);
    const byId = {};
    (spec.nodes || []).forEach(n => {
      at(n.step); byId[n.id] = n; const o = { stroke: n.color || "#cbd5e1", strokeWidth: 3, roughness: 1.4, bowing: 1.2, seed: seed++, fill: n.fill, fillStyle: n.fillStyle || "hachure", hachureGap: 9, fillWeight: 1.6, hachureAngle: -41 };
      if (n.dashed) o.strokeLineDash = [12, 10];
      let shape;
      if (n.shape === "ellipse") shape = rc.ellipse(n.x + n.w / 2, n.y + n.h / 2, n.w, n.h, o);
      else if (n.shape === "diamond") shape = rc.polygon([[n.x + n.w / 2, n.y], [n.x + n.w, n.y + n.h / 2], [n.x + n.w / 2, n.y + n.h], [n.x, n.y + n.h / 2]], o);
      else if (n.shape === "none") shape = null;
      else shape = rc.rectangle(n.x, n.y, n.w, n.h, o);
      if (shape) H.appendChild(shape);
      let tx = n.x + n.w / 2, ty = n.y + n.h / 2;
      if (n.avatar) { const s = n.avatarSize || 70; el("image", { href: n.avatar, x: n.x + n.w / 2 - s / 2, y: n.y + 12, width: s, height: s }, H); ty = n.y + 12 + s + (n.h - 12 - s) / 2; }
      const lines = String(n.text || "").split("\n"); const fs = n.size || 30, lh = fs * 1.15;
      const t = el("text", { x: tx, y: ty - (lines.length - 1) * lh / 2, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": fs }, H);
      lines.forEach((l, i) => { const s = el("tspan", { x: tx, dy: i ? lh : 0 }, t); s.textContent = l; if (i > 0 && n.subColor) s.setAttribute("fill", n.subColor); if (i > 0 && n.subSize) s.setAttribute("font-size", n.subSize); });
      if (n.textColor) t.setAttribute("fill", n.textColor);
    });
    (spec.edges || []).forEach(e => {
      at(e.step);
      if (e.points) { // orthogonal route with rounded corners + label pill
        const P = e.points, r = e.radius || 22, o = { stroke: e.color || "#94a3b8", strokeWidth: 3.5, roughness: e.roughness != null ? e.roughness : 0.4, bowing: 0.3, seed: seed++ };
        let d = `M${P[0][0]},${P[0][1]}`;
        for (let i = 1; i < P.length - 1; i++) {
          const [px, py] = P[i - 1], [cx, cy] = P[i], [nx, ny] = P[i + 1];
          const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy), rr = Math.min(r, l1 / 2, l2 / 2);
          const ax = cx - (cx - px) / l1 * rr, ay = cy - (cy - py) / l1 * rr, bx = cx + (nx - cx) / l2 * rr, by = cy + (ny - cy) / l2 * rr;
          d += ` L${ax},${ay} Q${cx},${cy} ${bx},${by}`;
        }
        const end = P[P.length - 1], prev = P[P.length - 2]; d += ` L${end[0]},${end[1]}`;
        H.appendChild(rc.path(d, o));
        const ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]), L = 20;
        H.appendChild(rc.path(`M${end[0] - L * Math.cos(ang + 0.5)},${end[1] - L * Math.sin(ang + 0.5)} L${end[0]},${end[1]} L${end[0] - L * Math.cos(ang - 0.5)},${end[1] - L * Math.sin(ang - 0.5)}`, o));
        if (e.label) {
          const fs = e.size || 26, lx = e.lx, ly = e.ly, w = e.pillW || e.label.length * fs * 0.52 + 44, h = fs + 22;
          el("rect", { x: lx - w / 2, y: ly - h / 2, width: w, height: h, rx: h / 2, fill: e.pillFill || "#2a1416", stroke: e.color || "#94a3b8", "stroke-width": 2.5 }, H);
          const t = el("text", { x: lx, y: ly + 1, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": fs, fill: e.labelColor || "#fff" }, H); t.textContent = e.label;
        }
        return;
      }
      const a = byId[e.from], b = byId[e.to];
      const ac = [a.x + a.w / 2, a.y + a.h / 2], bc = [b.x + b.w / 2, b.y + b.h / 2];
      let mid = e.via;
      const p1 = clip(a, ...(mid || bc)), p2 = clip(b, ...(mid || ac));
      const o = { stroke: e.color || "#94a3b8", strokeWidth: 3, roughness: 1.1, seed: seed++ };
      if (e.dashed) o.strokeLineDash = [10, 9];
      H.appendChild(mid ? rc.curve([p1, mid, p2], o) : rc.line(p1[0], p1[1], p2[0], p2[1], o));
      const from = mid || p1, ang = Math.atan2(p2[1] - from[1], p2[0] - from[0]), L = 22;
      [0.45, -0.45].forEach(d => H.appendChild(rc.line(p2[0], p2[1], p2[0] - L * Math.cos(ang + d), p2[1] - L * Math.sin(ang + d), o)));
      if (e.label) {
        const lx = e.lx != null ? e.lx : (mid ? mid[0] : (p1[0] + p2[0]) / 2), ly = e.ly != null ? e.ly : (mid ? mid[1] : (p1[1] + p2[1]) / 2) - 16;
        const t = el("text", { x: lx, y: ly, "text-anchor": "middle", "font-size": e.size || 24, fill: e.labelColor || "#fbbf24" }, H); t.textContent = e.label;
      }
    });
    (spec.notes || []).forEach(n => { at(n.step); const t = el("text", { x: n.x, y: n.y, "font-size": n.size || 24, fill: n.color || "#9aa3b5", "text-anchor": n.anchor || "start" }, H); t.textContent = n.text; });
  };
})();
