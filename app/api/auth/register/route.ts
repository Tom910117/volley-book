import { NextResponse } from "next/server"
import { RegisterSchema } from "@/lib/schemas/auth"
import { registerService } from "@/lib/services/auth.service" // 替換成你實際的檔案路徑
import { z } from "zod"

export async function POST(request: Request) {
  try {
    // 1. 接收前端傳來的資料
    const body = await request.json()

    // 2. 總機先用 Zod 檢查包裹格式
    const validatedData = RegisterSchema.parse(body)

    // 3. 格式正確！把乾淨的資料派發給 Service 主廚處理
    const user = await registerService(validatedData)

    // 4. 主廚處理成功，總機負責回傳 HTTP 200 與成功訊息
    return NextResponse.json(
      { message: "註冊成功！請至信箱收取驗證信。", user },
      { status: 200 }
    )

  } catch (error) {
    // 攔截 Zod 格式錯誤
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "資料格式錯誤", details: error.issues },
        { status: 400 }
      )
    }

    // 攔截 Service 拋出的商業邏輯錯誤 (例如：信箱已存在)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // 處理其他未知的伺服器崩潰
    console.error("Register API Error:", error)
    return NextResponse.json(
      { error: "伺服器內部錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}