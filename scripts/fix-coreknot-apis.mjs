#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../apps/coreknot/client/src/lib');
const SKIP = new Set([
  'apiClient.js',
  'workspaceApi.js',
  'projectApi.js',
  'taskApi.js',
  'creativeIdentityApi.js',
  'skillsApi.js',
  'opportunityGenerationApi.js',
  'whiteLabelApi.js',
]);

function ensureApiClientImport(source) {
  if (source.includes("from './apiClient'")) return source;
  const importLine =
    "import { apiGet, apiPost, apiPatch, apiDelete, apiPut, resolveApiPath } from './apiClient';\n";
  if (source.includes("import axios from 'axios'")) {
    return source.replace(/import axios from 'axios';\n/, importLine);
  }
  return importLine + source;
}

function stripMockBlocks(source) {
  let out = source;
  out = out.replace(/\n(?:export )?function mock[A-Za-z0-9_]*\([\s\S]*?\n\}/g, '\n');
  out = out.replace(/\nconst MOCK_[A-Z0-9_]+ = [\s\S]*?\n\};\n/g, '\n');
  out = out.replace(/,?\s*_source:\s*['"]mock['"]/g, '');
  out = out.replace(/,?\s*_source:\s*['"]api['"]/g, '');
  out = out.replace(/\nexport function mock[A-Za-z0-9_]*\([\s\S]*?\n\}/g, '\n');
  return out;
}

function injectFetchWithFallback(source) {
  if (!source.includes('fetchWithFallback(')) return source;
  if (source.includes('async function fetchWithFallback')) {
    return source.replace(
      /async function fetchWithFallback\([\s\S]*?\n\}/,
      `async function fetchWithFallback(url, _fallback, method = 'get', body) {
  if (method === 'get') return apiGet(url);
  if (method === 'post') return apiPost(url, body);
  if (method === 'patch') return apiPatch(url, body);
  if (method === 'put') return apiPut(url, body);
  if (method === 'delete') return apiDelete(url);
  throw new Error(\`Unsupported method \${method}\`);
}`,
    );
  }
  return `${source}\n\nasync function fetchWithFallback(url, _fallback, method = 'get', body) {
  if (method === 'get') return apiGet(url);
  if (method === 'post') return apiPost(url, body);
  if (method === 'patch') return apiPatch(url, body);
  if (method === 'put') return apiPut(url, body);
  if (method === 'delete') return apiDelete(url);
  throw new Error(\`Unsupported method \${method}\`);
}\n`;
}

function fixBrokenTryCatch(source) {
  // Remove orphaned catch blocks returning mocks
  return source.replace(/\} catch(?: \(err\))? \{[\s\S]*?return \{[\s\S]*?mock[\s\S]*?\n\s*\}/g, '}');
}

function fixFetchIntelligence(source) {
  if (!source.includes('async function fetchIntelligence')) return source;
  return source.replace(
    /async function fetchIntelligence\(path, fallback\) \{[\s\S]*?\n\}/,
    `async function fetchIntelligence(path, config) {
  return apiGet(intelligencePath(path), config);
}`,
  );
}

function fixPostIntelligence(source) {
  if (!source.includes('async function postIntelligence')) return source;
  return source.replace(
    /async function postIntelligence\(path, body = \{\}\) \{[\s\S]*?\n\}/,
    `async function postIntelligence(path, body = {}) {
  return apiPost(intelligencePath(path), body);
}`,
  );
}

function addMissingIntelligenceFetchers(source) {
  if (!source.includes('fetchCommandCenter')) {
    source += `
export async function fetchCommandCenter(period = 'weekly') {
  return apiGet(intelligencePath('/command-center'), { params: { period } });
}

export async function fetchArtistHealth(artistId) {
  return apiGet(intelligencePath(\`/artists/\${encodeURIComponent(artistId)}/health\`));
}

export async function fetchOpportunityIntelligence() {
  return apiGet(intelligencePath('/opportunities/scores'));
}
`;
  }
  return source;
}

function fixProfileApi(source) {
  if (!source.includes('fetchEcosystemPassport')) return source;
  return `import { apiGet, apiPost, apiDelete, resolveApiPath } from './apiClient';

function profilePath(segment = '') {
  return resolveApiPath('/api/profile', segment);
}

export function getTscProfileApiBase() {
  return resolveApiPath('/api/profile', '').replace(/\\/api\\/profile$/, '') || '';
}

export async function fetchEcosystemPassport(slug) {
  return apiGet(profilePath(\`/\${slug}/ecosystem\`));
}

export async function fetchPublicProfile(slug) {
  return apiGet(profilePath(\`/\${slug}/public\`));
}

export async function fetchMyProfile() {
  return apiGet(profilePath('/me'));
}

export async function fetchVerification(personId) {
  return apiGet(profilePath(\`/\${encodeURIComponent(personId)}/verification\`));
}

export async function followPerson(personId) {
  return apiPost(profilePath(\`/follow/\${encodeURIComponent(personId)}\`));
}

export async function unfollowPerson(personId) {
  return apiDelete(profilePath(\`/unfollow/\${encodeURIComponent(personId)}\`));
}

export async function fetchFollowStatus(personId) {
  return apiGet(profilePath(\`/\${encodeURIComponent(personId)}/follow-status\`));
}

export async function fetchFollowers(personId, page = 1) {
  return apiGet(profilePath(\`/\${encodeURIComponent(personId)}/followers\`), { params: { page } });
}

export async function fetchFollowing(personId, page = 1) {
  return apiGet(profilePath(\`/\${encodeURIComponent(personId)}/following\`), { params: { page } });
}
`;
}

for (const file of fs.readdirSync(libDir)) {
  if (!file.endsWith('Api.js') || SKIP.has(file)) continue;
  const full = path.join(libDir, file);
  let source = fs.readFileSync(full, 'utf8');

  if (file === 'profileApi.js') {
    fs.writeFileSync(full, fixProfileApi(source));
    console.log('fixed', file);
    continue;
  }

  if (!/MOCK_|mock[A-Z]|fetchWithFallback|_source:\s*['"]mock['"]|fetchIntelligence\(/.test(source)) {
    continue;
  }

  source = ensureApiClientImport(source);
  source = stripMockBlocks(source);
  source = injectFetchWithFallback(source);
  source = fixBrokenTryCatch(source);
  source = fixFetchIntelligence(source);
  source = fixPostIntelligence(source);
  if (file === 'intelligenceApi.js') source = addMissingIntelligenceFetchers(source);

  // fetchIntelligence second-arg calls -> remove fallback arg usage
  source = source.replace(/fetchIntelligence\(\s*([^,]+),\s*\(\)\s*=>\s*mock[\s\S]*?\)/g, 'fetchIntelligence($1)');

  fs.writeFileSync(full, source);
  console.log('fixed', file);
}
