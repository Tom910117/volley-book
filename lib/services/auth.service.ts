import { createClient } from "@/utils/supabase/server";
import { LoginInput, RegisterInput} from "../schemas/auth";

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

export async function registerService(data: RegisterInput) {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
    },
  });

  if (error) {
    // 處理常見的 Supabase 註冊錯誤訊息轉換
    if (error.message.includes("User already registered")) {
      throw new Error("此信箱已被註冊，請直接前往登入");
    }
    if (error.message.includes("Password should be at least")) {
      // 雖然 Zod 通常會先擋下密碼長度，但後端再擋一次是很好的雙重保險 (Defense in Depth)
      throw new Error("密碼長度至少需要 6 個字元");
    }
    if (error.message.includes("rate limit") || error.message.includes("too many requests")) {
      // 這是 Supabase 免費版在測試時最容易撞到的坑
      throw new Error("註冊請求過於頻繁，請稍等幾分鐘後再試");
    }
    if (error.message.includes("Invalid email format")) {
      throw new Error("信箱格式不正確");
    }
    
    // 如果遇到沒設定到的冷門錯誤，就加上前綴並印出原文，方便我們工程師 debug
    throw new Error(`註冊失敗: ${error.message}`);
  }

  return authData.user;
}