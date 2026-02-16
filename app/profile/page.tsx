import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form" // 引用你的表單元件

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. 驗證身分
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // 2. 撈取個人檔案資料
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="max-w-xl mx-auto py-10">      
        <h1 className="text-2xl font-bold mb-6">設定個人檔案</h1>

        {/* 這裡就像積木一樣放進去，因為 Form 沒有外框，所以會完美融合 */}
        <div className="bg-white shadow p-6 rounded-xl">
            <ProfileForm user={profile} />
        </div>
    </div>
  )
}