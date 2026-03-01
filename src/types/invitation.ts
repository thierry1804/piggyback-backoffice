export interface GroupInvitation {
  id: string;
  group_id: string;
  email: string | null;
  token: string;
  role: string;
  expires_at: string | null;
  created_at: string | null;
  created_by: string | null;
}

export interface GroupInvitationWithMeta extends GroupInvitation {
  groupName: string | null;
  createdByName: string | null;
}

export type InvitationStatusFilter = 'all' | 'valid' | 'expired';

export const INVITATION_ROLES = ['admin', 'contributor', 'observer'] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];
