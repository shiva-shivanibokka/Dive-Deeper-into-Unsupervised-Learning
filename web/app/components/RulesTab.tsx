"use client";

import { useEffect, useMemo, useState } from "react";

type Rule = { antecedents: string[]; consequents: string[]; support: number; confidence: number; lift: number };
type RulesData = { country: string; rules: Rule[]; note: string };

export default function RulesTab() {
  const [data, setData] = useState<RulesData | null>(null);
  const [minLift, setMinLift] = useState(1);

  useEffect(() => {
    fetch("/rules.json").then((r) => r.json()).then(setData);
  }, []);

  const maxLift = useMemo(() => (data ? Math.ceil(Math.max(...data.rules.map((r) => r.lift))) : 30), [data]);
  const shown = useMemo(
    () => (data ? data.rules.filter((r) => r.lift >= minLift).sort((a, b) => b.lift - a.lift) : []),
    [data, minLift]
  );

  if (!data) return <p className="note">loading rules…</p>;

  return (
    <div className="demo">
      <div className="control-row">
        <div className="field" style={{ flex: "1 1 320px" }}>
          <label><span className="lname">Minimum lift</span><b>{minLift.toFixed(1)}×</b></label>
          <input type="range" min={1} max={maxLift} step={0.5} value={minLift} onChange={(e) => setMinLift(+e.target.value)} />
        </div>
        <div className="tile" style={{ flex: "0 0 auto" }}>
          <div className="v">{shown.length}</div><div className="k">rules shown</div>
        </div>
      </div>

      <div className="results">
        <div className="chart-box table-scroll">
          <table className="rules-table">
            <thead>
              <tr>
                <th>If basket contains</th>
                <th></th>
                <th>Then also contains</th>
                <th>Support</th>
                <th>Confidence</th>
                <th>Lift</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, 30).map((r, i) => (
                <tr key={i}>
                  <td className="item">{r.antecedents.join(", ")}</td>
                  <td className="arrow">→</td>
                  <td className="item">{r.consequents.join(", ")}</td>
                  <td>{(r.support * 100).toFixed(1)}%</td>
                  <td>{(r.confidence * 100).toFixed(0)}%</td>
                  <td><span className="lift-pill">{r.lift.toFixed(1)}×</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="callout note">
          <strong>How to read a rule.</strong> Each row says <em>customers who bought the left-hand items also
          bought the right-hand ones</em>. <strong>Support</strong> is how common the whole combo is;{" "}
          <strong>confidence</strong> is how reliable the rule is; <strong>lift</strong> is the one that matters —
          how many times more likely the pairing is than pure chance. Drag the <strong>minimum lift</strong> up:
          the survivors are strong "complete the set" associations (matching party-ware, colored variants of the
          same item) — exactly the pairings a store would bundle or cross-sell. These are real rules mined from{" "}
          {data.country} orders in the Online Retail dataset (Notebook 05).
        </div>
      </div>
    </div>
  );
}
