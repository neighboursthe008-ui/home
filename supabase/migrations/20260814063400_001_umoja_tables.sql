/*
# UMOJA Core Schema — Part 1: Tables (no cross-table policies yet)

Creates all tables first so that Part 2 can add cross-referencing policies safely.
*/

-- ── Profiles ──
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  umoja_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  avatar_color text NOT NULL DEFAULT 'bg-brand-500',
  pin_hash text,
  pin_set_at timestamptz,
  phone_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','removed')),
  total_contributed bigint NOT NULL DEFAULT 0,
  contribution_count int NOT NULL DEFAULT 0,
  last_contribution_at timestamptz,
  groups_joined int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ── Groups ──
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Welfare',
  purpose text,
  location text,
  logo_color text NOT NULL DEFAULT 'bg-brand-500',
  status text NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('active','pending_verification','suspended','closed')),
  total_contributions bigint NOT NULL DEFAULT 0,
  contributor_count int NOT NULL DEFAULT 0,
  registered_members int NOT NULL DEFAULT 0,
  non_registered_contributors int NOT NULL DEFAULT 0,
  contributions_this_month bigint NOT NULL DEFAULT 0,
  transaction_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ── Group Founders ──
CREATE TABLE IF NOT EXISTS group_founders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  national_id text,
  phone text NOT NULL,
  otp_verified boolean NOT NULL DEFAULT false,
  otp_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_founders_group ON group_founders(group_id);
ALTER TABLE group_founders ENABLE ROW LEVEL SECURITY;

-- ── Group Members ──
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','group_admin','treasurer','secretary','member','viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended','removed')),
  total_contributed bigint NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gm_group_profile ON group_members(group_id, profile_id);
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ── Wallets ──
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_number text UNIQUE NOT NULL,
  owner_type text NOT NULL CHECK (owner_type IN ('personal','group')),
  owner_id uuid NOT NULL,
  balance bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_number ON wallets(wallet_number);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- ── Transactions ──
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,
  from_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  to_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  from_owner_id uuid,
  to_owner_id uuid,
  amount bigint NOT NULL CHECK (amount > 0),
  fee bigint NOT NULL DEFAULT 0,
  total_amount bigint NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('contribution','top_up','wallet_transfer')),
  payment_method text NOT NULL DEFAULT 'm_pesa' CHECK (payment_method IN ('m_pesa','bank','card','other')),
  payment_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('successful','pending','failed','reversed','duplicate','cancelled')),
  description text,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  contributor_profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_name text,
  contributor_phone text,
  contributor_kind text NOT NULL DEFAULT 'registered' CHECK (contributor_kind IN ('registered','non_registered')),
  umoja_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tx_from ON transactions(from_owner_id);
CREATE INDEX IF NOT EXISTS idx_tx_to ON transactions(to_owner_id);
CREATE INDEX IF NOT EXISTS idx_tx_group ON transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ── Fee Configuration (singleton) ──
CREATE TABLE IF NOT EXISTS fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active_row boolean NOT NULL DEFAULT true UNIQUE,
  top_up_fee_pct numeric NOT NULL DEFAULT 0 CHECK (top_up_fee_pct >= 0 AND top_up_fee_pct <= 100),
  top_up_fee_flat bigint NOT NULL DEFAULT 0 CHECK (top_up_fee_flat >= 0),
  contribution_fee_pct numeric NOT NULL DEFAULT 0 CHECK (contribution_fee_pct >= 0 AND contribution_fee_pct <= 100),
  contribution_fee_flat bigint NOT NULL DEFAULT 5 CHECK (contribution_fee_flat >= 0),
  wallet_transfer_fee_pct numeric NOT NULL DEFAULT 0 CHECK (wallet_transfer_fee_pct >= 0 AND wallet_transfer_fee_pct <= 100),
  wallet_transfer_fee_flat bigint NOT NULL DEFAULT 10 CHECK (wallet_transfer_fee_flat >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;

INSERT INTO fee_config (is_active_row, top_up_fee_pct, top_up_fee_flat, contribution_fee_pct, contribution_fee_flat, wallet_transfer_fee_pct, wallet_transfer_fee_flat)
VALUES (true, 0, 0, 0, 5, 0, 10)
ON CONFLICT (is_active_row) DO NOTHING;

-- ── Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  group_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── Audit Log ──
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  object text,
  ip text,
  result text NOT NULL DEFAULT 'success' CHECK (result IN ('success','failure')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── Helper functions ──
CREATE OR REPLACE FUNCTION generate_wallet_number(p_type text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE prefix text; result text;
BEGIN
  prefix := CASE WHEN p_type = 'personal' THEN '100' ELSE '200' END;
  LOOP
    result := prefix || lpad(floor(random() * 9000000 + 1000000)::int::text, 9, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM wallets WHERE wallet_number = result);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION generate_umoja_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result text;
BEGIN
  LOOP
    result := 'UMJ-' || lpad(floor(random() * 9000000 + 1000000)::int::text, 7, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE umoja_id = result);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION generate_group_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result text;
BEGIN
  LOOP
    result := 'GRP-' || lpad(floor(random() * 9000000 + 1000000)::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM groups WHERE group_id = result);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION generate_transaction_id()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result text;
BEGIN
  LOOP
    result := 'TRX-' || lpad(floor(random() * 9000000 + 1000000)::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM transactions WHERE transaction_id = result);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Auto-create profile + wallet on signup ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_umoja_id text; new_wallet_number text;
BEGIN
  new_umoja_id := generate_umoja_id();
  new_wallet_number := generate_wallet_number('personal');
  INSERT INTO profiles (id, umoja_id, full_name, phone, email)
  VALUES (NEW.id, new_umoja_id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Member'), COALESCE(NEW.raw_user_meta_data->>'phone', ''), NEW.email);
  INSERT INTO wallets (wallet_number, owner_type, owner_id, balance)
  VALUES (new_wallet_number, 'personal', NEW.id, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
