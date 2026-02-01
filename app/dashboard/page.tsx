import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { CancelBookingButton } from "@/components/cancel-booking-button"
import Link from "next/link"
import { formatTime } from "@/lib/time-utils"
import { MapPin, Calendar, Clock, Trophy, History, PlayCircle } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. 先確認使用者
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // 2. 撈取資料 (一次撈回所有資料，在透過 JS 分類，減少 DB 請求)
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      courts (
        name,
        location,
        image_url
      ),
      games (
        id, title, max_players, current_players, level,
        start_time, end_time, date, status, min_players
      )
    `)
    .eq("user_id", user.id)
    
  // 3. 分類邏輯 (Classification Logic)
  // 取得今日日期字串 (YYYY-MM-DD) 用於比較
  const todayStr = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'Asia/Taipei' 
  });

  const allBookings = bookings || []

  // A. 即將到來：日期 >= 今天
  const upcomingBookings = allBookings
    .filter((b) => b.date >= todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // 越近的越上面 (ASC)

  // B. 歷史紀錄：日期 < 今天
  const pastBookings = allBookings
    .filter((b) => b.date < todayStr)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 越新的歷史越上面 (DESC)

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-screen pb-20 bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">我的球局 📅</h1>
        <p className="text-gray-500">管理您的預約與候補狀態</p>
      </div>

      {allBookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-10">
          
          {/* 區塊 1: 即將到來的球局 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">即將開始</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {upcomingBookings.length}
              </span>
            </div>
            
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isPast={false} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                目前沒有即將到來的球局
              </div>
            )}
          </section>

          {/* 區塊 2: 歷史紀錄 */}
          {pastBookings.length > 0 && (
            <section className="opacity-75 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-600">歷史紀錄</h2>
              </div>
              
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isPast={true} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

// ✨ 元件：單張球局卡片 (抽離出來，讓主程式碼更乾淨)
function BookingCard({ booking, isPast }: { booking: any, isPast: boolean }) {
  // 連結目標
  const gameLink = `/games/${booking.games?.id || booking.game_id}`

  return (
    <div className={`
      group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden 
      flex flex-col md:flex-row relative transition-all duration-200
      ${isPast ? "grayscale-[0.3]" : "hover:shadow-md"}
    `}>
      {/* 點擊區域 */}
      <Link href={gameLink} className="flex-1 flex flex-col md:flex-row gap-4 p-4 text-left">
        
        {/* 1. 圖片區 */}
        <div className="w-full md:w-32 h-32 md:h-auto rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 relative">
          <img 
            src={booking.courts?.image_url || "/placeholder.jpg"} 
            alt={booking.courts?.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute top-2 left-2 md:hidden">
             <StatusBadge status={booking.status} isPast={isPast} />
          </div>
        </div>
        
        {/* 2. 資訊區 */}
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {booking.games?.title || booking.courts?.name}
              </h3>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {booking.courts?.name} ({booking.courts?.location})
              </div>
            </div>
            <div className="hidden md:block">
              <StatusBadge status={booking.status} isPast={isPast} />
            </div>
          </div>

          {/* 詳細資訊 Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>{booking.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>程度: {booking.games?.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">👥 {booking.games?.current_players}</span>
              <span className="text-gray-400">/ {booking.games?.max_players} 人</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 3. 按鈕區 (如果是歷史紀錄，通常不顯示取消按鈕，或顯示"已結束") */}
      {!isPast && (
        <div className="p-4 border-t md:border-t-0 md:border-l border-gray-100 flex items-center justify-center bg-gray-50 md:bg-white md:w-32 flex-shrink-0">
          <CancelBookingButton bookingId={booking.id} />
        </div>
      )}
    </div>
  )
}

// ✨ 元件：狀態標籤
function StatusBadge({ status, isPast }: { status: string, isPast: boolean }) {
  if (isPast) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold border bg-gray-100 text-gray-500 border-gray-200">
        🏁 已結束
      </span>
    )
  }

  const isConfirmed = status === "confirmed"
  return (
    <span className={`
      px-3 py-1 rounded-full text-sm font-bold border
      ${isConfirmed 
        ? "bg-green-100 text-green-700 border-green-200" 
        : "bg-orange-100 text-orange-700 border-orange-200 animate-pulse"
      }
    `}>
      {isConfirmed ? "✅ 正取" : "⏳ 候補中"}
    </span>
  )
}

// ✨ 元件：空狀態
function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="text-5xl mb-4">🏐</div>
      <p className="text-gray-400 text-lg mb-4">目前沒有任何預約紀錄</p>
      <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
        趕快去報名一場吧！
      </Link>
    </div>
  )
}