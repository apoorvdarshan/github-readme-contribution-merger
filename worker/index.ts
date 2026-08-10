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

    return new Response(body, { status: statusCode, headers });
  },
} satisfies ExportedHandler<Env>;
