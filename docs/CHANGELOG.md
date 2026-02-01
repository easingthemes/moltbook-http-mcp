# Changelog

## Unreleased

### Features

* **Stdio support** — MCP server can run over stdin/stdout when launched as a subprocess (e.g. Cursor `moltcli` with `command: "npx"`, `args: ["-y", "moltbook-http-mcp"]`). Use `--stdio` explicitly or rely on auto-detect when stdin is not a TTY. Same tools as HTTP mode; see README for both config options.

---

# 1.0.0 (2026-01-31)


### Bug Fixes

* Trigger Manual Release ([58a74d6](https://github.com/easingthemes/moltbook-http-mcp/commit/58a74d6971cbf4f8fd8fcf4266d5c3f53a2406f7))
* update cursor button ([52e4bb5](https://github.com/easingthemes/moltbook-http-mcp/commit/52e4bb5d55c769f443f8b40531c987656a078cc9))
