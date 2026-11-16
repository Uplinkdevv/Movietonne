const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function loadTsModule(filePath) {
  const tsCode = fs.readFileSync(filePath, 'utf8');
  // Transpile TypeScript code to CommonJS
  const result = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  const moduleObj = { exports: {} };
  const wrapper = new Function('exports', 'require', 'module', '__filename', '__dirname', result.outputText);

  const customRequire = (modulePath) => {
    if (modulePath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), modulePath);
      if (fs.existsSync(resolved + '.ts')) {
        return loadTsModule(resolved + '.ts');
      }
      if (fs.existsSync(resolved + '.js')) {
        return require(resolved + '.js');
      }
      if (fs.existsSync(resolved)) {
        return require(resolved);
      }
    }
    return require(modulePath);
  };

  wrapper(moduleObj.exports, customRequire, moduleObj, filePath, path.dirname(filePath));
  return moduleObj.exports;
}

const fallbackPath = path.resolve(__dirname, '../src/services/fallbackData.ts');
const tmdbPath = path.resolve(__dirname, '../src/services/tmdb.ts');

const fallbackExports = loadTsModule(fallbackPath);
const tmdbExports = loadTsModule(tmdbPath);

module.exports = {
  ...fallbackExports,
  TmdbService: tmdbExports.TmdbService,
  searchOfflineCatalog: tmdbExports.TmdbService
    ? tmdbExports.TmdbService.searchOfflineCatalog.bind(tmdbExports.TmdbService)
    : null,
};
