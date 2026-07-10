import { describe, it, expect } from "vitest";
import { kmeans, dbscan, knnScores, type Pt } from "./cluster";

// small deterministic point sets (no RNG needed)
const gridBlob = (ox: number, oy: number, n = 20, step = 0.005): Pt[] =>
  Array.from({ length: n }, (_, i) => [ox + (i % 5) * step, oy + Math.floor(i / 5) * step]);

describe("kmeans", () => {
  it("splits two well-separated blobs into two consistent clusters", () => {
    const pts = [...gridBlob(0.2, 0.2, 30), ...gridBlob(0.8, 0.8, 30)];
    const labels = kmeans(pts, 2);
    expect(new Set(labels.slice(0, 30)).size).toBe(1); // blob A all one label
    expect(new Set(labels.slice(30)).size).toBe(1);     // blob B all one label
    expect(labels[0]).not.toBe(labels[30]);             // and the two blobs differ
  });
});

describe("dbscan", () => {
  it("finds two dense clusters and labels far-off points as noise (-1)", () => {
    const outliers: Pt[] = [[0.5, 0.05], [0.05, 0.9]];
    const pts = [...gridBlob(0.2, 0.2), ...gridBlob(0.8, 0.8), ...outliers];
    const labels = dbscan(pts, 0.05, 4);
    expect(new Set(labels.filter((l) => l >= 0)).size).toBe(2); // two clusters
    expect(labels[labels.length - 1]).toBe(-1);                 // both outliers are noise
    expect(labels[labels.length - 2]).toBe(-1);
  });
});

describe("knnScores", () => {
  it("gives the planted outlier the highest isolation score", () => {
    const outlier: Pt = [0.95, 0.95];
    const pts = [...gridBlob(0.5, 0.5), outlier];
    const scores = knnScores(pts, 5);
    expect(scores.indexOf(Math.max(...scores))).toBe(pts.length - 1);
  });
});
