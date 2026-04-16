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

  // Step 2: Deploy to Vercel
  console.log("    Deploying to Vercel...");
  try {
    const output = execSync("npx vercel --prod --yes", {
      cwd: projectDir,
      stdio: "pipe",
      env: { ...process.env },
    }).toString();
    console.log(`    ${output.trim().split("\n").pop()}`);
  } catch (e: any) {
    console.error("    Vercel deploy failed:", e.message);
    throw e;
  }

  // Step 3: Set env vars
  const envVars = ["OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"];
  for (const key of envVars) {
    if (process.env[key]) {
      try {
        execSync(`echo "${process.env[key]}" | npx vercel env add ${key} production --force`, {
          cwd: projectDir, stdio: "pipe",
        });
      } catch { /* ignore if already set */ }
    }
  }

  // Redeploy with env vars
  try {
    execSync("npx vercel --prod --yes", { cwd: projectDir, stdio: "pipe" });
  } catch { /* best effort */ }

  // Step 4: Cloudflare DNS
  if (process.env.CLOUDFLARE_API_TOKEN) {
    console.log("    Setting up DNS...");
    try {
      const zones = await cloudflareApi("GET", "/zones?name=codiris.app");
      const zoneId = zones?.result?.[0]?.id;

      if (zoneId) {
        await cloudflareApi("POST", `/zones/${zoneId}/dns_records`, {
          type: "CNAME",
          name: `wwa.${domain}`,
          content: "cname.vercel-dns.com",
          proxied: false,
          ttl: 1,
        });

        execSync(`npx vercel domains add wwa.${domain}.codiris.app`, {
          cwd: projectDir, stdio: "pipe",
        });

        console.log(`    DNS: wwa.${domain}.codiris.app → configured`);
      }
    } catch (e: any) {
      console.log(`    DNS setup warning: ${e.message}`);
    }
  } else {
    console.log("    Skipping DNS (CLOUDFLARE_API_TOKEN not set)");
  }

  console.log(`\n    Live at: https://wwa.${domain}.codiris.app`);
}
