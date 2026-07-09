"use client";

export default function AboutTab() {
  return (
    <div className="about">
      <p className="note" style={{ fontSize: "1rem" }}>
        This playground accompanies a series of notebooks on <strong>unsupervised learning</strong> — finding
        structure in data that has <strong>no labels</strong>. There's no "right answer" to predict; the
        algorithm has to discover the groups, the shape, the outliers, or the themes on its own. Every demo here
        runs <strong>entirely in your browser</strong> — some compute live (clustering, anomaly detection),
        others display results precomputed on real datasets (MNIST, 20 Newsgroups, Online Retail).
      </p>

      <h3><span className="num">01</span> Clustering</h3>
      <p>
        Grouping points so that members of a group are more similar to each other than to outsiders.{" "}
        <span className="k">K-Means</span> assumes round, similar-sized blobs and is fast and simple.{" "}
        <span className="k">DBSCAN</span> instead follows <em>density</em>, so it can trace non-round shapes
        (crescents, rings) and label sparse points as noise. The demo lets you watch both carve up the same 2D
        data — and see K-Means fail on shapes it wasn't built for.
      </p>

      <h3><span className="num">02</span> Dimensionality Reduction</h3>
      <p>
        Squeezing many features into a few you can actually plot, while keeping the important structure.{" "}
        <span className="k">PCA</span> is linear and preserves global variance; <span className="k">t-SNE</span>{" "}
        and <span className="k">UMAP</span> are non-linear and excel at pulling apart local clusters. The demo
        projects 900 handwritten digits from 784 dimensions down to 2 — three ways — so you can see the ten
        digits separate into islands.
      </p>

      <h3><span className="num">03</span> Anomaly Detection</h3>
      <p>
        Finding the rare, unusual points hiding in mostly-normal data — fraud, defects, intrusions. You learn
        what "normal" looks like and flag whatever deviates. The catch is the{" "}
        <span className="k">contamination</span> setting: your assumed anomaly rate, which trades off catching
        real outliers (recall) against false alarms (precision). The demo lets you drag that dial and watch the
        flags move.
      </p>

      <h3><span className="num">04</span> Topic Modeling</h3>
      <p>
        Reading a pile of documents and discovering recurring <span className="k">themes</span> as clusters of
        words — with no labels. <span className="k">LDA</span> treats each document as a probabilistic mix of
        topics; <span className="k">NMF</span> factors the word-count matrix into additive parts. The demo shows
        four topics discovered from thousands of forum posts; read the words and the theme (cars, medicine, guns)
        jumps right out.
      </p>

      <h3><span className="num">05</span> Association Rules</h3>
      <p>
        The engine behind "frequently bought together." <span className="k">Apriori</span> and{" "}
        <span className="k">FP-Growth</span> find sets of items that co-occur in transactions, then turn them
        into rules scored by <span className="k">lift</span> — how much more often two items sell together than
        by chance. The demo shows real market-basket rules from an online store; filter by lift to surface the
        strongest cross-sell pairs.
      </p>

      <div className="callout note" style={{ marginTop: "1.5rem" }}>
        <strong>The through-line:</strong> clustering groups the rows, dimensionality reduction compresses the
        columns, anomaly detection flags the rare, topic modeling finds themes in text, and association rules
        find what co-occurs. Five different questions — all answered without a single label, with the full code
        in the companion notebooks.
      </div>
    </div>
  );
}
