import { NextResponse } from "next/server";
import { createAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  const adminUser = process.env.ADMIN_USER ?? "dogg90";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "4dmin.90";

  if (username !== adminUser || password !== adminPassword) {
    return NextResponse.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}