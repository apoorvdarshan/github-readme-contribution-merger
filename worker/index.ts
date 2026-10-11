import handler from "../api/merge";
import { handleStarHistory } from "../src/star-history";

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN: string;
}

export default {
  async fetch(request, env, context): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/star-history.svg") {
      return handleStarHistory(request, env.GITHUB_TOKEN, context);
    }

    if (url.pathname !== "/api/merge") {
      return env.ASSETS.fetch(request);
    }

    // Cache rendered graphs at the edge, across Worker isolate lifetimes.
    const cache = (caches as unknown as { default: Cache }).default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    if (request.method === "GET") {
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
    }

    process.env.GITHUB_TOKEN = env.GITHUB_TOKEN;

    const query: Record<string, string | string[]> = {};
    for (const key of new Set(url.searchParams.keys())) {
      const values = url.searchParams.getAll(key);
      query[key] = values.length === 1 ? values[0] : values;
    }

    const headers = new Headers({ "Access-Control-Allow-Origin": "*" });
    let statusCode = 200;
    let body = "";
    const response = {
      setHeader(name: string, value: string) {
        headers.set(name, value);
      },
      status(code: number) {
        statusCode = code;
        return this;
      },
      send(value: string) {
        body = value;
      },
    };

    await handler(
      { method: request.method, query },
      response,
    );

    const result = new Response(body, { status: statusCode, headers });
    if (request.method === "GET" && statusCode === 200 && !headers.has("X-Failed-Users")) {
      context.waitUntil(cache.put(cacheKey, result.clone()));
    }
    return result;
  },
} satisfies ExportedHandler<Env>;
