import { createClient } from "@/utils/supabase/server"
import { JoinGameButton } from "@/components/join-game-button"
import Link from "next/link"
import { formatTime } from "@/lib/time-utils"
import { Calendar as CalendarIcon, MapPin, Clock, Users, ArrowRight, Building2, Trophy, CircleDollarSign } from "lucide-react"
import { CancelGameButton } from "@/components/cancel-game-button"
import {ShareGameButton} from "@/components/share-game-button"
type Props = {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // 1. 取得目前登入使用者 (為了檢查他有沒有報名過)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. 撈這場局的詳細資料 (關聯 Courts 表查地點，關聯 Host 查主揪名字)
  // 注意：這裡假設你的 auth.users 沒辦法直接查 (Supabase 限制)，通常需要一張 public.profiles 表
  // 這裡我們先只撈 games 和 courts
  const { data: game, error } = await supabase
    .from("games")
    .select(`
      *,
      courts (name, location, price, image_url)
    `)
    .eq("id", id)
    .single()

  if (!game) return <div className="p-10 text-center">找不到這場局 😭</div>

  // 3. 撈報名名單 (Participants)
  // 這裡我們要算人數，順便看看我自己在不在裡面
  const { data: participants } = await supabase
    .from("bookings")
    .select("user_id, status, profiles(display_name, avatar_url, gender)") // 這裡之後可以撈 profile 顯示頭像
    .eq("game_id", id)

  const currentPlayers = participants?.length || 0
  const confirmedPlayers = participants?.filter(p => p.status === 'confirmed') || [];
  const waitingPlayers = participants?.filter((p: any) => p.status === 'waiting') || [];
  const currentPlayersCount = confirmedPlayers.length;
  const isHost = user?.id === game.host_id
  const isFull = currentPlayers >= game.max_players
  const isJoined = participants?.some((p) => p.user_id === user?.id) || false
  //計算男性人數
  const currentMaleCount = participants?.filter((p: any) => {
    // 防呆：Supabase有時回傳陣列，有時回傳物件
    const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return profile?.gender === 'Male';
    }).length || 0;
  //判斷男性名額是否已滿
  const maleLimit = game.male_limit ?? 999;
  const isMaleFull = currentMaleCount >= maleLimit;
  //判斷[我]是不是男生
  let amIMale = false;
  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("id", user.id)
      .single();
    amIMale = myProfile?.gender === 'Male';
  }


  //從參賽者名單中，抓出主揪的資料
  const hostParticipant = participants?.find(p => p.user_id === game.host_id);
  const rawHostProfile = hostParticipant?.profiles;
  const hostProfile = Array.isArray(rawHostProfile) ? rawHostProfile[0] : rawHostProfile;
  const hostName = hostProfile?.display_name || "神秘主揪";
  //const hostAvatar = hostProfile?.avatar_url;//還沒用到
  // 檢查我是否已在名單內
  
  //抓出使用者狀態
  const myBooking = participants?.find(p => p.user_id === user?.id);
  const myStatus = myBooking?.status;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 頂部球館大圖 */}
      <div className="relative h-48 md:h-64">
        <img 
          src={game.courts.image_url || "/court_placeholder.jpg"} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-end p-6">
          <div className="text-white">
            <h1 className="text-2xl font-bold">{game.courts.name}</h1>
            <p>📍 {game.courts.location}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 -mt-6 relative z-10">
        {/* 卡片：局的資訊 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            
            {/* 左側：標題、狀態、與屬性標籤包在一起 */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{game.title || "未命名揪團"}</h2>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                {game.is_public ? "公開局" : "私人局"}
              </span>
              
              {/* 四個屬性標籤 (移到這裡，就會換行到下方) */}
              {/* 我拿掉了 border-t，因為緊接在下方的話沒有分隔線會更乾淨，並加上 mt-3 產生換行間距 */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                  <Clock className="w-3 h-3" />
                  {game.start_time.slice(0, 5)} - {game.end_time.slice(0, 5)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-50 text-yellow-700">
                  <Trophy className="w-3 h-3" />
                  {game.level || "歡樂"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                  <CircleDollarSign className="w-3 h-3" />
                  {game.price > 0 ? `$${game.price}` : "免費"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700">
                  <Users className="w-3 h-3" />
                  {game.current_players} / {game.max_players || 12}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-800">
                {formatTime(game.start_time)} - {formatTime(game.end_time)}
              </div>
              <div className="text-gray-500">{game.date}</div>
            </div>
          </div>

          <hr className="my-4" />

          <div className="space-y-3 text-gray-600">
            <p>👋 主揪：{hostName}</p>
            <p>💰 費用：{game.price > 0 ? `$${game.price}` : "免費"}</p>
            <p>📝 備註：{game.description || "主揪很懶，沒寫備註"}</p>
            {game.male_limit && (
              <p className={isMaleFull ? "text-red-500 font-bold" : "text-gray-600"}>
                🚹 男性人數：{currentMaleCount} / {game.male_limit}
                {isMaleFull && " (已達上限)"}
              </p>
            )}
          </div>
        </div>

        {/* 卡片：隊伍名單 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">目前人數 ({currentPlayersCount}/{game.max_players})</h3>
            {isFull && <span className="text-red-500 font-bold text-sm">已額滿</span>}
          </div>
          
          {/* 進度條 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${(currentPlayersCount / game.max_players) * 100}%` }}
            ></div>
          </div>

          {/* 頭像列表 (目前用圓圈代替) */}
          <div className="flex gap-2 flex-wrap">
            {confirmedPlayers?.map((p: any, index: number) => {
              // 防呆機制：萬一 profiles 是 null (例如舊資料)，給個預設值
              const profile = p.profiles || {};
              const name = profile.display_name || "未知球友";
              let avatarFullUrl = null;

              if (profile.avatar_url) {
                const { data } = supabase.storage
                  .from("avatars")
                  .getPublicUrl(profile.avatar_url);
                avatarFullUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
              }

              return (
                <div key={index} className="relative group">
                  {/* 頭像本體 */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                    {avatarFullUrl ? (
                      <img src={avatarFullUrl} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        // 沒有頭像時顯示名字首字
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                          {name.slice(0, 1)}
                        </div>
                      )}  
              </div>
              {/* 滑鼠移過去顯示名字 (Tooltip) */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded">
                {name}
              </div>
             </div>
            ) ;
          })}  
            {/* 顯示空位 */}
            {Array.from({ length: Math.max(0, game.max_players - currentPlayersCount) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                ?
              </div>
            ))}
          </div>
        </div>

        {/* 🔥 卡片 3：候補名單 (Waitlist Zone) - 只有當有候補時才顯示 */}
        {waitingPlayers.length > 0 && (
          <div className="bg-orange-50 rounded-xl border border-orange-200 p-6 mb-6">
            <h3 className="font-bold text-lg text-orange-800 mb-3 flex items-center">
              ⏳ 候補隊列 ({waitingPlayers.length}人)
            </h3>
            <div className="space-y-2">
              {waitingPlayers.map((p: any, index: number) => {
                const profile = p.profiles || {};
                const name = profile.display_name || "未知球友";
                let avatarFullUrl = null;
                if (profile.avatar_url) {
                  const { data } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
                  avatarFullUrl = data.publicUrl;
                }

                return (
                  <div key={p.user_id} className="flex items-center justify-between bg-white/60 p-2 rounded">
                    <div className="flex items-center gap-3">
                      {/* 候補順位編號 */}
                      <span className="font-mono font-bold text-orange-500 text-lg w-6">
                        #{index + 1}
                      </span>

                      {/* 小頭像 */}
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-orange-200">
                        {avatarFullUrl ? (
                          <img src={avatarFullUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                              {name.slice(0, 1)}
                          </div>
                        )}  
                      </div>

                      <span className="text-gray-700 font-medium">{name}</span>
                    </div>
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-bold">
                      排隊中
                    </span>
                  </div>
                )
              })}
             </div>   
            </div>
          )}  

        {/* 底部按鈕 */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 md:static md:bg-transparent md:border-none md:p-0 flex flex-col gap-3">
          <JoinGameButton 
            gameId={game.id} 
            userId={user?.id}
            isJoined={isJoined}
            isFull={isFull}
            isMaleFull={isMaleFull}
            amIMale={amIMale}
            myStatus={myStatus}
          />
          {isHost && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <Link href={`/games/${game.id}/manage`}>
              <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                管理場次
              </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}