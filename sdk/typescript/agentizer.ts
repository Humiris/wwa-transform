/**
 * Agentizer TypeScript SDK
 * https://codiris.app/skills
 *
 * Usage:
 *
 *   import { Agentizer } from './agentizer';
 *
 *   const client = new Agentizer({ apiKey: 'sk-agz_...' });
 *
 *   // Idempotent: returns cached result for known brands, or queues a fresh
 *   // deploy and polls until completion (3-5 min).
 *   const site = await client.transform('https://stripe.com', { deploy: true, waitForDeploy: true });
 *   console.log(site.url, site.mcp, site.tools);
 *
 * Zero runtime dependencies — works in Node 18+ and any modern browser.
 */

export interface AgentizerOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface SiteResult {
  name: string;
  slug: string;
  tools: number;
  url: string;
  mcp: string;
}

export interface BrandPreview {
  name: string;
  slug: string;
  color: string;
  domain: string;
  favicon: string | null;
  theme: 'light' | 'dark' | 'mixed';
}

export interface QueuedResponse {
  status: 'queued';
  job_id: string;
  poll_url: string;
  estimated_seconds: number;
  fallback_cli: string;
  persisted: boolean;
  dispatched: boolean;
}

export interface SuccessResponse {
  status: 'success';
  site: SiteResult;
  cached: boolean;
}

export interface PreviewResponse {
  status: 'preview';
  brand: BrandPreview;
  note?: string;
}

export type TransformResponse = SuccessResponse | PreviewResponse | QueuedResponse;

export interface JobStatus {
  id: string;
  url: string;
  slug: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: string;
  result?: SiteResult;
  error?: string;
  created_at: string;
  updated_at: string;
  finished_at?: string;
  github_run_id?: number;
  poll_again_after_seconds?: number;
}

export interface TransformOptions {
  /** If true, queue a real deploy. If false (default), return a brand preview only. */
  deploy?: boolean;
  /** If true and the API returns 'queued', poll the job endpoint until it completes. Default false. */
  waitForDeploy?: boolean;
  /** Poll interval in ms when waitForDeploy=true. Default 10000 (10s). */
  pollIntervalMs?: number;
  /** Timeout in ms when waitForDeploy=true. Default 600000 (10min). */
  timeoutMs?: number;
}

export class AgentizerError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = 'AgentizerError';
  }
}

export class Agentizer {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: AgentizerOptions) {
    if (!opts.apiKey) throw new AgentizerError('apiKey is required');
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? 'https://wwa.codiris.app').replace(/\/$/, '');
  }

  /**
   * Transform a website. Returns immediately for cached brands, returns a
   * preview for deploy:false, or queues a deploy job for deploy:true.
   *
   * If options.waitForDeploy is true and the API queues a job, this will
   * poll until the job succeeds or fails, returning the final SiteResult.
   */
  async transform(url: string, options: TransformOptions = {}): Promise<SiteResult | BrandPreview> {
    const { deploy = false, waitForDeploy = false, pollIntervalMs = 10_000, timeoutMs = 600_000 } = options;

    const res = await this._post('/api/agentizer/transform', { url, deploy });
    const body = (await res.json()) as TransformResponse;

    if (!res.ok) {
      throw new AgentizerError(
        (body as { error?: string }).error ?? `Transform failed: HTTP ${res.status}`,
        res.status,
        body
      );
    }

    if (body.status === 'success') return body.site;
    if (body.status === 'preview') return body.brand;

    // status === 'queued'
    if (!waitForDeploy) {
      // Return the preview shape with extra fields callers can read
      throw new AgentizerError(
        `Deploy queued (job_id ${body.job_id}). Set { waitForDeploy: true } to wait, or poll ${body.poll_url} manually.`,
        202,
        body
      );
    }

    return this._waitForJob(body.job_id, pollIntervalMs, timeoutMs);
  }

  /** Look up the current state of a deploy job. */
  async getJob(jobId: string): Promise<JobStatus> {
    const res = await fetch(`${this.baseUrl}/api/agentizer/jobs/${encodeURIComponent(jobId)}`);
    const body = (await res.json()) as JobStatus | { error?: string };
    if (!res.ok) {
      throw new AgentizerError(
        (body as { error?: string }).error ?? `Job lookup failed: HTTP ${res.status}`,
        res.status,
        body
      );
    }
    return body as JobStatus;
  }

  // ----- internals ------------------------------------------------------

  private async _post(path: string, body: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  }

  private async _waitForJob(jobId: string, intervalMs: number, timeoutMs: number): Promise<SiteResult> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const job = await this.getJob(jobId);
      if (job.status === 'succeeded' && job.result) return job.result;
      if (job.status === 'failed') {
        throw new AgentizerError(job.error ?? 'Deploy failed', 500, job);
      }
      const waitMs = (job.poll_again_after_seconds ?? intervalMs / 1000) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    throw new AgentizerError(`Job ${jobId} did not finish within ${timeoutMs}ms`, 408);
  }
}

// Convenience: one-shot helper for callers who don't want a class instance
export async function agentize(
  apiKey: string,
  url: string,
  options?: TransformOptions
): Promise<SiteResult | BrandPreview> {
  return new Agentizer({ apiKey }).transform(url, options);
}
