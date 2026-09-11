# NOVA Skin

Premium visual layer for ChatGPT — a spatial, "spaceship cockpit" redesign of `chatgpt.com` / `chat.openai.com`.

Chrome/Edge MV3 extension. **No build step**: pure static files loaded via `content_scripts`.

## Features

- **8 themes** in a popup, split into Dark / Light groups with **live previews**:
  - Dark: `Nova`, `Cosmic`, `Aurora`, `Mono`, `Sunset`
  - Light: `Nova Light`, `Cosmic Light`, `Aurora Light`
- **Export / Import themes as JSON** — save any theme's palette, share it, or import one from a file to create a *Custom* theme (tokens auto-derived at runtime).
- **Atmosphere FX toggle** — on/off nebula layers + NOVA motion (great for low-end GPUs or reduce-motion preferences).
- Full re-skin of ChatGPT surfaces: sidebar, messages, composer, dialogs, tool-use cards, streaming, welcome screen, images, scrollbars.

## Install (unpacked)

> The current ChatGPT version never ships the `nova-skin-active` class set **before** the first paint, so a brief unstyled flash is possible; the theme re-applies instantly.

1. Download / clone this folder (or unzip `nova-skin-v0.6.0.zip`).
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the folder.
5. Open `https://chatgpt.com` and click the **NOVA** icon in the toolbar to switch themes.

> After updating files, reload the extension (↻) and hard-refresh ChatGPT (Ctrl+R).

## Roadmap

- [x] Theme popup with live previews
- [x] Light mode (3 light themes)
- [x] FX / performance control
- [x] Mono + Sunset themes
- [x] Theme export/import (custom themes, no CSS editing)
- [x] One-command QA (`tools/check.sh`) + contributor docs
- [ ] More themes (Ice, etc.)

## For developers

- **`docs/ARCHITECTURE.md`** — the whole architecture in ~5 min: token bridge, the `transparentado` gotcha, stable-anchor rules, reversibility contract.
- **`themes/_template.css`** — copy-paste blueprint with all 35 overridable tokens + "create a theme in 5 steps".
- **`tools/check.sh`** — one-command local QA (pure Python, no npm): CSS balance + prefix enforcement, theme schema, cross-consistency, versions, debug logs.

```
# validate before shipping anything
bash tools/check.sh
```

## Project structure

```
manifest.json        MV3: 8 CSS + content.js + popup + icons
nova.css             The complete design system (tokens, surfaces, sections)
themes/*.css         Token-only overrides per theme (no DOM selectors)
themes/_template.css Blueprint with all overridable tokens + "theme in 5 steps"
content.js           Master switch, theme/FX plumbing, custom-theme engine
popup.html/.js       Theme picker (live previews) + FX toggle + Export/Import
tools/check.sh       One-command local QA (pure Python, no npm)
docs/ARCHITECTURE.md Architecture + design rules for contributors
```

## Architecture notes

- **Reversibility**: every selector is prefixed by `html.nova-skin-active`; removing the class restores the original UI.
- **Token-first**: all theming goes through CSS custom properties (`--nova-*`). Theme files override semantic tokens only — no DOM targeting.
- **Stable anchors only**: targets `[role]`, `[data-testid*]`, `#prompt-textarea`, `:has()`, etc. Never hardcoded Radix IDs or hash-suffixed Tailwind classes.

Development conventions live in [`AGENTS.md`](./AGENTS.md).

## License

Private/personal use. Include attribution if you fork it.