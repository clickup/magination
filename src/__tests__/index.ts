import type Database from "../Cache";
import type Page from "../Page";

/**
 * A simple in-memory database acting like a cache storage.
 */
export function mockCache(): Database {
  const store = new Map<string, object>();
  return {
    read: async (key) => store.get(key) ?? null,
    write: async (key, value) =>
      store.set(key, JSON.parse(JSON.stringify(value))),
    store,
  } as Database;
}

/**
 * Simulates a real search method execution. Chunks represent consequent search
 * responses, and the entire chunk is always returned, independently on how many
 * hits are there. The cursor is the chunk number.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function mockSearch<THit>(...chunks: THit[][]) {
  async function search(
    cursor: string | null,
    excludeHits: THit[],
    count: number
  ): Promise<Page<THit>> {
    search.calls.push({ cursor, excludeHits, count });
    const chunk = cursor !== null ? parseInt(cursor.replace(/\D+/, "")) : 0;
    const excludeHitsStr = new Set(
      excludeHits.map((excl) => JSON.stringify(excl))
    );
    return {
      hits: (chunks[chunk] ?? []).filter(
        (hit) => !excludeHitsStr.has(JSON.stringify(hit))
      ),
      cursor: chunk < chunks.length - 1 ? `chunk${chunk + 1}` : null,
    };
  }

  search.calls = [] as Array<{
    cursor: string | null;
    excludeHits: THit[];
    count: number;
  }>;
  return search;
}
