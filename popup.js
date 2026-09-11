(() => {
  "use strict";

  const STORAGE_KEY = "nova.theme";
  const FX_KEY = "nova.fx";
  const CUSTOM_KEY = "nova.customThemes";

  const GROUPS = [
    {
      label: "Dark",
      themes: [
        {
          id: "nova",
          name: "Nova",
          desc: "Violet · orchid · cyan",
          gradient: "linear-gradient(135deg, #8b7cff 0%, #c58cff 50%, #5ee7ff 100%)",
          accent: "#8b7cff",
          bg: "#070810",
          panel: "#0c0e18",
          ink0: "#f0f2ff",
          ink1: "#c2c8db",
        },
        {
          id: "cosmic",
          name: "Cosmic",
          desc: "Indigo · nebula · starlight",
          gradient: "linear-gradient(135deg, #6d7bff 0%, #9b8bff 55%, #9bb6ff 100%)",
          accent: "#6d7bff",
          bg: "#04050d",
          panel: "#0d101f",
          ink0: "#eef1fd",
          ink1: "#b4bad7",
        },
        {
          id: "aurora",
          name: "Aurora",
          desc: "Teal · aqua · boreal ice",
          gradient: "linear-gradient(135deg, #4fe0c4 0%, #3ec7d8 50%, #7db8ff 100%)",
          accent: "#4fe0c4",
          bg: "#040a0e",
          panel: "#071117",
          ink0: "#eef7f6",
          ink1: "#b3c9c6",
        },
        {
          id: "mono",
          name: "Mono",
          desc: "Graphite · platinum · steel",
          gradient: "linear-gradient(135deg, #9aa0b3 0%, #c6cad6 50%, #e4e8f2 100%)",
          accent: "#c6cad6",
          bg: "#0a0a0d",
          panel: "#101014",
          ink0: "#f2f2f5",
          ink1: "#bcbcc5",
        },
        {
          id: "sunset",
          name: "Sunset",
          desc: "Ember dusk · amber · coral",
          gradient: "linear-gradient(135deg, #ff8a5c 0%, #ffb36b 50%, #ff6f91 100%)",
          accent: "#ff8a5c",
          bg: "#0d0707",
          panel: "#16100c",
          ink0: "#fff1e7",
          ink1: "#d8c4b2",
        },
      ],
    },
    {
      label: "Light",
      themes: [
        {
          id: "nova-light",
          name: "Nova Light",
          desc: "Violet · orchid · cyan",
          gradient: "linear-gradient(135deg, #c9c3f5 0%, #dfc6ef 50%, #b9e9f5 100%)",
          accent: "#7b6cf0",
          bg: "#f5f6fa",
          panel: "#ffffff",
          ink0: "#101220",
          ink1: "#3d3f54",
        },
        {
          id: "cosmic-light",
          name: "Cosmic Light",
          desc: "Indigo · nebula · starlight",
          gradient: "linear-gradient(135deg, #b9bff0 0%, #c6c1f2 55%, #c3cef5 100%)",
          accent: "#5d6cee",
          bg: "#f0f1fa",
          panel: "#ffffff",
          ink0: "#0d1030",
          ink1: "#3c4270",
        },
        {
          id: "aurora-light",
          name: "Aurora Light",
          desc: "Teal · aqua · boreal ice",
          gradient: "linear-gradient(135deg, #aeeade 0%, #b4e2ea 50%, #c6daf2 100%)",
          accent: "#35c9b0",
          bg: "#f0f7f6",
          panel: "#ffffff",
          ink0: "#0c1a18",
          ink1: "#32504b",
        },
      ],
    },
  ];
  const ALL_THEMES = GROUPS.flatMap((g) => g.themes);

  /* ---------- shared color/validation helpers ---------- */
  const luma = (hex) => {
    let h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return 128;
    const n = parseInt(h, 16);
    return 0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255);
  };

  function validCustom(t) {
    return Boolean(
      t &&
        typeof t === "object" &&
        typeof t.id === "string" &&
        /^[a-z0-9]+(-[a-z0-9]+)*$/.test("" + t.id) &&
        !ALL_THEMES.some((b) => b.id === t.id) &&
        t.palette &&
        ["bg", "panel", "ink0", "ink1", "accent"].every(
          (k) => typeof t.palette[k] === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t.palette[k])
        )
    );
  }

  function customMeta(t) {
    return {
      id: "custom-" + t.id,
      name: t.name || t.id,
      desc: "Custom · imported",
      accent: t.palette.accent,
      gradient: "linear-gradient(135deg, " + t.palette.accent + ", " + t.palette.panel + " 60%, " + t.palette.bg + ")",
      bg: t.palette.bg,
      panel: t.palette.panel,
      ink0: t.palette.ink0,
      ink1: t.palette.ink1,
    };
  }

  function findTheme(id) {
    const b = ALL_THEMES.find((t) => t.id === id);
    if (b) return b;
    const c = state.customThemes.filter(validCustom).find((t) => "custom-" + t.id === id);
    return c ? customMeta(c) : null;
  }

  function groups() {
    const custom = state.customThemes.filter(validCustom).map(customMeta);
    return custom.length ? GROUPS.concat([{ label: "Custom", themes: custom }]) : GROUPS;
  }

  /* ---------- local (fallback) storage ---------- */
  function loadLocal(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveLocal(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch (_) {}
  }

  /* Page is the single source of truth; localStorage here is only a fallback. */
  const state = {
    theme: "",
    fx: "on",
    watermark: null,
    customThemes: loadLocal(CUSTOM_KEY, []).filter(validCustom),
  };

  function sendMessage(payload) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, payload).catch(() => {});
      }
    });
  }

  /* ---------- live preview ---------- */
  function applyPreview(id) {
    const t = findTheme(id);
    if (!t) return;
    const el = document.getElementById("preview");
    el.style.setProperty("--pv-bg", t.bg);
    el.style.setProperty("--pv-panel", t.panel);
    el.style.setProperty("--pv-ink0", t.ink0);
    el.style.setProperty("--pv-ink1", t.ink1);
    el.style.setProperty("--pv-accent", t.accent);
    el.style.setProperty("--pv-grad", t.gradient);
  }

  /* ---------- render (delegated events, no listener leaks) ---------- */
  const container = document.getElementById("themes");

  function render() {
    const checkSVG =
      '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.5L5 9l4.5-6" stroke="#e8ecf7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    container.innerHTML = groups().map((group) => {
      const buttons = group.themes.map(
        (t) => `
        <button class="theme-btn${t.id === state.theme ? " active" : ""}"
                data-theme="${t.id}"
                style="--swatch: ${t.accent}">
          <div class="swatch" style="background: ${t.gradient}"></div>
          <div class="theme-info">
            <div class="theme-name">${t.name}</div>
            <div class="theme-desc">${t.desc}</div>
          </div>
          <div class="check">${checkSVG}</div>
        </button>`
      ).join("");
      return `<div class="group-label">${group.label}</div>${buttons}`;
    }).join("");
  }

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".theme-btn");
    if (!btn || btn.dataset.theme === state.theme) return;
    const theme = btn.dataset.theme;

    state.theme = theme;
    saveLocal(STORAGE_KEY, theme);
    render();
    applyPreview(theme);
    sendMessage({ type: "nova:setTheme", theme });
  });

  container.addEventListener("mouseover", (e) => {
    const btn = e.target.closest(".theme-btn");
    if (btn) applyPreview(btn.dataset.theme);
  });
  container.addEventListener("mouseout", (e) => {
    if (e.target.closest(".theme-btn")) applyPreview(state.theme);
  });

  /* ---------- FX toggle ---------- */
  const fxToggle = document.getElementById("fxToggle");

  const setFxUI = (fx) => {
    fxToggle.setAttribute("aria-checked", fx === "on" ? "true" : "false");
  };

  fxToggle.addEventListener("click", () => {
    const next = fxToggle.getAttribute("aria-checked") === "true" ? "off" : "on";
    state.fx = next;
    saveLocal(FX_KEY, next);
    sendMessage({ type: "nova:setFx", fx: next });
  });

  /* ---------- Watermark toggle ---------- */
  const wmToggle = document.getElementById("wmToggle");
  const wmFields = document.getElementById("wmFields");
  const wmText = document.getElementById("wmText");
  const wmOpacity = document.getElementById("wmOpacity");

  const setWmUI = (wm) => {
    const has = Boolean(wm && wm.text);
    wmToggle.setAttribute("aria-checked", has ? "true" : "false");
    wmFields.hidden = !has;
    if (has) {
      wmText.value = wm.text;
      wmOpacity.value = String(wm.opacity);
    }
  };

  const pushWatermark = () => {
    const wm = { text: wmText.value.trim(), opacity: Number(wmOpacity.value) };
    state.watermark = wm.text ? wm : null;
    setWmUI(state.watermark);
    sendMessage({ type: "nova:setWatermark", watermark: state.watermark });
  };

  wmToggle.addEventListener("click", () => {
    const next = wmToggle.getAttribute("aria-checked") !== "true";
    if (next) {
      wmToggle.setAttribute("aria-checked", "true");
      wmFields.hidden = false;
      wmText.focus();
    } else {
      wmText.value = "";
      pushWatermark();
    }
  });

  wmText.addEventListener("input", pushWatermark);
  wmOpacity.addEventListener("input", pushWatermark);

  /* ---------- Export / Import ---------- */
  const exportBtn = document.getElementById("exportTheme");
  const importBtn = document.getElementById("importTheme");
  const importInput = document.getElementById("importInput");
  const toolNote = document.getElementById("toolNote");

  const download = (filename, text) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  let noteTimer = null;
  function showNote(text, ok) {
    toolNote.textContent = text;
    toolNote.classList.toggle("ok", Boolean(ok));
    toolNote.classList.toggle("err", !ok);
    toolNote.classList.add("show");
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => toolNote.classList.remove("show"), 2200);
  }

  exportBtn.addEventListener("click", () => {
    const t = findTheme(state.theme);
    if (!t) {
      showNote("No hay tema que exportar", false);
      return;
    }
    const slug = state.theme.startsWith("custom-") ? state.theme.slice(7) : state.theme;
    const data = {
      schema: "nova-skin/theme/v1",
      id: slug,
      name: t.name,
      dark: luma(t.bg) < 128,
      palette: { bg: t.bg, panel: t.panel, ink0: t.ink0, ink1: t.ink1, accent: t.accent },
    };
    download("nova-theme-" + slug + ".json", JSON.stringify(data, null, 2));
    showNote("Exportado " + t.name, true);
  });

  function parseImport(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      return { error: "No es un JSON válido" };
    }
    if (!data || typeof data !== "object") return { error: "El JSON no es un objeto" };
    const t = {
      id: String(data.id || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""),
      name: String(data.name || data.id || "Custom"),
      dark: typeof data.dark === "boolean" ? data.dark : luma(data.palette && data.palette.bg) < 128,
      palette: data.palette || {},
    };
    if (!validCustom(t)) return { error: "Paleta inválida — faltan bg/panel/ink0/ink1/accent" };
    if (ALL_THEMES.some((b) => b.id === t.id)) return { error: "El id \"" + t.id + "\" ya es un tema nativo" };
    return { theme: t };
  }

  function applyImported(t) {
    state.customThemes = state.customThemes.filter((c) => c.id !== t.id).concat([t]);
    saveLocal(CUSTOM_KEY, state.customThemes);
    state.theme = "custom-" + t.id;
    saveLocal(STORAGE_KEY, state.theme);
    render();
    applyPreview(state.theme);
    sendMessage({ type: "nova:setCustomThemes", themes: state.customThemes });
    sendMessage({ type: "nova:setTheme", theme: state.theme });
    showNote("Importado " + t.name, true);
  }

  importBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", () => {
    const f = importInput.files && importInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = parseImport(String(reader.result));
      if (r.error) showNote(r.error, false);
      else applyImported(r.theme);
    };
    reader.readAsText(f);
    importInput.value = "";
  });

  /* ---------- boot: render fallback, then sync from the page ---------- */
  if (!state.theme) state.theme = "nova";
  render();
  applyPreview(state.theme);
  setFxUI(state.fx);
  setWmUI(state.watermark);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { type: "nova:getState" }, (res) => {
      if (res && typeof res.theme === "string" && findTheme(res.theme)) {
        state.theme = res.theme;
        state.fx = res.fx === "off" ? "off" : "on";
        state.customThemes = (res.customThemes || []).filter(validCustom);
        if (res.watermark && res.watermark.text) state.watermark = res.watermark;
        saveLocal(CUSTOM_KEY, state.customThemes);
        render();
        applyPreview(state.theme);
        setFxUI(state.fx);
        setWmUI(state.watermark);
      }
    });
  });
})();