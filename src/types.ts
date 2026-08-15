// ── Core domain types for UMOJA ──

export type UserRole =
  | 'super_admin'
  | 'group_admin'
  | 'treasurer'
  | 'secretary'
  | 'member'
  | 'viewer';

export type GroupStatus = 'active' | 'pending_verification' | 'suspended' | 'closed';
export type MemberStatus = 'active' | 'pending' | 'suspended' | 'removed';
export type ContributorKind = 'registered' | 'non_registered';
export type TxStatus = 'successful' | 'pending' | 'failed' | 'reversed' | 'duplicate' | 'cancelled';
export type PaymentMethod = 'm_pesa' | 'bank' | 'card' | 'other';
export type TxType = 'contribution' | 'top_up' | 'wallet_transfer';
export type NotificationKind =
  | 'contribution_received'
  | 'contribution_successful'
  | 'contribution_failed'
  | 'new_member'
  | 'group_invitation'
  | 'otp'
  | 'group_verification'
  | 'system_announcement'
  | 'report_generated'
  | 'top_up_successful'
  | 'top_up_failed';

export interface Profile {
  id: string;
  umojaId: string;
  fullName: string;
  phone: string;
  email: string;
  avatarColor: string;
  pinSet: boolean;
  phoneVerified: boolean;
  status: MemberStatus;
  totalContributed: number;
  contributionCount: number;
  lastContributionAt: string | null;
  groupsJoined: number;
  registeredAt: string;
}

export interface Wallet {
  id: string;
  walletNumber: string;
  ownerType: 'personal' | 'group';
  ownerId: string;
  balance: number;
  createdAt: string;
}

export interface Group {
  id: string;
  groupId: string;
  name: string;
  description: string;
  category: string;
  purpose: string;
  location: string;
  logoColor: string;
  status: GroupStatus;
  createdAt: string;
  totalContributions: number;
  contributorCount: number;
  registeredMembers: number;
  nonRegisteredContributors: number;
  contributionsThisMonth: number;
  transactionCount: number;
  walletNumber?: string;
  founders: FounderRef[];
  myRole: UserRole | null;
  myTotalContributed: number;
}

export interface FounderRef {
  fullName: string;
  nationalId: string;
  phone: string;
  verified: boolean;
}

export interface Contribution {
  id: string;
  transactionId: string;
  groupId: string;
  groupName: string;
  groupLogoColor: string;
  contributorId: string | null;
  contributorName: string;
  contributorPhone: string;
  contributorKind: ContributorKind;
  umojaId: string | null;
  paymentReference: string;
  amount: number;
  fee: number;
  paymentMethod: PaymentMethod;
  type: TxType;
  status: TxStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  groupId?: string;
  groupName?: string;
}

export interface FeeConfig {
  topUpFeePct: number;
  topUpFeeFlat: number;
  contributionFeePct: number;
  contributionFeeFlat: number;
  walletTransferFeePct: number;
  walletTransferFeeFlat: number;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  object: string;
  ip: string;
  createdAt: string;
  result: 'success' | 'failure';
}

export interface ChartPoint {
  label: string;
  value: number;
  count: number;
}

export interface GroupMemberRow {
  id: string;
  profileId: string;
  fullName: string;
  umojaId: string;
  phone: string;
  email: string;
  avatarColor: string;
  role: UserRole;
  status: MemberStatus;
  totalContributed: number;
  joinedAt: string;
}
