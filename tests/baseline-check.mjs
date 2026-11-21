#!/usr/bin/env node
// Check the Feature Stability tables in browser-profiles.md against live
// Baseline data from webstatus.dev, and report every row that has drifted.
//
//   node tests/baseline-check.mjs                    # check as of today
//   node tests/baseline-check.mjs --date 2027-01-15  # check as of another day
//   node tests/baseline-check.mjs --self-test        # offline; run by run.sh
//
// Needs network access, so it is NOT part of run.sh or CI. Run it before
// every Baseline re-verification. It reports; it never rewrites the file.
// The dates and prose stay hand-written, and this checks them.
//
// Each table row names its webstatus.dev feature ids in an HTML comment at
// the end of the Feature cell. Comments are invisible when rendered:
//
//   | `:dir()` <!-- ws: dir-pseudo --> | widely available (2026-06-07; ...) |
//   | `text-box-trim` <!-- ws-skip: grouped with the shorthand --> | ... |
//
// A row with neither comment is reported as untracked.
//
// Zero dependencies: Node 18+ (global fetch).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "../skills/shared/references/browser-profiles.md");
const API = "https://api.webstatus.dev/v1/features?q=";
const STABLE_MONTHS = 12;

function parseArgs(argv) {
  const i = argv.indexOf("--date");
  const date = i >= 0 ? argv[i + 1] : new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) throw new Error("--date expects YYYY-MM-DD");
  return { date };
}

