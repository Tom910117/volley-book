"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner" // 引入 sonner

type Props = {
  gameId: string
  courtId: string
}

export function CancelGameButton({ gameId, courtId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // --- 動作 2：真正的刪除邏輯 (被 Action 呼叫) ---
  const executeCancel = async () => {
    setLoading(true) // 按鈕鎖住，避免重複按

    // 定義刪除的非同步動作
    const cancelAction = async () => {
      const { error } = await supabase
        .from("games")
        .update({ status: 'cancelled' })
        .eq("id", gameId)

      if (error) throw error
      
      router.refresh() // 刷新資料
      return "已取消場次 👋" // 這裡回傳的字串會變成 toast.success 的標題
    }

    // 交給 toast.promise 監控狀態
    toast.promise(cancelAction(), {
      loading: '正在取消場次...',
      success: (data) => {
        setLoading(false)
        return data 
      },
      error: (error) => {
        setLoading(false)
        // 這裡就是你原本想要的寫法，完美支援！
        return `取消失敗：${error.message}`
      },
      // 這裡可以自訂 description，如果你想要更詳細的錯誤顯示
      // 但上面的 return 其實已經會顯示在 description 或 title 位置了
    })
  }

  // --- 動作 1：點擊按鈕，跳出詢問 Toast ---
  const handleCancelClick = () => {
    toast("😱 確定要取消這場局嗎？", {
      description: "此動作無法復原，且報名者將無法參加！",
      duration: 5000, // 給他 5 秒猶豫
      action: {
        label: "確定取消",
        onClick: () => executeCancel(), // 按下紅色按鈕才執行
      },
      cancel: {
        label: "我再想想",
        onClick: () => console.log("主揪手下留情"),
      },
      // 讓這則確認通知看起來比較嚴重一點
      style: {
        border: '1px solid #ef4444', // 紅色邊框警告
      },
    }) 
  }

  return (
    <Button 
      variant="outline"
      onClick={handleCancelClick} // 改成呼叫詢問函式
      disabled={loading}
      className="flex-1 bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 hover:text-black gap-2 shadow-sm"
    >
      <Trash2 className="w-4 h-4 mr-2"/>
      {loading ? "處理中..." :"取消此局"}
    </Button>
  )
}