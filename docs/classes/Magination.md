[@clickup/magination](../README.md) / [Exports](../modules.md) / Magination

# Class: Magination\<TSource, THit\>

Represents a union of multiple pagination sources into one continuous pages
stream with cursor.

## Type parameters

| Name | Type |
| :------ | :------ |
| `TSource` | extends [`Source`](Source.md)\<`any`\> |
| `THit` | `TSource` extends [`Source`](Source.md)\<infer THit\> ? `THit` : `never` |

## Constructors

### constructor

• **new Magination**\<`TSource`, `THit`\>(`sources`): [`Magination`](Magination.md)\<`TSource`, `THit`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TSource` | extends [`Source`](Source.md)\<`any`\> |
| `THit` | `TSource` extends [`Source`](Source.md)\<`THit`\> ? `THit` : `never` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `sources` | readonly `TSource`[] |

#### Returns

[`Magination`](Magination.md)\<`TSource`, `THit`\>

#### Defined in

[src/Magination.ts:30](https://github.com/clickup/magination/blob/master/src/Magination.ts#L30)

## Methods

### load

▸ **load**(`«destructured»`): `AsyncGenerator`\<[`Page`](../interfaces/Page.md)\<`THit`\> & \{ `prevCursor`: ``null`` \| `string` ; `source`: `TSource`  }, `any`, `unknown`\>

Returns a finite generator of pages which runs all of the sources in
parallel and then return a page of resulting hits. Basically, loads the
next set of pages starting from the previous page's end cursor and returns
hits along with the new cursor.

- The hits are returned in order of this.sources. I.e., even if some source
  delivers the results quicker than a source before it, that source is
  still awaited first. This allows to achieve a predictable order of
  results, where the top sources are the most relevant ones, but still run
  the search queries in parallel.
- The generator is finite: it stops once it finishes exactly one pass over
  all of the sources. So it's guaranteed that load() runs not more than
  this.sources.length queries in total.
- Each of the returned pages has a cursor, so theoretically, the caller can
  interrupt prematurely and continue later starting from that cursor. But
  typically it's not needed: the caller consumes all of the values and
  remembers just the last cursor of the last page emitted by the generator.
  The interruption is supported for code symmetry reasons mostly.
- The returned hits are dedupped: the same hit is never returned twice. The
  engine tries its best injecting the info about "already seen" hits to
  each of the sources before calling to their load() methods, so those
  sources can do all they can to exclude the "already seen" hits in their
  DB queries with "NOT IN (...)" or similar clauses.
- If null is passed as cursor, starts from the beginning.
- If null is returned in cursor, it means that there are no more pages left
  to load, i.e. it's an end of the stream.
- It's guaranteed that the very last source in the list always yields a
  page, even if it's empty (i.e. load() yields at least one page).

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `cache` | [`Cache`](../interfaces/Cache.md) |
| › `hasher` | [`Hasher`](../interfaces/Hasher.md)\<`THit`\> |
| › `cursor` | ``null`` \| `string` |

#### Returns

`AsyncGenerator`\<[`Page`](../interfaces/Page.md)\<`THit`\> & \{ `prevCursor`: ``null`` \| `string` ; `source`: `TSource`  }, `any`, `unknown`\>

#### Defined in

[src/Magination.ts:68](https://github.com/clickup/magination/blob/master/src/Magination.ts#L68)
