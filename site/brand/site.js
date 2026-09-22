/*
 * XIIID 통합 스크립트. 두 HTML 페이지에서 defer로 한 번만 로드합니다.
 * 각 기능은 독립된 IIFE 범위를 유지해 변수 충돌을 방지합니다.
 * 대상 DOM이 없는 기능은 자체적으로 종료합니다.
 */

/* ==========================================================================
 * 1. WebGL 3D 배경 — 지오메트리, 셰이더, 카메라, 이벤트 정리
 * ========================================================================== */
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
  if (!document.querySelector('.rubiks-canvas')) return;
  var OUTLINE = [[0, 0], [37, 0], [61, 37.5], [84, 0], [121, 0], [91.5, 49], [121, 100], [84, 100], [54, 49.5], [30.5, 50], [49.5, 82], [41, 100], [0, 100], [29.5, 49]];

  // Outline indices of the two seam vertices: the diagonal between them cuts
  // the mark into its violet (left) and cyan (right) halves.
  var SEAM_IDX_A = 2; // [61, 37.5]
  var SEAM_IDX_B = 8; // [54, 49.5]

  // Which half of the mark each outline vertex / edge belongs to
  // (0 = violet arm pair, 1 = cyan arm pair). Edge i runs vertex i -> i+1.
  var VERT_SIDE = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
  var EDGE_SIDE = [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
  var LOGO_W = 121,
    LOGO_H = 100;
  var CX = LOGO_W / 2,
    CY = LOGO_H / 2,
    NORM = LOGO_H / 2;

  // Key colours, linear-ish sRGB values taken from the logo gradients.
  var C_VIOLET_TOP = [0.831, 0.435, 1.000]; // #D46FFF
  var C_VIOLET_BOT = [0.416, 0.306, 1.000]; // #6A4EFF
  var C_CYAN_TOP = [0.161, 0.800, 1.000]; // #29CCFF
  var C_CYAN_BOT = [0.184, 0.612, 0.843]; // #2F9CD7

  var DEPTH = 0.42; // extrusion depth in normalised units
  var BEVEL = 0.055; // bevel inset

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
  {
    t: 0.000,
    yaw: -0.30,
    pitch: 0.10,
    dist: 7.6,
    ox: 0.00,
    oy: 0.00,
    scale: 1.00,
    roll: 0.00,
    dim: 1.00
  }, {
    t: 0.090,
    yaw: 0.35,
    pitch: 0.32,
    dist: 6.8,
    ox: 0.18,
    oy: -0.10,
    scale: 1.20,
    roll: -0.10,
    dim: 0.95
  },
  // looking down on it from the upper right
  {
    t: 0.173,
    yaw: 0.95,
    pitch: 0.50,
    dist: 7.0,
    ox: 0.34,
    oy: -0.24,
    scale: 1.45,
    roll: -0.20,
    dim: 0.85
  },
  // swung underneath, seen from the lower left
  {
    t: 0.259,
    yaw: -1.10,
    pitch: -0.46,
    dist: 5.6,
    ox: -0.42,
    oy: 0.12,
    scale: 1.60,
    roll: 0.26,
    dim: 0.88
  },
  // pulled right in close: better than 3x, parked clear of the copy
  {
    t: 0.346,
    yaw: -0.35,
    pitch: 0.16,
    dist: 3.2,
    ox: -0.28,
    oy: -0.02,
    scale: 3.05,
    roll: 0.05,
    dim: 0.52
  }, {
    t: 0.432,
    yaw: 1.40,
    pitch: -0.34,
    dist: 6.0,
    ox: 0.44,
    oy: 0.12,
    scale: 1.55,
    roll: -0.30,
    dim: 0.85
  },
  // behind the project cards
  {
    t: 0.518,
    yaw: -0.55,
    pitch: 0.30,
    dist: 7.4,
    ox: 0.00,
    oy: 0.06,
    scale: 1.30,
    roll: 0.10,
    dim: 0.92
  },
  // from here down the panels veil it, so it can run large and bright
  {
    t: 0.605,
    yaw: 1.70,
    pitch: 0.55,
    dist: 6.2,
    ox: 0.30,
    oy: -0.10,
    scale: 1.70,
    roll: -0.22,
    dim: 1.00
  }, {
    t: 0.691,
    yaw: -2.10,
    pitch: -0.40,
    dist: 5.4,
    ox: -0.34,
    oy: 0.10,
    scale: 1.90,
    roll: 0.30,
    dim: 1.00
  }, {
    t: 0.783,
    yaw: 0.80,
    pitch: 0.62,
    dist: 4.6,
    ox: 0.36,
    oy: -0.08,
    scale: 2.20,
    roll: -0.16,
    dim: 1.00
  }, {
    t: 0.838,
    yaw: -0.90,
    pitch: -0.25,
    dist: 6.6,
    ox: -0.30,
    oy: 0.14,
    scale: 1.60,
    roll: 0.20,
    dim: 1.00
  }, {
    t: 0.919,
    yaw: 2.40,
    pitch: 0.35,
    dist: 5.0,
    ox: 0.28,
    oy: -0.06,
    scale: 2.00,
    roll: -0.28,
    dim: 1.00
  }, {
    t: 0.988,
    yaw: -1.55,
    pitch: 0.18,
    dist: 6.8,
    ox: -0.22,
    oy: 0.08,
    scale: 1.55,
    roll: 0.14,
    dim: 1.00
  }, {
    t: 1.000,
    yaw: -1.70,
    pitch: 0.15,
    dist: 7.4,
    ox: 0.00,
    oy: 0.00,
    scale: 1.30,
    roll: 0.00,
    dim: 1.00
  }];
  var SHOT_KEYS = ['yaw', 'pitch', 'dist', 'ox', 'oy', 'scale', 'roll', 'dim'];
  function smoothstep(x) {
    return x * x * (3 - 2 * x);
  }

  // Sample the shot track at progress p into `out`.
  function sampleShots(out, p) {
    var n = SHOTS.length,
      i = 0;
    while (i < n - 2 && p > SHOTS[i + 1].t) i++;
    var a = SHOTS[i],
      b = SHOTS[i + 1];
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
    var f = 1 / Math.tan(fovy / 2),
      nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = 2 * far * near * nf;
    out[15] = 0;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var z0 = eye[0] - center[0],
      z1 = eye[1] - center[1],
      z2 = eye[2] - center[2];
    var len = Math.hypot(z0, z1, z2) || 1;
    z0 /= len;
    z1 /= len;
    z2 /= len;
    var x0 = up[1] * z2 - up[2] * z1,
      x1 = up[2] * z0 - up[0] * z2,
      x2 = up[0] * z1 - up[1] * z0;
    len = Math.hypot(x0, x1, x2) || 1;
    x0 /= len;
    x1 /= len;
    x2 /= len;
    var y0 = z1 * x2 - z2 * x1,
      y1 = z2 * x0 - z0 * x2,
      y2 = z0 * x1 - z1 * x0;
    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
    out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
    out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
    out[15] = 1;
    return out;
  }
  // Model matrix from position, per-axis rotation (YXZ) and uniform scale.
  function composeModel(out, px, py, pz, rx, ry, rz, s) {
    var cx = Math.cos(rx),
      sx = Math.sin(rx);
    var cy = Math.cos(ry),
      sy = Math.sin(ry);
    var cz = Math.cos(rz),
      sz = Math.sin(rz);
    // R = Ry * Rx * Rz
    var m00 = cy * cz + sy * sx * sz,
      m01 = cx * sz,
      m02 = -sy * cz + cy * sx * sz;
    var m10 = -cy * sz + sy * sx * cz,
      m11 = cx * cz,
      m12 = sy * sz + cy * sx * cz;
    var m20 = sy * cx,
      m21 = -sx,
      m22 = cy * cx;
    out[0] = m00 * s;
    out[1] = m10 * s;
    out[2] = m20 * s;
    out[3] = 0;
    out[4] = m01 * s;
    out[5] = m11 * s;
    out[6] = m21 * s;
    out[7] = 0;
    out[8] = m02 * s;
    out[9] = m12 * s;
    out[10] = m22 * s;
    out[11] = 0;
    out[12] = px;
    out[13] = py;
    out[14] = pz;
    out[15] = 1;
    return out;
  }

  // Inverse-transpose of the upper 3x3 — good enough here (uniform scale).
  function normalMatrix(out, m) {
    out[0] = m[0];
    out[1] = m[1];
    out[2] = m[2];
    out[3] = m[4];
    out[4] = m[5];
    out[5] = m[6];
    out[6] = m[8];
    out[7] = m[9];
    out[8] = m[10];
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
    var n = poly.length,
      out = [];
    for (var i = 0; i < n; i++) {
      var prev = poly[(i - 1 + n) % n],
        cur = poly[i],
        next = poly[(i + 1) % n];
      var e1x = cur[0] - prev[0],
        e1y = cur[1] - prev[1];
      var e2x = next[0] - cur[0],
        e2y = next[1] - cur[1];
      var l1 = Math.hypot(e1x, e1y) || 1,
        l2 = Math.hypot(e2x, e2y) || 1;
      // Inward normals for a CCW polygon (y-up space).
      var n1x = -e1y / l1,
        n1y = e1x / l1;
      var n2x = -e2y / l2,
        n2y = e2x / l2;
      var bx = n1x + n2x,
        by = n1y + n2y;
      var bl = Math.hypot(bx, by);
      if (bl < 1e-6) {
        out.push([cur[0] + n1x * d, cur[1] + n1y * d]);
        continue;
      }
      bx /= bl;
      by /= bl;
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
    var vx = b[0] - a[0],
      vy = b[1] - a[1];
    var wx = p[0] - a[0],
      wy = p[1] - a[1];
    var len2 = vx * vx + vy * vy;
    var t = len2 > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2)) : 0;
    return Math.hypot(wx - vx * t, wy - vy * t);
  }
  function nearestEdgeDistance(poly, i) {
    var n = poly.length,
      best = Infinity,
      p = poly[i];
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
    var d1 = side(a, b, c),
      d2 = side(a, b, d);
    var d3 = side(c, d, a),
      d4 = side(c, d, b);
    return d1 > 0 !== d2 > 0 && d3 > 0 !== d4 > 0;
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
      if (isSimple(ring)) return {
        ring: ring,
        bevel: d
      };
      d *= 0.62;
    }
    return {
      ring: poly.slice(),
      bevel: 0
    };
  }

  // Cut a ring into the two closed sub-rings either side of the a-b diagonal.
  function splitRing(ring, a, b) {
    var n = ring.length,
      one = [],
      two = [],
      i;
    for (i = a;; i = (i + 1) % n) {
      one.push(i);
      if (i === b) break;
    }
    for (i = b;; i = (i + 1) % n) {
      two.push(i);
      if (i === a) break;
    }
    return [one, two];
  }
  function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
    var d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    var d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    var d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    var neg = d1 < 0 || d2 < 0 || d3 < 0;
    var pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }

  // Ear clipping for a simple CCW polygon; returns index triplets.
  function triangulate(poly) {
    var n = poly.length,
      idx = [],
      tris = [],
      i;
    for (i = 0; i < n; i++) idx.push(i);
    var guard = 0;
    while (idx.length > 3 && guard++ < 5000) {
      var clipped = false;
      for (i = 0; i < idx.length; i++) {
        var ia = idx[(i - 1 + idx.length) % idx.length];
        var ib = idx[i];
        var ic = idx[(i + 1) % idx.length];
        var a = poly[ia],
          b = poly[ib],
          c = poly[ic];
        var cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (cross <= 1e-9) continue; // reflex or degenerate
        var ok = true;
        for (var j = 0; j < idx.length; j++) {
          var ip = idx[j];
          if (ip === ia || ip === ib || ip === ic) continue;
          var p = poly[ip];
          if (pointInTriangle(p[0], p[1], a[0], a[1], b[0], b[1], c[0], c[1])) {
            ok = false;
            break;
          }
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
      var vr = [],
        er = [];
      for (var q = 0; q < m; q++) {
        vr.push(VERT_SIDE[m - 1 - q]);
        er.push(EDGE_SIDE[(m - 2 - q + m) % m]);
      }
      vSide = vr;
      eSide = er;
    }
    var fit = safeInset(base, BEVEL);
    var inner = fit.ring;
    var bevel = fit.bevel;

    // Split the cap ring along the logo seam so each triangle is wholly violet
    // or wholly cyan — no interpolated colour boundary inside a triangle.
    var ia = base.length - 1 - SEAM_IDX_A;
    var ib = base.length - 1 - SEAM_IDX_B;
    if (signedArea(OUTLINE.map(toModelSpace)) >= 0) {
      ia = SEAM_IDX_A;
      ib = SEAM_IDX_B;
    }
    var arcs = splitRing(inner, ia, ib);
    var pieces = [];
    for (var ai = 0; ai < arcs.length; ai++) {
      var arcIdx = arcs[ai];
      var ringPts = [];
      for (var q = 0; q < arcIdx.length; q++) ringPts.push(inner[arcIdx[q]]);
      // a vertex strictly inside the arc tells us which half this piece is
      var probe = arcIdx[Math.floor(arcIdx.length / 2)];
      pieces.push({
        idx: arcIdx,
        pts: ringPts,
        side: vSide[probe]
      });
    }
    var pos = [],
      nrm = [],
      attr = []; // attr = [u, v, seamSide, bevelTag]
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
      var pts = pieces[pi].pts,
        ps = pieces[pi].side;
      var ptris = triangulate(pts);
      for (var t = 0; t < ptris.length; t += 3) {
        var a = pts[ptris[t]],
          b = pts[ptris[t + 1]],
          c = pts[ptris[t + 2]];
        push(a, hz, 0, 0, 1, 0, ps);
        push(b, hz, 0, 0, 1, 0, ps);
        push(c, hz, 0, 0, 1, 0, ps);
        push(a, -hz, 0, 0, -1, 0, ps);
        push(c, -hz, 0, 0, -1, 0, ps);
        push(b, -hz, 0, 0, -1, 0, ps);
      }
    }
    var bz = bevel > 0 ? hz - bevel * 0.9 : hz;
    for (var i = 0; i < n; i++) {
      var o0 = base[i],
        o1 = base[(i + 1) % n];
      var i0 = inner[i],
        i1 = inner[(i + 1) % n];
      var ex = o1[0] - o0[0],
        ey = o1[1] - o0[1];
      var el = Math.hypot(ex, ey) || 1;
      var sx = ey / el,
        sy = -ex / el; // outward normal (CCW -> outward is right)
      var es = eSide[i];

      // Side wall.
      push(o0, bz, sx, sy, 0, 0, es);
      push(o0, -bz, sx, sy, 0, 0, es);
      push(o1, -bz, sx, sy, 0, 0, es);
      push(o0, bz, sx, sy, 0, 0, es);
      push(o1, -bz, sx, sy, 0, 0, es);
      push(o1, bz, sx, sy, 0, 0, es);
      if (bevel <= 0) continue;

      // Front bevel strip.
      var fx = sx * 0.62,
        fy = sy * 0.62,
        fz = 0.78;
      push(o0, bz, fx, fy, fz, 1, es);
      push(i1, hz, fx, fy, fz, 1, es);
      push(i0, hz, fx, fy, fz, 1, es);
      push(o0, bz, fx, fy, fz, 1, es);
      push(o1, bz, fx, fy, fz, 1, es);
      push(i1, hz, fx, fy, fz, 1, es);

      // Back bevel strip.
      push(o0, -bz, fx, fy, -fz, 1, es);
      push(i0, -hz, fx, fy, -fz, 1, es);
      push(i1, -hz, fx, fy, -fz, 1, es);
      push(o0, -bz, fx, fy, -fz, 1, es);
      push(i1, -hz, fx, fy, -fz, 1, es);
      push(o1, -bz, fx, fy, -fz, 1, es);
    }

    // Outline wireframe (front + back rings of the bevel).
    var line = [];
    for (var k = 0; k < n; k++) {
      var p0 = base[k],
        p1 = base[(k + 1) % n];
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
    '  float side = step(0.5, vAttr.z);',
    // 0 = violet half, 1 = cyan half
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
    '  col *= mix(1.0, 1.12, bevel);',
    // bevel catches a touch more light
    '  col *= uDim;',
    '  float d = length(uEye - vWorld);',
    '  float fog = clamp((d - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);',
    '  col = mix(col, uFog, fog * 0.92);',
    '  gl_FragColor = vec4(col, uAlpha);',
    '}'
  ].join('\n');
  var BG_VERT = ['attribute vec2 aPos;', 'varying vec2 vUv;', 'void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'].join('\n');
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
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
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
    if (!container) return {
      destroy: function () {}
    };
    var canvas = document.createElement('canvas');
    canvas.className = 'brand-x-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.appendChild(canvas);
    var gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    }) || canvas.getContext('experimental-webgl', {
      antialias: true,
      alpha: false
    });
    if (!gl) {
      // No WebGL: fall back to a flat brand gradient so the hero still reads.
      canvas.remove();
      container.classList.add('brand-x-fallback');
      return {
        destroy: function () {
          container.classList.remove('brand-x-fallback');
        }
      };
    }
    var mesh = buildMesh();
    var prog = program(gl, VERT, FRAG);
    var bgProg = program(gl, BG_VERT, BG_FRAG);
    if (!prog || !bgProg) {
      canvas.remove();
      return {
        destroy: function () {}
      };
    }
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
      var rnd = function (s) {
        return function () {
          s = (s * 1664525 + 1013904223) % 4294967296;
          return s / 4294967296;
        };
      }(20260915);
      for (var i = 0; i < 22; i++) {
        var ang = rnd() * Math.PI * 2;
        var rad = 3.6 + rnd() * 6.2;
        SAT.push({
          x: Math.cos(ang) * rad * 1.35,
          y: (rnd() - 0.5) * 8.5,
          z: -3.5 - rnd() * 14,
          rx: rnd() * Math.PI,
          ry: rnd() * Math.PI,
          rz: rnd() * Math.PI,
          sx: 0.07 + rnd() * 0.11,
          sy: 0.05 + rnd() * 0.13,
          sz: 0.04 + rnd() * 0.09,
          s: 0.16 + rnd() * 0.42,
          a: 0.16 + rnd() * 0.34
        });
      }
    })();

    /* ---------------- state ---------------- */

    var proj = mat4(),
      view = mat4(),
      model = mat4(),
      nmat = new Float32Array(9);
    var shot = sampleShots({}, 0);
    var dpr = 1,
      vw = 1,
      vh = 1;
    var time = 0,
      last = performance.now();
    var running = true,
      visible = true,
      raf = 0;
    var scrollTarget = 0,
      scroll = 0;
    var pointerTX = 0,
      pointerTY = 0,
      pointerX = 0,
      pointerY = 0;
    var hoverTarget = 0,
      hover = 0;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = container.getBoundingClientRect();
      vw = Math.max(1, Math.round(r.width || window.innerWidth));
      vh = Math.max(1, Math.round(r.height || window.innerHeight));
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
      return end - window.innerHeight * 0.45 || 1;
    }
    function onScroll() {
      var max = trackLength();
      if (!(max > 1)) max = 1;
      scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
    }
    function onPointer(e) {
      pointerTX = e.clientX / window.innerWidth * 2 - 1;
      pointerTY = e.clientY / window.innerHeight * 2 - 1;
      // "Hovering the mark" = pointer near the centre of the viewport.
      var d = Math.hypot(pointerTX, pointerTY * 1.25);
      hoverTarget = Math.max(0, 1 - d / 0.85);
    }
    function onLeave() {
      hoverTarget = 0;
      pointerTX = 0;
      pointerTY = 0;
    }
    function onVisibility() {
      visible = !document.hidden;
    }
    var ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(resize);
      ro.observe(container);
    }
    window.addEventListener('resize', resize, {
      passive: true
    });
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    window.addEventListener('pointermove', onPointer, {
      passive: true
    });
    window.addEventListener('pointerleave', onLeave, {
      passive: true
    });
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
      var eye = [Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist];
      var fov = 42 * Math.PI / 180;
      perspective(proj, fov, vw / vh, 0.1, 60);

      // Keep the mark inside the viewport on narrow/short screens.
      var visH = 2 * dist * Math.tan(fov / 2);
      var visW = visH * (vw / vh);
      var fit = Math.min(visW / 4.4, visH / 4.5, 1.35);

      // Screen-space placement: offsets applied along the camera's own axes,
      // so a shot can park the mark at the right edge whatever the orbit angle.
      var fwdX = -eye[0],
        fwdY = -eye[1],
        fwdZ = -eye[2];
      var fl = Math.hypot(fwdX, fwdY, fwdZ) || 1;
      fwdX /= fl;
      fwdY /= fl;
      fwdZ /= fl;
      var rgX = -fwdZ,
        rgY = 0,
        rgZ = fwdX; // right = normalize(fwd x worldUp)
      var rl = Math.hypot(rgX, rgY, rgZ) || 1;
      rgX /= rl;
      rgY /= rl;
      rgZ /= rl;
      var upX = rgY * fwdZ - rgZ * fwdY; // up = right x fwd
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
        heroX,
        heroY,
        heroZ,
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
        [bufPos, bufNrm, bufAttr, bufLine, bufQuad].forEach(function (b) {
          gl.deleteBuffer(b);
        });
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
    createExperience({
      container: container
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* ==========================================================================
 * 2. 공통 페이지 동작 — 메뉴, 앵커, 모달, 뉴스, 블로그, 영상, 등장 효과
 * ========================================================================== */
/* ============================================================================
 * sections.js — page behaviour
 * ----------------------------------------------------------------------------
 * Every section, the menu, the modals and the footer are plain markup in
 * index.html now. This file no longer builds anything; it only makes the page
 * behave:
 *
 *   1. phone menu      open / close the menu button
 *   2. logo            click to return to the top
 *   3. anchors         ease a menu click down to its section
 *   4. modals          a link to #project-x opens #modal-project-x
 *   5. news rail       arrow buttons, and hiding them when nothing overflows
 *   6. blog            fill the blog list from /content/blog.json
 *   7. footer video    retry playback where autoplay is blocked
 *   8. reveal          drift elements in the first time they scroll into view
 *
 * To change wording or add a card, edit index.html — not this file.
 * ========================================================================== */

(function () {
  'use strict';

  /* How long an in-page jump takes, in milliseconds. Lower is snappier. */
  var SCROLL_MS = 480;
  /* The fixed header covers the top of the page, so a section is parked below
     the viewport top rather than flush against it. The bar is shorter on a
     phone, so the gap follows its height instead of being fixed. */
  var HEADER_OFFSET_MAX = 90;
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ------------------------------------------------------------------ *
   * 3. Anchor scrolling
   * ------------------------------------------------------------------ *
   * Native `behavior: smooth` cannot be tuned, and on a page this tall it
   * crawls. This runs the scroll itself so the jump stays smooth but lands
   * quickly, and it gives way entirely to prefers-reduced-motion.
   * ------------------------------------------------------------------ */

  var scrollRAF = 0;

  /* Fast at the start, settling gently at the end. */
  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  function clamp(y) {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(0, y), max);
  }

  /* `aim` is a function rather than a number because images further down the
     page are still loading while the scroll runs. Re-asking for the target on
     every frame means the landing stays correct even when the page grows
     underneath it. */
  function scrollToY(aim) {
    if (scrollRAF) {
      cancelAnimationFrame(scrollRAF);
      scrollRAF = 0;
    }
    if (typeof aim !== 'function') {
      var fixed = aim;
      aim = function () {
        return fixed;
      };
    }
    var start = window.pageYOffset;
    var end = clamp(aim());
    var dist = end - start;
    if (reduceMotion() || Math.abs(dist) < 2) {
      window.scrollTo(0, end);
      return;
    }
    var t0 = performance.now();
    /* A short hop should not take as long as a full-page one, so the duration
       grows with the distance up to the cap. */
    var ms = Math.min(SCROLL_MS, 180 + Math.abs(dist) * 0.12);
    (function step(now) {
      var t = Math.min(1, (now - t0) / ms);
      var target = clamp(aim());
      window.scrollTo(0, start + (target - start) * easeOut(t));
      scrollRAF = t < 1 ? requestAnimationFrame(step) : 0;
    })(t0);

    /* A wheel or touch during the animation means the visitor took over. */
    var stop = function () {
      if (scrollRAF) {
        cancelAnimationFrame(scrollRAF);
        scrollRAF = 0;
      }
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
    window.addEventListener('wheel', stop, {
      passive: true
    });
    window.addEventListener('touchstart', stop, {
      passive: true
    });
  }
  function headerOffset() {
    var header = $('.header-main');
    if (!header) return 24;
    return Math.min(header.offsetHeight * 0.45, HEADER_OFFSET_MAX);
  }
  function scrollToId(id) {
    if (id === 'top') {
      scrollToY(0);
      return true;
    }
    var target = document.getElementById(id);
    if (!target) return false;
    scrollToY(function () {
      return target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    });
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 1. Phone menu
   * ------------------------------------------------------------------ */

  function closeMenu() {
    var header = $('.header-main');
    if (!header || !header.classList.contains('x-nav-open')) return;
    header.classList.remove('x-nav-open');
    var toggle = $('.x-nav-toggle', header);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }
  }
  function wireMenu() {
    var header = $('.header-main');
    var toggle = header && $('.x-nav-toggle', header);
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('x-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  /* ------------------------------------------------------------------ *
   * 2. Logo returns to the top
   * ------------------------------------------------------------------ */

  function wireLogo() {
    var logo = $('.header-main .header-logo');
    if (!logo) return;
    logo.addEventListener('click', function () {
      scrollToY(0);
    });
    logo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        scrollToY(0);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Project modals
   * ------------------------------------------------------------------ */

  var openModalId = null;
  var lastFocus = null;
  function openModal(id) {
    var overlay = document.getElementById('modal-' + id);
    if (!overlay) return false;
    lastFocus = document.activeElement;
    openModalId = id;
    overlay.hidden = false;
    document.documentElement.classList.add('x-modal-lock');
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      var dialog = $('.x-modal-dialog', overlay);
      if (dialog) {
        dialog.scrollTop = 0;
        dialog.focus();
      }
    });
    return true;
  }
  function closeModal() {
    if (!openModalId) return;
    var overlay = document.getElementById('modal-' + openModalId);
    openModalId = null;
    document.documentElement.classList.remove('x-modal-lock');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    window.setTimeout(function () {
      overlay.hidden = true;
    }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function wireModals() {
    $$('.x-modal').forEach(function (overlay) {
      var close = $('.x-modal-close', overlay);
      if (close) close.addEventListener('click', closeModal);
      /* mousedown, not click: a drag that starts inside the dialog and ends on
         the backdrop should not count as clicking away. */
      overlay.addEventListener('mousedown', function (e) {
        if (e.target === overlay) closeModal();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openModalId) closeModal();
    });
  }

  /* ------------------------------------------------------------------ *
   * One handler for every in-page link
   * ------------------------------------------------------------------ *
   * A link whose href is #something either opens the matching modal or eases
   * down to the matching section. #token is the odd one out: the token page
   * is its own file.
   * ------------------------------------------------------------------ */

  function wireAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href === '#') return;
      var id = href.slice(1);
      closeMenu();
      if (id === 'token') {
        e.preventDefault();
        location.href = 'token.html';
        return;
      }
      if (document.getElementById('modal-' + id)) {
        e.preventDefault();
        openModal(id);
        return;
      }
      if (scrollToId(id)) {
        e.preventDefault();
        /* Keep the address bar in step without letting it re-jump the page. */
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', href);
      }
    });
  }

  /* A link arriving from another page (token.html#news) lands before the
     fonts settle, so re-aim once the layout has stopped moving. */
  function openingHash() {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    if (id === 'token') {
      location.replace('token.html');
      return;
    }
    window.setTimeout(function () {
      scrollToId(id);
    }, 120);
  }

  /* ------------------------------------------------------------------ *
   * 5. News rail
   * ------------------------------------------------------------------ */

  function wireNews() {
    var rail = $('.x-news-rail');
    if (!rail) return;
    var track = $('.x-news-track', rail);
    var prev = $('.x-news-prev', rail);
    var next = $('.x-news-next', rail);
    if (!track || !prev || !next) return;

    /* One card plus the gap between cards. */
    function step() {
      var card = track.firstElementChild;
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    /* Park the arrows level with the middle of the thumbnails, and hide them
       altogether when every card already fits. */
    function sync() {
      var thumb = $('.x-news-thumb', track);
      if (thumb) rail.style.setProperty('--news-arrow-y', thumb.getBoundingClientRect().height / 2 + 'px');
      var max = track.scrollWidth - track.clientWidth - 2;
      var fits = max <= 0;
      rail.classList.toggle('x-news-static', fits);
      prev.disabled = fits || track.scrollLeft <= 2;
      next.disabled = fits || track.scrollLeft >= max;
    }
    prev.addEventListener('click', function () {
      track.scrollBy({
        left: -step(),
        behavior: 'smooth'
      });
    });
    next.addEventListener('click', function () {
      track.scrollBy({
        left: step(),
        behavior: 'smooth'
      });
    });
    track.addEventListener('scroll', sync, {
      passive: true
    });
    window.addEventListener('resize', sync);
    /* Thumbnails change the card height as they load, so measure again then. */
    $$('img', track).forEach(function (im) {
      im.addEventListener('load', sync);
    });
    sync();
  }

  /* ------------------------------------------------------------------ *
   * 6. Blog list
   * ------------------------------------------------------------------ *
   * content/blog.json is refreshed from Medium by the scheduled job, so the
   * list is filled here rather than written into index.html.
   * ------------------------------------------------------------------ */

  function blogRow(post) {
    var url;
    try {
      url = new URL(post.url);
    } catch (err) {
      return null;
    }
    if (url.protocol !== 'https:' || url.hostname !== 'medium.com') return null;
    var row = document.createElement('a');
    row.className = 'x-blog-row';
    row.href = url.href;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    row.setAttribute('data-external', '1');
    var date = document.createElement('p');
    date.className = 'x-blog-date';
    date.textContent = String(post.date || '').slice(0, 7);
    var title = document.createElement('h3');
    title.className = 'x-blog-title';
    title.textContent = post.title;
    var more = document.createElement('span');
    more.className = 'x-blog-read';
    more.textContent = 'Read the story ↗';
    row.appendChild(date);
    row.appendChild(title);
    row.appendChild(more);
    return row;
  }
  function fillBlog() {
    var list = $('.x-blog-list');
    if (!list) return;
    fetch('/content/blog.json').then(function (r) {
      if (!r.ok) throw new Error('Blog unavailable');
      return r.json();
    }).then(function (data) {
      (data.posts || []).slice(0, 3).forEach(function (post) {
        var row = blogRow(post);
        if (row) list.appendChild(row);
      });
      watchReveal();
    }).catch(function () {
      var note = document.createElement('p');
      note.textContent = 'Read the latest stories on Medium.';
      list.appendChild(note);
    });
  }

  /* ------------------------------------------------------------------ *
   * 7. Footer video
   * ------------------------------------------------------------------ *
   * The markup already asks for autoplay. Some browsers refuse until the
   * element is on screen or the visitor has interacted, so retry on both and
   * let the poster stand in meanwhile.
   * ------------------------------------------------------------------ */

  function wireFooterVideo() {
    var video = $('.x-footer-video');
    if (!video) return;
    video.muted = true;
    var tryPlay = function () {
      var r = video.play();
      if (r && r.catch) r.catch(function () {});
    };
    tryPlay();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) tryPlay();
        });
      }, {
        threshold: 0.05
      }).observe(video);
    }
    document.addEventListener('pointerdown', tryPlay, {
      once: true
    });
  }

  /* ------------------------------------------------------------------ *
   * 8. Reveal on scroll
   * ------------------------------------------------------------------ *
   * Elements drift up into place the first time they scroll into view. The
   * classes are only ever added by this file, so with scripting off the page
   * simply shows everything.
   * ------------------------------------------------------------------ */

  var REVEAL_TARGETS = [
    '.section-logoCards-card',
    '.x-head',
    '.x-eco-card',
    '.x-partner-role',
    '.x-partner-note',
    '.x-marquee-wrap',
    '.x-team-card',
    '.x-road-year',
    '.x-news-card',
    '.x-app-card',
    '.x-community-links',
    '.x-footer-grid',
    '.x-footer-bar',
    'main h1',
    'main h2',
    'main p'
  ].join(', ');
  var revealObserver = null;
  function watchReveal() {
    if (!window.IntersectionObserver) return;
    /* phones get the page as it is: no drift-in on scroll */
    if (reduceMotion()) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('x-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -6% 0px'
      });
    }
    $$(REVEAL_TARGETS).forEach(function (node) {
      if (node.classList.contains('x-reveal') || node.closest('.x-reveal')) return;
      node.classList.add('x-reveal');
      revealObserver.observe(node);
    });
  }

  /* Safety net: nothing stays hidden if an observer callback never arrives. */
  function revealFallback() {
    window.setTimeout(function () {
      $$('.x-reveal:not(.x-revealed)').forEach(function (node) {
        if (node.getBoundingClientRect().top < window.innerHeight) node.classList.add('x-revealed');
      });
    }, 2500);
  }

  /* ------------------------------------------------------------------ *
   * Start
   * ------------------------------------------------------------------ */

  function boot() {
    wireMenu();
    wireLogo();
    wireAnchors();
    wireModals();
    wireNews();
    wireFooterVideo();
    fillBlog();
    watchReveal();
    revealFallback();
    openingHash();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);else boot();
})();

