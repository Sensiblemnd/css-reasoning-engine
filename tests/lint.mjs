#!/usr/bin/env node
// Deterministic linter for the css-skills rule system.
// Zero dependencies. Run: node tests/lint.mjs <file.css> [...]
//
// Rules implemented here are the mechanically checkable subset of
// skills/shared/references/. Judgment rules (is this token semantic? is @scope
// warranted?) stay with the css-reviewer skill and are deliberately absent.
//
// File directives (comments, anywhere in the file):
//   /* lint-layer-context: components */  this file is @import-ed into that layer
//   /* lint-ignore: rule-id, rule-id */   silence rules for the next construct
//   /* expect: rule-id, rule-id */        fixture annotation, see --self-test

import { readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");

// ---------------------------------------------------------------- parser

function parseStylesheet(src) {
  let i = 0;
  let line = 1;
  const annotations = []; // { line, ids }  fixture expectations
  const ignores = []; // { line, ids }  suppressions
  let layerContext = null;

  const at = (o = 0) => src[i + o];
  const adv = () => {
    const c = src[i++];
    if (c === "\n") line++;
    return c;
  };

  function readComment() {
    const startLine = line;
    adv();
    adv(); // consume "/*"
    let buf = "";
    while (i < src.length && !(at() === "*" && at(1) === "/")) buf += adv();
    adv();
    adv(); // consume "*/"
    const directive = (key) => {
      const m = buf.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "s"));
      return m ? m[1].split(",").map((s) => s.trim()).filter(Boolean) : null;
    };
    const expect = directive("expect");
    if (expect) annotations.push({ line: startLine, ids: expect });
    const ignore = directive("lint-ignore");
    if (ignore) ignores.push({ line: startLine, ids: ignore });
    const ctx = directive("lint-layer-context");
    if (ctx) layerContext = ctx[0];
  }

  function readString() {
    const quote = adv();
    let buf = quote;
    while (i < src.length) {
      const c = at();
      if (c === "\\") {
        buf += adv();
        buf += adv();
        continue;
      }
      buf += adv();
      if (c === quote) break;
    }
    return buf;
  }

  function skipWs() {
    while (i < src.length) {
      if (at() === "/" && at(1) === "*") readComment();
      else if (/\s/.test(at())) adv();
      else break;
    }
  }

  // Read up to an unnested "{", "}" or ";".
  function readPrelude() {
    const startLine = line;
    let buf = "";
    let paren = 0;
    while (i < src.length) {
      const c = at();
      if (c === "/" && at(1) === "*") {
        readComment();
        continue;
      }
      if (c === '"' || c === "'") {
        buf += readString();
        continue;
      }
      if (c === "(") paren++;
      else if (c === ")") paren--;
      else if (paren === 0 && (c === "{" || c === "}" || c === ";")) break;
      buf += adv();
    }
    return { text: buf.trim(), line: startLine };
  }

  function splitDeclaration(text) {
    let paren = 0;
    for (let k = 0; k < text.length; k++) {
      const c = text[k];
      if (c === "(") paren++;
      else if (c === ")") paren--;
      else if (c === ":" && paren === 0) {
        return [text.slice(0, k).trim(), text.slice(k + 1).trim()];
      }
    }
    return null;
  }

  function parseNodes() {
    const out = [];
    for (;;) {
      skipWs();
      if (i >= src.length || at() === "}") break;
      const { text, line: nodeLine } = readPrelude();

      if (at() === "{") {
        adv();
        const children = parseNodes();
        skipWs();
        if (at() === "}") adv();
        if (text.startsWith("@")) {
          const sp = text.search(/\s/);
          out.push({
            type: "atrule",
            name: (sp === -1 ? text : text.slice(0, sp)).slice(1).toLowerCase(),
            prelude: sp === -1 ? "" : text.slice(sp).trim(),
            children,
            line: nodeLine,
          });
        } else if (text) {
          out.push({ type: "rule", selector: text, children, line: nodeLine });
        }
        continue;
      }

      if (at() === ";") adv();
      if (!text) continue;

      if (text.startsWith("@")) {
        const sp = text.search(/\s/);
        out.push({
          type: "atrule",
          name: (sp === -1 ? text : text.slice(0, sp)).slice(1).toLowerCase(),
          prelude: sp === -1 ? "" : text.slice(sp).trim(),
          children: null,
          line: nodeLine,
        });
        continue;
      }

      const decl = splitDeclaration(text);
      if (decl) {
        out.push({ type: "decl", prop: decl[0], value: decl[1], line: nodeLine });
      }
    }
    return out;
  }

  const nodes = parseNodes();
  return { nodes, annotations, ignores, layerContext };
}

