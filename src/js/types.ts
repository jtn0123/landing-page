export interface Commit {
  message: string;
  date: string;
  author: string;
  avatar: string;
  repo: string;
  url: string;
  sha: string;
  additions: number | null;
  deletions: number | null;
}

export interface RepoData {
  pushed_at?: string;
  [key: string]: unknown;
}

export interface WorkflowRun {
  conclusion: string | null;
  [key: string]: unknown;
}

export interface WorkflowResponse {
  workflow_runs: WorkflowRun[];
}

export interface FetchResult<T = unknown> {
  data: T;
  response?: Response;
}

export interface CacheEntry<T = unknown> {
  ts: number;
  data: T;
}

export interface LanguageData {
  [language: string]: number;
}

export interface ContributorData {
  contributions: number;
  [key: string]: unknown;
}

export interface ParticipationData {
  owner?: number[];
  all?: number[];
}

export interface GitHubCommitResponse {
  commit: {
    message: string;
    committer: { date: string };
    author: { name: string };
  };
  author?: { avatar_url: string };
  html_url: string;
  sha: string;
}

export interface CommitDetailResponse {
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface StatsData {
  loc: number;
  commits: number;
}
