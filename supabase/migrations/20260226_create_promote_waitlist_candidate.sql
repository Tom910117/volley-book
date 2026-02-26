-- supabase/migrations/20260226_create_promote_waitlist_candidate.sql

-- 1. 建立 Function
CREATE OR REPLACE FUNCTION public.promote_waitlist_candidate()
RETURNS trigger AS $$
DECLARE
  next_candidate RECORD;
  current_confirmed_count INT;
  max_players_count INT;
BEGIN
  -- A. 檢查目前正選人數
  SELECT count(*) INTO current_confirmed_count
  FROM bookings
  WHERE game_id = OLD.game_id AND status = 'confirmed';

  -- B. 取得最大人數上限
  SELECT max_players INTO max_players_count
  FROM games
  WHERE id = OLD.game_id;

  -- C. 若有空位，尋找最早報名的候補者 (FIFO)
  IF current_confirmed_count < max_players_count THEN
    SELECT * INTO next_candidate
    FROM bookings
    WHERE game_id = OLD.game_id 
      AND status = 'waiting'
    ORDER BY created_at ASC
    LIMIT 1;

    -- D. 執行轉正更新
    IF next_candidate IS NOT NULL THEN
      UPDATE bookings
      SET status = 'confirmed'
      WHERE user_id = next_candidate.user_id 
        AND game_id = next_candidate.game_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 建立 Trigger (綁定於 DELETE 動作)
DROP TRIGGER IF EXISTS trigger_auto_promote ON public.bookings;
CREATE TRIGGER trigger_auto_promote
  AFTER DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.promote_waitlist_candidate();