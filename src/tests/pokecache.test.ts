import { test, expect } from "vitest";
import { Cache } from "./../pokecache.js";

test.concurrent.each([
  {
    key: "https://example.com",
    val: "testdata",
    interval: 500, // 1/2 second
  },
  {
    key: "https://example.com/path",
    val: "moretestdata",
    interval: 1000, // 1 second
  },
])("Testing Caching $interval ms", async ({ key, val, interval }) => {
  const cache = new Cache(interval);

  cache.add(key, val);
  const cached = cache.get(key);
  expect(cached).toBe(val);

  // Increase timeout to be more generous with Node.js event loop timing
  await new Promise((resolve) => setTimeout(resolve, interval * 2 + 500)); // Added 500ms buffer
  const reaped = cache.get(key);
  expect(reaped).toBe(undefined);

  cache.stopReapLoop();
});
