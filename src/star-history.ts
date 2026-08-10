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
  cacheUrl.search = `?theme=${themeName}&v=2`;
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
  const plot = { left: 76, top: 188, right: 904, bottom: 395 };
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
  const commits = [0.27, 0.52, 0.76]
    .map((ratio, index) => {
      const point = samples[Math.round((samples.length - 1) * ratio)];
      const color = ['#39D353', '#58A6FF', '#A371F7'][index];
      return `<g transform="translate(${point[0]} ${point[1]})" filter="url(#pixel-wobble)"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="${color}" stroke="${theme.background}" stroke-width="3"/><path d="M-3 -13 V-22 H4" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="square"/><rect x="2" y="-25" width="6" height="6" rx="1" fill="${color}"/></g>`;
    })
    .join('');
  const dark = themeName === 'dark';
  const panel = dark ? '#161B22' : '#FFFFFF';
  const ink = dark ? '#F0F6FC' : '#1F2328';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">GitHub Readme Contribution Merger star history</title>
  <desc id="description">${stars.length} GitHub stars over time for ${OWNER}/${REPOSITORY}.</desc>
  <defs>
    <linearGradient id="growth-line" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#39D353"/><stop offset=".48" stop-color="#58A6FF"/><stop offset="1" stop-color="#A371F7"/></linearGradient>
    <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#58A6FF" stop-opacity=".25"/><stop offset="1" stop-color="#A371F7" stop-opacity=".015"/></linearGradient>
    <pattern id="cells" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="12" height="12" rx="2" fill="${theme.empty}" opacity=".48"/></pattern>
    <pattern id="paper-grid" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" fill="none" stroke="${theme.grid}" stroke-width=".7" opacity=".35"/></pattern>
    <filter id="pixel-wobble" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="1" seed="31" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale=".45"/></filter>
    <filter id="commit-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="plot"><rect x="${plot.left}" y="${plot.top - 10}" width="${plot.right - plot.left}" height="${plot.bottom - plot.top + 10}"/></clipPath>
    <style>.axis{fill:${theme.muted};font:600 12.5px ui-monospace,SFMono-Regular,monospace}.grid{stroke:${theme.grid};stroke-width:1;stroke-dasharray:3 8}.title{fill:${ink};font:800 23px ui-monospace,SFMono-Regular,monospace}.muted{fill:${theme.muted};font:500 13px ui-monospace,SFMono-Regular,monospace}.tiny{fill:${theme.muted};font:700 10.5px ui-monospace,SFMono-Regular,monospace;letter-spacing:1px}</style>
  </defs>
  <rect width="960" height="520" rx="24" fill="${theme.background}"/>
  <rect x="16" y="16" width="928" height="488" rx="20" fill="${panel}" stroke="${theme.border}" stroke-width="1.5"/>
  <rect x="27" y="27" width="906" height="466" rx="14" fill="url(#paper-grid)" stroke="${theme.border}" stroke-dasharray="4 7"/>
  <g transform="translate(43 34)" filter="url(#pixel-wobble)"><rect width="48" height="45" rx="9" fill="${theme.empty}" stroke="${theme.border}"/><g transform="translate(3 9) scale(.92)">${cells}</g></g>
  <text x="108" y="52" class="title">Two graphs walked into one README.</text>
  <text x="109" y="77" class="muted">The stars merged too.</text>
  <g transform="translate(748 35)" filter="url(#pixel-wobble)"><path d="M14 0 H126 Q140 0 140 14 V39 Q140 52 126 52 H14 Q0 52 0 38 V14 Q0 0 14 0Z" fill="${dark ? '#12251A' : '#EDFAF0'}" stroke="#39D353" stroke-width="1.5" stroke-dasharray="4 3"/><g transform="translate(14 13)" filter="url(#commit-glow)"><rect width="9" height="9" rx="2" fill="#39D353"/><rect x="12" y="0" width="9" height="9" rx="2" fill="#58A6FF"/><rect x="6" y="12" width="9" height="9" rx="2" fill="#A371F7"/></g><text x="48" y="34" fill="${ink}" font-family="ui-monospace,SFMono-Regular,monospace" font-size="21" font-weight="800">${stars.length}</text><text x="98" y="32" class="tiny">STARS</text></g>
  <g transform="translate(322 103)" opacity=".9"><text x="30" y="12" text-anchor="middle" class="tiny">USER A</text><g transform="translate(0 20)">${cells}</g></g>
  <g transform="translate(535 103)" opacity=".9"><text x="30" y="12" text-anchor="middle" class="tiny">USER B</text><g transform="translate(0 20)">${cells}</g></g>
  <path d="M382 132 C418 132 427 145 455 154 M535 132 C501 132 493 145 468 154" fill="none" stroke="${theme.muted}" stroke-width="1.6" stroke-dasharray="3 5"/>
  <g transform="translate(439 147)" filter="url(#pixel-wobble)"><rect width="48" height="25" rx="7" fill="${theme.empty}" stroke="#39D353"/><text x="24" y="17" text-anchor="middle" fill="#39D353" font-family="ui-monospace,SFMono-Regular,monospace" font-size="11" font-weight="800">MERGE</text></g>
  ${yGrid}${labels}
  <g clip-path="url(#plot)"><rect x="${plot.left}" y="${plot.top}" width="${plot.right - plot.left}" height="${plot.bottom - plot.top}" fill="url(#cells)" opacity=".14"/><path d="${area}" fill="url(#growth-area)"/><path d="${path}" fill="none" stroke="#58A6FF" stroke-width="8" opacity=".11"/><path d="${path}" fill="none" stroke="url(#growth-line)" stroke-width="4.2" stroke-linecap="square" filter="url(#pixel-wobble)"/></g>
  ${commits}
  <g transform="translate(${plot.right} ${currentY})" filter="url(#pixel-wobble)"><rect x="-8" y="-8" width="16" height="16" rx="3" fill="#39D353" stroke="${panel}" stroke-width="3"/><path d="M10 -11 H18 V-3 M18 -11 L10 -3" fill="none" stroke="#58A6FF" stroke-width="2"/></g>
  <g transform="translate(60 453)" opacity=".76"><text class="tiny" y="11">INPUTS</text><rect x="55" y="0" width="10" height="10" rx="2" fill="#39D353"/><rect x="69" y="0" width="10" height="10" rx="2" fill="#58A6FF"/><path d="M86 5 H111" stroke="${theme.muted}" stroke-width="1.6" stroke-dasharray="3 3"/><text x="121" y="10" class="tiny">ONE SVG</text></g>
  <g transform="translate(783 451)" opacity=".72" filter="url(#pixel-wobble)"><path d="M0 14 H23 M17 8 L23 14 L17 20" fill="none" stroke="#A371F7" stroke-width="2"/><rect x="31" y="8" width="12" height="12" rx="2" fill="#39D353"/><rect x="47" y="8" width="12" height="12" rx="2" fill="#58A6FF"/><rect x="63" y="8" width="12" height="12" rx="2" fill="#A371F7"/></g>
</svg>`;
}

function niceMaximum(value: number): number {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 20) return Math.ceil(value / 5) * 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const step = magnitude * (fraction <= 1.25 ? 0.25 : 0.5);
  return Math.ceil(value / step) * step;
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
