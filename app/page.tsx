"use client"

import * as React from "react"
// 引入處理時間格式的工具 (讓你把日期變成 "2025年12月25日" 這種好看的字串)
import { format } from "date-fns"
// 引入一個小圖示 (行事曆圖案)
import { Calendar as CalendarIcon } from "lucide-react"

// 引入我們安裝的 Shadcn 積木
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import Link from "next/link"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// 這個 cn 是 Shadcn 幫你寫好的小工具，用來合併 class 名稱的，不用深究
import { cn } from "@/lib/utils"
// 定義排球場的 "型別" (Type)
type Court = {
  id: string
  name: string
  location: string // 用來對應搜尋的地點
  price: number
  image_url: string // 假裝有圖片
}

export default function Home() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [location, setLocation] = React.useState<string>("")
  const [results, setResults] = React.useState<Court[]>([])
  const dateString = date ? format(date, "yyyy-MM-dd") : ""
  const handleSearch = async () => {
    console.log("正在呼叫 Supabase...", {location })
    let query = supabase.from('courts').select('*')
    if(location){
      query = query.eq('location',location)
    }
    const{ data, error } =await query
    if(error) {
      console.error("糟糕，資料庫連線錯誤:", error)
      alert("讀取失敗，請檢察 Console")
    }
    else{
      console.log("成功抓到資料:", data)
      // E. 更新畫面 (如果有抓到資料 data，就存進去；沒抓到就給空陣列)
      setResults(data || [])
    }  
}
  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-24 bg-white space-y-8">
      
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
          排球場預約
        </h1>
        <p className="text-zinc-500">
          找到最適合你們隊伍的戰場
        </p>
      </div>

      {/* --- 這是我們的「搜尋列」容器 --- */}
      <div className="flex w-full max-w-sm items-center space-x-2 p-2 border rounded-xl shadow-lg bg-white/50 backdrop-blur-sm divide-x divide-zinc-200">
         <div className="flex-1">
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px] border-0 shadow-none focus:ring-0">
              <SelectValue placeholder="選擇球館" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="taipei-gym">台北體育館</SelectItem>
              <SelectItem value="fju-gym">輔大中美堂</SelectItem>
              <SelectItem value="ntu-gym">台大體育館</SelectItem>
            </SelectContent>
          </Select>
         </div> 
        {/* 這裡是 Popover 的外層 */}
        <div className="flex-1">
          <Popover>
            {/* 1. Trigger: 這是「開關」，也就是那個按鈕 */}
            <PopoverTrigger asChild>
              <Button
                variant={"ghost"}
                className={cn(
                  "w-full justify-start text-left font-normal border-0 shadow-none hover:bg-zinc-100",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "yyyy-MM-dd") : <span>選擇日期</span>}
              </Button>
            </PopoverTrigger>

            {/* 2. Content: 這是「內容」，也就是彈出來的那個視窗 */}
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="pl-2">
          {/* 這裡之後可以放「搜尋按鈕」 */}
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800" onClick={handleSearch}>
            搜尋
          </Button>
        </div>
      </div>
      {/* --- 搜尋結果展示區 --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl px-4 mt-12">
        {results.map((court) => (
          <Link 
            href={`/courts/${court.id}?date=${dateString}`} 
            key={court.id} 
            className="block group" // 加一點 CSS 讓它保持區塊特性
          >
          <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
            {/* 圖片區 */}
            <div className="h-48 bg-zinc-200 relative">
              <img 
                src={court.image_url} 
                alt={court.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* 文字內容區 */}
            <div className="p-4">
              <h3 className="font-bold text-lg text-zinc-900">{court.name}</h3>
              <p className="text-zinc-500 text-sm mt-1">地點代號: {court.location}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="font-semibold text-zinc-900">${court.price} / 小時</span>
                <Button size="sm">立即預約</Button>
              </div>
            </div>
          </div>
          </Link>
        ))}
        
        {/* 如果搜尋後沒東西，顯示提示 */}
        {results.length === 0 && (
          <div className="col-span-full text-center text-zinc-400 py-10">
            請選擇地點並按下搜尋...
          </div>
        )}
      </div>

    </main>
  )
}