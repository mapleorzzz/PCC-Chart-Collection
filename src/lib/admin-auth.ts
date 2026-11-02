import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pcc_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function signature(value: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createAdminSession() {
  const payload = String(Date.now() + MAX_AGE * 1000);
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminSession(value?: string) {
  if (!value) return false;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied || !/^\d+$/.test(payload)) return false;
  if (Number(payload) < Date.now()) return false;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return verifyAdminSession(jar.get(COOKIE_NAME)?.value);
}

export const adminCookie = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE
};