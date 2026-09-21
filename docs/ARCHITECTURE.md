# NOVA Skin · Architecture

How the extension works under the hood, and the rules that keep it safe.
Target audience: developers who want to fix a bug, add a theme, or fork it.

---

## 1. Mental model (30 seconds)

CSS is the **entire** design system. There is no JS layout logic; `content.js`
only flips two switches:

1. Adds `nova-skin-active` to `<html>` — this is the **master switch**. Every
   NOVA selector is scoped off it, so removing the class restores the original
   UI 1:1 (the **reversibility contract**).
2. Sets `data-nova-theme="<id>"` and `data-nova-fx="on|off"` on `<html>` — the
   knobs that themes and the FX toggle read.

```
chrome.tabs.sendMessage({type:"nova:setTheme", theme})
      └─► content.js ──► <html class="nova-skin-active" data-nova-theme="sunset">
                                   ▲                                  ▲
                                  master switch                  theme selector
```

Because every rule is `html.nova-skin-active <selector>`, NOVA and ChatGPT
never fight: NOVA only *adds* specificity on top of the original DOM.

## 2. Token system (the bridge)

`nova.css` defines ~190 custom properties, split in three layers:

| Layer | Scope | Purpose |
|---|---|---|
| `:root` global tokens | non-chromatic | speeds, easing, radii, font stack (`--nova-speed`, `--nova-ease`, …) — theme-agnostic |
| `:root` semantic tokens | `--nova-*` | the **palette contract**: bg, ink, accent, line, glow, gradient, atmosphere. Computed once, consumed everywhere |
| theme files | override semantics | `html.nova-skin-active[data-nova-theme="x"] { --nova-accent-1: … }` |

**Themes never target DOM.** They only swap the values of the semantic tokens.
That is why adding a theme is ~40 lines of pure data (see
[`themes/_template.css`](../themes/_template.css)).

There is also a **derived-token layer** (in nova.css) that builds new tokens
from the semantic ones with `color-mix()` — e.g. `--nova-glow-active` derives
from `--nova-accent-1`, and the whole atmosphere (`--nova-ambient-*`) derives
from the accent. **Rule of thumb:** only override a token in a theme if you see
it listed in `_template.css` (35 tokens). Derived values follow automatically.

## 3. The ChatGPT token bridge (best effort)

ChatGPT ships its own `--semantic-color-*` / `--ds-*` variables from React 19
theme. The *Puente de tokens* section (nova.css:225) maps them back into the
NOVA ramp:

```
--nova-ink-0 ← semantic-text-primary  / --ds-text-primary
--nova-ink-2 ← semantic-text-tertiary / --ds-text-tertiary
--nova-bg-1  ← semantic-surface-primary
…and so on
```

So even surfaces ChatGPT paints itself (menus, dropdowns, onboarding) inherit
the active NOVA theme. It is best-effort: when ChatGPT renames a variable, the
bridge line is the first thing to check.

## 4. The transparentado block (background gotcha)

ChatGPT's chrome is not translucent: `main`, thread containers, and classes
containing `bg-token-*` / `surface-primary` / `surface-secondary` paint their
own **opaque** color, covering the `<body>` background.

Consequence: **text and fonts apply fine, but the NOVA background is invisible**
until those containers are made transparent.

The transparentado block (nova.css, near the top — right after the bridge
section) neutralizes them:

```css
html.nova-skin-active main:not([class]) { background: transparent !important; }
html.nova-skin-active [class*="bg-token"] { background: transparent !important; }
/* etc. */
```

> **Theming tip:** when *"the theme isn't applying but the text is"*, 9 times
> out of 10 it's a new opaque container ChatGPT added. Extend this block —
> never blame the theme file.

## 5. Stable anchors (the selector rules)

No selector may reference **Radix-generated IDs** (`radix-_r_*`) or
**hash-suffixed Tailwind classes** (`inline-flex__c9c8c7`) — they change on
every deploy.

Stable anchors only:

