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

export function getTheme(name: string): Theme | undefined {
  return themes[name] || secretThemes[name];
}

export function getThemeNames(includeSecret: boolean = false): string[] {
  const names = Object.keys(themes);
  if (includeSecret) {
    names.push(...Object.keys(secretThemes));
  }
  return names;
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

  localStorage.setItem("theme", theme.name);
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function loadSavedTheme(): Theme {
  if (typeof window === "undefined") return themes.amber;
  const saved = localStorage.getItem("theme");
  return (saved && (themes[saved] || secretThemes[saved])) || themes.amber;
}
