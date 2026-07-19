# Curriculum authoring and validation

The files under `knowledge/` are the canonical curriculum. Before opening a pull request or regenerating RAG embeddings, run:

```bash
pnpm knowledge:validate
pnpm knowledge:language:validate
pnpm activities:validate
```

`pnpm knowledge:validate` reports every failure as `file [field]: expected correction`. It checks the catalog, module metadata, chapter front matter, required files, orphaned directories, duplicate identifiers, module/chapter references, and activity schemas.

To resolve a failure, edit the named file and field rather than changing a loader. `knowledge/catalog.yaml` must list every module directory; each `module.yaml` ID must match its directory; each chapter front matter `id` and `moduleId` must match its directory and module. Every listed chapter requires both `chapter.md` and `activities.json`.

When content changes, run `pnpm kb:embed` after validation. The embed command validates the knowledge base first, so invalid curriculum data cannot be embedded.
