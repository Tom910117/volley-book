import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 這行指令會自動偵測環境變數，並建立一個能管理 Cookie 的 Supabase 客戶端
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}