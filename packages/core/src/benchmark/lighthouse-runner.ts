import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

export interface BenchmarkResult {
	url: string;
	scores: {
		performance: number;
		accessibility: number;
		bestPractices: number;
		seo: number;
	};
	metrics: {
		lcp: number;
		fcp: number;
		cls: number;
		tbt: number;
		si: number;
		tti: number;
	};
	timestamp: string;
}

export interface BenchmarkOptions {
	url: string;
	runs?: number;
	device?: "mobile" | "desktop";
}

/**
 * Run Lighthouse benchmark against a URL using headless Chrome.
 */
export async function runBenchmark(options: BenchmarkOptions): Promise<BenchmarkResult> {
	const { url, runs = 1, device = "mobile" } = options;

	const chrome = await chromeLauncher.launch({
		chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
	});

	try {
		const results: BenchmarkResult[] = [];

		for (let i = 0; i < runs; i++) {
			const runnerResult = await lighthouse(url, {
				port: chrome.port,
				output: "json",
				logLevel: "error",
				formFactor: device,
				screenEmulation:
					device === "desktop"
						? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
						: undefined,
				throttling:
					device === "desktop"
						? {
								cpuSlowdownMultiplier: 1,
								downloadThroughputKbps: 0,
								uploadThroughputKbps: 0,
								requestLatencyMs: 0,
								rttMs: 40,
								throughputKbps: 10240,
							}
						: undefined,
			});

			if (!runnerResult?.lhr) {
				throw new Error("Lighthouse returned no results");
			}

			const lhr = runnerResult.lhr;

			results.push({
				url,
				scores: {
					performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
					accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
					bestPractices: Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100),
					seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
				},
				metrics: {
					lcp: Math.round(lhr.audits["largest-contentful-paint"]?.numericValue ?? 0),
					fcp: Math.round(lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
					cls: Number.parseFloat(
						(lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3),
					),
					tbt: Math.round(lhr.audits["total-blocking-time"]?.numericValue ?? 0),
					si: Math.round(lhr.audits["speed-index"]?.numericValue ?? 0),
					tti: Math.round(lhr.audits.interactive?.numericValue ?? 0),
				},
				timestamp: new Date().toISOString(),
			});
		}

		// Average if multiple runs
		if (results.length === 1) {
			const first = results[0];
			if (first) return first;
		}

		return {
			url,
			scores: {
				performance: avg(results.map((r) => r.scores.performance)),
				accessibility: avg(results.map((r) => r.scores.accessibility)),
				bestPractices: avg(results.map((r) => r.scores.bestPractices)),
				seo: avg(results.map((r) => r.scores.seo)),
			},
			metrics: {
				lcp: avg(results.map((r) => r.metrics.lcp)),
				fcp: avg(results.map((r) => r.metrics.fcp)),
				cls: Number.parseFloat(avg(results.map((r) => r.metrics.cls)).toFixed(3)),
				tbt: avg(results.map((r) => r.metrics.tbt)),
				si: avg(results.map((r) => r.metrics.si)),
				tti: avg(results.map((r) => r.metrics.tti)),
			},
			timestamp: new Date().toISOString(),
		};
	} finally {
		await chrome.kill();
	}
}

function avg(nums: number[]): number {
	if (nums.length === 0) return 0;
	return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Format benchmark result for terminal display.
 */
export function formatBenchmarkReport(result: BenchmarkResult): string {
	const lines: string[] = [];

	lines.push("");
	lines.push(`  \x1b[1mspeedlint benchmark\x1b[0m — ${result.url}`);
	lines.push("");

	// Scores
	lines.push("  Scores");
	lines.push(`    Performance:    ${scoreColor(result.scores.performance)}`);
	lines.push(`    Accessibility:  ${scoreColor(result.scores.accessibility)}`);
	lines.push(`    Best Practices: ${scoreColor(result.scores.bestPractices)}`);
	lines.push(`    SEO:            ${scoreColor(result.scores.seo)}`);
	lines.push("");

	// Core Web Vitals
	lines.push("  Core Web Vitals");
	lines.push(
		`    LCP:  ${metricColor(result.metrics.lcp, 2500, 4000)}ms ${metricLabel(result.metrics.lcp, 2500, 4000)}`,
	);
	lines.push(
		`    FCP:  ${metricColor(result.metrics.fcp, 1800, 3000)}ms ${metricLabel(result.metrics.fcp, 1800, 3000)}`,
	);
	lines.push(
		`    CLS:  ${clsColor(result.metrics.cls)} ${metricLabel(result.metrics.cls, 0.1, 0.25)}`,
	);
	lines.push(
		`    TBT:  ${metricColor(result.metrics.tbt, 200, 600)}ms ${metricLabel(result.metrics.tbt, 200, 600)}`,
	);
	lines.push(`    SI:   ${result.metrics.si}ms`);
	lines.push(`    TTI:  ${result.metrics.tti}ms`);
	lines.push("");

	return lines.join("\n");
}

function scoreColor(score: number): string {
	if (score >= 90) return `\x1b[32m${score}\x1b[0m`;
	if (score >= 50) return `\x1b[33m${score}\x1b[0m`;
	return `\x1b[31m${score}\x1b[0m`;
}

function metricColor(value: number, good: number, poor: number): string {
	if (value <= good) return `\x1b[32m${value}\x1b[0m`;
	if (value <= poor) return `\x1b[33m${value}\x1b[0m`;
	return `\x1b[31m${value}\x1b[0m`;
}

function clsColor(value: number): string {
	if (value <= 0.1) return `\x1b[32m${value}\x1b[0m`;
	if (value <= 0.25) return `\x1b[33m${value}\x1b[0m`;
	return `\x1b[31m${value}\x1b[0m`;
}

function metricLabel(value: number, good: number, poor: number): string {
	if (value <= good) return "\x1b[32m(good)\x1b[0m";
	if (value <= poor) return "\x1b[33m(needs improvement)\x1b[0m";
	return "\x1b[31m(poor)\x1b[0m";
}
