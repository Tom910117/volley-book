import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { User } from "@supabase/supabase-js";

// 定義被包裝的 API 函式長什麼樣子
// 它會接收標準的 req, context, 還有我們幫它查好的 user 物件
type AuthenticatedHandler = (
  req: Request,
  context: any,
  user: User
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  // 回傳一個標準的 Next.js Route Handler
  return async (req: Request, context: any) => {
    try {
      // 1. 統一在這裡做身分驗證
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: "未授權，請先登入" }, 
          { status: 401 }
        );
      }

      // 2. 驗證通過，把請求交給真正的商業邏輯 (把 user 傳進去！)
      return handler(req, context, user);

    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return NextResponse.json(
        { error: "伺服器內部驗證錯誤" }, 
        { status: 500 }
      );
    }
  };
}