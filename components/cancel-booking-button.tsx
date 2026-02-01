"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { toast } from "sonner" // 1. 引入 sonner

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // --- B. 真正執行刪除的動作 (這段邏輯被包起來，等待被呼叫) ---
  const executeDelete = async () => {
      setLoading(true)

      // 1. 定義一個 async 函式，裡面做你想做的所有事
      // 因為是 async，所以它回傳的一定是純正 Promise
      const deleteAction = async () => {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", bookingId)
        
        if (error) throw error // 丟出錯誤，Sonner 會接到並顯示 error 訊息
        
        router.refresh()
        return "預約已成功取消！" // 回傳字串，Sonner 會接到並顯示 success 訊息
      }

      // 2. 把這個函式的執行結果丟進去
      toast.promise(deleteAction(), {
        loading: '正在取消預約...',
        success: (data) => {
          setLoading(false)
          return data
        },
        error: (error) => {
          setLoading(false)
          return `取消失敗：${error.message}`
        },
      })
    }

  // --- A. 按下按鈕時的處理 (取代 window.confirm) ---
  const handleCancelClick = () => {
    // 這裡不使用 window.confirm，而是跳出一個帶有 "按鈕" 的 toast
    toast("確定要取消這筆預約嗎？", {
      description: "此操作無法復原，請謹慎考慮。",
      action: {
        label: "確定刪除",
        // 🔥 關鍵：只有當使用者點了這個紅色的「確定刪除」，才會執行上面的 executeDelete
        onClick: () => executeDelete(), 
      },
      cancel: {
        label: "再想想", // 取消按鈕
        onClick: () => console.log("使用者取消操作"),
      },
      duration: 5000, // 給使用者 5 秒鐘思考，沒按就會消失
    })
  }

  return (
    <Button 
      variant="destructive"
      onClick={handleCancelClick} 
      disabled={loading}
      className="w-full md:w-auto bg-gray-900 text-white hover:bg-gray-700 transition-colors font-medium px-6"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? "處理中..." : "取消預約"}
    </Button>
  )
}