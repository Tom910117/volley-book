// app/api/games/join/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    // 1. 解析前端傳來的 JSON 資料
    const body = await request.json();
    const { gameId, needsWaitlist } = body;

    // 基礎防呆檢查
    if (!gameId) {
      return NextResponse.json({ error: "缺少必要的場次 ID" }, { status: 400 });
    }

    // 2. 初始化後端的 Supabase Client
    // 這一步會自動去讀取 HTTP 請求夾帶的 Cookie Token
    const supabase = await createClient();

    // 3. 核心資安防護：從 Token 中解密出真正的使用者身分
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授權的請求，請先登入" }, { status: 401 });
    }

    // 4. 呼叫資料庫的 RPC 函式 (將原本前端的邏輯搬到這裡)
    const { data, error } = await supabase.rpc("join_game", {
      p_game_id: gameId,
      p_user_id: user.id, // 絕對不信任前端，直接使用後端解密出來的 user.id
      p_force_waiting: Boolean(needsWaitlist),
    });

    if (error) {
      console.error("[API] 報名失敗:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 5. 報名成功，回傳 200 OK
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error: any) {
    console.error("[API] 未預期錯誤:", error);
    return NextResponse.json({ error: "伺服器內部錯誤，請稍後再試" }, { status: 500 });
  }
}