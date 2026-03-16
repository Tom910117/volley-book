import { NextResponse } from "next/server";
import { LoginSchema } from "@/lib/schemas/auth";
import { loginService } from "@/lib/services/auth.service";

export async function POST(request: Request) {
  try {
    // 1. 解析前端傳來的 JSON Body
    const body = await request.json();

    // 2. 第二道防線：後端 Zod 安檢門
    const parsed = LoginSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 } // 400 Bad Request: 資料格式錯誤
      );
    }

    // 3. 派發任務給主廚 (Service)
    const result = await loginService(parsed.data);

    // 4. 登入成功
    // 備註：此時 @supabase/ssr 已經自動將 Session Token 寫入 Response Cookie 中
    return NextResponse.json(
      { message: "登入成功", user: result.user },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Login API Error:", error);
    
    // 捕捉 Service 層拋出的自訂中文錯誤訊息 (如：帳號或密碼錯誤)
    return NextResponse.json(
      { error: error.message || "登入過程中發生伺服器錯誤" },
      { status: 401 } // 401 Unauthorized: 驗證失敗
    );
  }
}