// lib/game-status-utils.ts

export type GameStatusResult = {
  label: string;
  color: "green" | "yellow" | "red" | "gray" | "blue"; // 多一個 blue 給我的局
  disabled: boolean;
};

// 🔥 這裡多加一個參數：currentUserId
export function getGameStatus(game: any, currentUserId?: string): GameStatusResult {

  const now = new Date().getTime();

  const fullDateTimeStr = `${game.date}T${game.start_time}`;
  const startTime = new Date(fullDateTimeStr).getTime();

  const safeStartTime = isNaN(startTime) ? 0 : startTime;
  const hoursLeft = (safeStartTime - now) / (1000 * 60 * 60);
  
  // 智慧判斷人數來源 (兼容列表頁與詳情頁)
  const currentCount = game.bookings ? game.bookings.length : game.current_players;
  const minPlayers = game.min_players || 6;
  
  const isFull = currentCount >= game.max_players;
  const isEnough = currentCount >= minPlayers;
  const isMyGame = game.host_id === currentUserId; // 👑 我是不是主揪

  // --- 判定邏輯開始 (順序非常重要) ---

  // 1. 【最高優先級】已取消 (不管是不是私人，取消就是取消)
  if (game.status === 'cancelled') {
    return { label: "❌ 已取消", color: "gray", disabled: true };
  }

  // 2. 【私人局判定】 (關鍵修改在這裡！) 🔒
  // 如果是私人局，而且「我不是主揪」，那就擋！
  if (!game.is_public && !isMyGame) {
    return { label: "🔒 私人局", color: "gray", disabled: true };
  }

  // 3. 【流局】時間過且人不足
  if (hoursLeft < 0 && !isEnough) {
    return { label: "⚠️ 流局 (人數不足)", color: "gray", disabled: true };
  }

  // 4. 【已結束】時間過且人夠
  if (hoursLeft < 0 && isEnough) {
    return { label: "🏁 已結束", color: "gray", disabled: true };
  }

  // 5. 【額滿】
  if (isFull) {
    // 這裡如果是主揪，可以顯示不一樣的，或者維持紅色
    return { label: "🈵 已額滿", color: "red", disabled: false }; 
    // ^ 小細節：如果是主揪，額滿還是讓他進去(例如踢人)，如果是路人就擋住
  }

  // 6. 【成團】
  if (isEnough) {
    return { label: "✅ 已成團", color: "green", disabled: false };
  }

  // 7. 【缺人】
  return { 
    label: `缺 ${minPlayers - currentCount} 人`, 
    color: "yellow", 
    disabled: false 
  };
}