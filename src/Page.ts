/**
 * A chunk of hits and a cursor which allows to fetch more hits. If the cursor
 * is null, there are no more hits left to fetch.
 *
 * An "hit" is typically some metadata about a document, like document id, its
 * type and/or some other small metadata (NOT document's texts for sure).
 */
export default interface Page<THit> {
  hits: THit[];
  cursor: string | null;
  took?: number;
}
