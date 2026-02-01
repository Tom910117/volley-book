// lib/time-utils.ts

// 1. 檢查是否有重疊 (核心演算法)
export function checkOverlap(
  newStart: string, // "14:30"
  newEnd: string,   // "16:30"
  existingGames: any[]
): boolean {
  return existingGames.some((game) => {
    // DB 抓出來的時間可能是 "14:00:00"，我們只取前 5 碼 "14:00" 來比較
    const existStart = game.start_time.slice(0, 5)
    const existEnd = game.end_time.slice(0, 5)

    // 重疊公式：(新開始 < 舊結束) AND (新結束 > 舊開始)
    return newStart < existEnd && newEnd > existStart
  })
}

// 2. 計算結束時間 (開始時間 + 持續分鐘)
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  
  // 加上分鐘數
  date.setMinutes(date.getMinutes() + durationMinutes)
  
  // 轉回 HH:mm 字串
  const resultHours = date.getHours().toString().padStart(2, "0")
  const resultMinutes = date.getMinutes().toString().padStart(2, "0")
  
  return `${resultHours}:${resultMinutes}`
}

// 3. 格式化顯示 (去掉秒數)
export function formatTime(timeStr: string) {
    return timeStr.slice(0, 5)
}