/* ==========================================================================
 * 3. 활동 카운터와 시세 티커 — DEX Screener 단일 출처, 주기적 갱신
 * ========================================================================== */
/* 모든 시세는 DEX Screener 공개 API에서 가져옵니다. API 키는 필요 없습니다.
 * BTC는 WBTC의 DEX 참고 가격이며 Bitcoin 현물 통합 시세와 다를 수 있습니다.
 * ETH/SOL/TRX는 각 원래 체인의 WETH/WSOL/WTRX 풀을 사용합니다.
 * 정확한 체인·baseToken 주소가 일치하는 응답 중 USD 유동성이 가장 큰 풀을
 * 선택합니다. 심볼 검색이나 quoteToken의 가격·등락률 전용은 하지 않습니다.
 * priceUsd와 priceChange.h24는 모두 선택한 baseToken 풀의 값입니다.
 * API 문서: https://docs.dexscreener.com/api/reference
 */
(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const counters = [...document.querySelectorAll('[data-count]')];
  // Future activity API integration: update data-count before starting this animation.
  const start = performance.now();
  function count(now) {
    const progress = reduced.matches ? 1 : Math.min((now - start) / 3400, 1);
    counters.forEach(node => {
      node.textContent = Math.round(Number(node.dataset.count) * (1 - (1 - progress) ** 3)).toLocaleString('en-US');
    });
    if (progress < 1) requestAnimationFrame(count);
  }
  requestAnimationFrame(count);
  const ribbon = document.querySelector('.x-ticker');
  if (!ribbon) return;
  const run = ribbon.querySelector('.x-ticker-run');
  const copy = run.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  run.parentNode.append(copy);
  // 표시 심볼과 실제 조회 토큰을 한곳에서 관리합니다.
  // EVM 주소만 대소문자를 무시하며 Solana/TRON 주소는 원문 그대로 비교합니다.
  // 토큰 확인 자료는 함께 전달하는 DEXSCREENER-NOTES.md를 참고하세요.
  const MARKETS = {
    BTC: {
      chain: 'ethereum',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      label: 'WBTC on Ethereum (BTC reference)'
    },
    ETH: {
      chain: 'ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      label: 'WETH on Ethereum (ETH reference)'
    },
    SOL: {
      chain: 'solana',
      address: 'So11111111111111111111111111111111111111112',
      label: 'Wrapped SOL on Solana'
    },
    TRX: {
      chain: 'tron',
      address: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
      label: 'Wrapped TRX on TRON'
    },
    XIIID: {
      chain: 'solana',
      address: 'AtNfXEt9vSZtHovxVYKXrfFwATfddmeMvApugZzcdWiQ',
      label: 'XIIID on Solana'
    }
  };
  const quotes = new Map();
  const valid = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
  async function json(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: 'omit'
      });
      if (!response.ok) throw new Error(`Market API: ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  function matchesAddress(chain, actual, expected) {
    if (typeof actual !== 'string') return false;
    return chain === 'ethereum'
      ? actual.toLowerCase() === expected.toLowerCase()
      : actual === expected;
  }

  async function dexQuote(symbol) {
    const market = MARKETS[symbol];
    if (!market) throw new Error('Unknown market');

    // 개별 조회로 각 토큰의 응답을 분리합니다. 한 토큰 실패가 다른 시세를 막지 않습니다.
    const url = `https://api.dexscreener.com/tokens/v1/${market.chain}/${market.address}`;
    const data = await json(url);
    if (!Array.isArray(data)) throw new Error('Invalid DEX Screener response');

    // priceUsd/h24는 baseToken 기준입니다. 대상이 quoteToken인 풀은 제외해야
    // 다른 코인의 가격 또는 등락률을 BTC/ETH/SOL/TRX로 잘못 표시하지 않습니다.
    const pair = data
      .filter(p =>
        p?.chainId === market.chain &&
        matchesAddress(market.chain, p.baseToken?.address, market.address) &&
        valid(p.priceUsd) && Number(p.priceUsd) > 0 &&
        valid(p.liquidity?.usd) && Number(p.liquidity.usd) > 0
      )
      .sort((a, b) => Number(b.liquidity.usd) - Number(a.liquidity.usd))[0];

    if (!pair) throw new Error(`No valid DEX market for ${symbol}`);
    return {
      price: Number(pair.priceUsd),
      change: valid(pair.priceChange?.h24) ? Number(pair.priceChange.h24) : null,
      source: `DEX Screener · ${market.label} · ${pair.dexId || 'DEX'}`,
      pairAddress: pair.pairAddress || ''
    };
  }

  function render(symbol) {
    const quote = quotes.get(symbol);
    const stale = quote && (quote.failed || Date.now() - quote.time > 120000);
    ribbon.querySelectorAll(`[data-symbol="${symbol}"]`).forEach(node => {
      node.querySelector('.x-quote-price').textContent = quote ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: quote.price < 1 ? 8 : 2
      }).format(quote.price) : '—';
      const change = node.querySelector('.x-quote-change');
      change.classList.remove('is-up', 'is-down');
      if (!quote) change.textContent = 'Unavailable';else if (stale) change.textContent = 'Stale';else if (quote.change === null) change.textContent = '24h —';else {
        change.textContent = `${quote.change > 0 ? '▲' : quote.change < 0 ? '▼' : '—'}${Math.abs(quote.change).toFixed(1)}%`;
        if (quote.change !== 0) change.classList.add(quote.change > 0 ? 'is-up' : 'is-down');
      }
      node.title = quote ? `${quote.source} · USD · 24h change · Pool ${quote.pairAddress} · Fetched ${new Date(quote.time).toLocaleTimeString()}${stale ? ' · Refresh unavailable' : ''}` : `DEX Screener · ${MARKETS[symbol].label} · Price temporarily unavailable. Retrying automatically.`;
    });
    ribbon.querySelector('.x-ticker-summary').textContent = [...run.querySelectorAll('.x-quote')].map(n => n.textContent).join('; ');
  }
  /* Ribbon order lives in index.html; this only has to cover the same set. */
  const COINS = Object.keys(MARKETS);
  let busy = false;
  async function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    try {
      await Promise.allSettled(COINS.map(async symbol => {
        try {
          const quote = await dexQuote(symbol);
          quotes.set(symbol, {
            ...quote,
            time: Date.now(),
            failed: false
          });
        } catch {
          if (quotes.has(symbol)) quotes.get(symbol).failed = true;
        }
        render(symbol);
      }));
    } finally {
      busy = false;
    }
  }
  refresh();
  setInterval(refresh, 60000);
  document.addEventListener('visibilitychange', () => {
    COINS.forEach(render);
    if (!document.hidden) refresh();
  });
})();
