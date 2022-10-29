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
  const gen = magination.load({ cache, cursor: null, hasher });
  expect(await gen.next()).toEqual({
    value: {
      hits: [],
      cursor: null,
      source: emptySource2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("empty and non-empty sources", async () => {
  const magination = new Magination([emptySource1, source1]);

  let gen = magination.load({ cache, cursor: null, hasher });
  let res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, cursor: res.value.cursor, hasher });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["d"],
      cursor: null,
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("two sources without interruption", async () => {
  const magination = new Magination([source1, source2]);

  let gen = magination.load({ cache, cursor: null, hasher });
  let res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["b"],
      cursor: expect.stringMatching(/./),
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, cursor: res.value.cursor, hasher });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["d"],
      cursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["e"],
      cursor: null,
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});

test("two sources with interruption", async () => {
  const magination = new Magination([source1, source2]);

  let gen = magination.load({ cache, cursor: null, hasher });
  let res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["c", "a"],
      cursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });

  gen = magination.load({ cache, cursor: res.value.cursor, hasher });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["b"],
      cursor: expect.stringMatching(/./),
      source: source2,
    },
    done: false,
  });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["d"],
      cursor: expect.stringMatching(/./),
      source: source1,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });

  gen = magination.load({ cache, cursor: res.value.cursor, hasher });
  res = await gen.next();
  expect(res).toEqual({
    value: {
      hits: ["e"],
      cursor: null,
      source: source2,
    },
    done: false,
  });
  expect(await gen.next()).toMatchObject({ done: true });
});
