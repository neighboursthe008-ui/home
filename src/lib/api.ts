import { supabase } from '@/lib/supabase';
import type { FeeConfig, Group, Contribution, GroupMemberRow, FounderRef } from '@/types';

// ── Fee config ──
export async function getFeeConfig(): Promise<FeeConfig | null> {
  const { data } = await supabase
    .from('fee_config')
    .select('*')
    .eq('is_active_row', true)
    .maybeSingle();
  if (!data) return null;
  return {
    topUpFeePct: Number(data.top_up_fee_pct),
    topUpFeeFlat: Number(data.top_up_fee_flat),
    contributionFeePct: Number(data.contribution_fee_pct),
    contributionFeeFlat: Number(data.contribution_fee_flat),
    walletTransferFeePct: Number(data.wallet_transfer_fee_pct),
    walletTransferFeeFlat: Number(data.wallet_transfer_fee_flat),
  };
}

export async function updateFeeConfig(cfg: FeeConfig, userId: string): Promise<void> {
  const { error } = await supabase
    .from('fee_config')
    .update({
      top_up_fee_pct: cfg.topUpFeePct,
      top_up_fee_flat: cfg.topUpFeeFlat,
      contribution_fee_pct: cfg.contributionFeePct,
      contribution_fee_flat: cfg.contributionFeeFlat,
      wallet_transfer_fee_pct: cfg.walletTransferFeePct,
      wallet_transfer_fee_flat: cfg.walletTransferFeeFlat,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('is_active_row', true);
  if (error) throw error;
}

// ── Lookup group by wallet number ──
export async function lookupGroupByWalletNumber(walletNumber: string): Promise<{
  group: Group | null;
  error: string | null;
}> {
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, owner_id')
    .eq('wallet_number', walletNumber)
    .eq('owner_type', 'group')
    .maybeSingle();

  if (!wallet) {
    return { group: null, error: 'No group found with this wallet number.' };
  }

  const { data: grp } = await supabase
    .from('groups')
    .select('*')
    .eq('id', wallet.owner_id)
    .maybeSingle();

  if (!grp) {
    return { group: null, error: 'Group not found.' };
  }

  const { data: founders } = await supabase
    .from('group_founders')
    .select('full_name, national_id, phone, otp_verified')
    .eq('group_id', grp.id);

  const founderRefs: FounderRef[] = (founders ?? []).map((f) => ({
    fullName: f.full_name,
    nationalId: f.national_id || '••••••••',
    phone: f.phone,
    verified: f.otp_verified,
  }));

  const group: Group = {
    id: grp.id,
    groupId: grp.group_id,
    name: grp.name,
    description: grp.description || '',
    category: grp.category,
    purpose: grp.purpose || '',
    location: grp.location || '',
    logoColor: grp.logo_color,
    status: grp.status,
    createdAt: grp.created_at,
    totalContributions: grp.total_contributions,
    contributorCount: grp.contributor_count,
    registeredMembers: grp.registered_members,
    nonRegisteredContributors: grp.non_registered_contributors,
    contributionsThisMonth: grp.contributions_this_month,
    transactionCount: grp.transaction_count,
    walletNumber: walletNumber,
    founders: founderRefs,
    myRole: null,
    myTotalContributed: 0,
  };

  return { group, error: null };
}

// ── Set PIN ──
export async function setPin(pin: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  // Simple hash for demo (in production this would be bcrypt on server)
  const pinHash = btoa(`umoja-pin:${pin}:${user.id}`);

  const { error } = await supabase
    .from('profiles')
    .update({ pin_hash: pinHash, pin_set_at: new Date().toISOString() })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

export async function verifyPin(pin: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: prof } = await supabase
    .from('profiles')
    .select('pin_hash')
    .eq('id', user.id)
    .maybeSingle();

  if (!prof?.pin_hash) return false;
  return prof.pin_hash === btoa(`umoja-pin:${pin}:${user.id}`);
}

// ── Simulated M-PESA STK Push for wallet top-up ──
export async function topUpWallet(
  amount: number,
  phone: string,
  fee: number,
): Promise<{ error: string | null; transactionId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.', transactionId: null };

  // Get personal wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, wallet_number')
    .eq('owner_type', 'personal')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!wallet) return { error: 'Wallet not found.', transactionId: null };

  // Generate transaction ID
  const { data: txIdData } = await supabase.rpc('generate_transaction_id');
  const txId = txIdData as string;

  const paymentRef = `MPESA${Math.floor(Math.random() * 900000 + 100000)}`;

  // Create transaction record
  const { error: txError } = await supabase.from('transactions').insert({
    transaction_id: txId,
    from_wallet_id: null,
    to_wallet_id: wallet.id,
    from_owner_id: null,
    to_owner_id: user.id,
    amount,
    fee,
    total_amount: amount + fee,
    type: 'top_up',
    payment_method: 'm_pesa',
    payment_reference: paymentRef,
    status: 'successful',
    description: `M-Pesa top-up to wallet ${wallet.wallet_number}`,
    contributor_profile_id: user.id,
  });

  if (txError) return { error: txError.message, transactionId: null };

  // Update wallet balance
  const { error: balError } = await supabase.rpc('increment_wallet_balance', {
    p_wallet_id: wallet.id,
    p_amount: amount,
  });
  if (balError) return { error: balError.message, transactionId: null };

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    kind: 'top_up_successful',
    title: 'Wallet topped up',
    body: `KES ${amount.toLocaleString()} added to your wallet via M-Pesa. ${fee > 0 ? `Fee: KES ${fee.toLocaleString()}.` : ''}`,
    read: false,
  });

  return { error: null, transactionId: txId };
}

