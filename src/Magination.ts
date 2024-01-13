import flatten from "lodash/flatten";
import keyBy from "lodash/keyBy";
import last from "lodash/last";
import mapValues from "lodash/mapValues";
import type Cache from "./Cache";
import type Hasher from "./Hasher";
import { buildCursor, parseCursor } from "./internal/helpers";
import type Page from "./Page";
import type Source from "./Source";

type MaginationSlot = {
  createdAt: number;
  caches: Record<string, object | undefined>;
  frames: Array<{
    hitHashes: string[];
    cursors: Record<string, string | null>;
  }>;
};

/**
 * Represents a union of multiple pagination sources into one continuous pages
 * stream with cursor.
 */
export default class Magination<
  TSource extends Source<any>,
  THit = TSource extends Source<infer THit> ? THit : never,
> {
  private sources;

  constructor(sources: readonly TSource[]) {
    if (sources.length === 0) {
      throw Error("Magination requires at least one Source to be passed");
    }

    this.sources = keyBy(sources, (source) => source.name);
  }

  /**
   * Returns a finite generator of pages which runs all of the sources in
   * parallel and then return a page of resulting hits. Basically, loads the
   * next set of pages starting from the previous page's end cursor and returns
   * hits along with the new cursor.
   *
   * - The hits are returned in order of this.sources. I.e., even if some source
   *   delivers the results quicker than a source before it, that source is
   *   still awaited first. This allows to achieve a predictable order of
   *   results, where the top sources are the most relevant ones, but still run
   *   the search queries in parallel.
   * - The generator is finite: it stops once it finishes exactly one pass over
   *   all of the sources. So it's guaranteed that load() runs not more than
   *   this.sources.length queries in total.
   * - Each of the returned pages has a cursor, so theoretically, the caller can
   *   interrupt prematurely and continue later starting from that cursor. But
   *   typically it's not needed: the caller consumes all of the values and
   *   remembers just the last cursor of the last page emitted by the generator.
   *   The interruption is supported for code symmetry reasons mostly.
   * - The returned hits are dedupped: the same hit is never returned twice. The
   *   engine tries its best injecting the info about "already seen" hits to
   *   each of the sources before calling to their load() methods, so those
   *   sources can do all they can to exclude the "already seen" hits in their
   *   DB queries with "NOT IN (...)" or similar clauses.
   * - If null is passed as cursor, starts from the beginning.
   * - If null is returned in cursor, it means that there are no more pages left
   *   to load, i.e. it's an end of the stream.
   * - It's guaranteed that the very last source in the list always yields a
   *   page, even if it's empty (i.e. load() yields at least one page).
   */
  async *load({
    cache,
    hasher,
    cursor,
  }: {
    cache: Cache;
    hasher: Hasher<THit>;
    cursor: string | null;
  }): AsyncGenerator<
    Page<THit> & { prevCursor: string | null; source: TSource }
  > {
    let [slotKey, num] = parseCursor(cursor);

    // Load cache slot with info about all sources' cursors.
    const slotRead = await cache.read(slotKey);
    const slot: MaginationSlot = slotRead
      ? (slotRead as unknown as MaginationSlot)
      : {
          createdAt: Date.now(),
          caches: {},
          frames: [
            {
              hitHashes: [],
              cursors: mapValues(this.sources, () => null),
            },
          ],
        };

    // If it's an unknown cursor in this cache slot, fallback to the last one.
    num = Math.min(num, slot.frames.length - 1);

    const frame = slot.frames[num];
    if (Object.keys(frame.cursors).length === 0) {
      yield {
        hits: [],
        cursor: null,
        prevCursor: num > 2 ? buildCursor(slotKey, num - 2) : null,
        source: last(Object.values(this.sources))!,
      };
      return;
    }

    // Run all sources in parallel and let them store their caches into the
    // current (single) cache slot.
    const promises = Object.entries(
      mapValues(frame.cursors, async (cursor, name) =>
        this.sources[name].load({
          cache: {
            read: async (key) => slot.caches[key] ?? null,
            write: async (key, value) => (slot.caches[key] = value),
          },
          cursor,
          excludeHits: [],
          hasher,
        }),
      ),
    );

    const excludeHashes = new Set(
      flatten(slot.frames.slice(0, num + 1).map((frame) => frame.hitHashes)),
    );

    // Yield pages in order of sources. On each yield, remember all of the
    // sources' cursors and union them under a new meta-cursor `num`.
    const cursors = { ...frame.cursors };
    for (const [i, [name, promise]] of promises.entries()) {
      const res = await promise;
      num++;

      // Move the current source's cursor to the tail of all sources by deleting
      // it and re-adding, so if we're interrupted here, we'll continue from the
      // source which we left off. Skip if this source is exhausted, so
      // eventually, we'll finish when we have no sources in cursors object.
      delete cursors[name];
      if (res.cursor !== null) {
        cursors[name] = res.cursor;
      }

      // Append only hits which we haven't seen before.
      const hits: THit[] = [];
      const hitHashes: string[] = [];
      for (const hit of res.hits) {
        const hash = hasher(hit);
        if (!excludeHashes.has(hash)) {
          hits.push(hit);
          hitHashes.push(hash);
          excludeHashes.add(hash);
        }
      }

      slot.frames[num] = {
        hitHashes,
        cursors: { ...cursors },
      };
      await cache.write(slotKey, slot);

      if (hits.length > 0 || i === promises.length - 1) {
        yield {
          hits,
          cursor:
            Object.keys(cursors).length > 0 ? buildCursor(slotKey, num) : null,
          prevCursor: num > 2 ? buildCursor(slotKey, num - 2) : null,
          source: this.sources[name],
        };
      }
    }
  }
}
