import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import PassportQR from "@/components/passport-qr" // 確保路徑正確

export default async function PassportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900">我的排球護照 🏐</h1>
      
      <div className="grid gap-6 md:grid-cols-1">
        <PassportQR userId={user.id} />
      </div>
    </div>
  )
}