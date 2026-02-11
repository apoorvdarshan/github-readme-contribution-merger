# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main branch) | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public issue.**

Instead, please email or contact directly:

- **GitHub**: [@apoorvdarshan](https://github.com/apoorvdarshan)
- **Twitter/X**: [@apoorvdarshan](https://x.com/apoorvdarshan)

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Assessment**: within 1 week
- **Fix**: as soon as possible, depending on severity

## Scope

This policy covers:

- The serverless API (`api/merge.ts`)
- The landing page (`public/index.html`)
- Dependencies and deployment configuration

## Known Security Considerations

- **GITHUB_TOKEN**: Required for API access. Never exposed to the client. Set as a server-side environment variable only.
- **User input**: Usernames are validated against GitHub's format before use. Max 10 users per request.
- **No user data storage**: The tool does not store any user data. All caching is ephemeral in-memory with a 5-minute TTL.
- **No authentication**: The tool is read-only and only fetches public contribution data.
- **SVG output**: Generated SVGs use escaped text content to prevent XSS injection.

## Thank You

Thank you for helping keep this project and its users safe.
