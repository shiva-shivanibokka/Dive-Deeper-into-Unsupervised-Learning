# Generate the precomputed JSON the web tabs load: MNIST projections, topics, association rules.
# Runnable from anywhere — all paths are resolved relative to this file, not the current directory.
import json, os, warnings, numpy as np
from pathlib import Path
warnings.filterwarnings('ignore')

ROOT = Path(__file__).resolve().parents[1]   # web/export_data.py -> repo root
OUT = str(ROOT / 'web' / 'public')
DATA = ROOT / 'data'
os.makedirs(OUT, exist_ok=True)
os.makedirs(DATA, exist_ok=True)
RS = 42

# ---------------------------------------------------------------- 1) PROJECTION (MNIST)
print("Building projection.json (MNIST PCA/t-SNE/UMAP)...")
from sklearn.datasets import fetch_openml
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
import umap

X_all, y_all = fetch_openml('mnist_784', version=1, return_X_y=True, as_frame=False, parser='auto')
from sklearn.model_selection import train_test_split
X, _, y, _ = train_test_split(X_all.astype('float32'), y_all.astype(int),
                              train_size=900, random_state=RS, stratify=y_all)
Xs = StandardScaler().fit_transform(X)

pca2 = PCA(n_components=2, random_state=RS).fit_transform(Xs)
pca50 = PCA(n_components=50, random_state=RS).fit_transform(Xs)   # pre-reduce for t-SNE/UMAP
tsne2 = TSNE(n_components=2, perplexity=30, random_state=RS, init='pca').fit_transform(pca50)
umap2 = umap.UMAP(n_components=2, random_state=RS, n_neighbors=15, min_dist=0.1).fit_transform(pca50)

def norm01(a):
    a = np.asarray(a, dtype=float)
    mn, mx = a.min(0), a.max(0)
    return ((a - mn) / (mx - mn + 1e-9)).round(4)

projection = {
    'labels': y.tolist(),
    'methods': {
        'PCA':  norm01(pca2).tolist(),
        't-SNE': norm01(tsne2).tolist(),
        'UMAP': norm01(umap2).tolist(),
    },
    'note': '900 MNIST digits, each projected to 2D three ways. Coordinates normalized to [0,1].',
}
json.dump(projection, open(f'{OUT}/projection.json', 'w'))
print(f"  wrote projection.json ({len(y)} points)")

# ---------------------------------------------------------------- 2) TOPICS (20 Newsgroups)
print("Building topics.json (LDA + NMF)...")
from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation, NMF

cats = ['rec.autos', 'sci.med', 'comp.graphics', 'talk.politics.guns']
news = fetch_20newsgroups(subset='all', categories=cats,
                          remove=('headers', 'footers', 'quotes'), random_state=RS)
docs = news.data

cv = CountVectorizer(min_df=5, max_df=0.95, stop_words='english', max_features=5000)
dtm = cv.fit_transform(docs)
cv_vocab = cv.get_feature_names_out()

tf = TfidfVectorizer(min_df=5, max_df=0.95, stop_words='english', max_features=5000)
dtm_tf = tf.fit_transform(docs)
tf_vocab = tf.get_feature_names_out()

def top_words(model, vocab, n=10):
    out = []
    for comp in model.components_:
        idx = comp.argsort()[-n:][::-1]
        w = comp[idx]
        w = (w / w.max()).round(3)
        out.append([[vocab[i], float(wi)] for i, wi in zip(idx, w)])
    return out

lda = LatentDirichletAllocation(n_components=4, max_iter=30, learning_method='online', random_state=RS)
lda.fit(dtm)
nmf = NMF(n_components=4, init='nndsvda', random_state=RS, max_iter=400)
nmf.fit(dtm_tf)

topics = {
    'categories': cats,
    'models': {
        'LDA (word counts)': top_words(lda, cv_vocab),
        'NMF (TF-IDF)':      top_words(nmf, tf_vocab),
    },
    'note': 'Four topics discovered without labels from 20 Newsgroups (autos, medicine, graphics, guns).',
}
json.dump(topics, open(f'{OUT}/topics.json', 'w'))
print("  wrote topics.json")

# ---------------------------------------------------------------- 3) RULES (Online Retail)
print("Building rules.json (Apriori association rules)...")
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

retail_path = DATA / 'online_retail.xlsx'
if not retail_path.exists():
    print("  downloading Online Retail from UCI (~23 MB, one-time)...")
    import urllib.request
    urllib.request.urlretrieve(
        'https://archive.ics.uci.edu/ml/machine-learning-databases/00352/Online%20Retail.xlsx',
        retail_path)
df = pd.read_excel(retail_path)
df['InvoiceNo'] = df['InvoiceNo'].astype(str)
df = df[~df['InvoiceNo'].str.startswith('C')]
df = df.dropna(subset=['Description'])
df = df[df['Quantity'] > 0]
df['Description'] = df['Description'].str.strip()

country = 'France'
basket = (df[df['Country'] == country]
          .groupby(['InvoiceNo', 'Description'])['Quantity'].sum().unstack().fillna(0) > 0)
freq = apriori(basket, min_support=0.03, use_colnames=True)
rules = association_rules(freq, metric='lift', min_threshold=1.0)

# Keep readable rules only (<=2 items on the left, exactly 1 on the right)
rules = rules[(rules['antecedents'].apply(len) <= 2) & (rules['consequents'].apply(len) == 1)].copy()

# Stratified sample across lift bins so the lift filter is actually meaningful
# (otherwise the top-N-by-lift are all clustered at high lift and the slider does nothing).
bin_edges = [1, 2, 3, 5, 8, 12, 18, 1e9]
picked = []
for lo, hi in zip(bin_edges[:-1], bin_edges[1:]):
    grp = rules[(rules['lift'] >= lo) & (rules['lift'] < hi)].sort_values('lift', ascending=False)
    picked.append(grp.head(14))
sample = pd.concat(picked).sort_values('lift', ascending=False).reset_index(drop=True)

rules_out = [{
    'antecedents': sorted(list(r.antecedents)),
    'consequents': sorted(list(r.consequents)),
    'support': round(float(r.support), 4),
    'confidence': round(float(r.confidence), 4),
    'lift': round(float(r.lift), 2),
} for r in sample.itertuples()]

json.dump({'country': country, 'rules': rules_out,
           'note': f'{len(rules_out)} association rules from {basket.shape[0]} {country} invoices, '
                   f'spanning lift {rules_out[-1]["lift"]}x to {rules_out[0]["lift"]}x.'},
          open(f'{OUT}/rules.json', 'w'))
print(f"  wrote rules.json ({len(rules_out)} rules)")

print("\nAll web data exported to", OUT)
for f in ['projection.json', 'topics.json', 'rules.json']:
    print(f"  {f}: {os.path.getsize(f'{OUT}/{f}')//1024} KB")
