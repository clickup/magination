import { mockCache, mockSearch } from ".";
import type Hasher from "../Hasher";
import Magination from "../Magination";
import Source from "../Source";

const cache = mockCache();
const hasher: Hasher<string> = (hit) => hit;

const emptySource1 = new Source("emptySource1", {
  pageSize: 10,
  preloadSize: 42,
  search: mockSearch<string>([]),
});

const emptySource2 = new Source("emptySource2", {
  pageSize: 10,
  preloadSize: 42,
  search: mockSearch<string>([]),
});

const source1 = new Source("source1", {
  pageSize: 10,
  preloadSize: 42,
  search: mockSearch<string>(["c", "a"], ["d"]),
});

const source2 = new Source("source2", {
  pageSize: 10,
  preloadSize: 42,
  search: mockSearch<string>(["a", "b"], ["e"]),
});

test("empty sources", async () => {
  const magination = new Magination([emptySource1, emptySource2]);
  const gen = magination.load({ cache, hasher, cursor: null });
  expect(await gen.next()).toEqual({
    value: {
      hits: [],
      cursor: null,
      prevCursor: null,
      source: emptySource2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("empty and non-empty sources", async () => {
  const magination = new Magination([emptySource1, source1]);

  let gen = magination.load({ cache, hasher, cursor: null });
  let res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/./),
      prevCursor: null,
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, hasher, cursor: res.value.cursor });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["d"],
      cursor: null,
      prevCursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("two sources without interruption", async () => {
  const magination = new Magination([source1, source2]);

  let gen = magination.load({ cache, hasher, cursor: null });
  let res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/./),
      prevCursor: null,
      source: source1,
    },
    done: false,
  });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["b"],
      cursor: expect.stringMatching(/./),
      prevCursor: null,
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, hasher, cursor: res.value.cursor });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["d"],
      cursor: expect.stringMatching(/./),
      prevCursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["e"],
      cursor: null,
      prevCursor: expect.stringMatching(/./),
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("two sources with interruption", async () => {
  const magination = new Magination([source1, source2]);

  let gen = magination.load({ cache, hasher, cursor: null });
  const page1 = await gen.next();
  expect(page1).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/1$/),
      prevCursor: null,
      source: source1,
    },
    done: false,
  });

  gen = magination.load({ cache, hasher, cursor: page1.value.cursor });
  const page2 = await gen.next();
  expect(page2).toEqual({
    value: {
      hits: ["b"],
      cursor: expect.stringMatching(/2$/),
      prevCursor: null,
      source: source2,
    },
    done: false,
  });

  const page3 = await gen.next();
  expect(page3).toEqual({
    value: {
      hits: ["d"],
      cursor: expect.stringMatching(/3$/),
      prevCursor: expect.stringMatching(/1$/),
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, hasher, cursor: page3.value.cursor });
  const page4 = await gen.next();
  expect(page4).toEqual({
    value: {
      hits: ["e"],
      cursor: null,
      prevCursor: expect.stringMatching(/2$/),
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({
    cache,
    hasher,
    cursor: page2.value.cursor,
  });
  const page3Again = await gen.next();
  expect(page3Again).toEqual({
    value: {
      hits: ["d"],
      cursor: expect.stringMatching(/3$/),
      prevCursor: expect.stringMatching(/1$/),
      source: source1,
    },
    done: false,
  });

  gen = magination.load({ cache, hasher, cursor: page3Again.value.cursor });
  const page4Again = await gen.next();
  expect(page4Again).toEqual({
    value: {
      hits: ["e"],
      cursor: null,
      prevCursor: expect.stringMatching(/2$/),
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});
