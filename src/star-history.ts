const OWNER = 'apoorvdarshan';
const REPOSITORY = 'github-readme-contribution-merger';
const ONE_DAY = 86_400_000;
const CACHE_SECONDS = 21_600;

type ThemeName = 'light' | 'dark';

const themes = {
  dark: {
    background: '#0D1117',
    border: '#30363D',
    grid: '#21262D',
    text: '#F0F6FC',
    muted: '#8B949E',
    empty: '#161B22',
  },
  light: {
    background: '#FFFFFF',
    border: '#D0D7DE',
    grid: '#D8DEE4',
    text: '#1F2328',
    muted: '#656D76',
    empty: '#EBEDF0',
  },
};

export async function handleStarHistory(
  request: Request,
  token: string,
  context: ExecutionContext,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const url = new URL(request.url);
  const themeName: ThemeName = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  const cacheUrl = new URL(url);
  cacheUrl.search = `?theme=${themeName}&v=1`;
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);

  if (cached) {
    return request.method === 'HEAD'
      ? new Response(null, { status: cached.status, headers: cached.headers })
      : cached;
  }

  try {
    const stars = await fetchStarHistory(token);
    const response = svgResponse(renderStarHistory(stars, themeName), 200, CACHE_SECONDS);
    context.waitUntil(cache.put(cacheKey, response.clone()));

    return request.method === 'HEAD'
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  } catch (error) {
    console.error('Unable to render contribution merger star history', error);
    const response = svgResponse(renderError(themeName), 503, 60);
    return request.method === 'HEAD'
      ? new Response(null, { status: response.status, headers: response.headers })
      : response;
  }
}

async function fetchStarHistory(token: string): Promise<string[]> {
  if (!token) throw new Error('GITHUB_TOKEN is not configured');

  const stars: string[] = [];

  for (let page = 1; page <= 100; page += 1) {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPOSITORY}/stargazers?per_page=100&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github.star+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'github-contribution-merger-star-history',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

    const payload = (await response.json()) as Array<{ starred_at?: string }>;
    if (!Array.isArray(payload)) throw new Error('GitHub returned an unexpected response');

    for (const item of payload) {
      if (typeof item.starred_at === 'string') stars.push(item.starred_at);
    }

    if (payload.length < 100) break;
    if (page === 100) throw new Error('Star history exceeded the pagination limit');
  }

  return stars.sort((left, right) => left.localeCompare(right));
}

