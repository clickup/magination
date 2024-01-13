@clickup/magination / [Exports](modules.md)

# magination: an opinionated framework to build cursor-based pagination over multiple streams of hits

See also [Full API documentation](https://github.com/clickup/magination/blob/master/docs/modules.md).

![CI run](https://github.com/clickup/magination/actions/workflows/ci.yml/badge.svg?branch=main)

The problem: for some search request (e.g. search-by-keywords), we have multiple
search queries (sources) with different performance that deliver results (hits)
with different relevancy. We want to merge that search hits using "cursor based
pagination pattern" (allowing the user to scroll search results with the mouse).

For example purposes, considering the following 3 kinds of sources:

1. "Full keyword match" query: finds the docs that have their lexems match the
   search keywords exactly. Highest relevancy and performance.
2. "Prefix keyword match" query: considers the search keywords as lexem prefixes
   and finds all of the docs which have the lexems matching that prefixes.
   Moderate relevancy and performance.
3. "Substring trigram match" query: finds docs which have search keywords as
   substrings. Lowest in relevancy and is super-slow.

When producing the cursored stream of pages, we must satisfy the following
requirements:

1. The results must never repeat: if some hit is seen on top, it's never shown
   at the bottom. E.g. if a "full keyword match" query returns document A, and
   the same document A is also returned by "substring trigram match" query, it
   should not be shown the 2nd time.
2. The results must be exhaustive: i.e. eventually, all of the data will be
   returned, irregardless of its cardinality, even when the data is constantly
   appended to the database at some slow rate.
3. The results from the source with highest relevancy should come earlier than
   the results from all other sources (at least for the very 1st set of pages).
   E.g. "full keyword match" source has higher relevancy than "substring trigram
   match", so the data from it should be returned earlier.
4. The order of results should not depend on the performance: i.e. the same
   query run multiple times should produce the same results (considering the
   underlying database hasn't been changed).

Below is a cryptic diagram which illustrates, how it works:

```
source1:     [b, m, n]   |
source2: [a, b, c]       |     [d, e, f]
source3:   [q, r]        |  [s, t]
---------------------------------------------------> time

1. Magination.load():
   -> [b,m,n][a,c][q,r] + cursor
2. Magination.load(cursor):
   -> [d,e,f][s,t] + cursor=null
```

Here, [...] means search results docs from some source, and "|" means that a
search query returns a cursor which allows to re-run it from where it left off.

To guarantee that the docs are never repeated in the resulting stream of pages,
the engine remembers all of the hits previously emitted; they are stored in the
cache. Where possible, it saves the docs hash codes, but for the actual sources,
we store the entire hits, because we may want to return to the previous pages
too (plus, we do "preload-ahead" for sources).
