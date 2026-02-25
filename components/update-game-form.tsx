"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateEndTime, checkOverlap } from "@/lib/time-utils"
import { toast } from "sonner"

// 接收既有的球局資料與目前的報名人數
type Props = {
  isOpen: boolean
  onClose: () => void
  game: any // 原本的球局資料
  isLocked: boolean
  existingGames: any[] // 用來檢查時間衝突
}

export function UpdateGameForm({ isOpen, onClose, game, isLocked, existingGames }: Props) {
  const router = useRouter()
  const supabase = createClient()
  
  // 核心判斷：是否有人報名了？(扣掉主揪自己)
  // 只要大於 1，代表有路人上車了，核心欄位必須鎖定！

  const [loading, setLoading] = useState(false)
  
  // 狀態初始化：把原本的 game 資料塞進來
  const [title, setTitle] = useState(game.title)
  const [startTime, setStartTime] = useState(game.start_time ? game.start_time.slice(0, 5) : "19:00")
  
  // 算 duration (這步有點麻煩因為你要反推時長，這裡用簡單減法)
  const calculateInitialDuration = () => {
    const start = new Date(`2000-01-01T${game.start_time}`).getTime()
    const end = new Date(`2000-01-01T${game.end_time}`).getTime()
    return String((end - start) / (1000 * 60)) // 轉成分鐘
  }
  const [duration, setDuration] = useState(calculateInitialDuration())
  const [endTime, setEndTime] = useState(game.end_time.slice(0, 5))

  const [isPublic, setIsPublic] = useState(game.is_public)
  const [level, setLevel] = useState(game.level)
  const [price, setPrice] = useState(game.price)
  const [players, setPlayers] = useState(game.max_players)
  const [minplayers, setMinplayers] = useState(game.min_players)
  const [maleLimit, setMaleLimit] = useState(game.male_limit === null ? "" : String(game.male_limit))
  
  // 截止時間處理 (簡化版：編輯模式下預設為自訂，並載入原本的時間)
  const [deadlineType, setDeadlineType] = useState("custom")
  const [customDeadline, setCustomDeadline] = useState(
    game.signup_deadline ? new Date(game.signup_deadline).toISOString().slice(0, 16) : ""
  )

  useEffect(() => {
    const end = calculateEndTime(startTime, Number(duration))
    setEndTime(end)
  }, [startTime, duration])

  const handleSubmit = async () => {
    if (!title) return toast.warning("標題不能空白啦！")
    if (players <= 0 || minplayers <= 0) return toast.warning("人數需大於0")
    if (players < minplayers) return toast.warning("總人數須大於成團人數")
    
    // 如果有人報名，理論上時間不能改，所以也不用檢查衝突。
    // 如果沒人報名，才需要檢查時間衝突 (記得排除自己這場局)
    if (!isLocked) {
      const otherGames = existingGames.filter(g => g.id !== game.id)
      if (checkOverlap(startTime, endTime, otherGames)) {
        return toast.error(`❌ 時段衝突！這個場地在這段時間已經有人約了。`)
      }
    }

    const finalMaleLimit = maleLimit === "" ? null : Number(maleLimit)
    if (finalMaleLimit !== null && finalMaleLimit > players) {
      return toast.warning(`男性上限 (${finalMaleLimit}) 不能超過總人數 (${players}) 喔！`)
    }

    let finalDeadline = customDeadline ? new Date(customDeadline).toISOString() : game.signup_deadline;

    setLoading(true)

    try {
      // 🔥 核心修改：從 insert 變成 update
      const { error } = await supabase
        .from("games")
        .update({
          title: title,
          is_public: isPublic,
          level: level,
          max_players: players,
          min_players: minplayers,
          male_limit: finalMaleLimit,
          signup_deadline: finalDeadline,
          
          // 如果被鎖定了，這些就不要送去更新，保持原樣
          ...(isLocked ? {} : {
            start_time: startTime,
            end_time: endTime,
            price: price,
          })
        })
        .eq("id", game.id) // 條件：更新我這場

      if (error) throw error

      toast.success("✅ 球局資訊已更新！")
      onClose()
      router.refresh()

    } catch (error: any) {
      toast.error("更新失敗：" + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center border-b pb-2">
            ✏️ 修改球局資訊
          </DialogTitle>
          {isLocked && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md mt-2">
              ⚠️ 已經有球友報名，為保障雙方權益，**時間與金額**已鎖定無法修改。若需變更，請直接取消球局重新建立。
            </div>
          )}
        </DialogHeader>

        <div className="grid gap-6 py-2">
          
          {/* 基本資訊 */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-500">基本資訊</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">團名</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">程度</Label>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">費用</Label>
              <div className="col-span-3 relative">
                 <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="pl-8"
                  disabled={isLocked} // 🔥 鎖定防呆
                />
                <span className="absolute left-3 top-2.5 text-zinc-400 text-sm">$</span>
              </div>
            </div>
          </div>

          {/* 時間設定 */}
          <div className={`space-y-3 border-t pt-3 ${isLocked ? 'opacity-50' : ''}`}>
            <h3 className="text-sm font-semibold text-zinc-500">時間設定 (報名後鎖定)</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">時段</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                  disabled={isLocked} // 🔥 鎖定防呆
                />
                <Select value={duration} onValueChange={setDuration} disabled={isLocked}>
                  <SelectTrigger className="w-[110px]"><SelectValue placeholder="時長" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="120">2 hr</SelectItem>
                    <SelectItem value="150">2.5 hr</SelectItem>
                    <SelectItem value="180">3 hr</SelectItem>
                    <SelectItem value="240">4 hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 截止時間 */}
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label className="text-right text-red-500 font-medium">自訂截止</Label>
              <div className="col-span-3">
                <Input
                  type="datetime-local"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* 人數與限制 (隨時可改，例如主揪想加開名額) */}
          <div className="space-y-3 border-t pt-3">
            <h3 className="text-sm font-semibold text-zinc-500">人數與限制</h3>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">人數</Label>
              <div className="col-span-3 flex gap-2 items-center">
                <div className="flex-1">
                   <span className="text-xs text-zinc-400 mb-1 block">總人數</span>
                   <Input type="number" value={players} onChange={(e) => setPlayers(Number(e.target.value))} />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-zinc-400 mb-1 block">成團下限</span>
                  <Input type="number" value={minplayers} onChange={(e) => setMinplayers(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">男性上限</Label>
              <Input type="number" placeholder="不限" value={maleLimit} onChange={(e) => setMaleLimit(e.target.value)} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">隱私</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                <span className="text-sm text-gray-500">{isPublic ? "公開" : "私人"}</span>
              </div>
            </div>
          </div>

        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={loading}>
            {loading ? "更新中..." : "儲存變更"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}