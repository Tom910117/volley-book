"use client"

import { useState, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoginSchema, RegisterSchema, type LoginInput, type RegisterInput } from "@/lib/schemas/auth"
import { useAuth } from "@/hooks/useAuth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket, Loader2 } from "lucide-react"

// ==========================================
// 1. 獨立的登入表單元件 (擁有自己的 LoginSchema 安檢門)
// ==========================================
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login, loading } = useAuth()
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginInput) => {
    setServerMessage(null)
    try {
      await login(data)
    } catch (error: any) {
      setServerMessage(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input 
          id="login-email" 
          type="email" 
          placeholder="name@example.com"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">密碼</Label>
        <Input 
          id="login-password" 
          type="password" 
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {serverMessage && (
        <div className="p-3 rounded text-sm bg-red-100 text-red-700">{serverMessage}</div>
      )}

      <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? "處理中..." : "登入"}
      </Button>

      <div className="text-center mt-4">
        <button type="button" onClick={onSwitchToRegister} className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-4">
          還沒有帳號？點此註冊
        </button>
      </div>
    </form>
  )
}

// ==========================================
// 2. 獨立的註冊表單元件 (擁有自己的 RegisterSchema 安檢門)
// ==========================================
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register: registerUser, loading } = useAuth()
  const [serverMessage, setServerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: RegisterInput) => {
    setServerMessage(null)
    try {
      await registerUser(data)
      setServerMessage({ type: 'success', text: "註冊成功！請去信箱收取驗證信" })
    } catch (error: any) {
      setServerMessage({ type: 'error', text: error.message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input 
          id="register-email" 
          type="email" 
          placeholder="name@example.com"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">設定密碼</Label>
        <Input 
          id="register-password" 
          type="password" 
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      {serverMessage && (
        <div className={`p-3 rounded text-sm ${serverMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {serverMessage.text}
        </div>
      )}

      <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {loading ? "處理中..." : "建立新帳號"}
      </Button>

      <div className="text-center mt-4">
        <button type="button" onClick={onSwitchToLogin} className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-4">
          已經有帳號了？返回登入
        </button>
      </div>
    </form>
  )
}

// ==========================================
// 3. 頁面主容器 (負責管理 UI 狀態切換與共用元件)
// ==========================================
function LoginContent() {
  const { login } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  const handleDemoLogin = async () => {
    setDemoLoading(true)
    setDemoError(null)
    try {
      await login({ email: "demo@volleybook.com", password: "demoPassword123" })
    } catch (error: any) {
      setDemoError(error.message)
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-zinc-200 transition-all duration-300">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900">VolleyBook</h2>
          <p className="mt-2 text-sm text-zinc-600">
            {mode === 'login' ? "請登入以管理您的排球預約與點名紀錄" : "建立您的 VolleyBook 專屬帳號"}
          </p>
        </div>

        <div className="space-y-6 mt-8">
          {/* 面試官一鍵體驗按鈕 (僅在登入模式顯示) */}
          {mode === 'login' && (
            <>
              <Button 
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-6 text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
              >
                {demoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                面試官 / 訪客一鍵體驗
              </Button>
              {demoError && <p className="text-xs text-red-500 text-center">{demoError}</p>}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-zinc-500">或使用一般帳號</span>
                </div>
              </div>
            </>
          )}

          {/* 核心表單區域：動態切換 LoginForm 或 RegisterForm */}
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}

        </div>
      </div>
    </div>
  )
}

// ==========================================
// 4. 匯出預渲染頁面 (Suspense 保護傘)
// ==========================================
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50">載入中...</div>}>
      <LoginContent />
    </Suspense>
  )
}