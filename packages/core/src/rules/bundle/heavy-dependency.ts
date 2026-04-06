import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

interface HeavyDep {
	name: string;
	sizeKB: number;
	alternative: string;
	alternativeSizeKB: number;
	importRewrite?: { from: RegExp; to: string };
}

const HEAVY_DEPS: HeavyDep[] = [
	{
		name: "moment",
		sizeKB: 287,
		alternative: "dayjs",
		alternativeSizeKB: 7,
		importRewrite: { from: /import\s+(\w+)\s+from\s+['"]moment['"]/, to: "import $1 from 'dayjs'" },
	},
	{
		name: "moment-timezone",
		sizeKB: 340,
		alternative: "dayjs + dayjs/plugin/timezone",
		alternativeSizeKB: 10,
	},
	{
		name: "lodash",
		sizeKB: 531,
		alternative: "lodash-es (tree-shakeable)",
		alternativeSizeKB: 10,
		importRewrite: {
			from: /import\s+(\w+)\s+from\s+['"]lodash['"]/,
			to: "import $1 from 'lodash-es'",
		},
	},
	{ name: "underscore", sizeKB: 54, alternative: "native ES methods", alternativeSizeKB: 0 },
	{ name: "jquery", sizeKB: 87, alternative: "native DOM API", alternativeSizeKB: 0 },
	{
		name: "axios",
		sizeKB: 29,
		alternative: "ky or native fetch",
		alternativeSizeKB: 3,
	},
	{ name: "request", sizeKB: 200, alternative: "node-fetch or native fetch", alternativeSizeKB: 0 },
	{ name: "bluebird", sizeKB: 80, alternative: "native Promise", alternativeSizeKB: 0 },
	{ name: "uuid", sizeKB: 12, alternative: "crypto.randomUUID()", alternativeSizeKB: 0 },
	{ name: "classnames", sizeKB: 1, alternative: "clsx", alternativeSizeKB: 0.5 },
	{ name: "chalk", sizeKB: 25, alternative: "picocolors", alternativeSizeKB: 0.5 },
	{ name: "validator", sizeKB: 52, alternative: "zod or valibot", alternativeSizeKB: 13 },
	{ name: "numeral", sizeKB: 32, alternative: "Intl.NumberFormat", alternativeSizeKB: 0 },
];

export const heavyDependency = createRule({
	meta: {
		id: "bundle/heavy-dependency",
		category: "bundle",
		severity: "warning",
		description: "Detect heavy dependencies with lighter alternatives",
		docs: "https://speedlint.dev/rules/bundle/heavy-dependency",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const deps = {
			...context.project.packageJson.dependencies,
			...context.project.packageJson.devDependencies,
		};

		for (const heavy of HEAVY_DEPS) {
			if (heavy.name in deps) {
				const saving = heavy.sizeKB - heavy.alternativeSizeKB;
				const rewrite = heavy.importRewrite;

				diagnostics.push({
					ruleId: "bundle/heavy-dependency",
					severity: "warning",
					message: `${heavy.name} (${heavy.sizeKB}KB) — use ${heavy.alternative} instead`,
					detail: `${heavy.name} is ${heavy.sizeKB}KB minified. ${heavy.alternative} provides similar functionality at ${heavy.alternativeSizeKB}KB`,
					impact: { metric: "bundleSize", estimated: `-${saving}KB`, confidence: "high" },
					fix: rewrite
						? (): Transform[] => {
								const transforms: Transform[] = [];
								for (const [filePath, file] of context.files) {
									if (!/\.(ts|tsx|js|jsx|mjs)$/.test(filePath)) continue;
									const match = file.content.match(rewrite.from);
									if (match) {
										const newImport = match[0].replace(rewrite.from, rewrite.to);
										const idx = match.index ?? 0;
										const line = file.content.substring(0, idx).split("\n").length;
										const lineStart = file.content.lastIndexOf("\n", idx) + 1;
										const col = idx - lineStart;
										transforms.push({
											type: "replaceText",
											filePath,
											range: {
												start: { line, column: col },
												end: { line, column: col + match[0].length },
											},
											newText: newImport,
										});
									}
								}
								return transforms;
							}
						: undefined,
				});
			}
		}

		return diagnostics;
	},
});
