import type Cache from "./Cache";
import type Hasher from "./Hasher";
import { buildCursor, parseCursor } from "./internal/helpers";
import type Page from "./Page";

type SourceSlot<THit> = {
  createdAt: number;
  updatedAt: number;
  hits: THit[];
  cursor: string | null;
};

export interface SourceOptions<THit> {
  pageSize: number;
  preloadSize?: number | ((offset: number) => number);
  search: (
    cursor: string | null,
    excludeHits: THit[],
    count: number
  ) => Promise<Page<THit>>;
}

/**
 * Represents a single stream of hits subject for pagination.
 *
 * The idea: we have a cached list of hits loaded so far, and the cursor
 * returned is a position in this cache. On every load() call, we try to extract
 * hits from the cached list and, if we don't have enough of them there, we run
 * exactly one search() request to append-only the list with more hits. We also
 * do exclusion on the hits returned, so they are never repeated.
 */
export default class Source<THit> {
  constructor(
    public readonly name: string,
    private options: SourceOptions<THit>
  ) {}

  async load({
    cache,
    cursor,
    excludeHits,
    hasher,
  }: {
    cache: Cache;
    cursor: string | null;
    excludeHits: THit[];
    hasher: Hasher<THit>;
  }): Promise<Page<THit>> {
    const preloadSize = (offset: number): number =>
      typeof this.options.preloadSize === "function"
        ? this.options.preloadSize(offset)
        : typeof this.options.preloadSize === "number"
        ? this.options.preloadSize
        : this.options.pageSize + 1; // +1 to efficiently detect whether we have more pages
    let [slotKey, pos] = parseCursor(cursor);

    // Load cache slot or create a new empty one.
    const slotRead = pos >= 0 ? await cache.read(slotKey) : null;
    const slot: SourceSlot<THit> = slotRead
      ? (slotRead as unknown as SourceSlot<THit>)
      : {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          hits: [],
          cursor: null,
        };

    // Prevent pos tampering (i.e. if someone passes 1 billion and we loaded
    // only 10 hits so far, fallback to 10).
    pos = Math.min(pos, slot.hits.length);

    const excludeHashes = new Set<string>(
      [...slot.hits.slice(0, pos), ...excludeHits].map((hit) => hasher(hit))
    );

    // Extract hits from the cache starting from pos to form results page.
    const hits: THit[] = [];
    pos = this.extractHits(hits, excludeHashes, hasher, slot.hits, pos);

    // Not enough hits in the cache? If so, load more.
    if (
      slotRead === null ||
      (slot.cursor !== null && hits.length < this.options.pageSize)
    ) {
      const res = await this.options.search(
        slot.cursor,
        [...slot.hits, ...excludeHits],
        preloadSize(pos)
      );
      slot.hits.push(...res.hits);
      slot.cursor = res.cursor;
      slot.updatedAt = Date.now();
      await cache.write(slotKey, slot);
    }

    // Try one more time after we loaded more hits into the cache.
    pos = this.extractHits(hits, excludeHashes, hasher, slot.hits, pos);

    // Return as much as we could extract and load in 1 search request maximum
    // (i.e. we may still have less than 1 page of results returned, although
    // there is a non-null cursor).
    return {
      hits,
      cursor:
        pos < slot.hits.length || slot.cursor !== null
          ? buildCursor(slotKey, pos)
          : null,
    };
  }

  private extractHits(
    outHits: THit[],
    inoutExcludeHashes: Set<string>,
    hasher: Hasher<THit>,
    cachedHits: THit[],
    pos: number
  ): number {
    while (outHits.length < this.options.pageSize && pos < cachedHits.length) {
      const hit = cachedHits[pos];
      const hash = hasher(hit);
      if (!inoutExcludeHashes.has(hash)) {
        outHits.push(hit);
        inoutExcludeHashes.add(hash);
      }

      pos++;
    }

    return pos;
  }
}
