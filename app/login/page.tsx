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
  const { login, loginWithGoogle, loading } = useAuth()
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
          <div className="space-y-3">
            <Button 
              onClick={loginWithGoogle}
              disabled={loading}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-zinc-300 hover:bg-zinc-50 transition-colors"
            >
              {/* Google SVG Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              透過 Google 繼續
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">或使用 Email</span>
            </div>
          </div>
          
          {/* 面試官一鍵體驗按鈕 (僅在登入模式顯示) */}
          {mode === 'login' && (
            <>
              <Button 
                onClick={handleDemoLogin}
                disabled={demoLoading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-6 text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
              >
                {demoLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                以訪客身份探索
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