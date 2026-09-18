/*!
 * brand-x.js — Geometric 3D "X" background for the local clone.
 *
 * Replaces the original voxel/rubiks background with an extruded, bevelled 3D
 * version of the brand X mark. Pure WebGL (no dependencies, works offline).
 *
 * Draws into .rubiks-canvas, which it finds and mounts itself on DOM ready.
 * Also exposed as window.__createBrandXExperience({ container }) -> { destroy() }
 * for anything that wants a second instance.
 *
 * Interaction
 *   - page scroll  : plays a keyframed camera track (see SHOTS) - the mark is
 *                    looked down on, swung under, thrown far back and pulled in
 *                    past 3x, always parked clear of that section's copy
 *   - pointer move : nudges the orbit yaw/pitch, so the angle follows the mouse
 *   - pointer over : the camera pushes in a little closer
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Brand geometry & colours (traced from the supplied logo artwork)
   * ------------------------------------------------------------------ */

  // Outline of the X mark, in logo pixel space (y grows downwards).
  var OUTLINE = [
    [0, 0], [37, 0], [61, 37.5], [84, 0], [121, 0], [91.5, 49], [121, 100],
    [84, 100], [54, 49.5], [30.5, 50], [49.5, 82], [41, 100], [0, 100], [29.5, 49]
  ];

  // Outline indices of the two seam vertices: the diagonal between them cuts
  // the mark into its violet (left) and cyan (right) halves.
  var SEAM_IDX_A = 2;  // [61, 37.5]
  var SEAM_IDX_B = 8;  // [54, 49.5]

  // Which half of the mark each outline vertex / edge belongs to
  // (0 = violet arm pair, 1 = cyan arm pair). Edge i runs vertex i -> i+1.
  var VERT_SIDE = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  var EDGE_SIDE = [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];

  var LOGO_W = 121, LOGO_H = 100;
  var CX = LOGO_W / 2, CY = LOGO_H / 2, NORM = LOGO_H / 2;

  // Key colours, linear-ish sRGB values taken from the logo gradients.
  var C_VIOLET_TOP = [0.831, 0.435, 1.000]; // #D46FFF
  var C_VIOLET_BOT = [0.416, 0.306, 1.000]; // #6A4EFF
  var C_CYAN_TOP = [0.161, 0.800, 1.000]; // #29CCFF
  var C_CYAN_BOT = [0.184, 0.612, 0.843]; // #2F9CD7

  var DEPTH = 0.42;   // extrusion depth in normalised units
  var BEVEL = 0.055;  // bevel inset

  /* Scroll choreography ------------------------------------------------ *
   * One keyframe per "shot". `t` is page-scroll progress (0 = top, 1 = bottom).
   *   yaw / pitch : camera orbit, radians
   *   dist        : camera distance
   *   ox / oy     : where the mark sits on screen, in half-viewports
   *                 (ox +1 = right edge, oy +1 = top edge)
   *   scale       : size multiplier on the fitted base size
   *   roll        : extra Z roll of the mark
   *   dim         : brightness, lowered when the mark is huge so text stays readable
   * ------------------------------------------------------------------- */
  var SHOTS = [
    // t values line up with this page's sections (hero through community); the
    // track ends at the footer, so the mark keeps moving behind the translucent
    // panels instead of freezing once the story area is over.
    { t: 0.000, yaw: -0.30, pitch: 0.10, dist: 7.6, ox: 0.00, oy: 0.00, scale: 1.00, roll: 0.00, dim: 1.00 },
    { t: 0.090, yaw: 0.35, pitch: 0.32, dist: 6.8, ox: 0.18, oy: -0.10, scale: 1.20, roll: -0.10, dim: 0.95 },
    // looking down on it from the upper right
    { t: 0.173, yaw: 0.95, pitch: 0.50, dist: 7.0, ox: 0.34, oy: -0.24, scale: 1.45, roll: -0.20, dim: 0.85 },
    // swung underneath, seen from the lower left
    { t: 0.259, yaw: -1.10, pitch: -0.46, dist: 5.6, ox: -0.42, oy: 0.12, scale: 1.60, roll: 0.26, dim: 0.88 },
    // pulled right in close: better than 3x, parked clear of the copy
    { t: 0.346, yaw: -0.35, pitch: 0.16, dist: 3.2, ox: -0.28, oy: -0.02, scale: 3.05, roll: 0.05, dim: 0.52 },
    { t: 0.432, yaw: 1.40, pitch: -0.34, dist: 6.0, ox: 0.44, oy: 0.12, scale: 1.55, roll: -0.30, dim: 0.85 },
    // behind the project cards
    { t: 0.518, yaw: -0.55, pitch: 0.30, dist: 7.4, ox: 0.00, oy: 0.06, scale: 1.30, roll: 0.10, dim: 0.92 },
    // from here down the panels veil it, so it can run large and bright
    { t: 0.605, yaw: 1.70, pitch: 0.55, dist: 6.2, ox: 0.30, oy: -0.10, scale: 1.70, roll: -0.22, dim: 1.00 },
    { t: 0.691, yaw: -2.10, pitch: -0.40, dist: 5.4, ox: -0.34, oy: 0.10, scale: 1.90, roll: 0.30, dim: 1.00 },
    { t: 0.783, yaw: 0.80, pitch: 0.62, dist: 4.6, ox: 0.36, oy: -0.08, scale: 2.20, roll: -0.16, dim: 1.00 },
    { t: 0.838, yaw: -0.90, pitch: -0.25, dist: 6.6, ox: -0.30, oy: 0.14, scale: 1.60, roll: 0.20, dim: 1.00 },
    { t: 0.919, yaw: 2.40, pitch: 0.35, dist: 5.0, ox: 0.28, oy: -0.06, scale: 2.00, roll: -0.28, dim: 1.00 },
    { t: 0.988, yaw: -1.55, pitch: 0.18, dist: 6.8, ox: -0.22, oy: 0.08, scale: 1.55, roll: 0.14, dim: 1.00 },
    { t: 1.000, yaw: -1.70, pitch: 0.15, dist: 7.4, ox: 0.00, oy: 0.00, scale: 1.30, roll: 0.00, dim: 1.00 }
  ];

  var SHOT_KEYS = ['yaw', 'pitch', 'dist', 'ox', 'oy', 'scale', 'roll', 'dim'];

  function smoothstep(x) { return x * x * (3 - 2 * x); }

  // Sample the shot track at progress p into `out`.
  function sampleShots(out, p) {
    var n = SHOTS.length, i = 0;
    while (i < n - 2 && p > SHOTS[i + 1].t) i++;
    var a = SHOTS[i], b = SHOTS[i + 1];
    var span = Math.max(b.t - a.t, 1e-4);
    var k = smoothstep(Math.min(1, Math.max(0, (p - a.t) / span)));
    for (var j = 0; j < SHOT_KEYS.length; j++) {
      var key = SHOT_KEYS[j];
      out[key] = a[key] + (b[key] - a[key]) * k;
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Small maths helpers
   * ------------------------------------------------------------------ */

  function mat4() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  function perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }

  function lookAt(out, eye, center, up) {
    var z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    var len = Math.hypot(z0, z1, z2) || 1;
    z0 /= len; z1 /= len; z2 /= len;
    var x0 = up[1] * z2 - up[2] * z1, x1 = up[2] * z0 - up[0] * z2, x2 = up[0] * z1 - up[1] * z0;
    len = Math.hypot(x0, x1, x2) || 1;
    x0 /= len; x1 /= len; x2 /= len;
    var y0 = z1 * x2 - z2 * x1, y1 = z2 * x0 - z0 * x2, y2 = z0 * x1 - z1 * x0;
    out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
    out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
    out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out[15] = 1;
    return out;
  }

  function multiply(out, a, b) {
    for (var c = 0; c < 4; c++) {
      var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4] = b0 * a[0] + b1 * a[4] + b2 * a[8] + b3 * a[12];
      out[c * 4 + 1] = b0 * a[1] + b1 * a[5] + b2 * a[9] + b3 * a[13];
      out[c * 4 + 2] = b0 * a[2] + b1 * a[6] + b2 * a[10] + b3 * a[14];
      out[c * 4 + 3] = b0 * a[3] + b1 * a[7] + b2 * a[11] + b3 * a[15];
    }
    return out;
  }

  // Model matrix from position, per-axis rotation (YXZ) and uniform scale.
  function composeModel(out, px, py, pz, rx, ry, rz, s) {
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var cz = Math.cos(rz), sz = Math.sin(rz);
    // R = Ry * Rx * Rz
    var m00 = cy * cz + sy * sx * sz, m01 = cx * sz, m02 = -sy * cz + cy * sx * sz;
    var m10 = -cy * sz + sy * sx * cz, m11 = cx * cz, m12 = sy * sz + cy * sx * cz;
    var m20 = sy * cx, m21 = -sx, m22 = cy * cx;
    out[0] = m00 * s; out[1] = m10 * s; out[2] = m20 * s; out[3] = 0;
    out[4] = m01 * s; out[5] = m11 * s; out[6] = m21 * s; out[7] = 0;
    out[8] = m02 * s; out[9] = m12 * s; out[10] = m22 * s; out[11] = 0;
    out[12] = px; out[13] = py; out[14] = pz; out[15] = 1;
    return out;
  }

  // Inverse-transpose of the upper 3x3 — good enough here (uniform scale).
  function normalMatrix(out, m) {
    out[0] = m[0]; out[1] = m[1]; out[2] = m[2];
    out[3] = m[4]; out[4] = m[5]; out[5] = m[6];
    out[6] = m[8]; out[7] = m[9]; out[8] = m[10];
    var s = Math.hypot(out[0], out[1], out[2]) || 1;
    for (var i = 0; i < 9; i++) out[i] /= s;
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Polygon helpers: offsetting + ear-clipping triangulation
   * ------------------------------------------------------------------ */

  function signedArea(p) {
    var a = 0;
    for (var i = 0, n = p.length; i < n; i++) {
      var q = p[(i + 1) % n];
      a += p[i][0] * q[1] - q[0] * p[i][1];
    }
    return a / 2;
  }

  // Inset a simple polygon by `d` along its mitred vertex normals.
  function insetPolygon(poly, d) {
    var n = poly.length, out = [];
    for (var i = 0; i < n; i++) {
      var prev = poly[(i - 1 + n) % n], cur = poly[i], next = poly[(i + 1) % n];
      var e1x = cur[0] - prev[0], e1y = cur[1] - prev[1];
      var e2x = next[0] - cur[0], e2y = next[1] - cur[1];
      var l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1;
      // Inward normals for a CCW polygon (y-up space).
      var n1x = -e1y / l1, n1y = e1x / l1;
      var n2x = -e2y / l2, n2y = e2x / l2;
      var bx = n1x + n2x, by = n1y + n2y;
      var bl = Math.hypot(bx, by);
      if (bl < 1e-6) { out.push([cur[0] + n1x * d, cur[1] + n1y * d]); continue; }
      bx /= bl; by /= bl;
      var cos = bx * n1x + by * n1y;
      var miter = Math.min(1 / Math.max(cos, 0.30), 2.4);
      // Never travel more than part-way to the nearest non-adjacent edge,
      // otherwise thin arms fold over themselves when inset.
      var room = 0.45 * nearestEdgeDistance(poly, i);
      var t = Math.min(d * miter, room);
      out.push([cur[0] + bx * t, cur[1] + by * t]);
    }
    return out;
  }

  function distToSegment(p, a, b) {
    var vx = b[0] - a[0], vy = b[1] - a[1];
    var wx = p[0] - a[0], wy = p[1] - a[1];
    var len2 = vx * vx + vy * vy;
    var t = len2 > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0;
    return Math.hypot(wx - vx * t, wy - vy * t);
  }

  function nearestEdgeDistance(poly, i) {
    var n = poly.length, best = Infinity, p = poly[i];
    for (var j = 0; j < n; j++) {
      if (j === i || (j + 1) % n === i) continue; // skip the two edges at p
      best = Math.min(best, distToSegment(p, poly[j], poly[(j + 1) % n]));
    }
    return best;
  }

  function segmentsCross(a, b, c, d) {
    function side(p, q, r) {
      return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    }
    var d1 = side(a, b, c), d2 = side(a, b, d);
    var d3 = side(c, d, a), d4 = side(c, d, b);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  }

  // A thin arm can collapse when inset; reject those so we never triangulate
  // a self-overlapping ring (which shows up as z-fighting speckle).
  function isSimple(poly) {
    var n = poly.length;
    if (signedArea(poly) <= 0) return false;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        if (j === i || (j + 1) % n === i || (i + 1) % n === j) continue;
        if (segmentsCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return false;
      }
    }
    return true;
  }

  // Largest bevel (up to `want`) that keeps the inset ring simple.
  function safeInset(poly, want) {
    var d = want;
    for (var i = 0; i < 9; i++) {
      var ring = insetPolygon(poly, d);
      if (isSimple(ring)) return { ring: ring, bevel: d };
      d *= 0.62;
    }
    return { ring: poly.slice(), bevel: 0 };
  }

  // Cut a ring into the two closed sub-rings either side of the a-b diagonal.
  function splitRing(ring, a, b) {
    var n = ring.length, one = [], two = [], i;
    for (i = a; ; i = (i + 1) % n) { one.push(i); if (i === b) break; }
    for (i = b; ; i = (i + 1) % n) { two.push(i); if (i === a) break; }
    return [one, two];
  }

  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    var d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    var d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    var d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    var neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    var pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(neg && pos);
  }

  // Ear clipping for a simple CCW polygon; returns index triplets.
  function triangulate(poly) {
    var n = poly.length, idx = [], tris = [], i;
    for (i = 0; i < n; i++) idx.push(i);
    var guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      var clipped = false;
      for (i = 0; i < idx.length; i++) {
        var ia = idx[(i - 1 + idx.length) % idx.length];
        var ib = idx[i];
        var ic = idx[(i + 1) % idx.length];
        var a = poly[ia], b = poly[ib], c = poly[ic];
        var cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (cross <= 1e-9) continue; // reflex or degenerate
        var ok = true;
        for (var j = 0; j < idx.length; j++) {
          var ip = idx[j];
          if (ip === ia || ip === ib || ip === ic) continue;
          var p = poly[ip];
          if (pointInTriangle(p[0], p[1], a[0], a[1], b[0], b[1], c[0], c[1])) { ok = false; break; }
        }
        if (!ok) continue;
        tris.push(ia, ib, ic);
        idx.splice(i, 1);
        clipped = true;
        break;
      }
      if (!clipped) break;
    }
    if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
    return tris;
  }

  /* ------------------------------------------------------------------ *
   * Mesh construction: bevelled extrusion of the X outline
   * ------------------------------------------------------------------ */

  function toModelSpace(p) {
    // Logo pixels -> centred, y-up, height 2 units.
    return [(p[0] - CX) / NORM, -(p[1] - CY) / NORM];
  }

  function buildMesh() {
    var base = OUTLINE.map(toModelSpace);
    var vSide = VERT_SIDE.slice();
    var eSide = EDGE_SIDE.slice();
    if (signedArea(base) < 0) {
      // Flip to CCW and keep the side tables aligned with the new indices.
      var m = base.length;
      base.reverse();
      var vr = [], er = [];
      for (var q = 0; q < m; q++) {
        vr.push(VERT_SIDE[m - 1 - q]);
        er.push(EDGE_SIDE[(m - 2 - q + m) % m]);
      }
      vSide = vr; eSide = er;
    }

    var fit = safeInset(base, BEVEL);
    var inner = fit.ring;
    var bevel = fit.bevel;

    // Split the cap ring along the logo seam so each triangle is wholly violet
    // or wholly cyan — no interpolated colour boundary inside a triangle.
    var ia = base.length - 1 - SEAM_IDX_A;
    var ib = base.length - 1 - SEAM_IDX_B;
    if (signedArea(OUTLINE.map(toModelSpace)) >= 0) { ia = SEAM_IDX_A; ib = SEAM_IDX_B; }
    var arcs = splitRing(inner, ia, ib);
    var pieces = [];
    for (var ai = 0; ai < arcs.length; ai++) {
      var arcIdx = arcs[ai];
      var ringPts = [];
      for (var q = 0; q < arcIdx.length; q++) ringPts.push(inner[arcIdx[q]]);
      // a vertex strictly inside the arc tells us which half this piece is
      var probe = arcIdx[Math.floor(arcIdx.length / 2)];
      pieces.push({ idx: arcIdx, pts: ringPts, side: vSide[probe] });
    }

    var pos = [], nrm = [], attr = []; // attr = [u, v, seamSide, bevelTag]
    var n = base.length;

    function push(p, z, nx, ny, nz, faceTag, side) {
      pos.push(p[0], p[1], z);
      nrm.push(nx, ny, nz);
      var u = (p[0] * NORM + CX) / LOGO_W;
      var v = (p[1] * NORM + CY) / LOGO_H;
      attr.push(u, v, side, faceTag);
    }

    var hz = DEPTH / 2;

    // Front and back caps (inset face of the bevel).
    for (var pi = 0; pi < pieces.length; pi++) {
      var pts = pieces[pi].pts, ps = pieces[pi].side;
      var ptris = triangulate(pts);
      for (var t = 0; t < ptris.length; t += 3) {
        var a = pts[ptris[t]], b = pts[ptris[t + 1]], c = pts[ptris[t + 2]];
        push(a, hz, 0, 0, 1, 0, ps); push(b, hz, 0, 0, 1, 0, ps); push(c, hz, 0, 0, 1, 0, ps);
        push(a, -hz, 0, 0, -1, 0, ps); push(c, -hz, 0, 0, -1, 0, ps); push(b, -hz, 0, 0, -1, 0, ps);
      }
    }

    var bz = bevel > 0 ? hz - bevel * 0.9 : hz;

    for (var i = 0; i < n; i++) {
      var o0 = base[i], o1 = base[(i + 1) % n];
      var i0 = inner[i], i1 = inner[(i + 1) % n];
      var ex = o1[0] - o0[0], ey = o1[1] - o0[1];
      var el = Math.hypot(ex, ey) || 1;
      var sx = ey / el, sy = -ex / el; // outward normal (CCW -> outward is right)
      var es = eSide[i];

      // Side wall.
      push(o0, bz, sx, sy, 0, 0, es); push(o0, -bz, sx, sy, 0, 0, es); push(o1, -bz, sx, sy, 0, 0, es);
      push(o0, bz, sx, sy, 0, 0, es); push(o1, -bz, sx, sy, 0, 0, es); push(o1, bz, sx, sy, 0, 0, es);

      if (bevel <= 0) continue;

      // Front bevel strip.
      var fx = sx * 0.62, fy = sy * 0.62, fz = 0.78;
      push(o0, bz, fx, fy, fz, 1, es); push(i1, hz, fx, fy, fz, 1, es); push(i0, hz, fx, fy, fz, 1, es);
      push(o0, bz, fx, fy, fz, 1, es); push(o1, bz, fx, fy, fz, 1, es); push(i1, hz, fx, fy, fz, 1, es);

      // Back bevel strip.
      push(o0, -bz, fx, fy, -fz, 1, es); push(i0, -hz, fx, fy, -fz, 1, es); push(i1, -hz, fx, fy, -fz, 1, es);
      push(o0, -bz, fx, fy, -fz, 1, es); push(i1, -hz, fx, fy, -fz, 1, es); push(o1, -bz, fx, fy, -fz, 1, es);
    }

    // Outline wireframe (front + back rings of the bevel).
    var line = [];
    for (var k = 0; k < n; k++) {
      var p0 = base[k], p1 = base[(k + 1) % n];
      line.push(p0[0], p0[1], bz, p1[0], p1[1], bz);
      line.push(p0[0], p0[1], -bz, p1[0], p1[1], -bz);
      line.push(p0[0], p0[1], bz, p0[0], p0[1], -bz);
    }

    return {
      position: new Float32Array(pos),
      normal: new Float32Array(nrm),
      attr: new Float32Array(attr),
      count: pos.length / 3,
      line: new Float32Array(line),
      lineCount: line.length / 3
    };
  }

  /* ------------------------------------------------------------------ *
   * Shaders
   * ------------------------------------------------------------------ */

  var VERT = [
    'attribute vec3 aPos;',
    'attribute vec3 aNormal;',
    'attribute vec4 aAttr;',
    'uniform mat4 uProj;',
    'uniform mat4 uView;',
    'uniform mat4 uModel;',
    'uniform mat3 uNormalMat;',
    'varying vec3 vNormal;',
    'varying vec3 vWorld;',
    'varying vec4 vAttr;',
    'void main(){',
    '  vec4 world = uModel * vec4(aPos, 1.0);',
    '  vWorld = world.xyz;',
    '  vNormal = uNormalMat * aNormal;',
    '  vAttr = aAttr;',
    '  gl_Position = uProj * uView * world;',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'varying vec3 vNormal;',
    'varying vec3 vWorld;',
    'varying vec4 vAttr;',
    'uniform vec3 uEye;',
    'uniform vec3 uVioletTop;',
    'uniform vec3 uVioletBot;',
    'uniform vec3 uCyanTop;',
    'uniform vec3 uCyanBot;',
    'uniform float uAlpha;',
    'uniform float uGlow;',
    'uniform float uDim;',
    'uniform vec3 uFog;',
    'uniform float uFogNear;',
    'uniform float uFogFar;',
    'void main(){',
    '  float side = step(0.5, vAttr.z);',   // 0 = violet half, 1 = cyan half
    '  float bevel = clamp(vAttr.w, 0.0, 1.0);',
    '  vec3 top = mix(uVioletTop, uCyanTop, side);',
    '  vec3 bot = mix(uVioletBot, uCyanBot, side);',
    '  vec3 base = mix(bot, top, clamp(vAttr.y, 0.0, 1.0));',
    '  vec3 N = normalize(vNormal);',
    '  vec3 V = normalize(uEye - vWorld);',
    '  vec3 L1 = normalize(vec3(-0.45, 0.85, 0.75));',
    '  vec3 L2 = normalize(vec3(0.85, -0.25, 0.35));',
    '  float key = max(dot(N, L1), 0.0);',
    '  float fill = max(dot(N, L2), 0.0);',
    '  vec3 H = normalize(L1 + V);',
    '  float spec = pow(max(dot(N, H), 0.0), 44.0);',
    '  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
    '  vec3 col = base * (0.30 + 0.92 * key);',
    '  col += base * fill * 0.26;',
    '  col += vec3(0.62, 0.86, 1.0) * spec * 0.55;',
    '  col += mix(vec3(0.72, 0.45, 1.0), vec3(0.28, 0.85, 1.0), side) * fres * (0.42 + uGlow);',
    '  col *= mix(1.0, 1.12, bevel);',  // bevel catches a touch more light
    '  col *= uDim;',
    '  float d = length(uEye - vWorld);',
    '  float fog = clamp((d - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);',
    '  col = mix(col, uFog, fog * 0.92);',
    '  gl_FragColor = vec4(col, uAlpha);',
    '}'
  ].join('\n');

  var BG_VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var BG_FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uScroll;',
    'float hash21(vec2 p){',
    '  p = fract(p * vec2(123.34, 456.21));',
    '  p += dot(p, p + 45.32);',
    '  return fract(p.x * p.y);',
    '}',
    // one layer of twinkling specks
    'float glitter(vec2 p, float scale, float thresh, float size){',
    '  vec2 g = p * scale;',
    '  vec2 id = floor(g);',
    '  vec2 f = fract(g) - 0.5;',
    '  float h = hash21(id);',
    '  float on = step(thresh, h);',
    '  vec2 off = (vec2(hash21(id + 1.7), hash21(id + 9.1)) - 0.5) * 0.76;',
    '  float d = length(f - off);',
    '  float tw = 0.45 + 0.55 * sin(uTime * (0.9 + 2.6 * h) + h * 41.0);',
    '  float core = smoothstep(size, 0.0, d);',
    '  float halo = smoothstep(size * 4.5, 0.0, d) * 0.28;',
    '  return on * max(tw, 0.0) * (core + halo);',
    '}',
    'void main(){',
    '  vec2 uv = vUv;',
    '  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);',
    '  float r = length(p);',
    // near-black ground with the faintest brand wash
    '  vec3 col = vec3(0.005, 0.004, 0.012);',
    '  col += vec3(0.26, 0.13, 0.58) * exp(-3.4 * length(p - vec2(-0.46, 0.26))) * 0.13;',
    '  col += vec3(0.05, 0.36, 0.64) * exp(-3.4 * length(p - vec2(0.50, -0.24))) * 0.12;',
    // glitter: three densities, drifting slowly with scroll
    '  vec2 q = p + vec2(uScroll * 0.55, -uScroll * 1.15);',
    '  float g1 = glitter(q, 22.0, 0.885, 0.030);',
    '  float g2 = glitter(q * 1.9 + 31.4, 34.0, 0.915, 0.022);',
    '  float g3 = glitter(q * 0.62 - 12.7, 13.0, 0.945, 0.042);',
    '  vec3 warm = vec3(0.80, 0.55, 1.00);',
    '  vec3 cool = vec3(0.30, 0.86, 1.00);',
    '  col += mix(warm, cool, clamp(uv.x * 1.15 - 0.08, 0.0, 1.0)) * (g1 * 0.78 + g2 * 0.58);',
    '  col += vec3(1.0, 0.98, 1.0) * g3 * 0.60;',
    '  col *= smoothstep(1.45, 0.20, r) * 0.80 + 0.20;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ *
   * GL helpers
   * ------------------------------------------------------------------ */

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[brand-x] shader error:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function program(gl, vs, fs) {
    var v = compile(gl, gl.VERTEX_SHADER, vs);
    var f = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[brand-x] link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function buffer(gl, data) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }

  /* ------------------------------------------------------------------ *
   * Experience
   * ------------------------------------------------------------------ */

  function createExperience(options) {
    options = options || {};
    var container = options.container;
    if (!container) return { destroy: function () {} };

    var canvas = document.createElement('canvas');
    canvas.className = 'brand-x-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
      || canvas.getContext('experimental-webgl', { antialias: true, alpha: false });

    if (!gl) {
      // No WebGL: fall back to a flat brand gradient so the hero still reads.
      canvas.remove();
      container.classList.add('brand-x-fallback');
      return {
        destroy: function () { container.classList.remove('brand-x-fallback'); }
      };
    }

    var mesh = buildMesh();

    var prog = program(gl, VERT, FRAG);
    var bgProg = program(gl, BG_VERT, BG_FRAG);
    if (!prog || !bgProg) { canvas.remove(); return { destroy: function () {} }; }

    var loc = {
      aPos: gl.getAttribLocation(prog, 'aPos'),
      aNormal: gl.getAttribLocation(prog, 'aNormal'),
      aAttr: gl.getAttribLocation(prog, 'aAttr'),
      uProj: gl.getUniformLocation(prog, 'uProj'),
      uView: gl.getUniformLocation(prog, 'uView'),
      uModel: gl.getUniformLocation(prog, 'uModel'),
      uNormalMat: gl.getUniformLocation(prog, 'uNormalMat'),
      uEye: gl.getUniformLocation(prog, 'uEye'),
      uVioletTop: gl.getUniformLocation(prog, 'uVioletTop'),
      uVioletBot: gl.getUniformLocation(prog, 'uVioletBot'),
      uCyanTop: gl.getUniformLocation(prog, 'uCyanTop'),
      uCyanBot: gl.getUniformLocation(prog, 'uCyanBot'),
      uAlpha: gl.getUniformLocation(prog, 'uAlpha'),
      uGlow: gl.getUniformLocation(prog, 'uGlow'),
      uDim: gl.getUniformLocation(prog, 'uDim'),
      uFog: gl.getUniformLocation(prog, 'uFog'),
      uFogNear: gl.getUniformLocation(prog, 'uFogNear'),
      uFogFar: gl.getUniformLocation(prog, 'uFogFar')
    };
    var bgLoc = {
      aPos: gl.getAttribLocation(bgProg, 'aPos'),
      uRes: gl.getUniformLocation(bgProg, 'uRes'),
      uTime: gl.getUniformLocation(bgProg, 'uTime'),
      uScroll: gl.getUniformLocation(bgProg, 'uScroll')
    };

    var bufPos = buffer(gl, mesh.position);
    var bufNrm = buffer(gl, mesh.normal);
    var bufAttr = buffer(gl, mesh.attr);
    var bufLine = buffer(gl, mesh.line);
    var bufQuad = buffer(gl, new Float32Array([-1, -1, 3, -1, -1, 3]));

    // Satellite marks drifting behind the hero.
    var SAT = [];
    (function seed() {
      var rnd = (function (s) {
        return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
      })(20260915);
      for (var i = 0; i < 22; i++) {
        var ang = rnd() * Math.PI * 2;
        var rad = 3.6 + rnd() * 6.2;
        SAT.push({
          x: Math.cos(ang) * rad * 1.35,
          y: (rnd() - 0.5) * 8.5,
          z: -3.5 - rnd() * 14,
          rx: rnd() * Math.PI, ry: rnd() * Math.PI, rz: rnd() * Math.PI,
          sx: 0.07 + rnd() * 0.11, sy: 0.05 + rnd() * 0.13, sz: 0.04 + rnd() * 0.09,
          s: 0.16 + rnd() * 0.42,
          a: 0.16 + rnd() * 0.34
        });
      }
    })();

    /* ---------------- state ---------------- */

    var proj = mat4(), view = mat4(), model = mat4(), nmat = new Float32Array(9);
    var shot = sampleShots({}, 0);
    var dpr = 1, vw = 1, vh = 1;
    var time = 0, last = performance.now();
    var running = true, visible = true, raf = 0;

    var scrollTarget = 0, scroll = 0;
    var pointerTX = 0, pointerTY = 0, pointerX = 0, pointerY = 0;
    var hoverTarget = 0, hover = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = container.getBoundingClientRect();
      vw = Math.max(1, Math.round((r.width || window.innerWidth)));
      vh = Math.max(1, Math.round((r.height || window.innerHeight)));
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    // Progress runs from the top of the page to the top of the footer: the
    // sections above the footer are translucent, so the mark keeps moving
    // behind them instead of freezing once the story area ends.
    function trackLength() {
      var doc = document.documentElement.scrollHeight;
      var footer = document.querySelector('.footer-main');
      var end = footer ? footer.getBoundingClientRect().top + window.scrollY : doc;
      return (end - window.innerHeight * 0.45) || 1;
    }

    function onScroll() {
      var max = trackLength();
      if (!(max > 1)) max = 1;
      scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
    }

    function onPointer(e) {
      pointerTX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTY = (e.clientY / window.innerHeight) * 2 - 1;
      // "Hovering the mark" = pointer near the centre of the viewport.
      var d = Math.hypot(pointerTX, pointerTY * 1.25);
      hoverTarget = Math.max(0, 1 - d / 0.85);
    }

    function onLeave() { hoverTarget = 0; pointerTX = 0; pointerTY = 0; }

    function onVisibility() { visible = !document.hidden; }

    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerleave', onLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    onScroll();
    scroll = scrollTarget;

    /* ---------------- draw ---------------- */

    var fogColor = [0.006, 0.005, 0.015];

    function drawMark(m, alpha, glow, dim, lines) {
      normalMatrix(nmat, m);
      gl.uniformMatrix4fv(loc.uModel, false, m);
      gl.uniformMatrix3fv(loc.uNormalMat, false, nmat);
      gl.uniform1f(loc.uAlpha, alpha);
      gl.uniform1f(loc.uGlow, glow);
      gl.uniform1f(loc.uDim, dim);

      gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
      gl.enableVertexAttribArray(loc.aPos);
      gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufNrm);
      gl.enableVertexAttribArray(loc.aNormal);
      gl.vertexAttribPointer(loc.aNormal, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufAttr);
      gl.enableVertexAttribArray(loc.aAttr);
      gl.vertexAttribPointer(loc.aAttr, 4, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count);

      if (lines) {
        gl.uniform1f(loc.uAlpha, alpha * 0.5);
        gl.uniform1f(loc.uGlow, 1.6);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufLine);
        gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(loc.aNormal);
        gl.vertexAttrib3f(loc.aNormal, 0, 0, 1);
        gl.disableVertexAttribArray(loc.aAttr);
        gl.vertexAttrib4f(loc.aAttr, 0.5, 0.6, 0.0, 0.0);
        gl.drawArrays(gl.LINES, 0, mesh.lineCount);
      }
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      time += dt;

      // Eased interaction state.
      var ease = 1 - Math.pow(0.001, dt);
      scroll += (scrollTarget - scroll) * ease * 0.55;
      pointerX += (pointerTX - pointerX) * ease * 0.85;
      pointerY += (pointerTY - pointerY) * ease * 0.85;
      hover += (hoverTarget - hover) * ease * 0.75;

      var spin = reduceMotion ? 0 : time * 0.14;

      sampleShots(shot, scroll);

      // Camera orbit: the scroll track sets the shot, the pointer nudges it.
      var yaw = shot.yaw + pointerX * 0.45;
      var pitch = Math.max(-1.35, Math.min(1.35, shot.pitch - pointerY * 0.38));
      var dist = Math.max(1.6, shot.dist - hover * 0.5);
      var eye = [
        Math.sin(yaw) * Math.cos(pitch) * dist,
        Math.sin(pitch) * dist,
        Math.cos(yaw) * Math.cos(pitch) * dist
      ];

      var fov = 42 * Math.PI / 180;
      perspective(proj, fov, vw / vh, 0.1, 60);

      // Keep the mark inside the viewport on narrow/short screens.
      var visH = 2 * dist * Math.tan(fov / 2);
      var visW = visH * (vw / vh);
      var fit = Math.min(visW / 4.4, visH / 4.5, 1.35);

      // Screen-space placement: offsets applied along the camera's own axes,
      // so a shot can park the mark at the right edge whatever the orbit angle.
      var fwdX = -eye[0], fwdY = -eye[1], fwdZ = -eye[2];
      var fl = Math.hypot(fwdX, fwdY, fwdZ) || 1;
      fwdX /= fl; fwdY /= fl; fwdZ /= fl;
      var rgX = -fwdZ, rgY = 0, rgZ = fwdX;   // right = normalize(fwd x worldUp)
      var rl = Math.hypot(rgX, rgY, rgZ) || 1;
      rgX /= rl; rgY /= rl; rgZ /= rl;
      var upX = rgY * fwdZ - rgZ * fwdY;      // up = right x fwd
      var upY = rgZ * fwdX - rgX * fwdZ;
      var upZ = rgX * fwdY - rgY * fwdX;
      var offW = shot.ox * visW * 0.5;
      var offH = shot.oy * visH * 0.5;
      var heroX = rgX * offW + upX * offH;
      var heroY = rgY * offW + upY * offH;
      var heroZ = rgZ * offW + upZ * offH;
      lookAt(view, eye, [0, 0, 0], [0, 1, 0]);

      gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Background wash.
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(bgProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufQuad);
      gl.enableVertexAttribArray(bgLoc.aPos);
      gl.vertexAttribPointer(bgLoc.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(bgLoc.uRes, canvas.width, canvas.height);
      gl.uniform1f(bgLoc.uTime, time);
      gl.uniform1f(bgLoc.uScroll, scroll);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(bgLoc.aPos);

      // Marks.
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      gl.useProgram(prog);
      gl.uniformMatrix4fv(loc.uProj, false, proj);
      gl.uniformMatrix4fv(loc.uView, false, view);
      gl.uniform3fv(loc.uEye, eye);
      gl.uniform3fv(loc.uVioletTop, C_VIOLET_TOP);
      gl.uniform3fv(loc.uVioletBot, C_VIOLET_BOT);
      gl.uniform3fv(loc.uCyanTop, C_CYAN_TOP);
      gl.uniform3fv(loc.uCyanBot, C_CYAN_BOT);
      gl.uniform3fv(loc.uFog, fogColor);
      gl.uniform1f(loc.uFogNear, 7.0);
      gl.uniform1f(loc.uFogFar, 21.0);

      // Satellites first (far), then the hero.
      gl.uniform1f(loc.uFogNear, 5.5);
      for (var i = 0; i < SAT.length; i++) {
        var s = SAT[i];
        composeModel(
          model,
          s.x + Math.sin(time * 0.12 + i) * 0.22 - pointerX * 0.55,
          s.y + Math.cos(time * 0.1 + i * 1.7) * 0.22 - pointerY * 0.35 + scroll * 1.1,
          s.z,
          s.rx + spin * s.sx * 3.0,
          s.ry + spin * s.sy * 3.0,
          s.rz + spin * s.sz * 3.0,
          s.s * (1 + scroll * 0.22)
        );
        drawMark(model, s.a * 0.9, 0.18, 0.9 * shot.dim, false);
      }

      // Hero mark.
      gl.uniform1f(loc.uFogNear, Math.max(4.0, dist + 3.4));
      var heroScale = fit * shot.scale * (1 + hover * 0.09);
      composeModel(
        model,
        heroX, heroY, heroZ,
        Math.sin(time * 0.21) * 0.07 + pointerY * 0.17,
        Math.sin(time * 0.17) * 0.13 + pointerX * 0.26,
        shot.roll + Math.sin(time * 0.13) * 0.04,
        heroScale
      );
      drawMark(model, 1.0, hover * 0.45, shot.dim, false);
    }

    raf = requestAnimationFrame(frame);

    return {
      canvas: canvas,
      destroy: function () {
        running = false;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        [bufPos, bufNrm, bufAttr, bufLine, bufQuad].forEach(function (b) { gl.deleteBuffer(b); });
        gl.deleteProgram(prog);
        gl.deleteProgram(bgProg);
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        if (canvas.parentElement === container) container.removeChild(canvas);
      },
      // kept for API parity with the original experience object
      storySequence: null,
      cubeRenderer: null,
      gridState: null
    };
  }

  window.__createBrandXExperience = createExperience;

  /* Mount. The Nuxt plugin used to call the factory; with the bundle gone the
     page just starts it itself, once the container is in the document. */
  function mount() {
    var container = document.querySelector('.rubiks-canvas');
    if (!container || container.dataset.brandXMounted === '1') return;
    container.dataset.brandXMounted = '1';
    createExperience({ container: container });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
