#!/usr/bin/env node
/**
 * Strips mock fallbacks from CoreKnot *Api.js modules — API-only, throws on failure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(__dirname, '../apps/coreknot/client/src/lib');

const SKIP = new Set(['apiClient.js']);

function stripMocks(source) {
  let out = source;

  // Remove mock helper blocks
  out = out.replace(/\n(?:export )?function mock[A-Za-z0-9_]*\([\s\S]*?\n\}/g, '\n');
  out = out.replace(/\nasync function fetchWithFallback\([\s\S]*?\n\}/g, '\n');

  // Remove MOCK_* const declarations (single-line and simple multi-line)
  out = out.replace(/\nconst MOCK_[A-Z0-9_]+ = [\s\S]*?\n\};\n/g, '\n');

  // try/catch mock fallbacks -> direct axios/API body
  out = out.replace(
    /try \{\s*\n\s*const \{ data \} = await axios\.(get|post|patch|delete|put)\(([\s\S]*?)\);\s*\n\s*return data\?\.[\s\S]*?\n\s*\} catch(?: \(err\))? \{[\s\S]*?\n\s*\}/g,
    (match, method, args) => {
      const apiFn = `api${method.charAt(0).toUpperCase()}${method.slice(1)}`;
      return `return ${apiFn}(${args.trim()});`;
    },
  );

  // catch blocks returning mock data
  out = out.replace(/\} catch(?: \(err\))? \{[\s\S]*?return mock[\s\S]*?\n\s*\}/g, '}');

  // _source mock markers
  out = out.replace(/,?\s*_source:\s*['"]mock['"]/g, '');
  out = out.replace(/,?\s*_source:\s*['"]api['"]/g, '');

  // Ensure apiClient import if axios used
  if (/axios\./.test(out) && !out.includes("from './apiClient'")) {
    out = out.replace(
      /import axios from 'axios';\n/,
      "import { apiGet, apiPost, apiPatch, apiDelete, apiPut, resolveApiPath } from './apiClient';\n",
    );
    out = out.replace(/await axios\.get\(/g, 'await apiGet(');
    out = out.replace(/await axios\.post\(/g, 'await apiPost(');
    out = out.replace(/await axios\.patch\(/g, 'await apiPatch(');
    out = out.replace(/await axios\.delete\(/g, 'await apiDelete(');
    out = out.replace(/await axios\.put\(/g, 'await apiPut(');
    out = out.replace(/const \{ data \} = await apiGet\(/g, 'return await apiGet(');
  }

  return out;
}

for (const file of fs.readdirSync(libDir)) {
  if (!file.endsWith('Api.js') || SKIP.has(file)) continue;
  const full = path.join(libDir, file);
  const original = fs.readFileSync(full, 'utf8');
  if (!/MOCK_|mock[A-Z]|fetchWithFallback|_source:\s*['"]mock['"]/.test(original)) continue;
  const next = stripMocks(original);
  fs.writeFileSync(full, next);
  console.log('stripped', file);
}
