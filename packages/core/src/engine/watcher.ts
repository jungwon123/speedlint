import { watch } from "node:fs";
import { join } from "node:path";
import { readdirSync, statSync } from "node:fs";

const IGNORE_DIRS = new Set([
	"node_modules",
	"dist",
	"build",
	".next",
	".nuxt",
	".svelte-kit",
	".turbo",
	".git",
	"coverage",
]);

const WATCH_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".js",
	".jsx",
	".mjs",
	".cjs",
	".html",
	".htm",
	".vue",
	".svelte",
	".css",
]);

export interface WatchOptions {
	root: string;
	onChange: (filePath: string) => void;
	debounceMs?: number;
}

/**
 * Watches a project directory for file changes and calls onChange with debouncing.
 * Returns a cleanup function to stop watching.
 */
export function watchProject(options: WatchOptions): () => void {
	const { root, onChange, debounceMs = 300 } = options;
	const abortController = new AbortController();
	const watchers: ReturnType<typeof watch>[] = [];
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let pendingFile: string | null = null;

	function setupWatch(dir: string): void {
		try {
			const watcher = watch(dir, { recursive: true, signal: abortController.signal }, (_event, filename) => {
				if (!filename) return;
				const ext = filename.substring(filename.lastIndexOf("."));
				if (!WATCH_EXTENSIONS.has(ext)) return;

				// Ignore files in excluded directories
				if (IGNORE_DIRS.has(filename.split("/")[0] ?? "")) return;

				pendingFile = filename;

				if (debounceTimer) {
					clearTimeout(debounceTimer);
				}

				debounceTimer = setTimeout(() => {
					if (pendingFile) {
						onChange(pendingFile);
						pendingFile = null;
					}
				}, debounceMs);
			});

			watchers.push(watcher);
		} catch {
			// Fallback: watch individual directories if recursive not supported
			watchDirRecursive(dir, watchers, abortController.signal, (filename) => {
				pendingFile = filename;
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					if (pendingFile) {
						onChange(pendingFile);
						pendingFile = null;
					}
				}, debounceMs);
			});
		}
	}

	setupWatch(root);

	return () => {
		abortController.abort();
		if (debounceTimer) clearTimeout(debounceTimer);
		for (const w of watchers) {
			try { w.close(); } catch { /* ignore */ }
		}
	};
}

function watchDirRecursive(
	dir: string,
	watchers: ReturnType<typeof watch>[],
	signal: AbortSignal,
	onFile: (filename: string) => void,
): void {
	try {
		const entries = readdirSync(dir);
		for (const name of entries) {
			if (IGNORE_DIRS.has(name)) continue;
			const fullPath = join(dir, name);
			try {
				if (statSync(fullPath).isDirectory()) {
					const watcher = watch(fullPath, { signal }, (_event, filename) => {
						if (filename) onFile(join(name, filename));
					});
					watchers.push(watcher);
					watchDirRecursive(fullPath, watchers, signal, (f) => onFile(join(name, f)));
				}
			} catch { /* skip */ }
		}
	} catch { /* skip */ }
}
