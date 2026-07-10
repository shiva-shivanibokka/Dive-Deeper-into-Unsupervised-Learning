"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Pt = [number, number];
const SIZE = 760;

// two dense "normal" blobs + a scatter of genuine outliers
function makeData(): { pts: Pt[]; truthOutlier: boolean[] } {
  const rnd = mulberry32(42);
  const gauss = () => { const u = 1 - rnd(), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pts: Pt[] = [];
  const truth: boolean[] = [];
  const centers: Pt[] = [[0.38, 0.42], [0.64, 0.6]];
  for (let i = 0; i < 260; i++) {
    const c = centers[i % 2];
    pts.push([c[0] + gauss() * 0.07, c[1] + gauss() * 0.07]);
    truth.push(false);
  }
  for (let i = 0; i < 22; i++) { pts.push([0.06 + rnd() * 0.88, 0.06 + rnd() * 0.88]); truth.push(true); }
  return { pts, truthOutlier: truth };
}

const dist2 = (a: Pt, b: Pt) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

// anomaly score = mean distance to k nearest neighbors (higher = more isolated)
function knnScores(pts: Pt[], k: number): number[] {
  return pts.map((p, i) => {
    const ds = pts.map((q, j) => (i === j ? Infinity : Math.sqrt(dist2(p, q)))).sort((a, b) => a - b);
    return ds.slice(0, k).reduce((a, b) => a + b, 0) / k;
  });
}

export default function AnomalyTab() {
  const [contam, setContam] = useState(0.08);
  const [hover, setHover] = useState<{ x: number; y: number; i: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { pts, truthOutlier } = useMemo(() => makeData(), []);
  const scores = useMemo(() => knnScores(pts, 5), [pts]);
  const threshold = useMemo(() => {
    const sorted = [...scores].sort((a, b) => b - a);
    return sorted[Math.max(0, Math.floor(contam * pts.length) - 1)];
  }, [scores, contam, pts.length]);

  const flagged = useMemo(() => scores.map((s) => s >= threshold), [scores, threshold]);
  const stats = useMemo(() => {
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < pts.length; i++) {
      if (flagged[i] && truthOutlier[i]) tp++;
      else if (flagged[i] && !truthOutlier[i]) fp++;
      else if (!flagged[i] && truthOutlier[i]) fn++;
    }
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    return { tp, fp, fn, precision, recall };
  }, [flagged, truthOutlier, pts.length]);

  const maxScore = useMemo(() => Math.max(...scores), [scores]);

  useEffect(() => {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      ctx.beginPath();
      ctx.arc(x * SIZE, (1 - y) * SIZE, hover?.i === i ? 9 : flagged[i] ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = flagged[i] ? "#fb7185" : "#38bdf8";
      ctx.globalAlpha = flagged[i] ? 1 : 0.7;
      ctx.fill();
      if (flagged[i] || hover?.i === i) { ctx.lineWidth = 1.5; ctx.strokeStyle = "#fff"; ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }, [pts, flagged, hover]);

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
    if (best >= 0) setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, i: best });
    else setHover(null);
  }

  return (
    <div className="demo">
      <div className="control-row">
        <div className="field">
          <label><span className="lname">Contamination (assumed anomaly rate)</span><b>{(contam * 100).toFixed(0)}%</b></label>
          <input type="range" min={0.01} max={0.2} step={0.01} value={contam} onChange={(e) => setContam(+e.target.value)} />
        </div>
      </div>

      <div className="results">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={SIZE} height={SIZE} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
          {hover && (
            <div className="hovertip" style={{ left: hover.x, top: hover.y }}>
              {flagged[hover.i] ? "flagged" : "normal"} · isolation {(scores[hover.i] / maxScore).toFixed(2)}
            </div>
          )}
          <p className="note" style={{ textAlign: "center", marginTop: ".5rem" }}>
            <span style={{ color: "#38bdf8" }}>● normal</span> &nbsp;
            <span style={{ color: "#fb7185" }}>● flagged anomaly</span>
          </p>
        </div>

        <div className="tiles">
          <div className="tile"><div className="v">{stats.tp + stats.fp}</div><div className="k">points flagged</div></div>
          <div className="tile"><div className="v">{(stats.precision * 100).toFixed(0)}%</div><div className="k">precision</div></div>
          <div className="tile"><div className="v">{(stats.recall * 100).toFixed(0)}%</div><div className="k">recall</div></div>
        </div>

        <div className="callout note">
          <strong>How it works.</strong> Every point is scored by how far it sits from its 5 nearest neighbors —
          isolated points score high. The <strong>contamination</strong> dial sets what fraction you assume are
          anomalies, which fixes the cutoff. Turn it too low and you miss real outliers (recall drops); turn it
          too high and you start flagging edge-of-cluster normal points (precision drops). There are 22 genuine
          outliers hidden among 260 normal points — find the dial setting that catches them without too many
          false alarms. <strong>Hover a point</strong> to see its isolation score. This is the trade-off at the
          heart of Notebook 03.
        </div>
      </div>
    </div>
  );
}
