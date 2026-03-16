import { createClient } from "@/utils/supabase/server";

/**
 * 倉庫管理員：專門處理 Bookings 資料表的存取
 * ⚠️ 注意：這裡只能在 Server 端執行 (Server Components, API Routes, Server Actions)
 */

// 1. 透過 Booking ID 刪除 (給 Dashboard 用的路徑)
export async function deleteBookingByIdAndUser(bookingId: string, currentUserId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId)
    .eq("user_id", currentUserId)
    .select() // 加上 select() 可以回傳被刪除的資料，方便後續確認
    .single();

  if (error) {
    throw new Error(`資料庫刪除失敗: ${error.message}`);
  }

  return data;
}

// 2. 透過 Game ID 和 User ID 刪除 (給球局詳細頁用的路徑)
export async function deleteBookingByGameAndUser(gameId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .delete()
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`資料庫刪除失敗: ${error.message}`);
  }

  return data;
}