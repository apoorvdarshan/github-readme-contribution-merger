import type { GitHubUserResponse, UserContributions } from './types.js';
import { cacheGet, cacheSet } from './cache.js';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const CONTRIBUTIONS_QUERY = `
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

export async function fetchContributions(
  username: string,
  token: string
): Promise<UserContributions> {
  const cacheKey = `user:${username}`;
  const cached = cacheGet<UserContributions>(cacheKey);
  if (cached) return cached;

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'github-contribution-merger',
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as GitHubUserResponse;

  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data.user) {
    throw new Error(`User "${username}" not found`);
  }

  const calendar = json.data.user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
    }))
  );

  const result: UserContributions = {
    username,
    totalContributions: calendar.totalContributions,
    days,
  };

  cacheSet(cacheKey, result);
  return result;
}

export interface FetchResult {
  fulfilled: UserContributions[];
  errors: Array<{ username: string; error: string }>;
}

export async function fetchMultipleUsers(
  usernames: string[],
  token: string
): Promise<FetchResult> {
  const results = await Promise.allSettled(
    usernames.map((u) => fetchContributions(u, token))
  );

  const fulfilled: UserContributions[] = [];
  const errors: Array<{ username: string; error: string }> = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      fulfilled.push(result.value);
    } else {
      errors.push({
        username: usernames[i],
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  return { fulfilled, errors };
}
