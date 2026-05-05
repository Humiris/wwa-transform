"""
Agentizer Python SDK
https://codiris.app/skills

Usage:

    from agentizer import Agentizer

    client = Agentizer(api_key="sk-agz_...")
    site = client.transform("https://stripe.com", deploy=True, wait_for_deploy=True)
    print(site.url, site.mcp, site.tools)

Requires Python 3.8+. Uses urllib from the standard library — no external
dependencies required. (If you have `requests` installed it'll be used
automatically for slightly better connection pooling, otherwise urllib
is the fallback.)
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Optional, Union

try:
    import requests as _requests  # type: ignore[import-not-found]
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

import urllib.error
import urllib.parse
import urllib.request


class AgentizerError(Exception):
    """Raised when the API returns an error or a job fails to complete."""

    def __init__(self, message: str, status: Optional[int] = None, body: Any = None):
        super().__init__(message)
        self.status = status
        self.body = body


@dataclass
class SiteResult:
    """A successfully deployed (or already-deployed) Agentizer brand."""
    name: str
    slug: str
    tools: int
    url: str
    mcp: str
    cached: bool = False


@dataclass
class BrandPreview:
    """A preview of a brand before any deploy (deploy=False)."""
    name: str
    slug: str
    color: str
    domain: str
    favicon: Optional[str] = None
    theme: str = "light"


@dataclass
class JobStatus:
    """The current state of an async deploy job."""
    id: str
    url: str
    slug: str
    status: str  # queued | running | succeeded | failed
    progress: Optional[str] = None
    result: Optional[SiteResult] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    finished_at: Optional[str] = None
    github_run_id: Optional[int] = None
    poll_again_after_seconds: int = 10
    raw: dict = field(default_factory=dict)


class Agentizer:
    """Client for the Agentizer transform API at wwa.codiris.app."""

    def __init__(self, api_key: str, base_url: str = "https://wwa.codiris.app"):
        if not api_key:
            raise AgentizerError("api_key is required")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def transform(
        self,
        url: str,
        deploy: bool = False,
        wait_for_deploy: bool = False,
        poll_interval_seconds: int = 10,
        timeout_seconds: int = 600,
    ) -> Union[SiteResult, BrandPreview]:
        """
        Transform a website.

        Args:
            url: Target website URL.
            deploy: If True, queue a real deploy. If False, return a preview only.
            wait_for_deploy: If True and the API queues a job, poll until done
                and return the final SiteResult.
            poll_interval_seconds: Polling cadence when waiting.
            timeout_seconds: Max wait time before raising AgentizerError.

        Returns:
            SiteResult — when the brand is cached or fully deployed.
            BrandPreview — when deploy=False.

        Raises:
            AgentizerError on auth failure, validation failure, deploy failure,
            or timeout.
        """
        body = self._post("/api/agentizer/transform", {"url": url, "deploy": deploy})
        status = body.get("status")

        if status == "success":
            site = body["site"]
            return SiteResult(
                name=site["name"],
                slug=site["slug"],
                tools=site["tools"],
                url=site["url"],
                mcp=site["mcp"],
                cached=body.get("cached", False),
            )

        if status == "preview":
            brand = body["brand"]
            return BrandPreview(
                name=brand["name"],
                slug=brand["slug"],
                color=brand["color"],
                domain=brand["domain"],
                favicon=brand.get("favicon"),
                theme=brand.get("theme", "light"),
            )

        if status == "queued":
            if not wait_for_deploy:
                raise AgentizerError(
                    f"Deploy queued (job_id {body['job_id']}). "
                    f"Set wait_for_deploy=True to block, or poll {body['poll_url']} manually.",
                    status=202,
                    body=body,
                )
            return self._wait_for_job(body["job_id"], poll_interval_seconds, timeout_seconds)

        raise AgentizerError(f"Unknown status from API: {status}", body=body)

    def get_job(self, job_id: str) -> JobStatus:
        """Look up the current state of a deploy job."""
        url = f"{self.base_url}/api/agentizer/jobs/{urllib.parse.quote(job_id)}"
        body = self._http_get(url)
        result = None
        if body.get("result"):
            r = body["result"]
            result = SiteResult(
                name=r["name"],
                slug=r["slug"],
                tools=r["tools"],
                url=r["url"],
                mcp=r["mcp"],
            )
        return JobStatus(
            id=body["id"],
            url=body["url"],
            slug=body["slug"],
            status=body["status"],
            progress=body.get("progress"),
            result=result,
            error=body.get("error"),
            created_at=body.get("created_at"),
            updated_at=body.get("updated_at"),
            finished_at=body.get("finished_at"),
            github_run_id=body.get("github_run_id"),
            poll_again_after_seconds=body.get("poll_again_after_seconds", 10),
            raw=body,
        )

    # ----- internals --------------------------------------------------------

    def _wait_for_job(self, job_id: str, interval: int, timeout: int) -> SiteResult:
        deadline = time.time() + timeout
        while time.time() < deadline:
            job = self.get_job(job_id)
            if job.status == "succeeded" and job.result:
                return job.result
            if job.status == "failed":
                raise AgentizerError(job.error or "Deploy failed", status=500, body=job.raw)
            time.sleep(job.poll_again_after_seconds or interval)
        raise AgentizerError(f"Job {job_id} did not finish within {timeout}s", status=408)

    def _post(self, path: str, payload: dict) -> dict:
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }
        if _HAS_REQUESTS:
            res = _requests.post(url, headers=headers, json=payload, timeout=30)
            try:
                body = res.json()
            except ValueError:
                body = {"error": f"Non-JSON response: {res.text[:200]}"}
            if not res.ok:
                raise AgentizerError(body.get("error", f"HTTP {res.status_code}"), status=res.status_code, body=body)
            return body
        # urllib fallback
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                body = json.loads(e.read().decode("utf-8"))
            except Exception:
                body = {"error": str(e)}
            raise AgentizerError(body.get("error", f"HTTP {e.code}"), status=e.code, body=body) from e

    def _http_get(self, url: str) -> dict:
        if _HAS_REQUESTS:
            res = _requests.get(url, timeout=30)
            body = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}
            if not res.ok:
                raise AgentizerError(body.get("error", f"HTTP {res.status_code}"), status=res.status_code, body=body)
            return body
        req = urllib.request.Request(url, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                body = json.loads(e.read().decode("utf-8"))
            except Exception:
                body = {"error": str(e)}
            raise AgentizerError(body.get("error", f"HTTP {e.code}"), status=e.code, body=body) from e


def agentize(
    api_key: str,
    url: str,
    deploy: bool = False,
    wait_for_deploy: bool = False,
    poll_interval_seconds: int = 10,
    timeout_seconds: int = 600,
) -> Union[SiteResult, BrandPreview]:
    """One-shot helper. Equivalent to Agentizer(api_key).transform(...)."""
    return Agentizer(api_key=api_key).transform(
        url,
        deploy=deploy,
        wait_for_deploy=wait_for_deploy,
        poll_interval_seconds=poll_interval_seconds,
        timeout_seconds=timeout_seconds,
    )


__all__ = ["Agentizer", "AgentizerError", "SiteResult", "BrandPreview", "JobStatus", "agentize"]
