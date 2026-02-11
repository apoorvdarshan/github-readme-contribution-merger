# GitHub Contribution Merger

Merge GitHub contribution graphs from multiple users into a single SVG heatmap. Deploy as a serverless function on Vercel.

## Usage

Embed in any Markdown file or HTML page:

```markdown
![Contributions](https://your-deployment.vercel.app/api/merge?users=torvalds,gvanrossum)
```

```html
<img src="https://your-deployment.vercel.app/api/merge?users=torvalds,gvanrossum" alt="Merged contributions" />
```

## API

### `GET /api/merge`

Returns an SVG image of the merged contribution graph.

### Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `users` | Yes* | — | Comma-separated GitHub usernames (e.g., `users=user1,user2`) |
| `user1`, `user2`, ... | Yes* | — | Alternative: individual username params |
| `mode` | No | `sum` | `sum` — combined total; `overlay` — color by dominant contributor |
| `theme` | No | `github` | Color theme (see below) |

*Provide either `users` or `user1`+`user2`+... At least 2 usernames are required (max 10).

### Themes

**Sum mode** — all themes available:

| Theme | Style | Description |
|-------|-------|-------------|
| `github` | Light | Classic light green (default) |
| `github-dark` | Dark | Dark mode green |
| `blue` | Light | Blue scale |
| `blue-dark` | Dark | Blue scale on dark background |
| `purple` | Light | Purple scale |
| `purple-dark` | Dark | Purple scale on dark background |
| `orange` | Light | Orange scale |
| `orange-dark` | Dark | Orange scale on dark background |

**Overlay mode** — only `github` and dark themes (`github-dark`, `blue-dark`, `purple-dark`, `orange-dark`) are supported. Each user is automatically assigned a distinct color palette (green, blue, orange, etc.) so contributors are visually distinguishable. Other theme values are ignored and fall back to `github`.

### Examples

Sum mode (default):
```
/api/merge?users=torvalds,gvanrossum&theme=purple
```

Sum mode with dark theme:
```
/api/merge?users=torvalds,gvanrossum&theme=github-dark
```

Overlay mode (each user gets a distinct color):
```
/api/merge?users=torvalds,gvanrossum&mode=overlay
```

Overlay mode with dark background:
```
/api/merge?users=torvalds,gvanrossum&mode=overlay&theme=github-dark
```

Using individual params:
```
/api/merge?user1=torvalds&user2=gvanrossum&mode=overlay
```

## Self-Hosting

### Prerequisites

- Node.js 18+
- A GitHub personal access token ([create one here](https://github.com/settings/tokens)) — no special scopes needed

### Setup

```bash
# Clone the repository
git clone https://github.com/apoorvdarshan/github-contribution-merger.git
cd github-contribution-merger

# Install dependencies
npm install

# Copy environment file and add your GitHub token
cp .env.example .env
# Edit .env and set GITHUB_TOKEN=ghp_your_token_here

# Run locally
npx vercel dev
```

### Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `GITHUB_TOKEN` as an environment variable in project settings
4. Deploy

## How It Works

1. Fetches the last 12 months of contribution data for each user via GitHub's GraphQL API
2. Merges contributions by date (summing counts or tracking per-user breakdowns)
3. Renders a GitHub-style SVG heatmap with month/day labels, tooltips, and a legend
4. Caches responses at multiple levels (Vercel CDN, in-memory SVG, in-memory per-user data) with 5-minute TTL

## License

MIT
