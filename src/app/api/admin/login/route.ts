import { NextRequest, NextResponse } from "next/server";
import { adminCookie, createAdminSession } from "@/lib/admin-auth";
import { timingSafeEqual } from "node:crypto";

export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "管理者認証が設定されていません。" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const submitted = typeof body?.password === "string" ? body.password : "";
  const a = Buffer.from(submitted);
  const b = Buffer.from(password);
  const valid = a.length === b.length && timingSafeEqual(a, b);

  if (!valid) return NextResponse.json({ error: "パスワードが正しくありません。" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie.name, createAdminSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminCookie.maxAge
  });
  return response;
}