"use strict";

const fs = require("fs");
const path = require("path");

// Skip when running inside the package's own directory (e.g. during development)
const packageRoot = path.resolve(__dirname, "../..");
if (path.resolve(process.cwd()) === packageRoot) process.exit(0);

const configPath = path.join(process.cwd(), "reqsight.config.js");

if (fs.existsSync(configPath)) {
  console.log("[reqsight] Config file already exists — skipping creation.");
  process.exit(0);
}

const sourcePath = path.join(__dirname, "../config.js");
const defaultConfig = fs.readFileSync(sourcePath, "utf8");

try {
  fs.writeFileSync(configPath, defaultConfig, "utf8");
  console.log("[reqsight] Config file created → reqsight.config.js");
  console.log("[reqsight] Customize it to control what gets logged.");
} catch (err) {
  console.warn("[reqsight] Could not create config file:", err.message);
}
