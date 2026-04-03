import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Bundler, Framework, PackageJson, ProjectContext } from "../types/index.js";

const FRAMEWORK_DETECTORS: Array<{ dep: string; framework: Framework }> = [
	{ dep: "next", framework: "nextjs" },
	{ dep: "nuxt", framework: "nuxt" },
	{ dep: "sveltekit", framework: "sveltekit" },
	{ dep: "@sveltejs/kit", framework: "sveltekit" },
	{ dep: "svelte", framework: "svelte" },
	{ dep: "@angular/core", framework: "angular" },
	{ dep: "vue", framework: "vue" },
	{ dep: "react", framework: "react" },
];

const BUNDLER_CONFIG_FILES: Array<{ file: string; bundler: Bundler }> = [
	{ file: "vite.config.ts", bundler: "vite" },
	{ file: "vite.config.js", bundler: "vite" },
	{ file: "vite.config.mts", bundler: "vite" },
	{ file: "webpack.config.js", bundler: "webpack" },
	{ file: "webpack.config.ts", bundler: "webpack" },
	{ file: "rollup.config.js", bundler: "rollup" },
	{ file: "rollup.config.ts", bundler: "rollup" },
	{ file: "esbuild.config.js", bundler: "esbuild" },
	{ file: "rspack.config.js", bundler: "rspack" },
	{ file: "rspack.config.ts", bundler: "rspack" },
];

const CONFIG_FILE_NAMES = [
	"tsconfig.json",
	"next.config.js",
	"next.config.mjs",
	"next.config.ts",
	"vite.config.ts",
	"vite.config.js",
	"webpack.config.js",
	"webpack.config.ts",
	"rollup.config.js",
	"rollup.config.ts",
	"nuxt.config.ts",
	"svelte.config.js",
	"angular.json",
	".babelrc",
	"babel.config.js",
	"postcss.config.js",
	"tailwind.config.js",
	"tailwind.config.ts",
];

export function scanProject(root: string): ProjectContext {
	const packageJson = readPackageJson(root);
	const allDeps = getAllDependencies(packageJson);
	const configFiles = detectConfigFiles(root);

	return {
		root,
		framework: detectFramework(allDeps),
		bundler: detectBundler(allDeps, configFiles),
		language: detectLanguage(root, configFiles),
		moduleSystem: detectModuleSystem(packageJson),
		packageJson,
		configFiles,
	};
}

function readPackageJson(root: string): PackageJson {
	const pkgPath = join(root, "package.json");
	if (!existsSync(pkgPath)) {
		throw new SpeedlintScanError(`package.json not found at ${root}`);
	}

	try {
		const content = readFileSync(pkgPath, "utf-8");
		return JSON.parse(content) as PackageJson;
	} catch {
		throw new SpeedlintScanError(`Failed to parse package.json at ${root}`);
	}
}

function getAllDependencies(pkg: PackageJson): Set<string> {
	const deps = new Set<string>();
	for (const name of Object.keys(pkg.dependencies ?? {})) {
		deps.add(name);
	}
	for (const name of Object.keys(pkg.devDependencies ?? {})) {
		deps.add(name);
	}
	for (const name of Object.keys(pkg.peerDependencies ?? {})) {
		deps.add(name);
	}
	return deps;
}

function detectFramework(deps: Set<string>): Framework | null {
	for (const { dep, framework } of FRAMEWORK_DETECTORS) {
		if (deps.has(dep)) {
			return framework;
		}
	}
	return null;
}

function detectBundler(
	deps: Set<string>,
	configFiles: Map<string, string>,
): Bundler | null {
	// Check config files first (more reliable)
	for (const { file, bundler } of BUNDLER_CONFIG_FILES) {
		if (configFiles.has(file)) {
			return bundler;
		}
	}

	// Next.js uses Webpack by default, Turbopack if configured
	if (deps.has("next")) {
		const nextConfigPath =
			configFiles.get("next.config.ts") ??
			configFiles.get("next.config.mjs") ??
			configFiles.get("next.config.js");

		if (nextConfigPath) {
			try {
				const content = readFileSync(nextConfigPath, "utf-8");
				if (content.includes("turbopack")) {
					return "turbopack";
				}
			} catch {
				// Ignore read errors
			}
		}
		return "webpack";
	}

	// Check deps as fallback
	if (deps.has("vite")) return "vite";
	if (deps.has("webpack")) return "webpack";
	if (deps.has("rollup")) return "rollup";
	if (deps.has("esbuild")) return "esbuild";
	if (deps.has("@rspack/core")) return "rspack";

	return null;
}

function detectLanguage(
	root: string,
	configFiles: Map<string, string>,
): "typescript" | "javascript" {
	if (configFiles.has("tsconfig.json")) {
		return "typescript";
	}

	if (existsSync(join(root, "jsconfig.json"))) {
		return "javascript";
	}

	return "javascript";
}

function detectModuleSystem(pkg: PackageJson): "esm" | "cjs" | "mixed" {
	if (pkg.type === "module") return "esm";
	if (pkg.type === "commonjs") return "cjs";

	// No explicit type field — check for clues
	const scripts = JSON.stringify(pkg.scripts ?? {});
	const hasESM = scripts.includes(".mjs") || scripts.includes("--experimental-modules");

	if (hasESM) return "mixed";
	return "cjs";
}

function detectConfigFiles(root: string): Map<string, string> {
	const found = new Map<string, string>();
	for (const name of CONFIG_FILE_NAMES) {
		const fullPath = join(root, name);
		if (existsSync(fullPath)) {
			found.set(name, fullPath);
		}
	}
	return found;
}

export class SpeedlintScanError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SpeedlintScanError";
	}
}