- Semantic roles: `[role="dialog"]`, `[role="switch"]`, `[role="menu"]`
- Data attributes: `[data-message-author-role]`, `[data-testid*="tool-call"]`
- IDs that ship with the app: `#prompt-textarea`
- Structural relation: `:has()`, `:not([class])`

And the one hard law: **every selector is prefixed `html.nova-skin-active`**.
`tools/check.sh` enforces it (the only exceptions are `0%/50%/100%` keyframe
selectors).

## 6. Custom themes (Export / Import)

The popup can export any theme (built-in or custom) as a small JSON and import
it as a **Custom** theme:

```json
{
  "schema": "nova-skin/theme/v1",
  "id": "slate",
  "name": "Slate",
  "dark": true,
  "palette": { "bg": "#0a0a0e", "panel": "#111116", "ink0": "#f2f2f6", "ink1": "#b9bcc8", "accent": "#8b7cff" }
}
```

Custom themes never touch CSS files. `content.js` **derives the full token
block at runtime** from the 5 palette colors (HSL shade/hue helpers +
`color-mix()` for alphas) and injects a single `<style id="nova-custom-styles">`.
The atmosphere still derives from the accent via the core's `color-mix`.

### State ownership

`localStorage` on the page origin is the **single source of truth**. The popup
runs in the extension origin (a different storage), so it behaves as a remote
control:

- popup → page: `nova:setTheme` / `nova:setFx` / `nova:setMatrix` / `nova:setWatermark` / `nova:setCustomThemes` / `nova:setAuto`
- popup ← page: `nova:getState` returns `{ theme, fx, matrix, auto, watermark, customThemes }` on open (theme is the *effective* one when auto is on)

Every mutation writes the page storage first (content.js), so all three states
survive reloads. The popup's own `localStorage` is only a fallback when no
ChatGPT tab is open.

## 7. Performance & motion

- The nebula atmosphere is a blurred pseudo-element sized `inset: -8%` with
  `will-change: transform`, blur `40px`, animated 45 s.
- `data-nova-fx="off"` (popup toggle) hides `::before/::after` entirely and
  zeroes `--nova-speed*`, so NOVA motion — but not ChatGPT's native streaming
  dots — stops instantly.
- The personal watermark (`.nova-watermark`, `z-index: 999`) is a static,
  inert overlay (pointer-events: none): it floats above the chat content but
  never blocks interaction, and fades out as soon as the first message is
  sent. It must NOT use negative z-index: ChatGPT's opaque/graphite surfaces
  (topbar/composer glass + unmatched wrappers) would paint above it and hide
  it. Its text/opacity are per-user page storage (`nova.watermark`).
- `prefers-reduced-motion: reduce` forces `0.01ms` durations/animations on the
  entire page.

## 8. Directory map

```
manifest.json        MV3: 8 CSS + content.js + popup + icons
nova.css             the whole design system (tokens, bridge, surfaces…)
themes/*.css         token-only overrides, one block per file
themes/_template.css blueprint with all overridable tokens + "theme in 5 steps"
content.js           master switch + theme/fx/watermark plumbing + custom-theme engine
popup.html/.js       theme picker (live previews) + FX toggle + watermark + export/import
tools/check.sh       QA in one command (pure Python, no npm)
docs/ARCHITECTURE.md this file
```

## 9. Develop → verify loop

```bash
# 1. change something (nova.css, a theme, popup, content)
# 2. validate:
bash tools/check.sh
# 3. reload the extension (chrome://extensions → ↻) and hard-refresh ChatGPT
```

Checklist before shipping a new theme — it's at the top of `_template.css` too:

- [ ] One block: `html.nova-skin-active[data-nova-theme="<id>"]`
- [ ] Only `--nova-*` properties (+ `color-scheme: light` if it's a light theme)
- [ ] Declared in `manifest.json` css list **and** in `content.js` THEMES
- [ ] Shown in popup → add an entry to `GROUPS` in `popup.js`
- [ ] `bash tools/check.sh` passes