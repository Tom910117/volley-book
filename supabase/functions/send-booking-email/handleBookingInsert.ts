// supabase/functions/send-booking-email/handleBookingInsert.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export async function handleBookingInsert(record: any) {
  console.log(`[模組] 處理單人報名通知: Booking ID ${record.id}`)
  
  try {
    // 1. 初始化 Supabase Client (使用 Service Role 繞過 RLS)
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 2. 二次查詢：球局
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        title, date, start_time, price,
        courts (name, location)
      `)
      .eq('id', record.game_id)
      .single()

    if (gameError || !game) throw new Error(`找不到球局: ${gameError?.message}`)

    // 3. 二次查詢：使用者
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(record.user_id)

    if (userError || !user || !user.email) throw new Error(`找不到 User Email`)

    // 4. 寄信內容
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

    // 5. 呼叫 Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VolleyBook <noreply@volleybook.online>',
        to: user.email,
        subject: `[報名確認] ${game.title}`,
        html: emailHtml,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error('Resend 寄信失敗')

    console.log('[模組] 單人報名信件已發送')
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[handleBookingInsert] Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}