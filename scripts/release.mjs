#!/usr/bin/env node
/**
 * 发布新版本脚本
 *
 * 用法：
 *   node scripts/release.mjs <版本号> <应用文件路径> [更新说明]
 *
 * 示例：
 *   node scripts/release.mjs 1.1.0 ./myapp-v1.1.0.zip "修复若干bug，新增自动更新功能"
 *
 * 效果：
 *   1. 将应用文件复制到 public/app-release/app-<版本号>.zip
 *   2. 计算 SHA256 校验值
 *   3. 自动更新 public/app-release/latest.json
 *   4. 你只需要 git push 即可发布
 */

import { copyFileSync, readFileSync, writeFileSync, statSync, existsSync } from "fs";
import { join, basename, resolve } from "path";
import { createHash } from "crypto";

const SITE_URL = "https://blog.lotuses.cn";
const RELEASE_DIR = join(process.cwd(), "public", "stiky-words-release");
const LATEST_JSON = join(RELEASE_DIR, "latest.json");

// --- 参数解析 ---
const [version, filePath, changelog = ""] = process.argv.slice(2);

if (!version || !filePath) {
  console.error("用法: node scripts/release.mjs <版本号> <应用文件路径> [更新说明]");
  console.error("示例: node scripts/release.mjs 1.1.0 ./myapp.zip \"修复bug\"");
  process.exit(1);
}

const sourceFile = resolve(filePath);
if (!existsSync(sourceFile)) {
  console.error(`文件不存在: ${sourceFile}`);
  process.exit(1);
}

// --- 复制文件 ---
const destFileName = `app-${version}.zip`;
const destFile = join(RELEASE_DIR, destFileName);
copyFileSync(sourceFile, destFile);
console.log(`已复制: ${sourceFile} → ${destFile}`);

// --- 计算文件信息 ---
const fileBuffer = readFileSync(destFile);
const size = statSync(destFile).size;
const sha256 = createHash("sha256").update(fileBuffer).digest("hex");

// --- 更新 latest.json ---
const today = new Date().toISOString().split("T")[0];
const releaseInfo = {
  version,
  releaseDate: today,
  downloadUrl: `${SITE_URL}/app-release/${destFileName}`,
  changelog,
  minOsVersion: "",
  forceUpdate: false,
  size,
  sha256,
};

writeFileSync(LATEST_JSON, JSON.stringify(releaseInfo, null, 2) + "\n", "utf-8");
console.log(`已更新: ${LATEST_JSON}`);
console.log("\n--- 版本信息 ---");
console.log(JSON.stringify(releaseInfo, null, 2));
console.log("\n下一步: git add -A && git commit -m \"release v" + version + "\" && git push");
