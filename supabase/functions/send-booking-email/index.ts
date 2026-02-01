// supabase/functions/send-booking-email/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 定義 Payload 結構
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: {
    id: string
    game_id: string
    user_id: string
    status: string
  }
  schema: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// 🔥 這是我們的新密碼，從環境變數拿
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
    const secret = url.searchParams.get('secret')

    if (secret !== INTERNAL_WEBHOOK_SECRET) {
      console.warn('擋下未授權的請求！IP:', req.headers.get('x-forwarded-for'))
      return new Response('Unauthorized: Wrong Secret', { status: 401 })
    }

    // --- 以下邏輯完全不用動 ---

    // 2. 解析 Webhook Payload
    const payload: WebhookPayload = await req.json()
    const { record } = payload
    
    if (payload.type !== 'INSERT') {
      return new Response('Not an INSERT event, skipped.', { status: 200 })
    }

    console.log(`正在處理報名通知: Booking ID ${record.id}`)

    // 3. 初始化 Supabase Client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. 二次查詢：球局
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        title, date, start_time, price,
        courts (name, location)
      `)
      .eq('id', record.game_id)
      .single()

    if (gameError || !game) throw new Error(`找不到球局: ${gameError?.message}`)

    // 5. 二次查詢：使用者
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(record.user_id)

    if (userError || !user || !user.email) throw new Error(`找不到 User Email`)

    // 6. 寄信內容
    const formattedTime = game.start_time.slice(0, 5)
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">🎉 報名成功通知！</h1>
        <p>嗨！你已經成功報名了 <strong>${game.title}</strong>。</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 日期：</strong> ${game.date}</p>
          <p><strong>⏰ 時間：</strong> ${formattedTime}</p>
          <p><strong>📍 地點：</strong> ${game.courts.name}</p>
          <p><strong>💰 費用：</strong> $${game.price}</p>
        </div>
        <p style="color: #666; font-size: 12px;">此為自動通知，請勿回覆。</p>
      </div>
    `

    // 7. 呼叫 Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VolleyBook <onboarding@resend.dev>',
        to: user.email,
        subject: `[報名確認] ${game.title}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error('Resend 寄信失敗')

    console.log('信件已發送')
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})