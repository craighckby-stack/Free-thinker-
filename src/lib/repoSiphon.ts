/**
 * FREE THINKER - AUTONOMOUS REPOSITORY SIPHON & CODE TRANSFUSION ENGINE
 * Siphons external and user repositories on demand or automatically during code mutations
 * to infuse high-leverage algorithms, architectures, and patterns.
 */

export interface SiphonedRepo {
  id: string;
  fullName: string;
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string;
  siphonedFiles: {
    path: string;
    description: string;
    codeSnippet: string;
    extractedAt: string;
  }[];
  category: 'algorithm' | 'neural' | 'architecture' | 'ui' | 'system' | 'custom';
  timestamp: string;
}

// Curated Bank of High-Leverage Repositories for Autonomous Siphoning
export const CURATED_SIPHON_REPOSITORIES: Array<{
  fullName: string;
  category: SiphonedRepo['category'];
  description: string;
  suggestedFiles: string[];
}> = [
  {
    fullName: 'craighckby-stack/Free-Thinker',
    category: 'neural',
    description: 'Free Thinker unconstrained cognitive evolutionary engine',
    suggestedFiles: ['src/lib/ragBrain.ts', 'src/lib/evolutionLock.ts', 'src/lib/validator.ts']
  },
  {
    fullName: 'trekhleb/javascript-algorithms',
    category: 'algorithm',
    description: 'Algorithms and data structures implemented in TypeScript/JavaScript',
    suggestedFiles: ['src/algorithms/graph/dijkstra/dijkstra.js', 'src/algorithms/math/matrix/Matrix.js']
  },
  {
    fullName: 'pmndrs/zustand',
    category: 'architecture',
    description: 'Bear necessities for state management in React',
    suggestedFiles: ['src/vanilla.ts', 'src/react.ts']
  },
  {
    fullName: 'tailwindlabs/tailwindcss',
    category: 'ui',
    description: 'Next-generation utility-first CSS engine architecture',
    suggestedFiles: ['packages/tailwindcss/src/index.ts', 'packages/@tailwindcss-postcss/src/index.ts']
  },
  {
    fullName: 'expressjs/express',
    category: 'system',
    description: 'Fast, unopinionated, minimalist web framework for Node.js',
    suggestedFiles: ['lib/router/index.js', 'lib/middleware/init.js']
  }
];

const SIPHON_STORAGE_KEY = 'free_thinker_siphoned_repos';
const AUTO_SIPHON_CONFIG_KEY = 'free_thinker_auto_siphon_active';

export function getAutoSiphonState(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(AUTO_SIPHON_CONFIG_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setAutoSiphonState(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTO_SIPHON_CONFIG_KEY, String(enabled));
  } catch {}
}

export function getStoredSiphonedRepos(): SiphonedRepo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SIPHON_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredSiphonedRepo(repo: SiphonedRepo): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredSiphonedRepos();
    const updated = [repo, ...existing.filter(r => r.fullName !== repo.fullName)].slice(0, 50);
    localStorage.setItem(SIPHON_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function removeStoredSiphonedRepo(fullName: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredSiphonedRepos();
    const filtered = existing.filter(r => r.fullName !== fullName);
    localStorage.setItem(SIPHON_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Autonomously detects relevant search keywords for a file mutation
 */
export function extractSiphonKeywords(filePath: string, fileContent: string): string[] {
  const keywords = new Set<string>();
  const pathLower = filePath.toLowerCase();

  if (pathLower.includes('route') || pathLower.includes('api') || pathLower.includes('server')) {
    keywords.add('express');
    keywords.add('middleware');
    keywords.add('router');
  }
  if (pathLower.includes('rag') || pathLower.includes('vector') || pathLower.includes('brain')) {
    keywords.add('vector search');
    keywords.add('embeddings');
    keywords.add('cosine similarity');
  }
  if (pathLower.includes('debate') || pathLower.includes('orchestra') || pathLower.includes('agent')) {
    keywords.add('multi agent');
    keywords.add('game theory');
    keywords.add('consensus');
  }
  if (pathLower.includes('component') || pathLower.includes('ui') || pathLower.includes('modal') || pathLower.includes('.tsx')) {
    keywords.add('react component');
    keywords.add('tailwind');
    keywords.add('framer motion');
  }
  if (pathLower.includes('diff') || pathLower.includes('patch') || pathLower.includes('git')) {
    keywords.add('diff patch');
    keywords.add('git trees');
  }

  // Content-based keyword extraction
  if (fileContent.includes('useState') || fileContent.includes('useCallback')) {
    keywords.add('react hooks');
  }
  if (fileContent.includes('matrix') || fileContent.includes('canvas') || fileContent.includes('webgl')) {
    keywords.add('matrix transformation');
  }
  if (fileContent.includes('hash') || fileContent.includes('sha256') || fileContent.includes('crypto')) {
    keywords.add('cryptography');
  }

  return Array.from(keywords);
}
