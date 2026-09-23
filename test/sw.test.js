// Runs src/sw.js against in-memory fakes of the service worker globals.

import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://example.test";
const BASE = `${ORIGIN}/Lifting_Tracker/`;
const source = readFileSync(new URL("../src/sw.js", import.meta.url), "utf8");

// Minimal Cache Storage keyed by absolute URL.
function fakeCaches() {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const key = (req) => new URL(typeof req === "string" ? req : req.url, BASE).href;
    return {
      put: async (req, res) => void store.set(key(req), res),
      match: async (req) => store.get(key(req))?.clone(),
      addAll: async (reqs) => {
        for (const r of reqs) store.set(key(r), new Response(`precached ${key(r)}`));
      },
    };
  };
  return {
    stores,
    open,
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (req) => {
      for (const name of stores.keys()) {
        const hit = await (await open(name)).match(req);
        if (hit) return hit;
      }
    },
  };
}

function loadWorker(fetchImpl) {
  const listeners = {};
  const caches = fakeCaches();
  const self = {
    location: new URL(`${BASE}sw.js`),
    addEventListener: (type, fn) => (listeners[type] = fn),
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  runInNewContext(source.replaceAll("__CACHE_VERSION__", "test"), {
    self,
    caches,
    fetch: fetchImpl,
    Request: class {
      constructor(url) {
        this.url = new URL(url, BASE).href;
      }
    },
    URL,
    setTimeout: (...args) => setTimeout(...args), // late-bound so fake timers apply
    clearTimeout: (...args) => clearTimeout(...args),
    Promise,
  });
  const dispatch = async (type, extra = {}) => {
    let waited;
    let responded;
    listeners[type]({
      ...extra,
      waitUntil: (p) => (waited = p),
      respondWith: (p) => (responded = p),
    });
    await waited;
    return responded;
  };
  const navigate = (path) =>
    dispatch("fetch", { request: { method: "GET", mode: "navigate", url: BASE + path } });
  return { caches, dispatch, navigate };
}

const pageText = async (res) => (await res).text();

describe("service worker", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.useRealTimers());

  it("serves the fresh page when online and caches it", async () => {
    const fetch = vi.fn(async () => new Response("v2"));
    const sw = loadWorker(fetch);
    await sw.dispatch("install");
    expect(await pageText(sw.navigate(""))).toBe("v2");
    expect(fetch.mock.calls.at(-1)[1]).toMatchObject({ cache: "no-cache" });
    // Offline afterwards: the page that last loaded comes back.
    const offline = loadWorker(async () => {
      throw new TypeError("offline");
    });
    offline.caches.stores.set("gym-test", sw.caches.stores.get("gym-test"));
    expect(await pageText(offline.navigate("index.html"))).toBe("v2");
  });

  it("falls back to the precached page with no network", async () => {
    const sw = loadWorker(async (req) => {
      if (typeof req === "string" && req.endsWith("sw.js")) return new Response("");
      throw new TypeError("offline");
    });
    await sw.dispatch("install");
    expect(await pageText(sw.navigate(""))).toBe(`precached ${BASE}index.html`);
  });

  it("gives up on a stalled network after the timeout", async () => {
    const sw = loadWorker(() => new Promise(() => {})); // never answers
    await sw.dispatch("install");
    vi.useFakeTimers();
    const res = sw.navigate("");
    await vi.advanceTimersByTimeAsync(4000);
    expect(await pageText(res)).toBe(`precached ${BASE}index.html`);
  });

  it("clears caches from older releases on activate", async () => {
    const sw = loadWorker(async () => new Response("x"));
    sw.caches.stores.set("gym-17", new Map());
    await sw.dispatch("install");
    await sw.dispatch("activate");
    expect([...sw.caches.stores.keys()]).toEqual(["gym-test"]);
  });
});
