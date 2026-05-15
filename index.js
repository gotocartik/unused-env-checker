import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXTENSIONS = new Set([".js", ".ts", ".jsx", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", "dist", "build", ".git"]);
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (key && !DANGEROUS_KEYS.has(key)) vars[key] = true;
  }
  return vars;
}

function scanFiles(dir) {
  let usages = new Set();
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return usages;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        const sub = scanFiles(fullPath);
        sub.forEach((u) => usages.add(u));
      }
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const regex = /process\.env\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          usages.add(match[1]);
        }
      } catch {
        // skip unreadable files
      }
    }
  }
  return usages;
}

export function scan(projectDir) {
  const envPath = path.join(projectDir, ".env");
  const envVars = parseEnvFile(envPath);
  const usedVars = scanFiles(projectDir);

  const used = [];
  const unused = [];
  const missing = [];

  for (const key of Object.keys(envVars)) {
    if (usedVars.has(key)) {
      used.push(key);
    } else {
      unused.push(key);
    }
  }

  for (const key of usedVars) {
    if (!envVars[key]) {
      missing.push(key);
    }
  }

  return { used, unused, missing };
}
