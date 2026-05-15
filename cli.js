#!/usr/bin/env node

import { scan } from "./index.js";

function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}

function bold(text) {
  return colorize(text, 1);
}

function green(text) {
  return colorize(text, 32);
}

function yellow(text) {
  return colorize(text, 33);
}

function red(text) {
  return colorize(text, 31);
}

function dim(text) {
  return colorize(text, 2);
}

const projectDir = process.cwd();

console.log(bold("\n🔍 Scanning project...\n"));

const result = scan(projectDir);
let exitCode = 0;

for (const key of result.used) {
  console.log(`  ${green("✅")} ${key} ${dim("is used")}`);
}

if (result.unused.length > 0) {
  console.log(`\n  ${yellow("⚠")} ${bold("UNUSED VARIABLES:")}`);
  for (const key of result.unused) {
    console.log(`    - ${yellow(key)}`);
  }
}

if (result.missing.length > 0) {
  exitCode = 1;
  console.log(`\n  ${red("❌")} ${bold("MISSING VARIABLES:")}`);
  for (const key of result.missing) {
    console.log(`    - ${red(key)}`);
  }
}

if (result.used.length === 0 && result.unused.length === 0 && result.missing.length === 0) {
  console.log(dim("  No .env file found or no variables detected."));
}

console.log();
process.exit(exitCode);
