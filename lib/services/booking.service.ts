import { deleteBookingByIdAndUser, deleteBookingByGameAndUser } from "../repositories/booking.repository";

/**
 * 主廚：專門處理「取消報名」的商業邏輯
 * 職責：身分驗證、防禦越權行為、呼叫倉庫管理員
 */

// 1. 給 Dashboard 用的取消邏輯 (對應 deleteBookingById)
export async function cancelBookingService(bookingId: string, currentUserId: string) {
  // 💡 未來擴充點：你可以在這裡加入「如果距離開打不到 24 小時，不准取消」的邏輯
  // const booking = await getBookingById(bookingId);
  // if (booking.start_time < 24小時內) throw new Error("太晚了不准取消");
  
  // 👉 這裡我們先單純呼叫 Repository (假設 RLS 或後續邏輯會擋)
  const deletedData = await deleteBookingByIdAndUser(bookingId, currentUserId);
  
  return {
    success: true,
    message: "預約已成功取消",
    data: deletedData
  };
}

// 2. 給球局詳細頁用的取消邏輯 (對應 deleteBookingByGameAndUser)
export async function cancelGameBookingService(gameId: string, currentUserId: string) {
  
  // 💡 商業邏輯：確保這個人只能刪除「自己」在這個球局的報名
  // 這個方法天生就防禦了越權漏洞，因為它強制要求 game_id 和 user_id 同時符合
  const deletedData = await deleteBookingByGameAndUser(gameId, currentUserId);

  return {
    success: true,
    message: "已退出球局",
    data: deletedData
  };
}