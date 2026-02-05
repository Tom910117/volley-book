// lib/game-status-utils.ts

export type GameStatusResult = {
  label: string;
  color: "green" | "yellow" | "red" | "gray" | "blue";
  disabled: boolean;
};

export function getGameStatus(game: any, currentUserId?: string): GameStatusResult {

  const now = new Date().getTime();

  // 1. 時間處理 (標準化)
  const fullDateTimeStr = `${game.date}T${game.start_time}`;
  const startTime = new Date(fullDateTimeStr).getTime();
  const deadlineDateTime = new Date(game.signup_deadline).getTime();

  // 如果沒有設定截止時間，就預設用開打時間當作截止時間
  // 注意：這裡用 startTime 當 fallback 是合理的
  const effectiveDeadline = isNaN(deadlineDateTime) ? startTime : deadlineDateTime;

  // 2. 狀態布林值 (先把條件算好，下面邏輯會很乾淨)
  const isDeadlinePassed = now > effectiveDeadline; // 過了報名期限
  const isGameStarted = now > startTime;            // 比賽已經開始
  
  const currentCount = game.bookings ? game.bookings.length : game.current_players;
  const minPlayers = game.min_players || 6;
  const maxPlayers = game.max_players || 12; // 預設 12，避免 undefined
  
  const isFull = currentCount >= maxPlayers;
  const isEnough = currentCount >= minPlayers;
  const isMyGame = game.host_id === currentUserId;

  // --- 判定邏輯開始 (層層過濾) ---

  // 1. 【已取消】
  if (game.status === 'cancelled') {
    return { label: "❌ 已取消", color: "gray", disabled: true };
  }

  // 2. 【私人局判定】
  if (!game.is_public && !isMyGame) {
    return { label: "🔒 私人局", color: "gray", disabled: true };
  }

  // 3. 【已結束】(新增邏輯：如果現在時間已經超過開打時間)
  // 這樣球友看到的是「已結束」，而不是困惑的「報名截止」
  if (isGameStarted) {
    return { label: "🏁 已結束", color: "gray", disabled: true };
  }

  // 4. 【流局】(過了截止時間，但人還不夠)
  if (isDeadlinePassed && !isEnough) {
    return { label: "⚠️ 流局 (人數不足)", color: "gray", disabled: true };
  }

  // 5. 【報名截止】(過了截止時間，人夠了，但還沒開打) 🔥 這是你的盲點修正
  if (isDeadlinePassed && isEnough) {
    return { label: "⛔ 報名截止 (待開打)", color: "gray", disabled: true };
  }

  // 6. 【額滿】
  if (isFull) {
    // 雖然額滿，但如果是主揪，可以讓他點進去管理(例如踢人)，所以 disabled 可以考慮給 false
    // 但如果要單純一點，給 true 也可以，看你設計
    return { label: "🈵 已額滿", color: "red", disabled: !isMyGame }; 
  }

  // 7. 【成團 / 招募中】
  if (isEnough) {
    return { label: "✅ 已成團", color: "green", disabled: false };
  }

  // 8. 【缺人】
  return { 
    label: `缺 ${minPlayers - currentCount} 人`, 
    color: "yellow", 
    disabled: false 
  };
}