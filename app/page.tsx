"use client"

import * as React from "react"
import { format } from "date-fns"
// 🔥 補上 Trophy, CircleDollarSign 等圖示
import { Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight, Building2, Trophy, CircleDollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// 🔥 引入你寫好的超強大腦
import { getGameStatus } from "@/lib/game-status-utils"

// 型別定義補充完整
type Game = {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  price: number
  level: string
  min_players: number
  max_players: number
  status: string
  signup_deadline: string
  is_public: boolean
  host_id: string
  courts: { name: string; location: string; image_url: string | null }
  // 用來接收 Supabase 計算的報名人數
  bookings?: { count: number }[] 
  // 給 getGameStatus 用的輔助屬性
  current_players?: number 
}

type Court = {
  id: string
  name: string
  location: string
  price: number
  image_url: string
}

// 狀態顏色對應表 (Tailwind 需要完整字串才不會被 Purge 掉)
const statusColorMap = {
  green: "bg-emerald-500 text-white",
  yellow: "bg-amber-500 text-white",
  red: "bg-rose-500 text-white",
  gray: "bg-zinc-500 text-white",
  blue: "bg-blue-500 text-white"
}

export default function Home() {
  const supabase = createClient()
  
  const [mode, setMode] = React.useState<"games" | "courts">("games")
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [location, setLocation] = React.useState<string>("")
  const [games, setGames] = React.useState<Game[]>([])
  const [courts, setCourts] = React.useState<Court[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // 抓取球局 (Mode: games)
  const fetchGames = React.useCallback(async (searchLoc?: string, searchDate?: Date) => {
    setIsLoading(true)
    try {
      // 🔥 查詢加上 bookings(count)，讓資料庫幫我們算出目前報名人數
      let query = supabase
        .from('games')
        .select(`
          *, 
          courts!inner(name, location, image_url),
          bookings(count)
        `)
        .eq('is_public', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (searchLoc && searchLoc !== "all") query = query.eq('courts.location', searchLoc)
      if (searchDate) {
        query = query.eq('date', format(searchDate, "yyyy-MM-dd"))
      } else {
        query = query.gte('date', format(new Date(), "yyyy-MM-dd"))
      }

      const { data } = await query
      
      if (data) {
        // 🔥 資料預處理與過濾
        const processedGames = data.map((game: any) => {
          // 1. 先把真正的數字拿出來
          const count = game.bookings?.[0]?.count || 0
          
          // 2. 🔥 核心修正：用解構賦值把 bookings 抽離出來丟掉，把剩下的屬性裝進 rest
          const { bookings, ...rest } = game
          
          // 3. 回傳乾淨的物件，強迫 getGameStatus 去讀 current_players
          return { ...rest, current_players: count }
        }).filter((game: Game) => {
          // 呼叫大腦判定狀態
          const status = getGameStatus(game)
          
          const isHidden = ["已結束", "已取消", "流局", "報名截止"].some(keyword => status.label.includes(keyword))
          
          return !isHidden
        })

        setGames(processedGames)
      }
      
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const fetchCourts = React.useCallback(async (searchLoc?: string) => {
    setIsLoading(true)
    try {
      let query = supabase.from('courts').select('*')
      if (searchLoc && searchLoc !== "all") query = query.eq('location', searchLoc)
      const { data } = await query
      if (data) setCourts(data)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  React.useEffect(() => {
    if (mode === "games") fetchGames(location, date)
    else fetchCourts(location)
  }, [mode, fetchGames, fetchCourts])

  const handleSearch = () => {
    if (mode === "games") fetchGames(location, date)
    else fetchCourts(location)
  }

  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")

  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-20 bg-zinc-50 space-y-8 pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          VolleyBook 排球揪團
        </h1>
        <p className="text-zinc-500">
          找到最適合你們隊伍的戰場
        </p>
      </div>

      <div className="flex bg-zinc-200/50 p-1.5 rounded-xl shadow-inner w-fit mx-auto relative z-10">
        <button 
          onClick={() => setMode("games")}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300", mode === "games" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Users className="w-4 h-4" /> 找球局 (加入別人)
        </button>
        <button 
          onClick={() => setMode("courts")}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300", mode === "courts" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Building2 className="w-4 h-4" /> 找場地 (自己開團)
        </button>
      </div>

      <div className="flex w-fit items-center p-2 border rounded-xl shadow-lg bg-white/50 backdrop-blur-sm divide-x divide-zinc-200">
        <div className="px-4">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[140px] border-0 shadow-none focus:ring-0 px-0 text-base bg-transparent">
              <SelectValue placeholder="選擇球館" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有球館</SelectItem>
              <SelectItem value="taipei-gym">台北體育館</SelectItem>
              <SelectItem value="fju-gym">輔大中美堂</SelectItem>
              <SelectItem value="ntu-gym">台大體育館</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="px-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"ghost"} className={cn("w-[160px] justify-start text-left font-normal border-0 shadow-none hover:bg-transparent px-0 text-base", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "yyyy-MM-dd") : <span>選擇日期</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="pl-4 pr-1">
          <Button className="bg-zinc-900 text-white hover:bg-zinc-700 px-6 rounded-lg" onClick={handleSearch}>
            搜尋
          </Button>
        </div>
      </div>

      <div className="w-full max-w-6xl px-4 mt-8">
        {isLoading ? (
          <div className="text-center py-20 text-zinc-400 animate-pulse">讀取中...</div>
        ) : mode === "games" ? (
          games.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => {
                // 🧠 再次呼叫大腦取得這局的專屬狀態與顏色
                const status = getGameStatus(game)
                const statusBg = statusColorMap[status.color] || "bg-zinc-500 text-white"

                return (
                  <Link href={`/games/${game.id}`} key={game.id} className="group block h-full">
                    <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      
                      <div className="h-44 bg-zinc-200 relative overflow-hidden">
                        <img src={game.courts.image_url || "/court_placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />
                        
                        <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-md text-xs font-bold text-zinc-900 shadow-sm flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />{game.date}
                        </div>
                        
                        {/* 🔥 動態渲染 getGameStatus 給的標籤與顏色 */}
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${statusBg}`}>
                          {status.label}
                        </div>

                        <div className="absolute bottom-3 left-4 text-white font-medium flex items-center gap-1.5 text-sm shadow-sm">
                          <MapPin className="w-3.5 h-3.5" />{game.courts.name}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-1 gap-3">
                        <h3 className="font-bold text-lg text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {game.title}
                        </h3>

                        {/* 🔥 完整移植 court-booking-ui 的精美屬性標籤 */}
                        <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-zinc-100">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            <Clock className="w-3 h-3" />
                            {game.start_time.slice(0, 5)} - {game.end_time.slice(0, 5)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700">
                            <Trophy className="w-3 h-3" />
                            {game.level || "歡樂"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CircleDollarSign className="w-3 h-3" />
                            {game.price > 0 ? `$${game.price}` : "免費"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                            <Users className="w-3 h-3" />
                            {game.current_players} / {game.max_players || 12}
                          </span>
                        </div>
                      </div>

                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">這個日期目前沒有公開球局，切換到「找場地」自己開一團吧！</div>
          )
        ) : (
          /* ... 模式 B (找場地) 維持不變 ... */
          courts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <Link href={`/courts/${court.id}?date=${dateStr}`} key={court.id} className="group block h-full">
                  <div className="relative flex flex-col h-full bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-44 bg-zinc-200 relative overflow-hidden">
                      <img src={court.image_url || "/court_placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                      <div className="absolute top-3 right-3 bg-zinc-900 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> 預約 {dateStr}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1 gap-2">
                      <h3 className="font-bold text-xl text-zinc-900">{court.name}</h3>
                      <div className="flex items-center gap-1 text-zinc-500 text-sm">
                        <MapPin className="w-4 h-4" />{court.location}
                      </div>
                      <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center text-zinc-900 font-bold">
                        <span>${court.price} / 小時</span>
                        <span className="text-blue-600 text-sm font-medium flex items-center gap-1">
                          查看時段 <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">找不到符合條件的場館。</div>
          )
        )}
      </div>
    </main>
  )
}