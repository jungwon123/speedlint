import { parseSync } from "@swc/core";
import type {
	Module,
	ImportDeclaration,
	ExportAllDeclaration,
	ExportNamedDeclaration,
	JSXOpeningElement,
	JSXAttribute,
	CallExpression,
	MemberExpression,
	StringLiteral,
} from "@swc/core";

// ─── Parse ───────────────────────────────────────────────────────

export interface ParseOptions {
	filename?: string;
	syntax?: "typescript" | "ecmascript";
	jsx?: boolean;
}

const astCache = new Map<string, Module>();

/**
 * Parse a source file into an SWC AST Module.
 * Results are cached by content hash for the duration of analysis.
 */
export function parseAST(source: string, options: ParseOptions = {}): Module {
	const cacheKey = `${options.filename ?? ""}:${simpleHash(source)}`;
	const cached = astCache.get(cacheKey);
	if (cached) return cached;

	const ext = options.filename?.split(".").pop() ?? "ts";
	const isTypeScript = ["ts", "tsx"].includes(ext);
	const hasJSX = ["tsx", "jsx"].includes(ext);

	const module = parseSync(source, {
		syntax: options.syntax ?? (isTypeScript ? "typescript" : "ecmascript"),
		tsx: isTypeScript && hasJSX,
		jsx: !isTypeScript && hasJSX,
		target: "es2022",
	});

	astCache.set(cacheKey, module);
	return module;
}

/**
 * Clear the AST cache (call between analysis runs).
 */
export function clearASTCache(): void {
	astCache.clear();
}

// ─── Import extraction ───────────────────────────────────────────

export interface ImportInfo {
	source: string;
	specifiers: string[];
	isDefault: boolean;
	isNamespace: boolean;
	isDynamic: boolean;
	line: number;
}

/**
 * Extract all imports from a parsed module.
 */
export function extractImports(module: Module): ImportInfo[] {
	const imports: ImportInfo[] = [];

	for (const item of module.body) {
		if (item.type === "ImportDeclaration") {
			const decl = item as ImportDeclaration;
			const specifiers: string[] = [];
			let isDefault = false;
			let isNamespace = false;

			for (const spec of decl.specifiers) {
				if (spec.type === "ImportDefaultSpecifier") {
					isDefault = true;
					specifiers.push(spec.local.value);
				} else if (spec.type === "ImportNamespaceSpecifier") {
					isNamespace = true;
					specifiers.push(spec.local.value);
				} else if (spec.type === "ImportSpecifier") {
					specifiers.push(spec.local.value);
				}
			}

			imports.push({
				source: decl.source.value,
				specifiers,
				isDefault,
				isNamespace,
				isDynamic: false,
				line: decl.span.start,
			});
		}
	}

	// Also find dynamic imports: import('...')
	visitNode(module, (node) => {
		if (
			node.type === "CallExpression" &&
			(node as unknown as CallExpression).callee.type === "Import" &&
			(node as unknown as CallExpression).arguments.length > 0
		) {
			const callExpr = node as unknown as CallExpression;
			const firstArg = callExpr.arguments[0]?.expression;
			if (firstArg && firstArg.type === "StringLiteral") {
				imports.push({
					source: (firstArg as StringLiteral).value,
					specifiers: [],
					isDefault: false,
					isNamespace: false,
					isDynamic: true,
					line: callExpr.span.start,
				});
			}
		}
	});

	return imports;
}

// ─── Export extraction ───────────────────────────────────────────

export interface ExportInfo {
	type: "named" | "default" | "all";
	name?: string;
	source?: string;
	line: number;
}

/**
 * Extract all exports from a parsed module.
 */
