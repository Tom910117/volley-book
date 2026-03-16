import { NextResponse } from "next/server";
import { CancelByGameIdSchema } from "@/lib/schemas/booking";
import { cancelGameBookingService } from "@/lib/services/booking.service";
import { withAuth } from "@/lib/api-wrappers/with-auth";

export const POST = withAuth(async (request, _context, user) => {
  try {

    const body = await request.json();
    const parsed = CancelByGameIdSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // 3. 呼叫主廚 (傳入 gameId 和後端解析的 userId)
    const result = await cancelGameBookingService(parsed.data.gameId, user.id);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Cancel Game Booking Error:", error);
    return NextResponse.json(
      { error: error.message || "伺服器發生錯誤" },
      { status: 500 }
    );
  }
});