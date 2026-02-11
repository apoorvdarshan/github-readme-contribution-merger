import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { MergeMode } from '../src/types';
import { fetchMultipleUsers } from '../src/github';
import { mergeContributions } from '../src/merger';
import { renderSvg, renderErrorSvg } from '../src/svg';
import { cacheGet, cacheSet } from '../src/cache';
import { THEME_NAMES } from '../src/themes';

const USERNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const MAX_USERS = 10;
const VALID_MODES: MergeMode[] = ['sum', 'overlay'];

function parseUsernames(req: VercelRequest): string[] {
  const usernames: string[] = [];

  // Check `users` param (comma-separated)
  const usersParam = req.query.users;
  if (usersParam) {
    const raw = Array.isArray(usersParam) ? usersParam[0] : usersParam;
    usernames.push(...raw.split(',').map((u) => u.trim()).filter(Boolean));
  }

  // Check `user1`, `user2`, etc.
  for (let i = 1; i <= MAX_USERS; i++) {
    const param = req.query[`user${i}`];
    if (param) {
      const raw = Array.isArray(param) ? param[0] : param;
      const trimmed = raw.trim();
      if (trimmed) usernames.push(trimmed);
    }
  }

  // Deduplicate while preserving order
  return [...new Set(usernames)];
}

function respondSvg(res: VercelResponse, svg: string, status: number = 200): void {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', status === 200
    ? 'public, max-age=300, s-maxage=300'
    : 'no-cache'
  );
  res.status(status).send(svg);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    respondSvg(res, renderErrorSvg('Method not allowed. Use GET.'), 405);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    respondSvg(res, renderErrorSvg('Server misconfigured: GITHUB_TOKEN not set.'), 500);
    return;
  }

  // Parse usernames
  const usernames = parseUsernames(req);
  if (usernames.length < 2) {
    respondSvg(
      res,
      renderErrorSvg('At least 2 usernames required. Use ?users=user1,user2 or ?user1=...&user2=...'),
      400
    );
    return;
  }
  if (usernames.length > MAX_USERS) {
    respondSvg(res, renderErrorSvg(`Maximum ${MAX_USERS} users allowed.`), 400);
    return;
  }

  // Validate username format
  for (const username of usernames) {
    if (!USERNAME_REGEX.test(username) || username.length > 39) {
      respondSvg(res, renderErrorSvg(`Invalid GitHub username: "${username}"`), 400);
      return;
    }
  }

  // Parse mode
  const modeParam = Array.isArray(req.query.mode) ? req.query.mode[0] : req.query.mode;
  const mode: MergeMode = VALID_MODES.includes(modeParam as MergeMode)
    ? (modeParam as MergeMode)
    : 'sum';

  // Parse theme — in overlay mode, only dark themes are allowed
  const themeParam = Array.isArray(req.query.theme) ? req.query.theme[0] : req.query.theme;
  const OVERLAY_THEMES = ['github', 'github-dark', 'blue-dark', 'purple-dark', 'orange-dark'];
  const allowedThemes = mode === 'overlay' ? OVERLAY_THEMES : THEME_NAMES;
  const theme = allowedThemes.includes(themeParam ?? '') ? themeParam! : 'github';

  // Check SVG cache
  const svgCacheKey = `svg:${usernames.join(',')}:${mode}:${theme}`;
  const cachedSvg = cacheGet<string>(svgCacheKey);
  if (cachedSvg) {
    respondSvg(res, cachedSvg);
    return;
  }

  // Fetch contributions
  const { fulfilled, errors } = await fetchMultipleUsers(usernames, token);

  if (fulfilled.length === 0) {
    const errorMessages = errors.map((e) => `${e.username}: ${e.error}`).join('; ');
    respondSvg(res, renderErrorSvg(`Failed to fetch all users. ${errorMessages}`), 502);
    return;
  }

  // Merge and render
  const merged = mergeContributions(fulfilled);
  const svg = renderSvg(merged, {
    mode,
    theme,
    usernames: fulfilled.map((u) => u.username),
  });

  cacheSet(svgCacheKey, svg);
  respondSvg(res, svg);
}
