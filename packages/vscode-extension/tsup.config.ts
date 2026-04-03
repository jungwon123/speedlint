import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/extension.ts"],
	format: ["cjs"],
	dts: false,
	splitting: false,
	sourcemap: true,
	clean: true,
	external: ["vscode"],
	minify: true,
});
