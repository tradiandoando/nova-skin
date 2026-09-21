(() => {
  "use strict";

  /* El popup puede re-inyectar este script (chrome.scripting) cuando la
     pestaña quedó sin content script tras recargar la extensión. Este
     guard evita doble inicialización (observers, listeners, etc.). */
  if (window.__NOVA_SKIN_ACTIVE) return;
  window.__NOVA_SKIN_ACTIVE = true;

  const NOVA_CLASS = "nova-skin-active";
  const STORAGE_KEY = "nova.theme";
  const FX_KEY = "nova.fx";
  const CUSTOM_KEY = "nova.customThemes";
  const WATERMARK_KEY = "nova.watermark";
  const WATERMARK_ID = "nova-watermark";
  const DEFAULT_WATERMARK = { text: "OPEN NOVA", opacity: 75 };
  const WATERMARK_OFF = { off: true };

  /* fuente ASCII "ANSI Shadow" (figlet, public domain) */
  const NOVA_ASCII_FONT = {
    " ": ["", "", "", "", "", ""],
    "!": ["\u2588\u2588\u2557", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2550\u255d", "\u2588\u2588\u2557", "\u255a\u2550\u255d"],
    "\"": ["", "", "", "", "", ""],
    "#": [" \u2588\u2588\u2557 \u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2588\u2588\u2554\u2550\u2588\u2588\u2554\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2588\u2588\u2554\u2550\u2588\u2588\u2554\u255d", " \u255a\u2550\u255d \u255a\u2550\u255d"],
    "$": ["\u2584\u2584\u2588\u2588\u2588\u2584\u2584\u00b7", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2580\u2580\u2580\u2550\u2550\u255d"],
    "%": ["\u2588\u2588\u2557 \u2588\u2588\u2557", "\u255a\u2550\u255d\u2588\u2588\u2554\u255d", "  \u2588\u2588\u2554\u255d", " \u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u255d\u2588\u2588\u2557", "\u255a\u2550\u255d \u255a\u2550\u255d"],
    "&": ["   \u2588\u2588\u2557", "   \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2588\u2588\u2554\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "'": ["", "", "", "", "", ""],
    "(": [" \u2588\u2588\u2557", "\u2588\u2588\u2554\u255d", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2588\u2588\u2557", " \u255a\u2550\u255d"],
    ")": ["\u2588\u2588\u2557", "\u255a\u2588\u2588\u2557", " \u2588\u2588\u2551", " \u2588\u2588\u2551", "\u2588\u2588\u2554\u255d", "\u255a\u2550\u255d"],
    "*": ["", "\u2584 \u2588\u2588\u2557\u2584", " \u2588\u2588\u2588\u2588\u2557", "\u2580\u255a\u2588\u2588\u2554\u2580", "  \u255a\u2550\u255d", ""],
    "+": ["", "", "", "", "", ""],
    ",": ["", "", "", "", "\u2584\u2588\u2557", "\u255a\u2550\u255d"],
    "-": ["", "", "\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u255d", "", ""],
    ".": ["", "", "", "", "\u2588\u2588\u2557", "\u255a\u2550\u255d"],
    "/": ["    \u2588\u2588\u2557", "   \u2588\u2588\u2554\u255d", "  \u2588\u2588\u2554\u255d", " \u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u255d", "\u255a\u2550\u255d"],
    "0": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2551\u2588\u2588\u2554\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2554\u255d\u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "1": [" \u2588\u2588\u2557", "\u2588\u2588\u2588\u2551", "\u255a\u2588\u2588\u2551", " \u2588\u2588\u2551", " \u2588\u2588\u2551", " \u255a\u2550\u255d"],
    "2": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2557", " \u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "3": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2557", " \u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "4": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "     \u2588\u2588\u2551", "     \u255a\u2550\u255d"],
    "5": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "6": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "7": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "    \u2588\u2588\u2554\u255d", "   \u2588\u2588\u2554\u255d", "   \u2588\u2588\u2551", "   \u255a\u2550\u255d"],
    "8": [" \u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u255a\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u255a\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u255d"],
    "9": [" \u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2551", " \u255a\u2550\u2550\u2550\u2588\u2588\u2551", " \u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u255d"],
    ":": ["", "\u2588\u2588\u2557", "\u255a\u2550\u255d", "\u2588\u2588\u2557", "\u255a\u2550\u255d", ""],
    ";": ["", "\u2588\u2588\u2557", "\u255a\u2550\u255d", "\u2584\u2588\u2557", "\u2580\u2550\u255d", ""],
    "<": ["  \u2588\u2588\u2557", " \u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u255d", "\u255a\u2588\u2588\u2557", " \u255a\u2588\u2588\u2557", "  \u255a\u2550\u255d"],
    "=": ["", "", "", "", "", ""],
    ">": ["\u2588\u2588\u2557", "\u255a\u2588\u2588\u2557", " \u255a\u2588\u2588\u2557", " \u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u255d", "\u255a\u2550\u255d"],
    "?": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2557", "  \u2584\u2588\u2588\u2588\u2554\u255d", "  \u2580\u2580\u2550\u2550\u255d", "  \u2588\u2588\u2557", "  \u255a\u2550\u255d"],
    "@": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551\u2588\u2588\u2557\u2588\u2588\u2551", "\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2551", "\u255a\u2588\u2551\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u255d\u255a\u2550\u2550\u2550\u255d"],
    "A": [" \u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "B": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "C": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "D": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "E": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "F": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "G": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551  \u2588\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "H": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "I": ["\u2588\u2588\u2557", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "J": ["     \u2588\u2588\u2557", "     \u2588\u2588\u2551", "     \u2588\u2588\u2551", "\u2588\u2588   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u255d"],
    "K": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u2588\u2588\u2551 \u2588\u2588\u2554\u255d", "\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2557", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "L": ["\u2588\u2588\u2557", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "M": ["\u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551", "\u2588\u2588\u2551\u255a\u2588\u2588\u2554\u255d\u2588\u2588\u2551", "\u2588\u2588\u2551 \u255a\u2550\u255d \u2588\u2588\u2551", "\u255a\u2550\u255d     \u255a\u2550\u255d"],
    "N": ["\u2588\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551", "\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551", "\u2588\u2588\u2551\u255a\u2588\u2588\u2557\u2588\u2588\u2551", "\u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u2550\u2550\u255d"],
    "O": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "P": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "Q": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551\u2584\u2584 \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2580\u2580\u2550\u255d"],
    "R": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "S": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "T": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255d", "   \u2588\u2588\u2551", "   \u2588\u2588\u2551", "   \u2588\u2588\u2551", "   \u255a\u2550\u255d"],
    "U": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "V": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2588\u2554\u255d", "  \u255a\u2550\u2550\u2550\u255d"],
    "W": ["\u2588\u2588\u2557    \u2588\u2588\u2557", "\u2588\u2588\u2551    \u2588\u2588\u2551", "\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551", "\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u255d\u255a\u2550\u2550\u255d"],
    "X": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u255a\u2588\u2588\u2557\u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2554\u255d", " \u2588\u2588\u2554\u2588\u2588\u2557", "\u2588\u2588\u2554\u255d \u2588\u2588\u2557", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "Y": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2588\u2554\u255d", "  \u255a\u2588\u2588\u2554\u255d", "   \u2588\u2588\u2551", "   \u255a\u2550\u255d"],
    "Z": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2588\u2588\u2588\u2554\u255d", "  \u2588\u2588\u2588\u2554\u255d", " \u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "[": ["\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u255d", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u255d"],
    "\\": ["", "", "", "", "", ""],
    "]": ["\u2588\u2588\u2588\u2557", "\u255a\u2588\u2588\u2551", " \u2588\u2588\u2551", " \u2588\u2588\u2551", "\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u255d"],
    "^": [" \u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2588\u2588\u2557", "\u255a\u2550\u255d\u255a\u2550\u255d", "", "", ""],
    "_": ["", "", "", "", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "`": ["", "", "", "", "", ""],
    "a": [" \u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "b": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "c": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "d": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "e": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "f": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "g": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551  \u2588\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "h": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "i": ["\u2588\u2588\u2557", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "j": ["     \u2588\u2588\u2557", "     \u2588\u2588\u2551", "     \u2588\u2588\u2551", "\u2588\u2588   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u255d"],
    "k": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u2588\u2588\u2551 \u2588\u2588\u2554\u255d", "\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2557", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "l": ["\u2588\u2588\u2557", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "m": ["\u2588\u2588\u2588\u2557   \u2588\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2551", "\u2588\u2588\u2554\u2588\u2588\u2588\u2588\u2554\u2588\u2588\u2551", "\u2588\u2588\u2551\u255a\u2588\u2588\u2554\u255d\u2588\u2588\u2551", "\u2588\u2588\u2551 \u255a\u2550\u255d \u2588\u2588\u2551", "\u255a\u2550\u255d     \u255a\u2550\u255d"],
    "n": ["\u2588\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551", "\u2588\u2588\u2554\u2588\u2588\u2557 \u2588\u2588\u2551", "\u2588\u2588\u2551\u255a\u2588\u2588\u2557\u2588\u2588\u2551", "\u2588\u2588\u2551 \u255a\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u2550\u2550\u255d"],
    "o": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "p": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2550\u255d", "\u2588\u2588\u2551", "\u255a\u2550\u255d"],
    "q": [" \u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551\u2584\u2584 \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2580\u2580\u2550\u255d"],
    "r": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557", "\u2588\u2588\u2551  \u2588\u2588\u2551", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "s": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2588\u2588\u2551", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "t": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2588\u2588\u2554\u2550\u2550\u255d", "   \u2588\u2588\u2551", "   \u2588\u2588\u2551", "   \u2588\u2588\u2551", "   \u255a\u2550\u255d"],
    "u": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u2550\u2550\u2550\u255d"],
    "v": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u2588\u2588\u2551   \u2588\u2588\u2551", "\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2588\u2554\u255d", "  \u255a\u2550\u2550\u2550\u255d"],
    "w": ["\u2588\u2588\u2557    \u2588\u2588\u2557", "\u2588\u2588\u2551    \u2588\u2588\u2551", "\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551", "\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551", "\u255a\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255d", " \u255a\u2550\u2550\u255d\u255a\u2550\u2550\u255d"],
    "x": ["\u2588\u2588\u2557  \u2588\u2588\u2557", "\u255a\u2588\u2588\u2557\u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2554\u255d", " \u2588\u2588\u2554\u2588\u2588\u2557", "\u2588\u2588\u2554\u255d \u2588\u2588\u2557", "\u255a\u2550\u255d  \u255a\u2550\u255d"],
    "y": ["\u2588\u2588\u2557   \u2588\u2588\u2557", "\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d", " \u255a\u2588\u2588\u2588\u2588\u2554\u255d", "  \u255a\u2588\u2588\u2554\u255d", "   \u2588\u2588\u2551", "   \u255a\u2550\u255d"],
    "z": ["\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2588\u2588\u2588\u2554\u255d", "  \u2588\u2588\u2588\u2554\u255d", " \u2588\u2588\u2588\u2554\u255d", "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557", "\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d"],
    "{": ["", "", "", "", "", ""],
    "|": ["", "", "", "", "", ""],
    "}": ["", "", "", "", "", ""],
    "~": ["", "", "", "", "", ""],
  };
  const NOVA_ASCII_H = 6;

  function asciiCols(text) {
    const t = String(text).toUpperCase().slice(0, 24);
    let w = 0;
    for (const ch of t) {
      const g = NOVA_ASCII_FONT[ch] || NOVA_ASCII_FONT["?"];
      w += g.reduce((m, r) => Math.max(m, r.length), 0);
    }
    return w + Math.max(0, t.length - 1);
  }

  /* Arma el arte por palabra: cada palabra en un span con clip propio
     (bicolor "open" cian / "nova" violeta). Los spans inline-block se
     pegan con un espacio real para conservar una columna de separación. */
  function asciiBuild(el, text) {
    el.textContent = "";
    const t = String(text).toUpperCase().slice(0, 24);
    const parts = t.split(/\s+/).filter(Boolean);
    if (!parts.length) return;
    const H = NOVA_ASCII_H;
    parts.forEach((seg, i) => {
      const rows = [];
      for (let r = 0; r < H; r++) {
        rows.push(
          seg
            .split("")
            .map((ch) => (NOVA_ASCII_FONT[ch] || NOVA_ASCII_FONT["?"])[r] || "")
            .join(" ")
        );
      }
      const s = document.createElement("span");
      s.className = "nova-word " + (i % 2 ? "nova-violet" : "nova-cyan");
      s.textContent = rows.join("\n");
      el.appendChild(s);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  function asciiFitPx(text) {
    const cols = asciiCols(text);
    let w = window.innerWidth;
    const anchor = document.querySelector('[data-testid="thread-container"], [data-testid*="thread"], .nova-anchor-thread');
    if (anchor && anchor.getBoundingClientRect) {
      const r = anchor.getBoundingClientRect();
      if (r && r.width > 0) w = r.width;
    }
    const fit = Math.min(Math.max(280, w * 0.86), 860);
    return Math.max(12, Math.min(64, fit / (cols * 0.62)));
  }
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
      el.querySelector(".nova-watermark-word").className = "nova-watermark-word";
      el.querySelector(".nova-watermark-img").src = wm.image;
      if (textEl) {
        textEl.textContent = "";
        textEl.classList.remove("nova-watermark-ascii");
        textEl.style.fontSize = "";
        textEl.style.lineHeight = "";
      }
    } else {
      if (imgEl) imgEl.remove();
      if (textEl) {
        textEl.textContent = "";
        asciiBuild(textEl, wm.text);
        textEl.classList.add("nova-watermark-ascii");
        textEl.style.fontSize = asciiFitPx(wm.text) + "px";
        textEl.style.lineHeight = "1.04";
      }
      word.className = "nova-watermark-word nova-ascii";
    }
    el.style.setProperty("--wm-active", wm.opacity / 100);
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

  /* Estados de la marca (automáticos):
     - boot: sin conversación → se muestra ARRIBA del chat, centrada
       horizontal (como opencode). No desaparece al hacer clic o al
       escribir en el composer.
     - oculta: al enviarse el 1er mensaje / existir conversación →
       desaparece con fade. content.js alterna .nova-watermark-hidden
       y posiciona top/left/transform. */
  function conversationSignal() {
    const strong = [
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      "[data-testid='conversation-turn']",
      "[data-testid='chat-message']",
    ];
    for (const s of strong) {
      if (document.querySelector(s)) {
        weakConvSeen = null;
        return s;
      }
    }
    if (/\/c\//.test(location.pathname)) {
      weakConvSeen = null;
      return "url:/c/";
    }
    /* Señales débiles (podrían aparecer en la UI vacía): solo se aceptan
       si persisten en 2 chequeos seguidos (evita ocultar de más). */
    const weak = ['article', '[data-testid*="message"]', '[data-testid*="turn"]'];
    for (const s of weak) {
      if (document.querySelector(s)) {
        if (weakConvSeen === s) return s;
        weakConvSeen = s;
        return null;
      }
    }
    weakConvSeen = null;
    return null;
  }

  function hasConversation() {
    if (submitted) return true;
    return conversationSignal() !== null;
  }

  /* Detección del envío REAL del primer mensaje, independiente del DOM
     que use ChatGPT: 1) Enter con texto → si la caja del composer se vacía
     a los 400ms, se envió; 2) submit del form; 3) clic en enviar.
     Soporta tanto <textarea> como <div contenteditable> (el composer
     actual de ChatGPT). Nada se bloquea ni se previene (passive/capture):
     el chat nunca se toca. */
  const armNet = () => {
    armed = true;
  };
  document.addEventListener("keydown", armNet, { passive: true, once: true });
  document.addEventListener("pointerdown", armNet, {
    passive: true,
    once: true,
  });

  function trackSend() {
    if (sendHooked) return;
    const t = document.querySelector(
      '#prompt-textarea, main textarea, main div[contenteditable="true"]'
    );
    if (!t) return;
    sendHooked = true;
    const composerText = () =>
      (t.value !== undefined ? t.value : t.innerText || "") || "";
    t.addEventListener(
      "keydown",
      (e) => {
        if (
          (e.key === "Enter" || e.key === "NumpadEnter") &&
          !e.shiftKey &&
          composerText().trim().length > 0
        ) {
          setTimeout(() => {
            if (composerText().trim() === "") {
              submitted = true;
              scheduleAlign();
            }
          }, 400);
        }
      },
      { passive: true }
    );
    const form = t.closest("form");
    if (form) {
      form.addEventListener(
        "submit",
        () => {
          submitted = true;
          scheduleAlign();
        },
        true
      );
    }
    document.addEventListener(
      "click",
      (e) => {
        const b =
          e.target && e.target.closest
            ? e.target.closest(
                '[data-testid*="send"], [aria-label*="send" i], button[type="submit"]'
              )
            : null;
        if (b) {
          submitted = true;
          scheduleAlign();
        }
      },
      true
    );
  }

/* El banner se posiciona cubriendo la caja del área principal del chat
     (main/thread) con --wm-left/--wm-width; el centrado horizontal lo hace
     flex (justify-content:center), así queda perfecto respecto del chat y
     no de la ventana, y sigue al sidebar y al tamaño de ventana. --wm-top
     es la única posición vertical (la fija una vez arriba del contenido). */

     /* Margen superior (px) entre el borde del chat y el banner. */
     const WM_TOP_BIAS = 40;

  let wmTop = null;
  let weakConvSeen = null;
  let submitted = false;
  let emptyPolls = 0;
  let sendHooked = false;
  let tLenPrev = 0;
  let armed = false;
  let pollPeak = -1;

  /* Rect de ancla: la caja del área principal del chat. */
  function anchorRect() {
    const el = document.querySelector(
      '[data-testid="thread-container"], [data-testid*="thread"], main, .nova-anchor-thread'
    );
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
    return null;
  }

  function alignWatermark() {
    const el = document.getElementById(WATERMARK_ID);
    if (!el) return;
    /* Red final: aunque el composer cambie de DOM para siempre, si el
       thread empieza a crecer de texto es porque hay una conversación
       en curso → oculta. Se arma con el primer uso del teclado/clic para
       no confundir el contenido estático de carga con una respuesta. */
    if (armed && !submitted) {
      const tN =
        document.querySelector(
          '[data-testid="thread-container"], [data-testid*="thread"]'
        ) || document.querySelector("main");
      const len = tN ? (tN.textContent || "").length : 0;
      if (pollPeak < 0) pollPeak = len;
      else {
        if (len - pollPeak > 250) {
          submitted = true;
        }
        if (len > pollPeak) pollPeak = len;
      }
    }
    let show = !hasConversation();
    if (!show) {
      /* Oculto. El banner SOLO reaparece cuando la conversación se limpió
         de verdad (chat nuevo): el texto del thread caía de muchos a casi
         ninguno. Previamente usábamos "composer vacío + sin señal" y eso
         resucitaba el banner EN MEDIO de una respuesta viva (el bug que
         tapaba la respuesta). Aquí, con contenido largo presente, jamás
         resetea. */
      const thread =
        document.querySelector(
          '[data-testid="thread-container"], [data-testid*="thread"]'
        ) || document.querySelector("main");
      const tLen = thread ? (thread.textContent || "").length : 0;
      const dropped =
        tLenPrev >= 200 && tLen < 120 && !/\/c\//.test(location.pathname);
      if (dropped) emptyPolls += 1;
      else if (tLen >= 120) emptyPolls = 0;
      tLenPrev = tLen;
      if (emptyPolls >= 3) {
        emptyPolls = 0;
        submitted = false;
        pollPeak = -1;
        show = true;
      }
    } else {
      emptyPolls = 0;
      tLenPrev = 0;
    }
    el.classList.toggle("nova-watermark-hidden", !show);
    if (!show) {
      wmTop = null;
      el.style.removeProperty("--wm-left");
      el.style.removeProperty("--wm-width");
      el.style.removeProperty("--wm-top");
      return;
    }
    const r = anchorRect();
    if (!r) return;
    el.style.setProperty("--wm-left", Math.round(r.left) + "px");
    el.style.setProperty("--wm-width", Math.round(r.width) + "px");
    if (wmTop === null) wmTop = Math.max(24, Math.round(r.top) + WM_TOP_BIAS);
    el.style.setProperty("--wm-top", wmTop + "px");
  }

  let alignRaf = 0;
  function scheduleAlign() {
    if (alignRaf) return;
    alignRaf = requestAnimationFrame(() => {
      alignRaf = 0;
      alignWatermark();
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
    const alignWatermarkCross = () => scheduleAlign();
    const check = () => {
      raf = 0;
      const n = document.querySelectorAll('[data-message-author-role="assistant"]').length;
      if (n > assistantCount) pulseResponse();
      assistantCount = n;
      alignWatermarkCross();
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
    const rectOf = (node) => {
      const rr = node.getBoundingClientRect();
      return [Math.round(rr.left), Math.round(rr.top), Math.round(rr.width), Math.round(rr.height)];
    };
    const prompt = document.querySelector("#prompt-textarea");
    const inputCx = prompt ? prompt.getBoundingClientRect().left + prompt.getBoundingClientRect().width / 2 : null;
    const mainEl = document.querySelector("main");
    const threadEl = document.querySelector(
      '[data-testid="thread-container"], [data-testid*="thread"], .nova-anchor-thread'
    );
    const geo = {
      bannerCx: Math.round(cx),
      inputCx: inputCx !== null ? Math.round(inputCx) : null,
      diff: inputCx !== null ? Math.round(cx - inputCx) : null,
      conv: hasConversation(),
      convSignal: conversationSignal(),
      main: mainEl ? rectOf(mainEl) : null,
      thread: threadEl ? rectOf(threadEl) : null,
      viewport: [window.innerWidth, window.innerHeight],
      banner: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    };
    return {
      exists: true,
      style: [s.display, s.zIndex, s.fontSize, s.opacity, s.visibility].join(","),
      size: [Math.round(r.width), Math.round(r.height)],
      onTop: top ? top.tagName + "." + String(top.className || "").slice(0, 60) : null,
      geo,
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
      matrixStop();
    } else {
      delete root.dataset.novaFx;
      matrixStart();
    }
  }

  /* ---------- campo de partículas digitales (nova-matrix) ----------
     Sistema independiente de la atmosphere: burbujas/partículas que
     nacen desde abajo, ascienden con deriva lateral suave y se
     desvanecen en la parte superior. Vive en un único contenedor
     (nova-matrix-field) creado en <body>; arranca con FX on y se
     detiene/limpia con FX off. Respeta prefers-reduced-motion (no
     crea nada) y usa un z-index positivo y NO bloquea la UI. */
  const MATRIX_ID = "nova-matrix-field";
  const MATRIX_CHARS = ["0", "1", "·"];
  const MATRIX_CODE = ["0", "1"];
  const MATRIX_MAX_PARTICLES = 15;
  const MATRIX_MAX_BUBBLES = 10;
  const MATRIX_MAX = MATRIX_MAX_PARTICLES + MATRIX_MAX_BUBBLES;
  const MATRIX_MIN_MS = 300;
  const MATRIX_MAX_MS = 420;
  /* Acentos de los themes disponibles (nova, cosmic, aurora, mono,
     sunset + variantes light): cada partícula/burbuja toma un color
     distinto, todo el espectro NOVA conviviendo en el campo. */
  const MATRIX_COLORS = [
    "#8b7cff", "#c58cff", "#5ee7ff",
    "#6d7bff", "#9b8bff", "#9bb6ff",
    "#4fe0c4", "#7db8ff", "#66e3d8",
    "#c6cad6", "#dfe3ee", "#9aa0b3",
    "#ff8a5c", "#ffb36b", "#ff6f91",
    "#7b6cf0", "#b57cef", "#3dd4ef",
    "#5d6cee", "#8b7cf5", "#8496ff",
    "#35c9b0", "#5a9de0", "#36c7b8",
  ];

  let matrixField = null;
  let matrixTimer = 0;
  let matrixParts = 0;
  let matrixBubbles = 0;
  let matrixRunning = false;

  function matrixReduceMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function ensureMatrixField() {
    if (!document.body) return null;
    if (!matrixField || !matrixField.isConnected) {
      matrixField = document.getElementById(MATRIX_ID);
    }
    if (!matrixField) {
      matrixField = document.createElement("div");
      matrixField.id = MATRIX_ID;
      matrixField.className = "nova-matrix-field";
      matrixField.setAttribute("aria-hidden", "true");
      document.body.appendChild(matrixField);
    }
    return matrixField;
  }

  const matrixPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function spawnMatrixItem(field, bubble) {
    const el = document.createElement("span");
    if (bubble) {
      el.className = "nova-matrix-bubble";
    } else if (Math.random() < 0.4) {
      /* Ráfaga de código: mini-columna ascendente de 0/1 con la
         cabecera clara (guiño del "rolling code" Matrix). */
      el.className = "nova-matrix-wisp";
      const rows = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < rows; i++) {
        if (i > 0) el.appendChild(document.createTextNode("\n"));
        if (i === 0) {
          const lead = document.createElement("span");
          lead.className = "nova-matrix-wisp--lead";
          lead.textContent = matrixPick(MATRIX_CODE);
          el.appendChild(lead);
        } else {
          el.appendChild(document.createTextNode(matrixPick(MATRIX_CODE)));
        }
      }
    } else {
      el.className = "nova-matrix-particle";
      el.textContent = matrixPick(MATRIX_CHARS);
    }
    const durMs = 6000 + Math.floor(Math.random() * 5000);
    const amp = Math.round(Math.random() * 60 - 30);
    el.style.setProperty("--mx-x", (4 + Math.random() * 92).toFixed(1) + "%");
    el.style.setProperty("--mx-size", (bubble ? 10 + Math.random() * 12 : 9 + Math.random() * 5).toFixed(1) + "px");
    el.style.setProperty("--mx-dur", durMs + "ms");
    el.style.setProperty("--mx-opacity", (bubble ? 0.16 + Math.random() * 0.24 : 0.1 + Math.random() * 0.22).toFixed(2));
    el.style.setProperty("--mx-color", matrixPick(MATRIX_COLORS));
    el.style.setProperty("--mx-drift", amp + "px");
    el.style.setProperty("--mx-drift-back", Math.round(amp * -0.7) + "px");
    field.appendChild(el);
    if (bubble) matrixBubbles += 1;
    else matrixParts += 1;
    const done = () => {
      if (!el.isConnected) return;
      el.removeEventListener("animationend", done);
      el.remove();
      if (bubble) matrixBubbles = Math.max(0, matrixBubbles - 1);
      else matrixParts = Math.max(0, matrixParts - 1);
    };
    el.addEventListener("animationend", done, { once: true });
    setTimeout(done, durMs + 600);
  }

  function matrixSchedule() {
    if (matrixTimer) return;
    matrixTimer = setTimeout(
      matrixTick,
      MATRIX_MIN_MS + Math.random() * (MATRIX_MAX_MS - MATRIX_MIN_MS)
    );
  }

  function matrixFlicker(field) {
    if (Math.random() < 0.5) return;
    const glyphs = field.querySelectorAll(".nova-matrix-particle");
    if (!glyphs.length) return;
    glyphs[Math.floor(Math.random() * glyphs.length)].textContent = matrixPick(MATRIX_CHARS);
  }

  function matrixTick() {
    matrixTimer = 0;
    if (!matrixRunning || matrixReduceMotion()) return;
    const field = ensureMatrixField();
    if (field) {
      let wantBubble;
      if (matrixBubbles >= MATRIX_MAX_BUBBLES) wantBubble = false;
      else if (matrixParts >= MATRIX_MAX_PARTICLES) wantBubble = true;
      else wantBubble = Math.random() < 0.4;
      if (
        (wantBubble && matrixBubbles < MATRIX_MAX_BUBBLES) ||
        (!wantBubble && matrixParts < MATRIX_MAX_PARTICLES)
      ) {
        spawnMatrixItem(field, wantBubble);
      }
      matrixFlicker(field);
    }
    matrixSchedule();
  }

  function matrixStart() {
    if (matrixRunning || matrixReduceMotion()) return;
    if (!document.body) {
      if (typeof requestAnimationFrame === "function") requestAnimationFrame(matrixStart);
      return;
    }
    const field = ensureMatrixField();
    if (!field) return;
    matrixRunning = true;
    matrixParts = 0;
    matrixBubbles = 0;
    matrixSchedule();
  }

  function matrixStop() {
    matrixRunning = false;
    if (matrixTimer) {
      clearTimeout(matrixTimer);
      matrixTimer = 0;
    }
    if (matrixField && matrixField.isConnected) matrixField.remove();
    matrixField = null;
    matrixParts = 0;
    matrixBubbles = 0;
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
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(scheduleAlign);
      const probe = () => {
        const a = document.querySelector(
          'main, [data-testid="thread-container"], [data-testid*="thread"], .nova-anchor-thread'
        );
        if (a) {
          ro.observe(a);
          return true;
        }
        return false;
      };
      if (!probe()) {
        const t = setInterval(() => {
          if (probe()) clearInterval(t);
        }, 800);
        setTimeout(() => clearInterval(t), 20000);
      }
    }
    watchReplies();
    /* Red de seguridad: aunque el observer se pierda mutaciones, cada
       700ms se re-chequea el estado (visible en chat vacío / oculto con
       fade al iniciarse la conversación). También vuelve a intentar el
       tracking del envío hasta que exista el composer. Coste despreciable. */
    setInterval(() => {
      trackSend();
      scheduleAlign();
    }, 700);
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