import type { MergedDay, RenderOptions } from './types';
import { getTheme, getContributionLevel, OVERLAY_PALETTES } from './themes';

const CELL_SIZE = 11;
const CELL_GAP = 2;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const CORNER_RADIUS = 2;
const DAYS_IN_WEEK = 7;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const LABEL_AREA_X = 30;
const LABEL_AREA_Y = 20;
const PADDING = 16;
const LEGEND_HEIGHT = 30;
const USERS_LABEL_HEIGHT = 20;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const month = MONTH_LABELS[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${month} ${day}`;
}

interface WeekColumn {
  weekIndex: number;
  days: MergedDay[];
}

function organizeIntoWeeks(days: MergedDay[]): WeekColumn[] {
  if (days.length === 0) return [];

  const weeks: WeekColumn[] = [];
  let currentWeek: MergedDay[] = [];
  let weekIndex = 0;

  // First day's day-of-week determines offset in first column
  const firstDate = new Date(days[0].date + 'T00:00:00Z');
  const firstDow = firstDate.getUTCDay(); // 0=Sun

  // Pad the first week if it doesn't start on Sunday
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push({ date: '', totalCount: -1, perUser: {} });
  }

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === DAYS_IN_WEEK) {
      weeks.push({ weekIndex, days: currentWeek });
      currentWeek = [];
      weekIndex++;
    }
  }

  if (currentWeek.length > 0) {
    weeks.push({ weekIndex, days: currentWeek });
  }

  return weeks;
}

function getMonthLabels(weeks: WeekColumn[]): Array<{ label: string; x: number }> {
  const labels: Array<{ label: string; x: number }> = [];
  let lastMonth = -1;

  for (const week of weeks) {
    // Find the first real day in this week
    const realDay = week.days.find((d) => d.totalCount >= 0);
    if (!realDay) continue;

    const date = new Date(realDay.date + 'T00:00:00Z');
    const month = date.getUTCMonth();

    if (month !== lastMonth) {
      labels.push({
        label: MONTH_LABELS[month],
        x: PADDING + LABEL_AREA_X + week.weekIndex * CELL_STEP,
      });
      lastMonth = month;
    }
  }

  return labels;
}

export function renderSvg(days: MergedDay[], options: RenderOptions): string {
  const theme = getTheme(options.theme);
  const weeks = organizeIntoWeeks(days);
  const monthLabels = getMonthLabels(weeks);

  const maxCount = Math.max(1, ...days.map((d) => d.totalCount));
  const maxPerUser: Record<string, number> = {};
  if (options.mode === 'overlay') {
    for (const username of options.usernames) {
      maxPerUser[username] = Math.max(
        1,
        ...days.map((d) => d.perUser[username] ?? 0)
      );
    }
  }

  const gridWidth = weeks.length * CELL_STEP;
  const gridHeight = DAYS_IN_WEEK * CELL_STEP;
  const showUsersLabel = options.mode !== 'overlay' && options.usernames.length > 1;
  const totalWidth = PADDING * 2 + LABEL_AREA_X + gridWidth;
  const totalHeight =
    PADDING * 2 +
    LABEL_AREA_Y +
    gridHeight +
    LEGEND_HEIGHT +
    (showUsersLabel ? USERS_LABEL_HEIGHT : 0);

  const cellElements: string[] = [];

  for (const week of weeks) {
    for (let dayIndex = 0; dayIndex < week.days.length; dayIndex++) {
      const day = week.days[dayIndex];
      if (day.totalCount < 0) continue; // padding cell

      const x = PADDING + LABEL_AREA_X + week.weekIndex * CELL_STEP;
      const y = PADDING + LABEL_AREA_Y + dayIndex * CELL_STEP;

      let fill: string;
      if (day.totalCount === 0) {
        fill = theme.empty;
      } else if (options.mode === 'overlay') {
        // Find dominant contributor
        let dominantUser = options.usernames[0];
        let dominantCount = 0;
        for (const username of options.usernames) {
          const count = day.perUser[username] ?? 0;
          if (count > dominantCount) {
            dominantCount = count;
            dominantUser = username;
          }
        }
        const userIndex = options.usernames.indexOf(dominantUser);
        const palette = OVERLAY_PALETTES[userIndex % OVERLAY_PALETTES.length];
        const level = getContributionLevel(dominantCount, maxPerUser[dominantUser] ?? 1);
        fill = level === 0 ? theme.empty : palette.levels[level - 1];
      } else {
        const level = getContributionLevel(day.totalCount, maxCount);
        fill = level === 0 ? theme.empty : theme.levels[level - 1];
      }

      // Build tooltip
      const tooltipParts = [`${day.totalCount} contributions on ${formatDate(day.date)}`];
      if (options.usernames.length > 1) {
        for (const username of options.usernames) {
          const count = day.perUser[username] ?? 0;
          tooltipParts.push(`${escapeXml(username)}: ${count}`);
        }
      }
      const tooltip = tooltipParts.join('\n');

      cellElements.push(
        `<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="${fill}" data-date="${escapeXml(day.date)}" data-count="${day.totalCount}">` +
          `<title>${escapeXml(tooltip)}</title>` +
          `</rect>`
      );
    }
  }

  // Day-of-week labels
  const dayLabelElements = DAY_LABELS.map((label, i) => {
    if (!label) return '';
    const y = PADDING + LABEL_AREA_Y + i * CELL_STEP + CELL_SIZE;
    return `<text x="${PADDING + LABEL_AREA_X - 6}" y="${y}" text-anchor="end" fill="${theme.text}" font-size="9" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${label}</text>`;
  }).filter(Boolean);

  // Month labels
  const monthLabelElements = monthLabels.map(
    ({ label, x }) =>
      `<text x="${x}" y="${PADDING + LABEL_AREA_Y - 6}" fill="${theme.text}" font-size="10" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${label}</text>`
  );

  // Legend
  const legendY = PADDING + LABEL_AREA_Y + gridHeight + 12;
  const legendElements: string[] = [];

  if (options.mode === 'overlay' && options.usernames.length > 1) {
    // Overlay mode: show per-user color scales
    let xOffset = PADDING + LABEL_AREA_X;
    for (let i = 0; i < options.usernames.length; i++) {
      const palette = OVERLAY_PALETTES[i % OVERLAY_PALETTES.length];
      // Username label
      legendElements.push(
        `<text x="${xOffset}" y="${legendY + CELL_SIZE}" fill="${theme.text}" font-size="9" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(options.usernames[i])}</text>`
      );
      xOffset += options.usernames[i].length * 5.5 + 6;
      // Color swatches for this user
      const userColors = [theme.empty, ...palette.levels];
      for (let j = 0; j < userColors.length; j++) {
        legendElements.push(
          `<rect x="${xOffset + j * CELL_STEP}" y="${legendY}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="${userColors[j]}"/>`
        );
      }
      xOffset += userColors.length * CELL_STEP + 12;
    }
  } else {
    // Sum mode: single "Less...More" legend with theme colors
    legendElements.push(
      `<text x="${PADDING + LABEL_AREA_X}" y="${legendY + CELL_SIZE}" fill="${theme.text}" font-size="9" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Less</text>`
    );

    const legendStartX = PADDING + LABEL_AREA_X + 30;
    const legendColors = [theme.empty, ...theme.levels];
    for (let i = 0; i < legendColors.length; i++) {
      legendElements.push(
        `<rect x="${legendStartX + i * CELL_STEP}" y="${legendY}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="${legendColors[i]}"/>`
      );
    }

    legendElements.push(
      `<text x="${legendStartX + legendColors.length * CELL_STEP + 4}" y="${legendY + CELL_SIZE}" fill="${theme.text}" font-size="9" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">More</text>`
    );
  }

  // Username labels (for sum mode with multiple users)
  const userLabelElements: string[] = [];
  if (options.mode !== 'overlay' && showUsersLabel && options.usernames.length > 1) {
    const userY = legendY + LEGEND_HEIGHT;
    let xOffset = PADDING + LABEL_AREA_X;
    for (let i = 0; i < options.usernames.length; i++) {
      userLabelElements.push(
        `<rect x="${xOffset}" y="${userY - 8}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="${theme.levels[2]}"/>` +
          `<text x="${xOffset + CELL_SIZE + 4}" y="${userY + 2}" fill="${theme.text}" font-size="10" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(options.usernames[i])}</text>`
      );
      xOffset += CELL_SIZE + 8 + options.usernames[i].length * 6.5;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
  <rect width="${totalWidth}" height="${totalHeight}" fill="${theme.background}" rx="6" ry="6"/>
  ${monthLabelElements.join('\n  ')}
  ${dayLabelElements.join('\n  ')}
  ${cellElements.join('\n  ')}
  ${legendElements.join('\n  ')}
  ${userLabelElements.join('\n  ')}
</svg>`;
}

export function renderErrorSvg(message: string): string {
  const escaped = escapeXml(message);
  const width = Math.max(400, escaped.length * 7 + 40);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60" viewBox="0 0 ${width} 60">
  <rect width="${width}" height="60" fill="#fef2f2" rx="6" ry="6" stroke="#fca5a5" stroke-width="1"/>
  <text x="20" y="35" fill="#dc2626" font-size="14" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escaped}</text>
</svg>`;
}
