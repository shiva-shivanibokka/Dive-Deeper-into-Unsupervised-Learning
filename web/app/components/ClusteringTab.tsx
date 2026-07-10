"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mulberry32, kmeans, dbscan, type Pt } from "../lib/cluster";

// gaussian via Box–Muller — demo-specific 2D data generator (blobs / moons / circles)
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

const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa", "#fb7185", "#34d399", "#60a5fa"];
const SIZE = 760;

export default function ClusteringTab() {
  const [kind, setKind] = useState("moons");
  const [algo, setAlgo] = useState("kmeans");
  const [k, setK] = useState(2);
  const [eps, setEps] = useState(0.05);
  const [minPts, setMinPts] = useState(5);
  const [hover, setHover] = useState<{ x: number; y: number; label: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pts = useMemo(() => makeData(kind), [kind]);
  const labels = useMemo(
    () => (algo === "kmeans" ? kmeans(pts, k) : dbscan(pts, eps, minPts)),
    [pts, algo, k, eps, minPts]
  );

  const sizes = useMemo(() => {
    const m = new Map<number, number>();
    for (const l of labels) m.set(l, (m.get(l) ?? 0) + 1);
    return m;
  }, [labels]);
  const nClusters = useMemo(() => new Set(labels.filter((l) => l >= 0)).size, [labels]);
  const nNoise = sizes.get(-1) ?? 0;

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      ctx.beginPath();
      ctx.arc(x * SIZE, (1 - y) * SIZE, 6, 0, Math.PI * 2);
      ctx.fillStyle = labels[i] === -1 ? "#4b5578" : COLORS[labels[i] % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.stroke();
    }
  }, [pts, labels]);

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SIZE;
    let best = -1, bd = 26 * 26;
    for (let i = 0; i < pts.length; i++) {
      const cx = pts[i][0] * SIZE, cy = (1 - pts[i][1]) * SIZE;
      const d = (cx - mx) ** 2 + (cy - my) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: labels[best] });
    else setHover(null);
  }

  const tipText = (l: number) =>
    l === -1 ? "Noise · not dense enough for any cluster" : `Cluster ${l} · ${sizes.get(l)} points`;

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

      <div className="results">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={SIZE} height={SIZE} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
          {hover && (
            <div className="hovertip" style={{ left: hover.x, top: hover.y }}>{tipText(hover.label)}</div>
          )}
        </div>

        <div className="tiles">
          <div className="tile"><div className="v">{nClusters}</div><div className="k">clusters found</div></div>
          {algo === "dbscan" && <div className="tile"><div className="v">{nNoise}</div><div className="k">noise points</div></div>}
          <div className="tile"><div className="v">{pts.length}</div><div className="k">total points</div></div>
        </div>

        <div className="callout note">
          <strong>What to try.</strong> On <em>blobs</em>, both algorithms nail it. Switch to <em>moons</em> or{" "}
          <em>circles</em> and set K-Means to the right K — it still fails, slicing the shapes straight through,
          because it assumes round clusters. Now switch to <strong>DBSCAN</strong>: with a good{" "}
          <strong>eps</strong> it traces the crescents and rings perfectly and marks stray points as noise
          (grey). Too-small eps makes everything noise; too-large merges everything into one blob.{" "}
          <strong>Hover any point</strong> to see which cluster it landed in. This is the picture behind Notebook 01.
        </div>
      </div>
    </div>
  );
}
