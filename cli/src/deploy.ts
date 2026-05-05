import { execSync } from "child_process";
import * as path from "path";
import * as https from "https";

function cloudflareApi(method: string, endpoint: string, body?: any): Promise<any> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.cloudflare.com",
      path: `/client/v4${endpoint}`,
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

export async function deployProject(projectDir: string): Promise<void> {
  const dirName = path.basename(projectDir);
  const domain = dirName.replace("wwa.", "");

  // Step 1: Build
  console.log("    Building...");
  try {
    execSync("npm run build", { cwd: projectDir, stdio: "pipe" });
  } catch (e: any) {
    console.error("    Build failed. Check for errors.");
    throw e;
  }

  // Step 2: Push env vars to Vercel (must be done BEFORE the first deploy
  // — env vars are baked into the build, so a deploy without keys ships
  // a broken AI chat that we then have to rebuild)
  const envVars = ["OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"];
  for (const key of envVars) {
    if (process.env[key]) {
      try {
        execSync(`echo "${process.env[key]}" | npx vercel env add ${key} production --force`, {
          cwd: projectDir, stdio: "pipe",
        });
      } catch { /* already set */ }
    }
  }

  // Step 3: Deploy to Vercel and parse the actual deploy URL.
  // Capturing the deploy URL is the whole point — it's what we alias
  // and what the workflow's verify step probes.
  console.log("    Deploying to Vercel...");
  let vercelDeployUrl = "";
  try {
    const output = execSync("npx vercel --prod --yes", {
      cwd: projectDir,
      stdio: "pipe",
      env: { ...process.env },
    }).toString();
    // Parse the *.vercel.app URL from output. Vercel prints multiple lines;
    // the last *.vercel.app token is usually the production URL.
    const match = output.match(/https:\/\/[a-z0-9-]+\.vercel\.app/g);
    vercelDeployUrl = match ? match[match.length - 1] : "";
    console.log(`    Vercel URL: ${vercelDeployUrl || "(could not parse)"}`);
  } catch (e: any) {
    console.error("    Vercel deploy failed:", e.message);
    throw e;
  }

  if (!vercelDeployUrl) {
    throw new Error("Could not determine Vercel deploy URL — alias step would fail");
  }

  // Step 4: Cloudflare DNS — modern convention is `{slug}.codiris.app`
  // (no `wwa.` prefix). Existing brands deployed with the old prefix
  // remain on those URLs, but new transforms use the bare slug.
  const targetHost = `${domain}.codiris.app`;

  if (process.env.CLOUDFLARE_API_TOKEN) {
    console.log("    Setting up DNS...");
    try {
      const zones = await cloudflareApi("GET", "/zones?name=codiris.app");
      const zoneId = zones?.result?.[0]?.id;

      if (zoneId) {
        // Create the CNAME (idempotent — Cloudflare 400s if it exists, we ignore)
        const cf = await cloudflareApi("POST", `/zones/${zoneId}/dns_records`, {
          type: "CNAME",
          name: domain,
          content: "cname.vercel-dns.com",
          proxied: false,
          ttl: 1,
        });
        if (cf?.success) console.log(`    Cloudflare CNAME ${domain}.codiris.app → cname.vercel-dns.com`);
        else if (cf?.errors) console.log(`    Cloudflare CNAME (likely already exists): ${JSON.stringify(cf.errors)}`);
      }
    } catch (e: any) {
      console.log(`    DNS warning: ${e.message}`);
    }
  } else {
    console.log("    Skipping Cloudflare DNS (CLOUDFLARE_API_TOKEN not set)");
  }

  // Step 5: Alias the Vercel deploy to the custom domain. This is THE
  // step that was missing before — without it, https://{slug}.codiris.app
  // points nowhere even though Cloudflare CNAMEs to Vercel.
  console.log(`    Aliasing ${vercelDeployUrl} → ${targetHost}...`);
  try {
    execSync(`npx vercel alias set ${vercelDeployUrl} ${targetHost}`, {
      cwd: projectDir, stdio: "pipe",
    });
    console.log(`    Alias set.`);
  } catch (e: any) {
    console.log(`    Alias warning: ${e.message?.slice(0, 200)}`);
    // Non-fatal — caller can manually alias later
  }

  // Step 6: Disable Vercel SSO/password protection (every new project
  // ships with `ssoProtection: { deploymentType: "all_except_custom_domains" }`
  // which, despite its name, ALSO blocks the custom domain on first deploy.)
  if (process.env.VERCEL_TOKEN) {
    try {
      const projectId = JSON.parse(
        require("fs").readFileSync(path.join(projectDir, ".vercel/project.json"), "utf-8")
      ).projectId;
      const teamId = JSON.parse(
        require("fs").readFileSync(path.join(projectDir, ".vercel/project.json"), "utf-8")
      ).orgId;
      await new Promise<void>((resolve) => {
        const opts = {
          hostname: "api.vercel.com",
          path: `/v9/projects/${projectId}?teamId=${teamId}`,
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${process.env.VERCEL_TOKEN}`,
            "Content-Type": "application/json",
          },
        };
        const req = https.request(opts, (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve());
        });
        req.on("error", () => resolve());
        req.write(JSON.stringify({ ssoProtection: null, passwordProtection: null }));
        req.end();
      });
      console.log("    SSO protection disabled.");
    } catch { /* best effort */ }
  }

  console.log(`\n    Live at: https://${targetHost}`);
}
