import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 情境 A：給 Dashboard 用的取消方法
  const cancelByBookingId = async (bookingId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "取消失敗");
      
      router.refresh(); // 重整畫面，觸發 Server Component 重新撈資料
      return data.message; 
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 情境 B：給球局詳細頁 (JoinGameButton) 用的取消方法
  const cancelByGameId = async (gameId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/games/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }), // ⚠️ 這裡絕對不傳 userId！
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "取消失敗");
      
      router.refresh();
      return data.message;
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    loading, 
    cancelByBookingId, 
    cancelByGameId 
  };
}