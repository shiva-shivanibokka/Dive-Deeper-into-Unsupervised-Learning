"use client";

import { useEffect, useState } from "react";

// Fetch a JSON file once, with proper error handling: checks response.ok, catches
// network/parse failures, and ignores late responses after unmount. Returns
// { data: null, error: false } while loading, then either data or error: true.
export function useJson<T>(url: string): { data: T | null; error: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
        return r.json();
      })
      .then((d: T) => { if (alive) setData(d); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [url]);

  return { data, error };
}
