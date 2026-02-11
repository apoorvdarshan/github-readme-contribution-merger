import type { ThemeColors, OverlayPalette } from './types.js';

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
