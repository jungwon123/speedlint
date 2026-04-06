import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

// Packages known to be large and good candidates for dynamic import
const LARGE_PACKAGES = new Map<string, number>([
	["chart.js", 200],
	["recharts", 400],
	["d3", 250],
	["three", 600],
	["monaco-editor", 4000],
	["@monaco-editor/react", 4000],
	["pdf-lib", 300],
	["pdfjs-dist", 800],
	["xlsx", 500],
	["exceljs", 300],
	["highlight.js", 170],
	["prismjs", 50],
	["mapbox-gl", 800],
	["leaflet", 140],
	["codemirror", 300],
	["@codemirror/view", 300],
	["marked", 30],
	["markdown-it", 35],
	["katex", 280],
	["mathjax", 500],
	["cropperjs", 40],
	["fabric", 300],
]);

/**
 * Detects large modules imported statically that could benefit from dynamic import (code-splitting).
 */
export const dynamicImportCandidate = createRule({
	meta: {
		id: "bundle/dynamic-import-candidate",
		category: "bundle",
		severity: "warning",
		description: "Detect modules that should use dynamic import for code-splitting",
		docs: "https://speedlint.dev/rules/bundle/dynamic-import-candidate",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const staticImportPattern =
			/^import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/gm;

		for (const [filePath, file] of context.files) {
			const regex = new RegExp(staticImportPattern.source, staticImportPattern.flags);

			for (const match of file.content.matchAll(regex)) {
				const pkg = match[1];
				if (!pkg || pkg.startsWith(".") || pkg.startsWith("node:")) continue;

				const basePkg = pkg.startsWith("@")
					? pkg.split("/").slice(0, 2).join("/")
					: pkg.split("/")[0];

				if (!basePkg) continue;

				const sizeKB = LARGE_PACKAGES.get(basePkg) ?? LARGE_PACKAGES.get(pkg);
				if (sizeKB === undefined) continue;

				// Check if already dynamically imported elsewhere
				if (file.content.includes(`import('${pkg}')`)) continue;
				if (file.content.includes(`import("${pkg}")`)) continue;

				const lineNumber = file.content.substring(0, match.index).split("\n").length;

				diagnostics.push({
					ruleId: "bundle/dynamic-import-candidate",
					severity: "warning",
					message: `${basePkg} (~${sizeKB}KB) is statically imported — consider dynamic import`,
					detail: `Large package ${basePkg} is imported at top-level. Use dynamic import() to code-split and reduce initial bundle size`,
					file: filePath,
					line: lineNumber,
					impact: {
						metric: "bundleSize",
						estimated: `-${sizeKB}KB initial load`,
						confidence: "medium",
					},
				});
			}
		}

		return diagnostics;
	},
});