// ---------------------------------------------------------------- walker

function walk(nodes, ctx, visit) {
  for (const node of nodes) {
    if (node.type === "atrule") {
      let next = { ...ctx, atrules: [...ctx.atrules, node.name] };
      if (node.name === "layer" && node.children) {
        const named = node.prelude.split(".").map((s) => s.trim()).filter(Boolean);
        next.layers = [...ctx.layers, ...(named.length ? named : ["<anonymous>"])];
      }
      visit(node, next);
      if (node.children) walk(node.children, next, visit);
    } else if (node.type === "rule") {
      const next = {
        ...ctx,
        nestDepth: ctx.nestDepth + 1,
        selectorChain: [...ctx.selectorChain, node.selector],
      };
      visit(node, next);
      walk(node.children, next, visit);
    } else {
      visit(node, ctx);
    }
  }
}

// ---------------------------------------------------------------- rule data

const PHYSICAL_PROPS = new Set([
  "margin-left", "margin-right", "margin-top", "margin-bottom",
  "padding-left", "padding-right", "padding-top", "padding-bottom",
  "border-left", "border-right", "border-top", "border-bottom",
  "border-left-width", "border-right-width", "border-top-width", "border-bottom-width",
  "border-left-color", "border-right-color", "border-top-color", "border-bottom-color",
  "border-left-style", "border-right-style", "border-top-style", "border-bottom-style",
  "top", "right", "bottom", "left",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "overflow-x", "overflow-y",
]);

const PHYSICAL_VALUES = { "text-align": /^(left|right)$/i, float: /^(left|right)$/i, clear: /^(left|right)$/i };

const NAMED_COLORS = new Set([
  "red", "blue", "green", "white", "black", "gray", "grey", "yellow", "orange",
  "purple", "pink", "brown", "cyan", "magenta", "silver", "gold", "navy",
  "teal", "olive", "lime", "maroon", "aqua", "fuchsia",
]);

// Prefixes with no unprefixed equivalent; not worth flagging.
const ALLOWED_PREFIXES = [
  "-webkit-text-size-adjust", "-webkit-tap-highlight-color",
  "-webkit-font-smoothing", "-moz-osx-font-smoothing",
  "-webkit-overflow-scrolling", "-webkit-line-clamp", "-webkit-box-orient",
];

// Properties whose animation forces layout on every frame.
const LAYOUT_PROPS = new RegExp(
  "^(" + [
    "(min-|max-)?(width|height|inline-size|block-size)",
    "top", "right", "bottom", "left", "inset(-(block|inline)(-(start|end))?)?",
    "(margin|padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?",
    "font-size",
  ].join("|") + ")$",
  "i",
);

