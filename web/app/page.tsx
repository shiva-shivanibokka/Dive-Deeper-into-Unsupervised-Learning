"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MODEL_TABS } from "./models";
import { Tip } from "./lib/tip";

const load = (p: () => Promise<{ default: React.ComponentType }>) =>
  dynamic(p, { ssr: false, loading: () => <p className="note">loading demo…</p> });

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  clustering: load(() => import("./components/ClusteringTab")),
  projection: load(() => import("./components/ProjectionTab")),
  anomaly: load(() => import("./components/AnomalyTab")),
  topics: load(() => import("./components/TopicsTab")),
  rules: load(() => import("./components/RulesTab")),
  about: load(() => import("./components/AboutTab")),
};

export default function Home() {
  const [active, setActive] = useState(MODEL_TABS[0].id);
  const tab = MODEL_TABS.find((t) => t.id === active)!;
  const Comp = TAB_COMPONENTS[tab.id];

  return (
    <main className="wrap">
      <header className="hero">
        <h1>Unsupervised Learning Playground</h1>
        <p>
          Explore machine learning with <strong>no labels</strong> — clustering, dimensionality reduction,
          anomaly detection, topic modeling and association rules — built across the companion notebooks and
          running <strong>entirely in your browser</strong>. Every demo is computed on your own machine, either
          live or from data precomputed on real datasets.
        </p>
        <span className="live">
          <b>●</b> live · no server · nothing leaves your machine
        </span>
      </header>

      <nav className="tabs" role="tablist" aria-label="Demos">
        {MODEL_TABS.map((t) => (
          <button key={t.id} className="tab" role="tab" aria-selected={t.id === active} onClick={() => setActive(t.id)}>
            {t.title}
          </button>
        ))}
      </nav>

      <section className="panel" role="tabpanel">
        <div className="panel-head">
          <div className="htitle">
            {tab.nb && <span className="chip">Notebook {tab.nb}</span>}
            <h2>{tab.title}</h2>
            <Tip text={tab.help} />
          </div>
          {tab.dataset && <span className="chip">{tab.dataset}</span>}
        </div>
        <p className="panel-tagline">{tab.tagline}</p>
        <Comp />
      </section>

      <p className="footer">
        Built by Shivani Bokka · five notebooks + this playground ·{" "}
        <a href="https://github.com/shiva-shivanibokka/Dive-Deeper-into-Unsupervised-Learning" target="_blank" rel="noreferrer">
          source on GitHub
        </a>
      </p>
    </main>
  );
}
