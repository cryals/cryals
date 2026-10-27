const API_ROOT = 'https://api.github.com';
const CACHE_KEY = 'als-github-summary-v2';
const CACHE_TTL = 15 * 60 * 1000;

type GithubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
};

type GithubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  language: string | null;
  languages_url: string;
  stargazers_count: number;
  size: number;
  pushed_at: string;
};

export type GithubSummary = {
  user: GithubUser;
  languages: { name: string; bytes: number; percent: number }[];
  updatedAt: string;
  stale?: boolean;
};

async function githubFetch<T>(path: string): Promise<T> {
  const response = await fetch(path.startsWith('http') ? path : `${API_ROOT}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    const rateLimited = response.status === 403 || response.status === 429;
    throw new Error(rateLimited ? 'GITHUB RATE LIMITED' : 'GITHUB OFFLINE');
  }

  return response.json() as Promise<T>;
}

function loadCache(allowStale = false): GithubSummary | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { savedAt: number; data: GithubSummary };
    const expired = Date.now() - cached.savedAt >= CACHE_TTL;
    return !expired || allowStale ? { ...cached.data, stale: expired } : null;
  } catch {
    return null;
  }
}

function saveCache(data: GithubSummary) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage can be unavailable in privacy mode; live data still works.
  }
}

function normalizeLanguages(languageBytes: Map<string, number>) {
  const total = [...languageBytes.values()].reduce((sum, value) => sum + value, 0);
  if (total === 0) return [];
  return [...languageBytes.entries()]
    .map(([name, bytes]) => ({ name, bytes, percent: (bytes / total) * 100 }))
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 6);
}

export async function getGithubSummary(username: string): Promise<GithubSummary> {
  const cached = loadCache();
  if (cached) return cached;

  try {
  const [user, allRepos] = await Promise.all([
    githubFetch<GithubUser>(`/users/${username}`),
    githubFetch<GithubRepo[]>(`/users/${username}/repos?type=owner&sort=updated&per_page=100`),
  ]);

  const ownedRepos = allRepos.filter((repo) => !repo.fork && !repo.archived);
  const languageRepos = [...ownedRepos].sort((left, right) => right.size - left.size).slice(0, 12);
  const languageMaps = await Promise.all(
    languageRepos.map((repo) => githubFetch<Record<string, number>>(repo.languages_url)),
  );
  const languageBytes = new Map<string, number>();
  for (const languageMap of languageMaps) {
    for (const [language, bytes] of Object.entries(languageMap)) {
      languageBytes.set(language, (languageBytes.get(language) ?? 0) + bytes);
    }
  }

  const summary: GithubSummary = {
    user,
    languages: normalizeLanguages(languageBytes),
    updatedAt: new Date().toISOString(),
  };
  saveCache(summary);
  return summary;
  } catch (error) {
    const previous = loadCache(true);
    if (previous) return { ...previous, stale: true };
    throw error;
  }
}
