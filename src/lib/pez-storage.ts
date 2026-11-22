import "server-only";

const bucket = "private-pez";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  }
  return { url, key, base: `${url}/storage/v1` };
}

function encodeObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function absoluteStorageUrl(value: string, base: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith("/") ? value : `/${value}`}`;
}

export async function createPezSignedUploadUrl(objectPath: string): Promise<string> {
  const { key, base } = config();
  const response = await fetch(
    `${base}/object/upload/sign/${bucket}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({}),
      cache: "no-store"
    }
  );
  const result = await response.json().catch(() => ({})) as { url?: string; signedURL?: string; token?: string; message?: string };
  if (!response.ok) {
    throw new Error(result.message || "SupabaseでアップロードURLを作成できませんでした。");
  }
  const path = result.signedURL || result.url;
  if (!path) throw new Error("SupabaseからアップロードURLが返されませんでした。");
  const signedUrl = new URL(absoluteStorageUrl(path, base));
  if (result.token && !signedUrl.searchParams.has("token")) {
    signedUrl.searchParams.set("token", result.token);
  }
  return signedUrl.toString();
}

export async function createPezSignedDownloadUrl(objectPath: string): Promise<string> {
  const { key, base } = config();
  const response = await fetch(
    `${base}/object/sign/${bucket}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ expiresIn: 60 }),
      cache: "no-store"
    }
  );
  const result = await response.json().catch(() => ({})) as { signedURL?: string; signedUrl?: string; message?: string };
  if (!response.ok) {
    throw new Error(result.message || "SupabaseからダウンロードURLを作成できませんでした。");
  }
  const path = result.signedURL || result.signedUrl;
  if (!path) throw new Error("SupabaseからダウンロードURLが返されませんでした。");
  return absoluteStorageUrl(path, base);
}