function addMonths(iso, months) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Rows of the three tables under "## Feature Stability", tagged by tier.
export function parseRows(md) {
  const rows = [];
  let tier = null;
  let inStability = false;
  md.split("\n").forEach((line, idx) => {
    if (/^## /.test(line)) inStability = /^## Feature Stability/.test(line);
    if (!inStability) return;
    const h = line.match(/^### (Stable|Emerging|Experimental)\b/);
    if (h) { tier = h[1]; return; }
    if (!tier || !line.startsWith("|") || /^\|\s*-+/.test(line) || /^\|\s*Feature\s*\|/.test(line)) return;
    const ws = line.match(/<!--\s*ws:\s*([^>]*?)\s*-->/);
    const skip = line.match(/<!--\s*ws-skip:\s*([^>]*?)\s*-->/);
    const label = line.split("|")[1].replace(/<!--.*?-->/g, "").trim();
    rows.push({
      line: idx + 1,
      tier,
      label,
      text: line,
      ids: ws ? ws[1].split(/[\s,]+/).filter(Boolean) : [],
      skip: skip ? skip[1] : null,
    });
  });
  return rows;
}

// Tier a feature as of `date`, using the same arithmetic as browser-profiles.md.
export function tierOf(baseline, date) {
  if (!baseline || baseline.status === "limited" || !baseline.status) return "Experimental";
  if (baseline.status === "widely") return "Stable";
  return addMonths(baseline.low_date, STABLE_MONTHS) <= date ? "Stable" : "Emerging";
}

async function fetchFeature(id) {
  const res = await fetch(API + encodeURIComponent(`id:${id}`), { headers: { "User-Agent": "css-skills-baseline-check" } });
  if (!res.ok) throw new Error(`webstatus.dev returned HTTP ${res.status} for ${id}`);
  const body = await res.json();
  const f = (body.data ?? []).find((x) => x.feature_id === id);
  if (!f) return null;
  return { id, name: f.name, baseline: f.baseline ?? { status: "limited" } };
}

async function fetchAll(ids) {
  const out = new Map();
  const queue = [...ids];
  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      out.set(id, await fetchFeature(id));
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}

export function checkRow(row, features, date) {
  const problems = [];
  if (row.skip) return problems;
  if (!row.ids.length) return [`untracked: add <!-- ws: <feature-id> --> or <!-- ws-skip: reason -->`];
  for (const id of row.ids) {
    const f = features.get(id);
    if (!f) { problems.push(`\`${id}\`: no such webstatus.dev feature id`); continue; }
    const b = f.baseline;
    const live = tierOf(b, date);
    if (live !== row.tier) {
      const why = b.status === "limited" ? "limited availability" :
        b.status === "widely" ? `widely available since ${b.high_date}` :
        `newly available since ${b.low_date}; Stable from ${addMonths(b.low_date, STABLE_MONTHS)}`;
      problems.push(`\`${id}\`: listed as ${row.tier}, webstatus.dev says ${live} (${why})`);
      continue;
    }
    if (row.tier === "Experimental") continue;
    const saysWidely = /widely available/i.test(row.text);
    if (b.status === "widely" && !saysWidely) {
      problems.push(`\`${id}\`: reached widely available on ${b.high_date}; say so, and flip its capability to true on enterprise`);
    }
    // Future crossings are written "widely 2027-01", never "widely available".
    if (b.status === "newly" && saysWidely) {
      problems.push(`\`${id}\`: row says widely available, webstatus.dev says newly available (${b.low_date})`);
    }
    // Rows that state dates must carry the newly-available date. Grouped
    // "widely available" rows without dates are fine.
    const dates = row.text.match(/\d{4}-\d{2}(-\d{2})?/g) ?? [];
    if (b.low_date && dates.length && b.status !== "widely" && !dates.some((d) => b.low_date.startsWith(d))) {
      problems.push(`\`${id}\`: newly-available date is ${b.low_date}, not in the row (${dates.join(", ")})`);
    }
  }
  return problems;
}

function upcoming(rows, features, date) {
  const events = [];
  for (const row of rows) {
    for (const id of row.ids) {
      const b = features.get(id)?.baseline;
      if (!b || b.status !== "newly") continue;
      const stable = addMonths(b.low_date, STABLE_MONTHS);
      const widely = addMonths(b.low_date, 30);
      if (stable > date) events.push([stable, `\`${id}\` → Stable`]);
      if (widely > date) events.push([widely, `\`${id}\` → widely available (enterprise flip)`]);
    }
  }
  return events.sort((a, b) => a[0].localeCompare(b[0])).slice(0, 8);
}

// Offline: annotation coverage of the real file, plus the tier and drift
// logic on canned data. Run by run.sh; needs no network.
function selfTest() {
  const failures = [];
  const expect = (cond, msg) => { if (!cond) failures.push(msg); };

  const rows = parseRows(readFileSync(FILE, "utf8"));
  expect(rows.length > 0, "parsed no Feature Stability rows from browser-profiles.md");
  for (const r of rows) {
    expect(r.ids.length || r.skip, `browser-profiles.md:${r.line} has no <!-- ws: --> or <!-- ws-skip: --> annotation`);
  }

  const date = "2026-11-21";
  expect(tierOf({ status: "widely" }, date) === "Stable", "widely → Stable");
  expect(tierOf({ status: "limited" }, date) === "Experimental", "limited → Experimental");
  expect(tierOf({ status: "newly", low_date: "2025-11-21" }, date) === "Stable", "newly, exactly 12 months → Stable");
  expect(tierOf({ status: "newly", low_date: "2025-11-22" }, date) === "Emerging", "newly, under 12 months → Emerging");

  const feat = (id, baseline) => new Map([[id, { id, baseline }]]);
  const row = (tier, text, ids) => ({ line: 1, tier, label: "x", text, ids, skip: null });
  const cases = [
    ["Stable", "| x | 2024-07-09 (newly available; widely 2027-01) |", { status: "newly", low_date: "2024-07-09" }, 0],
    ["Stable", "| x | 2024-07-09 (newly available) |", { status: "widely", low_date: "2024-07-09", high_date: "2026-11-09" }, 1],
    ["Stable", "| x | widely available |", { status: "newly", low_date: "2024-07-09" }, 1],
    ["Stable", "| x | 2024-07-10 (newly available) |", { status: "newly", low_date: "2024-07-09" }, 1],
    ["Emerging", "| x | 2026-09-14 |", { status: "newly", low_date: "2026-09-14" }, 0],
    ["Emerging", "| x | 2025-09-14 |", { status: "newly", low_date: "2025-09-14" }, 1],
    ["Experimental", "| x | Not Baseline |", { status: "limited" }, 0],
    ["Experimental", "| x | Not Baseline |", { status: "newly", low_date: "2026-10-01" }, 1],
    ["Stable", "| x | widely available |", { status: "widely", low_date: "2020-01-15", high_date: "2022-07-15" }, 0],
  ];
  cases.forEach(([tier, text, baseline, n], i) => {
    const got = checkRow(row(tier, text, ["f"]), feat("f", baseline), date).length;
    expect(got === n, `checkRow case ${i + 1}: expected ${n} problem(s), got ${got}`);
  });
  expect(checkRow(row("Stable", "| x |", []), new Map(), date).length === 1, "an unannotated row is reported");
  expect(checkRow(row("Stable", "| x |", ["missing"]), new Map([["missing", null]]), date).length === 1, "an unknown id is reported");

  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(failures.length ? "" : `pass  baseline-check: ${rows.length} rows annotated, tier and drift logic correct`);
  process.exit(failures.length ? 1 : 0);
}

async function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  const { date } = parseArgs(process.argv.slice(2));
  const rows = parseRows(readFileSync(FILE, "utf8"));
  const ids = [...new Set(rows.flatMap((r) => r.ids))];
  let features;
  try {
    features = await fetchAll(ids);
  } catch (err) {
    console.error(`Could not reach webstatus.dev: ${err.message}`);
    process.exit(2);
  }

  let drift = 0;
  for (const row of rows) {
    const problems = checkRow(row, features, date);
    if (!problems.length) continue;
    drift += problems.length;
    console.log(`browser-profiles.md:${row.line}  [${row.tier}] ${row.label.slice(0, 70)}`);
    for (const p of problems) console.log(`    ${p}`);
  }

  const skipped = rows.filter((r) => r.skip);
  console.log(`\n${rows.length} rows, ${ids.length} feature ids checked as of ${date}; ${skipped.length} skipped by annotation.`);
  for (const r of skipped) console.log(`  skipped line ${r.line}: ${r.label.slice(0, 50)} (${r.skip})`);
  console.log("\nNext crossings:");
  for (const [d, what] of upcoming(rows, features, date)) console.log(`  ${d}  ${what}`);
  console.log(drift ? `\n${drift} problem(s). Update the rows, then re-run.` : "\nNo drift.");
  process.exit(drift ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
