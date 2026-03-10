# fetch-youtube-transcript

A globally installable CLI tool to fetch YouTube video transcripts and save them as markdown files.

Uses [browser-commander](https://github.com/link-foundation/browser-commander) for browser automation with Playwright and [lino-arguments](https://github.com/link-foundation/lino-arguments) for argument parsing.

## Features

- Fetch transcripts from any YouTube video with a transcript
- Supports full URLs (`https://www.youtube.com/watch?v=...`) and short URLs (`https://youtu.be/...`)
- Saves transcripts as formatted Markdown files
- Persistent browser session — log in to YouTube once, reuse session forever
- Custom output file name via `--output` flag
- Verbose logging via `--verbose` flag

## Installation

```bash
npm install -g fetch-youtube-transcript
npx playwright install chromium
```

## Usage

```bash
fetch-youtube-transcript <youtube-url> [--output filename.md] [--verbose]
```

### Examples

```bash
# Fetch transcript from a YouTube video (saves to <video-id>.md)
fetch-youtube-transcript https://youtu.be/uzkc-qNVoOk

# Fetch with full URL
fetch-youtube-transcript "https://www.youtube.com/watch?v=uzkc-qNVoOk"

# Specify output file
fetch-youtube-transcript https://youtu.be/uzkc-qNVoOk --output my-transcript.md

# Enable verbose logging
fetch-youtube-transcript https://youtu.be/uzkc-qNVoOk --verbose
```

### First Run

On first run, the browser will open and navigate to the YouTube login page. Log in to your Google account manually. The session is saved to `~/.yt-session/` so you only need to log in once.

## Quick Start for Development

### Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Or with other runtimes:
npm test
deno test --allow-read

# Lint code
bun run lint

# Format code
bun run format

# Check all (lint + format + file size)
bun run check
```

## Project Structure

```
.
├── .changeset/           # Changeset configuration
├── .github/workflows/    # GitHub Actions CI/CD
├── .husky/               # Git hooks (pre-commit)
├── examples/             # Usage examples
├── scripts/              # Build and release scripts
├── src/                  # Source code
│   ├── index.js          # Main entry point
│   └── index.d.ts        # TypeScript definitions
├── tests/                # Test files
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
├── bunfig.toml           # Bun configuration
├── deno.json             # Deno configuration
└── package.json          # Node.js package manifest
```

## Design Choices

### Multi-Runtime Support

This template is designed to work seamlessly with all major JavaScript runtimes:

- **Bun**: Primary runtime with highest performance, uses native test support (`bun test`)
- **Node.js**: Alternative runtime, uses built-in test runner (`node --test`)
- **Deno**: Secure runtime with built-in TypeScript support (`deno test`)

The [test-anywhere](https://github.com/link-foundation/test-anywhere) framework provides a unified testing API that works identically across all runtimes.

### Package Manager Agnostic

While `package.json` is the source of truth for dependencies, the template supports:

- **bun**: Primary choice, uses `bun.lockb`
- **npm**: Uses `package-lock.json`
- **yarn**: Uses `yarn.lock`
- **pnpm**: Uses `pnpm-lock.yaml`
- **deno**: Uses `deno.json` for configuration

Note: `package-lock.json` is not committed by default to allow any package manager.

### Code Quality

- **ESLint**: Configured with recommended rules + Prettier integration
- **Prettier**: Consistent code formatting
- **Husky + lint-staged**: Pre-commit hooks ensure code quality
- **File size limit**: Scripts must stay under 1000 lines for maintainability

### Release Workflow

The release workflow uses [Changesets](https://github.com/changesets/changesets) for version management:

1. **Creating a changeset**: Run `bun run changeset` to document changes
2. **PR validation**: CI checks for valid changeset in each PR
3. **Automated versioning**: Merging to `main` triggers version bump
4. **npm publishing**: Automated via OIDC trusted publishing (no tokens needed)
5. **GitHub releases**: Auto-created with formatted release notes

#### Manual Releases

Two manual release modes are available via GitHub Actions:

- **Instant release**: Immediately bump version and publish
- **Changeset PR**: Create a PR with changeset for review

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/release.yml`) provides:

