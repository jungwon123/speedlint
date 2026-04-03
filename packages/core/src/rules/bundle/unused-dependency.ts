import { createRule } from "../../engine/create-rule.js";
import type { Diagnostic, RuleContext } from "../../types/index.js";

const IMPORT_PATTERNS = [
	/from\s+['"]([^./][^'"]*)['"]/g,       // import from 'package'
	/require\s*\(\s*['"]([^./][^'"]*)['"]/g, // require('package')
];

// Dependencies that are used without explicit imports
const IMPLICIT_DEPS = new Set([
	"typescript",
	"@types/node",
	"@types/react",
	"@types/react-dom",
	"eslint",
	"prettier",
	"biome",
	"@biomejs/biome",
	"vitest",
	"jest",
	"tsup",
	"turbo",
	"autoprefixer",
	"tailwindcss",
	"postcss",
	"@swc/core",
	"esbuild",
]);

/**
 * Detects dependencies listed in package.json but never imported in source code.
 */
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

		// Collect all imported package names from source
		const importedPackages = new Set<string>();
		for (const [, file] of context.files) {
			for (const pattern of IMPORT_PATTERNS) {
				const regex = new RegExp(pattern.source, pattern.flags);
				let match: RegExpExecArray | null;
				while ((match = regex.exec(file.content)) !== null) {
					const pkg = match[1];
					if (pkg) {
						// Handle scoped packages: @scope/package -> @scope/package
						// Handle subpath imports: package/sub -> package
						const normalized = pkg.startsWith("@")
							? pkg.split("/").slice(0, 2).join("/")
							: pkg.split("/")[0];
						if (normalized) {
							importedPackages.add(normalized);
						}
					}
				}
			}
		}

		// Check each production dependency
		for (const depName of Object.keys(deps)) {
			if (IMPLICIT_DEPS.has(depName)) continue;
			if (importedPackages.has(depName)) continue;

			// Check if it's a CLI tool (has bin field) — skip those
			// We can't easily check this without reading node_modules, so skip @types
			if (depName.startsWith("@types/")) continue;

			diagnostics.push({
				ruleId: "bundle/unused-dependency",
				severity: "warning",
				message: `${depName} is listed in dependencies but never imported`,
				detail: `Remove ${depName} from package.json if it's not needed, or move to devDependencies`,
				impact: {
					metric: "bundleSize",
					estimated: "varies",
					confidence: "medium",
				},
			});
		}

		return diagnostics;
	},
});