// ── Contribute to a group ──
export async function contributeToGroup(
  groupWalletNumber: string,
  amount: number,
  pin: string,
  fee: number,
): Promise<{ error: string | null; transactionId: string | null; groupName: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.', transactionId: null, groupName: null };

  // Verify PIN
  const pinValid = await verifyPin(pin);
  if (!pinValid) return { error: 'Invalid PIN. Please try again.', transactionId: null, groupName: null };

  // Get personal wallet
  const { data: myWallet } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('owner_type', 'personal')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!myWallet) return { error: 'Your wallet not found.', transactionId: null, groupName: null };

  const totalDeduct = amount + fee;
  if (myWallet.balance < totalDeduct) {
    return { error: `Insufficient balance. You need KES ${totalDeduct.toLocaleString()} (KES ${amount.toLocaleString()} + KES ${fee.toLocaleString()} fee).`, transactionId: null, groupName: null };
  }

  // Get group wallet
  const { data: groupWallet } = await supabase
    .from('wallets')
    .select('id, owner_id')
    .eq('wallet_number', groupWalletNumber)
    .eq('owner_type', 'group')
    .maybeSingle();

  if (!groupWallet) return { error: 'Group wallet not found.', transactionId: null, groupName: null };

  // Get group details
  const { data: grp } = await supabase
    .from('groups')
    .select('id, name, group_id, logo_color, total_contributions, contributor_count, transaction_count')
    .eq('id', groupWallet.owner_id)
    .maybeSingle();

  if (!grp) return { error: 'Group not found.', transactionId: null, groupName: null };

  // Get profile for contributor info
  const { data: prof } = await supabase
    .from('profiles')
    .select('umoja_id, full_name, phone, total_contributed, contribution_count')
    .eq('id', user.id)
    .maybeSingle();

  if (!prof) return { error: 'Profile not found.', transactionId: null, groupName: null };

  // Generate transaction ID
  const { data: txIdData } = await supabase.rpc('generate_transaction_id');
  const txId = txIdData as string;

  const paymentRef = `WTR${Math.floor(Math.random() * 900000 + 100000)}`;

  // Create transaction
  const { error: txError } = await supabase.from('transactions').insert({
    transaction_id: txId,
    from_wallet_id: myWallet.id,
    to_wallet_id: groupWallet.id,
    from_owner_id: user.id,
    to_owner_id: groupWallet.owner_id,
    amount,
    fee,
    total_amount: totalDeduct,
    type: 'contribution',
    payment_method: 'm_pesa',
    payment_reference: paymentRef,
    status: 'successful',
    description: `Contribution to ${grp.name}`,
    group_id: grp.id,
    contributor_profile_id: user.id,
    contributor_name: prof.full_name,
    contributor_phone: prof.phone,
    contributor_kind: 'registered',
    umoja_id: prof.umoja_id,
  });

  if (txError) return { error: txError.message, transactionId: null, groupName: null };

  // Deduct from personal wallet
  await supabase.rpc('decrement_wallet_balance', { p_wallet_id: myWallet.id, p_amount: totalDeduct });

  // Add to group wallet
  await supabase.rpc('increment_wallet_balance', { p_wallet_id: groupWallet.id, p_amount: amount });

  // Update group stats
  await supabase
    .from('groups')
    .update({
      total_contributions: grp.total_contributions + amount,
      transaction_count: grp.transaction_count + 1,
    })
    .eq('id', grp.id);

  // Update profile stats
  await supabase
    .from('profiles')
    .update({
      total_contributed: prof.total_contributed + amount,
      contribution_count: prof.contribution_count + 1,
      last_contribution_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  // Update group_member total if member
  const { data: gm } = await supabase
    .from('group_members')
    .select('id, total_contributed')
    .eq('group_id', grp.id)
    .eq('profile_id', user.id)
    .maybeSingle();

  if (gm) {
    await supabase
      .from('group_members')
      .update({ total_contributed: gm.total_contributed + amount })
      .eq('id', gm.id);
  } else {
    // Auto-join as member if not already
    await supabase.from('group_members').insert({
      group_id: grp.id,
      profile_id: user.id,
      role: 'member',
      status: 'active',
      total_contributed: amount,
    });
  }

  // Notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    kind: 'contribution_successful',
    title: 'Contribution successful',
    body: `KES ${amount.toLocaleString()} contributed to ${grp.name}. ${fee > 0 ? `Fee: KES ${fee.toLocaleString()}.` : ''}`,
    read: false,
    group_id: grp.id,
    group_name: grp.name,
  });

  return { error: null, transactionId: txId, groupName: grp.name };
}