1. **Changeset check**: Validates PR has exactly one changeset (added by that PR)
2. **Lint & format**: Ensures code quality standards
3. **Test matrix**: 3 runtimes × 3 OS = 9 test combinations
4. **Broken link checks**: Validates all links in Markdown/HTML files, checks Web Archive for broken links
5. **Changeset merge**: Combines multiple pending changesets at release time
6. **Release**: Automated versioning and npm publishing

#### Robust Changeset Handling

The CI/CD pipeline is designed to handle concurrent PRs gracefully:

- **PR Validation**: Only validates changesets **added by the current PR**, not pre-existing ones from other merged PRs. This prevents false failures when multiple PRs merge before a release cycle completes.

- **Release-time Merging**: If multiple changesets exist when releasing, they are automatically merged into a single changeset with:
  - The highest version bump type (major > minor > patch)
  - All descriptions preserved in chronological order

This design decouples PR validation from the need to pull changes from the default branch, reducing conflicts and ensuring that even if CI/CD fails, all unpublished changesets will still get published when the error is resolved.

### Broken Link Checker

The link checker workflow (`.github/workflows/links.yml`) validates all links in Markdown and HTML files:

1. **Detection**: Uses [lychee](https://github.com/lycheeverse/lychee-action) to scan all `*.md` and `*.html` files
2. **Web Archive fallback**: For any broken links found, automatically checks the [Wayback Machine](https://web.archive.org) for archived versions
3. **Actionable suggestions**: Reports one of three outcomes for each broken link:
   - **Archived**: Suggests the Web Archive URL as a replacement
   - **Not archived**: Clearly reports the link is unrecoverable
4. **Scheduled checks**: Runs weekly to catch links that break over time (even if no files changed)
5. **Issue creation**: On scheduled runs, creates a GitHub Issue with the full broken links report

Add regex patterns to `.lycheeignore` to exclude URLs from checks (e.g., local dev URLs, example.com, known rate-limited sites).

## Configuration

### Updating Package Name

After creating a repository from this template, update the package name in:

1. `package.json`: `"name": "your-package-name"`
2. `.changeset/config.json`: Package references
3. Scripts that reference the package name (see Quick Start)

### ESLint Rules

Customize ESLint in `eslint.config.js`. Current configuration:

- ES Modules support
- Prettier integration
- No console restrictions (common in CLI tools)
- Strict equality enforcement
- Async/await best practices
- **Strict unused variables rule**: No exceptions - all unused variables, arguments, and caught errors must be removed (no `_` prefix exceptions)

### Prettier Options

Configured in `.prettierrc`:

- Single quotes
- Semicolons
- 2-space indentation
- 80-character line width
- ES5 trailing commas
- LF line endings

## Scripts Reference

| Script                 | Description                             |
| ---------------------- | --------------------------------------- |
| `bun test`             | Run tests with Bun                      |
| `bun run lint`         | Check code with ESLint                  |
| `bun run lint:fix`     | Fix ESLint issues automatically         |
| `bun run format`       | Format code with Prettier               |
| `bun run format:check` | Check formatting without changing files |
| `bun run check`        | Run all checks (lint + format)          |
| `bun run changeset`    | Create a new changeset                  |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed contribution guidelines.

Quick steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Create a changeset: `bun run changeset`
5. Commit your changes (pre-commit hooks will run automatically)
6. Push and create a Pull Request

## Best Practices

This template implements CI/CD best practices for AI-driven development. See [BEST-PRACTICES.md](docs/BEST-PRACTICES.md) for details on:

- File size limits for AI readability
- Automated formatting and linting
- Multi-runtime and cross-platform testing
- Changeset-based versioning
- Concurrency control for CI/CD pipelines

## License

[Unlicense](LICENSE) - Public Domain
