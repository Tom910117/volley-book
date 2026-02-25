import Link from "next/link"
import { Dumbbell } from "lucide-react"
import { createClient } from "@/utils/supabase/server" // ⚠️ 注意：引用 Server 版的 createClient
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav" // 引入剛剛做好的 Client Component

export async function Navbar() {
  const supabase = await createClient()

  // 1. 在 Server 端一次把 User 抓出來
  const { data: { user } } = await supabase.auth.getUser()

  let finalAvatarUrl = user?.user_metadata?.avatar_url || null
  let hasHosted = false

  // 2. 如果有登入，順便去 Profile 查有沒有自訂頭像
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    // 3. 如果有自訂頭像，算出公開網址
    if (profile?.avatar_url) {
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(profile.avatar_url)
      
      // 加上時間戳記避免快取 (這裡用 Server 時間，夠用了)
      finalAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`
    }

    // 查詢是否當過主揪 (只取數量，不抓實際資料)
    const { count } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id)
 
    if (count && count > 0) {
      hasHosted = true
    }
  }

  return (
    <nav className="border-b bg-white/75 backdrop-blur-lg fixed top-0 w-full z-50">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto justify-between">
        
        {/* Logo (純靜態連結，Server Component 處理很輕鬆) */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900">
          <Dumbbell className="h-6 w-6" />
          <span>VolleyBook</span>
        </Link>

        {/* 右側按鈕區 */}
        <div className="flex items-center gap-4">
          {user ? (
            // 🔥 把算好的資料當成 Props 傳給 UserNav (Client Component)
            <UserNav 
              user={user} 
              email={user.email || null} 
              avatarUrl={finalAvatarUrl}
              hasHosted={hasHosted}
            />
          ) : (
            // 未登入狀態的按鈕
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="ghost">登入</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
                  免費註冊
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}