/*
# Fix missing INSERT policies on profiles and wallets

## Problem
The `profiles` and `wallets` tables had RLS enabled but no INSERT policy.
This meant any client-side insert attempt would fail with a row-level security error.
The database trigger `handle_new_user()` runs as SECURITY DEFINER so it bypasses RLS,
but having no INSERT policy is still a gap — the app cannot create profiles or wallets
from the frontend if ever needed.

## Changes
1. Add INSERT policy on `profiles` — allows a user to insert only their own profile row.
2. Add INSERT policy on `wallets` — allows a user to insert only their own personal wallet.

## Security
- profiles INSERT: `WITH CHECK (auth.uid() = id)` — a user can only create their own profile.
- wallets INSERT: `WITH CHECK (owner_type = 'personal' AND owner_id = auth.uid())` — a user can only create their own personal wallet, not group wallets.
*/

-- profiles INSERT policy
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- wallets INSERT policy
DROP POLICY IF EXISTS "insert_own_wallet" ON wallets;
CREATE POLICY "insert_own_wallet" ON wallets FOR INSERT
  TO authenticated WITH CHECK (owner_type = 'personal' AND owner_id = auth.uid());
