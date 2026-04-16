#!/usr/bin/env node

import { crawlWebsite } from "./crawl";
import { generateProject } from "./generate";
import { deployProject } from "./deploy";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const url = args[0];

if (!url) {
  console.log(`
  WWA Transform — Turn any website into an agent-first experience

  Usage:
    wwa-transform <website-url>              Full pipeline: crawl → generate → deploy
    wwa-transform crawl <url>                Crawl only → outputs brand-data.json
    wwa-transform generate <brand-data.json> Generate project from crawled data
    wwa-transform deploy <project-dir>       Deploy existing project

  Examples:
    wwa-transform https://stripe.com
    wwa-transform crawl https://nike.com
    wwa-transform generate ./brand-data.json
    wwa-transform deploy ~/wwa.stripe

  Environment Variables:
    OPENAI_API_KEY              Required for AI chat
    GEMINI_API_KEY              Required for AI chat
    CLOUDFLARE_API_TOKEN        Required for DNS setup
  `);
  process.exit(0);
}

async function main() {
  const command = args[0];

  if (command === "crawl") {
    const targetUrl = args[1];
    if (!targetUrl) { console.error("Usage: wwa-transform crawl <url>"); process.exit(1); }
    console.log(`Crawling ${targetUrl}...`);
    const data = await crawlWebsite(targetUrl);
    const outPath = path.join(process.cwd(), "brand-data.json");
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`Brand data saved to ${outPath}`);
    return;
  }

  if (command === "generate") {
    const dataPath = args[1];
    if (!dataPath) { console.error("Usage: wwa-transform generate <brand-data.json>"); process.exit(1); }
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    console.log(`Generating project for ${data.name}...`);
    const projectDir = await generateProject(data);
    console.log(`Project created at ${projectDir}`);
    return;
  }

  if (command === "deploy") {
    const projectDir = args[1];
    if (!projectDir) { console.error("Usage: wwa-transform deploy <project-dir>"); process.exit(1); }
    console.log(`Deploying ${projectDir}...`);
    await deployProject(projectDir);
    return;
  }

  // Full pipeline
  const targetUrl = command.startsWith("http") ? command : `https://${command}`;
  console.log(`\n  WWA Transform — Full Pipeline\n`);
  console.log(`  Target: ${targetUrl}\n`);

  // Step 1: Crawl
  console.log("  [1/3] Crawling website...");
  const brandData = await crawlWebsite(targetUrl);
  console.log(`  Found: ${brandData.name} — "${brandData.tagline}"`);
  console.log(`  Colors: ${brandData.primaryColor} / ${brandData.secondaryColor}`);
  console.log(`  Solutions: ${brandData.solutions.length} found`);
  console.log(`  Products: ${brandData.products.length} found\n`);

  // Step 2: Generate
  console.log("  [2/3] Generating project...");
  const projectDir = await generateProject(brandData);
  console.log(`  Project: ${projectDir}\n`);

  // Step 3: Deploy
  console.log("  [3/3] Deploying...");
  await deployProject(projectDir);

  console.log(`\n  Done! Your agentfront is live.\n`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
