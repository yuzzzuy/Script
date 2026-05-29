"use strict";

const assert = require("assert");
const path = require("path");
const cases = require("./cases");

const scriptPath = path.resolve(__dirname, "../rename.optimized.js");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runCase(testCase) {
  global.$arguments = testCase.arguments || {};
  delete require.cache[scriptPath];

  const { operator } = require(scriptPath);
  const actual = operator(clone(testCase.input)).map(function getName(proxy) {
    return proxy.name;
  });

  assert.deepStrictEqual(actual, testCase.expected);
}

let passed = 0;

cases.forEach(function run(testCase) {
  try {
    runCase(testCase);
    passed += 1;
    console.log("PASS", testCase.name);
  } catch (error) {
    console.error("FAIL", testCase.name);
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  }
});

if (process.exitCode) {
  console.error("FAILED", passed + "/" + cases.length, "cases passed");
  process.exit(process.exitCode);
}

console.log("OK", passed + "/" + cases.length, "cases passed");
