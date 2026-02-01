import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, DollarSign, ArrowLeft } from "lucide-react"
import CourtBookingUI from "@/components/court-booking-ui"

// 1. 定義資料格式 (跟首頁一樣)
type Court = {
  id: string
  name: string
  location: string
  price: number
  image_url: string
  created_at: string
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ date?: string }>
}

export default async function CourtDetailPage({ params, searchParams }: Props) {
  // 2. 拆包裹：拿到網址上的 ID,DATE
  const { id } = await params
  const { date } = await searchParams
  const dateStr = date || new Date().toISOString().split('T')[0]

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // 3. 呼叫 Supabase：去抓「這一筆」資料
  // .eq('id', id) -> 找出 id 等於網址 id 的那一行
  // .single()     -> 告訴 Supabase 我只要一筆 (回傳物件，不要陣列)
  const [courtResult, gamesResult] = await Promise.all([
    supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .single(),

    supabase
      .from("games")
      .select("*")
      .eq("court_id", id)
      .eq("date", dateStr)
])

const { data: court, error: courtError } = courtResult
const { data: existingGames, error: gamesError } = gamesResult

  // 4. 錯誤處理：如果找不到 (例如亂打 ID)
  if (courtError || !court) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-500">找不到這個球館 😭</h1>
        <p className="text-zinc-500">可能 ID 錯誤或是球館已被刪除</p>
        <Link href="/">
          <Button>回到首頁</Button>
        </Link>
      </div>
    )
  }

  const games = existingGames || []

  // 5. 成功抓到資料！顯示漂亮的詳細頁
  return (
    <main className="min-h-screen bg-white pb-20">
      
      {/* --- 頂部大圖區 --- */}
      <div className="relative w-full h-[50vh] bg-zinc-200">
        <img 
          src={court.image_url} 
          alt={court.name}
          className="w-full h-full object-cover"
        />
        {/* 返回按鈕 (浮在圖片上) */}
        <Link href="/" className="absolute top-8 left-8">
          <Button variant="secondary" size="icon" className="rounded-full shadow-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* --- 內容資訊區 --- */}
      <div className="max-w-4xl mx-auto -mt-10 relative z-10 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-zinc-100">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-zinc-900">{court.name}</h1>
              <div className="flex items-center text-zinc-500 mt-2 space-x-4">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {court.location}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  24hr 開放
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <p className="text-3xl font-bold text-zinc-900 flex items-center">
                <DollarSign className="h-6 w-6 text-zinc-400" />
                {court.price}
                <span className="text-sm text-zinc-400 font-normal ml-1">/ 小時</span>
              </p>
            </div>
          </div>

          <hr className="my-8 border-zinc-100" />

          {/* 介紹區塊 (這裡先寫死，之後可以在資料庫加 description 欄位) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">球館介紹</h2>
            <p className="text-zinc-600 leading-relaxed">
              這是一個位於 {court.location} 的優質排球場。擁有專業的木質地板與標準網高，
              適合系隊練球、友誼賽使用。現場備有飲水機與更衣室，交通便利。
            </p>
          </div>

          {/* 底部預約按鈕 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <CourtBookingUI
              courtId={court.id}
              date={dateStr}
              existingGames={games}
              userId={user?.id}
              />
          </div>

        </div>
      </div>
    </main>
  )
}