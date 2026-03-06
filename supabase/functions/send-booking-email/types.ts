// supabase/functions/send-booking-email/types.ts

export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: 'bookings' | 'games'
  record: any
  old_record?: any
  schema: string
}