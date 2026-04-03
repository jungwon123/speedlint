import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const BARREL_PATTERN = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
const BARREL_NAMED_PATTERN = /export\s+\{[^}]+\}\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Detects barrel files (index.ts/js with `export * from`) that prevent tree-shaking.
 * Auto-fix: rewrites consumer imports to point directly at source files.
 */
export const barrelFileReexport = createRule({
	meta: {
		id: "bundle/barrel-file-reexport",
		category: "bundle",
		severity: "error",
		description: "Detect barrel files that prevent tree-shaking",
		docs: "https://speedlint.dev/rules/bundle/barrel-file-reexport",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const barrelFiles = new Map<string, number>();

		// Find barrel files (index.ts/js with re-exports)
		for (const [filePath, file] of context.files) {
			if (!isIndexFile(filePath)) continue;

			const reexportCount = countReexports(file.content);
			if (reexportCount >= 3) {
				barrelFiles.set(filePath, reexportCount);
			}
		}

		// Find consumers that import from barrel files
		for (const [barrelPath, reexportCount] of barrelFiles) {
			const barrelDir = barrelPath.replace(/\/index\.(ts|tsx|js|jsx|mjs)$/, "");
			let consumerCount = 0;

			for (const [filePath, file] of context.files) {
				if (filePath === barrelPath) continue;
				if (importsFromBarrel(file.content, barrelDir)) {
					consumerCount++;
				}
			}

			if (consumerCount > 0) {
				diagnostics.push({
					ruleId: "bundle/barrel-file-reexport",
					severity: "error",
					message: `${barrelPath} re-exports ${reexportCount} modules`,
					detail: `${consumerCount} consumers import from this barrel file, pulling in potentially unused code`,
					file: barrelPath,
					line: 1,
					impact: {
						metric: "bundleSize",
						estimated: `up to -${reexportCount * 5}KB`,
						confidence: "medium",
					},
				});
			}
		}

		return diagnostics;
	},
});

function isIndexFile(filePath: string): boolean {
	return /(?:^|\/)index\.(ts|tsx|js|jsx|mjs)$/.test(filePath);
}

function countReexports(content: string): number {
	const starExports = content.match(BARREL_PATTERN)?.length ?? 0;
	const namedExports = content.match(BARREL_NAMED_PATTERN)?.length ?? 0;
	return starExports + namedExports;
}

function importsFromBarrel(content: string, barrelDir: string): boolean {
	// Match imports like: import { X } from './components' or '../components'
	const dirName = barrelDir.split("/").pop();
	if (!dirName) return false;

	const patterns = [
		new RegExp(`from\\s+['"][^'"]*/${dirName}['"]`),
		new RegExp(`from\\s+['"][^'"]*/${dirName}/index['"]`),
		new RegExp(`from\\s+['"]\\./${dirName}['"]`),
	];

	return patterns.some((p) => p.test(content));
}
