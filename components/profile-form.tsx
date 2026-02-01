"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import imageCompression from 'browser-image-compression';
import AvatarUpload from "./avatar-upload"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner"

type Props = {
  user: any // 傳入目前的 User 資料
}

export function ProfileForm({ user }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 初始化狀態 (使用現有資料或是預設空值)
  const initialName = user?.display_name || ""
  const initialGender = user?.gender || "Other"
  // 增加初始頭像路徑
  const initialAvatarUrl = user?.avatar_url || null

  const [displayName, setDisplayName] = useState(user?.display_name || "")
  const [gender, setGender] = useState(user?.gender || "Other")
  // 增加頭像 State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)

  const handleUpdate = async () => {
    setLoading(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        gender: gender, // 這會影響之後的報名限制
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id) // 記得我們剛剛把 RLS 改成 authenticated 且只能改自己的 ID

    if (error) {
      toast.error("更新失敗 😭：" ,{description: error.message})
    } else {
      toast.success("更新成功！🎉")
      router.refresh()
    }
    setLoading(false)
  }

  const hasChanges = displayName !== initialName || 
    gender !== initialGender ||
    avatarUrl !== initialAvatarUrl 

  return (
    <div className="space-y-8">

      {/* 🔥 6. 把頭像上傳放在最上面 */}
      <div className="flex justify-center mb-6">
        <AvatarUpload
          uid={user.id}
          url={initialAvatarUrl}
          onUpload={(url) => {
            setAvatarUrl(url)
          }}
        />
      </div>


      {/* 暱稱輸入 */}
      <div className="space-y-2">
        <Label htmlFor="name">顯示名稱 (暱稱)</Label>
        <Input
          id="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ex: 排球少年"
        />
      </div>

      {/* 性別選擇 (關鍵功能) */}
      <div className="space-y-2">
        <Label htmlFor="gender">生理性別 (用於球局名額限制)</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue placeholder="選擇性別" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">男性 (Male)</SelectItem>
            <SelectItem value="Female">女性 (Female)</SelectItem>
            <SelectItem value="Other">不公開 / 其他</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          * 部分球局可能有「男性名額上限」，請如實填寫。
        </p>
      </div>

      {/* 送出按鈕 */}
      <Button 
        onClick={handleUpdate} 
        disabled={loading || !hasChanges} 
        className="w-full"
      >
        {loading ? "儲存中..." : "儲存修改"}
      </Button>
    </div>
  )
}