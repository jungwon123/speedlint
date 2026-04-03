import type {
	ProjectContext,
	Rule,
	RuleCategory,
	Severity,
	SpeedlintConfig,
} from "../types/index.js";

interface ResolveOptions {
	config: SpeedlintConfig;
	project: ProjectContext;
}

export interface ResolvedRule {
	rule: Rule;
	severity: Severity;
	options: Record<string, unknown>;
}

/**
 * Resolves the active rules based on config, plugins, and project context.
 * Filters by category, severity, and framework compatibility.
 */
export function resolveRules({ config, project }: ResolveOptions): ResolvedRule[] {
	const allRules = collectRules(config);
	const ruleOverrides = config.rules ?? {};

	const resolved: ResolvedRule[] = [];

	for (const rule of allRules) {
		const override = ruleOverrides[rule.meta.id];

		// Skip disabled rules
		if (override === "off") continue;

		// Skip rules not applicable to this framework
		if (rule.meta.frameworks && rule.meta.frameworks.length > 0 && project.framework) {
			if (!rule.meta.frameworks.includes(project.framework)) continue;
		}

		let severity = rule.meta.severity;
		let options: Record<string, unknown> = {};

		if (typeof override === "string") {
			severity = override as Severity;
		} else if (Array.isArray(override)) {
			severity = override[0];
			options = override[1] ?? {};
		}

		resolved.push({ rule, severity, options });
	}

	return resolved;
}

/**
 * Filter resolved rules by category.
 */
export function filterByCategory(
	rules: ResolvedRule[],
	category: RuleCategory,
): ResolvedRule[] {
	return rules.filter((r) => r.rule.meta.category === category);
}

/**
 * Filter resolved rules by minimum severity.
 */
export function filterBySeverity(
	rules: ResolvedRule[],
	minSeverity: Severity,
): ResolvedRule[] {
	const severityOrder: Record<Severity, number> = {
		error: 0,
		warning: 1,
		info: 2,
	};
	const threshold = severityOrder[minSeverity];
	return rules.filter((r) => severityOrder[r.severity] <= threshold);
}

function collectRules(config: SpeedlintConfig): Rule[] {
	const rules: Rule[] = [];

	// Collect from plugins
	for (const plugin of config.plugins ?? []) {
		rules.push(...plugin.rules);
	}

	// Collect custom rules
	for (const rule of config.customRules ?? []) {
		rules.push(rule);
	}

	return rules;
}
