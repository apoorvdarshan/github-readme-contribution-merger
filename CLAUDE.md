# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**github-readme-contribution-merger** — A serverless tool that fetches GitHub contribution data for multiple users, merges it, and renders a combined SVG heatmap. Deployed on Vercel at `/api/merge?users=user1,user2`. Repository is at https://github.com/apoorvdarshan/github-readme-contribution-merger.

## Commands

- `npm install` — install dependencies
- `npm run build` or `npm run typecheck` — run TypeScript type checking (`tsc --noEmit`)
- `npx vercel dev` — start local development server

## Architecture

```
api/merge.ts          → Vercel serverless entry point (param parsing, validation, caching, error SVGs)
src/types.ts          → Shared TypeScript interfaces
src/github.ts         → GitHub GraphQL API client (fetch contributions for users)
src/merger.ts         → Contribution merging logic (group by date, sum counts)
src/svg.ts            → SVG heatmap generator (sum/overlay modes, tooltips, legends)
src/cache.ts          → In-memory cache with 5-min TTL
src/themes.ts         → Color theme definitions (github, github-dark, blue, blue-dark, purple, purple-dark, orange, orange-dark)
```

## Key Details

- Zero external runtime dependencies beyond `@vercel/node`
- Uses native `fetch()` (Node 18+), template literal SVG generation, and `Map`-based caching
- Errors are returned as SVG images so they render in `<img>` tags and Markdown embeds
- Max 10 users per request; usernames validated against GitHub format
- 3-layer caching: Vercel CDN (s-maxage), in-memory SVG, in-memory per-user data — all 5-min TTL
- `GITHUB_TOKEN` env var required for GitHub GraphQL API access
- `colors` param: comma-separated hex codes (no `#`) for custom per-user colors, overrides `theme`
- `bg` param: `light` or `dark` (default `dark`) — background mode when using custom colors
- Custom colors auto-generate 4 intensity levels per color via HSL manipulation
