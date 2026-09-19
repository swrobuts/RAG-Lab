"""PCA der 346 Chunk-Vektoren auf zwei Dimensionen; die Matrix wird mitgeliefert, damit der Browser Fragen projiziert."""
import numpy as np
from sklearn.decomposition import PCA
from fall import lese, schreibe, rund
chunks = lese("chunks.json")["chunks"]
M = np.array([c["v"] for c in chunks], dtype=np.float64)
pca = PCA(n_components=2, random_state=0).fit(M)
P = pca.transform(M)
schreibe("projektion.json", {"verfahren": "PCA (scikit-learn), zentriert, zwei Komponenten",
    "mittel": rund(pca.mean_, 5), "komponenten": [rund(k, 5) for k in pca.components_],
    "varianz": rund(pca.explained_variance_ratio_, 4),
    "punkte": [{"id": c["id"], "x": round(float(x), 4), "y": round(float(y), 4)} for c, (x, y) in zip(chunks, P)]})
print("erklärte Varianz:", rund(pca.explained_variance_ratio_, 4))
