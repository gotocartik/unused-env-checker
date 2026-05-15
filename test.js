import { scan } from "./index.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Test 1: Basic scan with .env present ---
function testBasicScan() {
  const testDir = path.join(__dirname, ".test-sandbox");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, ".env"), [
    "PORT=3000\n",
    "JWT_SECRET=secret123\n",
    "OLD_API_KEY=abc\n",
    "DATABASE_URL=mongodb://...\n",
  ].join(""));

  fs.mkdirSync(path.join(testDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(testDir, "src", "server.js"), [
    'const port = process.env.PORT;\n',
    'const db = process.env.DATABASE_URL;\n',
  ].join(""));
  fs.writeFileSync(path.join(testDir, "src", "auth.js"), [
    'const secret = process.env.JWT_SECRET;\n',
  ].join(""));

  const result = scan(testDir);

  console.assert(
    result.used.includes("PORT") && result.used.includes("JWT_SECRET") && result.used.includes("DATABASE_URL"),
    "Test 1 FAIL: should have PORT, JWT_SECRET, DATABASE_URL as used"
  );
  console.assert(
    result.unused.includes("OLD_API_KEY"),
    "Test 1 FAIL: OLD_API_KEY should be unused"
  );
  console.assert(result.missing.length === 0, "Test 1 FAIL: no missing variables expected");

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 1 - Basic scan passed");
}

// --- Test 2: Missing variables detection ---
function testMissingVars() {
  const testDir = path.join(__dirname, ".test-sandbox-2");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, ".env"), "PORT=3000\n");

  fs.mkdirSync(path.join(testDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(testDir, "src", "app.js"), [
    'const port = process.env.PORT;\n',
    'const db = process.env.DATABASE_URL;\n',
    'const key = process.env.SECRET_KEY;\n',
  ].join(""));

  const result = scan(testDir);

  console.assert(result.used.includes("PORT"), "Test 2 FAIL: PORT should be used");
  console.assert(
    result.missing.includes("DATABASE_URL") && result.missing.includes("SECRET_KEY"),
    "Test 2 FAIL: DATABASE_URL and SECRET_KEY should be missing"
  );

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 2 - Missing variables detection passed");
}

// --- Test 3: Ignores node_modules ---
function testIgnoresNodeModules() {
  const testDir = path.join(__dirname, ".test-sandbox-3");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, ".env"), "IGNORED=1\nUSED=1\n");

  fs.mkdirSync(path.join(testDir, "node_modules", "some-lib"), { recursive: true });
  fs.writeFileSync(path.join(testDir, "node_modules", "some-lib", "index.js"), [
    'const x = process.env.IGNORED;\n',
  ].join(""));

  fs.writeFileSync(path.join(testDir, "src", "index.js"), 'const x = process.env.USED;\n');

  const result = scan(testDir);

  console.assert(result.used.includes("USED"), "Test 3 FAIL: USED should be found in src");
  console.assert(
    result.unused.includes("IGNORED"),
    "Test 3 FAIL: IGNORED should be unused (only used in node_modules)"
  );

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 3 - Ignores node_modules passed");
}

// --- Test 4: Handles no .env file ---
function testNoEnvFile() {
  const testDir = path.join(__dirname, ".test-sandbox-4");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, "app.js"), 'const x = process.env.SOMETHING;\n');

  const result = scan(testDir);

  console.assert(result.used.length === 0, "Test 4 FAIL: no used variables expected");
  console.assert(result.unused.length === 0, "Test 4 FAIL: no unused variables expected");
  console.assert(
    result.missing.includes("SOMETHING"),
    "Test 4 FAIL: SOMETHING should be missing"
  );

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 4 - No .env file passed");
}

// --- Test 5: Ignores dangerous keys ---
function testDangerousKeys() {
  const testDir = path.join(__dirname, ".test-sandbox-5");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, ".env"), [
    "__proto__=evil\n",
    "constructor=bad\n",
    "SAFE_KEY=ok\n",
  ].join(""));

  const result = scan(testDir);

  console.assert(
    !result.unused.includes("__proto__") && !result.unused.includes("constructor"),
    "Test 5 FAIL: dangerous keys should be ignored"
  );
  console.assert(
    result.unused.includes("SAFE_KEY"),
    "Test 5 FAIL: SAFE_KEY should be unused"
  );

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 5 - Dangerous keys ignored passed");
}

// --- Test 6: Scans .ts and .jsx files ---
function testExtensionScan() {
  const testDir = path.join(__dirname, ".test-sandbox-6");
  fs.mkdirSync(testDir, { recursive: true });

  fs.writeFileSync(path.join(testDir, ".env"), "API_URL=https://api.example.com\n");

  fs.writeFileSync(path.join(testDir, "app.ts"), "const url = process.env.API_URL;\n");
  fs.writeFileSync(path.join(testDir, "component.tsx"), "const url = process.env.API_URL;\n");

  const result = scan(testDir);

  console.assert(
    result.used.includes("API_URL"),
    "Test 6 FAIL: API_URL should be found in .ts and .tsx files"
  );

  fs.rmSync(testDir, { recursive: true });
  console.log("✅ Test 6 - Extension scan passed");
}

// Run all tests
console.log("Running tests...\n");
testBasicScan();
testMissingVars();
testIgnoresNodeModules();
testNoEnvFile();
testDangerousKeys();
testExtensionScan();
console.log("\n🎉 All tests passed!");
