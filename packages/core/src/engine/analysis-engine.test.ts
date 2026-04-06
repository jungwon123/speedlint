import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ProjectContext, ReportSummary } from "../types/index.js";
import { runAnalysis } from "./analysis-engine.js";
import { createRule } from "./create-rule.js";

const TEST_DIR = join(import.meta.dirname, "__test-fixtures-engine__");

const mockProject: ProjectContext = {
	root: TEST_DIR,
	framework: "react",
	bundler: "vite",
	language: "typescript",
	moduleSystem: "esm",
	packageJson: {},
	configFiles: new Map(),
};

function createTestProject() {
	mkdirSync(TEST_DIR, { recursive: true });
	writeFileSync(join(TEST_DIR, "index.ts"), "export const hello = 'world';");
}

describe("runAnalysis", () => {
	beforeEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
		createTestProject();
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("should return empty diagnostics when no rules match", () => {
		const rule = createRule({
			meta: {
				id: "test/no-match",
				category: "bundle",
				severity: "warning",
				description: "Returns no diagnostics",
				docs: "",
				fixable: false,
			},
			detect() {
				return [];
			},
		});

		const result = runAnalysis(mockProject, [{ rule, severity: "warning", options: {} }]);
		expect(result.diagnostics).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	it("should collect diagnostics from rules", () => {
		const rule = createRule({
			meta: {
				id: "test/always-warn",
				category: "bundle",
				severity: "warning",
				description: "Always warns",
				docs: "",
				fixable: false,
			},
			detect() {
				return [
					{
						ruleId: "test/always-warn",
						severity: "warning",
						message: "Something is wrong",
						detail: "Details here",
						impact: { metric: "bundleSize", estimated: "-10KB", confidence: "high" },
					},
				];
			},
		});

		const result = runAnalysis(mockProject, [{ rule, severity: "warning", options: {} }]);
		expect(result.diagnostics).toHaveLength(1);
		expect(result.diagnostics[0]?.ruleId).toBe("test/always-warn");
	});

	it("should catch rule errors gracefully", () => {
		const rule = createRule({
			meta: {
				id: "test/throws",
				category: "bundle",
				severity: "error",
				description: "Always throws",
				docs: "",
				fixable: false,
			},
			detect() {
				throw new Error("Rule broke");
			},
		});

		const result = runAnalysis(mockProject, [{ rule, severity: "error", options: {} }]);
		expect(result.diagnostics).toHaveLength(0);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]?.ruleId).toBe("test/throws");
		expect(result.errors[0]?.error).toBe("Rule broke");
	});

	it("should sort diagnostics by severity (errors first)", () => {
		const errorRule = createRule({
			meta: {
				id: "test/error",
				category: "bundle",
				severity: "error",
				description: "Error",
				docs: "",
				fixable: false,
			},
			detect() {
				return [
					{
						ruleId: "test/error",
						severity: "error",
						message: "Error",
						detail: "",
						impact: { metric: "bundleSize", estimated: "-50KB", confidence: "high" },
					},
				];
			},
		});

		const infoRule = createRule({
			meta: {
				id: "test/info",
				category: "general",
				severity: "info",
				description: "Info",
				docs: "",
				fixable: false,
			},
			detect() {
				return [
					{
						ruleId: "test/info",
						severity: "info",
						message: "Info",
						detail: "",
						impact: { metric: "bundleSize", estimated: "-1KB", confidence: "low" },
					},
				];
			},
		});

		const result = runAnalysis(mockProject, [
			{ rule: infoRule, severity: "info", options: {} },
			{ rule: errorRule, severity: "error", options: {} },
		]);

		expect(result.diagnostics).toHaveLength(2);
		expect(result.diagnostics[0]?.severity).toBe("error");
		expect(result.diagnostics[1]?.severity).toBe("info");
	});
});
