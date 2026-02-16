"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-browser"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User as UserIcon, CalendarDays, QrCode } from "lucide-react"

// 定義它可以接收的資料 (從 Server 傳過來的)
type Props = {
  user: any
  avatarUrl: string | null
  email: string | null
}

export function UserNav({ user, avatarUrl, email }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  // 如果沒 User，顯示登入按鈕 (雖然 Server 層通常會處理，但這裡做個保險)
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {/* 🔥 直接用傳進來的 avatarUrl，不用再自己抓 */}
            <AvatarImage src={avatarUrl || ""} alt={email || ""} />
            <AvatarFallback className="bg-zinc-900 text-white">
              {email?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">我的帳號</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          <CalendarDays className="mr-2 h-4 w-4" />
          個人預約
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/passport')}>
          <QrCode className="mr-2 h-4 w-4" />
          排球護照
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <UserIcon className="mr-2 h-4 w-4" />
          個人檔案
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          登出
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}