# Dive Deeper into Unsupervised Learning

A hands-on, from-first-principles tour of **unsupervised machine learning** — five self-contained notebooks
that build every major family of label-free learning (clustering, dimensionality reduction, anomaly
detection, topic modeling, association rules), each with plain-language explanations and a **"How to Read
This Chart"** guide for every visualization.

Built for two audiences at once: a complete beginner who wants the *why* behind each method, and a working
practitioner who wants a clean, correct reference — all on **real datasets**, with an honest account of where
each method wins and where it breaks.

### ▶ [**Live demo → dive-deeper-unsupervised-learning.vercel.app**](https://dive-deeper-unsupervised-learning.vercel.app)

A browser-based playground where five of these ideas run **entirely client-side** — no install, no backend.
Watch K-Means fail on crescents while DBSCAN traces them, squash 900 handwritten digits from 784 dimensions
to 2 three different ways, drag an anomaly-detection dial, read the words that define auto-discovered topics,
and filter real market-basket rules by lift.

---

## The Notebooks

| # | Notebook | What It Covers | Dataset(s) |
|---|----------|----------------|------------|
| 01 | [Clustering](01_clustering.ipynb) | K-Means (++/`n_init`/elbow/silhouette), Mini-Batch, DBSCAN, Agglomerative + dendrograms, GMM + BIC, internal metrics, and **external validation** (ARI/NMI vs. ground truth) | Palmer Penguins, 2D synthetic |
| 02 | [Dimensionality Reduction](02_dimensionality_reduction.ipynb) | PCA, Incremental PCA, scree plots, t-SNE (perplexity), UMAP, a PyTorch **autoencoder**, plus **NMF, Kernel PCA, and ICA** | MNIST (784-dim) |
| 03 | [Anomaly Detection](03_anomaly_detection.ipynb) | Isolation Forest, LOF, One-Class SVM, autoencoder reconstruction error, **Elliptic Envelope**, **novelty-mode LOF**, PR curves, threshold selection | Credit Card Fraud |
| 04 | [Topic Modeling](04_topic_modeling.ipynb) | **LDA** (coherence, pyLDAvis), **NMF** and **LSA** topic models, and **BERTopic** (transformer embeddings + HDBSCAN), with a head-to-head comparison | 20 Newsgroups |
| 05 | [Association Rules](05_association_rules.ipynb) | **Apriori** and **FP-Growth**, frequent itemsets, support / confidence / **lift**, and reading a rule as a business decision | Online Retail |

They're ordered as a tour of the unsupervised toolkit: **group the rows** (01) → **compress the columns**
(02) → **flag the rare** (03) → **find themes in text** (04) → **find what co-occurs** (05). Five different
questions, all answered without a single label.

---

## What Makes These Different

- **Every chart is explained.** No unlabeled plots. Each visualization has a dedicated *"How to Read This
  Chart"* section that walks through the axes, the colors, and what to actually conclude.
- **Plain English first, then code.** Every section opens with an everyday-language explanation and an analogy
  before any code appears.
- **Honest results.** When silhouette prefers 2 clusters but the truth is 3, the notebook says so and explains
  *why*. When Elliptic Envelope loses to Isolation Forest on fraud, it shows the Gaussian assumption breaking.
  When FP-Growth isn't faster on a small basket, it says that too. The goal is understanding, not a highlight reel.
- **Real datasets, real ground truth.** Clustering is validated against actual penguin species; anomaly
  detection runs on genuinely imbalanced fraud (0.17%); topics are checked against known newsgroups. Synthetic
  data is kept only where its job is to demonstrate an algorithm's shape assumptions.
- **A live playground.** The companion web app turns five of these notebooks into interactive demos that run in
  your browser — the clustering and anomaly demos compute live in JavaScript; the rest display results
  precomputed from the notebooks.

---

## The Datasets

| Dataset | Task | Why it's used |
|---------|------|---------------|
| **[Palmer Penguins](https://allisonhorst.github.io/palmerpenguins/)** (333 rows) | Clustering | Real morphology with three known species — so clustering can be *externally validated* (ARI/NMI), not just eyeballed |
| **[MNIST](https://www.openml.org/d/554)** (784-dim) | Dimensionality reduction | The real curse of dimensionality — 784 pixels per digit, ten classes to separate in 2D |
| **[Credit Card Fraud](https://www.openml.org/d/42175)** (0.17% fraud) | Anomaly detection | Genuinely extreme imbalance — makes "why accuracy lies" and PR-vs-ROC land for real |
| **[20 Newsgroups](https://scikit-learn.org/stable/datasets/real_world.html#newsgroups-dataset)** | Topic modeling | Real forum posts across four topics — lets you grade whether discovered topics match reality |
| **[Online Retail](https://archive.ics.uci.edu/dataset/352/online+retail)** (541k rows) | Association rules | Real transactions from a UK gift retailer — actual market baskets, not a toy example |

---

## Setup

```bash
# Notebooks
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
jupyter lab            # then open any of the 0*.ipynb notebooks
```

Datasets download automatically on first run (MNIST, Fraud, 20 Newsgroups via `fetch_openml` /
scikit-learn; Online Retail is cached to `data/` from UCI). No manual downloads.

```bash
# Web playground
cd web
npm install
npm run dev            # http://localhost:3000
```

The precomputed data the web app reads (`web/public/*.json`) is regenerated by `web/export_data.py`.

---

## Repository Structure

```
├── 01_clustering.ipynb              # K-Means, DBSCAN, Agglomerative, GMM
├── 02_dimensionality_reduction.ipynb# PCA, t-SNE, UMAP, autoencoder, NMF/KernelPCA/ICA
├── 03_anomaly_detection.ipynb       # Isolation Forest, LOF, One-Class SVM, autoencoder
├── 04_topic_modeling.ipynb          # LDA, NMF, LSA, BERTopic
├── 05_association_rules.ipynb       # Apriori, FP-Growth, market basket
├── requirements.txt
└── web/                             # Next.js playground (deployed to Vercel)
    ├── app/                         # one component per notebook + shared UI
    ├── public/                      # precomputed JSON (projections, topics, rules)
    └── export_data.py               # regenerates public/*.json from the datasets
```

---

## License

[MIT](LICENSE) © 2026 Shivani Bokka
