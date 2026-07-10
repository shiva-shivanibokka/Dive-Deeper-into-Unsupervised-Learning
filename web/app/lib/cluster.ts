// Pure, framework-free implementations of the clustering / anomaly algorithms the demos run
// in-browser. Kept out of the React components so they can be unit-tested (see cluster.test.ts).

export type Pt = [number, number];

// deterministic seeded RNG so demos and tests are reproducible
export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const dist2 = (a: Pt, b: Pt) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

// K-Means (Lloyd) with k-means++ initialization. Returns a cluster id (0..k-1) per point.
export function kmeans(pts: Pt[], k: number): number[] {
  const rnd = mulberry32(7);
  const centers: Pt[] = [pts[Math.floor(rnd() * pts.length)]];
  while (centers.length < k) {
    const d = pts.map((p) => Math.min(...centers.map((c) => dist2(p, c))));
    const sum = d.reduce((a, b) => a + b, 0);
    let r = rnd() * sum;
    let idx = 0;
    for (let i = 0; i < d.length; i++) { r -= d[i]; if (r <= 0) { idx = i; break; } }
    centers.push(pts[idx]);
  }
  const labels = new Array(pts.length).fill(0);
  for (let iter = 0; iter < 25; iter++) {
    for (let i = 0; i < pts.length; i++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) { const dd = dist2(pts[i], centers[c]); if (dd < bd) { bd = dd; best = c; } }
      labels[i] = best;
    }
    for (let c = 0; c < k; c++) {
      const members = pts.filter((_, i) => labels[i] === c);
      if (members.length) {
        centers[c] = [members.reduce((a, p) => a + p[0], 0) / members.length,
                      members.reduce((a, p) => a + p[1], 0) / members.length];
      }
    }
  }
  return labels;
}

// DBSCAN. Returns cluster ids 0..n and -1 for noise (points not in any dense region).
export function dbscan(pts: Pt[], eps: number, minPts: number): number[] {
  const n = pts.length;
  const labels = new Array(n).fill(-2); // -2 = unvisited
  const eps2 = eps * eps;
  const neighbors = (i: number) => {
    const out: number[] = [];
    for (let j = 0; j < n; j++) if (dist2(pts[i], pts[j]) <= eps2) out.push(j);
    return out;
  };
  let cid = -1;
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue;
    const nb = neighbors(i);
    if (nb.length < minPts) { labels[i] = -1; continue; }
    cid++;
    labels[i] = cid;
    const queue = [...nb];
    for (let q = 0; q < queue.length; q++) {
      const j = queue[q];
      if (labels[j] === -1) labels[j] = cid;
      if (labels[j] !== -2) continue;
      labels[j] = cid;
      const nb2 = neighbors(j);
      if (nb2.length >= minPts) queue.push(...nb2);
    }
  }
  return labels;
}

// Anomaly score per point = mean distance to its k nearest neighbors (higher = more isolated).
export function knnScores(pts: Pt[], k: number): number[] {
  return pts.map((p, i) => {
    const ds = pts.map((q, j) => (i === j ? Infinity : Math.sqrt(dist2(p, q)))).sort((a, b) => a - b);
    return ds.slice(0, k).reduce((a, b) => a + b, 0) / k;
  });
}
