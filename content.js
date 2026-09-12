(() => {
  "use strict";

  const NOVA_CLASS = "nova-skin-active";
  const STORAGE_KEY = "nova.theme";
  const FX_KEY = "nova.fx";
  const CUSTOM_KEY = "nova.customThemes";
  const WATERMARK_KEY = "nova.watermark";
  const WATERMARK_ID = "nova-watermark";
  const DEFAULT_WATERMARK = { text: "NOVA", opacity: 75 };
  const WATERMARK_OFF = { off: true };
  const CUSTOM_STYLE_ID = "nova-custom-styles";

  const DEFAULT_THEME = "nova";
  const THEMES = [
    "nova",
    "cosmic",
    "aurora",
    "mono",
    "sunset",
    "nova-light",
    "cosmic-light",
    "aurora-light",
  ];

  /* ---------- store (page localStorage — single source of truth) ---------- */
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      /* storage lleno/indisponible */
    }
  }

  function validCustom(t) {
    return Boolean(
      t &&
        typeof t === "object" &&
        typeof t.id === "string" &&
        /^[a-z0-9]+(-[a-z0-9]+)*$/.test("" + t.id) &&
        !THEMES.includes(t.id) &&
        t.palette &&
        ["bg", "panel", "ink0", "ink1", "accent"].every((k) => typeof t.palette[k] === "string")
    );
  }

  let customThemes = readJson(CUSTOM_KEY, []).filter(validCustom);

  function isValidThemeId(id) {
    if (!id || typeof id !== "string") return false;
    if (THEMES.includes(id)) return true;
    return customThemes.some((t) => id === "custom-" + t.id);
  }

  function readTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidThemeId(stored)) return stored;
    } catch (_) {}
    return DEFAULT_THEME;
  }

  function readFx() {
    try {
      return localStorage.getItem(FX_KEY) === "off" ? "off" : "on";
    } catch (_) {
      return "on";
    }
  }

  /* ---------- modelo activo detectado en la UI ---------- */
  function readModel() {
    try {
      const sel = document.querySelector(
        '[data-testid="composer-model-selector"], [data-element-id="model-selector"], [data-testid*="model-selector"]'
      );
      const t = sel ? String(sel.textContent || "").replace(/\s+/g, " ").trim() : "";
      return t && t.length <= 40 ? t : "";
    } catch (_) {
      return "";
    }
  }

  /* ---------- watermark (marca de agua personal) ---------- */
  function sanitizeWatermark(w) {
    if (!w || typeof w !== "object") return null;
    const image =
      typeof w.image === "string" && /^data:image\/(png|webp|jpeg);base64,/.test(w.image) && w.image.length < 1600000
        ? w.image
        : null;
    const text = String(w.text || "").trim().slice(0, 24);
    const opacity = Number.isFinite(Number(w.opacity))
      ? Math.max(5, Math.min(95, Number(w.opacity)))
      : 75;
    if (image) return { image, opacity };
    if (!text) return null;
    return { text, opacity };
  }

  function readWatermark() {
    const stored = readJson(WATERMARK_KEY, undefined);
    if (stored === undefined || stored === null) return Object.assign({}, DEFAULT_WATERMARK);
    if (stored.off === true) return null;
    return sanitizeWatermark(stored);
  }

  function ensureWatermark() {
    const wm = readWatermark();
    let el = document.getElementById(WATERMARK_ID);
    if (!wm) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = WATERMARK_ID;
      el.className = "nova-watermark";
      const word = document.createElement("span");
      word.className = "nova-watermark-word";
      word.appendChild(document.createElement("span")).className = "nova-watermark-text";
      el.appendChild(word);
      document.body.appendChild(el);
    }
    const textEl = el.querySelector(".nova-watermark-text");
    const imgEl = el.querySelector(".nova-watermark-img");
    if (wm.image) {
      if (!imgEl) {
        const img = document.createElement("img");
        img.className = "nova-watermark-img";
        img.alt = "watermark";
        img.decoding = "async";
        el.querySelector(".nova-watermark-word").appendChild(img);
      }
      el.querySelector(".nova-watermark-img").src = wm.image;
      if (textEl) textEl.textContent = "";
    } else {
      if (imgEl) imgEl.remove();
      if (textEl) textEl.textContent = wm.text;
    }
    el.style.setProperty("--wm-active", wm.opacity / 100);
    updateDim(el, true);
    scheduleAlign();
  }

  /* Ancla del banner: la columna de mensajes (thread-container). */
  let threadEl = null;
  function findThread() {
    if (threadEl && threadEl.isConnected) return threadEl;
    threadEl = document.querySelector(
      '[data-testid="thread-container"], [data-testid*="thread"], [class*="thread"]'
    );
    return threadEl;
  }

  /* Alinea el banner con la columna del input/composer (no con el
     centro del viewport, que queda corrido cuando el sidebar está
     abierto). Ancla a thread-container / #prompt-textarea. */
  function alignWatermark() {
    const el = document.getElementById(WATERMARK_ID);
    if (!el) return;
    let cx = window.innerWidth / 2;
    let anchor = document.querySelector(
      '[data-testid="thread-container"], .nova-anchor-thread, #prompt-textarea'
    );
    if (!anchor || !anchor.getBoundingClientRect) anchor = null;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      if (r && r.width > 0) {
        cx = r.left + r.width / 2;
        el.style.top = Math.max(40, Math.round(r.top) + 8) + "px";
      } else {
        el.style.top = "";
      }
    } else {
      el.style.top = "";
    }
    el.style.transform = "translateX(" + Math.round(cx - window.innerWidth / 2) + "px)";
  }

  /* Auto-atenuación: a plena opacidad en el tope del chat; al
     scrollear para leer se apaga (no se interpone con el texto). */
  function updateDim(el, manual) {
    const e = el || document.getElementById(WATERMARK_ID);
    if (!e) return;
    const thread = findThread && findThread();
    const scrolled = thread && thread.isConnected
      ? thread.scrollTop > 120
      : window.scrollY > 120;
    e.classList.toggle("nova-watermark-dim", scrolled);
    if (manual) e.classList.remove("nova-watermark-dim");
  }

  let alignRaf = 0;
  function scheduleAlign() {
    if (alignRaf) return;
    alignRaf = requestAnimationFrame(() => {
      alignRaf = 0;
      alignWatermark();
      updateDim();
    });
  }

  /* ---------- pulso de respuesta nueva ---------- */
  let assistantCount = -1;
  let pulseT = 0;
  function pulseResponse() {
    const root = document.documentElement;
    root.classList.add("nova-pulse");
    clearTimeout(pulseT);
    pulseT = setTimeout(() => root.classList.remove("nova-pulse"), 1000);
  }

  function watchReplies() {
    if (typeof MutationObserver !== "function") return;
    assistantCount = document.querySelectorAll('[data-message-author-role="assistant"]').length;
    let raf = 0;
    const check = () => {
      raf = 0;
      const n = document.querySelectorAll('[data-message-author-role="assistant"]').length;
      if (n > assistantCount) pulseResponse();
      assistantCount = n;
    };
    const mo = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function watermarkDebug() {
    const el = document.getElementById(WATERMARK_ID);
    if (!el) {
      return { exists: false, stored: String(readJson(WATERMARK_KEY, null) || "") };
    }
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy);
    return {
      exists: true,
      style: [s.display, s.zIndex, s.fontSize, s.opacity, s.visibility].join(","),
      size: [Math.round(r.width), Math.round(r.height)],
      onTop: top ? top.tagName + "." + String(top.className || "").slice(0, 60) : null,
    };
  }

  /* ---------- color helpers (custom-theme derivation) ---------- */
  function hexRgb(hex) {
    let h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  function rgbHex(r, g, b) {
    return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h / 6, s, l];
  }

  function hslToRgb(h, s, l) {
    const f = (n) => {
      const k = (n + h * 12) % 12;
      const a = s * Math.min(l, 1 - l);
      return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }

  function lumaHex(hex) {
    const c = hexRgb(hex);
    return c ? 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] : 128;
  }

  function shadeHex(hex, amt) {
    const c = hexRgb(hex);
    if (!c) return hex;
    const h = rgbToHsl(c[0], c[1], c[2]);
    return rgbHex.apply(null, hslToRgb(h[0], h[1], Math.max(0, Math.min(1, h[2] + amt / 100))));
  }

  function hueHex(hex, deg) {
    const c = hexRgb(hex);
    if (!c) return hex;
    const h = rgbToHsl(c[0], c[1], c[2]);
    const nh = (h[0] * 360 + deg + 360) % 360;
    return rgbHex.apply(null, hslToRgb(nh / 360, h[1], h[2]));
  }

  /* ---------- custom theme CSS generation ---------- */
  const mix = (c, p) => "color-mix(in srgb, " + c + " " + p + "%, transparent)";
  const mixBg = (c, p, bg) => "color-mix(in srgb, " + c + " " + p + "%, " + bg + ")";

  function buildCustomCss(t) {
    const id = "custom-" + t.id;
    const A = t.palette;
    const dark = t.dark !== false;
    const ai = lumaHex(A.accent) > 150 ? "#101016" : "#ffffff";
    const a2 = dark ? shadeHex(A.accent, 22) : shadeHex(A.accent, -16);
    const a3 = dark ? hueHex(A.accent, 42) : hueHex(A.accent, 34);
    const shadow = (strength) => (dark
      ? "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 32px rgba(0,0,0," + strength + ")"
      : "0 1px 0 rgba(255,255,255,0.6) inset, 0 12px 28px rgba(25,25,60,0.1)");
    return [
      'html.nova-skin-active[data-nova-theme="' + id + '"] {',
      "  color-scheme: " + (dark ? "dark" : "light") + ";",
      "  --nova-elev-1: " + (dark
        ? "0 1px 0 rgba(255,255,255,0.035) inset, 0 6px 22px rgba(0,0,0,0.45)"
        : "0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 22px rgba(30,30,60,0.09)") + ";",
      "  --nova-elev-2: " + (dark
        ? "0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.55)"
        : "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 30px rgba(30,30,60,0.11)") + ";",
      "  --nova-elev-3: " + (dark
        ? "0 1px 0 rgba(255,255,255,0.05) inset, 0 18px 44px rgba(0,0,0,0.65)"
        : "0 1px 0 rgba(255,255,255,0.7) inset, 0 18px 44px rgba(30,30,60,0.13)") + ";",
      "  --nova-bg-0: " + A.bg + ";",
      "  --nova-bg-1: " + A.panel + ";",
      "  --nova-bg-surface: " + mix(A.panel, 66) + ";",
      "  --nova-bg-surface-solid: " + A.panel + ";",
      "  --nova-bg-hover: " + mix(A.accent, dark ? 12 : 7) + ";",
      "  --nova-ink-0: " + A.ink0 + ";",
      "  --nova-ink-1: " + A.ink1 + ";",
      "  --nova-ink-2: " + mixBg(A.ink1, dark ? 52 : 42, A.bg) + ";",
      "  --nova-ink-3: " + mix(A.ink0, dark ? 30 : 38) + ";",
      "  --nova-line-0: " + mix(A.accent, dark ? 14 : 16) + ";",
      "  --nova-line-1: " + mix(A.accent, dark ? 24 : 28) + ";",
      "  --nova-line-2: " + mix(A.accent, dark ? 52 : 60) + ";",
      "  --nova-accent-1: " + A.accent + ";",
      "  --nova-accent-2: " + a2 + ";",
      "  --nova-accent-3: " + a3 + ";",
      "  --nova-accent-ink: " + ai + ";",
      "  --nova-grad: linear-gradient(120deg, " + A.accent + " 0%, " + a2 + " 52%, " + a3 + " 100%);",
      "  --nova-grad-ink: linear-gradient(110deg, " + (dark ? shadeHex(A.accent, -6) : shadeHex(A.accent, -2)) + " 0%, " + shadeHex(a2, -2) + " 45%, " + shadeHex(a3, 4) + " 100%);",
      "  --nova-glow-focus:",
      "    0 0 0 3px " + mix(A.accent, 16) + ",",
      "    0 0 24px " + mix(A.accent, 12) + ",",
      "    0 0 48px " + mix(a3, 6) + ";",
      "  --nova-glow-hover:",
      "    0 0 0 1px " + mix(A.accent, 40) + ",",
      "    0 4px 18px " + mix(A.accent, 14) + ";",
      "  --nova-shadow-card: " + shadow(dark ? "0.45" : "") + ";",
      "  --nova-surface-sunken: " + (dark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)") + ";",
      "  --nova-input-bg-hover: " + (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") + ";",
      "  --nova-selection-bg: " + mix(A.accent, dark ? 35 : 26) + ";",
      "  --nova-selection-ink: " + ai + ";",
      "  --nova-scroll-thumb: " + mix(A.accent, dark ? 32 : 28) + ";",
      "  --nova-scroll-thumb-hover: " + mix(a3, dark ? 46 : 40) + ";",
      "  --nova-caret: " + a2 + ";",
      "}",
    ].join("\n");
  }

  function ensureCustomStyles() {
    let st = document.getElementById(CUSTOM_STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = CUSTOM_STYLE_ID;
      document.head.appendChild(st);
    }
    st.textContent = customThemes.map(buildCustomCss).join("\n\n");
  }

  /* ---------- theme / fx plumbing ---------- */
  function applyTheme(theme) {
    const root = document.documentElement;
    root.dataset.novaTheme = theme;
    if (theme.startsWith("custom-")) ensureCustomStyles();
  }

  function applyFx(fx) {
    const root = document.documentElement;
    if (fx === "off") {
      root.dataset.novaFx = "off";
    } else {
      delete root.dataset.novaFx;
    }
  }

  function activateNova() {
    const root = document.documentElement;
    customThemes = readJson(CUSTOM_KEY, []).filter(validCustom);
    ensureCustomStyles();
    root.classList.add(NOVA_CLASS);
    applyTheme(readTheme());
    applyFx(readFx());
    ensureWatermark();
    window.addEventListener("resize", scheduleAlign);
    window.addEventListener("scroll", scheduleAlign, true);
    watchReplies();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "nova:getState") {
      return {
        theme: readTheme(),
        fx: readFx(),
        customThemes: customThemes,
        watermark: readWatermark(),
        wmDebug: watermarkDebug(),
        model: readModel(),
      };
    }

    if (msg.type === "nova:setTheme" && isValidThemeId(msg.theme)) {
      writeJson(STORAGE_KEY, msg.theme);
      applyTheme(msg.theme);
    } else if (msg.type === "nova:setFx") {
      const fx = msg.fx === "off" ? "off" : "on";
      writeJson(FX_KEY, fx);
      applyFx(fx);
    } else if (msg.type === "nova:setWatermark") {
      const wm = sanitizeWatermark(msg.watermark);
      localStorage.setItem(WATERMARK_KEY, wm ? JSON.stringify(wm) : JSON.stringify(WATERMARK_OFF));
      ensureWatermark();
    } else if (msg.type === "nova:setCustomThemes" && Array.isArray(msg.themes)) {
      customThemes = msg.themes.filter(validCustom);
      writeJson(CUSTOM_KEY, customThemes);
      ensureCustomStyles();
    }
  });

  function init() {
    activateNova();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();