"use client"

import { useState } from "react"
// 引入我們剛剛寫的瀏覽器專用連線工具
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // 處理登入
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
      // 登入成功，跳轉回首頁
      router.push("/")
      router.refresh() // 強制重新整理頁面，讓導覽列知道狀態更新了
    }
    setLoading(false)
  }

  // 處理註冊
  const handleSignUp = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 註冊後重新導向的網址 (通常是回到首頁驗證)
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
          <h2 className="text-3xl font-extrabold text-zinc-900">歡迎回來</h2>
          <p className="mt-2 text-sm text-zinc-600">
            請輸入帳號密碼以管理您的預約
          </p>
        </div>

        <div className="space-y-4 mt-8">
          
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

          {/* 錯誤或成功訊息顯示區 */}
          {message && (
            <div className={`p-3 rounded text-sm ${message.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button 
              className="w-full bg-zinc-900 hover:bg-zinc-800" 
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "處理中..." : "登入"}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
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