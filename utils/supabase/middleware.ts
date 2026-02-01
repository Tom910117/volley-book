import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // 1. 建立一個 "初始" 的 Response
  // 我們稍後會把更新後的 Cookie 塞進這個 Response 裡
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
        // 讀取 Cookie (給 Supabase 驗證用)
        getAll() {
          return request.cookies.getAll();
        },
        // 寫入 Cookie (如果 Token 過期換新，這裡會被觸發)
        setAll(cookiesToSet) {
          console.log("♻️ [Middleware] 正在執行換票動作！寫入新 Cookie 中...", new Date().toISOString());
          // 這裡是最關鍵的一步！
          // 我們同時更新 "Request" (讓接下來的 page.tsx 拿到新票)
          // 也更新 "Response" (讓瀏覽器收到新票)
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

  // 2. 呼叫 getUser 來觸發 Token 驗證與自動更新
  // 如果 Token 過期，上面的 setAll 就會被執行
  const { data: { user } } = await supabase.auth.getUser();

  // 3. (選用) 簡單的路由保護
  // 如果你想讓沒登入的人連首頁都不能看，可以在這裡擋
  // 但通常我們會在 page.tsx 裡擋，這裡只負責換票
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    request.nextUrl.pathname !== "/" // 允許首頁公開
  ) {
    // 如果沒登入又想去受保護的頁面，踢回登入頁
    // const url = request.nextUrl.clone()
    // url.pathname = '/login'
    // return NextResponse.redirect(url)
  }

  return response;
}