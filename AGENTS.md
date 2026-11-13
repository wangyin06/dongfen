# Agent operating rules for this repository

## Never let browser navigation hang the session

This project has repeatedly caused multi-hour DSH session hangs when `browser_open` / `dsh_browser_open` was called at a URL without a hard timeout. The browser call never returned, the whole session went silent, and the user had to restart DSH.

Before any browser navigation:

1. Confirm the target is reachable with a command that has a hard timeout:
   `curl -I -sS --max-time 5 <url>`
   For a local Vite server:
   `curl -sS --max-time 3 -o /dev/null -w '%{http_code}' http://127.0.0.1:<port>/`
2. Only navigate to a localhost URL that just returned 200.
3. Do not call a browser navigation tool on an external URL, an unverified port, or a service that is still starting.
4. Prefer `web_fetch` or `curl` with `--max-time` for external content.
5. Close browser pages when verification is finished. Do not leave browser jobs running.
6. If a browser navigation stalls, do not retry it; stop and report the exact URL instead.