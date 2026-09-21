# AGENTS.md — NOVA Skin

Chrome MV3 extension that skins ChatGPT (`chatgpt.com`, `chat.openai.com`). No build, no bundler, no package.json, no tests. Pure static files loaded via `content_scripts` in `manifest.json`.

## Architecture

- `content.js` adds class `nova-skin-active` to `<html>` and sets `data-nova-theme` (from `localStorage["nova.theme"]`, default `nova`).
- `nova.css` is the **entire** design system. Theme files (`themes/*.css`) contain **only** custom-property overrides under `html.nova-skin-active[data-nova-theme="..."]` — **no DOM selectors allowed in theme files**.
- All real DOM targeting lives in `nova.css`, scoped by `html.nova-skin-active <selector>`.

## Rules that matter (easy to miss)

- **Reversibility**: every selector MUST be prefixed with `html.nova-skin-active`. Removing the class restores the original UI.
- **No parallel system**: reuse existing tokens (`--nova-elev-*`, `--nova-surface-*`, `--nova-line-glow`, input/state tokens). Create a new token only if existing ones can't express the design. Only create new CSS files if unavoidable (themes are the exception).
- **Aesthetic**: "premium tech / spatial interface" — elevated layers, contained 1px inset glow, elegant and sober. Avoid RGB/gamer halo glow.
- **Stable anchors only**: target `[role="dialog"]`, `[role="switch"]`, `[role="menu"]`, `[data-message-author-role]`, `#prompt-textarea`, `:has()`, etc. NEVER hardcode Radix-generated IDs (`radix-_r_*`) or hash-suffixed Tailwind classes.

## Background gotcha (hard-won)

ChatGPT's internal opaque surface divs (`main`, thread containers, classes containing `bg-token` / `surface-primary` / `surface-secondary`) cover the `<body>` background. Text/font styles apply fine but the NOVA background won't be visible unless these containers are transparented. `nova.css` already does this near the top (around the *Puente de tokens* / transparentado section). When background "doesn't apply" while text does, check/extend this transparentado block before blaming the theme.

## Verifying changes (no test framework)

1. Reload the extension: `chrome://extensions` → enable developer mode → click ↻ on NOVA Skin.
2. Hard-refresh ChatGPT (Ctrl+R).
3. Run the one-command QA: `bash tools/check.sh` (pure Python, no deps). Checks: CSS balance + every selector prefixed by `html.nova-skin-active` (only legit unprefixed are `0%/50%/100%` keyframes), theme schema (one token-only block per file), token consistency, cross-consistency (manifest ↔ content ↔ popup), versions, no debug logs, JS syntax.

The user runs Chrome/Edge; there is no CI, lint, or typecheck.

## State ownership (easy to miss)

The popup lives in the extension origin and the content script in the page origin — **different `localStorage`s**. The page storage is the single source of truth: content.js writes `theme`/`fx`/custom themes there, and the popup reads them via `nova:getState` on open. Never add a parallel persistence in the popup; its storage is only a fallback. When changing theme behavior, keep the message protocol (`nova:setTheme` / `nova:setFx` / `nova:setMatrix` / `nova:setWatermark` / `nova:setCustomThemes` / `nova:setAuto` / `nova:getState`).

## Adding a new theme

1. Create `themes/<name>.css` overriding semantic tokens under `html.nova-skin-active[data-nova-theme="<name>"]`.
2. Declare it in `manifest.json` → `content_scripts[0].css`.
3. Add `"<name>"` to `THEMES` in `content.js`.
