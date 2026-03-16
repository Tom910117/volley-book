import { createClient } from "@/utils/supabase/server";
import { LoginInput } from "../schemas/auth";

/**
 * 處理使用者登入的商業邏輯
 */
export async function loginService(credentials: LoginInput) {
  const supabase = await createClient();

  // 呼叫 Supabase 的信箱密碼登入 API
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    // 處理常見的 Supabase 錯誤訊息轉換，避免直接拋出英文給前端
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("帳號或密碼錯誤");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("請先至信箱收取驗證信完成驗證");
    }
    throw new Error(`登入失敗: ${error.message}`);
  }

  return {
    success: true,
    user: data.user,
  };
}