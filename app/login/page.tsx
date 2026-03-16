"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginSchema, type LoginInput } from "@/lib/schemas/auth"
import { useAuth } from "@/hooks/useAuth"

// 註冊功能重構前暫用
import { createClient } from "@/lib/supabase-browser"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket, Loader2 } from "lucide-react"

function LoginContent() {
  const { login, loading } = useAuth()
  const supabase = createClient() 

  // 僅保留兩個無法被表單套件管理的外部狀態
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)

  // 初始化 React Hook Form，並綁定 Zod Schema
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  // 1. 面試官一鍵登入
  const handleDemoLogin = async () => {
    setDemoLoading(true)
    setServerMessage(null)
    try {
      await login({ email: "demo@volleybook.com", password: "demoPassword123" })
    } catch (error: any) {
      setServerMessage(error.message)
    } finally {
      setDemoLoading(false)
    }
  }

  // 2. 一般登入 (到達此處的 data 必定已通過 Zod 驗證)
  const onSubmit = async (data: LoginInput) => {
    setServerMessage(null)
    try {
      await login(data)
    } catch (error: any) {
      setServerMessage(error.message)
    }
  }

  // 3. 註冊邏輯 (待移至後端 API)
  const handleSignUp = async () => {
    setServerMessage(null)
    // 透過 getValues 取得當前表單數值，不依賴 useState
    const { email, password } = getValues() 
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })

    if (error) setServerMessage("註冊失敗：" + error.message)
    else setServerMessage("註冊成功！請去信箱收取驗證信")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-zinc-200">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900">VolleyBook</h2>
          <p className="mt-2 text-sm text-zinc-600">請登入以管理您的排球預約與點名紀錄</p>
        </div>

        <div className="space-y-6 mt-8">
          <Button 
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-6 text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            {demoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            面試官 / 訪客一鍵體驗
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">或使用一般帳號登入</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {/* 透過 register 綁定輸入框 */}
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverMessage && (
              <div className={`p-3 rounded text-sm ${serverMessage.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {serverMessage}
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <Button 
                type="submit"
                className="flex-1 bg-zinc-900 hover:bg-zinc-800" 
                disabled={loading || demoLoading}
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "處理中..." : "登入"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={handleSignUp}
                disabled={loading || demoLoading}
              >
                註冊
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
export default function LoginPage() {
  return (
    // fallback 是在等待網址參數解析時，畫面會暫時顯示的東西
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50">載入中...</div>}>
      <LoginContent />
    </Suspense>
  )
}