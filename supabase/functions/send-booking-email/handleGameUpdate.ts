// supabase/functions/send-booking-email/handleGameUpdate.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export async function handleGameUpdate(newGame: any, oldGame: any) {
  try {
    // 1. 防呆檢查：只處理狀態真的從 recruiting 變成 confirmed 或 cancelled 的情況
    if (oldGame.status !== 'recruiting' || !['confirmed', 'cancelled'].includes(newGame.status)) {
      return new Response('非成團/流團狀態更新，略過', { status: 200 })
    }

    const isConfirmed = newGame.status === 'confirmed'
    const statusText = isConfirmed ? "成團" : "流團"
    console.log(`[模組] 處理球局 ${newGame.id} ${statusText}通知`)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 2. 查詢此球局「所有」報名成功的球員清單
    // 假設你的 bookings 表中，狀態是 joined 或 attendance_status 是特定值，這裡簡單用 game_id 全撈
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('user_id')
      .eq('game_id', newGame.id)
      .eq('status', 'confirmed')
      
    if (bookingsError) throw new Error(`查詢報名名單失敗: ${bookingsError.message}`)
    if (!bookings || bookings.length === 0) return new Response('無人報名，不需寄信', { status: 200 })

    // 3. 透過 Promise.all 併發查詢所有人的 Email
    const emailPromises = bookings.map(async (b: any) => {
      const { data: { user }, error } = await supabase.auth.admin.getUserById(b.user_id)
      return user?.email
    })
    
    // 過濾掉可能找不到 Email 的 undefined 值
    const emails = (await Promise.all(emailPromises)).filter(Boolean)
    if (emails.length === 0) throw new Error('找不到任何有效的 User Email')

    // 4. 二次查詢：透過 court_id 找回場館名稱 (因為 webhook payload 沒有 join)
    const { data: court } = await supabase
      .from('courts')
      .select('name')
      .eq('id', newGame.court_id)
      .single()
      
    const courtName = court ? court.name : '指定球館'
    const formattedTime = newGame.start_time.slice(0, 5)

    // 5. 準備信件內容 (動態切換成團與流團文案)
    const subject = isConfirmed 
      ? `[成團通知] 🎉 ${newGame.title} 確定開打！` 
      : `[流團通知] 🥺 ${newGame.title} 遺憾取消`
      
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${isConfirmed ? '#2563eb' : '#dc2626'};">
          ${isConfirmed ? '🎉 恭喜！球局已成團' : '🥺 抱歉，球局已取消'}
        </h1>
        <p>你報名的 <strong>${newGame.title}</strong> 目前狀態為：<strong>${statusText}</strong>。</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 日期：</strong> ${newGame.date}</p>
          <p><strong>⏰ 時間：</strong> ${formattedTime}</p>
          <p><strong>📍 地點：</strong> ${courtName}</p>
        </div>
        ${isConfirmed ? '<p>請準時抵達球館，準備熱身！🏐</p>' : '<p>因人數不足取消，期待下次與您在球場相見！</p>'}
        <p style="color: #666; font-size: 12px; margin-top: 30px;">此為系統自動通知，請勿直接回覆。</p>
      </div>
    `

    // 6. 組合 Resend Batch (群發) 陣列格式
    // Resend Batch API 允許我們一次發送多封不同或相同的信件陣列
    const batchEmails = emails.map(email => ({
      from: 'VolleyBook <noreply@volleybook.online>',
      to: email,
      subject: subject,
      html: emailHtml,
    }))

    // 7. 呼叫 Resend Batch API 進行群發
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(batchEmails),
    })

    const data = await res.json()
    if (!res.ok) throw new Error('Resend 群發寄信失敗')

    console.log(`[模組] ${statusText}信件已成功發送給 ${emails.length} 名球員`)
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[handleGameUpdate] Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}