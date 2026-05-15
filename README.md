# unused-env-checker

A CLI tool for Node.js projects that scans your codebase and compares used environment variables against your `.env` file.

![npm](https://img.shields.io/npm/dt/unused-env-checker)
![npm version](https://img.shields.io/npm/v/unused-env-checker)
![license](https://img.shields.io/npm/l/unused-env-checker)

## Installation

```bash
npm install -g unused-env-checker
```

Or run instantly without installing:

```bash
npx unused-env-checker
```

## Usage

Navigate to your project root (where `.env` lives) and run:

```bash
npx unused-env-checker
```

### Output

```
🔍 Scanning project...

  ✅ PORT is used
  ✅ JWT_SECRET is used

  ⚠ UNUSED VARIABLES:
    - OLD_API_KEY
    - TEMP_SECRET

  ❌ MISSING VARIABLES:
    - DATABASE_URL
```

The tool exits with:
- `0` — all env vars are in use, no missing variables
- `1` — missing variables detected (used in code but missing from `.env`)

## Features

- Scans `.js`, `.ts`, `.jsx`, `.tsx` files recursively
- Automatically ignores `node_modules`, `dist`, `build`, `.git`
- Detects used, unused, and missing environment variables
- Color-coded terminal output (green/yellow/red)
- Protects against dangerous keys (`__proto__`, `constructor`, etc.)
- Zero external dependencies

## What It Checks

| Status | Meaning |
|--------|---------|
| ✅ Used | Found in `.env` and referenced in code |
| ⚠ Unused | In `.env` but never used in code |
| ❌ Missing | Used in code but missing from `.env` |

## Test Examples

```js
// Test 1: Basic scan with .env present
// Tests used, unused, and missing variable detection

// Test 2: Missing variables detection
// Ensures code-used vars not in .env are flagged

// Test 3: Ignores node_modules
// Variables only used in node_modules show as unused

// Test 4: No .env file
// Gracefully handles missing .env files

// Test 5: Dangerous keys ignored
// __proto__ and constructor are filtered out

// Test 6: Extension scan
// Scans .ts and .tsx files in addition to .js/.jsx
```

Run tests:

```bash
node test.js
```

## Why?

Tired of bloated `.env` files with stale variables? Or debugging missing environment variables in production? This tool helps you keep your environment configuration clean and complete.

## License

MIT
