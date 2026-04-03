import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext, Transform } from "../../types/index.js";

const IMPORT_PATTERNS = [
	/from\s+['"]([^./][^'"]*)['"]/g,
	/require\s*\(\s*['"]([^./][^'"]*)['"]/g,
];

const IMPLICIT_DEPS = new Set([
	"typescript", "@types/node", "@types/react", "@types/react-dom",
	"eslint", "prettier", "biome", "@biomejs/biome",
	"vitest", "jest", "tsup", "turbo",
	"autoprefixer", "tailwindcss", "postcss", "@swc/core", "esbuild",
]);

export const unusedDependency = createRule({
	meta: {
		id: "bundle/unused-dependency",
		category: "bundle",
		severity: "warning",
		description: "Detect unused dependencies in package.json",
		docs: "https://speedlint.dev/rules/bundle/unused-dependency",
		fixable: true,
	},

	detect(context: RuleContext): Diagnostic[] {
		const diagnostics: Diagnostic[] = [];
		const deps = context.project.packageJson.dependencies ?? {};

		const importedPackages = new Set<string>();
		for (const [, file] of context.files) {
			for (const pattern of IMPORT_PATTERNS) {
				const regex = new RegExp(pattern.source, pattern.flags);
				let match: RegExpExecArray | null;
				while ((match = regex.exec(file.content)) !== null) {
					const pkg = match[1];
					if (pkg) {
						const normalized = pkg.startsWith("@")
							? pkg.split("/").slice(0, 2).join("/")
							: pkg.split("/")[0];
						if (normalized) importedPackages.add(normalized);
					}
				}
			}
		}

		for (const depName of Object.keys(deps)) {
			if (IMPLICIT_DEPS.has(depName)) continue;
			if (importedPackages.has(depName)) continue;
			if (depName.startsWith("@types/")) continue;

			const fixDepName = depName;

			diagnostics.push({
				ruleId: "bundle/unused-dependency",
				severity: "warning",
				message: `${depName} is listed in dependencies but never imported`,
				detail: `Remove ${depName} from package.json if it's not needed, or move to devDependencies`,
				impact: { metric: "bundleSize", estimated: "varies", confidence: "medium" },
				fix: (): Transform[] => [{
					type: "modifyJSON",
					filePath: "package.json",
					jsonPath: `dependencies.${fixDepName}`,
					jsonValue: undefined,
				}],
			});
		}

		return diagnostics;
	},
});
