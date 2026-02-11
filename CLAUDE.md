# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**github-readme-contribution-merger** — A serverless tool that fetches GitHub contribution data for multiple users, merges it, and renders a combined SVG heatmap. Deployed on Vercel at `https://github-contribution-merger.vercel.app/api/merge?users=user1,user2`. Repository is at https://github.com/apoorvdarshan/github-readme-contribution-merger.

## Commands

- `npm install` — install dependencies
- `npm run build` or `npm run typecheck` — run TypeScript type checking (`tsc --noEmit`)
- `npx vercel dev` — start local development server (landing page at `http://localhost:3000`, API at `http://localhost:3000/api/merge`)

## Architecture

### Backend (TypeScript, serverless)

```
api/merge.ts    → Vercel serverless entry point (param parsing, validation, caching, error SVGs)
src/types.ts    → Shared TypeScript interfaces (ContributionDay, MergedDay, ThemeColors, RenderOptions, etc.)
src/github.ts   → GitHub GraphQL API client; fetchMultipleUsers() uses Promise.allSettled() for parallel fetching
src/merger.ts   → Contribution merging logic (groups by date into Map, sums counts, tracks per-user breakdowns)
src/svg.ts      → SVG heatmap generator via template literals (sum/overlay modes, tooltips, legends)
src/cache.ts    → In-memory Map-based cache with 5-min TTL, max 100 entries, auto-eviction
src/themes.ts   → Color theme definitions + HSL-based intensity level generation (4 levels per color)
```

### Frontend (single file, zero frameworks)

```
public/index.html → Landing page with interactive builder (all HTML, CSS, JS in one file, Space Mono font)
public/github-readme-og.png → Open Graph image for social sharing
```

### Request flow

1. `api/merge.ts` parses & validates query params → checks SVG cache
2. `src/github.ts` fetches per-user contribution data (individually cached) via GraphQL
3. `src/merger.ts` merges all users' contributions by date
4. `src/themes.ts` resolves theme — custom `colors` param overrides named `theme`
5. `src/svg.ts` renders final SVG heatmap
6. Response cached at 3 layers: Vercel CDN (`s-maxage`), in-memory SVG, in-memory per-user data

## Key Constraints

- **Zero external runtime dependencies** beyond `@vercel/node` — no adding npm packages
- **Single-file frontend** — `public/index.html` contains all HTML, CSS, and JS; no build step, no frameworks
- **Errors return SVG images** (not JSON) so they render in `<img>` tags and Markdown embeds
- **Partial failure is allowed** — if at least 1 user is fetched successfully, it renders; 0 successes → error SVG (502)
- **Overlay mode restrictions** — only dark themes allowed (`github`, `github-dark`, `blue-dark`, `purple-dark`, `orange-dark`)
- **Custom colors** — comma-separated hex codes without `#`, auto-generate 4 intensity levels via HSL manipulation; in sum mode only the first color is used
- **Username validation** — regex `/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/`, max 39 chars, max 10 users per request
- **SVG layout** — 11px cells + 2px gap (13px step), week columns, first week padded to align with Sunday start
- **`GITHUB_TOKEN` env var** required for GitHub GraphQL API access
- **Cache key format** — SVG: `svg:{usernames}:{mode}:{theme}:{colors}:{bg}`, per-user: `user:{username}`