const COLOR_FN = /\b(rgba?|hsla?)\s*\(/i;
const HEX = /#[0-9a-f]{3,8}\b/i;

// Split a selector list on top-level commas only, so :where(a, button) and
// :is(.x, .y) survive intact.
function splitSelectors(selector) {
  const out = [];
  let depth = 0;
  let buf = "";
  for (const ch of selector) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function compoundCount(selector) {
  // Split one selector on descendant/child/sibling combinators, ignoring
  // combinators inside :is()/:where()/:has()/[attr].
  let depth = 0;
  let parts = 1;
  let sawSpace = false;
  for (const ch of selector) {
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0) {
      if (/\s/.test(ch)) sawSpace = true;
      else if (">+~".includes(ch)) { parts++; sawSpace = false; }
      else if (sawSpace) { parts++; sawSpace = false; }
    }
  }
  return parts;
}

// ---------------------------------------------------------------- rules

const RULES = [
  {
    id: "no-unlayered",
    doc: "rules-architecture.md — every rule lives in a cascade layer",
    check(node, ctx, report) {
      if (node.type !== "rule" || ctx.nestDepth > 1) return;
      if (ctx.layers.length === 0 && !ctx.layerContext) {
        report(node.line, `Rule \`${node.selector}\` is outside any @layer.`);
      }
    },
  },
  {
    id: "no-important",
    doc: "prohibited-patterns.md — !important only in the overrides layer",
    check(node, ctx, report) {
      if (node.type !== "decl" || !/!\s*important/i.test(node.value)) return;
      const layers = [...ctx.layers, ctx.layerContext].filter(Boolean);
      if (!layers.includes("overrides")) {
        report(node.line, `\`${node.prop}\` uses !important outside the overrides layer.`);
      }
    },
  },
  {
    id: "no-id-selector",
    doc: "rules-architecture.md — ID selectors are prohibited",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      // Ignore "#" inside attribute values and :not(#x) is still an ID selector.
      const stripped = node.selector.replace(/\[[^\]]*\]/g, "");
      if (/#[a-z_-]/i.test(stripped)) {
        report(node.line, `Selector \`${node.selector}\` uses an ID.`);
      }
    },
  },
  {
    id: "no-literal-color",
    doc: "rules-color-typography.md — components reference semantic tokens only",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      const layers = [...ctx.layers, ctx.layerContext].filter(Boolean);
      // Literal colors are how tokens get defined; only flag outside tokens.
      if (layers.includes("tokens") || ctx.atrules.includes("property")) return;
      if (node.prop.startsWith("--")) return;
      const v = node.value;
      let found = null;
      if (HEX.test(v)) found = v.match(HEX)[0];
      else if (COLOR_FN.test(v)) found = v.match(COLOR_FN)[1];
      else {
        // black/white as color-mix() operands are a shading idiom, not a
        // literal design color: color-mix(in oklch, var(--x), black 12%).
        const shading = /color-mix\s*\(/i.test(v);
        for (const word of v.toLowerCase().split(/[^a-z]+/)) {
          if (!NAMED_COLORS.has(word)) continue;
          if (shading && (word === "black" || word === "white")) continue;
          found = word;
          break;
        }
      }
      if (found) report(node.line, `Literal color \`${found}\` in \`${node.prop}\`; use a semantic token.`);
    },
  },
  {
    id: "no-physical-property",
    doc: "rules-layout.md — logical properties instead of physical ones",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      if (ctx.atrules.includes("print")) return;
      const prop = node.prop.toLowerCase();
      if (PHYSICAL_PROPS.has(prop)) {
        report(node.line, `Physical property \`${prop}\`; use its logical equivalent.`);
        return;
      }
      const pattern = PHYSICAL_VALUES[prop];
      if (pattern && pattern.test(node.value.trim())) {
        report(node.line, `Physical value \`${node.value.trim()}\` on \`${prop}\`; use inline-start/inline-end.`);
      }
    },
  },
  {
    id: "no-transition-all",
    doc: "prohibited-patterns.md — never transition: all",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      const prop = node.prop.toLowerCase();
      if (prop !== "transition" && prop !== "transition-property") return;
      if (/(^|[\s,])all([\s,]|$)/i.test(node.value)) {
        report(node.line, `\`${prop}: ${node.value}\` transitions every property.`);
      }
    },
  },
  {
    id: "no-sass-concat",
    doc: "rules-architecture.md — &-suffix is invalid native CSS",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      if (/&[-_a-z0-9]/i.test(node.selector)) {
        report(node.line, `Sass-style concatenation in \`${node.selector}\`; invalid in native CSS.`);
      }
    },
  },
  {
    id: "max-nesting-depth",
    doc: "rules-architecture.md — maximum nesting depth 3",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      if (ctx.nestDepth > 3) {
        report(node.line, `Nesting depth ${ctx.nestDepth} exceeds 3 at \`${node.selector}\`.`);
      }
    },
  },
  {
    id: "no-bare-vh",
    doc: "rules-layout.md — dvh/svh/lvh, not bare vh, for mobile-affected heights",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      if (!/(block-size|height)$/i.test(node.prop)) return;
      if (/(?<![a-z])\d*\.?\d+vh\b/i.test(node.value)) {
        report(node.line, `Bare \`vh\` in \`${node.prop}\`; use dvh/svh/lvh.`);
      }
    },
  },
  {
    id: "no-prefixed-media-range",
    doc: "rules-layout.md — range comparison syntax, not min-/max- prefixes",
    check(node, ctx, report) {
      if (node.type !== "atrule") return;
      if (node.name !== "media" && node.name !== "container") return;
      const m = node.prelude.match(/\b(min|max)-(width|height|inline-size|block-size)\s*:/i);
      if (m) {
        report(node.line, `\`${m[0]}\` in @${node.name}; use range syntax (width < 60rem).`);
      }
    },
  },
  {
    id: "no-vendor-prefix",
    doc: "prohibited-patterns.md — no vendor prefixes for stable features",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      const prop = node.prop.toLowerCase();
      if (!/^-(webkit|moz|ms|o)-/.test(prop)) return;
      if (ALLOWED_PREFIXES.includes(prop)) return;
      report(node.line, `Vendor-prefixed \`${prop}\`; the unprefixed property is stable.`);
    },
  },
  {
    id: "no-unanchored-has",
    doc: "rules-layout.md — anchor :has() to a specific selector",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      for (const s of splitSelectors(node.selector)) {
        if (/^(\*\s*)?:has\(/.test(s)) {
          report(node.line, `Unanchored \`${s}\`; anchor :has() to a specific selector.`);
        }
      }
    },
  },
  {
    id: "no-forced-color-adjust-none",
    doc: "rules-a11y-performance.md — never disable forced-colors",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      if (/^forced-color-adjust$/i.test(node.prop) && /^none$/i.test(node.value.trim())) {
        report(node.line, "forced-color-adjust: none breaks forced-colors mode.");
      }
    },
  },
  {
    id: "no-outline-none",
    doc: "rules-a11y-performance.md — never remove focus indicators",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      if (!/:focus(-visible|-within)?\b/.test(node.selector)) return;
      const decls = node.children.filter((c) => c.type === "decl");
      const kills = decls.find(
        (d) => /^outline$/i.test(d.prop) && /^(none|0[a-z]*)$/i.test(d.value.trim()),
      );
      if (!kills) return;
      const replaced = decls.some(
        (d) => /^(box-shadow|outline-(width|style|color|offset))$/i.test(d.prop) ||
          (/^outline$/i.test(d.prop) && !/^(none|0[a-z]*)$/i.test(d.value.trim())),
      );
      if (!replaced) {
        report(kills.line, `\`${node.selector}\` removes the focus indicator with no replacement.`);
      }
    },
  },
  {
    id: "max-selector-depth",
    doc: "prohibited-patterns.md — no deep descendant chains",
    check(node, ctx, report) {
      if (node.type !== "rule") return;
      // Selector-string depth only. Nesting depth is max-nesting-depth's job;
      // combining them here would double-report the same construct.
      for (const s of splitSelectors(node.selector)) {
        if (!s || s.startsWith("@")) continue;
        const depth = compoundCount(s);
        if (depth > 3) {
          report(node.line, `Selector \`${s}\` is ${depth} levels deep (max 3).`);
        }
      }
    },
  },
  {
    id: "unregistered-animated-property",
    doc: "rules-advanced.md — register a custom property before animating it",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      const prop = node.prop.toLowerCase();

      if (prop === "transition" || prop === "transition-property") {
        // Strip var() so `transition: opacity var(--dur)` doesn't read --dur
        // as the transitioned property.
        const value = node.value.replace(/var\(\s*--[^)]*\)/g, "");
        for (const [, , name] of value.matchAll(/(^|[\s,])(--[\w-]+)/g)) {
          if (!ctx.registered.has(name)) {
            report(node.line, `\`${name}\` is transitioned but never registered with @property, so it interpolates discretely — the transition does nothing.`);
          }
        }
        return;
      }

      if (prop.startsWith("--") && ctx.atrules.includes("keyframes")) {
        if (!ctx.registered.has(prop)) {
          report(node.line, `\`${prop}\` is animated in @keyframes but never registered with @property, so it interpolates discretely.`);
        }
      }
    },
  },
  {
    id: "no-layout-animation",
    doc: "rules-a11y-performance.md — never transition or animate layout properties",
    check(node, ctx, report) {
      if (node.type !== "decl") return;
      const prop = node.prop.toLowerCase();

      if (prop === "transition" || prop === "transition-property") {
        for (const segment of splitSelectors(node.value)) {
          // transition: the property is the first token of each segment;
          // transition-property: each segment is a property name.
          const name = segment.trim().split(/\s+/)[0].toLowerCase();
          if (LAYOUT_PROPS.test(name)) {
            report(node.line, `Transitions layout property \`${name}\`; animate transform/opacity instead.`);
          }
        }
        return;
      }

      if (ctx.atrules.includes("keyframes") && LAYOUT_PROPS.test(prop)) {
        report(node.line, `@keyframes animates layout property \`${prop}\`; animate transform/opacity instead.`);
      }
    },
  },
  {
    id: "no-invalid-supports-guard",
    doc: "browser-profiles.md — @supports tests that are invalid or detect nothing",
    check(node, ctx, report) {
      if (node.type !== "atrule" || node.name !== "supports") return;
      const p = node.prelude;
      if (/\bat-rule\s*\(/i.test(p)) {
        report(node.line, "`at-rule()` is not Baseline; the guard drops the block in engines that support the at-rule.");
      }
      if (/(^|[\s(])style\s*\(/i.test(p)) {
        report(node.line, "`style()` is not a valid @supports test; the block is dropped in every engine.");
      }
      if (/\(\s*result\s*:/i.test(p)) {
        report(node.line, "`result` is an @function descriptor, not a property; this test is always false.");
      }
      if (/\(\s*anchor-name\s*:/i.test(p)) {
        report(node.line, "`anchor-name` is Baseline and detects nothing; guard on `position-anchor`.");
      }
    },
  },
];

const RULE_IDS = new Set(RULES.map((r) => r.id));

// @property registrations are commonly in a separate tokens file, so they are
// collected across every file in one invocation, not per file. Linting a single
// component file in isolation can therefore report a registration that exists
// elsewhere — pass the whole stylesheet set to avoid that.
function collectRegistrations(nodes, into = new Set()) {
  for (const node of nodes) {
    if (node.type === "atrule") {
      if (node.name === "property" && node.prelude.startsWith("--")) {
        into.add(node.prelude.trim());
      }
      if (node.children) collectRegistrations(node.children, into);
    } else if (node.type === "rule") {
      collectRegistrations(node.children, into);
    }
  }
  return into;
}

// ---------------------------------------------------------------- lint

function lintParsed(parsed, filename, registered) {
  const { nodes, annotations, ignores, layerContext } = parsed;
  const findings = [];
  const seen = new Set();

  const suppressed = (id, line) =>
    ignores.some((ig) => ig.ids.includes(id) && line - ig.line >= 0 && line - ig.line <= 3);

  const baseCtx = {
    layers: [],
    atrules: [],
    nestDepth: 0,
    selectorChain: [],
    layerContext,
    registered,
  };

  walk(nodes, baseCtx, (node, ctx) => {
    for (const rule of RULES) {
      rule.check(node, ctx, (line, message) => {
        if (suppressed(rule.id, line)) return;
        // Selector lists span lines; keep one finding on one line.
        const flat = message.replace(/\s+/g, " ").trim();
        const text = flat.length > 110 ? `${flat.slice(0, 107)}...` : flat;
        // A @keyframes property is set in every keyframe; report it once.
        const key = `${rule.id}|${text}`;
        if (seen.has(key)) return;
        seen.add(key);
        findings.push({ file: filename, line, ruleId: rule.id, message: text });
      });
    }
  });

  findings.sort((a, b) => a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  return { findings, annotations };
}

// ---------------------------------------------------------------- markdown

// Pull every ```css block out of a Markdown file. The reference files teach by
// example, and an AI copies examples more faithfully than prose, so a broken
// "Preferred" block is a rule violation in the most-copied place.
//
// Skipped (anti-examples, meant to violate):
//   - a block whose preceding non-blank line starts with "Avoid", "Never", or
//     "Before" (the input half of a refactor before/after pair)
//   - a block preceded by <!-- lint-skip: reason -->
function extractCssBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];
  let prev = "";
  for (let k = 0; k < lines.length; k++) {
    const open = lines[k].match(/^(\s*)```css\s*$/);
    if (!open) {
      if (lines[k].trim()) prev = lines[k].trim();
      continue;
    }
    const indent = open[1].length;
    const body = [];
    let j = k + 1;
    while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) {
      body.push(lines[j].slice(Math.min(indent, lines[j].search(/\S|$/))));
      j++;
    }
    const skip = /^(Avoid|Never|Before)\b/i.test(prev) || /^<!--\s*lint-skip\b/i.test(prev);
    blocks.push({ line: k + 2, code: body.join("\n"), skip });
    prev = "";
    k = j;
  }
  return blocks;
}

// Each block is linted as its own stylesheet, and findings are mapped back to
// the Markdown line. Blocks are fragments, so two rules are relaxed for them:
//   - no-unlayered: examples routinely omit the @layer wrapper to stay short.
//     The css-engineer skill states that emitted CSS must still be layered.
//   - unregistered-animated-property: registrations are collected across all
//     blocks in the run, as they are across files for stylesheets.
const EXAMPLE_EXEMPT = new Set(["no-unlayered"]);

function readSources(paths) {
  const out = [];
  for (const path of paths) {
    const name = relative(REPO, path) || path;
    const src = readFileSync(path, "utf8");
    if (!path.endsWith(".md")) {
      out.push({ path, name, src, offset: 0, example: false });
      continue;
    }
    for (const block of extractCssBlocks(src)) {
      if (block.skip) continue;
      out.push({ path, name, src: block.code, offset: block.line - 1, example: true });
    }
  }
  return out;
}

// Two passes: collect @property registrations across every file first, then
// lint. A component file's registrations often live in a separate tokens file.
function lintFiles(paths) {
  const parsed = readSources(paths).map((entry) => ({
    ...entry,
    tree: parseStylesheet(entry.src),
  }));

  const registered = new Set();
  for (const entry of parsed) collectRegistrations(entry.tree.nodes, registered);

  // Markdown blocks from one file are merged back into one result per file.
  const byName = new Map();
  for (const entry of parsed) {
    const { findings, annotations } = lintParsed(entry.tree, entry.name, registered);
    const kept = findings
      .filter((f) => !(entry.example && EXAMPLE_EXEMPT.has(f.ruleId)))
      .map((f) => ({ ...f, line: f.line + entry.offset }));
    const result = byName.get(entry.name) ?? { path: entry.path, name: entry.name, findings: [], annotations: [] };
    result.findings.push(...kept);
    result.annotations.push(...annotations);
    byName.set(entry.name, result);
  }
  for (const result of byName.values()) {
    result.findings.sort((a, b) => a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  }
  return [...byName.values()];
}

function lintFile(path) {
  return lintFiles([path])[0];
}

// ---------------------------------------------------------------- reporting

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function printFindings(findings) {
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line}  ${red("error")}  ${dim(f.ruleId.padEnd(26))} ${f.message}`);
  }
}

function counted(list) {
  const map = new Map();
  for (const id of list) map.set(id, (map.get(id) ?? 0) + 1);
  return map;
}

// Compare multisets of rule ids rather than line-by-line: robust against
// formatting churn in the fixture. Trade-off: a rule firing on the wrong line
// but the right count is not caught.
function diffCounts(expected, actual) {
  const problems = [];
  for (const [id, want] of expected) {
    const got = actual.get(id) ?? 0;
    if (got < want) problems.push(`  missed  ${id}: expected ${want}, found ${got}`);
    else if (got > want) problems.push(`  extra   ${id}: expected ${want}, found ${got}`);
  }
  for (const [id, got] of actual) {
    if (!expected.has(id)) problems.push(`  extra   ${id}: expected 0, found ${got}`);
  }
  return problems;
}

// ---------------------------------------------------------------- self-test

function selfTest() {
  let failed = false;

  const compliantPath = join(HERE, "fixtures", "compliant.css");
  const { findings: clean } = lintFile(compliantPath);
  if (clean.length === 0) {
    console.log(`${green("pass")}  compliant.css produced no findings`);
  } else {
    failed = true;
    console.log(`${red("FAIL")}  compliant.css should be clean but produced ${clean.length}:`);
    printFindings(clean);
  }

  const violationsPath = join(HERE, "fixtures", "violations.css");
  const { findings, annotations } = lintFile(violationsPath);

  const unknown = annotations.flatMap((a) => a.ids).filter((id) => !RULE_IDS.has(id));
  if (unknown.length) {
    failed = true;
    console.log(`${red("FAIL")}  violations.css annotates unknown rule ids: ${[...new Set(unknown)].join(", ")}`);
  }

  const expected = counted(annotations.flatMap((a) => a.ids));
  const actual = counted(findings.map((f) => f.ruleId));
  const problems = diffCounts(expected, actual);

  if (problems.length === 0) {
    console.log(`${green("pass")}  violations.css matched all ${findings.length} expected findings`);
  } else {
    failed = true;
    console.log(`${red("FAIL")}  violations.css expectations did not match:`);
    problems.forEach((p) => console.log(p));
    console.log(dim("\n  actual findings:"));
    printFindings(findings);
  }

  // Markdown extraction: anti-examples skipped, fragments exempt from
  // no-unlayered, annotated Preferred violation still caught.
  const examplesPath = join(HERE, "fixtures", "examples.md");
  const ex = lintFile(examplesPath);
  const exProblems = diffCounts(
    counted(ex.annotations.flatMap((a) => a.ids)),
    counted(ex.findings.map((f) => f.ruleId)),
  );
  if (exProblems.length === 0) {
    console.log(`${green("pass")}  examples.md extraction matched expectations`);
  } else {
    failed = true;
    console.log(`${red("FAIL")}  examples.md extraction did not match:`);
    exProblems.forEach((p) => console.log(p));
    printFindings(ex.findings);
  }

  const covered = new Set(annotations.flatMap((a) => a.ids));
  const uncovered = [...RULE_IDS].filter((id) => !covered.has(id));
  if (uncovered.length) {
    failed = true;
    console.log(`${red("FAIL")}  rules with no fixture coverage: ${uncovered.join(", ")}`);
  } else {
    console.log(`${green("pass")}  all ${RULE_IDS.size} rules covered by fixtures`);
  }

  return failed ? 1 : 0;
}

// ---------------------------------------------------------------- cli

function main(argv) {
  const args = argv.slice(2);

  if (args.includes("--list-rules")) {
    for (const r of RULES) console.log(`${r.id.padEnd(28)} ${dim(r.doc)}`);
    return 0;
  }

  if (args.includes("--self-test")) return selfTest();

  const files = args.filter((a) => !a.startsWith("-"));
  if (files.length === 0) {
    console.error("usage: node tests/lint.mjs <file.css> [...]   |   --self-test   |   --list-rules");
    return 2;
  }

  let total = 0;
  for (const { name: file, findings } of lintFiles(files)) {
    total += findings.length;
    if (findings.length) {
      console.log(`\n${file}`);
      printFindings(findings);
    }
  }

  if (total === 0) {
    console.log(green(`\nNo findings across ${files.length} file(s).`));
    return 0;
  }
  console.log(red(`\n${total} finding(s).`));
  return 1;
}

process.exit(main(process.argv));
