import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  // 呼叫我們剛剛寫好的邏輯
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 攔截所有路徑，除了以下例外：
     * - _next/static (靜態檔案)
     * - _next/image (圖片優化)
     * - favicon.ico (圖示)
     * - images (你的圖片資料夾)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};