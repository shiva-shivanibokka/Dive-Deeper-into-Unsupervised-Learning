"use client";

import { useEffect, useRef, useState } from "react";

type ProjData = { labels: number[]; methods: Record<string, [number, number][]>; note: string };

const DIGIT_COLORS = [
  "#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa",
  "#fb7185", "#34d399", "#60a5fa", "#fb923c", "#e879f9",
];
const SIZE = 760;
const PAD = 28;

export default function ProjectionTab() {
  const [data, setData] = useState<ProjData | null>(null);
  const [method, setMethod] = useState("t-SNE");
  const [hover, setHover] = useState<{ x: number; y: number; i: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetch("/projection.json").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    if (!data) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const coords = data.methods[method];
    const hi = hover?.i ?? null;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < coords.length; i++) {
      if (i === hi) continue; // draw the hovered point last, on top, undimmed
      const cx = PAD + coords[i][0] * (SIZE - 2 * PAD);
      const cy = PAD + (1 - coords[i][1]) * (SIZE - 2 * PAD);
      ctx.beginPath();
      ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = DIGIT_COLORS[data.labels[i]];
      ctx.fill();
    }
    if (hi !== null) {
      const cx = PAD + coords[hi][0] * (SIZE - 2 * PAD);
      const cy = PAD + (1 - coords[hi][1]) * (SIZE - 2 * PAD);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fillStyle = DIGIT_COLORS[data.labels[hi]];
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [data, method, hover]);

  function onMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!data) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * SIZE;
    const my = ((e.clientY - rect.top) / rect.height) * SIZE;
    const coords = data.methods[method];
    let best = -1, bd = 200;
    for (let i = 0; i < coords.length; i++) {
      const cx = PAD + coords[i][0] * (SIZE - 2 * PAD);
      const cy = PAD + (1 - coords[i][1]) * (SIZE - 2 * PAD);
      const d = (cx - mx) ** 2 + (cy - my) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, i: best });
    else setHover(null);
  }

  if (!data) return <p className="note">loading projection…</p>;

  return (
    <div className="demo">
      <div className="control-row">
        <div className="field">
          <label><span className="lname">Projection method</span></label>
          <div className="seg">
            {Object.keys(data.methods).map((m) => (
              <button key={m} aria-pressed={method === m} onClick={() => setMethod(m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="results">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={SIZE} height={SIZE} onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
          {hover && (
            <div className="hovertip" style={{ left: hover.x, top: hover.y }}>digit {data.labels[hover.i]}</div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem 1rem", justifyContent: "center" }}>
          {DIGIT_COLORS.map((c, d) => (
            <span key={d} className="note" style={{ display: "inline-flex", alignItems: "center", gap: ".3rem" }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} /> {d}
            </span>
          ))}
        </div>

        <div className="callout note">
          <strong>What you're seeing.</strong> Each dot is one of 900 handwritten digits, squashed from{" "}
          <strong>784 pixels down to 2 numbers</strong>. Colors are the true digit — but the projection never saw
          them. <strong>PCA</strong> (linear) keeps everything in one smear with overlapping classes.{" "}
          <strong>t-SNE</strong> and <strong>UMAP</strong> (non-linear) pull the ten digits into cleanly separated
          islands. Notice UMAP keeps related digits (like 4/7/9) near each other while t-SNE spreads them more
          evenly — UMAP preserves global structure better. <strong>Hover a point</strong> to read its digit. This
          is the picture behind Notebook 02.
        </div>
      </div>
    </div>
  );
}
