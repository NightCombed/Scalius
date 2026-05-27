import fs from "node:fs";

const filePath = "src/scalius-landing.css";
let css = fs.readFileSync(filePath, "utf8");

const startMarker = ".scalius-landing-wrapper .problem-card[data-glow]{";
const endMarker = ".scalius-landing-wrapper .problem-card[data-glow]>.glow-inner::before{";

const startIdx = css.indexOf(startMarker);
if (startIdx < 0) throw new Error(`Start marker not found: ${startMarker}`);

const endIdx = css.indexOf(endMarker);
if (endIdx < 0) throw new Error(`End marker not found: ${endMarker}`);

// Find the end of the glow-inner::before rule block (the next closing brace after endMarker)
const afterEndMarkerIdx = endIdx + endMarker.length;
const closeIdx = css.indexOf("}", afterEndMarkerIdx);
if (closeIdx < 0) throw new Error("Could not find closing brace for glow-inner::before rule");

const replaceFrom = startIdx;
const replaceTo = closeIdx + 1; // include the closing brace

const replacement = `
.scalius-landing-wrapper .problem-card[data-glow]{
      /* Based directly on the provided GlowCard reference */
      --base: 30;
      --spread: 200;
      --radius: 14;
      --border: 3;
      --backdrop: hsl(0 0% 60% / 0.12);
      --backup-border: var(--backdrop);
      --size: 200;
      --outer: 1;
      --border-size: calc(var(--border, 2) * 1px);
      --spotlight-size: calc(var(--size, 150) * 1px);
      --hue: calc(var(--base) + (var(--xp, 0) * var(--spread, 0)));

      background-image: radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)),
        transparent
      );
      background-color: var(--backdrop, transparent);
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-position: 50% 50%;
      background-attachment: fixed;
      border: var(--border-size) solid var(--backup-border);
      position: relative;
      touch-action: none;
    }

 .scalius-landing-wrapper .problem-card[data-glow]::before,
 .scalius-landing-wrapper .problem-card[data-glow]::after{
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }

.scalius-landing-wrapper .problem-card[data-glow]::before{
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)),
        transparent 100%
      );
      filter: brightness(2);
    }

.scalius-landing-wrapper .problem-card[data-glow]::after{
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)),
        transparent 100%
      );
    }

.scalius-landing-wrapper .problem-card[data-glow]>.glow-inner{
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }

.scalius-landing-wrapper .problem-card[data-glow]>.glow-inner::before{
      content: "";
      position: absolute;
      inset: -10px;
      border-width: 10px;
    }
`.replace(/\n/g, "\r\n");

css = css.slice(0, replaceFrom) + replacement + css.slice(replaceTo);
fs.writeFileSync(filePath, css, "utf8");

console.log("Patched GlowCard CSS block in", filePath);

