/*
# UMOJA Core Schema — Part 2: RLS Policies

All tables now exist (created in Part 1). This migration adds all row-level security policies,
including cross-table references (e.g. groups UPDATE policy checks group_founders).
*/

-- ── Profiles policies ──
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── Groups policies ──
DROP POLICY IF EXISTS "select_all_groups" ON groups;
CREATE POLICY "select_all_groups" ON groups FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_group" ON groups;
CREATE POLICY "insert_own_group" ON groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_own_group" ON groups;
CREATE POLICY "update_own_group" ON groups FOR UPDATE
  TO authenticated USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM group_founders gf WHERE gf.group_id = groups.id AND gf.profile_id = auth.uid()
    )
  ) WITH CHECK (true);

-- ── Group Founders policies ──
DROP POLICY IF EXISTS "select_all_founders" ON group_founders;
CREATE POLICY "select_all_founders" ON group_founders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_founders" ON group_founders;
CREATE POLICY "insert_own_founders" ON group_founders FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_founders.group_id AND groups.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_founders" ON group_founders;
CREATE POLICY "update_own_founders" ON group_founders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── Group Members policies ──
DROP POLICY IF EXISTS "select_all_members" ON group_members;
CREATE POLICY "select_all_members" ON group_members FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_membership" ON group_members;
CREATE POLICY "insert_own_membership" ON group_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "update_membership" ON group_members;
CREATE POLICY "update_membership" ON group_members FOR UPDATE
  TO authenticated USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM group_founders gf
      WHERE gf.group_id = group_members.group_id AND gf.profile_id = auth.uid() AND gf.otp_verified = true
    )
  ) WITH CHECK (true);

-- ── Wallets policies ──
DROP POLICY IF EXISTS "select_own_wallet" ON wallets;
CREATE POLICY "select_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (
    (owner_type = 'personal' AND owner_id = auth.uid())
    OR (owner_type = 'group')
  );

-- ── Transactions policies ──
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    from_owner_id = auth.uid()
    OR to_owner_id = auth.uid()
    OR contributor_profile_id = auth.uid()
    OR (
      group_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM group_members gm WHERE gm.group_id = transactions.group_id AND gm.profile_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "insert_transactions" ON transactions;
CREATE POLICY "insert_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (
    from_owner_id = auth.uid() OR contributor_profile_id = auth.uid()
  ) WITH CHECK (true);

-- ── Fee Config policies ──
DROP POLICY IF EXISTS "select_fee_config" ON fee_config;
CREATE POLICY "select_fee_config" ON fee_config FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_fee_config" ON fee_config;
CREATE POLICY "update_fee_config" ON fee_config FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── Notifications policies ──
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── Audit Log policies ──
DROP POLICY IF EXISTS "select_audit_log" ON audit_log;
CREATE POLICY "select_audit_log" ON audit_log FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_audit_log" ON audit_log;
CREATE POLICY "insert_audit_log" ON audit_log FOR INSERT
  TO authenticated WITH CHECK (true);
