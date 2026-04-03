// ─── Project Context ─────────────────────────────────────────────

export type Framework =
	| "react"
	| "nextjs"
	| "vue"
	| "nuxt"
	| "svelte"
	| "sveltekit"
	| "angular"
	| "vanilla";

export type Bundler = "webpack" | "vite" | "rollup" | "esbuild" | "turbopack" | "rspack";

export interface ProjectContext {
	root: string;
	framework: Framework | null;
	bundler: Bundler | null;
	language: "typescript" | "javascript";
	moduleSystem: "esm" | "cjs" | "mixed";
	packageJson: PackageJson;
	configFiles: Map<string, string>;
}

export interface PackageJson {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	scripts?: Record<string, string>;
	type?: "module" | "commonjs";
	sideEffects?: boolean | string[];
}

// ─── Rule System ─────────────────────────────────────────────────

export type RuleCategory = "bundle" | "lcp" | "cls" | "fcp" | "tbt" | "general";
export type Severity = "error" | "warning" | "info";

export interface RuleMeta {
	id: string;
	category: RuleCategory;
	severity: Severity;
	description: string;
	docs: string;
	fixable: boolean;
	frameworks?: Framework[];
}

export interface Rule {
	meta: RuleMeta;
	detect(context: RuleContext): Diagnostic[];
	fix?(diagnostic: Diagnostic, context: FixContext): Transform[];
}

// ─── Rule Context ────────────────────────────────────────────────

export type FileMap = Map<string, FileEntry>;

export interface FileEntry {
	content: string;
	mtime: number;
}

export interface RuleContext {
	project: ProjectContext;
	files: FileMap;
	getAST(filePath: string): unknown;
	getDependencyGraph(): DepGraph;
	getConfig(name: string): unknown;
	report(diagnostic: Diagnostic): void;
}

export interface FixContext {
	project: ProjectContext;
	files: FileMap;
	getAST(filePath: string): unknown;
}

export interface DepGraph {
	nodes: Map<string, DepNode>;
}

export interface DepNode {
	filePath: string;
	imports: DepImport[];
	exports: string[];
}

export interface DepImport {
	source: string;
	specifiers: string[];
	isDefault: boolean;
	isDynamic: boolean;
}

// ─── Diagnostic ──────────────────────────────────────────────────

export interface Diagnostic {
	ruleId: string;
	severity: Severity;
	message: string;
	detail: string;
	file?: string;
	line?: number;
	impact: Impact;
	fix?: () => Transform[];
}

export type MetricType = "LCP" | "CLS" | "FCP" | "TBT" | "INP" | "bundleSize";

export interface Impact {
	metric: MetricType;
	estimated: string;
	confidence: "high" | "medium" | "low";
}

// ─── Transform ───────────────────────────────────────────────────

export type TransformType =
	| "replaceText"
	| "insertText"
	| "deleteText"
	| "renameFile"
	| "createFile"
	| "modifyJSON";

export interface Transform {
	type: TransformType;
	filePath: string;
	range?: { start: Position; end: Position };
	newText?: string;
	jsonPath?: string;
	jsonValue?: unknown;
}

export interface Position {
	line: number;
	column: number;
}

// ─── Plugin ──────────────────────────────────────────────────────

export interface SpeedlintPlugin {
	name: string;
	rules: Rule[];
	configs?: Record<string, RuleConfig[]>;
}

export interface RuleConfig {
	rule: string;
	severity: Severity;
	options?: Record<string, unknown>;
}

// ─── Config ──────────────────────────────────────────────────────

export interface SpeedlintConfig {
	root?: string;
	plugins?: SpeedlintPlugin[];
	extends?: string[];
	rules?: Record<string, Severity | "off" | [Severity, Record<string, unknown>]>;
	ignore?: string[];
	analysis?: AnalysisConfig;
	fix?: FixConfig;
	customRules?: Rule[];
}

export interface AnalysisConfig {
	bundleSizeThreshold?: number;
	chunkSizeThreshold?: number;
	cache?: boolean;
	cacheDir?: string;
}

export interface FixConfig {
	backup?: boolean;
	useGitStash?: boolean;
	dryRunByDefault?: boolean;
}

// ─── Report ──────────────────────────────────────────────────────

export interface AnalysisReport {
	project: {
		root: string;
		framework: Framework | null;
		bundler: Bundler | null;
	};
	diagnostics: Diagnostic[];
	summary: ReportSummary;
	timestamp: string;
}

export interface ReportSummary {
	errors: number;
	warnings: number;
	infos: number;
	fixable: number;
	estimatedSavings: {
		bundleSize?: string;
		lcp?: string;
		cls?: string;
	};
}
