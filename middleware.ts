import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. 初始化 Upstash Redis 連線
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 2. 設定 Rate Limiter 規則 (Sliding Window)
// 這裡設定：同一個 IP，在 10 秒內最多只能發送 10 次請求
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  ephemeralCache: new Map(), // 可選：在 Edge 記憶體中做本地快取，進一步減少 Redis 請求
});

// 提取原有的 Session 更新邏輯
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}

// 這是 Next.js 預設匯出的 Middleware 主函式
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 3. L1 邊緣防禦：針對特定高風險路由進行 IP 限流
  // 保護 /login 防止暴力破解密碼，保護 /api/ 防止惡意腳本刷單
  if (path.startsWith("/api/") || path.startsWith("/login")) {
    // 取得使用者 IP，若無則預設為 localhost
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    
    // 向 Redis 確認該 IP 的請求額度
    const { success } = await ratelimit.limit(`ratelimit_${ip}`);

    if (!success) {
      // 在 Next.js 伺服器終端機印出日誌，方便後端觀測
      console.log(`[Rate Limit Blocked] IP: ${ip} 請求遭攔截`);

      // 額度用盡，直接在 Edge 層回傳 429 狀態碼，徹底阻斷進入後端與資料庫
      return NextResponse.json(
        { success: false, message: "請求過於頻繁，請稍後再試 (Too Many Requests)" },
        { status: 429 }
      );
    }
  }

  // 4. 若通過限流檢查，則繼續執行 Supabase Token 換發與驗證
  return await updateSession(request);
}

// 5. 設定 Matcher，避免 Middleware 攔截靜態資源 (如圖片、CSS) 消耗運算效能
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};