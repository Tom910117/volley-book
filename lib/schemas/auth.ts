import { z } from "zod";

// ==========================================
// 1. 登入用的安檢門
// ==========================================
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "信箱不能為空" })
    .email({ message: "這不是有效的信箱格式喔" }),
  password: z
    .string()
    .min(6, { message: "密碼至少需要 6 個字元" }) // Supabase 預設密碼下限通常是 6
});

// 定義 TypeScript 型別，讓前端表單可以直接套用
export type LoginInput = z.infer<typeof LoginSchema>;


// ==========================================
// 2. 註冊用的安檢門
// ==========================================
export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, { message: "信箱不能為空" })
    .email({ message: "這不是有效的信箱格式喔" }),
  
  // 註冊時，我們通常會順便跟使用者要一個暱稱 (用來顯示在球局名單上)
  displayName: z
    .string()
    .min(2, { message: "暱稱至少需要 2 個字" })
    .max(20, { message: "暱稱太長囉，請控制在 20 字以內" }),

  password: z
    .string()
    .min(6, { message: "密碼至少需要 6 個字元" }),
    
  confirmPassword: z
    .string()
    .min(1, { message: "請再次輸入密碼" }),
})
// 🌟 註冊獨有邏輯：檢查兩次密碼是否一致
.refine((data) => data.password === data.confirmPassword, {
  message: "兩次輸入的密碼不一致",
  path: ["confirmPassword"], // 錯誤訊息會精準綁定在 confirmPassword 這個欄位上
});

export type RegisterInput = z.infer<typeof RegisterSchema>;