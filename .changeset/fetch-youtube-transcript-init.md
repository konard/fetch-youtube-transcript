---
"fetch-youtube-transcript": minor
---

Initialize `fetch-youtube-transcript` as a globally installable CLI tool that fetches YouTube video transcripts and saves them as markdown files.

The tool uses `browser-commander` for browser automation with Playwright and `lino-arguments` for argument parsing. It supports:

- Full YouTube URLs (`https://www.youtube.com/watch?v=...`)
- Short URLs (`https://youtu.be/...`)
- Custom output file via `--output` / `-o` flag
- Verbose logging via `--verbose` / `-v` flag
- Persistent browser session to avoid repeated logins
