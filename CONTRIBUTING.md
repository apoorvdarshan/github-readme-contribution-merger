# Contributing to GitHub Readme Contribution Merger

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/github-readme-contribution-merger.git
   cd github-readme-contribution-merger
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file with your GitHub token:
   ```bash
   cp .env.example .env
   # Edit .env → GITHUB_TOKEN=ghp_your_token_here
   ```
5. Start the dev server:
   ```bash
   npx vercel dev
   ```

## Project Structure

```
api/merge.ts          → Vercel serverless entry point
src/types.ts          → Shared TypeScript interfaces
src/github.ts         → GitHub GraphQL API client
src/merger.ts         → Contribution merging logic
src/svg.ts            → SVG heatmap generator
src/cache.ts          → In-memory cache (5-min TTL)
src/themes.ts         → Color theme definitions
public/index.html     → Landing page (single file, no frameworks)
```

## Development

- Run `npm run build` to type-check with TypeScript
- Run `npx vercel dev` to start the local dev server
- The landing page is at `http://localhost:3000`
- The API endpoint is at `http://localhost:3000/api/merge`

## Guidelines

- **Zero external runtime dependencies** — keep it that way. Only `@vercel/node` is allowed.
- **Single-file frontend** — `public/index.html` contains all HTML, CSS, and JS. No build step, no frameworks.
- **Keep it simple** — avoid over-engineering. Small, focused changes are preferred.
- **Test your changes** — verify the API returns valid SVGs and the landing page works on both desktop and mobile.

## Submitting Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run type checking:
   ```bash
   npm run build
   ```
4. Commit with a clear message describing what and why
5. Push and open a pull request

## Ideas for Contributions

- New color themes
- Accessibility improvements
- Performance optimizations
- Better mobile responsiveness
- Documentation improvements
- Bug fixes

## Reporting Issues

Open an issue on [GitHub Issues](https://github.com/apoorvdarshan/github-readme-contribution-merger/issues) with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/device info (if frontend related)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
