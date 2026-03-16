"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useCancelBooking } from "@/hooks/useCancelBooking"

type Props = {
  gameId: string
  userId?: string
  isJoined: boolean     
  isFull: boolean       
  amIMale?: boolean     
  isMaleFull?: boolean  
  myStatus?: string     
}

export function JoinGameButton({ 
  gameId, 
  userId, 
  isJoined, 
  isFull, 
  amIMale, 
  isMaleFull,
  myStatus
}: Props) {
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { cancelByGameId } = useCancelBooking()

  // 🔥 邏輯：只有在「還沒加入」的時候才需要判斷是否強制候補
  const needsWaitlist = !isJoined && (isFull || (amIMale && isMaleFull))

  const handleClick = async () => {
    // 1. 防呆：沒登入
    if (!userId) {
      toast.error("請先登入");
      // 利用 encodeURIComponent 確保網址格式正確
      const targetUrl = encodeURIComponent(`/games/${gameId}`);
      router.push(`/login?next=${targetUrl}`);
      return;
    }

    setLoading(true)

    try {
      if (isJoined) {
        // ==========================================
        // 🚪 退出邏輯 (Delete) - 換上我們的 Hook
        // ==========================================
        await cancelByGameId(gameId) // 🌟 一行搞定！原本的 Supabase 邏輯全刪！

        toast.info(myStatus === 'waiting' ? "已取消候補" : "已取消報名", {
          description: "期待下次球場見！👋"
        })

      } else {
        // ==========================================
        // 🙋‍♂️ 加入邏輯 (RPC Insert) - 防止超賣
        // ==========================================
        
        // 這裡傳入 p_force_waiting: needsWaitlist
        // 告訴後端：「雖然可能總人數沒滿，但請把我放進候補 (因為我是男生且滿了)」
        // Call Supabase RPC to ensure atomic transaction and prevent race conditions
        const response = await fetch("/api/games/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, needsWaitlist }),
        })

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || data.error || "請求失敗");

        if (data.success) {
          if (data.booking_status === 'waiting') {
            toast.warning("排隊中", { description: data.message })
          } else {
            toast.success("報名成功", { description: data.message })
          }
        } else {
          toast.error("無法報名", { description: data.message })
        }
      }

      // 🔥 關鍵：操作完畢後，強制刷新頁面，讓最新的名單和人數顯示出來
      router.refresh()

    } catch (error: any) {
      console.error(error)
      toast.error("操作失敗", { description: error.message || "系統忙碌中" })
    } finally {
      setLoading(false)
    }
  }

  // --- UI 渲染部分 ---
  if (loading) {
    return (
      <Button disabled className="w-full md:w-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        處理中...
      </Button>
    )
  }

  // 1. 已加入 (顯示紅色取消)
  if (isJoined) {
    return (
      <Button onClick={handleClick} variant="destructive" className="w-full md:w-auto">
        {myStatus === 'waiting' ? "取消候補" : "取消報名"}
      </Button>
    )
  }

  // 2. 需要候補 (顯示橘色候補)
  if (needsWaitlist) {
    return (
      <Button onClick={handleClick} className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white">
        排隊候補 (目前額滿)
      </Button>
    )
  }

  // 3. 正常報名 (顯示黑色報名)
  return (
    <Button onClick={handleClick} className="w-full md:w-auto bg-zinc-900 hover:bg-zinc-800 text-white">
      我要報名 +1
    </Button>
  )
}