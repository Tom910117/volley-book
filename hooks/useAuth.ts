import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoginInput } from "@/lib/schemas/auth";

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

  return {
    login,
    loading,
  };
}