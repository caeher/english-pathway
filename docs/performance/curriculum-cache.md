# Curriculum cache and refresh behavior

The file-based curriculum is immutable for a running Next.js process. `loadAllModules()` builds one process-local cache containing the ordered catalog plus O(1) module and chapter indexes; all equivalent catalog, module, chapter, and navigation reads reuse that work.

Development refresh: restart the development server after changing curriculum files, or call `clearModuleCache()` from a controlled development/test path before reloading data. Publication refresh: each deployment starts a new process and therefore rebuilds the catalog from the committed `knowledge/` files. Content edits must still run `pnpm knowledge:validate` and `pnpm kb:embed` before publication.

The cache intentionally stores no learner or request-specific data. It is safe to share across concurrent server requests because the loaded module/chapter objects are treated as read-only.
