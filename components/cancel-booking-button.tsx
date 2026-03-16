"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCancelBooking } from "@/hooks/useCancelBooking" // 🌟 引入我們的新武器

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  // 🌟 只取出我們需要的方法和載入狀態
  const { cancelByBookingId, loading } = useCancelBooking()

  const executeDelete = () => {
    // 🌟 直接把 Hook 裡的方法丟給 toast.promise 處理
    toast.promise(cancelByBookingId(bookingId), {
      loading: '正在取消預約...',
      success: (message) => message, // Hook 會回傳後端設定的成功訊息
      error: (error) => `取消失敗：${error.message}`,
    })
  }

  const handleCancelClick = () => {
    toast("確定要取消這筆預約嗎？", {
      description: "此操作無法復原，請謹慎考慮。",
      action: {
        label: "確定刪除",
        onClick: () => executeDelete(), 
      },
      cancel: {
        label: "再想想",
        onClick: () => console.log("使用者取消操作"),
      },
      duration: 5000,
    })
  }

  return (
    <Button 
      variant="destructive"
      onClick={handleCancelClick} 
      disabled={loading} // 🌟 直接使用 Hook 的 loading 狀態
      className="w-full md:w-auto bg-gray-900 text-white hover:bg-gray-700 transition-colors font-medium px-6"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {loading ? "處理中..." : "取消預約"}
    </Button>
  )
}