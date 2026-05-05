/**
 * Agentizer JavaScript SDK
 * https://codiris.app/skills
 *
 * Usage (Node 18+ or any modern browser):
 *
 *   const { Agentizer } = require('./agentizer');           // CommonJS
 *   import { Agentizer } from './agentizer.js';             // ESM
 *
 *   const client = new Agentizer({ apiKey: 'sk-agz_...' });
 *   const site = await client.transform('https://stripe.com', { deploy: true, waitForDeploy: true });
 *   console.log(site.url, site.mcp, site.tools);
 *
 * Zero runtime dependencies.
 */

class AgentizerError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'AgentizerError';
    this.status = status;
    this.body = body;
  }
}

class Agentizer {
  /**
   * @param {{ apiKey: string, baseUrl?: string }} opts
   */
  constructor(opts) {
    if (!opts || !opts.apiKey) throw new AgentizerError('apiKey is required');
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl || 'https://wwa.codiris.app').replace(/\/$/, '');
  }

  /**
   * Transform a website.
   *
   * Returns:
   *   - { name, slug, tools, url, mcp }   when the brand is cached or fully deployed
   *   - { name, slug, color, domain, ... } when deploy=false (preview only)
   *
   * @param {string} url
   * @param {{ deploy?: boolean, waitForDeploy?: boolean, pollIntervalMs?: number, timeoutMs?: number }} [options]
   * @returns {Promise<object>}
   */
  async transform(url, options = {}) {
    const {
      deploy = false,
      waitForDeploy = false,
      pollIntervalMs = 10_000,
      timeoutMs = 600_000,
    } = options;

    const res = await this._post('/api/agentizer/transform', { url, deploy });
    const body = await res.json();

    if (!res.ok) {
      throw new AgentizerError(body.error || `Transform failed: HTTP ${res.status}`, res.status, body);
    }

    if (body.status === 'success') return body.site;
    if (body.status === 'preview') return body.brand;

    // status === 'queued'
    if (!waitForDeploy) {
      throw new AgentizerError(
        `Deploy queued (job_id ${body.job_id}). Set { waitForDeploy: true } to wait, or poll ${body.poll_url} manually.`,
        202,
        body
      );
    }
    return this._waitForJob(body.job_id, pollIntervalMs, timeoutMs);
  }

  /** Look up the current state of a deploy job. */
  async getJob(jobId) {
    const res = await fetch(`${this.baseUrl}/api/agentizer/jobs/${encodeURIComponent(jobId)}`);
    const body = await res.json();
    if (!res.ok) {
      throw new AgentizerError(body.error || `Job lookup failed: HTTP ${res.status}`, res.status, body);
    }
    return body;
  }

  // ----- internals --------------------------------------------------------

  async _post(path, body) {
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  async _waitForJob(jobId, intervalMs, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const job = await this.getJob(jobId);
      if (job.status === 'succeeded' && job.result) return job.result;
      if (job.status === 'failed') {
        throw new AgentizerError(job.error || 'Deploy failed', 500, job);
      }
      const waitMs = (job.poll_again_after_seconds || intervalMs / 1000) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    throw new AgentizerError(`Job ${jobId} did not finish within ${timeoutMs}ms`, 408);
  }
}

/** Convenience: one-shot helper for callers who don't want a class instance. */
async function agentize(apiKey, url, options) {
  return new Agentizer({ apiKey }).transform(url, options);
}

// Dual export (CommonJS + ESM)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Agentizer, AgentizerError, agentize };
}
export { Agentizer, AgentizerError, agentize };
