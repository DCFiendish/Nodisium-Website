/* ============================================================
   Nodisium — hand-rolled spinning gold globe (canvas 2D)
   Ported from the reference implementation: orthographic 3D
   projection on plain canvas, Natural Earth 110m coastline
   rings (world-atlas, public domain), gold graticule, pulsing
   capital markers. Rendered only while Home is on-screen.
   ============================================================ */

(function () {
  "use strict";

  const el = document.getElementById("globe");
  const homeView = document.getElementById("view-home");
  if (!el || !homeView) return;

  // canvas fills the circular cutout
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  el.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const GOLD = "#FFC850";
  const TAU = Math.PI * 2;
  const RAD = Math.PI / 180;
  const TILT = -0.36;            // axial tilt, radians (~20.6°)
  const SPEED = 0.000135;        // rad per ms — the reference spin pace
  const MARKERS = [              // cities that pulse on the sphere
    [-9.6, 30.4], [-3.7, 40.4], [2.35, 48.86], [13.4, 52.5],
    [-0.13, 51.5], [12.5, 41.9], [-5.9, 35.8],
  ];

  let rings = null;   // coastline rings (lon/lat arrays)
  let rot = 0;        // current longitude rotation (rad)
  let onScreen = false;
  let wired = false;
  let reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rgba(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," +
      Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  }

  /* ---------------- data: Natural Earth 110m ---------------- */
  let tried = false;
  function loadEarth() {
    if (tried) return;
    tried = true;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json")
      .then((r) => r.json())
      .then((t) => { rings = decodeTopo(t); })
      .catch(() => {});
  }

  function decodeTopo(t) {
    const sx = t.transform.scale[0], sy = t.transform.scale[1];
    const tx = t.transform.translate[0], ty = t.transform.translate[1];
    const arcs = t.arcs.map((arc) => {
      let x = 0, y = 0;
      return arc.map((d) => { x += d[0]; y += d[1]; return [x * sx + tx, y * sy + ty]; });
    });
    const out = [];
    const addRing = (idxs) => {
      const pts = [];
      idxs.forEach((i) => {
        const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
        for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]);
      });
      if (pts.length > 2) out.push(pts);
    };
    t.objects.countries.geometries.forEach((g) => {
      if (g.type === "Polygon") g.arcs.forEach(addRing);
      else if (g.type === "MultiPolygon") g.arcs.forEach((p) => p.forEach(addRing));
    });
    return out;
  }

  /* ---------------- painting ---------------- */
  function paint() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const R = Math.min(w, h) / 2 - 1;   // fills the ring, hairline of air
    const cx = w / 2, cy = h / 2;

    // sphere body + limb — so the globe reads as a full disc in the ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fillStyle = rgba(GOLD, 0.028);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.stroke();

    const cp = Math.cos(TILT), sp = Math.sin(TILT);
    const proj = (lon, lat) => {
      const la = lat * RAD, lo = lon * RAD + rot, cl = Math.cos(la);
      const x = cl * Math.sin(lo), y0 = Math.sin(la), z0 = cl * Math.cos(lo);
      return [cx + x * R, cy - (y0 * cp - z0 * sp) * R, y0 * sp + z0 * cp];
    };

    function traceRing(pts, pr) {
      let pen = false;
      for (let k = 0; k < pts.length; k++) {
        const p = pr(pts[k][0], pts[k][1]);
        if (p[2] > 0) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; }
        else pen = false;
      }
    }

    // coastline/border rings (only the front hemisphere)
    if (rings) {
      ctx.beginPath();
      for (let i = 0; i < rings.length; i++) {
        const pts = rings[i];
        let pen = false;
        for (let k = 0; k < pts.length; k++) {
          const p = proj(pts[k][0], pts[k][1]);
          if (p[2] > 0) { pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; }
          else pen = false;
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.stroke();
    }

    // graticule (lat/long wireframe)
    ctx.beginPath();
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = [];
      for (let lon = -180; lon <= 180; lon += 6) r.push([lon, lat]);
      traceRing(r, proj);
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const r = [];
      for (let lat = -90; lat <= 90; lat += 6) r.push([lon, lat]);
      traceRing(r, proj);
    }
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = rgba(GOLD, 0.16);
    ctx.stroke();

    // pulsing capital markers
    const now = performance.now();
    for (let i = 0; i < MARKERS.length; i++) {
      const p = proj(MARKERS[i][0], MARKERS[i][1]);
      if (p[2] <= 0.02) continue;
      const pulse = 0.55 + 0.45 * Math.sin(now / 600 + i);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.4, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p[0], p[1], 7 + 5 * pulse, 0, TAU);
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(GOLD, 0.25 * pulse * p[2]);
      ctx.stroke();
    }
  }

  /* ---------------- run loop ---------------- */
  let io = null;

  function start() {
    if (wired) return;
    wired = true;
    loadEarth();

    if (io) io.disconnect();
    io = new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; });
    io.observe(el);
    onScreen = true;

    paint(); // always land one frame

    let last = 0;
    const loop = (t) => {
      requestAnimationFrame(loop);
      if (document.hidden || !onScreen) { last = 0; return; }
      if (t - last < 32) return;             // ~30fps cap
      const dt = last ? Math.min(80, t - last) : 16;
      last = t;
      if (!reduce) rot += SPEED * dt;        // the reference spin pace
      paint();
    };
    requestAnimationFrame(loop);
  }

  // only run while Home is the active view
  const probe = () => {
    if (homeView.classList.contains("active")) start();
    else if (io) { io.disconnect(); io = null; wired = false; onScreen = false; }
  };
  new MutationObserver(probe).observe(homeView, { attributes: true, attributeFilter: ["class"] });
  probe();
})();
