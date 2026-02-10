export interface Theme {
  name: string;
  label: string;
  colors: {
    bg: string;
    text: string;
    dim: string;
    error: string;
    glow: string;
  };
  threeGlow: number;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export const themes: Record<string, Theme> = {
  amber: {
    name: "amber",
    label: "Amber (Default)",
    colors: {
      bg: "#221c0e",
      text: "#ffb000",
      dim: "#996a00",
      error: "#ff6b00",
      glow: "#ffb000",
    },
    threeGlow: 0xffb000,
  },
  green: {
    name: "green",
    label: "Green Phosphor",
    colors: {
      bg: "#0a1a0a",
      text: "#33ff33",
      dim: "#1a991a",
      error: "#ff4444",
      glow: "#33ff33",
    },
    threeGlow: 0x33ff33,
  },
  blue: {
    name: "blue",
    label: "IBM Blue",
    colors: {
      bg: "#0a0e1c",
      text: "#4488ff",
      dim: "#2255aa",
      error: "#ff4444",
      glow: "#4488ff",
    },
    threeGlow: 0x4488ff,
  },
  matrix: {
    name: "matrix",
    label: "Matrix",
    colors: {
      bg: "#000800",
      text: "#00ff41",
      dim: "#008f11",
      error: "#ff0000",
      glow: "#00ff41",
    },
    threeGlow: 0x00ff41,
  },
  dracula: {
    name: "dracula",
    label: "Dracula",
    colors: {
      bg: "#1a1525",
      text: "#bd93f9",
      dim: "#6272a4",
      error: "#ff5555",
      glow: "#bd93f9",
    },
    threeGlow: 0xbd93f9,
  },
};

export const secretThemes: Record<string, Theme> = {
  hotdog: {
    name: "hotdog",
    label: "Hot Dog Stand",
    colors: {
      bg: "#aa0000",
      text: "#ffff00",
      dim: "#cc8800",
      error: "#ffffff",
      glow: "#ffff00",
    },
    threeGlow: 0xffff00,
  },
  vaporwave: {
    name: "vaporwave",
    label: "V A P O R W A V E",
    colors: {
      bg: "#1a0a2e",
      text: "#ff71ce",
      dim: "#01cdfe",
      error: "#ff6e6e",
      glow: "#ff71ce",
    },
    threeGlow: 0xff71ce,
  },
  c64: {
    name: "c64",
    label: "Commodore 64",
    colors: {
      bg: "#40318d",
      text: "#7869c4",
      dim: "#5a4fb0",
      error: "#ff5555",
      glow: "#7869c4",
    },
    threeGlow: 0x7869c4,
  },
  cga: {
    name: "cga",
    label: "CGA Mode",
    colors: {
      bg: "#000000",
      text: "#55ffff",
      dim: "#ff55ff",
      error: "#ff5555",
      glow: "#55ffff",
    },
    threeGlow: 0x55ffff,
  },
};

/** Themes unlocked by easter eggs (not achievement-gated). */
export const easterEggThemes: Record<string, Theme> = {
  glitch: {
    name: "glitch",
    label: "GLITCH",
    colors: {
      bg: "#0a0008",
      text: "#ff0040",
      dim: "#880020",
      error: "#ff00ff",
      glow: "#ff0040",
    },
    threeGlow: 0xff0040,
  },
};

export function getTheme(name: string): Theme | undefined {
  return themes[name] || secretThemes[name] || easterEggThemes[name];
}

export function getThemeNames(includeSecret: boolean = false): string[] {
  const names = Object.keys(themes);
  if (includeSecret) {
    names.push(...Object.keys(secretThemes));
  }
  return names;
}

// Pixel-art arrow cursor SVG template (fill color is injected)
function arrowCursorSvg(color: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='22' height='34' shape-rendering='crispEdges'><path fill='%23000' d='M0 0h2v2h-2zM0 2h4v2h-4zM0 4h2v2h-2zM4 4h2v2h-2zM0 6h2v2h-2zM6 6h2v2h-2zM0 8h2v2h-2zM8 8h2v2h-2zM0 10h2v2h-2zM10 10h2v2h-2zM0 12h2v2h-2zM12 12h2v2h-2zM0 14h2v2h-2zM14 14h2v2h-2zM0 16h2v2h-2zM16 16h2v2h-2zM0 18h2v2h-2zM18 18h2v2h-2zM0 20h2v2h-2zM12 20h10v2h-10zM0 22h2v2h-2zM6 22h2v2h-2zM12 22h2v2h-2zM0 24h2v2h-2zM4 24h2v2h-2zM8 24h2v2h-2zM14 24h2v2h-2zM0 26h4v2h-4zM8 26h2v2h-2zM14 26h2v2h-2zM0 28h2v2h-2zM10 28h2v2h-2zM16 28h2v2h-2zM10 30h2v2h-2zM16 30h2v2h-2zM12 32h4v2h-4z'/><path fill='${color}' d='M2 4h2v2h-2zM2 6h4v2h-4zM2 8h6v2h-6zM2 10h8v2h-8zM2 12h10v2h-10zM2 14h12v2h-12zM2 16h14v2h-14zM2 18h16v2h-16zM2 20h10v2h-10zM2 22h4v2h-4zM8 22h4v2h-4zM2 24h2v2h-2zM10 24h4v2h-4zM10 26h4v2h-4zM12 28h4v2h-4zM12 30h4v2h-4z'/></svg>`;
}

// Pixel-art pointer hand cursor SVG template
function pointerCursorSvg(color: string): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='28' shape-rendering='crispEdges'><path fill='%23000' d='M10 0h4v2h-4zM8 2h2v2h-2zM14 2h2v2h-2zM8 4h2v2h-2zM14 4h2v2h-2zM8 6h2v2h-2zM14 6h2v2h-2zM2 8h4v2h-4zM8 8h2v2h-2zM14 8h4v2h-4zM0 10h2v2h-2zM6 10h4v2h-4zM14 10h2v2h-2zM18 10h2v2h-2zM0 12h2v2h-2zM18 12h2v2h-2zM0 14h2v2h-2zM18 14h2v2h-2zM2 16h2v2h-2zM16 16h2v2h-2zM4 18h2v2h-2zM16 18h2v2h-2zM4 20h2v2h-2zM14 20h2v2h-2zM6 22h2v2h-2zM12 22h2v2h-2zM6 24h2v2h-2zM12 24h2v2h-2zM8 26h4v2h-4z'/><path fill='${color}' d='M10 2h4v2h-4zM10 4h4v2h-4zM10 6h4v2h-4zM10 8h4v2h-4zM2 10h4v2h-4zM10 10h4v2h-4zM16 10h2v2h-2zM2 12h16v2h-16zM2 14h16v2h-16zM4 16h12v2h-12zM6 18h10v2h-10zM6 20h8v2h-8zM8 22h4v2h-4zM8 24h4v2h-4z'/></svg>`;
}

function setCursorProperties(root: HTMLElement, color: string) {
  // URL-encode the # in the hex color for data URI
  const encoded = color.replace("#", "%23");
  const arrow = `url("data:image/svg+xml,${arrowCursorSvg(encoded)}") 1 1, default`;
  const pointer = `url("data:image/svg+xml,${pointerCursorSvg(encoded)}") 11 1, pointer`;
  root.style.setProperty("--cursor-arrow", arrow);
  root.style.setProperty("--cursor-pointer", pointer);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--color-crt-bg", theme.colors.bg);
  root.style.setProperty("--color-crt-text", theme.colors.text);
  root.style.setProperty("--color-crt-dim", theme.colors.dim);
  root.style.setProperty("--color-crt-error", theme.colors.error);
  root.style.setProperty("--color-crt-glow", theme.colors.glow);
  root.style.setProperty("--color-crt-glow-rgb", hexToRgb(theme.colors.glow));
  root.style.setProperty("--color-crt-dim-rgb", hexToRgb(theme.colors.dim));
  root.style.setProperty(
    "--color-crt-error-rgb",
    hexToRgb(theme.colors.error)
  );
  setCursorProperties(root, theme.colors.text);

  localStorage.setItem("theme", theme.name);
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function loadSavedTheme(): Theme {
  if (typeof window === "undefined") return themes.amber;
  const saved = localStorage.getItem("theme");
  return (saved && (themes[saved] || secretThemes[saved] || easterEggThemes[saved])) || themes.amber;
}
