import { z } from "zod";

/**
 * 🚪 安檢門 1 號：針對使用 Booking ID 取消 (對應 Dashboard 的取消按鈕)
 * 路由情境：DELETE /api/bookings/[id]
 */
export const BookingIdSchema = z.object({
  id: z.string().uuid({ message: "無效的預約 ID 格式，必須是 UUID" }),
});

/**
 * 🚪 安檢門 2 號：針對使用 Game ID 取消 (對應球局詳細頁的取消按鈕)
 * 路由情境：POST /api/games/cancel 或 DELETE 帶 body
 */
export const CancelByGameIdSchema = z.object({
  gameId: z.string().uuid({ message: "無效的球局 ID 格式" }),
  // ⚠️ 注意：這裡絕對不放 userId！
});

/**
 * 🚪 安檢門 3 號：未來重構「報名球局」時可以共用的 Schema
 * 路由情境：POST /api/games/join
 */
export const JoinGameSchema = z.object({
  gameId: z.string().uuid({ message: "無效的球局 ID 格式" }),
  needsWaitlist: z.boolean().default(false),
});

// 匯出 TypeScript 型別，讓前端可以直接拿去用
export type BookingIdInput = z.infer<typeof BookingIdSchema>;
export type CancelByGameIdInput = z.infer<typeof CancelByGameIdSchema>;
export type JoinGameInput = z.infer<typeof JoinGameSchema>;