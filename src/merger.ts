import type { UserContributions, MergedDay } from './types';

export function mergeContributions(users: UserContributions[]): MergedDay[] {
  const dayMap = new Map<string, MergedDay>();

  for (const user of users) {
    for (const day of user.days) {
      let merged = dayMap.get(day.date);
      if (!merged) {
        merged = { date: day.date, totalCount: 0, perUser: {} };
        dayMap.set(day.date, merged);
      }
      merged.totalCount += day.count;
      merged.perUser[user.username] = day.count;
    }
  }

  return Array.from(dayMap.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}
