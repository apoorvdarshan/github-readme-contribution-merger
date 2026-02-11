// GitHub GraphQL API response types
export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
  color: string;
}

export interface GitHubContributionWeek {
  contributionDays: GitHubContributionDay[];
}

export interface GitHubContributionCalendar {
  totalContributions: number;
  weeks: GitHubContributionWeek[];
}

export interface GitHubUserResponse {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: GitHubContributionCalendar;
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}

// Internal types
export interface ContributionDay {
  date: string;
  count: number;
}

export interface UserContributions {
  username: string;
  totalContributions: number;
  days: ContributionDay[];
}

export interface MergedDay {
  date: string;
  totalCount: number;
  perUser: Record<string, number>;
}

export type MergeMode = 'sum' | 'overlay';

// Theme types
export interface ThemeColors {
  empty: string;
  levels: [string, string, string, string];
  text: string;
  background: string;
  border: string;
}

export interface OverlayPalette {
  levels: [string, string, string, string];
}

export interface RenderOptions {
  mode: MergeMode;
  theme: string;
  usernames: string[];
}