function renderStarHistory(starredAtValues: string[], themeName: ThemeName): string {
  const theme = themes[themeName];
  const width = 960;
  const height = 520;
  const plot = { left: 76, top: 148, right: 904, bottom: 424 };
  const now = Date.now();
  const stars = starredAtValues
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  const start = Math.min((stars[0] ?? now) - ONE_DAY, now - 30 * ONE_DAY);
  const end = Math.max(now, start + ONE_DAY);
  const maximum = niceMaximum(Math.max(stars.length, 1));
  const x = (timestamp: number) =>
    plot.left + ((timestamp - start) / (end - start)) * (plot.right - plot.left);
  const y = (count: number) =>
    plot.bottom - (count / maximum) * (plot.bottom - plot.top);
  let starIndex = 0;
  const samples = ticks(start, end, 52).map((timestamp) => {
    while (starIndex < stars.length && stars[starIndex] <= timestamp) starIndex += 1;
    return [x(timestamp), y(starIndex)] as const;
  });
  const path = smoothPath(samples);
  const area = `${path} L${plot.right} ${plot.bottom} L${plot.left} ${plot.bottom} Z`;
  const yGrid = numberTicks(maximum, 6)
    .map((value) => {
      const position = y(value);
      return `<line x1="${plot.left}" y1="${position}" x2="${plot.right}" y2="${position}" class="grid"/><text x="${plot.left - 16}" y="${position + 5}" text-anchor="end" class="axis">${value}</text>`;
    })
    .join('');
  const labels = ticks(start, end, 4)
    .map((timestamp, index, values) => {
      const anchor = index === 0 ? 'start' : index === values.length - 1 ? 'end' : 'middle';
      const label = new Intl.DateTimeFormat('en', {
        month: 'short',
        ...(end - start >= 365 * ONE_DAY ? { year: 'numeric' } : { day: 'numeric' }),
        timeZone: 'UTC',
      }).format(new Date(timestamp));
      return `<text x="${x(timestamp)}" y="${plot.bottom + 38}" text-anchor="${anchor}" class="axis">${label}</text>`;
    })
    .join('');
  const cells = [0, 1, 3, 4, 7, 9, 10, 12, 13, 14]
    .map((index) => {
      const column = index % 5;
      const row = Math.floor(index / 5);
      const fills = ['#0E4429', '#006D32', '#26A641', '#39D353'];
      return `<rect x="${column * 9}" y="${row * 9}" width="7" height="7" rx="1.5" fill="${fills[(index + column) % fills.length]}"/>`;
    })
    .join('');
  const currentY = y(stars.length);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">GitHub Readme Contribution Merger star history</title>
  <desc id="description">${stars.length} GitHub stars over time for ${OWNER}/${REPOSITORY}.</desc>
  <defs>
    <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#26A641"/><stop offset=".62" stop-color="#39D353"/><stop offset="1" stop-color="#58A6FF"/></linearGradient>
    <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#39D353" stop-opacity=".24"/><stop offset="1" stop-color="#39D353" stop-opacity="0"/></linearGradient>
    <pattern id="cells" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="12" height="12" rx="2" fill="${theme.empty}" opacity=".45"/></pattern>
    <clipPath id="plot"><rect x="${plot.left}" y="${plot.top - 10}" width="${plot.right - plot.left}" height="${plot.bottom - plot.top + 10}"/></clipPath>
    <style>.axis{fill:${theme.muted};font:500 13px ui-monospace,SFMono-Regular,monospace}.grid{stroke:${theme.grid};stroke-width:1;stroke-dasharray:2 8}.title{fill:${theme.text};font:700 17px ui-monospace,SFMono-Regular,monospace}.muted{fill:${theme.muted};font:500 13px ui-sans-serif,-apple-system,sans-serif}.eyebrow{fill:${theme.muted};font:650 11px ui-monospace,SFMono-Regular,monospace;letter-spacing:1.4px}</style>
  </defs>
  <rect x=".5" y=".5" width="959" height="519" rx="14" fill="${theme.background}" stroke="${theme.border}"/>
  <g transform="translate(42 34)"><rect width="54" height="45" rx="8" fill="${theme.empty}" stroke="${theme.border}"/><g transform="translate(6 9)">${cells}</g></g>
  <text x="114" y="49" class="title">contribution-merger / stars</text>
  <text x="114" y="72" class="muted">Many graphs. One shared signal.</text>
  <text x="${plot.right}" y="42" text-anchor="end" class="eyebrow">MERGED TOTAL</text>
  <text x="${plot.right}" y="78" text-anchor="end" fill="${theme.text}" font-family="ui-monospace,SFMono-Regular,monospace" font-size="34" font-weight="720">${stars.length}<tspan dx="9" fill="${theme.muted}" font-size="14" font-weight="600">STARS</tspan></text>
  <line x1="${plot.left}" y1="114" x2="${plot.right}" y2="114" stroke="${theme.border}"/>
  ${yGrid}${labels}
  <g clip-path="url(#plot)"><rect x="${plot.left}" y="${plot.top}" width="${plot.right - plot.left}" height="${plot.bottom - plot.top}" fill="url(#cells)" opacity=".18"/><path d="${area}" fill="url(#growth-area)"/><path d="${path}" fill="none" stroke="url(#growth-line)" stroke-width="4" stroke-linecap="square"/></g>
  <rect x="${plot.right - 6}" y="${currentY - 6}" width="12" height="12" rx="2.5" fill="#39D353" stroke="${theme.background}" stroke-width="3"/>
  <line x1="${plot.left}" y1="${plot.bottom}" x2="${plot.right}" y2="${plot.bottom}" stroke="${theme.border}"/>
</svg>`;
}

function niceMaximum(value: number): number {
  if (value <= 5) return 5;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  return ([1, 1.25, 2, 2.5, 5, 10].find((candidate) => candidate >= fraction) ?? 10) * exponent;
}

function ticks(start: number, end: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => start + ((end - start) / (count - 1)) * index);
}

function numberTicks(maximum: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => Math.round((maximum / (count - 1)) * index));
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>): string {
  return points.reduce((path, [x, y], index) => {
    if (index === 0) return `M${x.toFixed(2)} ${y.toFixed(2)}`;
    const [previousX, previousY] = points[index - 1];
    const controlX = (previousX + x) / 2;
    return `${path} C${controlX.toFixed(2)} ${previousY.toFixed(2)} ${controlX.toFixed(2)} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }, '');
}

function svgResponse(svg: string, status: number, cacheSeconds: number): Response {
  return new Response(svg, {
    status,
    headers: {
      'Cache-Control': `public, max-age=3600, s-maxage=${cacheSeconds}, stale-if-error=86400`,
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function renderError(themeName: ThemeName): string {
  const theme = themes[themeName];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="180" viewBox="0 0 960 180" role="img" aria-label="Star history is temporarily unavailable"><rect x=".5" y=".5" width="959" height="179" rx="14" fill="${theme.background}" stroke="${theme.border}"/><text x="48" y="80" fill="${theme.text}" font-family="ui-monospace,SFMono-Regular,monospace" font-size="23" font-weight="700">Star cells are refreshing</text><text x="48" y="118" fill="${theme.muted}" font-family="ui-sans-serif,-apple-system,sans-serif" font-size="17">The merged history will return shortly.</text></svg>`;
}
