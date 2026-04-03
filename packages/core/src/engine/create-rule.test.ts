import { describe, expect, it } from "vitest";
import { createRule } from "./create-rule.js";
import type { Diagnostic, FixContext, RuleContext, Transform } from "../types/index.js";

describe("createRule", () => {
	it("should return a valid rule object", () => {
		const rule = createRule({
			meta: {
				id: "test/example-rule",
				category: "bundle",
				severity: "warning",
				description: "An example rule for testing",
				docs: "https://speedlint.dev/rules/test/example-rule",
				fixable: true,
			},
			detect(context: RuleContext): Diagnostic[] {
				return [
					{
						ruleId: "test/example-rule",
						severity: "warning",
						message: "Found an issue",
						detail: "Detailed explanation",
						impact: {
							metric: "bundleSize",
							estimated: "-10KB",
							confidence: "high",
						},
					},
				];
			},
			fix(diagnostic: Diagnostic, context: FixContext): Transform[] {
				return [
					{
						type: "replaceText",
						filePath: "test.ts",
						range: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
						newText: "fixed code",
					},
				];
			},
		});

		expect(rule.meta.id).toBe("test/example-rule");
		expect(rule.meta.category).toBe("bundle");
		expect(rule.meta.fixable).toBe(true);
		expect(typeof rule.detect).toBe("function");
		expect(typeof rule.fix).toBe("function");
	});

	it("should work without fix function", () => {
		const rule = createRule({
			meta: {
				id: "test/detect-only",
				category: "lcp",
				severity: "info",
				description: "Detection only rule",
				docs: "https://speedlint.dev/rules/test/detect-only",
				fixable: false,
			},
			detect(): Diagnostic[] {
				return [];
			},
		});

		expect(rule.meta.fixable).toBe(false);
		expect(rule.fix).toBeUndefined();
	});
});
