import { describe, expect, it } from "vitest";
import type { ProjectContext, SpeedlintConfig } from "../types/index.js";
import { createRule } from "./create-rule.js";
import { filterByCategory, filterBySeverity, resolveRules } from "./rule-resolver.js";

const mockProject: ProjectContext = {
	root: "/test",
	framework: "react",
	bundler: "vite",
	language: "typescript",
	moduleSystem: "esm",
	packageJson: {},
	configFiles: new Map(),
};

const bundleRule = createRule({
	meta: {
		id: "bundle/test-rule",
		category: "bundle",
		severity: "error",
		description: "Test bundle rule",
		docs: "",
		fixable: false,
	},
	detect() {
		return [];
	},
});

const lcpRule = createRule({
	meta: {
		id: "lcp/test-rule",
		category: "lcp",
		severity: "warning",
		description: "Test LCP rule",
		docs: "",
		fixable: true,
	},
	detect() {
		return [];
	},
});

const vueOnlyRule = createRule({
	meta: {
		id: "vue/test-rule",
		category: "general",
		severity: "info",
		description: "Vue-only rule",
		docs: "",
		fixable: false,
		frameworks: ["vue"],
	},
	detect() {
		return [];
	},
});

const testPlugin = {
	name: "test-plugin",
	rules: [bundleRule, lcpRule, vueOnlyRule],
};

describe("resolveRules", () => {
	it("should collect rules from plugins", () => {
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const resolved = resolveRules({ config, project: mockProject });
		// vueOnlyRule should be filtered out (project is React)
		expect(resolved).toHaveLength(2);
	});

	it("should filter out rules not matching framework", () => {
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const resolved = resolveRules({ config, project: mockProject });
		expect(resolved.find((r) => r.rule.meta.id === "vue/test-rule")).toBeUndefined();
	});

	it("should include framework-specific rules when framework matches", () => {
		const vueProject = { ...mockProject, framework: "vue" as const };
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const resolved = resolveRules({ config, project: vueProject });
		expect(resolved).toHaveLength(3);
	});

	it("should disable rules set to off", () => {
		const config: SpeedlintConfig = {
			plugins: [testPlugin],
			rules: { "bundle/test-rule": "off" },
		};
		const resolved = resolveRules({ config, project: mockProject });
		expect(resolved.find((r) => r.rule.meta.id === "bundle/test-rule")).toBeUndefined();
	});

	it("should override severity from config", () => {
		const config: SpeedlintConfig = {
			plugins: [testPlugin],
			rules: { "lcp/test-rule": "error" },
		};
		const resolved = resolveRules({ config, project: mockProject });
		const lcp = resolved.find((r) => r.rule.meta.id === "lcp/test-rule");
		expect(lcp?.severity).toBe("error");
	});

	it("should parse array config with options", () => {
		const config: SpeedlintConfig = {
			plugins: [testPlugin],
			rules: { "bundle/test-rule": ["warning", { threshold: 100 }] },
		};
		const resolved = resolveRules({ config, project: mockProject });
		const bundle = resolved.find((r) => r.rule.meta.id === "bundle/test-rule");
		expect(bundle?.severity).toBe("warning");
		expect(bundle?.options).toEqual({ threshold: 100 });
	});

	it("should include custom rules", () => {
		const customRule = createRule({
			meta: {
				id: "custom/my-rule",
				category: "general",
				severity: "info",
				description: "Custom rule",
				docs: "",
				fixable: false,
			},
			detect() {
				return [];
			},
		});
		const config: SpeedlintConfig = { plugins: [], customRules: [customRule] };
		const resolved = resolveRules({ config, project: mockProject });
		expect(resolved).toHaveLength(1);
		expect(resolved[0]?.rule.meta.id).toBe("custom/my-rule");
	});
});

describe("filterByCategory", () => {
	it("should filter rules by category", () => {
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const resolved = resolveRules({ config, project: mockProject });
		const bundleRules = filterByCategory(resolved, "bundle");
		expect(bundleRules).toHaveLength(1);
		expect(bundleRules[0]?.rule.meta.category).toBe("bundle");
	});
});

describe("filterBySeverity", () => {
	it("should filter rules by minimum severity", () => {
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const vueProject = { ...mockProject, framework: "vue" as const };
		const resolved = resolveRules({ config, project: vueProject });
		const errorsOnly = filterBySeverity(resolved, "error");
		expect(errorsOnly).toHaveLength(1);
		expect(errorsOnly[0]?.severity).toBe("error");
	});

	it("should include errors and warnings when min is warning", () => {
		const config: SpeedlintConfig = { plugins: [testPlugin] };
		const vueProject = { ...mockProject, framework: "vue" as const };
		const resolved = resolveRules({ config, project: vueProject });
		const upToWarning = filterBySeverity(resolved, "warning");
		expect(upToWarning).toHaveLength(2);
	});
});
