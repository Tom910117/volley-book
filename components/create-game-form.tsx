"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateEndTime, checkOverlap } from "@/lib/time-utils" // 引入工具
import { toast } from "sonner"
import { Description } from "@radix-ui/react-dialog"

type Props = {
  isOpen: boolean
  onClose: () => void
  courtId: string
  date: string
  userId: string | undefined
  existingGames: any[]
}

export function CreateGameForm({ isOpen, onClose, courtId, date, userId, existingGames }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [startTime, setStartTime] = useState("19:00")
  const [duration, setDuration] = useState("120")
  const [endTime, setEndTime] = useState("21:00")

  const [isPublic, setIsPublic] = useState(false) // 預設私人
  const [level, setLevel] = useState("歡樂") // 預設程度
  const [price, setPrice] = useState(200) // 預設價格
  const [players, setPlayers] = useState(12)
  const [minplayers, setMinplayers] = useState(12)
  const [isAgreed, setIsAgreed] = useState(false)
  const [maleLimit, setMaleLimit] = useState("")

  useEffect(() => {
    const end = calculateEndTime(startTime, Number(duration))
    setEndTime(end)
  }, [startTime, duration])

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("請先登入", { description: "登入後才能搶位子喔！" })
      router.push("/login") // 導向登入頁
      return
    }
    if (!title) {
      toast.warning("請寫標題",{ description: "你標題要記得寫餒！"})
      return
    }
    if (players<=0) {
      toast.warning("人數需大於0")
      return
    }
    if (minplayers<=0) {
      toast.warning("成團人數需大於0")
      return
    }
    if (players<minplayers) {
      toast.warning("總人數須大於成團人數")
      return
    }
    if (checkOverlap(startTime, endTime, existingGames)) {
      toast.error(`❌ 時段衝突！\n${startTime} ~ ${endTime} 已經有人預約了。\n請檢查時間表。`)
      return
    }

    //maleLimit空字串轉換為null
    const finalMaleLimit = maleLimit === "" ? null : Number(maleLimit)
    
    if (finalMaleLimit !== null){
      if (finalMaleLimit < 0) {
        toast.warning("男性上限不能是負數啦！")
        return
      }
    if (finalMaleLimit > players){
      toast.warning(`男性上限 (${finalMaleLimit}) 不能超過總人數 (${players}) 喔！`)
      return
     }
    }

    setLoading(true)

    try {
      // 1. 先建立局 (Game)
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .insert({
          court_id: courtId,
          host_id: userId,
          date: date,
          title: title,
          is_public: isPublic,
          level: level,
          price: price,
          max_players: players,
          min_players: minplayers, 
          start_time: startTime,
          end_time: endTime,
          male_limit: finalMaleLimit
        })
        .select()
        .single() // 拿回剛剛建立的那一筆，因為我們需要它的 ID

      if (gameError) throw gameError

      // 2. 幫主揪自己報名 (Insert Booking)
      // 這一步很重要，不然主揪自己不在名單上
      const { error: bookingError } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          court_id: courtId,
          game_id: gameData.id, // 用剛剛拿到的 ID
          date: date,
          start_time: startTime,
          end_time: endTime
        })

      if (bookingError) throw bookingError

      // 3. 全部成功！
      toast.success("🎉 開團成功！",{description: "你是最棒的主揪！"})
      onClose() // 關閉視窗
      router.refresh() // 刷新頁面顯示綠色格子

    } catch (error: any) {
      toast.error("開團失敗：" + {Description: error.message})
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>發起揪團 ({date})</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* 團名輸入 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              團名
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 快樂週五排球"
              className="col-span-3"
            />
          </div>

          {/* 🔥 時間選擇區 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">開始</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">時長</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="選擇時長" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="120">2 小時</SelectItem>
                <SelectItem value="150">2.5 小時</SelectItem>
                <SelectItem value="180">3 小時</SelectItem>
                <SelectItem value="210">3.5 小時</SelectItem>
                <SelectItem value="240">4 小時</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自動計算的結束時間顯示 */}
          <div className="text-center text-sm font-bold text-blue-600 bg-blue-50 p-2 rounded">
            預計時段：{startTime} ~ {endTime}
          </div>

          {/* 程度 (暫時用 Input，之後可以改 Select) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="level" className="text-right">
              程度
            </Label>
            <Input
              id="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              價格
            </Label>
            <Input
              id="price"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="players" className="text-right">
              總人數
            </Label>
            <Input
              id="players"
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minplayers" className="text-right">
              成團人數
            </Label>
            <Input
              id="minplayers"
              value={minplayers}
              onChange={(e) => setMinplayers(Number(e.target.value))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maleLimit" className="text-right">
              男性上限
            </Label>
            <Input
              id="maleLimit"
              type="number"
              placeholder="不填代表不限"
              value={maleLimit}
              onChange={(e) => setMaleLimit(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* 公開/私人開關 */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="public-mode" className="text-right">
              公開揪團
            </Label>
            <div className="flex items-center space-x-2 col-span-3">
              <Switch
                id="public-mode"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <span className="text-sm text-gray-500">
                {isPublic ? "所有人可見 (公開)" : "只有知道連結的人可見 (私人)"}
              </span>
            </div>
          </div>
          
           {/* === 🔥 解法 B：責任條款 === */}
           <div className="flex items-top space-x-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Checkbox
              id="terms"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-900"
            >
              主揪責任聲明
            </Label>
            <p className="text-xs text-amber-700">
              我了解開團需負責聯繫球友、預付場地費，並確保當天活動順利進行。若無故缺席將會被停權。
            </p>
           </div>
          </div>  

        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={loading || !isAgreed}>
            {loading ? "建立中..." : "確認開團"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}