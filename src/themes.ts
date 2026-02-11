import type { ThemeColors, OverlayPalette } from './types';

// Default custom color palette for auto-fill when fewer colors than users
export const DEFAULT_CUSTOM_COLORS = [
  '39d353', '58a6ff', 'bc8cff', 'e3b341', 'f47067',
  'db61a2', '3fb950', '79c0ff', 'd2a8ff', 'f0883e',
  'ff4500', '1abc9c', '6c5ce7', 'fd79a8', '00cec9',
  'e17055', '0984e3', 'fdcb6e',
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Generate 4 intensity levels from a base color
export function generateLevels(baseHex: string, dark: boolean): [string, string, string, string] {
  const [h, s] = hexToHsl(baseHex);
  if (dark) {
    return [`#${hslToHex(h, s, 15)}`, `#${hslToHex(h, s, 30)}`, `#${hslToHex(h, s, 50)}`, `#${hslToHex(h, s, 65)}`];
  }
  return [`#${hslToHex(h, s, 85)}`, `#${hslToHex(h, s, 65)}`, `#${hslToHex(h, s, 45)}`, `#${hslToHex(h, s, 30)}`];
}

// Build a full ThemeColors from a single hex + light/dark mode
export function buildCustomTheme(baseHex: string, dark: boolean): ThemeColors {
  const levels = generateLevels(baseHex, dark);
  if (dark) {
    return {
      empty: '#161b22',
      levels,
      text: '#c9d1d9',
      background: '#0d1117',
      border: '#30363d',
    };
  }
  return {
    empty: '#ebedf0',
    levels,
    text: '#24292f',
    background: '#ffffff',
    border: '#d0d7de',
  };
}

const THEMES: Record<string, ThemeColors> = {
  github: {
    empty: '#ebedf0',
    levels: ['#9be9a8', '#40c463', '#30a14e', '#216e39'],
    text: '#24292f',
    background: '#ffffff',
    border: '#d0d7de',
  },
  'github-dark': {
    empty: '#161b22',
    levels: ['#0e4429', '#006d32', '#26a641', '#39d353'],
    text: '#c9d1d9',
    background: '#0d1117',
    border: '#30363d',
  },
  blue: {
    empty: '#ebedf0',
    levels: ['#c6dbef', '#6baed6', '#2171b5', '#08519c'],
    text: '#24292f',
    background: '#ffffff',
    border: '#d0d7de',
  },
  purple: {
    empty: '#ebedf0',
    levels: ['#d4b9da', '#c994c7', '#df65b0', '#980043'],
    text: '#24292f',
    background: '#ffffff',
    border: '#d0d7de',
  },
  orange: {
    empty: '#ebedf0',
    levels: ['#fdd0a2', '#fdae6b', '#f16913', '#d94801'],
    text: '#24292f',
    background: '#ffffff',
    border: '#d0d7de',
  },
  'blue-dark': {
    empty: '#161b22',
    levels: ['#0a3069', '#0550ae', '#388bfd', '#58a6ff'],
    text: '#c9d1d9',
    background: '#0d1117',
    border: '#30363d',
  },
  'purple-dark': {
    empty: '#161b22',
    levels: ['#3c1e70', '#6e40c9', '#a371f7', '#bc8cff'],
    text: '#c9d1d9',
    background: '#0d1117',
    border: '#30363d',
  },
  'orange-dark': {
    empty: '#161b22',
    levels: ['#5a1e02', '#bd561d', '#d29922', '#e3b341'],
    text: '#c9d1d9',
    background: '#0d1117',
    border: '#30363d',
  },
};

export const OVERLAY_PALETTES: OverlayPalette[] = [
  { levels: ['#9be9a8', '#40c463', '#30a14e', '#216e39'] }, // green
  { levels: ['#c6dbef', '#6baed6', '#2171b5', '#08519c'] }, // blue
  { levels: ['#fdd0a2', '#fdae6b', '#f16913', '#d94801'] }, // orange
  { levels: ['#d4b9da', '#c994c7', '#df65b0', '#980043'] }, // purple
  { levels: ['#fbb4ae', '#fb6a4a', '#ef3b2c', '#a50f15'] }, // red
  { levels: ['#b3cde3', '#8c96c6', '#8856a7', '#810f7c'] }, // violet
  { levels: ['#ccebc5', '#7bccc4', '#43a2ca', '#0868ac'] }, // teal
  { levels: ['#fde0dd', '#fa9fb5', '#f768a1', '#c51b8a'] }, // pink
  { levels: ['#d9d9d9', '#bdbdbd', '#969696', '#636363'] }, // gray
  { levels: ['#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c'] }, // yellow-red
];

export const THEME_NAMES = Object.keys(THEMES);

export function getTheme(name: string): ThemeColors {
  return THEMES[name] ?? THEMES.github;
}

export function getContributionLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.50) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
