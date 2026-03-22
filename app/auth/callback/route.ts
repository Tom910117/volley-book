import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  // 1. 抓取網址上的 code 參數 (就像去信箱拿信)
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 如果網址上有 "next" 參數，驗證完就跳去那 (預設跳回首頁 /)
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // 2. 建立一個 Server 端的 Supabase 客戶端
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // 【修正區塊】將 get/set/remove 替換為最新的 getAll/setAll
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // 捕捉錯誤：如果在不允許寫入 Header 的環境 (如 Server Component 渲染期間)
              // 觸發了 setAll，這個 catch 可以防止應用程式崩潰。
              // 在 Route Handler 這裡通常能正常寫入，但加上 try-catch 是官方建議的最佳實踐。
            }
          },
        },
      }
    )
    
    // 3. 關鍵動作：拿 code 去跟 Supabase 換取真正的 Session (登入狀態)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 4. 換到了！幫使用者轉址回首頁 (或是他原本想去的地方)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // 如果失敗，轉址到錯誤頁面
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}