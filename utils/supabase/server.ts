// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 1. 這裡要改成 async function
export async function createClient() {
  // 2. 這裡要加上 await (這是 Next.js 15 的新規定)
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 在 Server Component (如 page.tsx) 中無法設定 Cookie 是正常的
            // 這個 try/catch 會忽略該錯誤，防止程式崩潰
            console.error("\n🚨 抓到了！Server Component 試圖寫入 Cookie 失敗：", error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error("\n🚨 抓到了！Server Component 試圖刪除 Cookie 失敗：", error)
          }
        },
      },
    }
  )
}