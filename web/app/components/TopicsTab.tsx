"use client";

import { useEffect, useState } from "react";
import { useJson } from "../lib/useJson";

type Word = [string, number];
type TopicsData = { categories: string[]; models: Record<string, Word[][]>; note: string };

export default function TopicsTab() {
  const { data, error } = useJson<TopicsData>("/topics.json");
  const [model, setModel] = useState("");
  const [topic, setTopic] = useState(0);

  useEffect(() => {
    if (data && !model) setModel(Object.keys(data.models)[0]);
  }, [data, model]);

  if (error) return <p className="note">Couldn&apos;t load the topics data — try refreshing the page.</p>;
  if (!data || !model) return <p className="note">loading topics…</p>;
  const topics = data.models[model];
  const words = topics[topic];

  return (
    <div className="demo">
      <div className="control-row">
        <div className="field">
          <label><span className="lname">Model</span></label>
          <div className="seg">
            {Object.keys(data.models).map((m) => (
              <button key={m} aria-pressed={model === m} onClick={() => setModel(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label><span className="lname">Topic (discovered, not labeled)</span></label>
          <div className="seg">
            {topics.map((_, i) => (
              <button key={i} aria-pressed={topic === i} onClick={() => setTopic(i)}>Topic {i}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="results">
        <div>
          <p className="section-label">Top words in Topic {topic} — {model}</p>
          <div className="bars">
            {words.map(([w, weight]) => (
              <div className="bar-row" key={w}>
                <div className="name">{w}</div>
                <div className="bar-track">
                  <div className="fill" style={{ width: `${Math.max(6, weight * 100)}%` }} />
                  <span className="val">{weight.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="callout note">
          <strong>Read the words, name the topic.</strong> The model was handed thousands of forum posts with{" "}
          <em>no labels</em> and discovered these four word-clusters on its own. Read the top words and the theme
          jumps out — a topic full of <em>car, engine, dealer</em> is clearly autos; one with{" "}
          <em>gun, fbi, weapon</em> is the politics-of-guns group. The corpus really is four newsgroups (autos,
          medicine, graphics, guns), so you can check the model's homework. <strong>LDA</strong> gives smoother
          probability-weighted words; <strong>NMF</strong> tends to give crisper, more distinct topics. This is
          the picture behind Notebook 04.
        </div>
      </div>
    </div>
  );
}
