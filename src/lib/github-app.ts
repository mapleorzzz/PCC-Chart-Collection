import "server-only";
import { createSign } from "node:crypto";

const repo = "mapleorzzz/PCC-Chart-Collection";

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export async function getGitHubAppToken() {
  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !installationId || !privateKey) {
    throw new Error("GitHub Appの環境変数（GITHUB_APP_ID / GITHUB_APP_INSTALLATION_ID / GITHUB_APP_PRIVATE_KEY）が不足しています。");
  }

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const jwt = `${unsigned}.${signer.sign(privateKey, "base64url")}`;

  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${jwt}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ permissions: { contents: "write" } }),
    cache: "no-store"
  });
  const result = await response.json().catch(() => ({})) as { token?: string; expires_at?: string; message?: string };
  if (!response.ok || !result.token) {
    throw new Error(result.message || "GitHub Appのアクセストークンを取得できませんでした。");
  }
  return { token: result.token, expiresAt: result.expires_at };
}

export async function githubAppRequest(path: string, init?: RequestInit) {
  const { token } = await getGitHubAppToken();
  return fetch(`https://api.github.com/repos/${repo}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });
}

export { repo as githubRepository };
