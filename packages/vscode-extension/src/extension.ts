import { analyze } from "@speedlint/core";
import type { Diagnostic as SpeedlintDiagnostic } from "@speedlint/core";
import * as vscode from "vscode";

const DIAGNOSTIC_SOURCE = "speedlint";
let diagnosticCollection: vscode.DiagnosticCollection;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	diagnosticCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
	context.subscriptions.push(diagnosticCollection);

	// Status bar
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	statusBarItem.command = "speedlint.analyze";
	statusBarItem.text = "$(zap) speedlint";
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand("speedlint.analyze", () => {
			runAnalysis();
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("speedlint.fix", () => {
			runFix();
		}),
	);

	// Analyze on save
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(() => {
			const config = vscode.workspace.getConfiguration("speedlint");
			if (config.get<boolean>("analyzeOnSave", true)) {
				runAnalysis();
			}
		}),
	);

	// Initial analysis
	runAnalysis();
}

export function deactivate() {
	diagnosticCollection?.dispose();
	statusBarItem?.dispose();
}

function runAnalysis() {
	const config = vscode.workspace.getConfiguration("speedlint");
	if (!config.get<boolean>("enable", true)) return;

	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) return;

	const root = workspaceFolder.uri.fsPath;

	try {
		const result = analyze({ root });
		diagnosticCollection.clear();

		// Group diagnostics by file
		const byFile = new Map<string, vscode.Diagnostic[]>();

		for (const diag of result.analysis.diagnostics) {
			const filePath = diag.file;
			if (!filePath) continue;

			const fullPath = vscode.Uri.joinPath(workspaceFolder.uri, filePath).fsPath;
			const existing = byFile.get(fullPath) ?? [];
			existing.push(toVSCodeDiagnostic(diag));
			byFile.set(fullPath, existing);
		}

		for (const [filePath, diagnostics] of byFile) {
			const uri = vscode.Uri.file(filePath);
			diagnosticCollection.set(uri, diagnostics);
		}

		// Update status bar
		const errors = result.analysis.diagnostics.filter((d) => d.severity === "error").length;
		const warnings = result.analysis.diagnostics.filter((d) => d.severity === "warning").length;

		if (errors > 0) {
			statusBarItem.text = `$(zap) speedlint: ${errors} errors, ${warnings} warnings`;
			statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.errorBackground");
		} else if (warnings > 0) {
			statusBarItem.text = `$(zap) speedlint: ${warnings} warnings`;
			statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
		} else {
			statusBarItem.text = "$(zap) speedlint: all clear";
			statusBarItem.backgroundColor = undefined;
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		statusBarItem.text = "$(zap) speedlint: error";
		vscode.window.showErrorMessage(`speedlint: ${message}`);
	}
}

function runFix() {
	const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
	if (!workspaceFolder) return;

	try {
		const { fix } = require("@speedlint/core");
		const { fixResult } = fix({ root: workspaceFolder.uri.fsPath });

		if (fixResult.applied.length > 0) {
			vscode.window.showInformationMessage(`speedlint: fixed ${fixResult.applied.length} issue(s)`);
			runAnalysis(); // Re-analyze after fix
		} else {
			vscode.window.showInformationMessage("speedlint: no fixable issues found");
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		vscode.window.showErrorMessage(`speedlint fix: ${message}`);
	}
}

function toVSCodeDiagnostic(diag: SpeedlintDiagnostic): vscode.Diagnostic {
	const line = Math.max(0, (diag.line ?? 1) - 1);
	const range = new vscode.Range(line, 0, line, Number.MAX_SAFE_INTEGER);

	const severity =
		diag.severity === "error"
			? vscode.DiagnosticSeverity.Error
			: diag.severity === "warning"
				? vscode.DiagnosticSeverity.Warning
				: vscode.DiagnosticSeverity.Information;

	const vscodeDiag = new vscode.Diagnostic(range, diag.message, severity);
	vscodeDiag.source = DIAGNOSTIC_SOURCE;
	vscodeDiag.code = diag.ruleId;

	if (diag.detail) {
		vscodeDiag.message = `${diag.message}\n${diag.detail}`;
	}

	if (diag.impact) {
		vscodeDiag.message += `\nImpact: ${diag.impact.metric} ${diag.impact.estimated}`;
	}

	return vscodeDiag;
}
