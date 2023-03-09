import { mockCache, mockSearch } from ".";
import type Hasher from "../Hasher";
import Source from "../Source";

const cache = mockCache();
const hasher: Hasher<string> = (hit) => hit;

test("empty results", async () => {
  const source = new Source("", {
    pageSize: 10,
    preloadSize: 42,
    search: mockSearch<string>([]),
  });
  expect(
    await source.load({ cache, cursor: null, excludeHits: [], hasher })
  ).toEqual({
    hits: [],
    cursor: null,
  });
  expect(
    await source.load({
      cache,
      cursor: "abc:100",
      excludeHits: [],
      hasher,
    })
  ).toEqual({
    hits: [],
    cursor: null,
  });
});

test("less results than page size", async () => {
  const source = new Source("", {
    pageSize: 10,
    preloadSize: 42,
    search: mockSearch<string>(["a", "b"]),
  });
  expect(
    await source.load({ cache, cursor: null, excludeHits: [], hasher })
  ).toEqual({
    hits: ["a", "b"],
    cursor: null,
  });
});

it("more results than page size and there", async () => {
  const source = new Source("", {
    pageSize: 2,
    preloadSize: 42,
    search: mockSearch<string>(["a", "b", "c"], ["a", "d"]),
  });
  const res1 = await source.load({
    cache,
    cursor: null,
    excludeHits: [],
    hasher,
  });
  expect(res1).toEqual({
    hits: ["a", "b"],
    cursor: expect.stringMatching(/^\w+-\d+$/),
  });
  const res2 = await source.load({
    cache,
    cursor: res1.cursor,
    excludeHits: [],
    hasher,
  });
  expect(res2).toEqual({
    hits: ["c", "d"],
    cursor: null,
  });
});

it("external exclusion", async () => {
  const search = mockSearch<string>(["a", "b", "c", "d", "e", "f"], [], []);
  const source = new Source("", {
    pageSize: 2,
    preloadSize: 42,
    search,
  });

  const res1 = await source.load({
    cache,
    cursor: null,
    excludeHits: ["a", "c"],
    hasher,
  });
  expect(res1).toEqual({
    hits: ["b", "d"],
    cursor: expect.stringMatching(/^\w+-\d+$/),
  });

  const res2 = await source.load({
    cache,
    cursor: res1.cursor,
    excludeHits: [],
    hasher,
  });
  expect(res2).toEqual({
    hits: ["e", "f"],
    cursor: expect.stringMatching(/^\w+-\d+$/),
  });

  const res3 = await source.load({
    cache,
    cursor: res2.cursor,
    excludeHits: [],
    hasher,
  });
  expect(res3).toEqual({
    hits: [],
    cursor: expect.stringMatching(/^\w+-\d+$/),
  });

  const res4 = await source.load({
    cache,
    cursor: res3.cursor,
    excludeHits: [],
    hasher,
  });
  expect(res4).toEqual({
    hits: [],
    cursor: null,
  });

  expect(search.calls).toMatchObject([
    { cursor: null, excludeHits: ["a", "c"], count: 42 },
    { cursor: "chunk1", excludeHits: ["b", "d", "e", "f"], count: 42 },
    { cursor: "chunk2", excludeHits: ["b", "d", "e", "f"], count: 42 },
  ]);
});
