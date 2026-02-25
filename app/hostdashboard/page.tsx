import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatTime } from "@/lib/time-utils"
import { MapPin, Calendar, Clock, Trophy, History, PlayCircle, Users, Crown, Settings } from "lucide-react"

export default async function HostDashboardPage() {
  const supabase = await createClient()

  // 1. 確認使用者
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 2. 撈取主揪開的場次 (加入 bookings(count) 計算報名人數)
  const { data: games } = await supabase
    .from("games")
    .select(`
      *,
      courts (
        name,
        location,
        image_url
      ),
      bookings(count)
    `)
    .eq("host_id", user.id)
    
  // 3. 分類邏輯 (以今天為界線)
  const todayStr = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Taipei' 
  });

  const allGames = games || []

  // A. 即將到來：日期 >= 今天
  const upcomingGames = allGames
    .filter((g) => g.date >= todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // B. 歷史紀錄：日期 < 今天
  const pastGames = allGames
    .filter((g) => g.date < todayStr)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen pb-20 bg-gray-50/50">
      <div className="mb-8 flex items-center gap-3">
        <Crown className="w-8 h-8 text-amber-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">我的開團紀錄</h1>
          <p className="text-gray-500">管理您發起的球局與報名名單</p>
        </div>
      </div>

      {allGames.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          
          {/* 區塊 1: 即將開始的開團 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">準備開打</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {upcomingGames.length}
              </span>
            </div>
            
            {upcomingGames.length > 0 ? (
              <div className="space-y-4">
                {upcomingGames.map((game) => (
                  <HostGameCard key={game.id} game={game} isPast={false} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                目前沒有即將到來的開團
              </div>
            )}
          </section>

          {/* 區塊 2: 歷史開團紀錄 */}
          {pastGames.length > 0 && (
            <section className="opacity-75 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-600">歷史成軍</h2>
              </div>
              
              <div className="space-y-4">
                {pastGames.map((game) => (
                  <HostGameCard key={game.id} game={game} isPast={true} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ✨ 元件：主揪專屬球局卡片
function HostGameCard({ game, isPast }: { game: any, isPast: boolean }) {
  // 🔥 核心修改：連結導向 manage 頁面
  const manageLink = `/games/${game.id}/manage`
  
  // 計算報名人數 (扣除主揪自己，或直接顯示總 count)
  const currentCount = game.bookings?.[0]?.count || 0

  return (
    <div className={`
      group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden 
      flex flex-col md:flex-row relative transition-all duration-200
      ${isPast ? "grayscale-[0.3]" : "hover:shadow-md border-blue-100"}
    `}>
      <Link href={manageLink} className="flex-1 flex flex-col md:flex-row gap-4 p-4 text-left">
        
        {/* 1. 圖片區 */}
        <div className="w-full md:w-32 h-32 md:h-auto rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 relative">
          <img 
            src={game.courts?.image_url || "/placeholder.jpg"} 
            alt={game.courts?.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute top-2 left-2 md:hidden">
             <StatusBadge isPublic={game.is_public} isPast={isPast} />
          </div>
        </div>
        
        {/* 2. 資訊區 */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-2">
                {game.title || "未命名球局"}
              </h3>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {game.courts?.name} ({game.courts?.location})
              </div>
            </div>
            <div className="hidden md:block">
              <StatusBadge isPublic={game.is_public} isPast={isPast} />
            </div>
          </div>

          {/* 詳細資訊 Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{game.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{formatTime(game.start_time)} - {formatTime(game.end_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>程度: {game.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-gray-900">{currentCount}</span>
              <span className="text-gray-400">/ {game.max_players} 人已報名</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 3. 按鈕區：改成引導去管理的視覺按鈕 */}
      <Link href={manageLink} className="border-t md:border-t-0 md:border-l border-gray-100 flex items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors md:w-32 flex-shrink-0 cursor-pointer">
        <div className="flex md:flex-col items-center justify-center gap-2 p-4 text-blue-700 font-bold text-sm w-full h-full">
          <Settings className="w-5 h-5" />
          {isPast ? "歷史結算" : "管理場次"}
        </div>
      </Link>
    </div>
  )
}

// ✨ 元件：狀態標籤 (顯示公開/私人局)
function StatusBadge({ isPublic, isPast }: { isPublic: boolean, isPast: boolean }) {
  if (isPast) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold border bg-gray-100 text-gray-500 border-gray-200">
        🏁 已結束
      </span>
    )
  }

  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-bold border
      ${isPublic 
        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
        : "bg-zinc-100 text-zinc-600 border-zinc-200"
      }
    `}>
      {isPublic ? "🌍 公開局" : "🔒 私人局"}
    </span>
  )
}

// ✨ 元件：空狀態
function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="text-5xl mb-4">👑</div>
      <p className="text-gray-400 text-lg mb-4">您尚未發起過任何球局</p>
      {/* 導向尋找場地首頁去開團 */}
      <Link href="/?mode=courts" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
        找場地開團去！
      </Link>
    </div>
  )
}