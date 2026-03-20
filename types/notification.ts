export type NotificationType = 'schedule_reminder' | 'share_invite' | 'share_accepted';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}