// ── Fetch user's groups ──
export async function fetchMyGroups(userId: string): Promise<Group[]> {
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role, total_contributed')
    .eq('profile_id', userId)
    .eq('status', 'active');

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (!groups) return [];

  // Fetch founders for each group
  const { data: allFounders } = await supabase
    .from('group_founders')
    .select('group_id, full_name, national_id, phone, otp_verified')
    .in('group_id', groupIds);

  // Fetch group wallet numbers
  const { data: groupWallets } = await supabase
    .from('wallets')
    .select('owner_id, wallet_number')
    .eq('owner_type', 'group')
    .in('owner_id', groupIds);

  const walletMap = new Map((groupWallets ?? []).map((w) => [w.owner_id, w.wallet_number]));
  const foundersMap = new Map<string, FounderRef[]>();
  (allFounders ?? []).forEach((f) => {
    const arr = foundersMap.get(f.group_id) ?? [];
    arr.push({
      fullName: f.full_name,
      nationalId: f.national_id || '••••••••',
      phone: f.phone,
      verified: f.otp_verified,
    });
    foundersMap.set(f.group_id, arr);
  });

  return groups.map((g) => ({
    id: g.id,
    groupId: g.group_id,
    name: g.name,
    description: g.description || '',
    category: g.category,
    purpose: g.purpose || '',
    location: g.location || '',
    logoColor: g.logo_color,
    status: g.status,
    createdAt: g.created_at,
    totalContributions: g.total_contributions,
    contributorCount: g.contributor_count,
    registeredMembers: g.registered_members,
    nonRegisteredContributors: g.non_registered_contributors,
    contributionsThisMonth: g.contributions_this_month,
    transactionCount: g.transaction_count,
    walletNumber: walletMap.get(g.id),
    founders: foundersMap.get(g.id) ?? [],
    myRole: (memberships.find((m) => m.group_id === g.id)?.role ?? null) as Group['myRole'],
    myTotalContributed: memberships.find((m) => m.group_id === g.id)?.total_contributed ?? 0,
  }));
}

