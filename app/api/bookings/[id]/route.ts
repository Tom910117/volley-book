import { NextResponse } from "next/server";
import { BookingIdSchema } from "@/lib/schemas/booking";
import { cancelBookingService } from "@/lib/services/booking.service";
import { withAuth } from "@/lib/api-wrappers/with-auth";

// 🌟 把整個 async 函式丟進 withAuth 裡面
export const DELETE = withAuth(async (request, context, user) => {
  try {
    // 💡 看到了嗎？這裡「不需要」再 import Supabase 了！
    // 也「不需要」再寫 if (!user) return 401 了！
    // withAuth 已經幫我們把絕對合法的 user 物件送進來了！

    const resolvedParams = await context.params;
    const parsed = BookingIdSchema.safeParse({ id: resolvedParams.id });
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 } 
      );
    }

    // 呼叫主廚，傳入我們從 withAuth 拿到的 user.id
    const result = await cancelBookingService(parsed.data.id, user.id);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "伺服器發生錯誤" },
      { status: 500 }
    );
  }
});