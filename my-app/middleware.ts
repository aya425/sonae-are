import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /family にアクセスしたときだけチェック
  if (pathname.startsWith("/family")) {
    const hasAuthCookie =
      request.cookies.get("sb-access-token") ||
      request.cookies.get("supabase-auth-token");

    // 未ログインなら /login にリダイレクト
    if (!hasAuthCookie) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/family/:path*"],
};