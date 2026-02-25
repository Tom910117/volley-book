"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser" // 確認你的 client 引入路徑
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import QRScanner from "@/components/qr-scanner"
import { ScanFace } from "lucide-react"
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"

// 定義一下我們接收的資料型別
type Booking = {
  id: string
  user_id: string
  status: string
  attendance_status: 'pending' | 'present' | 'late' | 'no_show'
  profiles: {
    display_name: string
    avatar_url: string | null
    credit_score: number
  }
}

export function ManageGameClient({  
  initialBookings 
}: { 
  initialBookings: any[] // 這裡接 Server Component 傳來的資料
}) {
  const supabase = createClient()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>(initialBookings)
  useEffect(() => {
    setBookings(initialBookings)
  }, [initialBookings])
  const [showScanner, setShowScanner] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  // 計算有幾個人還沒點名
  const pendingCount = bookings.filter(b => b.attendance_status === 'pending').length

  // 🌟 新增：處理掃描結果
  const handleScanSuccess = async (scannedUserId: string) => {
    setShowScanner(false) // 先關閉掃描畫面

    // 1. 在名單中尋找這個人
    const targetBooking = bookings.find(b => b.user_id === scannedUserId)

    if (!targetBooking) {
      toast.error("❌ 查無此人", { description: "這個人沒有報名這場球局喔！" })
      return
    }

    if (targetBooking.attendance_status === 'present') {
      toast.warning("✅ 已報到", { description: `${targetBooking.profiles.display_name} 已經報到過了啦！` })
      return
    }

    // 2. 觸發我們原本寫好的打卡邏輯！
    toast.success(`🎉 掃描成功！`, { description: `已為 ${targetBooking.profiles.display_name} 完成報到` })
    await handleStatusChange(targetBooking.id, 'present')
  }

  // 1. 處理單一球員的狀態切換
  const handleStatusChange = async (bookingId: string, newStatus: Booking['attendance_status']) => {
    // 樂觀更新 UI (讓畫面先變，提升體驗)
    setBookings(prev => 
      prev.map(b => b.id === bookingId ? { ...b, attendance_status: newStatus } : b)
    )

    // 背景打 API 更新資料庫
    const { error } = await supabase
      .from("bookings")
      .update({ attendance_status: newStatus })
      .eq("id", bookingId)

    if (error) {
      toast.error("更新狀態失敗，請重試！")
      // 發生錯誤的話，把畫面改回原本的資料 (這裡為求簡潔先不寫 rollback)
    }else {
     router.refresh()
    }
  }

  // 2. 處理一鍵結算
  const handleSettleGame = async () => {
    setIsSettling(true)

    try {
      if (pendingCount > 0) {
        // 還有 pending 的人，批次把他們改成 present
        const pendingBookingIds = bookings
          .filter(b => b.attendance_status === 'pending')
          .map(b => b.id)

        const { error } = await supabase
          .from("bookings")
          .update({ attendance_status: 'present' })
          .in("id", pendingBookingIds)

        if (error) throw error

        // 更新前端畫面
        setBookings(prev => 
          prev.map(b => b.attendance_status === 'pending' ? { ...b, attendance_status: 'present' } : b)
        )
        toast.success(`已將剩餘 ${pendingCount} 人設為出席，結算完成！🎉`)
      } else {
        toast.success("所有人員皆已點名，結算完成！🎉")
      }
      router.refresh()
      // 未來你可以在 games 表加一個 is_settled 欄位，在這裡把它 update 成 true
      
    } catch (error: any) {
      toast.error("結算失敗：" + error.message)
    } finally {
      setIsSettling(false)
    }
  }

  return (
    <div className="space-y-6">
        
       {/* 🌟 啟動掃描器的大按鈕 */}
        <button
            onClick={() => setShowScanner(true)}
            className="w-full bg-zinc-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition active:scale-95"
        >
            <ScanFace className="w-6 h-6" /> 
            開啟相機掃描報到
        </button>

        {/* ... (原本的結算狀態卡片) ... */}
        {/* ... (原本的名單列表) ... */}

        {/* 🌟 掃描器彈窗 (只有 showScanner 為 true 時才出現) */}
        {showScanner && (
            <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setShowScanner(false)} 
            />
        )}
      
      {/* 結算狀態卡片 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">出席狀況</h2>
          <p className="text-sm text-gray-500">
            {pendingCount === 0 
              ? "✅ 全員點名完畢" 
              : `⚠️ 還有 ${pendingCount} 人未確認`}
          </p>
        </div>
        <button
          onClick={handleSettleGame}
          disabled={isSettling}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors ${
            pendingCount === 0 
              ? "bg-green-100 text-green-700 hover:bg-green-200" 
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSettling && <Loader2 className="w-4 h-4 animate-spin" />}
          {pendingCount === 0 ? "已結算" : "一鍵結算 (剩餘設為出席)"}
        </button>
      </div>

      {/* 名單列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {bookings.map((booking, index) => {
          const profile = booking.profiles || {}
          const name = profile.display_name || "未知球友"
          const score = profile.credit_score ?? 100

          return (
            <div 
              key={booking.id} 
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b last:border-0 ${
                booking.attendance_status === 'no_show' ? 'bg-red-50' : ''
              }`}
            >
              {/* 球員資訊區 */}
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-mono w-4">{index + 1}</span>
                
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {profile.avatar_url ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`} 
                      alt={name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-gray-200">
                      {name.slice(0, 1)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-gray-900">{name}</div>
                  <div className="text-xs font-medium flex items-center gap-1">
                    <span className="text-gray-500">信用分數:</span>
                    <span className={`${
                      score >= 90 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {score}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按鈕區 */} 
              <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
                {/* 出席按鈕 */}
                <button
                  onClick={() => handleStatusChange(booking.id, 'present')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    booking.attendance_status === 'present'
                      ? "bg-white text-green-600 shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">出席</span>
                </button>

                {/* 遲到按鈕 */}
                <button
                  onClick={() => handleStatusChange(booking.id, 'late')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    booking.attendance_status === 'late'
                      ? "bg-white text-yellow-600 shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">遲到</span>
                </button>

                {/* 放鳥按鈕 */}
                <button
                  onClick={() => handleStatusChange(booking.id, 'no_show')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    booking.attendance_status === 'no_show'
                      ? "bg-red-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-red-600 hover:bg-gray-200"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">放鳥</span>
                </button>
              </div>

            </div>
          )
        })}

        {bookings.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            目前還沒有人報名這場球局
          </div>
        )}
      </div>

    </div>
  )
}