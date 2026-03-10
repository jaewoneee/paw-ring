export type ShareRole = 'viewer' | 'editor';
export type ShareStatus = 'pending' | 'accepted';

/** Supabase calendar_shares 테이블 스키마 */
export interface CalendarShare {
  id: string;
  pet_id: string;
  owner_id: string;
  shared_user_id: string;
  role: ShareRole;
  status: ShareStatus;
  created_at: string;
  updated_at: string;
}

/** JOIN으로 확장된 공유 정보 */
export interface CalendarShareWithDetails extends CalendarShare {
  pet: { name: string; profile_image: string | null };
  owner: { nickname: string; profile_image: string | null };
  shared_user: { nickname: string; profile_image: string | null };
}

/** Supabase invites 테이블 스키마 */
export interface Invite {
  id: string;
  pet_id: string;
  owner_id: string;
  role: ShareRole;
  expires_at: string;
  max_uses: number;
  use_count: number;
  created_at: string;
}

/** JOIN으로 확장된 초대 정보 */
export interface InviteWithDetails extends Invite {
  pet: { name: string; profile_image: string | null };
  owner: { nickname: string };
}
