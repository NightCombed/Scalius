import fs from "node:fs";
import path from "node:path";

const inPath = path.join("src", "scalius-landing.css");

let css = fs.readFileSync(inPath, "utf8");
css = css.replace(/^\uFEFF/, ""); // strip BOM
css = css.replace(/\r\n/g, "\n");

function splitSelectors(selText) {
  // Split by commas that are not inside (), [] or strings
  const parts = [];
  let cur = "";
  let depthPar = 0;
  let depthBr = 0;
  let inStr = null;

  for (let i = 0; i < selText.length; i++) {
    const ch = selText[i];
    if (inStr) {
      cur += ch;
      if (ch === inStr && selText[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depthPar++;
    if (ch === ")") depthPar = Math.max(0, depthPar - 1);
    if (ch === "[") depthBr++;
    if (ch === "]") depthBr = Math.max(0, depthBr - 1);

    if (ch === "," && depthPar === 0 && depthBr === 0) {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function prefixOneSelector(sel) {
  const trimmed = sel.trim();
  if (!trimmed) return trimmed;

  // Keyframes steps: do not prefix
  if (/^\d+%$/.test(trimmed) || trimmed === "from" || trimmed === "to") return trimmed;

  // Ensure any :root/html/body scoping becomes wrapper-based
  let s = trimmed.replace(/\bhtml\b/g, ".scalius-landing-wrapper");
  s = s.replace(/\bbody\b/g, ".scalius-landing-wrapper");
  s = s.replace(/:root/g, ".scalius-landing-wrapper");

  // Avoid double prefix
  if (s.startsWith(".scalius-landing-wrapper")) return s;

  // Scope universal selector to wrapper descendants
  if (s === "*") return ".scalius-landing-wrapper *";

  // Default: prefix the selector
  return `.scalius-landing-wrapper ${s}`;
}

function prefixSelectorList(selText) {
  return splitSelectors(selText)
    .map(prefixOneSelector)
    .join(", ");
}

// Second-pass rewriter: prefix selector preludes for qualified rules, but not inside @keyframes.
const src = css;
let out = "";
let i = 0;
let lastEmit = 0;

let braceDepth = 0;
let inComment = false;
let inString = null;

let atPrelude = false;
let atIdent = "";
let inKeyframes = false;
let keyframesDepth = 0;

function emitUntil(idx) {
  out += src.slice(lastEmit, idx);
  lastEmit = idx;
}

while (i < src.length) {
  const ch = src[i];
  const next = src[i + 1];

  if (!inString && !inComment && ch === "/" && next === "*") {
    inComment = true;
    i += 2;
    continue;
  }
  if (inComment) {
    if (ch === "*" && next === "/") {
      inComment = false;
      i += 2;
      continue;
    }
    i++;
    continue;
  }

  if (!inString && (ch === '"' || ch === "'")) {
    inString = ch;
    i++;
    continue;
  }
  if (inString) {
    if (ch === inString && src[i - 1] !== "\\") inString = null;
    i++;
    continue;
  }

  if (ch === "@" && !inKeyframes) {
    const m = src.slice(i).match(/^@([a-zA-Z-]+)/);
    if (m) {
      atPrelude = true;
      atIdent = m[1];
    }
  }

  if (ch === "{") {
    if (atPrelude) {
      // at-rule prelude stays as-is
      emitUntil(i);
      if (/keyframes$/i.test(atIdent)) {
        inKeyframes = true;
        keyframesDepth = braceDepth + 1;
      }
      atPrelude = false;
      atIdent = "";
    } else if (!inKeyframes) {
      // qualified rule selector list: rewrite only the selector prelude
      const chunk = src.slice(lastEmit, i);
      const nl = chunk.lastIndexOf("\n");
      const indent = nl >= 0 ? chunk.slice(0, nl + 1) : "";
      const sel = nl >= 0 ? chunk.slice(nl + 1) : chunk;
      out += indent + prefixSelectorList(sel.trim());
      lastEmit = i;
    } else {
      emitUntil(i);
    }

    braceDepth++;
    i++;
    continue;
  }

  if (ch === "}") {
    if (inKeyframes && braceDepth === keyframesDepth) {
      inKeyframes = false;
      keyframesDepth = 0;
    }
    braceDepth = Math.max(0, braceDepth - 1);
    i++;
    continue;
  }

  if (ch === ";" && atPrelude) {
    atPrelude = false;
    atIdent = "";
  }

  i++;
}

out += src.slice(lastEmit);

// Cleanup: prevent accidental ".scalius-landing-wrapper .scalius-landing-wrapper"
out = out.replace(/\.scalius-landing-wrapper\s+\.scalius-landing-wrapper/g, ".scalius-landing-wrapper");

// Write back using CRLF to match Windows defaults
fs.writeFileSync(inPath, out.replace(/\n/g, "\r\n"), "utf8");

console.log(`Scoped landing CSS into .scalius-landing-wrapper: ${inPath}`);

