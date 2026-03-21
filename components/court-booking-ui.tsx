"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { CreateGameForm } from "@/components/create-game-form"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { formatTime } from "@/lib/time-utils" 
import { toast } from "sonner"
import { Clock, Users, Trophy, Lock, Plus, CircleDollarSign, UserRound } from "lucide-react"
import { getGameStatus } from "@/lib/game-status-utils"; 

type Props = {
  courtId: string
  date: string
  existingGames: any[] 
  userId: string | undefined
}

export default function CourtBookingUI({ courtId, date, existingGames, userId }: Props) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHostMode, setIsHostMode] = useState(false)

  const sortedGames = [...existingGames].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  )

  const handleOpenCreate = () => {
    if (!userId) {
      toast.error("請先登入", { description: "登入後才能搶位子喔！" })
      router.push("/login")
      return
    }
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 頂部標題列 */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
           <span className="text-2xl">📅</span> 
           <span>{date} 場次表</span>
        </h3>
        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-full border shadow-sm">
           <Switch id="host-mode" checked={isHostMode} onCheckedChange={setIsHostMode} />
           <Label htmlFor="host-mode" className="cursor-pointer font-medium text-gray-600">
             我要開團
           </Label>
        </div>
      </div>

      <div className="space-y-4">
        {sortedGames.length === 0 ? (
           <div className="text-center py-16 bg-white border-2 border-dashed border-gray-200 rounded-xl">
             <div className="text-4xl mb-3">🏐</div>
             <p className="text-gray-500 font-medium">今天還沒有人開局</p>
             <p className="text-gray-400 text-sm mt-1">打開右上角開關，搶頭香！</p>
           </div>
        ) : (
          sortedGames.map((game) => {
            // 🔥 1. 呼叫大腦：把 game 和 userId 丟進去，它會告訴我們一切
            // 如果是路人看私人局，這裡回傳的 status.disabled 就會是 true，label 會是 "🔒 私人局"
            const status = getGameStatus(game, userId);

            // 2. 純視覺判斷：雖然邏輯在 utils 處理了，但我們還是想在標題旁顯示一個小鎖頭
            const isPrivate = !game.is_public;

            return (
              <div 
                key={game.id} 
                className={`
                  group rounded-xl shadow-sm border border-gray-200 overflow-hidden 
                  flex flex-col md:flex-row relative transition-all duration-200
                  ${status.disabled ? "bg-gray-50 opacity-70 grayscale" : "bg-white hover:shadow-md"}
                `}
              >
                {/* 左側：資訊區 */}
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                        <span>{game.title}</span>

                        {!game.is_public && (
                          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                      
                        {game.host_id === userId && (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap">
                            👑 我的局
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    <div className="flex gap-2">
                      
                      {/* 核心狀態標籤 */}
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border
                        ${status.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                        ${status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : ''}
                        ${status.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                        ${status.color === 'gray' ? 'bg-gray-200 text-gray-600 border-gray-300' : ''}
                      `}>
                         {status.label}
                      </span>
                    </div>
                  </div>

                  {/* 屬性標籤 */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(game.start_time)} - {formatTime(game.end_time)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                      game.net_type === '男網' 
                        ? 'bg-indigo-50 text-indigo-700'  // 男網用靛藍色
                        : 'bg-rose-50 text-rose-700'      // 女網用玫瑰色
                    }`}>
                      <UserRound className="w-3 h-3" />
                      {game.net_type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                      <Trophy className="w-3.5 h-3.5" />
                      {game.level}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                      <CircleDollarSign className="w-3.5 h-3.5" />
                      {game.price > 0 ? `$${game.price}` : "免費"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      <Users className="w-3.5 h-3.5" />
                      {game.current_players} / {game.max_players} 人
                    </span>
                  </div>
                </div>

                {/* 右側：按鈕區 - 大幅簡化！ */}
                <div className="p-4 border-t md:border-t-0 md:border-l border-gray-100 flex items-center justify-center bg-gray-50 md:bg-white md:w-40 flex-shrink-0">
                  {status.disabled ? (
                    // 情況 A：被擋住 (包含：路人看私人局、已取消、流局)
                    // 按鈕文字直接顯示 status.label (例如 "🔒 私人局" 或 "❌ 已取消")
                    <Button disabled variant="secondary" className="w-full cursor-not-allowed text-gray-500">
                      {status.label} 
                    </Button>
                  ) : (
                    // 情況 B：可以互動 (包含：正常公開局、主揪看自己的私人局)
                    <Link href={`/games/${game.id}`} className="w-full">
                      <Button className="w-full bg-black text-white hover:bg-gray-800 shadow-sm">
                        {status.label.includes("額滿") ? "候補 / 詳情" : "🔥 報名"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isHostMode && (
        <div className="fixed bottom-6 right-6 md:static md:block z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button 
            size="lg" 
            className="w-full md:w-auto py-6 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl rounded-full md:rounded-xl flex items-center gap-2"
            onClick={handleOpenCreate}
          >
            <Plus className="w-6 h-6" />
            新增時段
          </Button>
        </div>
      )}

      <CreateGameForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        courtId={courtId}
        date={date}
        userId={userId}
        existingGames={existingGames} 
      />
    </div>
  )
}