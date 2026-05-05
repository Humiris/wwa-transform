# Agentizer SDKs

Three official SDKs for the Agentizer transform API — turn any website into a deployed AI-powered agentfront via one HTTPS call.

| Language | Folder | Install |
|---|---|---|
| TypeScript | [`typescript/`](./typescript/) | Copy `agentizer.ts` into your project, or `npm install @agentizer/sdk` (planned) |
| JavaScript (Node + browser) | [`javascript/`](./javascript/) | Copy `agentizer.js`, or `npm install agentizer-sdk` (planned) |
| Python | [`python/`](./python/) | Copy `agentizer.py`, or `pip install agentizer` (planned) |

All three are zero-dependency, work with any modern runtime (Node 18+, browsers, Python 3.8+), and share the same surface: `transform(url, options)` + `getJob(jobId)`.

---

## Quick start

### TypeScript

```ts
import { Agentizer } from './agentizer';

const client = new Agentizer({ apiKey: process.env.AGENTIZER_API_KEY! });

// Cached brand — instant
const habyt = await client.transform('https://habyt.com', { deploy: true });
console.log(habyt.url, habyt.tools);  // → https://habyt.codiris.app, 9

// Fresh brand — block until deploy completes (3–5 min)
const stripe = await client.transform('https://stripe.com', {
  deploy: true,
  waitForDeploy: true,
});
console.log(stripe.url, stripe.mcp);

// Or queue + poll yourself
const queued = await client.transform('https://notion.so', { deploy: true })
  .catch((e) => e.body);  // throws AgentizerError(202) — body has job_id

const status = await client.getJob(queued.job_id);
console.log(status.status, status.progress);
```

### JavaScript

```js
import { Agentizer } from './agentizer.js';

const client = new Agentizer({ apiKey: process.env.AGENTIZER_API_KEY });
const site = await client.transform('https://habyt.com', { deploy: true });
console.log(site.url);  // → https://habyt.codiris.app
```

### Python

```python
from agentizer import Agentizer

client = Agentizer(api_key="sk-agz_...")

# Cached brand — instant
site = client.transform("https://habyt.com", deploy=True)
print(site.url, site.tools)

# Fresh brand — block until deploy completes (3–5 min)
stripe = client.transform(
    "https://stripe.com",
    deploy=True,
    wait_for_deploy=True,
)
print(stripe.url, stripe.mcp)

# Or queue + poll yourself
try:
    client.transform("https://notion.so", deploy=True)
except AgentizerError as e:
    print(e.body["job_id"])
    job = client.get_job(e.body["job_id"])
    print(job.status, job.progress)
```

---

## API surface (shared across all 3 SDKs)

### `transform(url, options)`

Returns either a `SiteResult` (cached or fully deployed) or a `BrandPreview` (deploy:false).

| Option | Type | Default | Notes |
|---|---|---|---|
| `deploy` | bool | `false` | If `true`, queue a real deploy when not cached |
| `waitForDeploy` / `wait_for_deploy` | bool | `false` | If `true`, block + poll until the deploy job completes |
| `pollIntervalMs` / `poll_interval_seconds` | int | 10s | Polling cadence when waiting |
| `timeoutMs` / `timeout_seconds` | int | 10min | Max wait before raising error |

### `getJob(jobId)`

Returns the current `JobStatus` of a deploy job:

```
{
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress?: string;
  result?: SiteResult;
  error?: string;
  ...
}
```

---

## Error handling

All three SDKs throw / raise `AgentizerError` with `status` (HTTP code) and `body` (parsed JSON).

| Status | Meaning |
|---|---|
| 401 | Invalid or missing Bearer token |
| 400 | Bad URL (SSRF check failed, malformed) |
| 202 | Deploy queued — only thrown when `waitForDeploy=false` |
| 408 | Deploy timed out (caller's `timeoutMs`) |
| 429 | Rate limit (10 req / 5min per key) |
| 500 | Deploy failed in the worker — error message in `.body.error` |

---

## Get an API key

Email `hello@codiris.app` for a key (free during the public-beta phase). Keys look like `sk-agz_…` and grant 10 transforms / 5 minutes per key.
