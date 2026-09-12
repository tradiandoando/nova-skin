# NOVA Skin

**A customizable visual layer for ChatGPT.**

NOVA Skin transforms the visual experience of ChatGPT through a token-first theme system, live previews, atmosphere effects, and shareable theme presets.

It started as an experiment in interface customization.

With v0.6.0, it becomes something more: a small **community-oriented laboratory for exploring how AI interfaces can become more personal, expressive, and adaptable.**

> **Create. Validate. Share. Customize.**

---

## v0.6.0 — Community Layer

This release introduces the first community-oriented foundation of NOVA Skin.

### What's included

* **8 built-in themes**

  * Dark: Nova, Cosmic, Aurora, Mono, Sunset
  * Light: Nova Light, Cosmic Light, Aurora Light
* **Live theme previews**
* **Atmosphere FX control**
* **Theme Export / Import**
* **Custom themes from JSON**
* **Personal background watermark**
* **35 semantic design tokens**
* **Theme template for contributors**
* **One-command local QA**
* **Architecture documentation**
* **Stable-anchor and reversibility rules**
* **Chrome / Edge Manifest V3**
* **No build step**

---

## Why NOVA Skin?

AI interfaces are becoming part of everyday work, learning, creation, and communication.

But the interface is usually fixed.

NOVA Skin explores a different question:

> **What if the interface could adapt to the identity and preferences of the person using it?**

A theme can change the atmosphere without changing the underlying application.

That distinction is important.

**Themes customize the experience. They don't own the interface.**

---

## Install

NOVA Skin currently runs as an unpacked Chrome / Edge extension.

### 1. Download

Clone the repository or download the release ZIP:

`nova-skin-v0.7.23.zip`

### 2. Open the extensions page

Chrome:

`chrome://extensions`

Edge:

`edge://extensions`

### 3. Enable Developer mode

Enable **Developer mode**.

### 4. Load the extension

Choose **Load unpacked** and select the NOVA Skin folder.

### 5. Open ChatGPT

Open:

`https://chatgpt.com`

Click the NOVA Skin icon in the browser toolbar and choose a theme.

After modifying extension files, reload the extension and refresh ChatGPT.

> A brief unstyled flash may occur on initial page load because the current ChatGPT page does not expose the NOVA activation class before first paint. NOVA Skin reapplies the theme immediately after initialization.

---

## Themes

NOVA Skin currently includes:

### Dark

* Nova
* Cosmic
* Aurora
* Mono
* Sunset

### Light

* Nova Light
* Cosmic Light
* Aurora Light

Themes are built around semantic CSS custom properties rather than direct DOM styling.

This allows the visual layer to evolve independently from the underlying ChatGPT interface.

---

## Create your own theme

You don't need to modify the core engine.

Start with:

`themes/_template.css`

The template contains all **35 overridable NOVA tokens**, with comments explaining what each token controls and where it is consumed.

### Create a theme in 5 steps

1. Copy `themes/_template.css`
2. Give your theme a unique ID and name
3. Define your visual palette
4. Run the validator
5. Load it in NOVA Skin and test it

Before sharing:

```bash
bash tools/check.sh
```

A valid theme should pass the NOVA Skin architecture checks.

---

## Share themes with JSON

NOVA Skin also supports theme presets without editing CSS.

From the popup:

**Export → JSON**

A theme can then be shared as a small preset file.

Another user can:

**Import → select JSON → validate → preview → apply**

Imported themes are placed in the **Custom** theme group.

The custom-theme engine derives the remaining semantic tokens at runtime.

This creates a simple separation:

```text
NOVA Core
   ↓
Theme system
   ↓
JSON preset
   ↓
Custom experience
```

You can experiment with visual identity without modifying the core architecture.

---

## Personal watermark

NOVA Skin can place a personal text watermark on the page background — behind the chat, above the nebula layer.

From the popup:

1. Turn on **Watermark**
2. Type your mark (up to 24 characters)
3. Adjust the opacity

Each machine keeps its own watermark (the popup persists it on the page), so every user can stamp their own background without touching themes or the core.

---

## Architecture

NOVA Skin follows a **token-first** visual architecture.

