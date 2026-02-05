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
  const [deadlineType, setDeadlineType] = useState("midnight")
  const [customDeadline, setCustomDeadline] = useState("")

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

    // --- 🔥 3. 計算截止時間 (Smart Deadline Logic) ---
    let finalDeadline: string | null = null;
    const gameDateTimeStr = `${date}T${startTime}:00`; // 比賽完整開始時間

    switch (deadlineType) {
      case "midnight": // 當天 00:00
        finalDeadline = new Date(`${date}T00:00:00`).toISOString();
        break;
      case "prev_night": // 前一天 23:59
        const d = new Date(`${date}T00:00:00`);
        d.setMinutes(d.getMinutes() - 1); // 減1分鐘變成前一天 23:59
        finalDeadline = d.toISOString();
        break;
      case "minus_4h": // 開打前 4 小時
        finalDeadline = new Date(new Date(gameDateTimeStr).getTime() - 4 * 60 * 60 * 1000).toISOString();
        break;
      case "minus_2h": // 開打前 2 小時
        finalDeadline = new Date(new Date(gameDateTimeStr).getTime() - 2 * 60 * 60 * 1000).toISOString();
        break;
      case "custom": // 自訂
        if (!customDeadline) {
          toast.warning("請選擇自訂的截止時間！");
          return;
        }
        finalDeadline = new Date(customDeadline).toISOString();
        break;
      default: // same_as_start (直到開打)
        finalDeadline = new Date(gameDateTimeStr).toISOString();
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
          male_limit: finalMaleLimit,
          signup_deadline: finalDeadline
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

  // ... 前面 logic ...

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center border-b pb-2">
            🏐 發起揪團 ({date})
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          
          {/* --- 區塊 1: 基本資訊 --- */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-500">基本資訊</h3>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">團名</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 歡樂排球 (必填)"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="level" className="text-right">程度</Label>
              <Input
                id="level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="col-span-3"
              />
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">費用</Label>
              <div className="col-span-3 relative">
                 <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="pl-8" // 留位置給 $ 符號
                />
                <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
              </div>
            </div>
          </div>

          {/* --- 區塊 2: 時間設定 --- */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-zinc-500">時間設定</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">時段</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                />
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="時長" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="120">2 hr</SelectItem>
                    <SelectItem value="150">2.5 hr</SelectItem>
                    <SelectItem value="180">3 hr</SelectItem>
                    <SelectItem value="240">4 hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 預計結束時間提示 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="col-start-2 col-span-3 text-xs text-blue-600 bg-blue-50 p-2 rounded text-center">
                預計打到：{endTime}
              </div>
            </div>

            {/* 🔥 智慧截止時間 (新增的) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-red-500 font-medium">報名截止</Label>
              <div className="col-span-3">
                <Select value={deadlineType} onValueChange={setDeadlineType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇截止時間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midnight">📅 當天 00:00 (預設)</SelectItem>
                    <SelectItem value="prev_night">🌙 前一晚 23:59</SelectItem>
                    <SelectItem value="minus_4h">⏳ 開打前 4 小時</SelectItem>
                    <SelectItem value="same_as_start">🚩 直到開打前</SelectItem>
                    <SelectItem value="custom">✍️ 自訂時間...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 自訂截止時間輸入框 (只有選自訂才出現) */}
            {deadlineType === "custom" && (
              <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in slide-in-from-top-1">
                <div className="col-start-2 col-span-3">
                  <Input
                    type="datetime-local"
                    value={customDeadline}
                    onChange={(e) => setCustomDeadline(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* --- 區塊 3: 人數與限制 --- */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-zinc-500">人數限制</h3>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">人數</Label>
              <div className="col-span-3 flex gap-2 items-center">
                <div className="flex-1">
                   <span className="text-xs text-zinc-400 mb-1 block">總人數</span>
                   <Input
                    type="number"
                    value={players}
                    onChange={(e) => setPlayers(Number(e.target.value))}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-zinc-400 mb-1 block">成團下限</span>
                  <Input
                    type="number"
                    value={minplayers}
                    onChange={(e) => setMinplayers(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maleLimit" className="text-right">男性上限</Label>
              <Input
                id="maleLimit"
                type="number"
                placeholder="不填代表不限"
                value={maleLimit}
                onChange={(e) => setMaleLimit(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="public-mode" className="text-right">隱私</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="public-mode"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <span className="text-sm text-gray-500">
                  {isPublic ? "公開 (所有人可見)" : "私人 (有連結才可見)"}
                </span>
              </div>
            </div>
          </div>

          {/* 責任條款 */}
          <div className="flex items-start space-x-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Checkbox
              id="terms"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
              className="mt-1"
            />
            <div className="grid gap-1">
              <Label
                htmlFor="terms"
                className="text-sm font-medium leading-none text-amber-900 cursor-pointer"
              >
                主揪責任聲明
              </Label>
              <p className="text-xs text-amber-700 leading-relaxed">
                我了解需負責聯繫球友、預付場地費，並確保活動順利進行。無故缺席將被停權。
              </p>
            </div>
          </div>

        </div>

        <DialogFooter className="mt-2">
          <Button 
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" 
            onClick={handleSubmit} 
            disabled={loading || !isAgreed}
          >
            {loading ? "建立中..." : "確認開團"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}