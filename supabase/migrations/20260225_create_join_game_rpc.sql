declare
  v_game_record record;
  v_current_count int;
  v_is_booked boolean;
  v_status text;
  v_message text;
begin
-- 防護 1: 檢查是否登入
  if auth.uid() is null then
    return json_build_object('success', false, 'message', '請先登入！');
  end if;

  -- 防護 2: 檢查「你是不是在幫自己報名」
  -- 如果傳進來的 p_user_id 跟當前登入者 (auth.uid()) 不一樣，直接擋掉！
  if p_user_id != auth.uid() then
    return json_build_object('success', false, 'message', '你不能幫別人報名！');
  end if;
  
  -- 1. 鎖定 -- Use row-level lock to prevent race condition
  select * into v_game_record
  from games
  where id = p_game_id
  for update;

  if not found then return json_build_object('success', false, 'message', '找不到該場次'); end if;

  -- 2. 檢查重複
  select exists(select 1 from bookings where game_id = p_game_id and user_id = p_user_id) into v_is_booked;
  if v_is_booked then return json_build_object('success', false, 'message', '你已經報名過了啦！'); end if;

  -- 3. 檢查截止
  if v_game_record.signup_deadline is not null and now() > v_game_record.signup_deadline then
     return json_build_object('success', false, 'message', '報名時間已截止');
  end if;

  -- 4. 計算目前人數
  select count(*) into v_current_count
  from bookings
  where game_id = p_game_id and status = 'confirmed';

  -- 🔥 5. 決定狀態 (結合前端判斷 + 後端鎖定)
  -- 情況 A: 前端說要候補 (可能是男生滿了) OR 後端發現總人數滿了
  if p_force_waiting or v_current_count >= v_game_record.max_players then
    v_status := 'waiting';
    v_message := '已加入候補名單！' || (case when p_force_waiting then '(性別或人數限制)' else '(目前額滿)' end);
  else
    -- 情況 B: 沒滿，且不用強制候補
    v_status := 'confirmed';
    v_message := '報名成功！';
  end if;

  -- 6. 寫入
  insert into bookings (
    game_id, user_id, court_id, date, start_time, end_time, status
  ) values (
    p_game_id, p_user_id, v_game_record.court_id, v_game_record.date, v_game_record.start_time, v_game_record.end_time, v_status
  );

  return json_build_object('success', true, 'message', v_message, 'booking_status', v_status);

exception when others then
  return json_build_object('success', false, 'message', '系統錯誤：' || SQLERRM);
end;