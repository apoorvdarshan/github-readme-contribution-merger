<div align="center">

# GitHub Readme Contribution Merger

### Combine multiple GitHub contribution graphs into one embeddable SVG heatmap

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-4ade80?style=for-the-badge&logo=vercel&logoColor=white)](https://github-contribution-merger.vercel.app)
[![GitHub Stars](https://img.shields.io/github/stars/apoorvdarshan/github-readme-contribution-merger?style=for-the-badge&logo=github&color=39d353)](https://github.com/apoorvdarshan/github-readme-contribution-merger/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br>

![Merged Contribution Graph](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&colors=39d353,58a6ff&mode=overlay)

*Overlay mode with custom colors*

</div>

---

## What is this?

A **free, open-source tool** that fetches GitHub contribution data for multiple users, merges it, and renders a combined **SVG heatmap** you can embed directly in your GitHub README, profile, or any Markdown/HTML page.

**No signup required. No API keys for end users. Just paste a URL.**

### Key Features

- **Merge multiple users** — combine 2-10 GitHub contribution graphs into one
- **Sum & Overlay modes** — total contributions or color-coded per user
- **Custom colors** — pick any hex color, auto-generates 4 intensity levels
- **8 built-in themes** — github, github-dark, blue, purple, orange + dark variants
- **Interactive builder** — visual UI to configure and preview before copying
- **Instant embed** — copy Markdown/HTML snippets, paste into your README
- **Serverless** — deploys on Vercel with zero config
- **Fast** — 3-layer caching (CDN + in-memory SVG + per-user data), 5-min TTL

---

## Quick Start

### 1. Use the Interactive Builder (Recommended)

Visit **[github-contribution-merger.vercel.app](https://github-contribution-merger.vercel.app)** to build your embed link visually — pick usernames, modes, colors, and preview the result before copying.

### 2. Or paste a URL directly

**Markdown:**
```markdown
![Contributions](https://github-contribution-merger.vercel.app/api/merge?users=YOUR_USERNAME,FRIEND_USERNAME)
```

**HTML:**
```html
<img src="https://github-contribution-merger.vercel.app/api/merge?users=YOUR_USERNAME,FRIEND_USERNAME" alt="Merged GitHub contributions" />
```

---

## Examples

<table>
<tr>
<td align="center"><strong>Sum Mode (default)</strong></td>
<td align="center"><strong>Overlay Mode</strong></td>
</tr>
<tr>
<td align="center">

![Sum Mode](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum)

</td>
<td align="center">

![Overlay Mode](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&mode=overlay)

</td>
</tr>
<tr>
<td align="center"><strong>Custom Colors</strong></td>
<td align="center"><strong>Dark Theme</strong></td>
</tr>
<tr>
<td align="center">

![Custom Colors](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&colors=ff6b6b,4ecdc4)

</td>
<td align="center">

![Dark Theme](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&theme=github-dark)

</td>
</tr>
<tr>
<td align="center"><strong>Purple Theme</strong></td>
<td align="center"><strong>Blue Dark Theme</strong></td>
</tr>
<tr>
<td align="center">

![Purple Theme](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&theme=purple)

</td>
<td align="center">

![Blue Dark Theme](https://github-contribution-merger.vercel.app/api/merge?users=sindresorhus,gvanrossum&theme=blue-dark)

</td>
</tr>
</table>

---

## API Reference

### `GET /api/merge`

Returns an SVG image of the merged contribution graph.

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `users` | Yes* | — | Comma-separated GitHub usernames (e.g., `users=user1,user2`) |
| `user1`, `user2`, ... | Yes* | — | Alternative: individual username params |
| `mode` | No | `sum` | `sum` — combined total; `overlay` — color by dominant contributor |
| `theme` | No | `github` | Preset color theme (see below) |
| `colors` | No | — | Comma-separated 6-char hex colors (no `#`), one per user. Overrides `theme`. |
| `bg` | No | `dark` | Background mode when using `colors`: `light` or `dark` |

*Provide either `users` or `user1`+`user2`+... At least 2 usernames required (max 10).

### Custom Colors

Use the `colors` param to specify your own hex colors instead of a preset theme. Each color maps to the user at the same position in `users`.

- **Sum mode**: only the first color is used (4 intensity levels are auto-generated)
- **Overlay mode**: each user gets their own 4-level palette generated from their color
- If fewer colors than users are provided, remaining users get auto-assigned from a default palette
- `bg=light` gives a white background; `bg=dark` (default) gives a dark background

### Themes

| Theme | Style | Description |
|-------|-------|-------------|
| `github` | Light | Classic light green (default) |
| `github-dark` | Dark | Dark mode green |
| `blue` / `blue-dark` | Light / Dark | Blue scale |
| `purple` / `purple-dark` | Light / Dark | Purple scale |
| `orange` / `orange-dark` | Light / Dark | Orange scale |

> **Overlay mode** supports only `github` and dark themes. Each user is auto-assigned a distinct color palette so contributors are visually distinguishable.

---

## Self-Hosting

### Prerequisites

- Node.js 18+
- A GitHub personal access token ([create one here](https://github.com/settings/tokens)) — no special scopes needed

### Setup

```bash
git clone https://github.com/apoorvdarshan/github-readme-contribution-merger.git
cd github-readme-contribution-merger
npm install

# Add your GitHub token
cp .env.example .env
# Edit .env → GITHUB_TOKEN=ghp_your_token_here

npx vercel dev
```

### Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `GITHUB_TOKEN` as an environment variable
4. Deploy — done!

---

## How It Works

1. Fetches the last 12 months of contribution data for each user via GitHub's GraphQL API
2. Merges contributions by date (summing counts or tracking per-user breakdowns)
3. Renders a GitHub-style SVG heatmap with month/day labels, tooltips, and a legend
4. Caches responses at multiple levels (Vercel CDN, in-memory SVG, in-memory per-user data) with 5-minute TTL

### Tech Stack

- **Runtime**: Node.js 18+ (serverless on Vercel)
- **Language**: TypeScript
- **Dependencies**: Zero external runtime deps (only `@vercel/node`)
- **Frontend**: Single HTML file, zero frameworks, pure CSS/JS

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

If you find this useful, please give it a **star** — it helps others discover the project.

---

## Support

If this tool helped you, consider supporting its development:

[![PayPal](https://img.shields.io/badge/PayPal-Support-009de0?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/apoorvdarshan)

---

<div align="center">

Made by [Apoorv Darshan](https://github.com/apoorvdarshan)

[![GitHub](https://img.shields.io/badge/GitHub-apoorvdarshan-181717?style=flat-square&logo=github)](https://github.com/apoorvdarshan)
[![Twitter](https://img.shields.io/badge/Twitter-@apoorvdarshan-1da1f2?style=flat-square&logo=x)](https://x.com/apoorvdarshan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-apoorvdarshan-0a66c2?style=flat-square&logo=linkedin)](https://linkedin.com/in/apoorvdarshan)

**MIT License**

</div>
