/**
 * @fileoverview GitHub Configuration and Credential Manager
 * Provides type-safe access and retrieval of GitHub integration settings.
 */

export interface GitHubConfig {
  readonly username: string;
  readonly repoName: string;
  readonly token: string;
  readonly hasValidToken: boolean;
  readonly isDemoMode: boolean;
}

const DEFAULT_USERNAME = "craighckby-stack";
const DEFAULT_REPO = "Free-thinker-";
const TOKEN_MIN_VALID_LENGTH = 15;

const STORAGE_KEYS = {
  USERNAME: "af_github_username",
  REPO: "af_github_repo",
  TOKEN: "af_github_token",
} as const;

const LEGACY_STORAGE_KEYS = {
  TOKEN: "[REDACTED_SECRET]",
  SYSTEM_STATE: "darlek_cann_system_state",
} as const;

const EMPTY_TOKEN = "";

const DEFAULT_CONFIG: GitHubConfig = Object.freeze({
  username: DEFAULT_USERNAME,
  repoName: DEFAULT_REPO,
  token: EMPTY_TOKEN,
  hasValidToken: false,
  isDemoMode: true,
});

/**
 * Checks if the window runtime environment is currently available.
 */
const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * Safely accesses persistent local storage layers with robust fallback handling.
 */
const getLocalStorageItem = (key: string): string | null => {
  try {
    return isBrowser() && localStorage.length > 0 ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/**
 * Safely accesses temporary session storage layers with robust fallback handling.
 */
const getSessionStorageItem = (key: string): string | null => {
  try {
    return isBrowser() && sessionStorage.length > 0 ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/**
 * Parses legacy system state JSON from local storage to recover stored config values.
 */
interface LegacySystemState {
  readonly apiKeys?: {
    readonly github?: string;
  };
  readonly repoConfig?: {
    readonly repo?: string;
    readonly owner?: string;
  };
}

const parseLegacySystemState = (): LegacySystemState | null => {
  const rawState = getLocalStorageItem(LEGACY_STORAGE_KEYS.SYSTEM_STATE);
  if (!rawState) {
    return null;
  }
  try {
    return JSON.parse(rawState) as LegacySystemState;
  } catch {
    return null;
  }
};

/**
 * Retrieves and validates GitHub configuration and authorization tokens from storage layers.
 * 
 * @returns {GitHubConfig} The frozen configuration object.
 */
export const getGitHubConfig = (): GitHubConfig => {
  const storedUsername = getLocalStorageItem(STORAGE_KEYS.USERNAME);
  const storedRepoName = getLocalStorageItem(STORAGE_KEYS.REPO);
  let storedToken = getSessionStorageItem(STORAGE_KEYS.TOKEN) ?? 
                    getLocalStorageItem(STORAGE_KEYS.TOKEN) ?? 
                    getLocalStorageItem(LEGACY_STORAGE_KEYS.TOKEN);

  let resolvedUsername = storedUsername;
  let resolvedRepoName = storedRepoName;

  const legacyState = parseLegacySystemState();
  if (legacyState) {
    if (!storedToken && legacyState.apiKeys?.github) {
      storedToken = legacyState.apiKeys.github;
    }
    if (!resolvedRepoName && legacyState.repoConfig?.repo) {
      resolvedRepoName = legacyState.repoConfig.repo;
    }
    if (!resolvedUsername && legacyState.repoConfig?.owner) {
      resolvedUsername = legacyState.repoConfig.owner;
    }
  }

  if (!resolvedUsername && !resolvedRepoName && !storedToken) {
    return DEFAULT_CONFIG;
  }

  const finalUsername = resolvedUsername ?? DEFAULT_USERNAME;
  const finalRepoName = resolvedRepoName ?? DEFAULT_REPO;
  const finalToken = storedToken ?? EMPTY_TOKEN;

  const hasValidToken = finalToken.length > TOKEN_MIN_VALID_LENGTH;
  const isDemoMode = finalUsername === DEFAULT_USERNAME && finalRepoName === DEFAULT_REPO;

  return Object.freeze({
    username: finalUsername,
    repoName: finalRepoName,
    token: finalToken,
    hasValidToken,
    isDemoMode,
  });
};
