#!/usr/bin/env node
'use strict';

/**
 * Windows + pnpm + Jest 30 workarounds for repo paths containing spaces (e.g. "TSC Platform").
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

function patchNodeModuleResolution() {
  if (process.platform !== 'win32') return;

  const serverRoot = fs.realpathSync(path.resolve(__dirname, '..'));
  if (!serverRoot.includes(' ')) return;

  const originalResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    try {
      const resolved = originalResolveFilename.call(this, request, parent, isMain, options);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        const indexJs = path.join(resolved, 'index.js');
        if (fs.existsSync(indexJs)) return indexJs;
      }
      return resolved;
    } catch (err) {
      if (parent?.filename && (request.startsWith('./') || request.startsWith('../'))) {
        const base = path.resolve(path.dirname(parent.filename), request);
        for (const candidate of [base, `${base}.js`, path.join(base, 'index.js')]) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        }
      }
      throw err;
    }
  };
}

function patchJestResolver() {
  const serverRoot = fs.realpathSync(path.resolve(__dirname, '..'));
  const jestResolve = require(require.resolve('jest-resolve'));
  const Resolver = jestResolve.default || jestResolve;
  const originalFind = Resolver.findNodeModule.bind(Resolver);

  const resolveConfigPath = (request, basedir) => {
    let target = request;
    if (request.startsWith('<rootDir>')) {
      target = request.slice('<rootDir>'.length).replace(/^[/\\]/, '');
    }
    if (request.startsWith('<rootDir>') || request.startsWith('./') || request.startsWith('../')) {
      const candidate = path.normalize(path.resolve(basedir, target));
      return fs.existsSync(candidate) ? candidate : null;
    }
    if (path.isAbsolute(request) && fs.existsSync(request)) {
      return path.normalize(request);
    }
    return null;
  };

  Resolver.findNodeModule = (request, options) => {
    const basedir = options?.basedir || serverRoot;
    const configHit = resolveConfigPath(request, basedir);
    if (configHit) return configHit;

    const result = originalFind(request, options);
    if (result) return result;

    if (!request.startsWith('.') && !path.isAbsolute(request)) {
      try {
        return require.resolve(request);
      } catch {
        /* fall through */
      }
    }

    if (basedir && (request.startsWith('./') || request.startsWith('../'))) {
      const normalized = request.replace(/[/\\]+$/, '');
      const base = path.resolve(basedir, normalized);
      for (const candidate of [`${base}.js`, path.join(base, 'index.js')]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    }

    return null;
  };

  if (Resolver.prototype?.resolveModule) {
    const originalResolveModule = Resolver.prototype.resolveModule;
    Resolver.prototype.resolveModule = function resolveModule(from, moduleName, options) {
      try {
        return originalResolveModule.call(this, from, moduleName, options);
      } catch (err) {
        try {
          return require.resolve(moduleName);
        } catch {
          throw err;
        }
      }
    };
  }
}

patchNodeModuleResolution();
patchJestResolver();

require(require.resolve('jest/bin/jest'));
