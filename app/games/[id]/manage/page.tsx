import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ManageGameClient } from "@/app/games/[id]/manage/manage-game-client"
import { ShareGameButton } from "@/components/share-game-button"
import { CancelGameButton } from "@/components/cancel-game-button"

export default async function ManageGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. 驗證身分
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 2. 驗證主揪權限
  const { data: game } = await supabase
    .from("games")
    .select("id, title, host_id, court_id") 
    .eq("id", id)
    .single()

  if (!game || game.host_id !== user.id) {
    return <div className="p-10 text-center text-red-500 font-bold">權限不足：非本場主揪</div>
  }

  // 3. 撈取報名單與信用分數
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      user_id,
      status,
      attendance_status,
      profiles:user_id (
        display_name,
        avatar_url,
        credit_score
      )
    `)
    .eq("game_id", id)
    .in("status", ["confirmed", "waiting"]) 
    .order("created_at", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
          <Link href={`/games/${game.id}`} className="text-gray-500 hover:text-black">
            ← 返回
          </Link>
          <h1 className="font-bold text-lg truncate text-center">場次管理</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 mt-4 space-y-6">
        {/* 核心點名與結算區塊 */}
        <ManageGameClient 

          initialBookings={bookings || []} 
        />

        {/* 附加功能區塊 (補回你原本的按鈕) */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">進階操作</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">推廣球局</p>
              <ShareGameButton gameId={game.id} title={game.title} />
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-500 font-medium">危險操作</p>
              <CancelGameButton gameId={game.id} courtId={game.court_id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}