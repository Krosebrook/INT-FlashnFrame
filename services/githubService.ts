/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RepoFileTree, DependencyInfo } from '../types';
import { cachedFetch, createCacheKey, deduplicatedFetch } from './cache';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let userProvidedGitHubToken: string | null = null;

export function setUserGitHubToken(token: string | null) {
  userProvidedGitHubToken = token;
}

export function getUserGitHubToken(): string | null {
  return userProvidedGitHubToken;
}

export async function validateGitHubToken(token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return { valid: true };
    }
    if (res.status === 401) {
      return { valid: false, error: 'This token is invalid or expired. Please generate a new one.' };
    }
    if (res.status === 403) {
      return { valid: false, error: 'This token does not have the required permissions.' };
    }
    return { valid: false, error: `Token verification failed (status ${res.status}).` };
  } catch (error: any) {
    return { valid: false, error: `Could not verify token: ${error?.message || 'Network error'}` };
  }
}

function getGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (userProvidedGitHubToken) {
    headers['Authorization'] = `Bearer ${userProvidedGitHubToken}`;
  }
  return headers;
}

/**
 * Fetches raw file content from a GitHub repository.
 */
export async function fetchFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string | null> {
  const branches = branch ? [branch] : ['main', 'master'];
  
  for (const br of branches) {
    try {
      const response = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${br}/${path}`);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

/**
 * Parses package.json and extracts dependency information.
 */
function parsePackageJson(content: string): DependencyInfo[] {
  try {
    const pkg = JSON.parse(content);
    const deps: DependencyInfo[] = [];
    
    const addDeps = (depObj: Record<string, string> | undefined, type: DependencyInfo['type']) => {
      if (depObj) {
        Object.entries(depObj).forEach(([name, version]) => {
          deps.push({ name, version, type, ecosystem: 'npm' });
        });
      }
    };
    
    addDeps(pkg.dependencies, 'production');
    addDeps(pkg.devDependencies, 'development');
    addDeps(pkg.peerDependencies, 'peer');
    
    return deps;
  } catch (e) {
    console.error('Failed to parse package.json:', e);
    return [];
  }
}

/**
 * Parses requirements.txt and extracts dependency information.
 */
function parseRequirementsTxt(content: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;
    
    // Match patterns like: package==1.0.0, package>=1.0.0, package~=1.0.0, package
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)([<>=!~]+)?(.+)?/);
    if (match) {
      deps.push({
        name: match[1],
        version: match[3] || 'latest',
        type: 'production',
        ecosystem: 'pip'
      });
    }
  }
  
  return deps;
}

/**
 * Parses Cargo.toml and extracts Rust dependencies.
 */
function parseCargoToml(content: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  let inDependencies = false;
  let inDevDependencies = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '[dependencies]') {
      inDependencies = true;
      inDevDependencies = false;
      continue;
    }
    if (trimmed === '[dev-dependencies]') {
      inDevDependencies = true;
      inDependencies = false;
      continue;
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      inDependencies = false;
      inDevDependencies = false;
      continue;
    }
    
    if (inDependencies || inDevDependencies) {
      // Match: package = "version" or package = { version = "x.x" }
      const simpleMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
      const complexMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*"([^"]+)"/);
      
      const match = simpleMatch || complexMatch;
      if (match) {
        deps.push({
          name: match[1],
          version: match[2],
          type: inDevDependencies ? 'development' : 'production',
          ecosystem: 'cargo'
        });
      }
    }
  }
  
  return deps;
}

/**
 * Parses go.mod and extracts Go dependencies.
 */
function parseGoMod(content: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  const lines = content.split('\n');
  let inRequire = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('require (')) {
      inRequire = true;
      continue;
    }
    if (trimmed === ')') {
      inRequire = false;
      continue;
    }
    
    // Single line require: require github.com/pkg/errors v0.9.1
    const singleMatch = trimmed.match(/^require\s+(\S+)\s+(\S+)/);
    if (singleMatch) {
      deps.push({
        name: singleMatch[1],
        version: singleMatch[2],
        type: 'production',
        ecosystem: 'go'
      });
      continue;
    }
    
    // Multi-line require block
    if (inRequire) {
      const blockMatch = trimmed.match(/^(\S+)\s+(\S+)/);
      if (blockMatch && !trimmed.startsWith('//')) {
        deps.push({
          name: blockMatch[1],
          version: blockMatch[2],
          type: 'production',
          ecosystem: 'go'
        });
      }
    }
  }
  
  return deps;
}

/**
 * Fetches and parses dependency files from a repository.
 */
export async function fetchRepoDependencies(owner: string, repo: string): Promise<{
  dependencies: DependencyInfo[];
  ecosystem: string;
  manifestFile: string;
}> {
  // Try different dependency files in order of preference
  const manifestFiles = [
    { path: 'package.json', parser: parsePackageJson, ecosystem: 'npm' },
    { path: 'requirements.txt', parser: parseRequirementsTxt, ecosystem: 'pip' },
    { path: 'Cargo.toml', parser: parseCargoToml, ecosystem: 'cargo' },
    { path: 'go.mod', parser: parseGoMod, ecosystem: 'go' },
  ];
  
  for (const manifest of manifestFiles) {
    const content = await fetchFileContent(owner, repo, manifest.path);
    if (content) {
      const dependencies = manifest.parser(content);
      if (dependencies.length > 0) {
        return {
          dependencies,
          ecosystem: manifest.ecosystem,
          manifestFile: manifest.path
        };
      }
    }
  }
  
  return { dependencies: [], ecosystem: 'unknown', manifestFile: '' };
}

export async function fetchRepoFileTree(owner: string, repo: string): Promise<RepoFileTree[]> {
  const cacheKey = createCacheKey('repo-tree', owner, repo);
  
  return deduplicatedFetch(cacheKey, () => 
    cachedFetch(cacheKey, async () => {
      const headers: HeadersInit = {};
      if (userProvidedGitHubToken) {
        headers['Authorization'] = `Bearer ${userProvidedGitHubToken}`;
      }

      try {
        const response = await fetch(
          `/api/github/tree/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.truncated) {
            console.warn('Warning: Repository tree is too large and was truncated by GitHub API.');
          }

          return (data.tree || []).filter((item: any) => 
            item.type === 'blob' && 
            item.path.match(/\.(js|jsx|ts|tsx|py|go|rs|java|c|cpp|h|hpp|cs|php|rb|swift|kt|dart|json|yaml|yml|toml|xml|html|css)$/i) &&
            !item.path.includes('node_modules') &&
            !item.path.includes('dist/') &&
            !item.path.includes('build/') &&
            !item.path.startsWith('.')
          );
        }

        if (response.status === 429) {
          throw new Error('GitHub API rate limit exceeded. Please try again later (usually resets in an hour).');
        }

        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Repository not found. It might be private, non-existent, or using a non-standard default branch.');
        }

        throw new Error('Failed to fetch repository data. Please try again.');
      } catch (error: any) {
        if (error.message.includes('rate limit') || error.message.includes('not found') || error.message.includes('Repository not found')) {
          throw error;
        }
        console.error('Error fetching repo tree:', error);
        throw new Error(`Failed to fetch repository: ${error.message || 'Network error'}`);
      }
    }, CACHE_TTL)
  );
}