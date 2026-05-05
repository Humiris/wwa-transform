#!/usr/bin/env node
/**
 * Agentizer CLI entrypoint — thin wrapper that defers to the actual
 * implementation in ./cli/dist. Exists at the repo root so users can run
 *
 *   npx github:Humiris/wwa-transform <url>
 *
 * without needing to know about the workspace layout. The root
 * package.json has `prepare` that builds cli/dist on install, so this
 * just exists by the time we're invoked.
 */
const path = require("path");
const cliEntry = path.join(__dirname, "..", "cli", "dist", "index.js");
require(cliEntry);
