-- 建立計算信用分數的預存程序 (Stored Procedure)
CREATE OR REPLACE FUNCTION calculate_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_new_score int;
  v_target_user_id uuid;
BEGIN
  -- 抓取觸發這件事的那筆資料裡的 user_id (NEW 代表被修改後的那一行)
  v_target_user_id := NEW.user_id;

  -- 防呆：如果沒有 user_id 就直接結束
  IF v_target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 🔄 重算邏輯 (Full Re-calculation) 確保資料絕對一致
  SELECT 
    100 
    + (COUNT(*) FILTER (WHERE attendance_status = 'present') * 1)
    - (COUNT(*) FILTER (WHERE attendance_status = 'late') * 5)
    - (COUNT(*) FILTER (WHERE attendance_status = 'no_show') * 20)
  INTO v_new_score
  FROM bookings
  WHERE user_id = v_target_user_id;

  -- 🛑 邊界檢查 (Clamping) 防止分數溢出
  IF v_new_score > 100 THEN v_new_score := 100; END IF;
  IF v_new_score < 0 THEN v_new_score := 0; END IF;

  -- ✍️ 寫入結果 (Cache Update) 優化前端讀取效能
  UPDATE profiles 
  SET credit_score = v_new_score 
  WHERE id = v_target_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器 (Trigger)：只要 bookings 表的 attendance_status 被更新就會觸發
DROP TRIGGER IF EXISTS on_attendance_status_update ON bookings;
CREATE TRIGGER on_attendance_status_update
AFTER UPDATE OF attendance_status ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_user_reputation();