// ── Fetch user's transactions ──
export async function fetchMyTransactions(userId: string): Promise<Contribution[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .or(`from_owner_id.eq.${userId},contributor_profile_id.eq.${userId},to_owner_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  // Fetch group names
  const groupIds = [...new Set(data.map((t) => t.group_id).filter(Boolean))];
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, logo_color')
    .in('id', groupIds);

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  return data.map((t) => {
    const grp = t.group_id ? groupMap.get(t.group_id) : null;
    return {
      id: t.id,
      transactionId: t.transaction_id,
      groupId: t.group_id || '',
      groupName: grp?.name || (t.type === 'top_up' ? 'Wallet Top-up' : 'Transfer'),
      groupLogoColor: grp?.logo_color || 'bg-brand-500',
      contributorId: t.contributor_profile_id,
      contributorName: t.contributor_name || '',
      contributorPhone: t.contributor_phone || '',
      contributorKind: t.contributor_kind,
      umojaId: t.umoja_id,
      paymentReference: t.payment_reference || '',
      amount: t.amount,
      fee: t.fee,
      paymentMethod: t.payment_method,
      type: t.type,
      status: t.status,
      createdAt: t.created_at,
    };
  });
}

// ── Fetch group members ──
export async function fetchGroupMembers(groupId: string): Promise<GroupMemberRow[]> {
  const { data: members } = await supabase
    .from('group_members')
    .select('id, profile_id, role, status, total_contributed, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (!members?.length) return [];

  const profileIds = members.map((m) => m.profile_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, umoja_id, full_name, phone, email, avatar_color')
    .in('id', profileIds);

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return members.map((m) => {
    const p = profMap.get(m.profile_id);
    return {
      id: m.id,
      profileId: m.profile_id,
      fullName: p?.full_name || 'Unknown',
      umojaId: p?.umoja_id || '',
      phone: p?.phone || '',
      email: p?.email || '',
      avatarColor: p?.avatar_color || 'bg-ink-400',
      role: m.role as GroupMemberRow['role'],
      status: m.status as GroupMemberRow['status'],
      totalContributed: m.total_contributed,
      joinedAt: m.joined_at,
    };
  });
}

// ── Fetch group transactions ──
export async function fetchGroupTransactions(groupId: string): Promise<Contribution[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return [];

  const { data: grp } = await supabase
    .from('groups')
    .select('name, logo_color')
    .eq('id', groupId)
    .maybeSingle();

  return data.map((t) => ({
    id: t.id,
    transactionId: t.transaction_id,
    groupId: groupId,
    groupName: grp?.name || '',
    groupLogoColor: grp?.logo_color || 'bg-brand-500',
    contributorId: t.contributor_profile_id,
    contributorName: t.contributor_name || '',
    contributorPhone: t.contributor_phone || '',
    contributorKind: t.contributor_kind,
    umojaId: t.umoja_id,
    paymentReference: t.payment_reference || '',
    amount: t.amount,
    fee: t.fee,
    paymentMethod: t.payment_method,
    type: t.type,
    status: t.status,
    createdAt: t.created_at,
  }));
}

// ── Fetch notifications ──
export async function fetchNotifications(userId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []).map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    createdAt: n.created_at,
    read: n.read,
    groupId: n.group_id,
    groupName: n.group_name,
  }));
}

// ── Mark notification as read ──
export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

// ── Mark all notifications as read ──
export async function markAllNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

// ── Create a group ──
export async function createGroup(
  userId: string,
  name: string,
  description: string,
  category: string,
  purpose: string,
  location: string,
  founders: { fullName: string; nationalId: string; phone: string }[],
): Promise<{ error: string | null; groupId: string | null }> {
  // Generate group ID
  const { data: groupIdData } = await supabase.rpc('generate_group_id');
  const groupId = groupIdData as string;

  // Generate group wallet number
  const { data: walletNumData } = await supabase.rpc('generate_wallet_number', { p_type: 'group' });
  const walletNumber = walletNumData as string;

  // Create group
  const { data: grp, error: grpError } = await supabase.from('groups').insert({
    group_id: groupId,
    name,
    description,
    category,
    purpose,
    location,
    logo_color: 'bg-brand-500',
    status: 'pending_verification',
    created_by: userId,
  }).select('id').single();

  if (grpError || !grp) return { error: grpError?.message ?? 'Failed to create group', groupId: null };

  // Create group wallet
  await supabase.from('wallets').insert({
    wallet_number: walletNumber,
    owner_type: 'group',
    owner_id: grp.id,
    balance: 0,
  });

  // Create founders
  const founderInserts = founders.map((f, idx) => ({
    group_id: grp.id,
    profile_id: idx === 0 ? userId : null,
    full_name: f.fullName,
    national_id: f.nationalId,
    phone: f.phone,
    otp_verified: idx === 0,
    otp_sent: false,
  }));

  await supabase.from('group_founders').insert(founderInserts);

  // Add creator as group_admin member
  await supabase.from('group_members').insert({
    group_id: grp.id,
    profile_id: userId,
    role: 'group_admin',
    status: 'active',
    total_contributed: 0,
  });

  return { error: null, groupId: grp.id };
}

// ── Admin: fetch all groups ──
export async function fetchAllGroups(): Promise<Group[]> {
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (!groups) return [];

  const groupIds = groups.map((g) => g.id);
  const { data: groupWallets } = await supabase
    .from('wallets')
    .select('owner_id, wallet_number')
    .eq('owner_type', 'group')
    .in('owner_id', groupIds);

  const walletMap = new Map((groupWallets ?? []).map((w) => [w.owner_id, w.wallet_number]));

  return groups.map((g) => ({
    id: g.id, groupId: g.group_id, name: g.name, description: g.description || '',
    category: g.category, purpose: g.purpose || '', location: g.location || '',
    logoColor: g.logo_color, status: g.status, createdAt: g.created_at,
    totalContributions: g.total_contributions, contributorCount: g.contributor_count,
    registeredMembers: g.registered_members, nonRegisteredContributors: g.non_registered_contributors,
    contributionsThisMonth: g.contributions_this_month, transactionCount: g.transaction_count,
    walletNumber: walletMap.get(g.id), founders: [], myRole: null, myTotalContributed: 0,
  }));
}

// ── Admin: fetch all profiles ──
export async function fetchAllProfiles(): Promise<Array<{ id: string; umojaId: string; fullName: string; phone: string; email: string; avatarColor: string; status: string; totalContributed: number; contributionCount: number; groupsJoined: number; registeredAt: string }>> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (data ?? []).map((p) => ({
    id: p.id, umojaId: p.umoja_id, fullName: p.full_name, phone: p.phone,
    email: p.email, avatarColor: p.avatar_color, status: p.status,
    totalContributed: p.total_contributed, contributionCount: p.contribution_count,
    groupsJoined: p.groups_joined, registeredAt: p.created_at,
  }));
}

// ── Admin: fetch all transactions ──
export async function fetchAllTransactions(limit = 100): Promise<Contribution[]> {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!data) return [];

  const groupIds = [...new Set(data.map((t) => t.group_id).filter(Boolean))];
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, logo_color')
    .in('id', groupIds);

  const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));

  return data.map((t) => {
    const grp = t.group_id ? groupMap.get(t.group_id) : null;
    return {
      id: t.id, transactionId: t.transaction_id, groupId: t.group_id || '',
      groupName: grp?.name || (t.type === 'top_up' ? 'Wallet Top-up' : 'Transfer'),
      groupLogoColor: grp?.logo_color || 'bg-brand-500',
      contributorId: t.contributor_profile_id, contributorName: t.contributor_name || '',
      contributorPhone: t.contributor_phone || '', contributorKind: t.contributor_kind,
      umojaId: t.umoja_id, paymentReference: t.payment_reference || '',
      amount: t.amount, fee: t.fee, paymentMethod: t.payment_method,
      type: t.type, status: t.status, createdAt: t.created_at,
    };
  });
}

// ── Fetch audit log ──
export async function fetchAuditLog(limit = 50): Promise<Array<{ id: string; actor: string; action: string; object: string; createdAt: string; result: string }>> {
  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((a) => ({
    id: a.id, actor: a.actor_id || 'System', action: a.action,
    object: a.object_ref || '', createdAt: a.created_at, result: a.result || 'success',
  }));
}

// ── Search members and groups ──
export async function searchAll(query: string): Promise<{ groups: Group[]; profiles: Array<{ id: string; umojaId: string; fullName: string; phone: string; avatarColor: string; totalContributed: number }> }> {
  const q = `%${query}%`;
  const [groupsResult, profilesResult] = await Promise.all([
    supabase.from('groups').select('*').or(`name.ilike.${q},group_id.ilike.${q},category.ilike.${q}`).limit(10),
    supabase.from('profiles').select('id, umoja_id, full_name, phone, avatar_color, total_contributed').or(`full_name.ilike.${q},umoja_id.ilike.${q},phone.ilike.${q},email.ilike.${q}`).limit(10),
  ]);

  const groups: Group[] = (groupsResult.data ?? []).map((g) => ({
    id: g.id, groupId: g.group_id, name: g.name, description: g.description || '',
    category: g.category, purpose: g.purpose || '', location: g.location || '',
    logoColor: g.logo_color, status: g.status, createdAt: g.created_at,
    totalContributions: g.total_contributions, contributorCount: g.contributor_count,
    registeredMembers: g.registered_members, nonRegisteredContributors: g.non_registered_contributors,
    contributionsThisMonth: g.contributions_this_month, transactionCount: g.transaction_count,
    founders: [], myRole: null, myTotalContributed: 0,
  }));

  const profiles = (profilesResult.data ?? []).map((p) => ({
    id: p.id, umojaId: p.umoja_id, fullName: p.full_name, phone: p.phone,
    avatarColor: p.avatar_color, totalContributed: p.total_contributed,
  }));

  return { groups, profiles };
}
