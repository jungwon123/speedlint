import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SpeedlintScanError, scanProject } from "./project-scanner.js";

const TEST_DIR = join(import.meta.dirname, "__test-fixtures__");

function createFixture(files: Record<string, string>) {
	mkdirSync(TEST_DIR, { recursive: true });
	for (const [name, content] of Object.entries(files)) {
		const filePath = join(TEST_DIR, name);
		mkdirSync(join(filePath, ".."), { recursive: true });
		writeFileSync(filePath, content);
	}
}

describe("scanProject", () => {
	beforeEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	afterEach(() => {
		rmSync(TEST_DIR, { recursive: true, force: true });
	});

	it("should throw if package.json is missing", () => {
		mkdirSync(TEST_DIR, { recursive: true });
		expect(() => scanProject(TEST_DIR)).toThrow(SpeedlintScanError);
	});

	it("should detect a vanilla JavaScript project", () => {
		createFixture({
			"package.json": JSON.stringify({ name: "test-app", version: "1.0.0" }),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBeNull();
		expect(ctx.bundler).toBeNull();
		expect(ctx.language).toBe("javascript");
		expect(ctx.moduleSystem).toBe("cjs");
	});

	it("should detect React framework", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("react");
	});

	it("should detect Next.js framework with webpack bundler", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { next: "^15.0.0", react: "^19.0.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("nextjs");
		expect(ctx.bundler).toBe("webpack");
	});

	it("should detect Vue framework", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { vue: "^3.5.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("vue");
	});

	it("should detect Nuxt over Vue when both present", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { nuxt: "^3.0.0", vue: "^3.5.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("nuxt");
	});

	it("should detect Vite bundler from config file", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { react: "^19.0.0" },
				devDependencies: { vite: "^6.0.0" },
			}),
			"vite.config.ts": "export default {}",
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("react");
		expect(ctx.bundler).toBe("vite");
	});

	it("should detect TypeScript from tsconfig.json", () => {
		createFixture({
			"package.json": JSON.stringify({
				dependencies: { react: "^19.0.0" },
				devDependencies: { typescript: "^5.7.0" },
			}),
			"tsconfig.json": JSON.stringify({ compilerOptions: { strict: true } }),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.language).toBe("typescript");
	});

	it("should detect ESM module system", () => {
		createFixture({
			"package.json": JSON.stringify({
				type: "module",
				dependencies: { react: "^19.0.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.moduleSystem).toBe("esm");
	});

	it("should collect config files", () => {
		createFixture({
			"package.json": JSON.stringify({ dependencies: {} }),
			"tsconfig.json": "{}",
			"tailwind.config.js": "module.exports = {}",
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.configFiles.has("tsconfig.json")).toBe(true);
		expect(ctx.configFiles.has("tailwind.config.js")).toBe(true);
		expect(ctx.configFiles.has("webpack.config.js")).toBe(false);
	});

	it("should detect Svelte framework", () => {
		createFixture({
			"package.json": JSON.stringify({
				devDependencies: { svelte: "^5.0.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("svelte");
	});

	it("should detect SvelteKit over Svelte", () => {
		createFixture({
			"package.json": JSON.stringify({
				devDependencies: { "@sveltejs/kit": "^2.0.0", svelte: "^5.0.0" },
			}),
		});

		const ctx = scanProject(TEST_DIR);
		expect(ctx.framework).toBe("sveltekit");
	});
});
