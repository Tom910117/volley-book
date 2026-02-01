"use client" // 1. 宣告這是一個客戶端組件 (因為有按鈕互動)

// 2. 引入必要的工具庫
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase-browser" // 客戶端 Supabase 實例
import { useRouter } from "next/navigation" // 用來刷新頁面
import { Loader2 } from "lucide-react" // 載入中的轉圈圈圖示
import { toast } from "sonner" // 漂亮的通知工具

// 3. 定義父元件 (Page) 傳進來的參數型別
type Props = {
  gameId: string      // 球局 ID (必填)
  courtId: string     // 球館 ID (必填)
  userId?: string     // 使用者 ID (未登入可能是 undefined)
  isJoined: boolean   // 我是否已在名單內
  isFull: boolean     // 總人數是否已滿
  gameDate: string    // 比賽日期 (注意用小寫 string)
  startTime: string   // 開始時間
  endTime: string     // 結束時間
  isMaleFull?: boolean // 男生名額是否滿了 (選填)
  amIMale?: boolean    // 我是否為男生 (選填)
  myStatus?: string    // 我目前的狀態 ('confirmed' 或 'waiting')
}

export function JoinGameButton({ 
  gameId, 
  courtId, 
  userId, 
  isJoined, 
  isFull, 
  gameDate, 
  startTime, 
  endTime, 
  isMaleFull, 
  amIMale, 
  myStatus 
}: Props) {
  // 4. 定義狀態與掛鉤 (Hooks)
  const [loading, setLoading] = useState(false) // 控制按鈕是否在轉圈圈
  const router = useRouter() // 路由控制
  const supabase = createClient() // 資料庫連線

  // 5. 核心邏輯：判斷「如果我現在按報名，是不是要去排候補？」
  // 條件：(總人數已滿) 或是 (我是男生 且 男生名額已滿)
  // 注意：前提是我還沒加入 (!isJoined)
  const needsWaitlist = !isJoined && (isFull || (amIMale && isMaleFull))

  // 6. 按鈕點擊處理函式
  const handleJoin = async () => {
    // A. 防呆：沒登入不能按
    if (!userId) {
      toast.error("請先登入", { description: "登入後才能搶位子喔！" })
      router.push("/login") // 導向登入頁
      return
    }

    setLoading(true) // 開始轉圈圈

    try {
      if (isJoined) {
        // --- B. 退出邏輯 (DELETE) ---
        // 如果我已經在名單內，點按鈕就是「取消報名」
        
        const { error } = await supabase
          .from("bookings")
          .delete() // 執行刪除
          .eq("game_id", gameId) // 鎖定這場局
          .eq("user_id", userId) // 鎖定我自己

        if (error) throw error // 有錯就丟出去給 catch 抓

        // 根據我原本是候補還是正選，顯示不同提示
        toast.info(myStatus === 'waiting' ? "已取消候補" : "已取消報名", {
          description: "期待下次球場見！👋"
        })

      } else {
        // --- C. 加入邏輯 (INSERT) ---
        // 如果我還沒加入，點按鈕就是「報名」

        // 決定寫入的狀態：需要候補就是 'waiting'，不然就是 'confirmed'
        const status = needsWaitlist ? 'waiting' : 'confirmed'

        const { error } = await supabase
          .from("bookings")
          .insert({
            user_id: userId,
            game_id: gameId,
            court_id: courtId,   // 記得寫入球館 ID
            date: gameDate,      // 寫入日期
            start_time: startTime, // 寫入開始時間
            end_time: endTime,     // 寫入結束時間
            status: status       // 🔥 關鍵：寫入正確狀態 (waiting/confirmed)
          })

        if (error) throw error

        // 根據結果顯示不同顏色的成功訊息
        if (status === 'waiting') {
          toast.warning("已加入候補隊列 ⏳", {
            description: "若有人退出，系統將自動遞補並通知你"
          })
        } else {
          toast.success("報名成功！🏐", {
            description: "記得準時出席，不見不散！"
          })
        }
      }

      // 7. 刷新頁面，讓最新的名單顯示出來
      router.refresh()

    } catch (error: any) {
      // 8. 錯誤處理
      console.error(error)
      toast.error("操作失敗", {
        description: error.message || "系統忙碌中，請稍後再試"
      })
    } finally {
      setLoading(false) // 無論成功失敗，都要停止轉圈圈
    }
  }

  // --- 9. UI 渲染邏輯 (決定按鈕長什麼樣子) ---

  // 情況一：正在處理中
  if (loading) {
    return (
      <Button disabled className="w-full md:w-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        處理中...
      </Button>
    )
  }

  // 情況二：已經加入 (顯示紅色的取消按鈕)
  if (isJoined) {
    return (
      <Button 
        onClick={handleJoin} 
        variant="destructive" // 紅色樣式
        className="w-full md:w-auto"
      >
        {myStatus === 'waiting' ? "取消候補" : "取消報名"}
      </Button>
    )
  }

  // 情況三：需要候補 (顯示橘色的候補按鈕)
  if (needsWaitlist) {
    return (
      <Button 
        onClick={handleJoin} 
        className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white"
      >
        排隊候補 (目前額滿)
      </Button>
    )
  }

  // 情況四：正常報名 (顯示預設黑色按鈕)
  return (
    <Button 
      onClick={handleJoin} 
      className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
    >
      🔥 立即報名 (Join)
    </Button>
  )
}