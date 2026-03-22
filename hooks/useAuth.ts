import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoginInput, RegisterInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase-browser";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = async (data: LoginInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        // 捕捉後端拋出的 400 (Zod) 或 401 (Service) 錯誤
        throw new Error(result.error || "登入失敗");
      }

      toast.success("登入成功");

      // 處理跳轉邏輯：讀取網址列的 ?next= 參數，若無則預設導向首頁 /
      const nextUrl = searchParams.get("next") || "/";
      //強迫瀏覽器重新載入，清除快取
      window.location.href = nextUrl;

    } catch (error: any) {
      toast.error("登入失敗", { description: error.message });
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        // 這裡會精準攔截到我們在後端寫的 "密碼長度至少需要 6 個字元" 或 "此信箱已被註冊"
        throw new Error(result.error || "註冊失敗");
      }

      // 註冊成功，給予明確提示
      toast.success("註冊成功！", { 
        description: result.message || "請至信箱收取驗證信以啟用帳號" 
      });

      // 註冊成功後，將使用者導向登入頁面準備登入
      router.push("/login");

    } catch (error: any) {
      // 若後端有回傳詳細的 Zod 格式錯誤 details，你也可以在這裡做進階處理
      // 但目前直接顯示 error.message 已經有很好的防護力
      toast.error("註冊失敗", { description: error.message });
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const nextUrl = searchParams.get("next") || "/"; // 記錄使用者原本想去哪

      // 直接請 Supabase 幫我們把畫面跳轉到 Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // 登入成功後，Google 會把使用者導向我們後端的 callback 路由，並帶上 next 參數
          redirectTo: `${window.location.origin}/auth/callback?next=${nextUrl}`,
          queryParams: {
            access_type: 'offline', 
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
    } catch (error: any) {
      toast.error("Google 登入發起失敗", { description: error.message });
      setLoading(false); // 只有失敗才解除 loading，成功的話畫面已經跳走了
    }
  };

  return {
    login,
    register,
    loginWithGoogle,
    loading,
  };
}