import { describe, expect, it, beforeEach } from "vitest";
import {
	parseAST,
	extractImports,
	extractExports,
	extractJSXElements,
	extractEventListeners,
	clearASTCache,
} from "./ast-parser.js";

beforeEach(() => {
	clearASTCache();
});

describe("parseAST", () => {
	it("should parse TypeScript", () => {
		const module = parseAST("const x: number = 1;", { filename: "test.ts" });
		expect(module.type).toBe("Module");
		expect(module.body.length).toBeGreaterThan(0);
	});

	it("should parse TSX", () => {
		const module = parseAST("const el = <div>hello</div>;", { filename: "test.tsx" });
		expect(module.type).toBe("Module");
	});

	it("should parse JavaScript", () => {
		const module = parseAST("const x = 1;", { filename: "test.js" });
		expect(module.type).toBe("Module");
	});

	it("should cache results", () => {
		const source = "const x = 1;";
		const m1 = parseAST(source, { filename: "a.ts" });
		const m2 = parseAST(source, { filename: "a.ts" });
		expect(m1).toBe(m2);
	});
});

describe("extractImports", () => {
	it("should extract default imports", () => {
		const module = parseAST("import React from 'react';", { filename: "a.ts" });
		const imports = extractImports(module);
		expect(imports).toHaveLength(1);
		expect(imports[0]?.source).toBe("react");
		expect(imports[0]?.isDefault).toBe(true);
	});

	it("should extract named imports", () => {
		const module = parseAST("import { useState, useEffect } from 'react';", { filename: "a.ts" });
		const imports = extractImports(module);
		expect(imports).toHaveLength(1);
		expect(imports[0]?.specifiers).toEqual(["useState", "useEffect"]);
	});

	it("should extract namespace imports", () => {
		const module = parseAST("import * as React from 'react';", { filename: "a.ts" });
		const imports = extractImports(module);
		expect(imports[0]?.isNamespace).toBe(true);
	});

	it("should extract dynamic imports", () => {
		const module = parseAST("const mod = import('heavy-lib');", { filename: "a.ts" });
		const imports = extractImports(module);
		expect(imports).toHaveLength(1);
		expect(imports[0]?.source).toBe("heavy-lib");
		expect(imports[0]?.isDynamic).toBe(true);
	});

	it("should extract multiple imports", () => {
		const code = [
			"import React from 'react';",
			"import { Chart } from 'chart.js';",
			"import moment from 'moment';",
		].join("\n");
		const module = parseAST(code, { filename: "a.ts" });
		const imports = extractImports(module);
		expect(imports).toHaveLength(3);
	});
});

describe("extractExports", () => {
	it("should extract export all (barrel)", () => {
		const module = parseAST("export * from './Button';", { filename: "index.ts" });
		const exports = extractExports(module);
		expect(exports).toHaveLength(1);
		expect(exports[0]?.type).toBe("all");
		expect(exports[0]?.source).toBe("./Button");
	});

	it("should extract named re-exports", () => {
		const module = parseAST("export { foo, bar } from './utils';", { filename: "index.ts" });
		const exports = extractExports(module);
		expect(exports).toHaveLength(2);
		expect(exports[0]?.type).toBe("named");
	});

	it("should extract default export", () => {
		const module = parseAST("export default function App() {}", { filename: "a.tsx" });
		const exports = extractExports(module);
		expect(exports.some((e) => e.type === "default")).toBe(true);
	});
});

describe("extractJSXElements", () => {
	it("should extract img elements", () => {
		const module = parseAST('const el = <img src="/test.jpg" alt="test" />;', { filename: "a.tsx" });
		const elements = extractJSXElements(module, ["img"]);
		expect(elements).toHaveLength(1);
		expect(elements[0]?.tagName).toBe("img");
		expect(elements[0]?.attributes.get("src")).toBe("/test.jpg");
	});

	it("should extract boolean attributes", () => {
		const module = parseAST("const el = <Image src='/hero.jpg' priority />;", { filename: "a.tsx" });
		const elements = extractJSXElements(module, ["Image"]);
		expect(elements).toHaveLength(1);
		expect(elements[0]?.attributes.get("priority")).toBe(true);
	});

	it("should filter by tag name", () => {
		const code = 'const el = <><div>a</div><img src="/x.jpg" /><span>b</span></>;';
		const module = parseAST(code, { filename: "a.tsx" });
		const imgs = extractJSXElements(module, ["img"]);
		expect(imgs).toHaveLength(1);
	});
});

describe("extractEventListeners", () => {
	it("should extract scroll listener", () => {
		const code = "window.addEventListener('scroll', handler);";
		const module = parseAST(code, { filename: "a.ts" });
		const listeners = extractEventListeners(module);
		expect(listeners).toHaveLength(1);
		expect(listeners[0]?.eventName).toBe("scroll");
		expect(listeners[0]?.hasPassive).toBe(false);
	});

	it("should detect passive option", () => {
		const code = "window.addEventListener('scroll', handler, { passive: true });";
		const module = parseAST(code, { filename: "a.ts" });
		const listeners = extractEventListeners(module);
		expect(listeners[0]?.hasPassive).toBe(true);
	});

	it("should extract multiple listeners", () => {
		const code = [
			"el.addEventListener('touchstart', fn1);",
			"el.addEventListener('click', fn2);",
		].join("\n");
		const module = parseAST(code, { filename: "a.ts" });
		const listeners = extractEventListeners(module);
		expect(listeners).toHaveLength(2);
	});
});
