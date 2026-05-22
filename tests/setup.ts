// Required for React's act() to work in jsdom test environment
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

import { readFileSync } from "node:fs";
import { runInThisContext } from "node:vm";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import jQuery from "jquery";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Make jQuery available globally (turnBox.js wraps itself in jQuery)
(globalThis as unknown as Record<string, unknown>).jQuery = jQuery;
(globalThis as unknown as Record<string, unknown>).$ = jQuery;

// Load turnBox.js as a script to avoid ESM strict mode issues with the IIFE
const turnBoxPath = resolve(__dirname, "../legacy/turnBox.js");
const turnBoxSource = readFileSync(turnBoxPath, "utf8");
runInThisContext(turnBoxSource);
