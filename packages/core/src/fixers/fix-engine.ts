import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Diagnostic, Transform } from "../types/index.js";

export interface FixResult {
	applied: AppliedFix[];
	skipped: SkippedFix[];
}

export interface AppliedFix {
	ruleId: string;
	filePath: string;
	diff: string;
}

export interface SkippedFix {
	ruleId: string;
	reason: string;
}

export interface FixOptions {
	dryRun?: boolean;
	backupDir?: string;
}

/**
 * Applies auto-fix transforms from diagnostics.
 * Groups transforms by file, generates diffs, and applies atomically.
 */
export function applyFixes(
	root: string,
	diagnostics: Diagnostic[],
	options: FixOptions = {},
): FixResult {
	const fixableDiags = diagnostics.filter((d) => d.fix);
	const applied: AppliedFix[] = [];
	const skipped: SkippedFix[] = [];

	// Group transforms by file
	const transformsByFile = new Map<string, { ruleId: string; transforms: Transform[] }[]>();

	for (const diag of fixableDiags) {
		if (!diag.fix) continue;

		try {
			const transforms = diag.fix();
			for (const t of transforms) {
				const existing = transformsByFile.get(t.filePath) ?? [];
				existing.push({ ruleId: diag.ruleId, transforms: [t] });
				transformsByFile.set(t.filePath, existing);
			}
		} catch (err) {
			skipped.push({
				ruleId: diag.ruleId,
				reason: err instanceof Error ? err.message : String(err),
			});
		}
	}

	// Apply transforms per file
	for (const [relPath, entries] of transformsByFile) {
		const absPath = join(root, relPath);

		try {
			const original = readFileSync(absPath, "utf-8");

			// Backup before modifying
			if (!options.dryRun && options.backupDir) {
				const backupPath = join(options.backupDir, relPath);
				mkdirSync(dirname(backupPath), { recursive: true });
				copyFileSync(absPath, backupPath);
			}

			let modified = original;

			// Apply text transforms in reverse order (bottom-up) to preserve positions
			const textTransforms = entries
				.flatMap((e) => e.transforms)
				.filter((t) => t.range)
				.sort((a, b) => {
					const aStart = a.range?.start.line ?? 0;
					const bStart = b.range?.start.line ?? 0;
					return bStart - aStart; // reverse order
				});

			for (const transform of textTransforms) {
				modified = applyTextTransform(modified, transform);
			}

			// Apply JSON transforms
			const jsonTransforms = entries
				.flatMap((e) => e.transforms)
				.filter((t) => t.type === "modifyJSON");

			if (jsonTransforms.length > 0) {
				modified = applyJsonTransforms(modified, jsonTransforms);
			}

			if (modified !== original) {
				const diff = generateDiff(relPath, original, modified);

				if (!options.dryRun) {
					writeFileSync(absPath, modified, "utf-8");
				}

				for (const entry of entries) {
					applied.push({
						ruleId: entry.ruleId,
						filePath: relPath,
						diff,
					});
				}
			}
		} catch (err) {
			for (const entry of entries) {
				skipped.push({
					ruleId: entry.ruleId,
					reason: `Failed to fix ${relPath}: ${err instanceof Error ? err.message : String(err)}`,
				});
			}
		}
	}

	return { applied, skipped };
}

function applyTextTransform(content: string, transform: Transform): string {
	if (!transform.range || transform.newText === undefined) return content;

	const lines = content.split("\n");
	const { start, end } = transform.range;

	// Convert to string offsets
	let startOffset = 0;
	for (let i = 0; i < start.line - 1 && i < lines.length; i++) {
		startOffset += (lines[i]?.length ?? 0) + 1; // +1 for newline
	}
	startOffset += start.column;

	let endOffset = 0;
	for (let i = 0; i < end.line - 1 && i < lines.length; i++) {
		endOffset += (lines[i]?.length ?? 0) + 1;
	}
	endOffset += end.column;

	switch (transform.type) {
		case "replaceText":
			return content.substring(0, startOffset) + transform.newText + content.substring(endOffset);
		case "insertText":
			return content.substring(0, startOffset) + transform.newText + content.substring(startOffset);
		case "deleteText":
			return content.substring(0, startOffset) + content.substring(endOffset);
		default:
			return content;
	}
}

function applyJsonTransforms(content: string, transforms: Transform[]): string {
	try {
		const obj = JSON.parse(content);

		for (const t of transforms) {
			if (!t.jsonPath) continue;
			setNestedValue(obj, t.jsonPath, t.jsonValue);
		}

		return `${JSON.stringify(obj, null, 2)}\n`;
	} catch {
		return content;
	}
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
	const parts = path.split(".");
	let current: Record<string, unknown> = obj;

	for (let i = 0; i < parts.length - 1; i++) {
		const key = parts[i];
		if (!key) continue;
		if (!(key in current) || typeof current[key] !== "object") {
			current[key] = {};
		}
		current = current[key] as Record<string, unknown>;
	}

	const lastKey = parts[parts.length - 1];
	if (lastKey) {
		current[lastKey] = value;
	}
}

function generateDiff(filePath: string, original: string, modified: string): string {
	const origLines = original.split("\n");
	const modLines = modified.split("\n");
	const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];

	let i = 0;
	let j = 0;
	while (i < origLines.length || j < modLines.length) {
		if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
			i++;
			j++;
			continue;
		}

		// Found a difference — show context
		const contextStart = Math.max(0, i - 1);
		if (contextStart < i) {
			diffLines.push(` ${origLines[contextStart]}`);
		}

		// Show removed and added lines
		while (i < origLines.length && (j >= modLines.length || origLines[i] !== modLines[j])) {
			diffLines.push(`-${origLines[i]}`);
			i++;
		}
		while (j < modLines.length && (i >= origLines.length || origLines[i] !== modLines[j])) {
			diffLines.push(`+${modLines[j]}`);
			j++;
		}

		if (i < origLines.length) {
			diffLines.push(` ${origLines[i]}`);
			i++;
			j++;
		}
	}

	return diffLines.join("\n");
}
