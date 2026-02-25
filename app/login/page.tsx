"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Rocket } from "lucide-react" // 確保你有安裝或替換此 icon

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // 面試官/訪客一鍵登入邏輯
  const handleDemoLogin = async () => {
    setLoading(true)
    setMessage(null)

    // 請替換為你在 Supabase 建立的實際測試帳號密碼
    const { error } = await supabase.auth.signInWithPassword({
      email: "demo@volleybook.com", 
      password: "demoPassword123",
    })

    if (error) {
      setMessage("測試帳號登入失敗：" + error.message)
    } else {
      router.push("/")
      router.refresh()
    }
    setLoading(false)
  }

  // 一般登入邏輯
  const handleLogin = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage("登入失敗：" + error.message)
    } else {
      router.push("/")
      router.refresh() 
    }
    setLoading(false)
  }

  // 註冊邏輯
  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage("註冊失敗：" + error.message)
    } else {
      setMessage("註冊成功！請去信箱收取驗證信 (記得檢查垃圾郵件)")
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-zinc-200">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-zinc-900">VolleyBook</h2>
          <p className="mt-2 text-sm text-zinc-600">
            請登入以管理您的排球預約與點名紀錄
          </p>
        </div>

        <div className="space-y-6 mt-8">
          
          {/* 🚀 招募主管/面試官專用區塊 */}
          <Button 
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-6 text-base flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <Rocket className="w-5 h-5" />
            面試官 / 訪客一鍵體驗
          </Button>

          {/* 分隔線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">或使用一般帳號登入</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button 
              className="flex-1 bg-zinc-900 hover:bg-zinc-800" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "處理中..." : "登入"}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleSignUp}
              disabled={loading}
            >
              註冊
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}