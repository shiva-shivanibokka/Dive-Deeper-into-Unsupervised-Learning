// Single source of truth for the demo tabs. Each entry maps to one notebook.
export type ModelTab = {
  id: string;
  nb: string;
  title: string;
  tagline: string;
  dataset: string;
  help: string; // shown in the panel's "?" tooltip
};

export const MODEL_TABS: ModelTab[] = [
  {
    id: "clustering", nb: "01", title: "Clustering", dataset: "2D synthetic",
    tagline: "Pick a dataset shape and an algorithm, then watch K-Means and DBSCAN carve it into groups live in your browser.",
    help: "Clustering finds natural groups with no labels. K-Means assumes round, similar-sized blobs; DBSCAN follows density, so it can trace crescents and rings and mark sparse points as noise.",
  },
  {
    id: "projection", nb: "02", title: "Dim. Reduction", dataset: "MNIST",
    tagline: "The same 900 handwritten digits squashed from 784 dimensions down to 2 — three different ways. Watch the clusters sharpen.",
    help: "Dimensionality reduction compresses many features into a few you can plot. PCA is linear and keeps global structure; t-SNE and UMAP are non-linear and pull tight local clusters apart.",
  },
  {
    id: "anomaly", nb: "03", title: "Anomaly Detection", dataset: "2D synthetic",
    tagline: "Drag the contamination dial and watch the rarest, most isolated points get flagged as anomalies.",
    help: "Anomaly detection learns what 'normal' looks like and flags the outliers. The contamination dial is your assumed anomaly rate — it sets how many of the most isolated points get flagged.",
  },
  {
    id: "topics", nb: "04", title: "Topic Modeling", dataset: "20 Newsgroups",
    tagline: "Four topics discovered from thousands of forum posts — with no labels. Click a topic to see the words that define it.",
    help: "Topic modeling reads a pile of documents and discovers recurring themes as clusters of words. LDA is probabilistic; NMF factors the word-count matrix into additive parts. Neither is told the categories.",
  },
  {
    id: "rules", nb: "05", title: "Association Rules", dataset: "Online Retail",
    tagline: "Real market-basket rules from an online store: which products get bought together. Filter by lift to find the strongest.",
    help: "Association rules find items that co-occur in transactions. Lift is the key number: how much more likely two items sell together than by chance. Lift > 1 is a genuine association.",
  },
  {
    id: "about", nb: "", title: "About", dataset: "",
    tagline: "What unsupervised learning is, and what each demo here is showing you.",
    help: "An overview of the five notebooks behind this playground.",
  },
];
