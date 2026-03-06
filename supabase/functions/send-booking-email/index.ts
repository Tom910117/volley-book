// supabase/functions/send-booking-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// 引入拆分出去的模組，記得要加 .ts
import { handleBookingInsert } from "./handleBookingInsert.ts"
import { handleGameUpdate } from "./handleGameUpdate.ts"
import { WebhookPayload } from "./types.ts"

const INTERNAL_WEBHOOK_SECRET = Deno.env.get('INTERNAL_WEBHOOK_SECRET')

serve(async (req) => {
  try {
    // 0. 基本檢查
    if (!RESEND_API_KEY || !INTERNAL_WEBHOOK_SECRET) {
      throw new Error('缺少必要的環境變數 (API Key 或 Secret)')
    }

    // 🔥 1. 第一道防線：檢查 URL Secret
    // 網址會長這樣：https://.../send-booking-email?secret=你的密碼
    const url = new URL(req.url)
    if (url.searchParams.get('secret') !== INTERNAL_WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload: WebhookPayload = await req.json()

    // 2. 路由分流 (Router)
    if (payload.table === 'bookings' && payload.type === 'INSERT') {
      // 將 record 傳遞給專屬檔案處理
      return await handleBookingInsert(payload.record)
    } 
    
    if (payload.table === 'games' && payload.type === 'UPDATE') {
      // 傳遞新舊資料給專屬檔案處理
      return await handleGameUpdate(payload.record, payload.old_record)
    }

    return new Response('Skipped: 未知的 Webhook 條件', { status: 200 })

  } catch (error: any) {
    console.error('Webhook 總機發生錯誤:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})