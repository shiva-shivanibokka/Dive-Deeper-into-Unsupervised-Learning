"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ---- deterministic RNG so the demo is stable across renders ----
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Pt = [number, number];

// gaussian via Box–Muller
function makeData(kind: string): Pt[] {
  const rnd = mulberry32(42);
  const gauss = () => {
    const u = 1 - rnd(), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pts: Pt[] = [];
  const N = 300;
  if (kind === "blobs") {
    const centers: Pt[] = [[0.28, 0.3], [0.72, 0.32], [0.5, 0.74]];
    for (let i = 0; i < N; i++) {
      const c = centers[i % 3];
      pts.push([c[0] + gauss() * 0.06, c[1] + gauss() * 0.06]);
    }
  } else if (kind === "moons") {
    for (let i = 0; i < N; i++) {
      const t = Math.PI * (i / N);
      if (i % 2 === 0) pts.push([0.32 + 0.3 * Math.cos(t) + gauss() * 0.02, 0.55 - 0.3 * Math.sin(t) + gauss() * 0.02]);
      else pts.push([0.5 + 0.3 * Math.cos(t) + gauss() * 0.02, 0.42 + 0.3 * Math.sin(t) + gauss() * 0.02]);
    }
  } else {
    // concentric circles
    for (let i = 0; i < N; i++) {
      const a = 2 * Math.PI * rnd();
      const r = i % 2 === 0 ? 0.34 : 0.16;
      pts.push([0.5 + r * Math.cos(a) + gauss() * 0.015, 0.5 + r * Math.sin(a) + gauss() * 0.015]);
    }
  }
  return pts;
}

const dist2 = (a: Pt, b: Pt) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

// ---- K-Means (Lloyd) with k-means++ init ----
function kmeans(pts: Pt[], k: number): number[] {
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

// ---- DBSCAN (labels: -1 = noise, 0..n cluster ids) ----
function dbscan(pts: Pt[], eps: number, minPts: number): number[] {
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

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa", "#fb7185", "#34d399", "#60a5fa"];
const SIZE = 520;

export default function ClusteringTab() {
  const [kind, setKind] = useState("moons");
  const [algo, setAlgo] = useState("kmeans");
  const [k, setK] = useState(2);
  const [eps, setEps] = useState(0.05);
  const [minPts, setMinPts] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pts = useMemo(() => makeData(kind), [kind]);
  const labels = useMemo(
    () => (algo === "kmeans" ? kmeans(pts, k) : dbscan(pts, eps, minPts)),
    [pts, algo, k, eps, minPts]
  );

  const nClusters = useMemo(() => new Set(labels.filter((l) => l >= 0)).size, [labels]);
  const nNoise = useMemo(() => labels.filter((l) => l === -1).length, [labels]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      ctx.beginPath();
      ctx.arc(x * SIZE, (1 - y) * SIZE, 5, 0, Math.PI * 2);
      ctx.fillStyle = labels[i] === -1 ? "#4b5578" : COLORS[labels[i] % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.stroke();
    }
  }, [pts, labels]);

  return (
    <div className="demo">
      <div className="control-row">
        <div className="field">
          <label><span className="lname">Dataset shape</span></label>
          <div className="seg">
            {["blobs", "moons", "circles"].map((d) => (
              <button key={d} aria-pressed={kind === d} onClick={() => setKind(d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label><span className="lname">Algorithm</span></label>
          <div className="seg">
            <button aria-pressed={algo === "kmeans"} onClick={() => setAlgo("kmeans")}>K-Means</button>
            <button aria-pressed={algo === "dbscan"} onClick={() => setAlgo("dbscan")}>DBSCAN</button>
          </div>
        </div>
        {algo === "kmeans" ? (
          <div className="field">
            <label><span className="lname">K (number of clusters)</span><b>{k}</b></label>
            <input type="range" min={2} max={6} step={1} value={k} onChange={(e) => setK(+e.target.value)} />
          </div>
        ) : (
          <>
            <div className="field">
              <label><span className="lname">eps (neighbor radius)</span><b>{eps.toFixed(3)}</b></label>
              <input type="range" min={0.02} max={0.15} step={0.005} value={eps} onChange={(e) => setEps(+e.target.value)} />
            </div>
            <div className="field">
              <label><span className="lname">minPts</span><b>{minPts}</b></label>
              <input type="range" min={3} max={12} step={1} value={minPts} onChange={(e) => setMinPts(+e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="results" style={{ justifyItems: "center" }}>
        <div style={{ maxWidth: SIZE, width: "100%" }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE} />
        </div>
        <div className="tiles" style={{ maxWidth: 420, width: "100%" }}>
          <div className="tile"><div className="v">{nClusters}</div><div className="k">clusters found</div></div>
          {algo === "dbscan" && <div className="tile"><div className="v">{nNoise}</div><div className="k">noise points</div></div>}
        </div>
        <div className="callout note" style={{ maxWidth: 720 }}>
          <strong>What to try.</strong> On <em>blobs</em>, both algorithms nail it. Switch to <em>moons</em> or{" "}
          <em>circles</em> and set K-Means to the right K — it still fails, slicing the shapes straight through,
          because it assumes round clusters. Now switch to <strong>DBSCAN</strong>: with a good{" "}
          <strong>eps</strong> it traces the crescents and rings perfectly and marks stray points as noise
          (grey). Too-small eps makes everything noise; too-large merges everything into one blob. This is the
          picture behind Notebook 01.
        </div>
      </div>
    </div>
  );
}