```text
Theme
  ↓
Semantic NOVA tokens
  ↓
Visual layer
  ↓
ChatGPT surfaces
```

The complete architecture is documented in:

`docs/ARCHITECTURE.md`

It covers:

* the token bridge;
* background transparency;
* stable DOM anchors;
* reversibility;
* performance considerations;
* custom theme injection;
* QA rules.

### Core principle

> **Themes customize the experience. They don't own the interface.**

This keeps the visual layer replaceable and reversible.

---

## Reversibility

NOVA Skin scopes its visual rules behind:

```css
html.nova-skin-active
```

Removing the activation class removes the NOVA visual layer and restores the underlying interface.

This is intentional.

NOVA Skin should enhance the interface without permanently taking ownership of it.

---

## Stable anchors

ChatGPT's internal implementation changes over time.

For that reason, NOVA Skin avoids relying on unstable generated identifiers whenever possible.

The architecture prefers stable signals such as:

* semantic roles;
* `data-testid` attributes;
* known functional selectors;
* `#prompt-textarea`;
* supported structural selectors.

Avoid hardcoded Radix IDs, hash-suffixed utility classes, or selectors that depend on implementation details that can change without notice.

---

## Local QA

NOVA Skin includes a single-command validator:

```bash
bash tools/check.sh
```

The validator runs without npm dependencies and checks:

* manifest structure and referenced routes;
* CSS balance;
* selector prefixing;
* theme schema;
* NOVA token usage;
* cross-consistency between manifest, content script and popup;
* versions;
* debug logging;
* JavaScript syntax.

The goal is simple:

> **If a contribution breaks the architecture, the validator should catch it before shipping.**

---

## Project structure

```text
nova-skin/
│
├── docs/
│   └── ARCHITECTURE.md
│
├── themes/
│   ├── _template.css
│   ├── cosmic.css
│   ├── aurora.css
│   ├── mono.css
│   ├── sunset.css
│   ├── nova-light.css
│   ├── cosmic-light.css
│   └── aurora-light.css
│
├── tools/
│   └── check.sh
│
├── manifest.json
├── nova.css
├── content.js
├── popup.html
├── popup.js
└── AGENTS.md
```

---

## Community direction

NOVA Skin is being developed as a **public community preview**.

The goal is not simply to collect themes.

We want to explore:

* how people express identity through interfaces;
* how visual systems can become adaptable;
* how creators can build without modifying the core;
* how presets can be shared;
* how community experimentation can inform future interface systems.

Possible future directions include:

* community theme gallery;
* more theme presets;
* contributor workflows;
* theme submission guidelines;
* accessibility-oriented themes;
* additional interface experiments;
* future connections with the broader NOVA ecosystem.

Nothing in the roadmap is a promise of future functionality.

---

## Security & privacy

NOVA Skin is designed as a local browser customization layer.

The project does not require a NOVA backend to apply themes.

The intended architecture does not require sending ChatGPT conversations, prompts, or user content to an external NOVA server.

Users should always inspect the source and extension permissions of the version they install.

NOVA Skin is an independent project and is **not affiliated with, endorsed by, or sponsored by OpenAI**.

---

## Status

**Version:** `0.7.23`

**Status:** Public Community Preview

NOVA Skin is an evolving experiment.

ChatGPT's interface can change over time, so compatibility may require updates as the underlying application evolves.

---

## Contributing

Before proposing a theme or architectural change:

1. Read `docs/ARCHITECTURE.md`
2. Start from `themes/_template.css`
3. Keep themes token-only
4. Avoid direct DOM selectors inside theme files
5. Run:

```bash
bash tools/check.sh
```

6. Test the result in ChatGPT
7. Describe what changed and why

The goal is not maximum freedom inside the core.

The goal is **maximum creative freedom at the community layer while preserving the architecture underneath.**

---

## Credits

Created as an independent experiment within the broader **NOVA ecosystem**.

Built through human + AI collaboration, iterative development, testing, and real-world experimentation.

> **Protect the vision. Preserve the architecture. Expand the ecosystem.**

---

## License

NOVA Skin v0.6.0 is distributed under the terms of the accompanying `LICENSE` file.

This repository is publicly viewable for learning, experimentation, and community collaboration within the permissions defined by that license.