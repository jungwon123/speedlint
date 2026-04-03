# speedlint — Milestones & Execution Plan

---

## Milestone 0–3: Foundation ✅
- Core Engine, 12 built-in rules, FixEngine, CLI (5 commands)

## Milestone 4: Plugin System ✅
- @speedlint/plugin-react (3 rules), @speedlint/plugin-nextjs (3 rules)

## Milestone 5: Ecosystem ✅
- @speedlint/plugin-vue (2), plugin-webpack (2), plugin-vite (2)
- Watch mode, VS Code extension

## Milestone 6: Production ✅
- SWC AST parser, real auto-fix transforms (6 rules)
- GitHub Action, npm publish (7 packages), changesets pipeline
- Plugin authoring guide, sample project

---

## Current Stats

- **9 packages**: core, cli, 5 plugins, vscode-extension, github-action
- **24 rules**, **107 tests**, **15 PRs** merged, **7 npm packages**

---

## Future

- [ ] More rules (image format, font subsetting, CSS unused, prefetch)
- [ ] Incremental caching
- [ ] SARIF output (GitHub Code Scanning)
- [ ] Docs site (VitePress)
- [ ] Performance regression detection
- [ ] Lighthouse CI integration
- [ ] VS Code Marketplace publish
- [ ] Community plugin registry