export function extractExports(module: Module): ExportInfo[] {
	const exports: ExportInfo[] = [];

	for (const item of module.body) {
		if (item.type === "ExportAllDeclaration") {
			const decl = item as ExportAllDeclaration;
			exports.push({
				type: "all",
				source: decl.source.value,
				line: decl.span.start,
			});
		} else if (item.type === "ExportNamedDeclaration") {
			const decl = item as ExportNamedDeclaration;
			if (decl.source) {
				// Re-export: export { foo } from './bar'
				for (const spec of decl.specifiers) {
					if (spec.type === "ExportSpecifier") {
						exports.push({
							type: "named",
							name: spec.exported?.value ?? spec.orig.value,
							source: decl.source.value,
							line: decl.span.start,
						});
					}
				}
			} else if (decl.specifiers.length === 0) {
				// Direct export: export function foo() {}
				exports.push({
					type: "named",
					line: decl.span.start,
				});
			}
		} else if (item.type === "ExportDefaultDeclaration" || item.type === "ExportDefaultExpression") {
			exports.push({
				type: "default",
				line: item.span.start,
			});
		}
	}

	return exports;
}

// ─── JSX extraction ──────────────────────────────────────────────

export interface JSXElementInfo {
	tagName: string;
	attributes: Map<string, string | boolean>;
	line: number;
}

/**
 * Extract JSX elements from a parsed module.
 */
export function extractJSXElements(module: Module, tagFilter?: string[]): JSXElementInfo[] {
	const elements: JSXElementInfo[] = [];

	visitNode(module, (node) => {
		if (node.type === "JSXOpeningElement") {
			const jsx = node as unknown as JSXOpeningElement;
			let tagName = "";

			if (jsx.name.type === "Identifier") {
				tagName = jsx.name.value;
			} else if (jsx.name.type === "JSXMemberExpression") {
				tagName = `${(jsx.name.object as { value?: string }).value ?? ""}.${jsx.name.property.value}`;
			}

			if (tagFilter && !tagFilter.includes(tagName)) return;

			const attributes = new Map<string, string | boolean>();
			for (const attr of jsx.attributes) {
				if (attr.type === "JSXAttribute") {
					const jsxAttr = attr as JSXAttribute;
					const name = jsxAttr.name.type === "Identifier" ? jsxAttr.name.value : "";
					if (jsxAttr.value === null) {
						attributes.set(name, true); // boolean attribute like `priority`
					} else if (jsxAttr.value?.type === "StringLiteral") {
						attributes.set(name, (jsxAttr.value as StringLiteral).value);
					} else {
						attributes.set(name, true); // expression value
					}
				}
			}

			elements.push({ tagName, attributes, line: jsx.span.start });
		}
	});

	return elements;
}

// ─── addEventListener extraction ─────────────────────────────────

export interface EventListenerInfo {
	eventName: string;
	hasPassive: boolean;
	line: number;
}

/**
 * Extract addEventListener calls from a parsed module.
 */
export function extractEventListeners(module: Module): EventListenerInfo[] {
	const listeners: EventListenerInfo[] = [];

	visitNode(module, (node) => {
		if (node.type === "CallExpression") {
			const call = node as unknown as CallExpression;
			if (
				call.callee.type === "MemberExpression" &&
				(call.callee as MemberExpression).property.type === "Identifier" &&
				((call.callee as MemberExpression).property as { value: string }).value === "addEventListener" &&
				call.arguments.length >= 2
			) {
				const firstArg = call.arguments[0]?.expression;
				if (firstArg?.type === "StringLiteral") {
					const eventName = (firstArg as StringLiteral).value;
					let hasPassive = false;

					// Check third argument for { passive: true }
					if (call.arguments.length >= 3) {
						const thirdArg = call.arguments[2]?.expression;
						if (thirdArg?.type === "ObjectExpression") {
							const obj = thirdArg as { properties: Array<{ key?: { value?: string }; value?: { value?: boolean } }> };
							hasPassive = obj.properties.some(
								(p) => p.key?.value === "passive" && p.value?.value === true,
							);
						}
					}

					listeners.push({ eventName, hasPassive, line: call.span.start });
				}
			}
		}
	});

	return listeners;
}

// ─── AST visitor ─────────────────────────────────────────────────

type ASTNode = { type: string; [key: string]: unknown };

function visitNode(node: unknown, callback: (node: ASTNode) => void): void {
	if (!node || typeof node !== "object") return;

	const n = node as ASTNode;
	if (typeof n.type === "string") {
		callback(n);
	}

	for (const value of Object.values(n)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				visitNode(item, callback);
			}
		} else if (value && typeof value === "object") {
			visitNode(value, callback);
		}
	}
}

function simpleHash(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return hash;
}
